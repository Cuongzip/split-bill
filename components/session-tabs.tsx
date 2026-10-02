"use client";

import * as React from "react";
import { Session, Bill, StandaloneProduct } from "@/lib/bill-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  FolderOpen,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "cn";

interface SessionTabsProps {
  sessions: Session[];
  activeSessionId: string;
  bills: Bill[];
  standaloneProducts: StandaloneProduct[];
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (name: string) => Promise<void> | void;
  onRenameSession: (sessionId: string, newName: string) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
}

export function SessionTabs({
  sessions,
  activeSessionId,
  bills,
  standaloneProducts,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
}: SessionTabsProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newSessionName, setNewSessionName] = React.useState("");

  const [renamingSession, setRenamingSession] = React.useState<Session | null>(
    null
  );
  const [editName, setEditName] = React.useState("");

  const [deletingSession, setDeletingSession] = React.useState<Session | null>(
    null
  );

  const handleOpenCreate = () => {
    const today = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    setNewSessionName(`Đi ăn ngày ${today}`);
    setIsCreateOpen(true);
  };

  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    await onCreateSession(newSessionName.trim());
    setIsCreateOpen(false);
    setNewSessionName("");
  };

  const handleOpenRename = (session: Session) => {
    setRenamingSession(session);
    setEditName(session.name);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingSession || !editName.trim()) return;
    await onRenameSession(renamingSession.id, editName.trim());
    setRenamingSession(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    await onDeleteSession(deletingSession.id);
    setDeletingSession(null);
  };

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nhóm chia tiền (Sessions)
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenCreate}
          className="h-7 text-xs gap-1.5 px-2.5 font-medium border-dashed hover:border-primary/50"
        >
          <Plus className="size-3.5 text-primary" />
          <span>Thêm nhóm mới</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const sessionBills = bills.filter(
            (b) => (b.sessionId || "default") === session.id
          );
          const sessionStandalones = standaloneProducts.filter(
            (s) => (s.sessionId || "default") === session.id
          );
          const totalItems = sessionBills.length + sessionStandalones.length;

          return (
            <div
              key={session.id}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all whitespace-nowrap select-none",
                isActive
                  ? "bg-card text-foreground border-primary/40 shadow-xs ring-1 ring-primary/20 font-semibold"
                  : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/70 hover:text-foreground"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div
                className={cn(
                  "size-2 rounded-full transition-colors",
                  isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                )}
              />

              <span className="max-w-[150px] sm:max-w-[200px] truncate">
                {session.name}
              </span>

              <Badge
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "px-1.5 py-0 h-4 text-[10px] font-normal transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {sessionBills.length} bill
                {sessionStandalones.length > 0 && ` + ${sessionStandalones.length}`}
              </Badge>

              <Popover>
                <PopoverTrigger
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 -mr-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-background/80 text-muted-foreground hover:text-foreground transition-opacity"
                  title="Tuỳ chọn nhóm"
                >
                  <MoreVertical className="size-3.5" />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-40 p-1 flex flex-col gap-0.5 text-xs shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenRename(session)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-left w-full transition-colors"
                  >
                    <Edit2 className="size-3.5 text-muted-foreground" />
                    <span>Đổi tên nhóm</span>
                  </button>
                  <button
                    type="button"
                    disabled={sessions.length <= 1}
                    onClick={() => setDeletingSession(session)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-left w-full transition-colors",
                      sessions.length <= 1
                        ? "opacity-50 cursor-not-allowed text-muted-foreground"
                        : "hover:bg-destructive/10 text-destructive"
                    )}
                    title={
                      sessions.length <= 1
                        ? "Không thể xoá nhóm duy nhất"
                        : "Xoá nhóm và dữ liệu trong nhóm"
                    }
                  >
                    <Trash2 className="size-3.5" />
                    <span>Xoá nhóm</span>
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenCreate}
          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-3 rounded-xl border border-dashed border-border/80 hover:border-primary/50 whitespace-nowrap"
        >
          <Plus className="size-3.5" />
          <span>Tạo nhóm mới</span>
        </Button>
      </div>

      {/* Dialog Tạo Nhóm Mới */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FolderOpen className="size-4 text-primary" />
              <span>Tạo nhóm chia tiền mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mỗi nhóm sẽ tính toán chi phí và chia tiền độc lập (ví dụ: Đi ăn
              ngày 02/10, Tiệc sinh nhật, Đi cafe cuối tuần...).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCreate} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="session-name"
                className="text-xs font-semibold text-foreground"
              >
                Tên nhóm
              </label>
              <Input
                id="session-name"
                placeholder="Ví dụ: Đi ăn ngày 05/10..."
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                autoFocus
                required
                className="text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Huỷ
              </Button>
              <Button type="submit" size="sm">
                Tạo nhóm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Đổi Tên Nhóm */}
      <Dialog
        open={Boolean(renamingSession)}
        onOpenChange={(open) => !open && setRenamingSession(null)}
      >
        <DialogContent className="sm:max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Edit2 className="size-4 text-primary" />
              <span>Đổi tên nhóm</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật lại tên nhóm để dễ phân biệt các bữa ăn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRename} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="rename-session"
                className="text-xs font-semibold text-foreground"
              >
                Tên mới
              </label>
              <Input
                id="rename-session"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                required
                className="text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRenamingSession(null)}
              >
                Huỷ
              </Button>
              <Button type="submit" size="sm">
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Xác Nhận Xoá Nhóm */}
      <Dialog
        open={Boolean(deletingSession)}
        onOpenChange={(open) => !open && setDeletingSession(null)}
      >
        <DialogContent className="sm:max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
              <Trash2 className="size-4" />
              <span>Xoá nhóm &quot;{deletingSession?.name}&quot;?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/80 pt-1 leading-relaxed">
              Bạn có chắc muốn xoá nhóm này?{" "}
              <strong className="text-destructive">
                Tất cả các hoá đơn và chi phí riêng thuộc nhóm này sẽ bị xoá
                hoàn toàn.
              </strong>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingSession(null)}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Xoá nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
