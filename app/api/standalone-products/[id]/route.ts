import { NextRequest, NextResponse } from "next/server";
import {
  updateStandaloneProduct,
  deleteStandaloneProduct,
} from "@/lib/db-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateStandaloneProduct(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy chi phí riêng để cập nhật" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật chi phí riêng";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const success = await deleteStandaloneProduct(id);

    return NextResponse.json({
      success,
      message: "Đã xoá chi phí riêng thành công",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi xoá chi phí riêng";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
