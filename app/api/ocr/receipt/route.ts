import { NextRequest, NextResponse } from "next/server";

function parsePrice(val: unknown): number {
  if (typeof val === "number") return Math.round(val);
  if (!val) return 0;
  const str = String(val).trim().toLowerCase();
  const isNegative = str.includes("-") || (str.startsWith("(") && str.endsWith(")"));
  if (str.endsWith("k")) {
    const num = parseFloat(str.replace("k", "").replace(/,/g, ".").replace(/[^0-9.]/g, ""));
    const finalVal = Math.round(num * 1000);
    return isNegative ? -finalVal : finalVal;
  }
  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10) || 0;
  return isNegative ? -num : num;
}

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp dữ liệu hình ảnh (base64)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình GEMINI_API_KEY trong .env.local" },
        { status: 500 }
      );
    }

    let base64Data = image;
    let actualMimeType = mimeType || "image/jpeg";

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (matches) {
        actualMimeType = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = image.split(",")[1] || image;
      }
    }

    const promptText = `
Bạn là chuyên gia OCR bóc tách hoá đơn tính tiền (bill).
Hãy phân tích hình ảnh hoá đơn này và trích xuất:
1. Tiêu đề hoá đơn (tên quán ăn, nhà hàng, siêu thị hoặc "Hoá đơn").
2. Danh sách các món ăn, thức uống, hàng hoá thực tế (products) kèm giá tiền tương ứng.
   - BỎ QUA hoàn toàn các mục giảm giá, điểm sử dụng, trừ điểm, voucher, chiết khấu. TUYỆT ĐỐI KHÔNG thêm các dòng trừ tiền hay điểm sử dụng vào danh sách products. Chỉ lấy các món hàng thực tế.
3. TỔNG TIỀN BILL (totalAmount):
   - Cứ lấy giá tiền khách thực tế phải trả làm tổng tiền (tức số tiền khách chuyển khoản hoặc trả tiền mặt cho người bán).
   - Không cần quan tâm có trừ điểm hay giảm giá hay không, chỉ cần lấy đúng con số ở dòng "Thanh toán", "Tổng thanh toán", "Khách phải trả", "Thực thu", "Chuyển khoản", "Tiền mặt", "Amount Due", "Total Paid".
   - Không lấy dòng tạm tính hay tổng tiền hàng chưa trừ điểm/giảm giá.

QUY TẮC BẮT BUỘC:
- Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc:
{
  "title": "Tên quán hoặc tên bill",
  "totalAmount": 139000,
  "products": [
    {
      "name": "Tên món 1",
      "price": 35000
    }
  ]
}
- "totalAmount" là số tiền thực tế phải trả (number), không có ký tự chữ.
- "price" là giá tiền của từng món (number), không có ký tự chữ.
- Nếu không đọc rõ tên quán, đặt "title" là "Hoá đơn quán ăn".
- Chỉ trả về JSON, không thêm bất kỳ văn bản giải thích nào khác.
`;

    const candidateModels = [
      "gemini-3.7-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    let lastErrorMessage = "";

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType: actualMimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        clearTimeout(timeoutId);

        const data = await res.json();

        if (!res.ok) {
          lastErrorMessage =
            data?.error?.message || `Model ${model} returned error status ${res.status}`;
          continue;
        }

        const rawText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        const cleanJson = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        const parsedResult = JSON.parse(cleanJson);

        const rawProducts = Array.isArray(parsedResult.products)
          ? parsedResult.products
          : [];

        const discountKeywords = [
          "điểm",
          "giảm giá",
          "voucher",
          "chiết khấu",
          "khuyến mãi",
          "discount",
          "point",
        ];

        const sanitizedProducts = rawProducts
          .map((item: { name?: unknown; price?: unknown }) => ({
            name: String(item.name || "").trim() || "Món ăn",
            price: parsePrice(item.price),
          }))
          .filter((p: { name: string; price: number }) => {
            if (p.price <= 0 || !p.name) return false;
            const lower = p.name.toLowerCase();
            return !discountKeywords.some((kw) => lower.includes(kw));
          });

        const totalPayment = parsePrice(parsedResult.totalAmount);

        return NextResponse.json({
          success: true,
          data: {
            title: parsedResult.title || "Hoá đơn quán ăn",
            totalAmount: totalPayment,
            products: sanitizedProducts,
          },
        });
      } catch (err: unknown) {
        lastErrorMessage =
          err instanceof Error ? err.message : "Request failed or timed out";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: lastErrorMessage || "Không thể kết nối đến AI OCR sau nhiều lần thử",
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Đã có lỗi xảy ra khi OCR bill";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
