import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  X,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import {
  getPipelineByStage,
  moveDealStage,
  deleteDeal,
  type DealWithCompany,
  type DealStage,
  DEAL_STAGES,
  getStageLabel,
  getPriorityMeta,
  formatCheckSize,
  type DealPriority,
  type DealType,
  type DealStatus,
} from "@/services/crm/deals";
import { DealForm } from "./DealForm";
import { DealDetail } from "./DealDetail";

interface Filters {
  priority: DealPriority | "";
  dealType: DealType | "";
  status: DealStatus | "";
  hidePassed: boolean;
}

export function DealsPage() {
  const [pipeline, setPipeline] = useState<Record<DealStage, DealWithCompany[]>>({
    sourced: [],
    screening: [],
    first_meeting: [],
    diligence: [],
    partner_meeting: [],
    term_sheet: [],
    negotiation: [],
    committed: [],
    closed: [],
    passed: [],
    on_hold: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    priority: "",
    dealType: "",
    status: "active",
    hidePassed: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealWithCompany | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealWithCompany | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<DealWithCompany | null>(null);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPipelineByStage({
        priority: filters.priority || undefined,
        dealType: filters.dealType || undefined,
        status: filters.status || undefined,
        hidePassed: filters.hidePassed,
      });
      setPipeline(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const filteredPipeline = useMemo(() => {
    if (!searchQuery.trim()) return pipeline;
    const q = searchQuery.toLowerCase();
    const result = { ...pipeline };
    for (const stage of DEAL_STAGES) {
      result[stage.value] = pipeline[stage.value].filter(
        (d) =>
          d.deal_name.toLowerCase().includes(q) ||
          d.company_name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [pipeline, searchQuery]);

  const stats = useMemo(() => {
    let totalValue = 0;
    let dealCount = 0;
    for (const stage of DEAL_STAGES) {
      const deals = filteredPipeline[stage.value];
      for (const deal of deals) {
        if (deal.check_size_max) {
          totalValue += deal.check_size_max;
        }
        dealCount++;
      }
    }
    return { totalValue, dealCount };
  }, [filteredPipeline]);

  const handleDragStart = useCallback((deal: DealWithCompany) => {
    setDraggedDeal(deal);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStage: DealStage) => {
      e.preventDefault();
      if (!draggedDeal || draggedDeal.stage === targetStage) return;

      await moveDealStage(draggedDeal.id, targetStage, `Moved to ${getStageLabel(targetStage)}`);
      setDraggedDeal(null);
      loadPipeline();
    },
    [draggedDeal, loadPipeline],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this deal?")) return;
      await deleteDeal(id);
      if (selectedDeal?.id === id) {
        setSelectedDeal(null);
      }
      loadPipeline();
    },
    [loadPipeline, selectedDeal],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      priority: "",
      dealType: "",
      status: "active",
      hidePassed: true,
    });
  }, []);

  const hasActiveFilters = filters.priority || filters.dealType || filters.status !== "active" || !filters.hidePassed;

  const activeStages = DEAL_STAGES.filter((s) => s.order < 90);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border-primary bg-bg-primary/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-accent" />
            <h1 className="text-base font-semibold text-text-primary">Pipeline</h1>
            {!loading && (
              <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                {stats.dealCount} deals
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Value Display */}
            <div className="text-xs text-text-secondary mr-2">
              Total value: <span className="font-medium text-text-primary">${formatLargeNumber(stats.totalValue)}</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 pl-8 pr-3 py-1.5 bg-bg-tertiary border border-border-primary rounded-lg text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                hasActiveFilters
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-bg-tertiary border-border-primary text-text-secondary hover:text-text-primary"
              }`}
            >
              <Filter size={13} />
              Filter
              {hasActiveFilters && (
                <span className="bg-accent text-white text-[10px] px-1.5 rounded-full">!</span>
              )}
            </button>

            {/* Add Deal */}
            <button
              onClick={() => {
                setEditingDeal(null);
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Plus size={14} />
              Add Deal
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-bg-secondary rounded-lg border border-border-primary">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value as DealPriority | "" }))}
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.dealType}
                onChange={(e) => setFilters((f) => ({ ...f, dealType: e.target.value as DealType | "" }))}
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">All Types</option>
                <option value="new_investment">New Investment</option>
                <option value="follow_on">Follow-On</option>
                <option value="secondary">Secondary</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as DealStatus | "" }))}
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="passed">Passed</option>
                <option value="invested">Invested</option>
                <option value="on_hold">On Hold</option>
              </select>

              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hidePassed}
                  onChange={(e) => setFilters((f) => ({ ...f, hidePassed: e.target.checked }))}
                  className="w-4 h-4 rounded border-border-primary text-accent focus:ring-accent"
                />
                Hide passed deals
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-4 gap-4 min-w-max">
          {activeStages.map((stage) => (
            <KanbanColumn
              key={stage.value}
              stage={stage.value}
              label={stage.label}
              deals={filteredPipeline[stage.value]}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.value)}
              onDealClick={setSelectedDeal}
              onDealDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <DealDetail
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onEdit={() => {
            setEditingDeal(selectedDeal);
            setShowForm(true);
          }}
          onRefresh={loadPipeline}
          onDelete={() => handleDelete(selectedDeal.id)}
        />
      )}

      {/* Deal Form Modal */}
      {showForm && (
        <DealForm
          deal={editingDeal}
          onClose={() => {
            setShowForm(false);
            setEditingDeal(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingDeal(null);
            loadPipeline();
          }}
        />
      )}
    </div>
  );
}

interface KanbanColumnProps {
  stage: DealStage;
  label: string;
  deals: DealWithCompany[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDealClick: (deal: DealWithCompany) => void;
  onDealDragStart: (deal: DealWithCompany) => void;
}

function KanbanColumn({
  stage,
  label,
  deals,
  onDragOver,
  onDrop,
  onDealClick,
  onDealDragStart,
}: KanbanColumnProps) {
  const stageColors: Record<string, string> = {
    sourced: "border-zinc-300",
    screening: "border-blue-300",
    first_meeting: "border-indigo-300",
    diligence: "border-violet-300",
    partner_meeting: "border-purple-300",
    term_sheet: "border-fuchsia-300",
    negotiation: "border-amber-300",
    committed: "border-emerald-300",
    closed: "border-green-300",
    passed: "border-red-300",
    on_hold: "border-gray-300",
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`w-72 shrink-0 flex flex-col bg-bg-secondary rounded-lg border-t-4 ${stageColors[stage] ?? "border-zinc-300"}`}
    >
      {/* Column Header */}
      <div className="px-3 py-2 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-text-primary text-sm">{label}</h3>
          <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onClick={() => onDealClick(deal)}
            onDragStart={() => onDealDragStart(deal)}
          />
        ))}
      </div>
    </div>
  );
}

interface DealCardProps {
  deal: DealWithCompany;
  onClick: () => void;
  onDragStart: () => void;
}

function DealCard({ deal, onClick, onDragStart }: DealCardProps) {
  const priorityMeta = getPriorityMeta(deal.priority);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group p-3 bg-bg-primary rounded-md border border-border-primary shadow-sm hover:shadow-md hover:border-accent/30 cursor-move transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-text-primary text-sm truncate flex-1">
          {deal.deal_name}
        </h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityMeta.color} ml-2 shrink-0`}>
          {(deal.priority?.[0] ?? "?").toUpperCase()}
        </span>
      </div>

      {/* Company */}
      <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
        <div className="w-5 h-5 rounded bg-accent/10 text-accent flex items-center justify-center text-[10px] font-medium">
          {deal.company_name[0]?.toUpperCase()}
        </div>
        <span className="truncate">{deal.company_name}</span>
      </div>

      {/* Check Size */}
      {(deal.check_size_min || deal.check_size_max) && (
        <div className="flex items-center gap-1 text-xs text-text-secondary mb-2">
          <DollarSign size={12} />
          <span>{formatCheckSize(deal.check_size_min ?? null, deal.check_size_max ?? null)}</span>
        </div>
      )}

      {/* Meta Row */}
      <div className="flex items-center justify-between text-[10px] text-text-tertiary">
        <div className="flex items-center gap-2">
          {deal.source_contact_name && (
            <span className="flex items-center gap-1">
              <Users size={10} />
              {deal.source_contact_name}
            </span>
          )}
        </div>
        {deal.next_step_date && (
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {new Date(deal.next_step_date * 1000).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "k";
  }
  return num.toString();
}
