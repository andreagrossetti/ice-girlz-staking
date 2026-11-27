import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ethers } from "ethers";
import { raffleImageName } from "@/utils/config";
import { AdminAuthError, verifyAdmin } from "@/utils/server/verifyAdmin";
import { RAFFLES_PREFIX, s3Bucket, s3Client } from "@/utils/server/s3";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Detect the real image type from magic bytes instead of trusting the client.
function detectImageType(buf: Buffer): string | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 6 && ["GIF87a", "GIF89a"].includes(buf.subarray(0, 6).toString("ascii"))) return "image/gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("profileImage");
    const ca = String(formData.get("ca") ?? "");
    const tokenId = String(formData.get("tokenId") ?? "");

    if (!ethers.utils.isAddress(ca) || !/^\d{1,78}$/.test(tokenId)) {
      return NextResponse.json({ error: "Invalid contract address or token id" }, { status: 400 });
    }
    if (!(image instanceof Blob) || image.size === 0) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 413 });
    }

    const name = raffleImageName(ca, tokenId);
    await verifyAdmin("upload-raffle-image", name, formData.get("timestamp"), formData.get("signature"));

    const body = Buffer.from(await image.arrayBuffer());
    const contentType = detectImageType(body);
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: `${RAFFLES_PREFIX}${name}`,
        Body: body,
        ContentType: contentType,
        Expires: new Date(Date.now() + 60 * 60 * 24 * 90 * 1000),
      }),
    );

    return NextResponse.json({ success: "File Uploaded Successfully" }, { status: 200 });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("uploadToS3 error:", err);
    return NextResponse.json({ error: "Error Uploading File" }, { status: 500 });
  }
}
