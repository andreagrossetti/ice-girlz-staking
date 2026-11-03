# Ice dApps 🧊

A decentralized application platform for staking Ice Girlz and Ice Folks NFTs to earn $FROST tokens.

## Overview

Ice dApps is a Next.js web application that enables NFT holders to stake their Ice Girlz and Ice Folks NFTs to earn $FROST tokens. The platform provides an intuitive interface for users to manage their NFT assets and rewards in one place.

## Features

- **NFT Staking**: Stake your Ice Girlz and Ice Folks NFTs to earn daily $FROST rewards
- **Batch Operations**: Stake all, unstake all, and claim all rewards with a single click
- **Reward Tracking**: View your unclaimed rewards and estimated daily earnings
- **Responsive Design**: Fully functional on both desktop and mobile devices
- **Wallet Integration**: Connect easily with multiple wallet options via RainbowKit

## Technical Stack

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS
- **Blockchain Integration**: ethers.js, Wagmi, RainbowKit
- **Wallet Support**: MetaMask, Coinbase Wallet, WalletConnect, Rainbow, Phantom
- **Network**: Polygon

## Smart Contracts

The dApp interacts with the following smart contracts:

- **Ice Girlz NFT**: `0xfCA2390Fc69992468766dB32dFaB50E8279a2AeF`
- **Ice Folks NFT**: `0xa250B1a79a94689Fa81aBb20b62b74Df569A023B`
- **$FROST Token**: `0xEd06Bb12A7BAeF7aa6572535bE7f205872B78531`
- **Staking Contract**: `0x6493021A5dC68fC715B9d2dC59207c656fA3397c`

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- MetaMask or another supported wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ice-dapps.git
   cd ice-dapps
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Copy `.env.example` to `.env.local` and fill in the values (Infura key or RPC URL, S3 credentials).
   Contract addresses default to the Polygon mainnet production contracts.

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Connect your wallet using the "Connect Wallet" button in the top right corner
2. Navigate between Ice Girlz and Ice Folks collections using the buttons at the top
3. Switch between viewing staked and unstaked NFTs 
4. Stake individual NFTs or use "Stake All" to stake all unstaked NFTs
5. Claim rewards for individual NFTs or use "Claim All" to claim all rewards at once

## Rewards System

- Ice Girlz NFTs earn 10 $FROST per day
- Ice Folks NFTs earn 5 $FROST per day
- Rewards accumulate in real-time and can be claimed at any time

## Project Structure

```
app/                      # Next.js app router
├── collection/           # Collection pages
│   └── [collection]/     # Dynamic collection routes
components/               # React components
├── UI/                   # UI components
├── staking/              # Staking related components
├── walletConnectButton   # Wallet connection button
utils/                    # Utility functions
├── abis/                 # Contract ABIs
├── handlers/             # Contract interaction handlers
├── rainbow/              # RainbowKit configuration
├── mainContext/          # Global context
├── services/             # Helper services
```

## Development

### Adding a New Collection

To add support for a new NFT collection:

1. Add the contract address to `utils/contractAdds.js`
2. Add the contract ABI to `utils/abis/`
3. Update the collection data in `components/staking/stakeHolder.tsx`

### Customizing Rewards

To modify the reward rates:
1. Update the `rewards` property in the `collectionData` object in `components/staking/stakeHolder.tsx`

## Deployment

The project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Create a new project in Vercel
3. Connect to your GitHub repository
4. Configure environment variables
5. Deploy

### Staging

The same code runs against a testnet by changing env vars only (all `NEXT_PUBLIC_*` vars are inlined at build time, so a staging deploy needs its own build — e.g. a Vercel "Preview"/staging environment):

- `NEXT_PUBLIC_NETWORK=polygonAmoy`
- `NEXT_PUBLIC_RPC_URL` (or `NEXT_PUBLIC_INFURA_API_KEY`)
- `NEXT_PUBLIC_*_ADDRESS` for the five testnet contracts
- a separate S3 bucket (`AWS_S3_BUCKET_NAME`, `NEXT_PUBLIC_RAFFLES_IMAGE_BASE_URL`)

### Admin API

`/api/uploadToS3` and `/api/deleteFromS3` require a wallet signature from the raffles contract `owner()`
(message built in `utils/adminAuth.ts`, valid for 5 minutes, bound to action and image name).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [RainbowKit](https://www.rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Ethers.js](https://docs.ethers.org/)