import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  phantomWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { getRpcUrlOrUndefined, networkConfig } from "@/utils/config";

export const activeChain = networkConfig.key === "polygonAmoy" ? polygonAmoy : polygon;

export const wagmiConfig = getDefaultConfig({
  appName: "Ice dApps",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "5d10af3027c340310f3a3da64cbcedac",
  chains: [activeChain],
  transports: { [activeChain.id]: http(getRpcUrlOrUndefined()) },
  wallets: [
    { groupName: "Popular", wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet] },
    { groupName: "Phantom", wallets: [phantomWallet] },
  ],
  ssr: true,
});
