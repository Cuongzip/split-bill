"use client";

import * as React from "react";
import {
  Bill,
  BillProduct,
  Participant,
  calculateBill,
  formatVND,
} from "@/lib/bill-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ParticipantAssignment } from "@/components/participant-assignment";
import { ReceiptViewerDialog } from "@/components/receipt-viewer-dialog";
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calculator,
  ZoomIn,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { cn } from "cn";

interface BillCardProps {
  bill: Bill;
  participants: Participant[];
  onUpdateBill: (updatedBill: Bill) => void;
  onDeleteBill: (billId: string) => void;
}

export function BillCard({
  bill,
  participants,
  onUpdateBill,
  onDeleteBill,
}: BillCardProps) {
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [isFormulaCopied, setIsFormulaCopied] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(
    null
  );
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState<number>(0);

  const [isAddingProduct, setIsAddingProduct] = React.useState(false);
  const [newProductName, setNewProductName] = React.useState("");
  const [newProductPrice, setNewProductPrice] = React.useState("");

  const billCalc = calculateBill(bill, participants);
  const [isEditingTotal, setIsEditingTotal] = React.useState(false);
  const [tempTotal, setTempTotal] = React.useState(String(billCalc.billTotal));

  const saveTotalEdit = () => {
    const val = parseInt(tempTotal.replace(/\D/g, ""), 10);
    onUpdateBill({
      ...bill,
      totalAmount: val > 0 ? val : undefined,
    });
    setIsEditingTotal(false);
  };

  const handleProductParticipantsChange = (
    productId: string,
    newParticipantIds: string[]
  ) => {
    const updatedProducts = bill.products.map((p) =>
      p.id === productId ? { ...p, participantIds: newParticipantIds } : p
    );
    onUpdateBill({ ...bill, products: updatedProducts });
  };

  const startEditing = (product: BillProduct) => {
    setEditingProductId(product.id);
    setEditName(product.name);
    setEditPrice(product.price);
  };

  const saveProductEdit = () => {
    if (!editingProductId) return;
    const updatedProducts = bill.products.map((p) =>
      p.id === editingProductId
        ? {
            ...p,
            name: editName.trim() || p.name,
            price: Number(editPrice) || p.price,
          }
        : p
    );
    onUpdateBill({ ...bill, products: updatedProducts });
    setEditingProductId(null);
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = bill.products.filter((p) => p.id !== productId);
    onUpdateBill({ ...bill, products: updatedProducts });
  };

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProductName.trim()) return;

    const isNeg = newProductPrice.trim().startsWith("-");
    const digits = newProductPrice.replace(/\D/g, "");
    const rawNum = parseInt(digits, 10) || 0;
    const priceNum = isNeg ? -rawNum : rawNum;
    const newProduct: BillProduct = {
      id: `p_${Date.now()}`,
      name: newProductName.trim(),
      price: priceNum,
      participantIds: participants.map((p) => p.id),
    };

    onUpdateBill({
      ...bill,
      products: [...bill.products, newProduct],
    });

    setNewProductName("");
    setNewProductPrice("");
    setIsAddingProduct(false);
  };

  const handleCopyFormulas = () => {
    if (!billCalc.formulaBreakdown) return;
    const text =
      `CÁCH TÍNH - ${bill.title}\n` +
      billCalc.formulaBreakdown.fullFormulaText;
    navigator.clipboard.writeText(text);
    setIsFormulaCopied(true);
    setTimeout(() => setIsFormulaCopied(false), 2000);
  };

  return (
    <Card className="border border-border/80 shadow-xs hover:border-border transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Receipt className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              {bill.title}
            </CardTitle>
            {bill.date && (
              <span className="text-xs text-muted-foreground">{bill.date}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            {isEditingTotal ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={tempTotal}
                  onChange={(e) => setTempTotal(e.target.value)}
                  className="h-7 text-xs w-28 text-right font-bold"
                  autoFocus
                />
                <Button size="icon-xs" variant="default" onClick={saveTotalEdit} title="Lưu tổng tiền">
                  <Check className="size-3" />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={() => setIsEditingTotal(false)} title="Hủy">
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <div
                className="group flex items-center justify-end gap-1.5 cursor-pointer"
                onClick={() => {
                  setTempTotal(String(billCalc.billTotal));
                  setIsEditingTotal(true);
                }}
                title="Bấm để sửa tổng tiền thanh toán"
              >
                <div className="text-base font-bold text-foreground hover:text-primary transition-colors">
                  {formatVND(billCalc.billTotal)}
                </div>
                <Edit2 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              {bill.products.length} món
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteBill(bill.id)}
            title="Xóa hoá đơn này"
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Xoá bill</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-4 flex flex-col gap-2">
            <div
              onClick={() => setIsReceiptOpen(true)}
              className="group relative flex flex-col items-center justify-center rounded-lg border border-border/80 bg-muted/40 p-2.5 cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-xs"
            >
              {bill.image ? (
                <div className="relative w-full aspect-[3/4] max-h-56 flex items-center justify-center overflow-hidden rounded bg-white">
                  <img
                    src={bill.image}
                    alt={bill.title}
                    className="w-full h-full object-contain p-1 transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-xs">
                      <ZoomIn className="size-3" /> Xem ảnh bill
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Receipt className="size-8 stroke-[1.5] mb-1" />
                  <span className="text-xs">Không có ảnh bill</span>
                </div>
              )}

              <div className="w-full mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Receipt className="size-3 text-muted-foreground" />
                  Ảnh hoá đơn
                </span>
                <span>Nhấn để phóng to</span>
              </div>
            </div>

            {billCalc.hasUnassigned && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  Có {billCalc.unassignedItems.length} món chưa chọn người chia!
                </span>
              </div>
            )}
          </div>

          <div className="md:col-span-8 flex flex-col gap-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/60 text-xs font-semibold text-muted-foreground">
              <span>Món ăn / Dịch vụ</span>
              <span>Chia cho</span>
            </div>

            {bill.products.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chưa có món nào trong hoá đơn này.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/40">
                {bill.products.map((product) => {
                  const isEditing = editingProductId === product.id;

                  if (isEditing) {
                    return (
                      <div
                        key={product.id}
                        className="py-2 flex items-center gap-2 bg-muted/30 p-2 rounded-md"
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Tên món"
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) =>
                            setEditPrice(Number(e.target.value))
                          }
                          placeholder="Giá tiền"
                          className="h-7 text-xs w-24"
                        />
                        <Button
                          variant="default"
                          size="icon-xs"
                          onClick={saveProductEdit}
                          title="Lưu"
                        >
                          <Check className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={cancelProductEdit}
                          title="Hủy"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={product.id}
                      className="group py-2 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 px-1.5 rounded transition-colors"
                    >
                      <div className="flex items-baseline gap-2 min-w-0 flex-1">
                        <span className="font-medium text-foreground truncate">
                          {product.name}
                        </span>
                        <span
                          className={cn(
                            "font-semibold shrink-0",
                            product.price < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground/90"
                          )}
                        >
                          {formatVND(product.price)}
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-1">
                          <button
                            type="button"
                            onClick={() => startEditing(product)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                            title="Sửa tên hoặc giá"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded cursor-pointer"
                            title="Xóa món này"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>

                      <ParticipantAssignment
                        participants={participants}
                        selectedIds={product.participantIds}
                        productPrice={product.price}
                        onSelectionChange={(newPids) =>
                          handleProductParticipantsChange(product.id, newPids)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {isAddingProduct ? (
              <form
                onSubmit={handleAddProduct}
                className="mt-2 p-2.5 rounded-md border border-border bg-muted/20 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    placeholder="Tên món (vd: Nước ngọt, Đậu phộng...)"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <Input
                    placeholder="Giá (vd: 25000)"
                    type="number"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="h-7 text-xs w-28"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsAddingProduct(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" size="xs">
                    Thêm vào bill
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                className="self-start text-xs text-muted-foreground hover:text-foreground mt-1"
                onClick={() => setIsAddingProduct(true)}
              >
                <Plus data-icon="inline-start" />
                Thêm món vào bill này
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-1" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-foreground uppercase">
                <Calculator className="size-3.5 text-primary" />
                 Cách tính - {bill.title}
              </span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal hidden sm:inline-flex">
                Công thức
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {billCalc.formulaBreakdown && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyFormulas}
                  title="Sao chép công thức tính"
                >
                  {isFormulaCopied ? (
                    <>
                      <Check className="size-3 text-emerald-500 mr-1" />
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 mr-1" />
                      Copy công thức
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {billCalc.formulaBreakdown &&
          billCalc.formulaBreakdown.formulas.length > 0 ? (
            <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/80 bg-muted/30 font-mono text-xs shadow-2xs">
              {billCalc.formulaBreakdown.formulas.map((f) => (
                <div
                  key={f.participantId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-2 rounded-md hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-foreground font-sans w-16 shrink-0">
                      {f.participantName}
                    </span>
                    <span className="text-muted-foreground shrink-0">:</span>
                    <span className="text-foreground/90 overflow-x-auto whitespace-nowrap">
                      {f.formula}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pl-2">
                    <span className="text-muted-foreground">=</span>
                    <span className="font-bold text-primary text-sm font-mono">
                      {f.formattedTotal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-xs text-muted-foreground italic rounded-lg border border-dashed border-border bg-muted/10 text-center">
              Chưa có món nào được chọn người chia để tính toán.
            </div>
          )}
        </div>
      </CardContent>

      <ReceiptViewerDialog
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        imageUrl={bill.image}
        title={bill.title}
      />
    </Card>
  );
}
