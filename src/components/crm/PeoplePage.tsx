import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Battery,
  BatteryMedium,
  BatteryLow,
  Filter,
  X,
  Building2,
  Users,
} from "lucide-react";
import {
  getPeople,
  type PersonWithCompany,
  RELATIONSHIP_TYPES,
  getRelationshipTypeMeta,
  getBatteryMeta,
} from "@/services/crm/crmPeople";
import { searchCompanies, type DbCompany } from "@/services/crm/companies";
import { EmptyState } from "@/components/ui/EmptyState";
import { PersonDetail } from "./PersonDetail";
import { recalculateAndSaveBattery } from "@/services/crm/batteryScoring";

interface Filters {
  relationshipType: "" | import("@/services/crm/crmPeople").RelationshipType;
  companyId: string;
  minBattery: number | null;
}

export function PeoplePage() {
  const [people, setPeople] = useState<PersonWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<PersonWithCompany | null>(null);
  const [filters, setFilters] = useState<Filters>({
    relationshipType: "",
    companyId: "",
    minBattery: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<DbCompany[]>([]);
  const [recalculating, setRecalculating] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPeople(
        {
          relationshipType: filters.relationshipType || undefined,
          companyId: filters.companyId || undefined,
          minBattery: filters.minBattery ?? undefined,
        },
        500,
      );
      setPeople(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Search companies for filter
  useEffect(() => {
    if (!companySearch.trim()) {
      setCompanyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCompanies(companySearch, 10);
      setCompanyResults(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [companySearch]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return people;
    const q = searchQuery.toLowerCase();
    return people.filter(
      (p) =>
        (p.display_name?.toLowerCase().includes(q) ?? false) ||
        p.email.toLowerCase().includes(q) ||
        (p.company_name?.toLowerCase().includes(q) ?? false),
    );
  }, [people, searchQuery]);

  const handleRecalculateBattery = useCallback(
    async (personId: string) => {
      setRecalculating(personId);
      try {
        await recalculateAndSaveBattery(personId);
        loadPeople();
      } finally {
        setRecalculating(null);
      }
    },
    [loadPeople],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      relationshipType: "",
      companyId: "",
      minBattery: null,
    });
    setCompanySearch("");
  }, []);

  const hasActiveFilters = filters.relationshipType || filters.companyId || filters.minBattery !== null;

  // Battery distribution for stats
  const batteryStats = useMemo(() => {
    const total = people.length;
    if (total === 0) return null;
    return {
      strong: people.filter((p) => p.battery_level >= 80).length,
      warm: people.filter((p) => p.battery_level >= 50 && p.battery_level < 80).length,
      cold: people.filter((p) => p.battery_level < 50).length,
    };
  }, [people]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border-primary bg-bg-primary/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-accent" />
            <h1 className="text-base font-semibold text-text-primary">People</h1>
            {!loading && (
              <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                {filteredPeople.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search people..."
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
          </div>
        </div>

        {/* Battery Stats */}
        {batteryStats && (
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-text-tertiary">Battery:</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <Battery size={12} />
              {batteryStats.strong} strong
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <BatteryMedium size={12} />
              {batteryStats.warm} warm
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <BatteryLow size={12} />
              {batteryStats.cold} cold
            </span>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-bg-secondary rounded-lg border border-border-primary space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Relationship Type */}
              <select
                value={filters.relationshipType}
                onChange={(e) => setFilters((f) => ({ ...f, relationshipType: e.target.value as Filters["relationshipType"] }))}
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">All Relationships</option>
                {RELATIONSHIP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Min Battery */}
              <select
                value={filters.minBattery === null ? "" : filters.minBattery.toString()}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minBattery: e.target.value === "" ? null : parseInt(e.target.value),
                  }))
                }
                className="text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
              >
                <option value="">Any Battery</option>
                <option value="80">80%+ (Strong)</option>
                <option value="50">50%+ (Warm)</option>
                <option value="20">20%+</option>
              </select>

              {/* Company Filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by company..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-40 text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
                />
                {companyResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-primary rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {companyResults.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setFilters((f) => ({ ...f, companyId: company.id }));
                          setCompanySearch(company.name);
                          setCompanyResults([]);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-bg-hover"
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
        {/* People List */}
        <div className={`flex-1 overflow-y-auto ${selectedPerson ? "border-r border-border-primary" : ""}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-text-tertiary">Loading people...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <EmptyState
              icon={Users}
              title={people.length === 0 ? "No people yet" : "No matching people"}
              subtitle={
                people.length === 0
                  ? "People will be added as you receive emails"
                  : "Try adjusting your search or filters"
              }
            />
          ) : (
            <div className="divide-y divide-border-primary">
              {filteredPeople.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  isSelected={selectedPerson?.id === person.id}
                  onClick={() => setSelectedPerson(person)}
                  onRecalculateBattery={() => handleRecalculateBattery(person.id)}
                  isRecalculating={recalculating === person.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedPerson && (
          <div className="w-96 shrink-0 overflow-y-auto bg-bg-secondary">
            <PersonDetail
              person={selectedPerson}
              onClose={() => setSelectedPerson(null)}
              onRefresh={loadPeople}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface PersonRowProps {
  person: PersonWithCompany;
  isSelected: boolean;
  onClick: () => void;
  onRecalculateBattery: () => void;
  isRecalculating: boolean;
}

function PersonRow({
  person,
  isSelected,
  onClick,
  onRecalculateBattery,
  isRecalculating,
}: PersonRowProps) {
  const relationshipMeta = getRelationshipTypeMeta(person.relationship_type);
  const batteryMeta = getBatteryMeta(person.battery_level);
  const initial = (person.display_name?.[0] ?? person.email[0])?.toUpperCase() ?? "?";

  const BatteryIcon =
    person.battery_level >= 80 ? Battery : person.battery_level >= 50 ? BatteryMedium : BatteryLow;

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        isSelected ? "bg-accent/5" : "hover:bg-bg-hover"
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-base font-semibold shrink-0">
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary truncate">
            {person.display_name ?? person.email}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${relationshipMeta.color}`}>
            {relationshipMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {person.display_name && <span>{person.email}</span>}
          {person.company_name && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 size={10} />
                {person.company_name}
              </span>
            </>
          )}
          {person.title && (
            <>
              <span>•</span>
              <span>{person.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Battery */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRecalculateBattery();
          }}
          disabled={isRecalculating}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
            person.battery_level >= 80
              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
              : person.battery_level >= 50
                ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                : "text-red-600 bg-red-50 dark:bg-red-900/20"
          } ${isRecalculating ? "opacity-50" : "hover:opacity-80"}`}
          title={`${batteryMeta.label} relationship (${Math.round(person.battery_level)}%) - Click to recalculate`}
        >
          <BatteryIcon size={12} className={isRecalculating ? "animate-pulse" : ""} />
          {Math.round(person.battery_level)}%
        </button>
      </div>

      {/* Email count */}
      <div className="text-xs text-text-tertiary w-12 text-right">{person.frequency} emails</div>
    </div>
  );
}
