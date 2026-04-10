import { router } from "./index";
import { useUIStore } from "@/stores/uiStore";

/** Known system labels that map to /mail/$label */
const SYSTEM_LABELS = new Set([
  "inbox", "starred", "snoozed", "sent", "drafts", "trash", "spam", "all",
]);

/**
 * Get the default category based on current inbox view mode.
 * Used when navigating to inbox without an explicit category.
 */
function getDefaultCategory(): "All" | "Primary" {
  // Access the store directly to avoid React hook rules issues
  const state = useUIStore.getState();
  return state.inboxViewMode === "unified" ? "All" : "Primary";
}

/**
 * Navigate to a label/view. Handles routing for system labels, custom labels,
 * smart folders, and special views (settings, calendar).
 */
export function navigateToLabel(
  label: string,
  opts?: { category?: string; threadId?: string },
): void {
  if (label === "settings") {
    router.navigate({ to: "/settings/$tab", params: { tab: "general" } });
    return;
  }

  if (label === "tasks") {
    router.navigate({ to: "/tasks" });
    return;
  }

  if (label === "attachments") {
    router.navigate({ to: "/attachments" });
    return;
  }

  if (label === "crm") {
    router.navigate({ to: "/crm" });
    return;
  }

  if (label === "crm-companies") {
    router.navigate({ to: "/crm/companies" });
    return;
  }

  if (label === "crm-pipeline") {
    router.navigate({ to: "/crm/pipeline" });
    return;
  }

  if (label === "calendar") {
    router.navigate({ to: "/calendar" });
    return;
  }

  if (label === "help") {
    router.navigate({ to: "/help/$topic", params: { topic: "getting-started" } });
    return;
  }

  if (label.startsWith("smart-folder:")) {
    const folderId = label.replace("smart-folder:", "");
    if (opts?.threadId) {
      router.navigate({
        to: "/smart-folder/$folderId/thread/$threadId",
        params: { folderId, threadId: opts.threadId },
      });
    } else {
      router.navigate({
        to: "/smart-folder/$folderId",
        params: { folderId },
      });
    }
    return;
  }

  if (SYSTEM_LABELS.has(label)) {
    const search: Record<string, string> = {};
    // Always set category for inbox to ensure consistent navigation
    if (label === "inbox") {
      search["category"] = opts?.category ?? getDefaultCategory();
    } else if (opts?.category) {
      search["category"] = opts.category;
    }
    if (opts?.threadId) {
      router.navigate({
        to: "/mail/$label/thread/$threadId",
        params: { label, threadId: opts.threadId },
        search,
      });
    } else {
      router.navigate({
        to: "/mail/$label",
        params: { label },
        search,
      });
    }
    return;
  }

  // Custom user label
  if (opts?.threadId) {
    router.navigate({
      to: "/label/$labelId/thread/$threadId",
      params: { labelId: label, threadId: opts.threadId },
    });
  } else {
    router.navigate({
      to: "/label/$labelId",
      params: { labelId: label },
    });
  }
}

/**
 * Navigate to a thread within the current mail context.
 * Appends /thread/$threadId to the current route.
 */
export function navigateToThread(threadId: string): void {
  const { location } = router.state;
  const pathname = location.pathname;
  const search = { ...(location.search as Record<string, string>) };

  // Already on a mail/$label route
  const mailMatch = pathname.match(/^\/mail\/([^/]+)/);
  if (mailMatch) {
    const label = mailMatch[1]!;
    // Ensure category is set for inbox
    if (label === "inbox" && !search["category"]) {
      search["category"] = getDefaultCategory();
    }
    router.navigate({
      to: "/mail/$label/thread/$threadId",
      params: { label, threadId },
      search,
    });
    return;
  }

  // On a custom label route
  const labelMatch = pathname.match(/^\/label\/([^/]+)/);
  if (labelMatch) {
    router.navigate({
      to: "/label/$labelId/thread/$threadId",
      params: { labelId: labelMatch[1]!, threadId },
      search,
    });
    return;
  }

  // On a smart folder route
  const sfMatch = pathname.match(/^\/smart-folder\/([^/]+)/);
  if (sfMatch) {
    router.navigate({
      to: "/smart-folder/$folderId/thread/$threadId",
      params: { folderId: sfMatch[1]!, threadId },
      search,
    });
    return;
  }

  // Fallback: navigate to inbox with thread
  router.navigate({
    to: "/mail/$label/thread/$threadId",
    params: { label: "inbox", threadId },
    search: { category: getDefaultCategory() },
  });
}

