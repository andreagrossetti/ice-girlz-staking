// Prepares a tester/admin wallet on Amoy:
//   node scripts/setup-tester.mjs <address> [--admin]
// Sends 0.2 POL, mints 3 Ice Girlz + 3 Ice Folks + 1000 FROST.
// --admin also transfers ownership of raffles, staking and FROST (the admin UI checks
// the raffles owner and manages staking/FROST); NFT contracts stay with the deployer.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const to = ethers.getAddress(process.argv[2] ?? "");
const makeAdmin = process.argv.includes("--admin");

const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL, 80002, { staticNetwork: true });
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const signer = new ethers.NonceManager(wallet);
const d = JSON.parse(fs.readFileSync(path.join(root, "deployments", "amoy.json"), "utf8")).contracts;
const at = (n) => new ethers.Contract(d[n], JSON.parse(fs.readFileSync(path.join(root, "out", `${n}.json`), "utf8")).abi, signer);
const send = async (label, p) => { await (await p).wait(); console.log("  ✓ " + label); };

const [frost, girlz, folks, staking, raffles] = ["frost", "iceGirlz", "iceFolks", "staking", "raffles"].map(at);

await send("0.2 POL for gas", signer.sendTransaction({ to, value: ethers.parseEther("0.2") }));
await send("3 Ice Girlz", girlz.batchMint(to, 3));
for (let i = 0; i < 3; i++) {
  const id = Number(await folks.totalSupply()) + 1;
  await send(`Ice Folks #${id}`, folks.safeMint(to, `https://azure-able-wasp-305.mypinata.cloud/ipfs/bafybeie5v6zwmhcfopfcru4hivgvehzrtlhir4zidlbt7tjhh5vd22eu4u/${id}.json`));
}
await send("1000 FROST", frost.mint(to, ethers.parseEther("1000")));

if (makeAdmin) {
  await send("raffles: fund receiver", raffles.setFundReceiver(to));
  await send("raffles ownership", raffles.transferOwnership(to));
  await send("staking ownership", staking.transferOwnership(to));
  await send("FROST ownership", frost.transferOwnership(to));
}
console.log(`Done. Deployer POL left: ${ethers.formatEther(await provider.getBalance(wallet.address))}`);
