import { NextResponse } from "next/server";
import { resetAllData } from "@/lib/db-service";

export async function POST() {
  try {
    const data = await resetAllData();
    return NextResponse.json({
      success: true,
      message: "Đã làm mới toàn bộ dữ liệu thành công",
      data,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi khôi phục dữ liệu";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
