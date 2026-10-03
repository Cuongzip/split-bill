"use client";

import * as React from "react";
import {
  Participant,
  Bill,
  StandaloneProduct,
  Session,
} from "@/lib/bill-calculator";
import { AppHeader } from "@/components/app-header";
import { BillCard } from "@/components/bill-card";
import { StandaloneProducts } from "@/components/standalone-products";
import { GlobalSummary } from "@/components/global-summary";
import { AddBillDialog } from "@/components/add-bill-dialog";
import { AddStandaloneDialog } from "@/components/add-standalone-dialog";
import { ParticipantsDialog } from "@/components/participants-dialog";
import { MobileSummarySheet } from "@/components/mobile-summary-sheet";
import { SessionTabs } from "@/components/session-tabs";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Loader2 } from "lucide-react";

export default function Home() {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string>("");
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [bills, setBills] = React.useState<Bill[]>([]);
  const [standaloneProducts, setStandaloneProducts] = React.useState<
    StandaloneProduct[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isAddBillOpen, setIsAddBillOpen] = React.useState(false);
  const [isAddStandaloneOpen, setIsAddStandaloneOpen] = React.useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = React.useState(false);
  const hasLoaded = React.useRef(false);

  React.useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [pRes, bRes, sRes, sessRes] = await Promise.all([
          fetch("/api/participants"),
          fetch("/api/bills"),
          fetch("/api/standalone-products"),
          fetch("/api/sessions"),
        ]);

        const [pData, bData, sData, sessData] = await Promise.all([
          pRes.json(),
          bRes.json(),
          sRes.json(),
          sessRes.json(),
        ]);

        let loadedSessions: Session[] =
          sessData.success && sessData.data ? sessData.data : [];

        if (loadedSessions.length === 0) {
          const today = new Date().toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
          const defaultSessionName = `Đi ăn ngày ${today}`;
          try {
            const createRes = await fetch("/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: defaultSessionName }),
            });
            const createJson = await createRes.json();
            if (createJson.success && createJson.data) {
              loadedSessions = [createJson.data];
            }
          } catch (e) {
            console.error("Error creating default session:", e);
          }
        }

        setSessions(loadedSessions);
        if (loadedSessions.length > 0) {
          setActiveSessionId(loadedSessions[0].id);
        }

        if (pData.success && pData.data) setParticipants(pData.data);
        if (bData.success && bData.data) setBills(bData.data);
        if (sData.success && sData.data) setStandaloneProducts(sData.data);
      } catch (err) {
        console.error("Error loading data from API:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCreateSession = async (name: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSessions((prev) => [json.data, ...prev]);
        setActiveSessionId(json.data.id);
      }
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  const handleRenameSession = async (sessionId: string, newName: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, name: newName } : s))
    );
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
    } catch (err) {
      console.error("Error renaming session:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    setBills((prev) =>
      prev.filter((b) => (b.sessionId || "default") !== sessionId)
    );
    setStandaloneProducts((prev) =>
      prev.filter((s) => (s.sessionId || "default") !== sessionId)
    );

    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        const today = new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
        handleCreateSession(`Đi ăn ngày ${today}`);
      }
    }

    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleAddBill = async (newBill: Bill) => {
    const billWithSession = {
      ...newBill,
      sessionId: newBill.sessionId || activeSessionId || "default",
    };
    setBills((prev) => [billWithSession, ...prev]);
    try {
      await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billWithSession),
      });
    } catch (err) {
      console.error("Error creating bill via API:", err);
    }
  };

  const handleUpdateBill = async (updatedBill: Bill) => {
    setBills((prev) =>
      prev.map((b) => (b.id === updatedBill.id ? updatedBill : b))
    );
    try {
      await fetch(`/api/bills/${updatedBill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedBill.title,
          date: updatedBill.date,
          image: updatedBill.image,
          totalAmount: updatedBill.totalAmount,
          products: updatedBill.products,
        }),
      });
    } catch (err) {
      console.error("Error updating bill via API:", err);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    try {
      await fetch(`/api/bills/${billId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting bill via API:", err);
    }
  };

  const handleUpdateStandalone = async (
    newActiveProducts: StandaloneProduct[]
  ) => {
    const otherSessionStandalones = standaloneProducts.filter(
      (s) => (s.sessionId || "default") !== (activeSessionId || "default")
    );
    const updatedAll = [...otherSessionStandalones, ...newActiveProducts];

    const currentSessionStandalones = standaloneProducts.filter(
      (s) => (s.sessionId || "default") === (activeSessionId || "default")
    );
    const prevActiveIds = new Set(currentSessionStandalones.map((p) => p.id));
    const newActiveIds = new Set(newActiveProducts.map((p) => p.id));

    const deletedIds = currentSessionStandalones
      .filter((p) => !newActiveIds.has(p.id))
      .map((p) => p.id);

    const updatedOrAdded = newActiveProducts.filter((p) => {
      const prev = currentSessionStandalones.find((o) => o.id === p.id);
      return (
        !prev ||
        prev.name !== p.name ||
        prev.price !== p.price ||
        prev.note !== p.note ||
        JSON.stringify(prev.participantIds) !== JSON.stringify(p.participantIds)
      );
    });

    setStandaloneProducts(updatedAll);

    for (const delId of deletedIds) {
      fetch(`/api/standalone-products/${delId}`, { method: "DELETE" }).catch(
        console.error
      );
    }

    for (const item of updatedOrAdded) {
      if (prevActiveIds.has(item.id)) {
        fetch(`/api/standalone-products/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }).catch(console.error);
      } else {
        fetch("/api/standalone-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            sessionId: activeSessionId || "default",
          }),
        }).catch(console.error);
      }
    }
  };

  const handleAddStandalone = async (product: StandaloneProduct) => {
    const productWithSession = {
      ...product,
      sessionId: product.sessionId || activeSessionId || "default",
    };
    setStandaloneProducts((prev) => [...prev, productWithSession]);
    try {
      await fetch("/api/standalone-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productWithSession),
      });
    } catch (err) {
      console.error("Error adding standalone product via API:", err);
    }
  };

  const handleUpdateParticipants = async (newParticipants: Participant[]) => {
    const prevIds = new Set(participants.map((p) => p.id));
    const newIds = new Set(newParticipants.map((p) => p.id));

    const added = newParticipants.filter((p) => !prevIds.has(p.id));
    const removed = participants.filter((p) => !newIds.has(p.id));

    setParticipants(newParticipants);

    const allNewPids = newParticipants.map((p) => p.id);

    if (added.length > 0) {
      setBills((prev) => {
        const updated = prev.map((b) => ({
          ...b,
          products: b.products.map((prod) => {
            const hadNoParticipants = prod.participantIds.length === 0;
            const hadAllPrevious =
              participants.length > 0 &&
              participants.every((p) => prod.participantIds.includes(p.id));

            if (hadNoParticipants || hadAllPrevious) {
              return { ...prod, participantIds: allNewPids };
            }
            return prod;
          }),
        }));

        for (const b of updated) {
          fetch(`/api/bills/${b.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: b.products }),
          }).catch(console.error);
        }

        return updated;
      });

      setStandaloneProducts((prev) => {
        const updated = prev.map((s) => {
          const hadNoParticipants = s.participantIds.length === 0;
          const hadAllPrevious =
            participants.length > 0 &&
            participants.every((p) => s.participantIds.includes(p.id));

          if (hadNoParticipants || hadAllPrevious) {
            return { ...s, participantIds: allNewPids };
          }
          return s;
        });

        for (const s of updated) {
          fetch(`/api/standalone-products/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantIds: s.participantIds }),
          }).catch(console.error);
        }

        return updated;
      });
    }

    for (const p of added) {
      fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      }).catch(console.error);
    }

    for (const p of removed) {
      await fetch(`/api/participants/${p.id}`, { method: "DELETE" }).catch(
        console.error
      );
      setBills((prev) =>
        prev.map((b) => ({
          ...b,
          products: b.products.map((prod) => ({
            ...prod,
            participantIds: prod.participantIds.filter((pid) => pid !== p.id),
          })),
        }))
      );
      setStandaloneProducts((prev) =>
        prev.map((s) => ({
          ...s,
          participantIds: s.participantIds.filter((pid) => pid !== p.id),
        }))
      );
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setParticipants(json.data.participants || []);
        setBills(json.data.bills || []);
        setStandaloneProducts(json.data.standaloneProducts || []);
        const today = new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
        const defaultSess: Session = {
          id: `session_${Date.now()}`,
          name: `Đi ăn ngày ${today}`,
        };
        setSessions([defaultSess]);
        setActiveSessionId(defaultSess.id);
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaultSess),
        }).catch(console.error);
      }
    } catch (err) {
      console.error("Error resetting data via API:", err);
    }
  };

  const activeBills = bills.filter(
    (b) => (b.sessionId || "default") === (activeSessionId || "default")
  );
  const activeStandaloneProducts = standaloneProducts.filter(
    (s) => (s.sessionId || "default") === (activeSessionId || "default")
  );
  const currentSession = sessions.find((s) => s.id === activeSessionId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Đang đồng bộ dữ liệu BillSplit...
        </p>
      </div>
    );
  }

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
        {/* Session Tabs */}
        {sessions.length > 0 && (
          <SessionTabs
            sessions={sessions}
            activeSessionId={activeSessionId}
            bills={bills}
            standaloneProducts={standaloneProducts}
            onSelectSession={setActiveSessionId}
            onCreateSession={handleCreateSession}
            onRenameSession={handleRenameSession}
            onDeleteSession={handleDeleteSession}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">
            {activeBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Receipt className="size-6" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-4">
                  Chưa có hoá đơn nào trong nhóm &quot;{currentSession?.name || "này"}&quot;
                </h3>
               
                <Button size="sm" onClick={() => setIsAddBillOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Thêm bill vào nhóm
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {activeBills.map((bill) => (
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
              products={activeStandaloneProducts}
              participants={participants}
              onUpdateProducts={handleUpdateStandalone}
              onOpenAddModal={() => setIsAddStandaloneOpen(true)}
            />
          </div>

          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-20 self-start">
            <GlobalSummary
              bills={activeBills}
              standaloneProducts={activeStandaloneProducts}
              participants={participants}
            />
          </div>
        </div>
      </main>

      <MobileSummarySheet
        bills={activeBills}
        standaloneProducts={activeStandaloneProducts}
        participants={participants}
      />

      <AddBillDialog
        isOpen={isAddBillOpen}
        onOpenChange={setIsAddBillOpen}
        participants={participants}
        onAddBill={handleAddBill}
        currentBillCount={activeBills.length}
        sessionId={activeSessionId}
      />

      <AddStandaloneDialog
        isOpen={isAddStandaloneOpen}
        onOpenChange={setIsAddStandaloneOpen}
        participants={participants}
        onAddProduct={handleAddStandalone}
        sessionId={activeSessionId}
      />

      <ParticipantsDialog
        isOpen={isParticipantsOpen}
        onOpenChange={setIsParticipantsOpen}
        participants={participants}
        onUpdateParticipants={handleUpdateParticipants}
      />
    </div>
  );
}
