"use client";

import * as React from "react";
import { Participant } from "@/lib/bill-calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, UserPlus } from "lucide-react";

interface ParticipantsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onUpdateParticipants: (newParticipants: Participant[]) => void;
}

export function ParticipantsDialog({
  isOpen,
  onOpenChange,
  participants,
  onUpdateParticipants,
}: ParticipantsDialogProps) {
  const [newName, setNewName] = React.useState("");

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newParticipant: Participant = {
      id: `p_${Date.now()}`,
      name: newName.trim(),
    };

    onUpdateParticipants([...participants, newParticipant]);
    setNewName("");
  };

  const handleRemove = (id: string) => {
    if (participants.length <= 1) return;
    onUpdateParticipants(participants.filter((p) => p.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-4 text-primary" />
            <span>Danh sách người tham gia ({participants.length})</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Thêm hoặc bớt thành viên trong nhóm để chia tiền.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <form onSubmit={handleAddParticipant} className="flex items-center gap-2">
            <Input
              placeholder="Tên thành viên mới (vd: Mai, Huy, Linh...)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-xs flex-1"
            />
            <Button type="submit" size="sm" disabled={!newName.trim()}>
              <Plus data-icon="inline-start" />
              Thêm
            </Button>
          </form>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {participants.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-md border border-border/80 text-xs bg-card"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[11px]">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-foreground">{p.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    #{idx + 1}
                  </Badge>
                  {participants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(p.id)}
                      title="Xóa người này"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