/**
 * Navigate to settings with an optional tab.
 */
export function navigateToSettings(tab = "general"): void {
  router.navigate({ to: "/settings/$tab", params: { tab } });
}

/**
 * Navigate to help with an optional topic.
 */
export function navigateToHelp(topic = "getting-started"): void {
  router.navigate({ to: "/help/$topic", params: { topic } });
}

/**
 * Navigate back (deselect thread → go to parent list route).
 */
export function navigateBack(): void {
  const { location } = router.state;
  const pathname = location.pathname;
  const search = { ...(location.search as Record<string, string>) };

  // If on a thread sub-route, go to parent
  const mailThreadMatch = pathname.match(/^\/mail\/([^/]+)\/thread\//);
  if (mailThreadMatch) {
    const label = mailThreadMatch[1]!;
    // Ensure category is set for inbox
    if (label === "inbox" && !search["category"]) {
      search["category"] = getDefaultCategory();
    }
    router.navigate({
      to: "/mail/$label",
      params: { label },
      search,
    });
    return;
  }

  const labelThreadMatch = pathname.match(/^\/label\/([^/]+)\/thread\//);
  if (labelThreadMatch) {
    router.navigate({
      to: "/label/$labelId",
      params: { labelId: labelThreadMatch[1]! },
      search,
    });
    return;
  }

  const sfThreadMatch = pathname.match(/^\/smart-folder\/([^/]+)\/thread\//);
  if (sfThreadMatch) {
    router.navigate({
      to: "/smart-folder/$folderId",
      params: { folderId: sfThreadMatch[1]! },
      search,
    });
    return;
  }

  // Not on a thread route — navigate to inbox with appropriate category
  router.navigate({
    to: "/mail/$label",
    params: { label: "inbox" },
    search: { category: getDefaultCategory() },
  });
}

/**
 * Get the active label from the current router state (non-React helper).
 */
export function getActiveLabel(): string {
  const matches = router.state.matches;
  for (const match of matches) {
    if (match.routeId === "/mail/$label" || match.routeId === "/mail/$label/thread/$threadId") {
      return (match.params as { label: string }).label;
    }
    if (match.routeId === "/label/$labelId" || match.routeId === "/label/$labelId/thread/$threadId") {
      return (match.params as { labelId: string }).labelId;
    }
    if (match.routeId === "/smart-folder/$folderId" || match.routeId === "/smart-folder/$folderId/thread/$threadId") {
      return `smart-folder:${(match.params as { folderId: string }).folderId}`;
    }
    if (match.routeId === "/settings/$tab" || match.routeId === "/settings") {
      return "settings";
    }
    if (match.routeId === "/attachments") {
      return "attachments";
    }
    if (match.routeId === "/tasks") {
      return "tasks";
    }
    if (match.routeId === "/crm" || match.pathname === "/crm") {
      return "crm";
    }
    if (match.routeId === "/crm/companies" || match.pathname === "/crm/companies") {
      return "crm";
    }
    if (match.routeId === "/crm/pipeline" || match.pathname === "/crm/pipeline") {
      return "crm";
    }
    if (match.routeId === "/calendar") {
      return "calendar";
    }
    if (match.routeId === "/help/$topic" || match.routeId === "/help") {
      return "help";
    }
  }
  return "inbox";
}

/**
 * Get the selected thread ID from the current router state (non-React helper).
 */
export function getSelectedThreadId(): string | null {
  const matches = router.state.matches;
  for (const match of matches) {
    const params = match.params as Record<string, string>;
    if (params["threadId"]) {
      return params["threadId"];
    }
  }
  return null;
}
