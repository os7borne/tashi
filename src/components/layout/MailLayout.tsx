import { useEffect, useState } from "react";
import { EmailList } from "./EmailList";
import { ReadingPane } from "./ReadingPane";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/stores/uiStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function MailLayout() {
  const isReadingPaneOpen = useUIStore((s) => s.isReadingPaneOpen);
  const setReadingPaneOpen = useUIStore((s) => s.setReadingPaneOpen);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const [showAddAccount, setShowAddAccount] = useState(false);

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
    <div className="flex flex-1 min-w-0 flex-row h-full">
      {/* Left column: Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onAddAccount={() => setShowAddAccount(true)} />
      
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
