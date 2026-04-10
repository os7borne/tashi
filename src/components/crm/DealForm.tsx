import { useState, useEffect, useCallback } from "react";
import {
  X,
  Briefcase,
  Building2,
  Users,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import type { DealWithCompany } from "@/services/crm/deals";
import {
  createDeal,
  updateDeal,
  DEAL_STAGES,
  DEAL_TYPES,
  DEAL_PRIORITIES,
} from "@/services/crm/deals";
import { searchCompanies, type DbCompany } from "@/services/crm/companies";
import { searchPeople, type PersonWithCompany } from "@/services/crm/crmPeople";

interface DealFormProps {
  deal: DealWithCompany | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DealForm({ deal, onClose, onSuccess }: DealFormProps) {
  const isEditing = !!deal;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_id: deal?.company_id ?? "",
    deal_name: deal?.deal_name ?? "",
    stage: deal?.stage ?? "sourced",
    deal_type: deal?.deal_type ?? "new_investment",
    check_size_min: deal?.check_size_min?.toString() ?? "",
    check_size_max: deal?.check_size_max?.toString() ?? "",
    valuation: deal?.valuation ?? "",
    equity_percentage: deal?.equity_percentage?.toString() ?? "",
    priority: deal?.priority ?? "medium",
    source: deal?.source ?? "",
    source_contact_id: deal?.source_contact_id ?? "",
    next_step: deal?.next_step ?? "",
    next_step_date: deal?.next_step_date ? new Date(deal.next_step_date * 1000).toISOString().split("T")[0] : "",
    decision_date: deal?.decision_date ? new Date(deal.decision_date * 1000).toISOString().split("T")[0] : "",
    memo: deal?.memo ?? "",
    thesis_fit: deal?.thesis_fit ?? "",
    risks: deal?.risks ?? "",
    status: deal?.status ?? "active",
  });

  const [companySearch, setCompanySearch] = useState(deal?.company_name ?? "");
  const [companyResults, setCompanyResults] = useState<DbCompany[]>([]);
  const [contactSearch, setContactSearch] = useState(deal?.source_contact_name ?? "");
  const [contactResults, setContactResults] = useState<PersonWithCompany[]>([]);

  // Search companies
  useEffect(() => {
    if (!companySearch.trim() || companySearch === deal?.company_name) {
      setCompanyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCompanies(companySearch, 10);
      setCompanyResults(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [companySearch, deal?.company_name]);

  // Search contacts
  useEffect(() => {
    if (!contactSearch.trim() || contactSearch === deal?.source_contact_name) {
      setContactResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPeople(contactSearch, 10);
      setContactResults(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [contactSearch, deal?.source_contact_name]);

  const handleChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.company_id || !formData.deal_name.trim()) return;

      setSaving(true);
      try {
        const dealData = {
          company_id: formData.company_id,
          deal_name: formData.deal_name.trim(),
          stage: formData.stage,
          deal_type: formData.deal_type,
          check_size_min: formData.check_size_min ? parseInt(formData.check_size_min) : null,
          check_size_max: formData.check_size_max ? parseInt(formData.check_size_max) : null,
          valuation: formData.valuation.trim() || null,
          equity_percentage: formData.equity_percentage ? parseFloat(formData.equity_percentage) : null,
          priority: formData.priority,
          source: formData.source || null,
          source_contact_id: formData.source_contact_id || null,
          next_step: formData.next_step.trim() || null,
          next_step_date: formData.next_step_date
            ? Math.floor(new Date(formData.next_step_date).getTime() / 1000)
            : null,
          decision_date: formData.decision_date
            ? Math.floor(new Date(formData.decision_date).getTime() / 1000)
            : null,
          memo: formData.memo.trim() || null,
          thesis_fit: formData.thesis_fit.trim() || null,
          risks: formData.risks.trim() || null,
          status: formData.status,
          passed_reason: null,
        };

        if (isEditing && deal) {
          await updateDeal(deal.id, dealData);
        } else {
          await createDeal(dealData);
        }
        onSuccess();
      } catch (err) {
        console.error("Failed to save deal:", err);
        alert("Failed to save deal. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [formData, isEditing, deal, onSuccess],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg-primary rounded-xl shadow-xl border border-border-primary overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-accent" />
            <h2 className="font-semibold text-text-primary">
              {isEditing ? "Edit Deal" : "Add New Deal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {/* Company Selection */}
            <div className="relative">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search for a company..."
                  className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  required
                  disabled={isEditing}
                />
              </div>
              {companyResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-primary rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {companyResults.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => {
                        setFormData((f) => ({ ...f, company_id: company.id }));
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

            {/* Deal Name */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Deal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deal_name}
                onChange={(e) => handleChange("deal_name", e.target.value)}
                placeholder="e.g., Acme Series A"
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>

            {/* Stage & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleChange("stage", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {DEAL_STAGES.filter((s) => s.order < 99).map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {DEAL_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deal Type & Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Deal Type</label>
                <select
                  value={formData.deal_type}
                  onChange={(e) => handleChange("deal_type", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {DEAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange("source", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">Select source...</option>
                  <option value="warm_intro">Warm Intro</option>
                  <option value="cold_outbound">Cold Outbound</option>
                  <option value="accelerator">Accelerator</option>
                  <option value="incubator">Incubator</option>
                  <option value="event">Event</option>
                  <option value="portfolio_referral">Portfolio Referral</option>
                  <option value="investor_referral">Investor Referral</option>
                  <option value="online">Online</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Source Contact */}
            <div className="relative">
              <label className="block text-xs font-medium text-text-secondary mb-1">Source Contact</label>
              <div className="relative">
                <Users size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Who introduced this deal?"
                  className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              {contactResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-primary rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {contactResults.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setFormData((f) => ({ ...f, source_contact_id: contact.id }));
                        setContactSearch(contact.display_name ?? contact.email);
                        setContactResults([]);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-bg-hover"
                    >
                      {contact.display_name ?? contact.email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Check Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Min Check Size</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="number"
                    value={formData.check_size_min}
                    onChange={(e) => handleChange("check_size_min", e.target.value)}
                    placeholder="e.g., 100000"
                    className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Check Size</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="number"
                    value={formData.check_size_max}
                    onChange={(e) => handleChange("check_size_max", e.target.value)}
                    placeholder="e.g., 500000"
                    className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Valuation & Equity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Valuation</label>
                <input
                  type="text"
                  value={formData.valuation}
                  onChange={(e) => handleChange("valuation", e.target.value)}
                  placeholder="e.g., $10M"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Equity %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.equity_percentage}
                  onChange={(e) => handleChange("equity_percentage", e.target.value)}
                  placeholder="e.g., 15.5"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Next Step Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="date"
                    value={formData.next_step_date}
                    onChange={(e) => handleChange("next_step_date", e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Target Decision Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="date"
                    value={formData.decision_date}
                    onChange={(e) => handleChange("decision_date", e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Next Step */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Next Step</label>
              <input
                type="text"
                value={formData.next_step}
                onChange={(e) => handleChange("next_step", e.target.value)}
                placeholder="e.g., Schedule follow-up call"
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {/* Thesis Fit */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Thesis Fit</label>
              <textarea
                value={formData.thesis_fit}
                onChange={(e) => handleChange("thesis_fit", e.target.value)}
                placeholder="How does this investment fit your thesis?"
                rows={2}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Risks */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                <span className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Key Risks
                </span>
              </label>
              <textarea
                value={formData.risks}
                onChange={(e) => handleChange("risks", e.target.value)}
                placeholder="What are the main risks with this investment?"
                rows={2}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Investment Memo */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  Investment Memo
                </span>
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) => handleChange("memo", e.target.value)}
                placeholder="Write your investment memo here..."
                rows={4}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="active">Active</option>
                <option value="passed">Passed</option>
                <option value="invested">Invested</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.company_id || !formData.deal_name.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
