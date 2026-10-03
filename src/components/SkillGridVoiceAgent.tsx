import { useEffect, useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ELEVENLABS_AGENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ELEVENLABS_AGENT_ID) ||
  "agent_1601m40ryfg9fjcr5rv41je74nk4";

/**
 * Programmatically triggers / expands the ElevenLabs Conversational AI orb
 */
export function openSkillGridVoiceAssistant() {
  if (typeof document === "undefined") return;
  const widget = document.querySelector("elevenlabs-convai");
  if (widget) {
    // Try to trigger internal shadow DOM button first
    const shadowRoot = (widget as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
    const innerButton = shadowRoot?.querySelector("button");
    if (innerButton) {
      innerButton.click();
      return;
    }
    const button = widget.querySelector("button") || (widget as HTMLElement);
    button.click();
  }
}

/**
 * SkillGrid Voice AI Assistant Widget wrapper
 * Embeds the official ElevenLabs ConvAI web component and script
 */
export function SkillGridVoiceAgent({ agentId = ELEVENLABS_AGENT_ID }: { agentId?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Ensure the ElevenLabs widget script is injected into document body if not already present
    const SCRIPT_SRC = "https://elevenlabs.io/convai-widget/index.js";
    const existingScript = document.querySelector(`script[src="${SCRIPT_SRC}"]`);

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div id="skillgrid-voice-agent-container" aria-label="SkillGrid Voice AI Assistant">
      <elevenlabs-convai agent-id={agentId} />
    </div>
  );
}

/**
 * A luxury header action button to talk with the SkillGrid AI Assistant (Raqeeb)
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
      title="Talk with Raqeeb (SkillGrid Voice AI Assistant)"
    >
      <span className="relative flex h-2 w-2 mr-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2792dc]" />
      </span>
      <Sparkles className="size-3.5 mr-1.5 text-cyan-400 transition-transform group-hover:rotate-12" />
      <span className="hidden sm:inline font-medium">Ask Raqeeb</span>
      <Mic className="size-3.5 ml-1 text-cyan-300" />
    </Button>
  );
}
