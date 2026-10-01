"use client";

import * as React from "react";
import { StandaloneProduct, Participant } from "@/lib/bill-calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag } from "lucide-react";

interface AddStandaloneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onAddProduct: (product: StandaloneProduct) => void;
}

export function AddStandaloneDialog({
  isOpen,
  onOpenChange,
  participants,
  onAddProduct,
}: AddStandaloneDialogProps) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [note, setNote] = React.useState("");
  const [selectedPids, setSelectedPids] = React.useState<string[]>(
    participants.map((p) => p.id)
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelectedPids(participants.map((p) => p.id));
    }
  }, [isOpen, participants]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = parseInt(price.replace(/\D/g, ""), 10) || 0;
    const newProduct: StandaloneProduct = {
      id: `standalone_${Date.now()}`,
      name: name.trim(),
      price: priceNum,
      participantIds: selectedPids,
      note: note.trim() || undefined,
    };

    onAddProduct(newProduct);
    setName("");
    setPrice("");
    setNote("");
    onOpenChange(false);
  };

  const handleToggle = (pid: string) => {
    if (selectedPids.includes(pid)) {
      setSelectedPids(selectedPids.filter((id) => id !== pid));
    } else {
      setSelectedPids([...selectedPids, pid]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="size-4 text-primary" />
            <span>Thêm sản phẩm riêng</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Chi phí riêng không thuộc hoá đơn nào (ví dụ: Đá viên, Phí ship, mua thêm đồ ngoài...).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name" className="text-xs font-semibold">
              Tên sản phẩm / chi phí
            </Label>
            <Input
              id="product-name"
              placeholder="Ví dụ: Đá viên, Phí ship Grab, Nước đá..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-price" className="text-xs font-semibold">
              Giá tiền (VNĐ)
            </Label>
            <Input
              id="product-price"
              type="number"
              placeholder="Ví dụ: 20000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-note" className="text-xs font-semibold">
              Ghi chú thêm (tùy chọn)
            </Label>
            <Input
              id="product-note"
              placeholder="Ví dụ: Mua ngoài tiệm tạp hóa"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-border">
            <span className="text-xs font-semibold text-foreground">
              Chia cho những ai?
            </span>
            <div className="grid grid-cols-2 gap-2">
              {participants.map((p) => {
                const checked = selectedPids.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-border/80 text-xs cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleToggle(p.id)}
                    />
                    <span className="text-foreground font-medium">
                      {p.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm">
              Thêm sản phẩm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
