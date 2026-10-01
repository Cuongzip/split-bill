import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDatabase();

    const stateMap: Record<number, string> = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    const readyState = mongoose.connection.readyState;
    const isConnected = readyState === 1;

    return NextResponse.json(
      {
        success: isConnected,
        status: stateMap[readyState] || "Unknown",
        database: mongoose.connection.name || "split_bill",
        host: mongoose.connection.host,
        timestamp: new Date().toISOString(),
      },
      { status: isConnected ? 200 : 503 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Lỗi kết nối cơ sở dữ liệu";

    return NextResponse.json(
      {
        success: false,
        status: "Error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
