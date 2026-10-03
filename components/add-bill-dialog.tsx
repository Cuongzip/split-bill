"use client";

import * as React from "react";
import { Bill, Participant } from "@/lib/bill-calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Receipt, Sparkles, Plus, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "cn";

interface AddBillDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onAddBill: (newBill: Bill) => void;
  currentBillCount?: number;
  sessionId: string;
}

function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AddBillDialog({
  isOpen,
  onOpenChange,
  participants,
  onAddBill,
  currentBillCount,
  sessionId,
}: AddBillDialogProps) {
  const [isProcessingOcr, setIsProcessingOcr] = React.useState(false);
  const [ocrStatusText, setOcrStatusText] = React.useState(
    "Đang nhận diện món ăn từ hoá đơn..."
  );
  const [ocrError, setOcrError] = React.useState<string | null>(null);
  const [pendingFileData, setPendingFileData] = React.useState<{
    name: string;
    image: string;
  } | null>(null);
  const [manualTitle, setManualTitle] = React.useState("");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setIsProcessingOcr(false);
    setOcrError(null);
    setPendingFileData(null);
    setManualTitle("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const processReceiptFile = async (
    fileName: string,
    customImage: string
  ) => {
    setIsProcessingOcr(true);
    setOcrError(null);
    setPendingFileData({ name: fileName, image: customImage });

    const allPids = participants.map((p) => p.id);

    setOcrStatusText("AI Gemini Vision đang trích xuất tên món và giá tiền...");
    try {
      const response = await fetch("/api/ocr/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: customImage }),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data?.products?.length > 0) {
        const ocrResult = resData.data;
        const newBill: Bill = {
          id: `bill_${Date.now()}`,
          sessionId: sessionId || "default",
          title: ocrResult.title || fileName || "Hoá đơn",
          date: "Vừa xong",
          image: customImage,
          totalAmount: ocrResult.totalAmount || undefined,
          products: ocrResult.products.map(
            (item: { name: string; price: number }, idx: number) => ({
              id: `prod_${idx + 1}_${Date.now()}`,
              name: item.name,
              price: Number(item.price) || 0,
              participantIds: allPids,
            })
          ),
        };

        onAddBill(newBill);
        setIsProcessingOcr(false);
        resetState();
        onOpenChange(false);
        return;
      } else {
        const errorMsg =
          resData?.error ||
          "AI không nhận diện được danh sách món từ ảnh này (ảnh có thể bị mờ hoặc góc chụp chưa rõ).";
        setOcrError(errorMsg);
        setIsProcessingOcr(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lỗi kết nối khi gửi ảnh đến AI OCR.";
      setOcrError(msg);
      setIsProcessingOcr(false);
    }
  };

  const handleCreateEmptyBill = () => {
    const fallbackBill: Bill = {
      id: `bill_${Date.now()}`,
      sessionId: sessionId || "default",
      title: pendingFileData?.name || "Hoá đơn",
      date: "Vừa xong",
      image: pendingFileData?.image || "",
      products: [],
    };

    onAddBill(fallbackBill);
    resetState();
    onOpenChange(false);
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newBill: Bill = {
      id: `bill_${Date.now()}`,
      sessionId: sessionId || "default",
      title: manualTitle.trim() || "Hoá đơn",
      date: "Vừa xong",
      image: "",
      products: [],
    };

    onAddBill(newBill);
    resetState();
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        processReceiptFile(file.name, compressedBase64);
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        processReceiptFile(file.name, compressedBase64);
      } catch (err) {
        console.error("Error reading dropped file:", err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-lg p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Receipt className="size-4 text-primary" />
            <span>Thêm hoá đơn mới (Bill)</span>
          </DialogTitle>
    
        </DialogHeader>

        {isProcessingOcr ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
              <Sparkles className="size-4 text-primary animate-spin" />
              <div>
                <p className="font-semibold text-foreground">
                  {ocrStatusText}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  AI đang nhận diện từng dòng món ăn, số lượng và thành tiền.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ) : ocrError ? (
          <div className="flex flex-col gap-4 py-3">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-destructive">
                  Không thể bóc tách tự động từ ảnh hoá đơn
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {ocrError}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (pendingFileData) {
                    processReceiptFile(pendingFileData.name, pendingFileData.image);
                  }
                }}
                className="w-full sm:w-auto text-xs"
              >
                <RotateCcw data-icon="inline-start" className="size-3.5" />
                Thử quét lại
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCreateEmptyBill}
                className="w-full sm:w-auto text-xs"
              >
                Tạo bill để tự nhập món
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="w-full sm:w-auto text-xs text-muted-foreground"
              >
                Chọn ảnh khác
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                  fileInputRef.current.click();
                }
              }}
              className={cn(
                "group flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all mb-3">
                <Receipt className="size-6" />
              </div>
              <p className="font-semibold text-sm text-foreground">
                🧾 Kéo ảnh bill vào đây để AI quét món
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                chọn file ảnh hoá đơn từ thiết bị (JPG, PNG, WebP)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
              >
                <Upload data-icon="inline-start" />
                Upload ảnh hoá đơn
              </Button>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <span className="text-xs font-medium text-foreground">
                Hoặc tạo nhanh hoá đơn chưa có ảnh:
              </span>
              <form onSubmit={handleManualCreate} className="flex items-center gap-2">
                <Input
                  placeholder="Tên hoá đơn (vd: Bữa trưa ăn gà rán, Cà phê...)"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="text-xs flex-1"
                />
                <Button type="submit" size="sm" disabled={!manualTitle.trim()}>
                  <Plus data-icon="inline-start" />
                  Tạo hoá đơn
                </Button>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
