import { Sidebar } from "./Sidebar";
import { useUIStore } from "@/stores/uiStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  const handleAddAccount = () => {
    window.dispatchEvent(new Event("velo-show-add-account"));
  };

  return (
    <div className="flex flex-1 min-w-0 h-full">
      <ErrorBoundary name="Sidebar">
        <Sidebar
          collapsed={sidebarCollapsed}
          onAddAccount={handleAddAccount}
        />
      </ErrorBoundary>
      {children}
    </div>
  );
}
