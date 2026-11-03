import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { RAFFLE_IMAGE_NAME_RE } from "@/utils/adminAuth";
import { AdminAuthError, verifyAdmin } from "@/utils/server/verifyAdmin";
import { RAFFLES_PREFIX, s3Bucket, s3Client } from "@/utils/server/s3";

export async function POST(request: Request) {
  try {
    const { name, timestamp, signature } = await request.json();

    // Only raffle images can be deleted: "<lowercase address>-<tokenId>" under raffles/.
    if (typeof name !== "string" || !RAFFLE_IMAGE_NAME_RE.test(name)) {
      return NextResponse.json({ error: "Invalid image name" }, { status: 400 });
    }

    await verifyAdmin("delete-raffle-image", name, timestamp, signature);

    await s3Client.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: `${RAFFLES_PREFIX}${name}` }));

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("deleteFromS3 error:", err);
    return NextResponse.json({ error: "Error deleting file" }, { status: 500 });
  }
}
