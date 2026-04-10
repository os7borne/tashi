import { useState, useEffect, useCallback } from "react";
import {
  X,
  Edit2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Linkedin,
  ExternalLink,
  Mail,
  Battery,
  ArrowRight,
} from "lucide-react";
import type { CompanyWithStats } from "@/services/crm/companies";
import { COMPANY_TYPES, FUNDING_STAGES } from "@/services/crm/companies";
import { getPeopleByCompany } from "@/services/crm/crmPeople";
import { getDealsByCompany } from "@/services/crm/deals";
import type { DbDeal } from "@/services/crm/deals";
import { formatRelativeDate } from "@/utils/date";
import { navigateToLabel } from "@/router/navigate";

interface CompanyDetailProps {
  company: CompanyWithStats;
  onClose: () => void;
  onEdit: () => void;
}

export function CompanyDetail({ company, onClose, onEdit }: CompanyDetailProps) {
  const [people, setPeople] = useState<{ id: string; display_name: string | null; email: string; relationship_type: string; title: string | null; battery_level: number }[]>([]);
  const [deals, setDeals] = useState<DbDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [peopleData, dealsData] = await Promise.all([
        getPeopleByCompany(company.id),
        getDealsByCompany(company.id),
      ]);
      setPeople(peopleData);
      setDeals(dealsData);
    } finally {
      setLoading(false);
    }
  }, [company.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const typeLabel = COMPANY_TYPES.find((t) => t.value === company.company_type)?.label ?? "Other";
  const stageLabel = FUNDING_STAGES.find((s) => s.value === company.funding_stage)?.label;

  const handleEmailDomain = useCallback(() => {
    if (company.domain) {
      navigateToLabel("inbox");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("velo-search", { detail: { query: `from:*@${company.domain}` } }));
      }, 100);
    }
  }, [company.domain]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border-primary flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xl font-semibold shrink-0">
            {company.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-text-primary truncate">{company.name}</h2>
            <p className="text-xs text-text-tertiary">{typeLabel}</p>
            <div className="flex items-center gap-2 mt-1">
              {company.is_portfolio_company === 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Portfolio Company
                </span>
              )}
              {company.is_target === 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Investment Target
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
            title="Edit company"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Links */}
        {(company.website || company.domain || company.linkedin_url || company.crunchbase_url) && (
          <div className="flex flex-wrap gap-2">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover bg-accent/5 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Globe size={12} />
                Website
                <ExternalLink size={10} />
              </a>
            )}
            {company.domain && (
              <button
                onClick={handleEmailDomain}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover bg-accent/5 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Mail size={12} />
                Emails from {company.domain}
              </button>
            )}
            {company.linkedin_url && (
              <a
                href={company.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#0A66C2] hover:opacity-80 bg-[#0A66C2]/10 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Linkedin size={12} />
                LinkedIn
                <ExternalLink size={10} />
              </a>
            )}
            {company.crunchbase_url && (
              <a
                href={company.crunchbase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#00C85C] hover:opacity-80 bg-[#00C85C]/10 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <ExternalLink size={12} />
                Crunchbase
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        {/* Details */}
        <div className="space-y-2">
          {company.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-text-tertiary" />
              <span className="text-text-primary">{company.location}</span>
            </div>
          )}

          {stageLabel && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={14} className="text-text-tertiary" />
              <span className="text-text-primary">{stageLabel}</span>
            </div>
          )}

          {(company.total_funding || company.valuation) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-tertiary">💰</span>
              <span className="text-text-primary">
                {company.total_funding && `Raised: ${company.total_funding}`}
                {company.total_funding && company.valuation && " • "}
                {company.valuation && `Valuation: ${company.valuation}`}
              </span>
            </div>
          )}

          {company.employee_count && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-text-tertiary" />
              <span className="text-text-primary">{company.employee_count} employees</span>
            </div>
          )}
        </div>

        {/* Description */}
        {company.description && (
          <div className="pt-2 border-t border-border-primary">
            <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Description</h4>
            <p className="text-sm text-text-secondary leading-relaxed">{company.description}</p>
          </div>
        )}

        {/* Team Members */}
        <div className="pt-2 border-t border-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Team ({people.length})
            </h4>
          </div>

          {loading ? (
            <p className="text-xs text-text-tertiary">Loading...</p>
          ) : people.length === 0 ? (
            <p className="text-xs text-text-tertiary">No team members linked yet</p>
          ) : (
            <div className="space-y-1">
              {people.slice(0, 10).map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
              {people.length > 10 && (
                <p className="text-xs text-text-tertiary text-center py-1">
                  +{people.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Deals */}
        <div className="pt-2 border-t border-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Deals ({deals.length})
            </h4>
          </div>

          {loading ? (
            <p className="text-xs text-text-tertiary">Loading...</p>
          ) : deals.length === 0 ? (
            <p className="text-xs text-text-tertiary">No deals yet</p>
          ) : (
            <div className="space-y-2">
              {deals.slice(0, 5).map((deal) => (
                <DealRow key={deal.id} deal={deal} />
              ))}
              {deals.length > 5 && (
                <p className="text-xs text-text-tertiary text-center py-1">
                  +{deals.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {company.notes && (
          <div className="pt-2 border-t border-border-primary">
            <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Notes</h4>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{company.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 text-xs text-text-tertiary">
          Added {formatRelativeDate(company.created_at)}
        </div>
      </div>
    </div>
  );
}

interface PersonRowProps {
  person: { id: string; display_name: string | null; email: string; relationship_type: string; title: string | null; battery_level: number };
}

function PersonRow({ person }: PersonRowProps) {
  const relationshipColors: Record<string, string> = {
    founder: "text-emerald-600",
    investor: "text-blue-600",
    team: "text-violet-600",
    advisor: "text-amber-600",
    partner: "text-rose-600",
    other: "text-zinc-500",
  };

  const batteryColor = person.battery_level >= 80 ? "text-emerald-500" : person.battery_level >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-bg-hover transition-colors cursor-pointer">
      <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium shrink-0">
        {(person.display_name?.[0] ?? person.email[0])?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {person.display_name ?? person.email}
          </span>
          <span className={`text-[10px] capitalize ${relationshipColors[person.relationship_type] ?? "text-zinc-500"}`}>
            {person.relationship_type}
          </span>
        </div>
        {person.title && (
          <p className="text-xs text-text-tertiary truncate">{person.title}</p>
        )}
      </div>
      <div className={`flex items-center gap-1 text-xs ${batteryColor}`}>
        <Battery size={12} />
        {person.battery_level}%
      </div>
    </div>
  );
}

interface DealRowProps {
  deal: DbDeal;
}

function DealRow({ deal }: DealRowProps) {
  const stageColors: Record<string, string> = {
    sourced: "bg-zinc-100 text-zinc-600",
    screening: "bg-blue-50 text-blue-600",
    first_meeting: "bg-indigo-50 text-indigo-600",
    diligence: "bg-violet-50 text-violet-600",
    partner_meeting: "bg-purple-50 text-purple-600",
    term_sheet: "bg-fuchsia-50 text-fuchsia-600",
    negotiation: "bg-amber-50 text-amber-600",
    committed: "bg-emerald-50 text-emerald-600",
    closed: "bg-green-50 text-green-600",
    passed: "bg-red-50 text-red-600",
    on_hold: "bg-gray-50 text-gray-600",
  };

  const priorityColors: Record<string, string> = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-blue-500",
  };

  return (
    <div className="p-2.5 rounded-lg bg-bg-tertiary/50 border border-border-primary">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary text-sm">{deal.deal_name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stageColors[deal.stage] ?? "bg-zinc-100 text-zinc-600"}`}>
              {deal.stage.replace("_", " ")}
            </span>
          </div>
          {deal.check_size_min || deal.check_size_max ? (
            <p className="text-xs text-text-secondary mt-0.5">
              {formatCheckSize(deal.check_size_min, deal.check_size_max)}
            </p>
          ) : null}
        </div>
        <span className={`text-xs font-medium ${priorityColors[deal.priority] ?? "text-text-tertiary"}`}>
          {deal.priority.toUpperCase()}
        </span>
      </div>

      {deal.next_step && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-tertiary">
          <ArrowRight size={10} />
          <span>{deal.next_step}</span>
          {deal.next_step_date && (
            <span className="text-text-secondary">• {formatRelativeDate(deal.next_step_date)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function formatCheckSize(min: number | null, max: number | null): string {
  if (!min && !max) return "Check size TBD";
  if (min && !max) return `$${formatNumber(min)}+`;
  if (!min && max) return `Up to $${formatNumber(max)}`;
  if (min === max) return `$${formatNumber(min!)}`;
  return `$${formatNumber(min!)}-$${formatNumber(max!)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "k";
  }
  return num.toString();
}
