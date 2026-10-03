import { useEffect } from "react";
import { Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ELEVENLABS_AGENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ELEVENLABS_AGENT_ID) ||
  "agent_5501m40z5eyve89a9pjn0c1k81m1";

/**
 * Programmatically triggers / expands the ElevenLabs Conversational AI orb
 */
export function openSkillGridVoiceAssistant() {
  if (typeof document === "undefined") return;
  const widget = document.querySelector("elevenlabs-convai");
  if (widget) {
    try {
      const shadowRoot = (widget as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
      const innerButton = shadowRoot?.querySelector("button");
      if (innerButton) {
        innerButton.click();
        return;
      }
      const button = widget.querySelector("button") || (widget as HTMLElement);
      button.click();
    } catch (e) {
      console.error("Failed to trigger voice assistant:", e);
    }
  }
}

/**
 * SkillGrid Voice AI Assistant Widget wrapper
 * Attaches the official ElevenLabs ConvAI web component to document.body safely on client
 */
export function SkillGridVoiceAgent({ agentId = ELEVENLABS_AGENT_ID }: { agentId?: string }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    try {
      // 1. Ensure the script is loaded
      const SCRIPT_SRC = "https://elevenlabs.io/convai-widget/index.js";
      if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.type = "text/javascript";
        document.body.appendChild(script);
      }

      // 2. Ensure the custom element is in the DOM with the correct agent-id
      const existingConvai = document.querySelector("elevenlabs-convai");
      if (!existingConvai) {
        const convai = document.createElement("elevenlabs-convai");
        convai.setAttribute("agent-id", agentId);
        document.body.appendChild(convai);
      } else if (existingConvai.getAttribute("agent-id") !== agentId) {
        existingConvai.setAttribute("agent-id", agentId);
      }
    } catch (err) {
      console.warn("SkillGrid voice agent initialization warning:", err);
    }
  }, [agentId]);

  return null;
}

/**
 * A luxury header action button to talk with the SkillGrid AI Assistant
 */
export function SkillGridVoiceTrigger({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openSkillGridVoiceAssistant}
      className={`group relative overflow-hidden border-cyan-500/30 bg-cyan-950/20 text-cyan-200 hover:bg-cyan-900/30 hover:text-white transition-all shadow-[0_0_15px_-3px_rgba(39,146,220,0.25)] hover:shadow-[0_0_20px_0px_rgba(39,146,220,0.4)] ${
        className || ""
      }`}
      title="Talk with SkillGrid Voice AI Assistant"
    >
      <span className="relative flex h-2 w-2 mr-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2792dc]" />
      </span>
      <Sparkles className="size-3.5 mr-1.5 text-cyan-400 transition-transform group-hover:rotate-12" />
      <span className="hidden sm:inline font-medium">Ask Assistant</span>
      <Mic className="size-3.5 ml-1 text-cyan-300" />
    </Button>
  );
}
