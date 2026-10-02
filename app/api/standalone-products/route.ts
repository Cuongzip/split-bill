import { NextRequest, NextResponse } from "next/server";
import {
  getStandaloneProducts,
  createStandaloneProduct,
} from "@/lib/db-service";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") || undefined;
    const products = await getStandaloneProducts(sessionId);
    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Lỗi khi lấy danh sách chi phí riêng";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, participantIds, note, id, sessionId } = body;

    if (!name?.trim() || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập tên chi phí và giá tiền" },
        { status: 400 }
      );
    }

    const newProduct = await createStandaloneProduct({
      id,
      sessionId,
      name,
      price: Number(price) || 0,
      participantIds: participantIds || [],
      note: note || "",
    });

    return NextResponse.json(
      {
        success: true,
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi tạo chi phí riêng";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
