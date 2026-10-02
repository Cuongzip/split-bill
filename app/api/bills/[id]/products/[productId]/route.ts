import { NextRequest, NextResponse } from "next/server";
import { updateBillProduct, deleteBillProduct } from "@/lib/db-service";

interface RouteProps {
  params: Promise<{ id: string; productId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const { id: billId, productId } = await params;
    const body = await req.json();

    const updatedBill = await updateBillProduct(billId, productId, body);
    if (!updatedBill) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy món ăn hoặc hoá đơn" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedBill });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật món ăn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const { id: billId, productId } = await params;

    const updatedBill = await deleteBillProduct(billId, productId);
    if (!updatedBill) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy món ăn hoặc hoá đơn" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xoá món ăn thành công",
      data: updatedBill,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi xoá món ăn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
