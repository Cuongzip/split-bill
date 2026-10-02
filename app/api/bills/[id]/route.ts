import { NextRequest, NextResponse } from "next/server";
import { getBillById, updateBill, deleteBill } from "@/lib/db-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const bill = await getBillById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hoá đơn" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi lấy thông tin hoá đơn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateBill(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hoá đơn để cập nhật" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật hoá đơn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const success = await deleteBill(id);

    return NextResponse.json({ success, message: "Đã xoá hoá đơn thành công" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi xoá hoá đơn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
