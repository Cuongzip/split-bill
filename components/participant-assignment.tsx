"use client";

import * as React from "react";
import { Participant, formatVND } from "@/lib/bill-calculator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, Check, X } from "lucide-react";
import { cn } from "cn";

interface ParticipantAssignmentProps {
  participants: Participant[];
  selectedIds: string[];
  productPrice: number;
  onSelectionChange: (newSelectedIds: string[]) => void;
  className?: string;
}

export function ParticipantAssignment({
  participants,
  selectedIds,
  productPrice,
  onSelectionChange,
  className,
}: ParticipantAssignmentProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedCount = selectedIds.length;
  const perPersonShare =
    selectedCount > 0 ? Math.round(productPrice / selectedCount) : 0;

  const handleToggle = (pId: string) => {
    if (selectedIds.includes(pId)) {
      onSelectionChange(selectedIds.filter((id) => id !== pId));
    } else {
      onSelectionChange([...selectedIds, pId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(participants.map((p) => p.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedParticipants = participants.filter((p) =>
    selectedIds.includes(p.id)
  );

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all outline-none",
                "hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                selectedCount === 0
                  ? "bg-destructive/10 text-destructive border border-destructive/30"
                  : "bg-secondary text-secondary-foreground border border-border/60"
              )}
            />
          }
        >
          {selectedCount === 0 ? (
            <span className="flex items-center gap-1 font-medium">
              <AlertCircle className="size-3.5" />
              <span>Chưa chọn người chia</span>
            </span>
          ) : selectedCount === participants.length ? (
            <span className="flex items-center gap-1 font-medium">
              <Users className="size-3.5 text-muted-foreground" />
              <span>Tất cả ({selectedCount})</span>
              <span className="text-muted-foreground font-normal">
                · {formatVND(perPersonShare)}/người
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium max-w-[240px] truncate">
              <span className="truncate">
                {selectedParticipants.map((p) => p.name).join(" · ")}
              </span>
              <span className="text-muted-foreground font-normal shrink-0">
                ({formatVND(perPersonShare)})
              </span>
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-64 p-3 shadow-lg border-border"
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Chia cho ai?
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {selectedCount > 0
                    ? `${formatVND(perPersonShare)} / người (${selectedCount} người)`
                    : "Chưa có ai được chọn"}
                </span>
              </div>
              <Badge variant={selectedCount > 0 ? "secondary" : "destructive"}>
                {selectedCount}/{participants.length}
              </Badge>
            </div>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {participants.map((p) => {
                const isChecked = selectedIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between p-1.5 rounded-md cursor-pointer text-xs transition-colors",
                      isChecked ? "bg-primary/5 font-medium" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(p.id)}
                      />
                      <span className="text-foreground">{p.name}</span>
                    </div>
                    {isChecked && (
                      <span className="text-[11px] text-muted-foreground">
                        {formatVND(perPersonShare)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 pt-1.5 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="flex-1 text-[11px]"
                onClick={handleSelectAll}
              >
                <Check data-icon="inline-start" />
                Tất cả
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="flex-1 text-[11px] text-muted-foreground hover:text-destructive"
                onClick={handleClearAll}
              >
                <X data-icon="inline-start" />
                Xóa tất cả
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
