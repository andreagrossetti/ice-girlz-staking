// Environment-driven configuration.
// Production (Polygon mainnet) values are the defaults; a staging deployment
// overrides them with NEXT_PUBLIC_* env vars (see .env.example).
// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them.

export type NetworkName = "polygon" | "polygonAmoy";

const network = (process.env.NEXT_PUBLIC_NETWORK || "polygon") as NetworkName;

const NETWORKS = {
  polygon: {
    chainId: 137,
    name: "Polygon",
    infuraSubdomain: "polygon-mainnet",
    explorer: "https://polygonscan.com",
  },
  polygonAmoy: {
    chainId: 80002,
    name: "Polygon Amoy",
    infuraSubdomain: "polygon-amoy",
    explorer: "https://amoy.polygonscan.com",
  },
} as const;

if (!(network in NETWORKS)) {
  throw new Error(`Unsupported NEXT_PUBLIC_NETWORK: ${network}`);
}

export const networkConfig = { key: network, ...NETWORKS[network] };

export const isStaging = network !== "polygon";

/** Configured JSON-RPC endpoint, or undefined if none is set. */
export function getRpcUrlOrUndefined(): string | undefined {
  if (process.env.NEXT_PUBLIC_RPC_URL) return process.env.NEXT_PUBLIC_RPC_URL;
  const key = process.env.NEXT_PUBLIC_INFURA_API_KEY;
  return key ? `https://${networkConfig.infuraSubdomain}.infura.io/v3/${key}` : undefined;
}

/** JSON-RPC endpoint for read-only calls (client and server). */
export function getRpcUrl(): string {
  const url = getRpcUrlOrUndefined();
  if (!url) throw new Error("Set NEXT_PUBLIC_RPC_URL or NEXT_PUBLIC_INFURA_API_KEY");
  return url;
}

export const contractAddresses = {
  iceGirlz: process.env.NEXT_PUBLIC_ICE_GIRLZ_ADDRESS || "0xfCA2390Fc69992468766dB32dFaB50E8279a2AeF",
  frost: process.env.NEXT_PUBLIC_FROST_ADDRESS || "0xEd06Bb12A7BAeF7aa6572535bE7f205872B78531",
  iceFolks: process.env.NEXT_PUBLIC_ICE_FOLKS_ADDRESS || "0xa250B1a79a94689Fa81aBb20b62b74Df569A023B",
  raffles: process.env.NEXT_PUBLIC_RAFFLES_ADDRESS || "0xd49D198f6d448458C1eEc01954a38Fc2165E30cF",
  staking: process.env.NEXT_PUBLIC_STAKING_ADDRESS || "0x6493021A5dC68fC715B9d2dC59207c656fA3397c",
};

/** Public base URL of the raffle images folder in S3 (no trailing slash). */
export const rafflesImageBaseUrl =
  process.env.NEXT_PUBLIC_RAFFLES_IMAGE_BASE_URL ||
  "https://icegirlz.s3.ap-south-1.amazonaws.com/raffles";

export function raffleImageUrl(contractAddress: string, tokenId: number | string) {
  return `${rafflesImageBaseUrl}/${raffleImageName(contractAddress, tokenId)}`;
}

/** Object name inside the raffles/ folder. Always lowercase so upload, display and delete agree. */
export function raffleImageName(contractAddress: string, tokenId: number | string) {
  return `${String(contractAddress).toLowerCase()}-${tokenId}`;
}
