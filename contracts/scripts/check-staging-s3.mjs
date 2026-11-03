// Checks the staging admin image API end to end (sign as tester/admin, upload, read, delete).
//   node scripts/check-staging-s3.mjs [https://ice-girlz-staging.vercel.app]
import "dotenv/config";
import { ethers } from "ethers";

const APP = process.argv[2] || "https://ice-girlz-staging.vercel.app";
const IMAGE_BASE = "https://iroueuzonnuqwwbxkwkc.supabase.co/storage/v1/object/public/icegirlz-staging/raffles";
const admin = new ethers.Wallet(process.env.TESTER_PRIVATE_KEY);
const ca = "0x000000000000000000000000000000000000dEaD";
const tokenId = String(Date.now());
const name = `${ca.toLowerCase()}-${tokenId}`;

const sign = async (action) => {
  const timestamp = Date.now();
  const msg = ["Ice dApps admin action", `Action: ${action}`, `Target: ${name}`, `Timestamp: ${timestamp}`].join("\n");
  return { timestamp, signature: await admin.signMessage(msg) };
};

// 1x1 PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const up = await sign("upload-raffle-image");
const form = new FormData();
form.append("profileImage", new Blob([png], { type: "image/png" }), "t.png");
form.append("ca", ca);
form.append("tokenId", tokenId);
form.append("timestamp", String(up.timestamp));
form.append("signature", up.signature);
let r = await fetch(`${APP}/api/uploadToS3`, { method: "POST", body: form });
console.log("upload:", r.status, await r.text());

r = await fetch(`${IMAGE_BASE}/${name}`);
console.log("public read:", r.status, r.headers.get("content-type"));

const del = await sign("delete-raffle-image");
r = await fetch(`${APP}/api/deleteFromS3`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, ...del }) });
console.log("delete:", r.status, await r.text());

// cache-busting query: Supabase's CDN may keep serving the deleted object for a while
r = await fetch(`${IMAGE_BASE}/${name}?nocache=${Date.now()}`);
console.log("public read after delete (no cache):", r.status);
