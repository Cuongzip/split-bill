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
  Edit2,
  Trash2,
  Layers,
  Check,
  ChevronsUpDown,
  Search,
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
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newSessionName, setNewSessionName] = React.useState("");

  const [renamingSession, setRenamingSession] = React.useState<Session | null>(null);
  const [editName, setEditName] = React.useState("");

  const [deletingSession, setDeletingSession] = React.useState<Session | null>(null);

  // Sắp xếp session: Mới nhất luôn ở trên đầu (dựa vào timestamp trong ID hoặc ngày)
  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = parseInt(a.id.replace(/\D/g, "") || "0", 10);
      const timeB = parseInt(b.id.replace(/\D/g, "") || "0", 10);
      if (timeA && timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });
  }, [sessions]);

  // Lọc theo từ khóa tìm kiếm
  const filteredSessions = React.useMemo(() => {
    if (!searchTerm.trim()) return sortedSessions;
    const term = searchTerm.toLowerCase();
    return sortedSessions.filter((s) => s.name.toLowerCase().includes(term));
  }, [sortedSessions, searchTerm]);

  // Session đang được chọn
  const activeSession = React.useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sortedSessions[0];
  }, [sessions, activeSessionId, sortedSessions]);

  // Thống kê bill của session hiện tại
  const activeSessionBills = React.useMemo(() => {
    if (!activeSession) return [];
    return bills.filter((b) => (b.sessionId || "default") === activeSession.id);
  }, [bills, activeSession]);

  const activeSessionStandalones = React.useMemo(() => {
    if (!activeSession) return [];
    return standaloneProducts.filter((s) => (s.sessionId || "default") === activeSession.id);
  }, [standaloneProducts, activeSession]);

  const handleOpenCreate = () => {
    const today = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    setNewSessionName(`Đi ăn ngày ${today}`);
    setIsDropdownOpen(false);
    setIsCreateOpen(true);
  };

  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    await onCreateSession(newSessionName.trim());
    setIsCreateOpen(false);
    setNewSessionName("");
  };

  const handleOpenRename = (session: Session, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRenamingSession(session);
    setEditName(session.name);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingSession || !editName.trim()) return;
    await onRenameSession(renamingSession.id, editName.trim());
    setRenamingSession(null);
  };

  const handleOpenDelete = (session: Session, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingSession(session);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    await onDeleteSession(deletingSession.id);
    setDeletingSession(null);
  };

  return (
    <div className="w-full mb-6">
      <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Bên trái: Dropdown chọn Session */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Layers className="size-4" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Bữa ăn / Nhóm hiện tại
              </span>

              <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <PopoverTrigger
                  type="button"
                  aria-expanded={isDropdownOpen}
                  className="flex items-center justify-between h-10 mt-0.5 px-3 rounded-xl border border-border/80 hover:bg-muted/50 bg-background text-left font-normal shadow-xs group max-w-full sm:max-w-md cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
                    <span className="font-semibold text-foreground text-sm truncate">
                      {activeSession?.name || "Chọn nhóm..."}
                    </span>
                    <Badge
                      variant="secondary"
                      className="px-2 py-0 h-5 text-[10px] font-normal bg-primary/10 text-primary border-primary/20 shrink-0"
                    >
                      {activeSessionBills.length} bill
                      {activeSessionStandalones.length > 0 && ` + ${activeSessionStandalones.length} riêng`}
                    </Badge>
                  </div>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  className="w-[calc(100vw-2rem)] sm:w-96 p-2 rounded-2xl shadow-xl border-border bg-card"
                >
                  <div className="flex items-center justify-between pb-2 px-1 border-b border-border/60">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Danh sách nhóm ({sessions.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded">
                      Mới nhất ở trên
                    </span>
                  </div>

                  {sessions.length > 4 && (
                    <div className="relative my-2">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm nhóm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-lg"
                      />
                    </div>
                  )}

                  {/* Danh sách các session (mới nhất ở trên) */}
                  <div className="max-h-72 overflow-y-auto py-1 flex flex-col gap-1 pr-0.5">
                    {filteredSessions.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        Không tìm thấy nhóm phù hợp.
                      </div>
                    ) : (
                      filteredSessions.map((session, index) => {
                        const isCurrent = session.id === activeSessionId;
                        const sBills = bills.filter(
                          (b) => (b.sessionId || "default") === session.id
                        );
                        const sStandalones = standaloneProducts.filter(
                          (s) => (s.sessionId || "default") === session.id
                        );

                        return (
                          <div
                            key={session.id}
                            onClick={() => {
                              onSelectSession(session.id);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all select-none border",
                              isCurrent
                                ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                                : "hover:bg-muted/70 border-transparent text-foreground/80"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <div
                                className={cn(
                                  "size-4 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                  isCurrent
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30 text-transparent"
                                )}
                              >
                                <Check className="size-2.5 stroke-[3]" />
                              </div>

                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate">{session.name}</span>
                                  {index === 0 && (
                                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-medium shrink-0">
                                      Mới nhất
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  {session.date || "Gần đây"} • {sBills.length} bill
                                  {sStandalones.length > 0 && ` + ${sStandalones.length} riêng`}
                                </span>
                              </div>
                            </div>

                            {/* Nút tác vụ sửa/xoá trong menu */}
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                                onClick={(e) => handleOpenRename(session, e)}
                                title="Đổi tên nhóm"
                              >
                                <Edit2 className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={sessions.length <= 1}
                                className={cn(
                                  "size-6 rounded-md",
                                  sessions.length <= 1
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                )}
                                onClick={(e) => handleOpenDelete(session, e)}
                                title="Xoá nhóm"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 mt-1 border-t border-border/60">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenCreate}
                      className="w-full h-8 justify-center text-xs text-primary font-medium gap-1.5 hover:bg-primary/10 rounded-xl"
                    >
                      <Plus className="size-3.5" />
                      <span>Tạo nhóm chia tiền mới</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Bên phải: Nút tác vụ nhanh */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            {activeSession && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenRename(activeSession)}
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl border border-transparent hover:border-border/60"
                  title="Đổi tên nhóm hiện tại"
                >
                  <Edit2 className="size-3.5" />
                  <span className="hidden sm:inline">Đổi tên</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={sessions.length <= 1}
                  onClick={() => handleOpenDelete(activeSession)}
                  className={cn(
                    "h-9 px-2.5 text-xs gap-1.5 rounded-xl border border-transparent",
                    sessions.length <= 1
                      ? "opacity-40 cursor-not-allowed text-muted-foreground"
                      : "text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                  )}
                  title={sessions.length <= 1 ? "Không thể xoá nhóm duy nhất" : "Xoá nhóm hiện tại"}
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">Xoá nhóm</span>
                </Button>
              </>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 px-3 text-xs gap-1.5 rounded-xl font-medium shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Tạo nhóm mới</span>
            </Button>
          </div>

        </div>
      </div>

      {/* Dialog Tạo Nhóm Mới */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FolderOpen className="size-4 text-primary" />
              <span>Tạo nhóm chia tiền mới</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mỗi nhóm sẽ tính toán chi phí và hoá đơn độc lập (ví dụ: Đi ăn ngày 03/10, Tiệc sinh nhật, Đi cafe...).
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
                placeholder="Ví dụ: Đi ăn lẩu ngày 03/10..."
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                autoFocus
                required
                className="text-sm rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl"
              >
                Huỷ
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
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
        <DialogContent className="sm:max-w-md p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Edit2 className="size-4 text-primary" />
              <span>Đổi tên nhóm</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật lại tên nhóm để dễ nhận diện các bữa ăn khác nhau.
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
                className="text-sm rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRenamingSession(null)}
                className="rounded-xl"
              >
                Huỷ
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
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
        <DialogContent className="sm:max-w-md p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
              <Trash2 className="size-4" />
              <span>Xoá nhóm &quot;{deletingSession?.name}&quot;?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/80 pt-1 leading-relaxed">
              Bạn có chắc muốn xoá nhóm này?{" "}
              <strong className="text-destructive font-medium">
                Tất cả các hoá đơn và chi phí riêng thuộc nhóm này sẽ bị xoá vĩnh viễn.
              </strong>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingSession(null)}
              className="rounded-xl"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="rounded-xl"
            >
              Xoá nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
