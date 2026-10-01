"use client";

import * as React from "react";
import {
  StandaloneProduct,
  Participant,
  calculateStandalone,
  formatVND,
} from "@/lib/bill-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ParticipantAssignment } from "@/components/participant-assignment";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "cn";

interface StandaloneProductsProps {
  products: StandaloneProduct[];
  participants: Participant[];
  onUpdateProducts: (products: StandaloneProduct[]) => void;
  onOpenAddModal: () => void;
}

export function StandaloneProducts({
  products,
  participants,
  onUpdateProducts,
  onOpenAddModal,
}: StandaloneProductsProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState<number>(0);

  const standaloneCalc = calculateStandalone(products, participants);

  const handleParticipantChange = (id: string, newPids: string[]) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, participantIds: newPids } : p
    );
    onUpdateProducts(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateProducts(products.filter((p) => p.id !== id));
  };

  const startEdit = (p: StandaloneProduct) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = products.map((p) =>
      p.id === editingId
        ? {
            ...p,
            name: editName.trim() || p.name,
            price: Number(editPrice) || p.price,
          }
        : p
    );
    onUpdateProducts(updated);
    setEditingId(null);
  };

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground border border-border">
            <ShoppingBag className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Sản phẩm riêng
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Chi phí không thuộc bill nào (đá viên, phí ship, phụ thu...)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-base font-bold text-foreground">
              {formatVND(standaloneCalc.total)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {products.length} mục
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={onOpenAddModal}
            className="text-xs"
          >
            <Plus data-icon="inline-start" />
            Thêm mục
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3 flex flex-col gap-3">
        {standaloneCalc.hasUnassigned && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              Có {standaloneCalc.unassignedItems.length} chi phí riêng chưa gán người chia!
            </span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <span>Chưa có sản phẩm riêng nào.</span>
            <Button variant="outline" size="xs" onClick={onOpenAddModal}>
              <Plus data-icon="inline-start" />
              Thêm sản phẩm riêng đầu tiên
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/40">
            {products.map((item) => {
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="py-2 flex items-center gap-2 bg-muted/30 p-2 rounded-md"
                  >
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Tên sản phẩm"
                      className="h-7 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      placeholder="Giá tiền"
                      className="h-7 text-xs w-28"
                    />
                    <Button
                      variant="default"
                      size="icon-xs"
                      onClick={saveEdit}
                      title="Lưu"
                    >
                      <Check className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setEditingId(null)}
                      title="Hủy"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="group py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 px-1.5 rounded transition-colors"
                >
                  <div className="flex items-baseline gap-2 min-w-0 flex-1">
                    <span className="font-medium text-foreground truncate">
                      {item.name}
                    </span>
                    {item.note && (
                      <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                        ({item.note})
                      </span>
                    )}
                    <span className="font-semibold text-foreground/90 shrink-0">
                      {formatVND(item.price)}
                    </span>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-1">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                        title="Sửa tên hoặc giá"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded cursor-pointer"
                        title="Xóa mục này"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  <ParticipantAssignment
                    participants={participants}
                    selectedIds={item.participantIds}
                    productPrice={item.price}
                    onSelectionChange={(newPids) =>
                      handleParticipantChange(item.id, newPids)
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
          <div className="pt-2 border-t border-border/50 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Chia tiền riêng:</span>
            {standaloneCalc.participantCalculations
              .filter((p) => p.total > 0)
              .map((p) => (
                <span key={p.participantId} className="inline-flex items-center gap-1">
                  <span className="font-medium text-foreground">{p.participantName}:</span>
                  <span className="font-mono">{formatVND(p.total)}</span>
                </span>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
