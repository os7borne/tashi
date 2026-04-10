import { useState, useEffect, useCallback } from "react";
import {
  X,
  Building2,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Clock,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  History,
  CheckCircle,
  AlertTriangle,
  Tag,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { DealWithCompany, DealActivity } from "@/services/crm/deals";
import {
  getDealActivities,
  moveDealStage,
  getPriorityMeta,
  getDealTypeLabel,
  formatCheckSize,
  logDealActivity,
  DEAL_STAGES,
} from "@/services/crm/deals";

interface DealDetailProps {
  deal: DealWithCompany;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onDelete: () => void;
}

export function DealDetail({
  deal,
  onClose,
  onEdit,
  onRefresh,
  onDelete,
}: DealDetailProps) {
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "memo" | "activity">("overview");
  const [newActivity, setNewActivity] = useState("");
  const [showStageMenu, setShowStageMenu] = useState(false);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDealActivities(deal.id);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleStageChange = useCallback(
    async (newStage: string) => {
      if (newStage === deal.stage) {
        setShowStageMenu(false);
        return;
      }
      await moveDealStage(deal.id, newStage as any);
      setShowStageMenu(false);
      onRefresh();
    },
    [deal.id, deal.stage, onRefresh],
  );

  const handleAddActivity = useCallback(async () => {
    if (!newActivity.trim()) return;
    await logDealActivity(deal.id, "note", newActivity.trim(), null, null);
    setNewActivity("");
    loadActivities();
  }, [deal.id, newActivity, loadActivities]);

  const priorityMeta = getPriorityMeta(deal.priority);
  const currentStage = DEAL_STAGES.find((s) => s.value === deal.stage);
  const activeStages = DEAL_STAGES.filter((s) => s.order < 90);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-bg-primary border-l border-border-primary shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-primary bg-bg-secondary/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-semibold text-lg">
                {deal.deal_name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-text-primary truncate">{deal.deal_name}</h2>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {deal.company_name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Stage Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStageMenu(!showStageMenu)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-bg-tertiary border border-border-primary rounded-full hover:border-accent/50 transition-colors"
              >
                {currentStage?.label ?? deal.stage}
                <ChevronRight size={12} className={`transition-transform ${showStageMenu ? "rotate-90" : ""}`} />
              </button>
              {showStageMenu && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-md shadow-lg z-20 min-w-40">
                  {activeStages.map((stage) => (
                    <button
                      key={stage.value}
                      onClick={() => handleStageChange(stage.value)}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-bg-hover flex items-center gap-2 ${
                        stage.value === deal.stage ? "bg-accent/5 text-accent" : ""
                      }`}
                    >
                      {stage.value === deal.stage && <CheckCircle size={12} />}
                      {stage.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <span className={`px-2 py-1 text-xs rounded-full ${priorityMeta.color}`}>
              {priorityMeta.label}
            </span>

            {/* Deal Type */}
            <span className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded-full border border-border-primary">
              {getDealTypeLabel(deal.deal_type)}
            </span>

            {/* Status */}
            {deal.status !== "active" && (
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  deal.status === "invested"
                    ? "bg-green-100 text-green-700"
                    : deal.status === "passed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-border-primary">
          <div className="flex gap-4">
            {(["overview", "memo", "activity"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Check Size */}
              {(deal.check_size_min || deal.check_size_max) && (
                <div className="bg-bg-secondary rounded-lg p-4">
                  <h3 className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1">
                    <DollarSign size={14} />
                    Check Size
                  </h3>
                  <p className="text-lg font-medium text-text-primary">
                    {formatCheckSize(deal.check_size_min, deal.check_size_max)}
                  </p>
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {deal.valuation && (
                  <div>
                    <label className="text-xs text-text-tertiary">Valuation</label>
                    <p className="text-sm font-medium text-text-primary">{deal.valuation}</p>
                  </div>
                )}
                {deal.equity_percentage && (
                  <div>
                    <label className="text-xs text-text-tertiary">Equity %</label>
                    <p className="text-sm font-medium text-text-primary">{deal.equity_percentage}%</p>
                  </div>
                )}
                {deal.source && (
                  <div>
                    <label className="text-xs text-text-tertiary">Source</label>
                    <p className="text-sm font-medium text-text-primary capitalize">
                      {deal.source.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {deal.source_contact_name && (
                  <div>
                    <label className="text-xs text-text-tertiary">Source Contact</label>
                    <p className="text-sm font-medium text-text-primary">{deal.source_contact_name}</p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-primary flex items-center gap-1">
                  <Calendar size={14} className="text-accent" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {deal.next_step_date && (
                    <div className="bg-bg-secondary rounded-lg p-3">
                      <label className="text-xs text-text-tertiary flex items-center gap-1">
                        <Clock size={12} />
                        Next Step
                      </label>
                      <p className="text-sm font-medium text-text-primary mt-1">
                        {new Date(deal.next_step_date * 1000).toLocaleDateString()}
                      </p>
                      {deal.next_step && (
                        <p className="text-xs text-text-secondary mt-0.5">{deal.next_step}</p>
                      )}
                    </div>
                  )}
                  {deal.decision_date && (
                    <div className="bg-bg-secondary rounded-lg p-3">
                      <label className="text-xs text-text-tertiary flex items-center gap-1">
                        <Calendar size={12} />
                        Target Decision
                      </label>
                      <p className="text-sm font-medium text-text-primary mt-1">
                        {new Date(deal.decision_date * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <h3 className="text-sm font-medium text-text-primary flex items-center gap-1 mb-3">
                  <TrendingUp size={14} className="text-accent" />
                  Pipeline Progress
                </h3>
                <div className="relative">
                  <div className="absolute left-0 right-0 top-1.5 h-0.5 bg-bg-tertiary rounded" />
                  <div className="flex justify-between relative">
                    {activeStages.slice(0, 5).map((stage) => {
                      const isCompleted = (currentStage?.order ?? 0) >= stage.order;
                      const isCurrent = deal.stage === stage.value;
                      return (
                        <div
                          key={stage.value}
                          className={`w-3 h-3 rounded-full ${
                            isCompleted
                              ? "bg-accent"
                              : "bg-bg-tertiary border-2 border-border-primary"
                          } ${isCurrent ? "ring-2 ring-accent/30" : ""}`}
                          title={stage.label}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-text-tertiary mt-2">
                  <span>Sourced</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "memo" && (
            <div className="space-y-4">
              {/* Thesis Fit */}
              {deal.thesis_fit && (
                <div>
                  <h3 className="text-sm font-medium text-text-primary flex items-center gap-1 mb-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Thesis Fit
                  </h3>
                  <div className="bg-bg-secondary rounded-lg p-4 text-sm text-text-secondary whitespace-pre-wrap">
                    {deal.thesis_fit}
                  </div>
                </div>
              )}

              {/* Risks */}
              {deal.risks && (
                <div>
                  <h3 className="text-sm font-medium text-text-primary flex items-center gap-1 mb-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    Key Risks
                  </h3>
                  <div className="bg-bg-secondary rounded-lg p-4 text-sm text-text-secondary whitespace-pre-wrap">
                    {deal.risks}
                  </div>
                </div>
              )}

              {/* Investment Memo */}
              {deal.memo && (
                <div>
                  <h3 className="text-sm font-medium text-text-primary flex items-center gap-1 mb-2">
                    <Tag size={14} className="text-accent" />
                    Investment Memo
                  </h3>
                  <div className="bg-bg-secondary rounded-lg p-4 text-sm text-text-secondary whitespace-pre-wrap">
                    {deal.memo}
                  </div>
                </div>
              )}

              {!deal.thesis_fit && !deal.risks && !deal.memo && (
                <EmptyState
                  icon={Tag}
                  title="No memo content"
                  description="Add investment thesis, risks, and memo in the edit form."
                />
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              {/* Add Activity */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!newActivity.trim()}
                  className="px-3 py-2 bg-accent text-white rounded-md text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Activity List */}
              <div className="space-y-3">
                {loading ? (
                  <ActivitySkeleton />
                ) : activities.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No activity yet"
                    description="Activities will appear here as the deal progresses."
                  />
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="shrink-0">
                        <ActivityIcon type={activity.activity_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-primary">
                            {activity.activity_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {new Date(activity.created_at * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{activity.description}</p>
                        {activity.old_value && activity.new_value && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-text-tertiary">
                            <span className="bg-bg-tertiary px-1.5 py-0.5 rounded">{activity.old_value}</span>
                            <ArrowRight size={10} />
                            <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded">{activity.new_value}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconClass = "w-6 h-6 rounded-full flex items-center justify-center";
  switch (type) {
    case "stage_change":
      return (
        <div className={`${iconClass} bg-blue-100 text-blue-600`}>
          <TrendingUp size={12} />
        </div>
      );
    case "note":
      return (
        <div className={`${iconClass} bg-gray-100 text-gray-600`}>
          <MessageSquare size={12} />
        </div>
      );
    case "meeting":
      return (
        <div className={`${iconClass} bg-green-100 text-green-600`}>
          <Users size={12} />
        </div>
      );
    case "file":
      return (
        <div className={`${iconClass} bg-amber-100 text-amber-600`}>
          <Tag size={12} />
        </div>
      );
    case "email":
      return (
        <div className={`${iconClass} bg-purple-100 text-purple-600`}>
          <Clock size={12} />
        </div>
      );
    default:
      return (
        <div className={`${iconClass} bg-gray-100 text-gray-600`}>
          <History size={12} />
        </div>
      );
  }
}

function ActivitySkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="shrink-0 w-6 h-6 rounded-full bg-bg-tertiary" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 bg-bg-tertiary rounded" />
            <div className="h-2 w-full bg-bg-tertiary rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-bg-tertiary mx-auto mb-3 flex items-center justify-center">
        <Icon size={20} className="text-text-tertiary" />
      </div>
      <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
      <p className="text-xs text-text-tertiary mt-1">{description}</p>
    </div>
  );
}
