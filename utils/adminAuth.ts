// Shared by client (signing) and server (verification) for admin-only API routes.
// The admin signs a message binding the action, the target object and a timestamp;
// the server rebuilds the same message, recovers the signer and checks it is the
// owner() of the raffles contract.

export type AdminAction = "upload-raffle-image" | "delete-raffle-image";

export const ADMIN_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export function buildAdminMessage(action: AdminAction, target: string, timestamp: number) {
  return [
    "Ice dApps admin action",
    `Action: ${action}`,
    `Target: ${target}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

export const RAFFLE_IMAGE_NAME_RE = /^0x[0-9a-f]{40}-\d{1,78}$/;
