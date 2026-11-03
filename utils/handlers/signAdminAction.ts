import { getSigner } from "./getSigner";
import { AdminAction, buildAdminMessage } from "@/utils/adminAuth";

/** Asks the connected wallet to sign an admin action; returns fields to send to the API. */
export async function signAdminAction(action: AdminAction, target: string) {
  const timestamp = Date.now();
  const signature = await (await getSigner()).signMessage(buildAdminMessage(action, target, timestamp));
  return { timestamp, signature };
}
