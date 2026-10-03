import { NextRequest, NextResponse } from "next/server";
import { getBills, createBill } from "@/lib/db-service";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") || undefined;
    const bills = await getBills(sessionId);
    return NextResponse.json({
      success: true,
      data: bills,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi lấy danh sách hoá đơn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, date, image, products, id, totalAmount, sessionId } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập tiêu đề hoá đơn" },
        { status: 400 }
      );
    }

    let finalImageUrl = image || "";
    if (finalImageUrl && typeof finalImageUrl === "string" && finalImageUrl.startsWith("data:image/")) {
      finalImageUrl = await uploadImageToCloudinary(finalImageUrl);
    }

    const newBill = await createBill({
      id,
      sessionId,
      title,
      date,
      image: finalImageUrl,
      totalAmount,
      products: products || [],
    });

    return NextResponse.json(
      {
        success: true,
        data: newBill,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi tạo mới hoá đơn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
