import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function GET() {
  try {
    await connectToDatabase();
    const bills = await Bill.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: bills,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi lấy danh sách hoá đơn";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { title, totalAmount, payerName, participants, splitType, description } = body;

    if (!title || totalAmount === undefined || !payerName) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập đầy đủ các trường: title, totalAmount, payerName",
        },
        { status: 400 }
      );
    }

    const newBill = await Bill.create({
      title,
      totalAmount,
      payerName,
      participants: participants || [],
      splitType: splitType || "EQUAL",
      description: description || "",
    });

    return NextResponse.json(
      {
        success: true,
        data: newBill,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi tạo mới hoá đơn";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
