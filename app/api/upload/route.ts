import { NextRequest, NextResponse } from "next/server";
import { uploadImageBufferToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file ảnh để tải lên" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadImageBufferToCloudinary(buffer);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi tải ảnh lên";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
