import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MoreHorizontal, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useUser } from "@/hooks/use-session";
import { dayPct, type Task } from "@/lib/data";
import { fmtMinutes, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";
import { TaskDialog } from "./task-dialog";

export type Instance = {
  id: string;
  task_id: string;
  title: string;
  subject_id: string | null;
  date: string;
  planned_minutes: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
};

export function useInstances(date: string) {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ["instances", user?.id, date],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_instances")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .order("planned_minutes", { ascending: false });
      if (error) throw error;
      return data as Instance[];
    },
  });
}

export function TaskList({
  date = todayStr(),
  editable = true,
}: {
  date?: string;
  editable?: boolean;
}) {
  const { data: user } = useUser();
  const { data: items = [], isLoading } = useInstances(date);
  const { data: subjects = [] } = useSubjects();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });
  const [noteFor, setNoteFor] = useState<Instance | null>(null);
  const [note, setNote] = useState("");
  const subj = (id: string | null) => subjects.find((s) => s.id === id);

  const toggle = useMutation({
    mutationFn: async (i: Instance) => {
      const completed = !i.completed;
      const { error } = await supabase
        .from("task_instances")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", i.id);
      if (error) throw error;
      return completed;
    },
    onMutate: async (i) => {
      const key = ["instances", user?.id, date];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Instance[]>(key);
      qc.setQueryData<Instance[]>(key, (old) =>
        old?.map((x) => (x.id === i.id ? { ...x, completed: !x.completed } : x)),
      );
      return { prev, key };
    },
    onError: (_e, _i, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("Couldn't update task");
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["instances"] });
      qc.invalidateQueries({ queryKey: ["subject-stats"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      // Milestone: 90% of today's plan.
      const list = qc.getQueryData<Instance[]>(["instances", user?.id, date]) ?? [];
      const planned = list.reduce((a, x) => a + x.planned_minutes, 0);
      const done = list.filter((x) => x.completed).reduce((a, x) => a + x.planned_minutes, 0);
      if (user && date === todayStr()) {
        const pct = dayPct({ planned, completed: done });
        if (pct >= 90) {
          await supabase.from("activities").upsert(
            {
              user_id: user.id,
              type: "daily_goal",
              message: `completed ${Math.round(pct)}% of today's plan`,
              dedupe_key: `daily:${date}`,
            },
            { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
          );
        }
        const prog = qc.getQueryData<{ streak?: { current: number } }>(["progress", user.id]);
        const streak = prog?.streak?.current ?? 0;
        const milestones = [3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 100, 365];
        if (streak >= 3 && milestones.includes(streak)) {
          await supabase.from("activities").upsert(
            {
              user_id: user.id,
              type: "streak_milestone",
              message: `reached a ${streak}-day streak`,
              dedupe_key: `streak:${user.id}:${streak}`,
            },
            { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
          );
        }
      }
    },
  });

  async function editTask(i: Instance) {
    const { data } = await supabase.from("tasks").select("*").eq("id", i.task_id).single();
    if (data) setDialog({ open: true, task: data });
  }
  async function removeTask(i: Instance) {
    if (!confirm(`Remove "${i.title}" from your schedule? Past history is kept.`)) return;
    await supabase.from("tasks").update({ archived: true }).eq("id", i.task_id);
    await supabase
      .from("task_instances")
      .delete()
      .eq("task_id", i.task_id)
      .gte("date", todayStr())
      .eq("completed", false);
    await qc.invalidateQueries();
    toast.success("Task removed");
  }
  async function saveNote() {
    if (!noteFor) return;
    const { error } = await supabase
      .from("task_instances")
      .update({ notes: note.slice(0, 2000) })
      .eq("id", noteFor.id);
    if (error) {
      toast.error("Couldn't save note");
      return;
    }
    qc.invalidateQueries({ queryKey: ["instances"] });
    setNoteFor(null);
  }

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No tasks for this day"
          body="Add a task or adjust your weekly schedule to plan your study time."
          action={
            editable && (
              <Button size="sm" onClick={() => setDialog({ open: true, task: null })}>
                <Plus className="size-4" />
                Add task
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((i) => {
            const s = subj(i.subject_id);
            return (
              <li
                key={i.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-2.5 transition-all",
                  i.completed && "border-primary/20 bg-primary/5",
                )}
              >
                <button
                  onClick={() => toggle.mutate(i)}
                  aria-label={i.completed ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-all active:scale-90",
                    i.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 hover:border-primary",
                  )}
                >
                  <Check
                    className={cn(
                      "size-4 transition-transform",
                      i.completed ? "scale-100" : "scale-0",
                    )}
                    strokeWidth={3}
                  />
                </button>
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: s?.color ?? "var(--color-muted)" }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate font-medium transition",
                      i.completed && "text-muted-foreground line-through decoration-primary/60",
                    )}
                  >
                    {i.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s && <span>{s.name}</span>}
                    {i.notes && (
                      <span className="inline-flex items-center gap-1">
                        <NotebookPen className="size-3" />
                        note
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {fmtMinutes(i.planned_minutes)}
                </span>
                {editable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                      aria-label="Task options"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setNoteFor(i);
                          setNote(i.notes ?? "");
                        }}
                      >
                        <NotebookPen className="size-4" />
                        Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => editTask(i)}>
                        <Pencil className="size-4" />
                        Edit task
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => removeTask(i)}>
                        <Trash2 className="size-4" />
                        Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {editable && items.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-muted-foreground"
          onClick={() => setDialog({ open: true, task: null })}
        >
          <Plus className="size-4" />
          Add task
        </Button>
      )}
      <TaskDialog
        open={dialog.open}
        task={dialog.task}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
      />
      <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes · {noteFor?.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you cover? Private to you."
          />
          <DialogFooter>
            <Button onClick={saveNote}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
