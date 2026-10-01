"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ExternalLink } from "lucide-react";

interface ReceiptViewerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string;
  title: string;
}

export function ReceiptViewerDialog({
  isOpen,
  onOpenChange,
  imageUrl,
  title,
}: ReceiptViewerDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ZoomIn className="size-4 text-primary" />
            <span>Ảnh hoá đơn — {title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/40 border border-border">
          <img
            src={imageUrl}
            alt={`Ảnh hoá đơn ${title}`}
            className="w-full max-h-[600px] object-contain rounded-md shadow-sm"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Được quét và trích xuất bằng OCR</span>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Mở ảnh gốc
            <ExternalLink className="size-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
