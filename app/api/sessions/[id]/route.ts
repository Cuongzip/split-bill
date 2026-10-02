import { NextRequest, NextResponse } from "next/server";
import { updateSession, deleteSession } from "@/lib/db-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateSession(id, {
      name: body.name,
      date: body.date,
      color: body.color,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy nhóm" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi cập nhật nhóm";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi xoá nhóm";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
