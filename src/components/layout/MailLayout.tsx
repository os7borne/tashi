import { useCallback, useEffect } from "react";
import { EmailList } from "./EmailList";
import { ReadingPane } from "./ReadingPane";
import { useUIStore } from "@/stores/uiStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function MailLayout() {
  const isReadingPaneOpen = useUIStore((s) => s.isReadingPaneOpen);
  const setReadingPaneOpen = useUIStore((s) => s.setReadingPaneOpen);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or 'B' to go back to email list
      if ((e.key === "Escape" || e.key === "b" || e.key === "B") && isReadingPaneOpen) {
        e.preventDefault();
        setReadingPaneOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReadingPaneOpen, setReadingPaneOpen]);

  return (
    <div className="flex flex-1 min-w-0 flex-row">
      {/* Left column: Always Sidebar */}
      
      {/* Right column: EmailList OR ReadingPane */}
      <div className="flex-1 min-w-0">
        <ErrorBoundary name="EmailLayout">
          {isReadingPaneOpen ? (
            <ReadingPane />
          ) : (
            <EmailList />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
