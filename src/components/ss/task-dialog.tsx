import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useUser } from "@/hooks/use-session";
import { EXTRA_COLORS, ensureInstances, type Task } from "@/lib/data";
import { DAY_NAMES, daysAgo, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  instanceDate,
  instanceId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  instanceDate?: string;
  instanceId?: string;
}) {
  const { data: user } = useUser();
  const { data: subjects = [] } = useSubjects();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [newSubject, setNewSubject] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recurring, setRecurring] = useState(true);
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [applyToAll, setApplyToAll] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setSubjectId(task?.subject_id ?? "none");
    setMinutes(task?.planned_minutes ?? 60);
    setDays(task?.days_of_week ?? [1, 2, 3, 4, 5]);
    setRecurring(task?.recurring ?? true);
    setStart(task?.start_date ?? todayStr());
    setEnd(task?.end_date ?? "");
    setNewSubject("");
    setApplyToAll(true);
  }, [open, task]);

  async function save() {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Give the task a name");
      return;
    }
    if (minutes <= 0 || minutes > 1440) {
      toast.error("Duration must be between 1 and 1440 minutes");
      return;
    }
    if (recurring && days.length === 0) {
      toast.error("Pick at least one day");
      return;
    }
    if (end && end < start) {
      toast.error("End date must be after start date");
      return;
    }
    setSaving(true);
    try {
      let sid: string | null = subjectId === "none" ? null : subjectId;
      if (subjectId === "new") {
        if (!newSubject.trim()) throw new Error("Name the new subject");
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            user_id: user.id,
            name: newSubject.trim(),
            color: EXTRA_COLORS[subjects.length % EXTRA_COLORS.length] ?? "#10b981",
          })
          .select("id")
          .single();
        if (error) throw error;
        sid = data.id;
      }
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        subject_id: sid,
        planned_minutes: minutes,
        days_of_week: days.sort(),
        recurring,
        start_date: start,
        end_date: end || null,
      };
      const today = todayStr();
      if (task) {
        if (!applyToAll && instanceId) {
          // Update only this specific instance
          const { error } = await supabase
            .from("task_instances")
            .update({
              title: payload.title,
              description: payload.description,
              subject_id: sid,
              planned_minutes: minutes,
            })
            .eq("id", instanceId);
          if (error) throw error;
        } else {
          // Apply to all
          const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
          if (error) throw error;
          // Refresh today's and future, not-yet-completed instances; past history stays intact.
          await supabase
            .from("task_instances")
            .delete()
            .eq("task_id", task.id)
            .gte("date", today)
            .eq("completed", false);
          await supabase
            .from("task_instances")
            .update({ 
              title: payload.title, 
              description: payload.description,
              subject_id: sid, 
              planned_minutes: minutes 
            })
            .eq("task_id", task.id)
            .gte("date", today);
        }
      } else {
        const { error } = await supabase.from("tasks").insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
      await ensureInstances(
        user.id,
        start < today ? (start > daysAgo(365) ? start : daysAgo(365)) : today,
      );
      await qc.invalidateQueries();
      toast.success(task ? "Task updated" : "Task added");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Task name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Binary Tree Practice"
              maxLength={80}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g. solve 3 medium problems"
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ New subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          </div>
          {subjectId === "new" && (
            <Input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject name"
              maxLength={40}
            />
          )}
          <div className="grid gap-2">
            <Label>Repeat</Label>
            <div className="flex bg-muted p-1 rounded-lg">
              {(["none", "every_day", "custom"] as const).map((mode) => {
                const isSelected = 
                  mode === "none" ? !recurring :
                  mode === "every_day" ? (recurring && days.length === 7) :
                  (recurring && days.length < 7);
                  
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={task ? (!applyToAll && instanceId !== undefined) : false}
                    onClick={() => {
                      if (mode === "none") {
                        setRecurring(false);
                      } else if (mode === "every_day") {
                        setRecurring(true);
                        setDays([0, 1, 2, 3, 4, 5, 6]);
                      } else {
                        setRecurring(true);
                      }
                    }}
                    className={cn(
                      "flex-1 text-sm font-medium h-8 rounded-md transition-all",
                      isSelected ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                      task && !applyToAll && instanceId !== undefined && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {mode === "none" ? "None" : mode === "every_day" ? "Every day" : "Custom"}
                  </button>
                );
              })}
            </div>
          </div>
          {recurring && days.length < 7 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={task ? (!applyToAll && instanceId !== undefined) : false}
                  onClick={() =>
                    setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))
                  }
                  className={cn(
                    "h-9 w-11 rounded-lg border text-xs font-medium transition",
                    days.includes(d)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                    task && !applyToAll && instanceId !== undefined && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {DAY_NAMES[d]}
                </button>
              ))}
            </div>
          )}
          {task && instanceId && (
            <div className="flex items-center space-x-2 mt-1">
              <Switch id="applyAll" checked={applyToAll} onCheckedChange={setApplyToAll} />
              <Label htmlFor="applyAll" className="text-sm font-medium">Apply changes to all scheduled days</Label>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{recurring ? "Start date" : "Date"}</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            {recurring && (
              <div className="grid gap-1.5">
                <Label>End date (optional)</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
