import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Building2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Users,
  Briefcase,
  Filter,
  X,
} from "lucide-react";
import {
  getCompaniesWithStats,
  type DbCompany,
  type CompanyWithStats,
  COMPANY_TYPES,
  FUNDING_STAGES,
} from "@/services/crm/companies";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyForm } from "./CompanyForm";
import { CompanyDetail } from "./CompanyDetail";

 type ViewMode = "grid" | "list";

interface Filters {
  type: "" | import("@/services/crm/companies").CompanyType;
  fundingStage: "" | import("@/services/crm/companies").FundingStage;
  isPortfolio: boolean | null;
  isTarget: boolean | null;
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DbCompany | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithStats | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: "",
    fundingStage: "",
    isPortfolio: null,
    isTarget: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompaniesWithStats(
        {
          type: filters.type || undefined,
          fundingStage: filters.fundingStage || undefined,
          isPortfolio: filters.isPortfolio ?? undefined,
          isTarget: filters.isTarget ?? undefined,
        },
        200,
      );
      setCompanies(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.domain?.toLowerCase().includes(q) ?? false) ||
        (c.location?.toLowerCase().includes(q) ?? false),
    );
  }, [companies, searchQuery]);

  const handleEdit = useCallback((company: DbCompany) => {
    setEditingCompany(company);
    setShowForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingCompany(null);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingCompany(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingCompany(null);
    loadCompanies();
  }, [loadCompanies]);

  const clearFilters = useCallback(() => {
    setFilters({
      type: "",
      fundingStage: "",
      isPortfolio: null,
      isTarget: null,
    });
  }, []);

  const hasActiveFilters =
    filters.type || filters.fundingStage || filters.isPortfolio !== null || filters.isTarget !== null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border-primary bg-bg-primary/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-accent" />
            <h1 className="text-base font-semibold text-text-primary">Companies</h1>
            {!loading && (
              <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                {filteredCompanies.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 bg-bg-tertiary border border-border-primary rounded-lg text-xs text-text-primary outline-none focus:border-accent"
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

            {/* View Toggle */}
            <div className="flex border border-border-primary rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${viewMode === "grid" ? "bg-accent/10 text-accent" : "text-text-tertiary hover:text-text-primary"}`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${viewMode === "list" ? "bg-accent/10 text-accent" : "text-text-tertiary hover:text-text-primary"}`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Plus size={14} />
              Add Company
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-bg-secondary rounded-lg border border-border-primary">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">All Types</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.fundingStage}
                onChange={(e) => setFilters((f) => ({ ...f, fundingStage: e.target.value as Filters["fundingStage"] }))}
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">All Stages</option>
                {FUNDING_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.isPortfolio === null ? "" : filters.isPortfolio ? "yes" : "no"}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    isPortfolio: e.target.value === "" ? null : e.target.value === "yes",
                  }))
                }
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">Portfolio: Any</option>
                <option value="yes">Portfolio</option>
                <option value="no">Not Portfolio</option>
              </select>

              <select
                value={filters.isTarget === null ? "" : filters.isTarget ? "yes" : "no"}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    isTarget: e.target.value === "" ? null : e.target.value === "yes",
                  }))
                }
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">Target: Any</option>
                <option value="yes">Target</option>
                <option value="no">Not Target</option>
              </select>

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

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Company List */}
        <div className={`flex-1 overflow-y-auto p-4 ${selectedCompany ? "border-r border-border-primary" : ""}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-text-tertiary">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={companies.length === 0 ? "No companies yet" : "No matching companies"}
              subtitle={
                companies.length === 0
                  ? "Companies will be auto-created from emails or you can add them manually"
                  : "Try adjusting your search or filters"
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isSelected={selectedCompany?.id === company.id}
                  onClick={() => setSelectedCompany(company)}
                  onEdit={() => handleEdit(company)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCompanies.map((company) => (
                <CompanyListItem
                  key={company.id}
                  company={company}
                  isSelected={selectedCompany?.id === company.id}
                  onClick={() => setSelectedCompany(company)}
                  onEdit={() => handleEdit(company)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCompany && (
          <div className="w-96 shrink-0 overflow-y-auto bg-bg-secondary">
            <CompanyDetail
              company={selectedCompany}
              onClose={() => setSelectedCompany(null)}
              onEdit={() => handleEdit(selectedCompany)}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

interface CompanyCardProps {
  company: CompanyWithStats;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

function CompanyCard({ company, isSelected, onClick, onEdit }: CompanyCardProps) {
  const typeLabel = COMPANY_TYPES.find((t) => t.value === company.company_type)?.label ?? "Other";
  const initial = company.name[0]?.toUpperCase() ?? "?";

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "bg-accent/5 border-accent ring-1 ring-accent"
          : "bg-bg-secondary border-border-primary hover:border-accent/50"
      }`}
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-lg font-semibold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary truncate">{company.name}</h3>
          <p className="text-xs text-text-tertiary">{company.domain ?? "No domain"}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
          {typeLabel}
        </span>
        {company.funding_stage && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
            {FUNDING_STAGES.find((s) => s.value === company.funding_stage)?.label ?? company.funding_stage}
          </span>
        )}
        {company.is_portfolio_company === 1 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Portfolio
          </span>
        )}
        {company.is_target === 1 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Target
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-border-primary flex items-center gap-4 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {company.people_count} people
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={12} />
          {company.active_deals_count} deals
        </span>
      </div>
    </div>
  );
}

interface CompanyListItemProps {
  company: CompanyWithStats;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

function CompanyListItem({ company, isSelected, onClick, onEdit }: CompanyListItemProps) {
  const typeLabel = COMPANY_TYPES.find((t) => t.value === company.company_type)?.label ?? "Other";
  const initial = company.name[0]?.toUpperCase() ?? "?";

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "bg-accent/5 border-accent ring-1 ring-accent"
          : "bg-bg-secondary border-border-primary hover:border-accent/50"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-base font-semibold shrink-0">
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-text-primary truncate">{company.name}</h3>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>{typeLabel}</span>
          {company.domain && <span>• {company.domain}</span>}
          {company.location && <span>• {company.location}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {company.is_portfolio_company === 1 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Portfolio
          </span>
        )}
        {company.is_target === 1 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Target
          </span>
        )}

        <div className="flex items-center gap-3 text-xs text-text-tertiary ml-4">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {company.people_count}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} />
            {company.active_deals_count}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
