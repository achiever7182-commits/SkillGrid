import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { EmptyState, Panel } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useSubjects, useUser } from "@/hooks/use-session";
import { daysAgo, fmtMinutes, parse, todayStr } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Task history — StudySync" },
      { name: "description", content: "Your past study tasks." },
      { property: "og:title", content: "Task history — StudySync" },
      { property: "og:description", content: "Your past study tasks." },
    ],
  }),
  component: History,
});

function History() {
  const { data: user } = useUser();
  const { data: subjects = [] } = useSubjects();
  const [range, setRange] = useState("7");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("all");
  const from = range === "0" ? todayStr() : range === "1" ? daysAgo(1) : daysAgo(Number(range));
  const to = range === "1" ? daysAgo(1) : todayStr();
  const { data = [] } = useQuery({
    queryKey: ["instances", user?.id, "history", from, to],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("task_instances")
          .select("*")
          .eq("user_id", user!.id)
          .gte("date", from)
          .lte("date", to)
          .order("date", { ascending: false })
      ).data ?? [],
  });
  const rows = data.filter(
    (r) =>
      (subject === "all" || r.subject_id === subject) &&
      (status === "all" || (status === "done") === r.completed),
  );
  return (
    <AppShell>
      <PageHeader title="Task history" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Yesterday</SelectItem>
            <SelectItem value="7">Previous 7 days</SelectItem>
            <SelectItem value="30">Previous 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="done">Completed</SelectItem>
            <SelectItem value="open">Missed / open</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="Nothing here" body="No tasks match these filters." />
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <div className={r.completed ? "" : "text-muted-foreground"}>
                    {r.completed ? "✓ " : "○ "}
                    {r.title}
                  </div>
                  {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  {format(parse(r.date), "MMM d")} · {fmtMinutes(r.planned_minutes)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
