import { useCallback } from "react";
import { EmailList } from "./EmailList";
import { ReadingPane } from "./ReadingPane";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/stores/uiStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function MailLayout() {
  const isReadingPaneOpen = useUIStore((s) => s.isReadingPaneOpen);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  const handleAddAccount = useCallback(() => {
    window.dispatchEvent(new Event("velo-show-add-account"));
  }, []);

  return (
    <div className="flex flex-1 min-w-0 h-full">
      {/* Left column: Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onAddAccount={handleAddAccount} />

      {/* Main area: Email list OR Reading pane (email detail + AI sidebar) */}
      <div className="flex-1 min-w-0 h-full">
        {isReadingPaneOpen ? (
          <ErrorBoundary name="ReadingPane">
            <ReadingPane />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary name="EmailList">
            <EmailList />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
