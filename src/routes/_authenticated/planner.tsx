import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, startOfWeek } from "date-fns";
import { CalendarDays, LayoutTemplate } from "lucide-react";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { Panel, SectionTitle } from "@/components/ss/primitives";
import { TaskList } from "@/components/ss/task-list";
import { toStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Weekly Planner — StudySync" },
      { name: "description", content: "Plan and view your tasks for the week." },
    ],
  }),
  component: Planner,
});

function Planner() {
  const [selectedDate, setSelectedDate] = useState(() => toStr(new Date()));
  const todayDate = new Date();
  
  // Start of week (Monday)
  const start = startOfWeek(todayDate, { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(start, i);
    return {
      date: toStr(d),
      name: format(d, "EEEE"),
      shortName: format(d, "EEE"),
      isToday: toStr(d) === toStr(todayDate)
    };
  });

  const selectedDayName = weekDays.find(d => d.date === selectedDate)?.name || "Tasks";

  return (
    <AppShell>
      <PageHeader
        title="Weekly Planner"
        subtitle="Manage your tasks for each day of the week."
      />
      
      <Panel className="mb-4">
        <SectionTitle action={<CalendarDays className="size-4 text-muted-foreground" />}>
          This Week
        </SectionTitle>
        <div className="grid grid-cols-7 gap-2 mt-4">
          {weekDays.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border p-3 transition-all",
                selectedDate === d.date
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "bg-background/40 hover:bg-muted",
                d.isToday && selectedDate !== d.date && "border-primary/50"
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {d.shortName}
              </span>
              <span className={cn(
                "mt-1 text-lg font-medium",
                d.isToday && "text-primary"
              )}>
                {format(new Date(d.date), "d")}
              </span>
              {d.isToday && (
                <span className="mt-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionTitle action={<LayoutTemplate className="size-4 text-muted-foreground" />}>
          {selectedDayName.toUpperCase()}
        </SectionTitle>
        <div className="mt-4">
          <TaskList date={selectedDate} editable={true} />
        </div>
      </Panel>
    </AppShell>
  );
}
