import { useState, useEffect } from "react";
import { ThreadView } from "../email/ThreadView";
import { useThreadStore } from "@/stores/threadStore";
import { useSelectedThreadId } from "@/hooks/useRouteNavigation";
import { useUIStore } from "@/stores/uiStore";
import { EmptyState } from "../ui/EmptyState";
import { ReadingPaneIllustration } from "../ui/illustrations";
import { ArrowLeft, User } from "lucide-react";
import { navigateToLabel } from "@/router/navigate";
import { useActiveLabel } from "@/hooks/useRouteNavigation";

export function ReadingPane() {
  const selectedThreadId = useSelectedThreadId();
  const selectedThread = useThreadStore((s) => selectedThreadId ? s.threadMap.get(selectedThreadId) ?? null : null);
  const setReadingPaneOpen = useUIStore((s) => s.setReadingPaneOpen);
  const activeLabel = useActiveLabel();
  const [showPersonSidebar, setShowPersonSidebar] = useState(false);

  const handleBack = () => {
    setReadingPaneOpen(false);
    // Navigate back to the current label (removes thread from URL)
    navigateToLabel(activeLabel);
  };

  // Keyboard shortcut: 'P' to toggle person sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        // Only toggle if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setShowPersonSidebar((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!selectedThread) {
    return (
      <div className="flex-1 flex flex-col bg-bg-primary glass-panel">
        <EmptyState illustration={ReadingPaneIllustration} title="Tashi" subtitle="Select an email to read" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary glass-panel h-full">
      {/* Header with back button and person sidebar toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-primary shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          title="Back to email list (Esc or B)"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        
        <button
          onClick={() => setShowPersonSidebar(!showPersonSidebar)}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors ${
            showPersonSidebar 
              ? "bg-accent text-white" 
              : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          }`}
          title="Toggle person sidebar (P)"
        >
          <User size={16} />
          <span>Person</span>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0">
        {/* Thread view */}
        <div className={`flex-1 overflow-hidden transition-all duration-200 ${showPersonSidebar ? 'border-r border-border-primary' : ''}`}>
          <ThreadView thread={selectedThread} />
        </div>

        {/* Person sidebar */}
        {showPersonSidebar && (
          <div className="w-72 bg-bg-secondary border-l border-border-primary flex flex-col overflow-y-auto">
            <PersonSidebar thread={selectedThread} />
          </div>
        )}
      </div>
    </div>
  );
}

// Simple person sidebar component
function PersonSidebar({ thread }: { thread: { fromName?: string | null; fromAddress?: string | null } }) {
  const name = thread.fromName || thread.fromAddress || "Unknown";
  const email = thread.fromAddress || "";

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-1">{name}</h3>
      <p className="text-xs text-text-tertiary mb-4">{email}</p>
      
      <div className="space-y-3">
        <div className="text-xs text-text-secondary">
          <span className="text-text-tertiary block mb-1">Recent emails</span>
          <p className="italic">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
