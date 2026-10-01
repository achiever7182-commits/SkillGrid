import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { Panel } from "@/components/ss/primitives";
import { TaskList } from "@/components/ss/task-list";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — StudySync" },
      { name: "description", content: "Manage your study tasks." },
      { property: "og:title", content: "Tasks — StudySync" },
      { property: "og:description", content: "Manage your study tasks." },
    ],
  }),
  component: () => (
    <AppShell>
      <PageHeader
        title="Today's Tasks"
        subtitle="Check off, edit, add notes, or create recurring tasks."
      />
      <Panel>
        <TaskList />
      </Panel>
    </AppShell>
  ),
});
