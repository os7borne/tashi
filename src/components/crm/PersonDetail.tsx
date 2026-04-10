import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Building2,
  Battery,
  Link2,
  Edit2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PersonWithCompany } from "@/services/crm/crmPeople";
import {
  getRelationshipTypeMeta,
  getBatteryMeta,
  RELATIONSHIP_TYPES,
  updateTitle,
} from "@/services/crm/crmPeople";
import { getBatteryFactors } from "@/services/crm/batteryScoring";
import type { BatteryFactors } from "@/services/crm/batteryScoring";
import { searchCompanies, type DbCompany } from "@/services/crm/companies";
import { navigateToLabel } from "@/router/navigate";
import { formatRelativeDate } from "@/utils/date";
import { getRecentThreadsWithContact } from "@/services/db/contacts";

interface PersonDetailProps {
  person: PersonWithCompany;
  onClose: () => void;
  onRefresh: () => void;
}

export function PersonDetail({ person, onClose, onRefresh }: PersonDetailProps) {
  const [batteryFactors, setBatteryFactors] = useState<BatteryFactors | null>(null);
  const [showFactors, setShowFactors] = useState(false);
  const [recentThreads, setRecentThreads] = useState<{ thread_id: string; subject: string | null; last_message_at: number | null }[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<DbCompany[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(person.title ?? "");

  useEffect(() => {
    loadBatteryFactors();
    loadRecentThreads();
  }, [person.id]);

  const loadBatteryFactors = async () => {
    const factors = await getBatteryFactors(person.id);
    setBatteryFactors(factors);
  };

  const loadRecentThreads = async () => {
    const threads = await getRecentThreadsWithContact(person.email, 5);
    setRecentThreads(threads);
  };

  // Search companies
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

  const handleSaveTitle = async () => {
    await updateTitle(person.id, titleInput.trim() || null);
    setEditingTitle(false);
    onRefresh();
  };

  const relationshipMeta = getRelationshipTypeMeta(person.relationship_type);
  const batteryMeta = getBatteryMeta(person.battery_level);
  const initial = (person.display_name?.[0] ?? person.email[0])?.toUpperCase() ?? "?";

  const handleEmailClick = () => {
    navigateToLabel("inbox");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("velo-compose-to", { detail: { to: person.email, name: person.display_name } }));
    }, 100);
  };

  const handleThreadClick = (threadId: string) => {
    navigateToLabel("all", { threadId });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border-primary flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xl font-semibold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-text-primary truncate">
              {person.display_name ?? person.email}
            </h2>
            {person.display_name && (
              <p className="text-xs text-text-tertiary">{person.email}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${relationshipMeta.color}`}>
                {relationshipMeta.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleEmailClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
          >
            <Mail size={12} />
            Email
          </button>
        </div>

        {/* Battery Level */}
        <div className="p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Battery size={16} className={batteryMeta.color} />
              <span className="text-sm font-medium text-text-primary">Relationship Strength</span>
            </div>
            <span className={`text-sm font-semibold ${batteryMeta.color}`}>
              {Math.round(person.battery_level)}% - {batteryMeta.label}
            </span>
          </div>

          {/* Battery Bar */}
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                person.battery_level >= 80
                  ? "bg-emerald-500"
                  : person.battery_level >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${person.battery_level}%` }}
            />
          </div>

          {/* Factors Toggle */}
          {batteryFactors && (
            <button
              onClick={() => setShowFactors(!showFactors)}
              className="mt-2 flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary"
            >
              {showFactors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showFactors ? "Hide factors" : "Show factors"}
            </button>
          )}

          {/* Factors Detail */}
          {showFactors && batteryFactors && (
            <div className="mt-3 pt-3 border-t border-border-primary space-y-1 text-xs">
              <FactorRow label="Email frequency" value={batteryFactors.emailFrequency} max={5} />
              <FactorRow label="Recency" value={batteryFactors.recencyScore} max={5} />
              <FactorRow label="Response rate" value={batteryFactors.responseRate} max={10} />
              <FactorRow label="Network centrality" value={batteryFactors.networkCentrality} max={5} />
              <FactorRow label="Meeting count" value={batteryFactors.meetingCount * 2} max={10} />
              <FactorRow label="Deals introduced" value={batteryFactors.dealsIntroduced * 5} max={15} />
              {batteryFactors.inactivityPenalty > 0 && (
                <div className="flex items-center justify-between text-red-500">
                  <span>Inactivity penalty</span>
                  <span>-{Math.round(batteryFactors.inactivityPenalty)}</span>
                </div>
              )}
              {batteryFactors.ghostRatePenalty > 0 && (
                <div className="flex items-center justify-between text-red-500">
                  <span>Ghost rate penalty</span>
                  <span>-{Math.round(batteryFactors.ghostRatePenalty)}</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-border-primary text-text-tertiary">
                Last calculated: {formatRelativeDate(batteryFactors.lastCalculatedAt)}
              </div>
            </div>
          )}
        </div>

        {/* Company Affiliation */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Company</h4>
          {person.company_id ? (
            <div className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-md">
              <Building2 size={14} className="text-text-secondary" />
              <span className="text-sm text-text-primary flex-1">{person.company_name}</span>
              <button
                onClick={() => onRefresh()}
                className="text-xs text-text-tertiary hover:text-text-primary"
              >
                <Link2 size={12} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-tertiary">Not linked to a company</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search company to link..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
                />
                {companyResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-primary rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {companyResults.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          // Link will happen via parent callback
                          setCompanySearch("");
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
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Title</h4>
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Job title..."
                className="flex-1 text-xs bg-bg-tertiary border border-border-primary rounded-md px-2 py-1.5 text-text-primary"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="px-2 py-1.5 text-xs bg-accent text-white rounded-md"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditingTitle(true)}
              className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-md cursor-pointer hover:bg-bg-hover"
            >
              <span className="text-sm text-text-primary">
                {person.title || "Add title..."}
              </span>
              <Edit2 size={12} className="text-text-tertiary ml-auto" />
            </div>
          )}
        </div>

        {/* Relationship Type */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Relationship Type</h4>
          <div className="flex flex-wrap gap-1">
            {RELATIONSHIP_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  // This would update the relationship type
                }}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  person.relationship_type === type.value
                    ? type.color
                    : "bg-bg-tertiary text-text-tertiary hover:bg-bg-hover"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Emails */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Recent Emails</h4>
          {recentThreads.length === 0 ? (
            <p className="text-xs text-text-tertiary">No recent emails</p>
          ) : (
            <div className="space-y-1">
              {recentThreads.map((thread) => (
                <button
                  key={thread.thread_id}
                  onClick={() => handleThreadClick(thread.thread_id)}
                  className="w-full text-left p-2 bg-bg-tertiary rounded-md hover:bg-bg-hover transition-colors"
                >
                  <p className="text-xs text-text-primary truncate">
                    {thread.subject || "(no subject)"}
                  </p>
                  {thread.last_message_at && (
                    <p className="text-[10px] text-text-tertiary">
                      {formatRelativeDate(thread.last_message_at)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="pt-2 border-t border-border-primary">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-text-tertiary">Total emails</span>
              <p className="font-medium text-text-primary">{person.frequency}</p>
            </div>
            <div>
              <span className="text-text-tertiary">Last contacted</span>
              <p className="font-medium text-text-primary">
                {person.last_contacted_at
                  ? formatRelativeDate(person.last_contacted_at)
                  : "Never"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-xs text-text-tertiary">
          Added {formatRelativeDate(person.created_at)}
        </div>
      </div>
    </div>
  );
}

function FactorRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-text-primary w-6 text-right">+{Math.round(value)}</span>
      </div>
    </div>
  );
}
