import { useEffect } from "react";
import { EmailList } from "./EmailList";
import { ReadingPane } from "./ReadingPane";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/stores/uiStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function MailLayout() {
  const isReadingPaneOpen = useUIStore((s) => s.isReadingPaneOpen);
  const setReadingPaneOpen = useUIStore((s) => s.setReadingPaneOpen);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

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

  const handleAddAccount = () => {
    // Dispatch event to open add account modal (handled in App.tsx)
    window.dispatchEvent(new Event("velo-show-add-account"));
  };

  return (
    <div className="flex flex-1 min-w-0 flex-row h-full">
      {/* Left column: Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onAddAccount={handleAddAccount} />
      
      {/* Right column: EmailList OR ReadingPane */}
      <div className="flex-1 min-w-0 h-full">
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
