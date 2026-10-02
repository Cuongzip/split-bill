import { NextRequest, NextResponse } from "next/server";
import { getSessions, createSession } from "@/lib/db-service";

export async function GET() {
  try {
    const sessions = await getSessions();
    return NextResponse.json({ success: true, data: sessions });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi lấy danh sách nhóm";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await createSession({
      id: body.id,
      name: body.name,
      date: body.date,
      color: body.color,
    });
    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi tạo nhóm mới";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
