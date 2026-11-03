import { getAccount, getConnectorClient } from "wagmi/actions";
import { ethers } from "ethers";
import type { Account, Chain, Client, Transport } from "viem";
import { getRpcUrlOrUndefined, networkConfig } from "@/utils/config";
import { activeChain, wagmiConfig } from "@/utils/rainbow/wagmiConfig";

// wagmi/viem client -> ethers v5 signer (adapter from the wagmi docs).
function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const provider = new ethers.providers.Web3Provider(transport, {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  });
  return provider.getSigner(account.address);
}

export function getReadProvider() {
  const url = getRpcUrlOrUndefined() ?? activeChain.rpcUrls.default.http[0];
  return new ethers.providers.StaticJsonRpcProvider(url, networkConfig.chainId);
}

/**
 * Signer of the connected wallet (any connector: injected, WalletConnect, Coinbase...).
 * Throws if the wallet is on another chain, so transactions never go to the wrong network.
 * When no wallet is connected, returns a read-only provider (writes will fail).
 */
export async function getSignerOrProvider(): Promise<ethers.Signer | ethers.providers.Provider> {
  if (getAccount(wagmiConfig).status !== "connected") return getReadProvider();
  const client = await getConnectorClient(wagmiConfig, { chainId: activeChain.id });
  return clientToSigner(client);
}

export async function getSigner(): Promise<ethers.Signer> {
  const s = await getSignerOrProvider();
  if (!ethers.Signer.isSigner(s)) throw new Error("Wallet not connected");
  return s;
}
