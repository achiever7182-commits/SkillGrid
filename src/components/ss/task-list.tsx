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
import {
  awardDailyGoalComplete,
  awardTaskCompletion,
  awardTaskTime100,
  checkTaskMilestones,
} from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";
import { TaskDialog } from "./task-dialog";

export type Instance = {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
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
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null; instance?: Instance }>({
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

      let xpResult = null;
      if (completed && user?.id) {
        const sName = subjects.find((s) => s.id === i.subject_id)?.name;
        xpResult = await awardTaskCompletion(user.id, i.id, i.title, sName);
        await checkTaskMilestones(user.id, i.date);
        await awardTaskTime100(user.id, i.id, i.title);
      }
      
      return { completed, xpResult };
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
        if (pct >= 100) {
          const res = await awardDailyGoalComplete(user.id, date);
          if (res?.event) toast.success(`Daily goal complete! +${res.event.amount} XP`);
        }
        
        // Use a better type cast to get the week property
        const prog = qc.getQueryData<any>(["progress", user.id]);
        
        if (pct >= 150) {
           const { checkAndAwardAchievements } = await import("@/lib/rewards");
           await checkAndAwardAchievements(user.id, "daily_overachiever", 1);
        }

        if (prog?.week?.pct >= 100) {
          const { awardWeeklyGoalComplete } = await import("@/lib/rewards");
          const weekStartStr = prog.weekDays?.[0]?.day || date; 
          const wRes = await awardWeeklyGoalComplete(user.id, `week-${weekStartStr}`);
          if (wRes?.event) toast.success(`Weekly goal complete! +${wRes.event.amount} XP`);
        }

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
          
          // XP for specific streak milestones
          const { awardXP, XP_REWARDS, checkAndAwardAchievements } = await import("@/lib/rewards");
          let streakXp = 0;
          if (streak === 3) streakXp = XP_REWARDS.STREAK_3;
          if (streak === 7) streakXp = XP_REWARDS.STREAK_7;
          if (streak === 30) streakXp = XP_REWARDS.STREAK_30;
          
          if (streakXp > 0) {
            const sxpRes = await awardXP(user.id, streakXp, `${streak}-day streak`, `streak_${streak}`, String(streak));
            if (sxpRes?.event) toast.success(`${streak}-day streak! +${streakXp} XP`);
          }
          await checkAndAwardAchievements(user.id, "streak_days", streak);
        }
      }
    },
    onSuccess: (data) => {
      if (data?.xpResult?.event) {
        toast.success(`+${data.xpResult.event.amount} XP: ${data.xpResult.event.reason}`);
      }
      if (data?.xpResult?.leveledUp) {
        toast.success(`🎉 LEVEL UP! You reached Level ${data.xpResult.newLevel}`, {
          duration: 5000,
          position: "top-center",
        });
      }
    }
  });

  async function editTask(i: Instance) {
    const { data } = await supabase.from("tasks").select("*").eq("id", i.task_id).single();
    if (data) setDialog({ open: true, task: data, instance: i });
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
        <div className="space-y-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-16 animate-pulse rounded-md bg-secondary/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No tasks for this day"
          body="Add a task or adjust your weekly schedule to plan your study time."
          action={
            editable && (
              <Button size="sm" onClick={() => setDialog({ open: true, task: null })} className="rounded-md">
                <Plus className="size-4 mr-2" />
                Add task
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((i) => {
            const s = subj(i.subject_id);
            return (
              <li
                key={i.id}
                className={cn(
                  "group flex items-start gap-4 rounded-md border border-border/60 bg-transparent px-5 py-4 transition-all duration-300 hover:border-border",
                  i.completed && "border-primary/30 bg-primary/5",
                )}
              >
                <button
                  onClick={() => toggle.mutate(i)}
                  aria-label={i.completed ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "grid size-5 mt-0.5 shrink-0 place-items-center rounded-sm border-2 transition-all duration-300 active:scale-90",
                    i.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 hover:border-primary/60 bg-transparent",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3 transition-transform",
                      i.completed ? "scale-100" : "scale-0",
                    )}
                    strokeWidth={3}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate font-display text-lg font-medium transition-colors duration-300",
                      i.completed ? "text-muted-foreground line-through decoration-primary/40" : "text-foreground"
                    )}
                  >
                    {i.title}
                  </div>
                  {i.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {i.description}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-3">
                    {s && (
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    )}
                    {i.notes && (
                      <span className="inline-flex items-center gap-1 text-primary/80">
                        <NotebookPen className="size-3" strokeWidth={2} />
                        Note
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[11px] font-medium opacity-80">
                      {fmtMinutes(i.planned_minutes)}
                    </span>
                  </div>
                </div>
                
                {editable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all focus:opacity-100 group-hover:opacity-100 hover:bg-secondary"
                      aria-label="Task options"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-lg shadow-sm border-border/60">
                      <DropdownMenuItem
                        onClick={() => {
                          setNoteFor(i);
                          setNote(i.notes ?? "");
                        }}
                        className="rounded-md cursor-pointer"
                      >
                        <NotebookPen className="size-4 mr-2" />
                        Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => editTask(i)} className="rounded-md cursor-pointer">
                        <Pencil className="size-4 mr-2" />
                        Edit task
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive rounded-md cursor-pointer focus:bg-destructive/10 focus:text-destructive" onClick={() => removeTask(i)}>
                        <Trash2 className="size-4 mr-2" />
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
          variant="outline"
          size="sm"
          className="mt-6 w-full rounded-md border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/20"
          onClick={() => setDialog({ open: true, task: null })}
        >
          <Plus className="size-4 mr-2" strokeWidth={1.5} />
          Plan another task
        </Button>
      )}
      <TaskDialog
        open={dialog.open}
        task={dialog.task}
        instanceId={dialog.instance?.id}
        instanceDate={dialog.instance?.date}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
      />
      <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-xl">Notes Â· {noteFor?.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you cover? Private to you."
            className="resize-none rounded-md border-border/60 focus-visible:ring-primary shadow-none mt-2"
          />
          <DialogFooter className="mt-4">
            <Button onClick={saveNote} className="rounded-md w-full sm:w-auto">Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
