import "server-only";
import { ethers } from "ethers";
import { ADMIN_SIGNATURE_MAX_AGE_MS, AdminAction, buildAdminMessage } from "@/utils/adminAuth";
import { contractAddresses, getRpcUrl } from "@/utils/config";

const OWNER_SELECTOR = "0x8da5cb5b"; // owner()

export class AdminAuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
  }
}

/**
 * Throws AdminAuthError unless `signature` is a fresh signature of the admin
 * message for (action, target, timestamp) by the raffles contract owner.
 */
export async function verifyAdmin(
  action: AdminAction,
  target: string,
  timestamp: unknown,
  signature: unknown,
) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || typeof signature !== "string" || !signature) {
    throw new AdminAuthError("Missing signature");
  }
  const age = Date.now() - ts;
  if (age > ADMIN_SIGNATURE_MAX_AGE_MS || age < -60_000) {
    throw new AdminAuthError("Signature expired");
  }

  let signer: string;
  try {
    signer = ethers.utils.verifyMessage(buildAdminMessage(action, target, ts), signature);
  } catch {
    throw new AdminAuthError("Invalid signature");
  }

  const owner = await fetchRafflesOwner();

  if (signer.toLowerCase() !== owner.toLowerCase()) {
    throw new AdminAuthError("Not authorized", 403);
  }
}

// Plain JSON-RPC eth_call: ethers v5 providers break inside Next.js route handlers
// (Next patches global fetch), so we call owner() directly with cache disabled.
async function fetchRafflesOwner(): Promise<string> {
  const res = await fetch(getRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: contractAddresses.raffles, data: OWNER_SELECTOR }, "latest"],
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error || typeof json.result !== "string" || json.result.length < 66) {
    throw new Error(`owner() call failed: ${JSON.stringify(json.error ?? json)}`);
  }
  return ethers.utils.getAddress(ethers.utils.hexDataSlice(json.result, 12, 32));
}
