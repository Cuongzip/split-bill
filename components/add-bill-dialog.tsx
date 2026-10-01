"use client";

import * as React from "react";
import { Bill, Participant } from "@/lib/bill-calculator";
import { PRESET_SAMPLE_BILLS } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Upload, Receipt, Sparkles, CheckCircle2, FileImage } from "lucide-react";
import { cn } from "cn";

interface AddBillDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onAddBill: (newBill: Bill) => void;
  currentBillCount: number;
}

export function AddBillDialog({
  isOpen,
  onOpenChange,
  participants,
  onAddBill,
  currentBillCount,
}: AddBillDialogProps) {
  const [isProcessingOcr, setIsProcessingOcr] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processReceiptFile = (
    fileName: string,
    presetIndex = 0,
    customImage?: string
  ) => {
    setIsProcessingOcr(true);

    const preset =
      PRESET_SAMPLE_BILLS[presetIndex % PRESET_SAMPLE_BILLS.length];

    setTimeout(() => {
      const nextBillNumber = currentBillCount + 1;
      const allPids = participants.map((p) => p.id);

      const newBill: Bill = {
        id: `bill_${Date.now()}`,
        title: `BILL #${nextBillNumber} — ${preset.title}`,
        date: "Vừa xong",
        image: customImage || (nextBillNumber % 2 === 1 ? "/receipt-sample-1.svg" : "/receipt-sample-2.svg"),
        products: preset.products.map((item, idx) => ({
          id: `b${nextBillNumber}_p${idx + 1}_${Date.now()}`,
          name: item.name,
          price: item.price,
          participantIds: allPids,
        })),
      };

      onAddBill(newBill);
      setIsProcessingOcr(false);
      onOpenChange(false);
    }, 1200);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        processReceiptFile(file.name, 0, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        processReceiptFile(file.name, 0, imageUrl);
      };
      reader.readAsDataURL(file);
    } else {
      processReceiptFile("bill_uploaded.png", 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Receipt className="size-4 text-primary" />
            <span>Thêm hoá đơn mới (Bill)</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tải ảnh chụp hoá đơn để AI/OCR trích xuất tên món và giá tiền tự động.
          </DialogDescription>
        </DialogHeader>

        {isProcessingOcr ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
              <Sparkles className="size-4 text-primary animate-spin" />
              <div>
                <p className="font-semibold text-foreground">
                  Đang nhận diện món ăn từ hoá đơn...
                </p>
                <p className="text-muted-foreground text-[11px]">
                  AI/OCR đang trích xuất tên món, số lượng và thành tiền.
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
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
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
              onClick={() => fileInputRef.current?.click()}
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
                🧾 Kéo ảnh bill vào đây
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                hoặc nhấn vào khung để chọn file từ thiết bị (JPG, PNG, WebP)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload data-icon="inline-start" />
                Upload bill từ máy
              </Button>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
              <span className="text-xs font-medium text-muted-foreground">
                Hoặc thử nghiệm nhanh với bill mẫu:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => processReceiptFile("mau_lau_nam.png", 0)}
                >
                  <FileImage data-icon="inline-start" />
                  <div className="flex flex-col items-start truncate text-left">
                    <span className="font-medium text-foreground">
                      Mẫu #1: Lẩu Nấm
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      4 món · 337.000đ
                    </span>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="justify-start text-xs h-auto py-2"
                  onClick={() => processReceiptFile("mau_quan_nuong.png", 1)}
                >
                  <FileImage data-icon="inline-start" />
                  <div className="flex flex-col items-start truncate text-left">
                    <span className="font-medium text-foreground">
                      Mẫu #2: Quán Nướng
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      4 món · 313.000đ
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
