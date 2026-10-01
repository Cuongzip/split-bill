"use client";

import { useState } from "react";

export default function GeminiTest() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult("Lỗi: " + (data.error || "Không thể gọi API"));
      } else {
        setResult(data.result);
      }
    } catch (err: unknown) {
      setResult("Lỗi: " + (err instanceof Error ? err.message : "Thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #ccc" }}>
      <h2>Test Gemini API</h2>
      <form onSubmit={handleAsk}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập câu hỏi cho Gemini..."
          style={{ width: "300px", marginRight: "8px" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "12px" }}>
          <strong>Kết quả:</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>{result}</p>
        </div>
      )}
    </div>
  );
}
