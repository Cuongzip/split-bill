import { NextRequest, NextResponse } from "next/server";
import { updateParticipant, deleteParticipant } from "@/lib/db-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateParticipant(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thành viên để cập nhật" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật thành viên";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const success = await deleteParticipant(id);

    return NextResponse.json({
      success,
      message: "Đã xoá thành viên và cập nhật danh sách chia tiền",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi xoá thành viên";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
