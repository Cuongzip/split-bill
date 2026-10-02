import { NextRequest, NextResponse } from "next/server";
import { getParticipants, createParticipant } from "@/lib/db-service";

export async function GET() {
  try {
    const participants = await getParticipants();
    return NextResponse.json({
      success: true,
      data: participants,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi lấy danh sách thành viên";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, avatar, color, id } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập tên thành viên" },
        { status: 400 }
      );
    }

    const newParticipant = await createParticipant({
      id,
      name,
      avatar,
      color,
    });

    return NextResponse.json(
      {
        success: true,
        data: newParticipant,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi thêm thành viên";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
