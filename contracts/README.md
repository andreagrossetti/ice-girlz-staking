# Contracts (staging tooling)

`sources/` holds the **verified production sources**, downloaded from [Sourcify](https://sourcify.dev)
for the Polygon mainnet deployments listed in `verified/*.json` (address, compiler, settings).
They are not edited.

| Name | Contract | Mainnet |
|---|---|---|
| frost | `Frost` (ERC20) | `0xEd06Bb12A7BAeF7aa6572535bE7f205872B78531` |
| iceGirlz | `IceGirlz` (ERC721) | `0xfCA2390Fc69992468766dB32dFaB50E8279a2AeF` |
| iceFolks | `IceFolks` (ERC721) | `0xa250B1a79a94689Fa81aBb20b62b74Df569A023B` |
| staking | `IceyStaking` | `0x6493021A5dC68fC715B9d2dC59207c656fA3397c` |
| raffles | `IceRaffle` | `0xd49D198f6d448458C1eEc01954a38Fc2165E30cF` |

## Compile

`npm run compile` builds each contract with the exact solc version / EVM version / optimizer
settings used on mainnet (Frost output is byte-identical to the mainnet deploy).

The only staging change is applied at compile time (`scripts/compile.mjs`): `IceyStaking` and
`IceRaffle` hardcode the mainnet FROST address in their constructor, so on testnet the FROST
address becomes a constructor argument.

## Deploy to Polygon Amoy

```bash
cd contracts
npm install
cp .env.example .env      # testnet-only DEPLOYER_PRIVATE_KEY, optional TEST_WALLETS
npm run deploy:amoy
```

The script deploys all five contracts, configures them like mainnet (Ice Girlz id 1 at
10 FROST/day, Ice Folks id 2 at 15 FROST/day, staking as FROST minter, raffle fund receiver),
mints test NFTs + 1000 FROST to the deployer and `TEST_WALLETS`, writes
`deployments/amoy.json` and prints the `NEXT_PUBLIC_*` env vars for the staging frontend.
Testnet-only extras: the deployer is also a FROST minter, IceGirlz public mint costs 0.01 POL.

## Local end-to-end test

Against a local hardhat node started with `chainId: 80002`:

```bash
DEPLOYER_PRIVATE_KEY=<hardhat account #0> AMOY_RPC_URL=http://127.0.0.1:8547 \
  TEST_WALLETS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 DEPLOYMENT_NAME=local npm run deploy:amoy
npm run test:local
```

Covers stake / claim / claimAll, raffle create / enter / per-wallet limit / declareWinner, and
reproduces the known `claim()` ownership issue (see below).

## Known issue in production `IceyStaking`

`claim`, `claimAll` and `unstake` don't check `ownerOf(tokenId) == msg.sender`: any wallet can
claim the FROST accrued by someone else's staked NFT. Staking also doesn't lock the NFT, so a
stake survives a transfer/sale.
