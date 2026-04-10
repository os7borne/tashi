import { useState, useCallback } from "react";
import { X, Building2 } from "lucide-react";
import type { DbCompany } from "@/services/crm/companies";
import { createCompany, updateCompany, COMPANY_TYPES, FUNDING_STAGES } from "@/services/crm/companies";

interface CompanyFormProps {
  company: DbCompany | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompanyForm({ company, onClose, onSuccess }: CompanyFormProps) {
  const isEditing = !!company;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name ?? "",
    domain: company?.domain ?? "",
    company_type: company?.company_type ?? "startup",
    website: company?.website ?? "",
    description: company?.description ?? "",
    location: company?.location ?? "",
    linkedin_url: company?.linkedin_url ?? "",
    crunchbase_url: company?.crunchbase_url ?? "",
    employee_count: company?.employee_count ?? "",
    funding_stage: company?.funding_stage ?? "",
    total_funding: company?.total_funding ?? "",
    valuation: company?.valuation ?? "",
    is_portfolio_company: company?.is_portfolio_company === 1,
    is_target: company?.is_target === 1,
    notes: company?.notes ?? "",
  });

  const handleChange = useCallback(
    (field: string, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim()) return;

      setSaving(true);
      try {
        if (isEditing && company) {
          await updateCompany(company.id, {
            name: formData.name.trim(),
            domain: formData.domain.trim() || null,
            company_type: formData.company_type,
            website: formData.website.trim() || null,
            description: formData.description.trim() || null,
            location: formData.location.trim() || null,
            linkedin_url: formData.linkedin_url.trim() || null,
            crunchbase_url: formData.crunchbase_url.trim() || null,
            employee_count: formData.employee_count || null,
            funding_stage: formData.funding_stage || null,
            total_funding: formData.total_funding.trim() || null,
            valuation: formData.valuation.trim() || null,
            is_portfolio_company: formData.is_portfolio_company ? 1 : 0,
            is_target: formData.is_target ? 1 : 0,
            notes: formData.notes.trim() || null,
          });
        } else {
          await createCompany({
            name: formData.name.trim(),
            domain: formData.domain.trim() || null,
            company_type: formData.company_type,
            website: formData.website.trim() || null,
            description: formData.description.trim() || null,
            location: formData.location.trim() || null,
            linkedin_url: formData.linkedin_url.trim() || null,
            crunchbase_url: formData.crunchbase_url.trim() || null,
            employee_count: formData.employee_count || null,
            funding_stage: formData.funding_stage || null,
            total_funding: formData.total_funding.trim() || null,
            valuation: formData.valuation.trim() || null,
            is_portfolio_company: formData.is_portfolio_company ? 1 : 0,
            is_target: formData.is_target ? 1 : 0,
            notes: formData.notes.trim() || null,
          });
        }
        onSuccess();
      } catch (err) {
        console.error("Failed to save company:", err);
        alert("Failed to save company. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [formData, isEditing, company, onSuccess],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-bg-primary rounded-xl shadow-xl border border-border-primary overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-accent" />
            <h2 className="font-semibold text-text-primary">
              {isEditing ? "Edit Company" : "Add Company"}
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
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Acme Inc"
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>

            {/* Domain & Website */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => handleChange("domain", e.target.value)}
                  placeholder="e.g., acme.com"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Type & Stage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Company Type</label>
                <select
                  value={formData.company_type}
                  onChange={(e) => handleChange("company_type", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Funding Stage</label>
                <select
                  value={formData.funding_stage}
                  onChange={(e) => handleChange("funding_stage", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">Select stage...</option>
                  {FUNDING_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Employee Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Employee Count</label>
                <select
                  value={formData.employee_count}
                  onChange={(e) => handleChange("employee_count", e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">Select range...</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
            </div>

            {/* Funding & Valuation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Total Funding</label>
                <input
                  type="text"
                  value={formData.total_funding}
                  onChange={(e) => handleChange("total_funding", e.target.value)}
                  placeholder="e.g., $10M"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Valuation</label>
                <input
                  type="text"
                  value={formData.valuation}
                  onChange={(e) => handleChange("valuation", e.target.value)}
                  placeholder="e.g., $50M"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* External Links */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleChange("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Crunchbase URL</label>
                <input
                  type="url"
                  value={formData.crunchbase_url}
                  onChange={(e) => handleChange("crunchbase_url", e.target.value)}
                  placeholder="https://crunchbase.com/organization/..."
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Brief description of the company..."
                rows={3}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Flags */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_portfolio_company}
                  onChange={(e) => handleChange("is_portfolio_company", e.target.checked)}
                  className="w-4 h-4 rounded border-border-primary text-accent focus:ring-accent"
                />
                <span className="text-sm text-text-secondary">Portfolio Company</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_target}
                  onChange={(e) => handleChange("is_target", e.target.checked)}
                  className="w-4 h-4 rounded border-border-primary text-accent focus:ring-accent"
                />
                <span className="text-sm text-text-secondary">Investment Target</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Private notes about this company..."
                rows={3}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
              />
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
              disabled={saving || !formData.name.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
