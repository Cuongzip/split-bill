"use client";

import * as React from "react";
import {
  Participant,
  Bill,
  StandaloneProduct,
} from "@/lib/bill-calculator";
import {
  INITIAL_PARTICIPANTS,
  INITIAL_BILLS,
  INITIAL_STANDALONE,
} from "@/lib/mock-data";
import { AppHeader } from "@/components/app-header";
import { BillCard } from "@/components/bill-card";
import { StandaloneProducts } from "@/components/standalone-products";
import { GlobalSummary } from "@/components/global-summary";
import { AddBillDialog } from "@/components/add-bill-dialog";
import { AddStandaloneDialog } from "@/components/add-standalone-dialog";
import { ParticipantsDialog } from "@/components/participants-dialog";
import { MobileSummarySheet } from "@/components/mobile-summary-sheet";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, } from "lucide-react";

export default function Home() {
  const [participants, setParticipants] =
    React.useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [bills, setBills] = React.useState<Bill[]>(INITIAL_BILLS);
  const [standaloneProducts, setStandaloneProducts] =
    React.useState<StandaloneProduct[]>(INITIAL_STANDALONE);

  const [isAddBillOpen, setIsAddBillOpen] = React.useState(false);
  const [isAddStandaloneOpen, setIsAddStandaloneOpen] = React.useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = React.useState(false);

  const handleAddBill = (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills((prev) =>
      prev.map((b) => (b.id === updatedBill.id ? updatedBill : b))
    );
  };

  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
  };

  const handleUpdateStandalone = (newProducts: StandaloneProduct[]) => {
    setStandaloneProducts(newProducts);
  };

  const handleAddStandalone = (product: StandaloneProduct) => {
    setStandaloneProducts((prev) => [...prev, product]);
  };

  const handleResetData = () => {
    setParticipants(INITIAL_PARTICIPANTS);
    setBills(INITIAL_BILLS);
    setStandaloneProducts(INITIAL_STANDALONE);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased pb-20 lg:pb-12">
      <AppHeader
        participants={participants}
        onOpenAddBill={() => setIsAddBillOpen(true)}
        onOpenAddStandalone={() => setIsAddStandaloneOpen(true)}
        onOpenParticipants={() => setIsParticipantsOpen(true)}
        onResetSampleData={handleResetData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">
            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Receipt className="size-6" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                  Chưa có hoá đơn nào
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Bấm nút bên dưới để tải ảnh hoá đơn hoặc dùng bill mẫu thử nghiệm.
                </p>
                <Button size="sm" onClick={() => setIsAddBillOpen(true)}>
                  <Plus data-icon="inline-start" />
               Thêm bill đầu tiên
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {bills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    participants={participants}
                    onUpdateBill={handleUpdateBill}
                    onDeleteBill={handleDeleteBill}
                  />
                ))}
              </div>
            )}

            <StandaloneProducts
              products={standaloneProducts}
              participants={participants}
              onUpdateProducts={handleUpdateStandalone}
              onOpenAddModal={() => setIsAddStandaloneOpen(true)}
            />
          </div>

          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-20 self-start">
            <GlobalSummary
              bills={bills}
              standaloneProducts={standaloneProducts}
              participants={participants}
            />
          </div>
        </div>
      </main>

      <MobileSummarySheet
        bills={bills}
        standaloneProducts={standaloneProducts}
        participants={participants}
      />

      <AddBillDialog
        isOpen={isAddBillOpen}
        onOpenChange={setIsAddBillOpen}
        participants={participants}
        onAddBill={handleAddBill}
        currentBillCount={bills.length}
      />

      <AddStandaloneDialog
        isOpen={isAddStandaloneOpen}
        onOpenChange={setIsAddStandaloneOpen}
        participants={participants}
        onAddProduct={handleAddStandalone}
      />

      <ParticipantsDialog
        isOpen={isParticipantsOpen}
        onOpenChange={setIsParticipantsOpen}
        participants={participants}
        onUpdateParticipants={setParticipants}
      />
    </div>
  );
}
