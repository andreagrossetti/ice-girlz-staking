// End-to-end check of the contract flows on a LOCAL hardhat node (chainId 80002),
// after `DEPLOYMENT_NAME=local npm run deploy:amoy` against it.
// Uses hardhat's default dev accounts and evm_increaseTime, so it never runs on a real network.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { ethers } from "ethers";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rpc = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8547";
const provider = new ethers.JsonRpcProvider(rpc);
if ((await provider.send("web3_clientVersion", [])).toLowerCase().indexOf("hardhat") < 0) {
  throw new Error("e2e-local only runs against a local hardhat node");
}

// hardhat default accounts #0 (admin/deployer), #1 (tester, seeded), #2 (attacker, not seeded)
const keys = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
];
const [admin, tester, attacker] = keys.map((k) => new ethers.NonceManager(new ethers.Wallet(k, provider)));
const addr = (s) => s.getAddress();

const dep = JSON.parse(fs.readFileSync(path.join(root, "deployments", "local.json"), "utf8")).contracts;
const at = (name, runner) => new ethers.Contract(dep[name], JSON.parse(fs.readFileSync(path.join(root, "out", `${name}.json`))).abi, runner);
const day = async (n = 1) => { await provider.send("evm_increaseTime", [86400 * n]); await provider.send("evm_mine", []); };
const ok = (m) => console.log("  ✓ " + m);
const fmt = (v) => ethers.formatEther(v);

const frost = at("frost", tester), girlz = at("iceGirlz", tester), staking = at("staking", tester);

console.log("Staking");
const mine = await girlz.walletOfOwner(await addr(tester));
assert.ok(mine.length > 0, "tester owns Ice Girlz");
const tokenId = mine[0];
await (await staking.stake(tokenId, 1)).wait();
const view = await staking.getUsersNFT(1, await addr(tester));
assert.equal(view.staked.filter((n) => n.tokenId === tokenId).length, 1);
ok(`stake Ice Girlz #${tokenId}, visible in getUsersNFT().staked`);

await day(1);
const pending = await staking.rewardCalculation(1, tokenId);
assert.ok(pending >= ethers.parseEther("10") && pending < ethers.parseEther("10.01"), `~10 FROST after 1 day, got ${fmt(pending)}`);
ok(`after 1 day: ${fmt(pending)} FROST pending (10/day)`);

const before = await frost.balanceOf(await addr(tester));
await (await staking.claim(tokenId, 1)).wait();
const gained = (await frost.balanceOf(await addr(tester))) - before;
assert.ok(gained >= ethers.parseEther("10"));
ok(`claim -> +${fmt(gained)} FROST minted by staking contract`);

await (await staking.stake(mine[1], 1)).wait();
await day(2);
await (await staking.claimAll([tokenId, mine[1]], 1)).wait();
ok("batch: stake second NFT, claimAll after 2 days");

console.log("\nKnown issue check: claim() has no ownership check");
await day(1);
const atkBefore = await frost.balanceOf(await addr(attacker));
let stolen = 0n;
try {
  await (await staking.connect(attacker).claim(tokenId, 1)).wait();
  stolen = (await frost.balanceOf(await addr(attacker))) - atkBefore;
} catch {}
console.log(stolen > 0n
  ? `  ✗ VULNERABLE: a wallet that owns no NFT claimed ${fmt(stolen)} FROST of the tester's staked NFT`
  : "  ✓ attacker could not claim");

console.log("\nRaffles");
const raffles = at("raffles", admin);
const adminGirlz = at("iceGirlz", admin);
const prizeId = (await adminGirlz.walletOfOwner(await addr(admin)))[0];
const endTime = (await provider.getBlock("latest")).timestamp + 7 * 86400;
// Same sequence as the admin UI: approve prize NFT, then setRaffleItem(activeRaffles, ...)
await (await adminGirlz.approve(dep.raffles, prizeId)).wait();
await (await raffles.setRaffleItem(await raffles.activeRaffles(), dep.iceGirlz, 5, "https://opensea.io/x/1", prizeId, 100, ethers.parseEther("10"), endTime)).wait();
assert.equal(await raffles.activeRaffles(), 1n);
ok(`admin creates raffle for Ice Girlz #${prizeId}, 10 FROST/ticket`);

const testerRaffles = at("raffles", tester);
await (await frost.approve(dep.raffles, ethers.parseEther("30"))).wait();
await (await testerRaffles.enterFrostRaffle(0, 3)).wait();
const tickets = await testerRaffles.getUsersTickets(await addr(tester));
assert.equal(tickets[0].holding, 3n);
ok("tester approves FROST and buys 3 tickets");

await assert.rejects(testerRaffles.enterFrostRaffle(0, 3), "per-wallet limit 5 must be enforced");
ok("per-wallet ticket limit enforced");

await (await raffles.declareWinner(0)).wait();
assert.equal(await girlz.ownerOf(prizeId), await addr(tester));
const ended = await raffles.fetchEndedRaffles();
assert.equal(ended[0].winner, await addr(tester));
ok("declareWinner: prize NFT transferred to the only participant, listed in fetchEndedRaffles");

console.log("\nAll flows OK" + (stolen > 0n ? " (with the known claim() vulnerability reproduced)" : ""));
