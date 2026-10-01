"use client";

import * as React from "react";
import { Participant } from "@/lib/bill-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Plus,
  Users,
  ShoppingBag,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface AppHeaderProps {
  participants: Participant[];
  onOpenAddBill: () => void;
  onOpenAddStandalone: () => void;
  onOpenParticipants: () => void;
  onResetSampleData: () => void;
}

export function AppHeader({
  participants,
  onOpenAddBill,
  onOpenAddStandalone,
  onOpenParticipants,
  onResetSampleData,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Receipt className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                BillSplit
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Chia tiền hoá đơn nhóm minh bạch theo từng món
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenParticipants}
            className="text-xs"
            title="Quản lý thành viên nhóm"
          >
            <Users data-icon="inline-start" />
            <span className="hidden sm:inline">Thành viên</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
              {participants.length}
            </Badge>
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onResetSampleData}
            title="Khôi phục dữ liệu mẫu ban đầu"
            className="text-muted-foreground hover:text-foreground hidden md:inline-flex"
          >
            <RotateCcw className="size-3.5" />
            <span className="sr-only">Reset data</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddStandalone}
            className="text-xs hidden sm:inline-flex"
          >
            <ShoppingBag data-icon="inline-start" />
            Thêm sản phẩm
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onOpenAddBill}
            className="text-xs shadow-xs"
          >
            <Plus data-icon="inline-start" />
            Thêm bill
          </Button>
        </div>
      </div>
    </header>
  );
}
