"use client";

import * as React from "react";
import {
  Bill,
  StandaloneProduct,
  Participant,
  calculateGlobal,
  formatVND,
} from "@/lib/bill-calculator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "cn";

interface GlobalSummaryProps {
  bills: Bill[];
  standaloneProducts: StandaloneProduct[];
  participants: Participant[];
  className?: string;
}

export function GlobalSummary({
  bills,
  standaloneProducts,
  participants,
  className,
}: GlobalSummaryProps) {
  const [expandedMap, setExpandedMap] = React.useState<Record<string, boolean>>({
    [participants[0]?.id || "p1"]: true,
  });
  const [copiedPid, setCopiedPid] = React.useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = React.useState(false);

  const globalResult = calculateGlobal(bills, standaloneProducts, participants);

  const toggleExpand = (pid: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [pid]: !prev[pid],
    }));
  };

  const handleCopyParticipant = (
    pSummary: (typeof globalResult.participants)[0]
  ) => {
    const lines: string[] = [];
    lines.push(`${pSummary.participantName}: ${formatVND(pSummary.total)}`);

    for (const b of pSummary.bills) {
      const formulaStr = b.formula || b.shortFormula;
      lines.push(`- ${b.billTitle}: ${formulaStr} = ${formatVND(b.total)}`);
    }

    if (pSummary.standaloneItems.length > 0) {
      for (const s of pSummary.standaloneItems) {
        const splitTag = s.splitCount > 1 ? ` 1/${s.splitCount}` : " riêng";
        lines.push(`- ${s.productName}${splitTag}: + ${formatVND(s.share)}`);
      }
    }

    if (pSummary.bills.length + pSummary.standaloneItems.length > 1) {
      lines.push(`Tổng cộng: ${formatVND(pSummary.total)}`);
    }

    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedPid(pSummary.participantId);
    setTimeout(() => setCopiedPid(null), 2000);
  };

  const handleCopyAll = () => {
    const lines: string[] = ["TỔNG KẾT CHIA TIỀN", ""];

    for (const p of globalResult.participants) {
      lines.push(`${p.participantName}: ${formatVND(p.total)}`);
      for (const b of p.bills) {
        const formulaStr = b.formula || b.shortFormula;
        lines.push(`  ${b.billTitle}: ${formulaStr} = ${formatVND(b.total)}`);
      }
      for (const s of p.standaloneItems) {
        const splitTag = s.splitCount > 1 ? ` 1/${s.splitCount}` : " riêng";
        lines.push(`  ${s.productName}${splitTag}: + ${formatVND(s.share)}`);
      }
      lines.push("");
    }

    lines.push(`Tổng cộng: ${formatVND(globalResult.grandTotal)}`);

    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    setIsAllCopied(true);
    setTimeout(() => setIsAllCopied(false), 2000);
  };

  return (
    <Card className={cn("border border-border/80 shadow-md bg-card", className)}>
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Calculator className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">
                TỔNG KẾT
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Tổng hợp theo bill &amp; chi phí riêng
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {participants.length} người
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-3 flex flex-col gap-2">
        {globalResult.unassignedProductsCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20 mb-1">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Có {globalResult.unassignedProductsCount} món chưa gán người chia!
            </span>
          </div>
        )}

        <div className="flex flex-col divide-y divide-border/40">
          {globalResult.participants.map((pSummary) => {
            const isExpanded = !!expandedMap[pSummary.participantId];
            const hasDetails =
              pSummary.bills.length > 0 || pSummary.standaloneItems.length > 0;
            const isThisCopied = copiedPid === pSummary.participantId;

            return (
              <Collapsible
                key={pSummary.participantId}
                open={isExpanded}
                onOpenChange={() => toggleExpand(pSummary.participantId)}
                className="py-2.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {pSummary.participantName}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {formatVND(pSummary.total)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyParticipant(pSummary);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={`Copy công thức của ${pSummary.participantName}`}
                    >
                      {isThisCopied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      <span className="sr-only">Copy</span>
                    </button>

                    {hasDetails && (
                      <CollapsibleTrigger
                        render={
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                            title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                          />
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                        <span className="sr-only">Toggle</span>
                      </CollapsibleTrigger>
                    )}
                  </div>
                </div>

                {hasDetails && (
                  <CollapsibleContent className="pt-2">
                    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 font-mono text-xs">
                      {pSummary.bills.map((b) => (
                        <div key={b.billId} className="flex flex-col gap-0.5">
                          <span className="font-sans font-semibold text-foreground text-[11px]">
                            {b.billTitle}
                          </span>
                          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                            <span className="text-foreground/90 overflow-x-auto pr-1">
                              {b.shortFormula}
                            </span>
                            <span className="font-semibold text-foreground shrink-0">
                              = {formatVND(b.total)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {pSummary.standaloneItems.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-muted-foreground text-[11px]"
                        >
                          <span className="font-sans text-foreground/90 truncate pr-1">
                            {s.productName}
                            {s.splitCount > 1 ? (
                              <span className="text-muted-foreground text-[10px] ml-1">
                                (1/{s.splitCount})
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px] ml-1">
                                riêng
                              </span>
                            )}
                          </span>
                          <span className="font-medium text-foreground shrink-0">
                            + {formatVND(s.share)}
                          </span>
                        </div>
                      ))}

                      <div className="pt-1.5 mt-0.5 border-t border-border/60 flex items-center justify-between font-bold text-xs">
                        <span className="font-sans text-foreground">Tổng</span>
                        <span className="text-primary font-mono">
                          = {formatVND(pSummary.total)}
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          })}
        </div>

        <Separator className="my-1.5" />

        <div className="flex items-center justify-between py-1">
          <span className="text-sm font-bold text-foreground">Tổng cộng</span>
          <span className="font-mono text-lg font-extrabold text-primary">
            {formatVND(globalResult.grandTotal)}
          </span>
        </div>

        <div className="text-[11px] text-muted-foreground flex justify-between">
          <span>{bills.length} hoá đơn</span>
          <span>{standaloneProducts.length} chi phí riêng</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/60 bg-muted/20 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleCopyAll}
        >
          {isAllCopied ? "Đã sao chép vào bộ nhớ tạm!" : "Sao chép toàn bộ bảng tính"}
        </Button>
      </CardFooter>
    </Card>
  );
}
