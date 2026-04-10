import { useThreadStore } from "@/stores/threadStore";
import { useSelectedThreadId } from "@/hooks/useRouteNavigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReadingPaneIllustration } from "@/components/ui/illustrations";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ThreadView } from "../email/ThreadView";

export function ReadingPane() {
  const selectedThreadId = useSelectedThreadId();
  const selectedThread = useThreadStore((s) => selectedThreadId ? s.threadMap.get(selectedThreadId) ?? null : null);

  if (!selectedThread) {
    return (
      <div className="flex-1 flex flex-col bg-bg-primary glass-panel h-full">
        <EmptyState illustration={ReadingPaneIllustration} title="Tashi" subtitle="Select an email to read" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary glass-panel h-full">
      <ErrorBoundary name="ThreadView">
        <ThreadView thread={selectedThread} />
      </ErrorBoundary>
    </div>
  );
}
