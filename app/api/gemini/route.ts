import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung prompt" },
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Lỗi khi gọi Gemini API" },
        { status: res.status }
      );
    }

    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi";

    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
