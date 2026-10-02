import { NextRequest, NextResponse } from "next/server";
import { addProductToBill } from "@/lib/db-service";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { id: billId } = await params;
    const body = await req.json();
    const { name, price, participantIds, id } = body;

    if (!name?.trim() || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập tên món và giá tiền" },
        { status: 400 }
      );
    }

    const newProduct = {
      id: id || `p_${Date.now()}`,
      name: name.trim(),
      price: Number(price) || 0,
      participantIds: participantIds || [],
    };

    const updatedBill = await addProductToBill(billId, newProduct);
    if (!updatedBill) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hoá đơn" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedBill,
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi khi thêm món vào hoá đơn";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
