import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useUser } from "@/hooks/use-session";
import { EXTRA_COLORS, ensureInstances, type Task } from "@/lib/data";
import { DAY_NAMES, daysAgo, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | null }) {
  const { data: user } = useUser();
  const { data: subjects = [] } = useSubjects();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [newSubject, setNewSubject] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recurring, setRecurring] = useState(true);
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setSubjectId(task?.subject_id ?? "none");
    setMinutes(task?.planned_minutes ?? 60);
    setDays(task?.days_of_week ?? [1, 2, 3, 4, 5]);
    setRecurring(task?.recurring ?? true);
    setStart(task?.start_date ?? todayStr());
    setEnd(task?.end_date ?? "");
    setNewSubject("");
  }, [open, task]);

  async function save() {
    if (!user) return;
    if (!title.trim()) return toast.error("Give the task a name");
    if (minutes <= 0 || minutes > 1440) return toast.error("Duration must be between 1 and 1440 minutes");
    if (recurring && days.length === 0) return toast.error("Pick at least one day");
    if (end && end < start) return toast.error("End date must be after start date");
    setSaving(true);
    try {
      let sid: string | null = subjectId === "none" ? null : subjectId;
      if (subjectId === "new") {
        if (!newSubject.trim()) throw new Error("Name the new subject");
        const { data, error } = await supabase.from("subjects")
          .insert({ user_id: user.id, name: newSubject.trim(), color: EXTRA_COLORS[subjects.length % EXTRA_COLORS.length] })
          .select("id").single();
        if (error) throw error;
        sid = data.id;
      }
      const payload = {
        title: title.trim(), subject_id: sid, planned_minutes: minutes, days_of_week: days.sort(),
        recurring, start_date: start, end_date: end || null,
      };
      const today = todayStr();
      if (task) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
        // Refresh today's and future, not-yet-completed instances; past history stays intact.
        await supabase.from("task_instances").delete().eq("task_id", task.id).gte("date", today).eq("completed", false);
        await supabase.from("task_instances").update({ title: payload.title, subject_id: sid, planned_minutes: minutes })
          .eq("task_id", task.id).gte("date", today);
      } else {
        const { error } = await supabase.from("tasks").insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
      await ensureInstances(user.id, start < today ? (start > daysAgo(365) ? start : daysAgo(365)) : today);
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
        <DialogHeader><DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Task name</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Binary Tree Practice" maxLength={80} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  <SelectItem value="new">+ New subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" min={5} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
            </div>
          </div>
          {subjectId === "new" && <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject name" maxLength={40} />}
          <div className="flex items-center justify-between">
            <Label htmlFor="rec">Recurring</Label>
            <Switch id="rec" checked={recurring} onCheckedChange={setRecurring} />
          </div>
          {recurring && (
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button key={d} type="button"
                  onClick={() => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
                  className={cn("h-9 w-11 rounded-lg border text-xs font-medium transition", days.includes(d) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                  {DAY_NAMES[d]}
                </button>
              ))}
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
