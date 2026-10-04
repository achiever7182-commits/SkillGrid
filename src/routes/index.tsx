import { createFileRoute } from "@tanstack/react-router";
import { CinematicStoryStage } from "@/components/landing/cinematic-story/cinematic-stage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillGrid — Track study progress with your friends" },
      {
        name: "description",
        content:
          "Daily study checklists, streaks, heatmaps and shared progress for students and their friends.",
      },
      { property: "og:title", content: "SkillGrid — Track study progress with your friends" },
      {
        property: "og:description",
        content:
          "Daily study checklists, streaks, heatmaps and shared progress for students and their friends.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return <CinematicStoryStage />;
}
