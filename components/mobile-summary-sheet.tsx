"use client";

import * as React from "react";
import { Bill, StandaloneProduct, Participant, calculateGlobal, formatVND } from "@/lib/bill-calculator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GlobalSummary } from "@/components/global-summary";
import { Calculator, ChevronUp } from "lucide-react";

interface MobileSummarySheetProps {
  bills: Bill[];
  standaloneProducts: StandaloneProduct[];
  participants: Participant[];
}

export function MobileSummarySheet({
  bills,
  standaloneProducts,
  participants,
}: MobileSummarySheetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const globalResult = calculateGlobal(bills, standaloneProducts, participants);

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2.5 shadow-lg">
      <div className="flex items-center justify-between max-w-lg mx-auto gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-muted-foreground font-medium truncate">
            Tổng cộng ({participants.length} người)
          </span>
          <span className="font-mono text-base font-bold text-primary truncate">
            {formatVND(globalResult.grandTotal)}
          </span>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            render={
              <Button size="sm" className="text-xs shrink-0 shadow-xs">
                <Calculator data-icon="inline-start" />
                Xem tổng kết
                <ChevronUp className="size-3.5 ml-1" />
              </Button>
            }
          />
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-4 rounded-t-xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base font-semibold">
                Bảng tổng kết chi phí
              </SheetTitle>
              <SheetDescription className="text-xs">
                Chi tiết từng người theo hoá đơn và sản phẩm riêng
              </SheetDescription>
            </SheetHeader>
            <div className="pt-2">
              <GlobalSummary
                bills={bills}
                standaloneProducts={standaloneProducts}
                participants={participants}
                className="max-h-none"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
