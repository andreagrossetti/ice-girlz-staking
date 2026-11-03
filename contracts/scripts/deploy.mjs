// Deploys the full Ice dApps stack to Polygon Amoy and configures it like production.
//
//   cp .env.example .env   # set DEPLOYER_PRIVATE_KEY (+ optional TEST_WALLETS)
//   npm run deploy:amoy
//
// Writes deployments/amoy.json and prints the env vars for the staging frontend.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AMOY_CHAIN_ID = 80002n;

const rpcUrl = process.env.AMOY_RPC_URL || "https://polygon-amoy-bor-rpc.publicnode.com";
if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error("Set DEPLOYER_PRIVATE_KEY in contracts/.env");

const provider = new ethers.JsonRpcProvider(rpcUrl);
const { chainId } = await provider.getNetwork();
if (chainId !== AMOY_CHAIN_ID) throw new Error(`Refusing to deploy: RPC is chain ${chainId}, expected Amoy (80002)`);

const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
// NonceManager: sequential txs without relying on the RPC's (often lagging) pending nonce.
const deployer = new ethers.NonceManager(wallet);
deployer.address = wallet.address;
const testWallets = (process.env.TEST_WALLETS || "")
  .split(",").map((s) => s.trim()).filter(Boolean).map((a) => ethers.getAddress(a));
const recipients = [deployer.address, ...testWallets];
const NFTS_PER_WALLET = Number(process.env.NFTS_PER_WALLET || 3);
const FROST_PER_WALLET = ethers.parseEther(process.env.FROST_PER_WALLET || "1000");

console.log(`Deployer ${deployer.address}, balance ${ethers.formatEther(await provider.getBalance(deployer.address))} POL`);

const ICE_GIRLZ_BASE_URI = "ipfs://bafybeif6e7qb4hzlv7mivtrr2bc5gtcz7gfbetipi2szmfhat3q2rnnxqq/";

const artifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "out", `${name}.json`), "utf8"));

async function deploy(name, ...args) {
  const { abi, bytecode } = artifact(name);
  const contract = await new ethers.ContractFactory(abi, bytecode, deployer).deploy(...args);
  await contract.waitForDeployment();
  console.log(`  ${name.padEnd(9)} ${await contract.getAddress()}`);
  return contract;
}

async function send(label, txPromise) {
  const tx = await txPromise;
  await tx.wait();
  console.log(`  ✓ ${label}`);
}

console.log("\nDeploying contracts");
const frost = await deploy("frost");
const iceGirlz = await deploy("iceGirlz", "IceGirlz", "ICEGIRLZ", deployer.address, deployer.address);
const iceFolks = await deploy("iceFolks", deployer.address);
const staking = await deploy("staking", await frost.getAddress());
const raffles = await deploy("raffles", deployer.address, await frost.getAddress());

console.log("\nConfiguring (same values as mainnet)");
await send("staking: Ice Girlz = id 1, 10 FROST/day", staking.setContract(1, await iceGirlz.getAddress(), ethers.parseEther("10")));
await send("staking: Ice Folks = id 2, 15 FROST/day", staking.setContract(2, await iceFolks.getAddress(), ethers.parseEther("15")));
await send("frost: staking contract can mint", frost.addMinter(await staking.getAddress()));
await send("raffles: fund receiver = deployer", raffles.setFundReceiver(deployer.address));
// Mainnet owner updated baseURI after deploy; use the current production metadata.
await send("iceGirlz: baseURI = current mainnet metadata", iceGirlz.setBaseURI(ICE_GIRLZ_BASE_URI));
await send("iceGirlz: unpause public mint", iceGirlz.unpause());
await send("iceGirlz: mint cost 0.01 POL (testnet)", iceGirlz.setCost(ethers.parseEther("0.01")));

console.log(`\nSeeding test wallets: ${recipients.join(", ")}`);
// Testnet only: deployer is also a FROST minter, so testers can buy raffle tickets right away.
await send("frost: deployer can mint (testnet only)", frost.addMinter(deployer.address));
let folkId = 0;
for (const to of recipients) {
  await send(`${NFTS_PER_WALLET} Ice Girlz -> ${to}`, iceGirlz.batchMint(to, NFTS_PER_WALLET));
  for (let i = 0; i < NFTS_PER_WALLET; i++) {
    folkId++;
    await send(
      `Ice Folks #${folkId} -> ${to}`,
      iceFolks.safeMint(to, `https://azure-able-wasp-305.mypinata.cloud/ipfs/bafybeie5v6zwmhcfopfcru4hivgvehzrtlhir4zidlbt7tjhh5vd22eu4u/${folkId}.json`),
    );
  }
  await send(`${ethers.formatEther(FROST_PER_WALLET)} FROST -> ${to}`, frost.mint(to, FROST_PER_WALLET));
}

const deployment = {
  network: "polygonAmoy",
  chainId: 80002,
  deployedAt: new Date().toISOString(),
  deployer: deployer.address,
  contracts: {
    frost: await frost.getAddress(),
    iceGirlz: await iceGirlz.getAddress(),
    iceFolks: await iceFolks.getAddress(),
    staking: await staking.getAddress(),
    raffles: await raffles.getAddress(),
  },
  testWallets: recipients,
};
fs.mkdirSync(path.join(root, "deployments"), { recursive: true });
const outName = process.env.DEPLOYMENT_NAME || "amoy";
fs.writeFileSync(path.join(root, "deployments", `${outName}.json`), JSON.stringify(deployment, null, 2));

const c = deployment.contracts;
console.log(`
Saved deployments/${outName}.json. Staging frontend env:

NEXT_PUBLIC_NETWORK=polygonAmoy
NEXT_PUBLIC_ICE_GIRLZ_ADDRESS=${c.iceGirlz}
NEXT_PUBLIC_ICE_FOLKS_ADDRESS=${c.iceFolks}
NEXT_PUBLIC_FROST_ADDRESS=${c.frost}
NEXT_PUBLIC_STAKING_ADDRESS=${c.staking}
NEXT_PUBLIC_RAFFLES_ADDRESS=${c.raffles}
`);
