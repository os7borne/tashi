import { getDb } from "@/services/db/connection";

export interface DbCompany {
  id: string;
  name: string;
  domain: string | null;
  company_type: string;
  website: string | null;
  description: string | null;
  location: string | null;
  linkedin_url: string | null;
  crunchbase_url: string | null;
  employee_count: string | null;
  funding_stage: string | null;
  total_funding: string | null;
  valuation: string | null;
  is_portfolio_company: number;
  is_target: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface CompanyWithStats extends DbCompany {
  people_count: number;
  active_deals_count: number;
}

export type CompanyType = "startup" | "vc_firm" | "enterprise" | "accelerator" | "incubator" | "other";
export type FundingStage = "pre_seed" | "seed" | "series_a" | "series_b" | "series_c" | "growth" | "public" | "acquired";

export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "startup", label: "Startup" },
  { value: "vc_firm", label: "VC Firm" },
  { value: "enterprise", label: "Enterprise" },
  { value: "accelerator", label: "Accelerator" },
  { value: "incubator", label: "Incubator" },
  { value: "other", label: "Other" },
];

export const FUNDING_STAGES: { value: FundingStage; label: string }[] = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C+" },
  { value: "growth", label: "Growth" },
  { value: "public", label: "Public" },
  { value: "acquired", label: "Acquired" },
];

/**
 * Create a new company.
 */
export async function createCompany(
  data: Omit<DbCompany, "id" | "created_at" | "updated_at">,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO companies (
      id, name, domain, company_type, website, description, location,
      linkedin_url, crunchbase_url, employee_count, funding_stage,
      total_funding, valuation, is_portfolio_company, is_target, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      id,
      data.name,
      data.domain,
      data.company_type,
      data.website,
      data.description,
      data.location,
      data.linkedin_url,
      data.crunchbase_url,
      data.employee_count,
      data.funding_stage,
      data.total_funding,
      data.valuation,
      data.is_portfolio_company,
      data.is_target,
      data.notes,
    ],
  );
  return id;
}

/**
 * Update a company.
 */
export async function updateCompany(
  id: string,
  data: Partial<Omit<DbCompany, "id" | "created_at" | "updated_at">>,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) { fields.push("name = $" + (fields.length + 1)); values.push(data.name); }
  if (data.domain !== undefined) { fields.push("domain = $" + (fields.length + 1)); values.push(data.domain); }
  if (data.company_type !== undefined) { fields.push("company_type = $" + (fields.length + 1)); values.push(data.company_type); }
  if (data.website !== undefined) { fields.push("website = $" + (fields.length + 1)); values.push(data.website); }
  if (data.description !== undefined) { fields.push("description = $" + (fields.length + 1)); values.push(data.description); }
  if (data.location !== undefined) { fields.push("location = $" + (fields.length + 1)); values.push(data.location); }
  if (data.linkedin_url !== undefined) { fields.push("linkedin_url = $" + (fields.length + 1)); values.push(data.linkedin_url); }
  if (data.crunchbase_url !== undefined) { fields.push("crunchbase_url = $" + (fields.length + 1)); values.push(data.crunchbase_url); }
  if (data.employee_count !== undefined) { fields.push("employee_count = $" + (fields.length + 1)); values.push(data.employee_count); }
  if (data.funding_stage !== undefined) { fields.push("funding_stage = $" + (fields.length + 1)); values.push(data.funding_stage); }
  if (data.total_funding !== undefined) { fields.push("total_funding = $" + (fields.length + 1)); values.push(data.total_funding); }
  if (data.valuation !== undefined) { fields.push("valuation = $" + (fields.length + 1)); values.push(data.valuation); }
  if (data.is_portfolio_company !== undefined) { fields.push("is_portfolio_company = $" + (fields.length + 1)); values.push(data.is_portfolio_company); }
  if (data.is_target !== undefined) { fields.push("is_target = $" + (fields.length + 1)); values.push(data.is_target); }
  if (data.notes !== undefined) { fields.push("notes = $" + (fields.length + 1)); values.push(data.notes); }

  if (fields.length === 0) return;

  fields.push("updated_at = unixepoch()");
  values.push(id);

  await db.execute(
    `UPDATE companies SET ${fields.join(", ")} WHERE id = $${values.length}`,
    values,
  );
}

/**
 * Delete a company.
 */
export async function deleteCompany(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM companies WHERE id = $1", [id]);
}

/**
 * Get company by ID.
 */
export async function getCompanyById(id: string): Promise<DbCompany | null> {
  const db = await getDb();
  const rows = await db.select<DbCompany[]>(
    "SELECT * FROM companies WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Get company by domain.
 */
export async function getCompanyByDomain(domain: string): Promise<DbCompany | null> {
  const db = await getDb();
  const rows = await db.select<DbCompany[]>(
    "SELECT * FROM companies WHERE domain = $1",
    [domain.toLowerCase()],
  );
  return rows[0] ?? null;
}

/**
 * Search companies by name or domain.
 */
export async function searchCompanies(
  query: string,
  limit = 20,
): Promise<DbCompany[]> {
  const db = await getDb();
  const pattern = `%${query}%`;
  return db.select<DbCompany[]>(
    `SELECT * FROM companies 
     WHERE name LIKE $1 OR domain LIKE $1
     ORDER BY name ASC
     LIMIT $2`,
    [pattern, limit],
  );
}

/**
 * Get all companies with people and deal counts.
 */
export async function getCompaniesWithStats(
  filters?: {
    type?: CompanyType;
    fundingStage?: FundingStage;
    isPortfolio?: boolean;
    isTarget?: boolean;
  },
  limit = 100,
): Promise<CompanyWithStats[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filters?.type) {
    conditions.push("c.company_type = $" + (values.length + 1));
    values.push(filters.type);
  }
  if (filters?.fundingStage) {
    conditions.push("c.funding_stage = $" + (values.length + 1));
    values.push(filters.fundingStage);
  }
  if (filters?.isPortfolio !== undefined) {
    conditions.push("c.is_portfolio_company = $" + (values.length + 1));
    values.push(filters.isPortfolio ? 1 : 0);
  }
  if (filters?.isTarget !== undefined) {
    conditions.push("c.is_target = $" + (values.length + 1));
    values.push(filters.isTarget ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  values.push(limit);

  return db.select<CompanyWithStats[]>(
    `SELECT 
      c.*,
      COUNT(DISTINCT ct.id) as people_count,
      COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) as active_deals_count
     FROM companies c
     LEFT JOIN contacts ct ON ct.company_id = c.id
     LEFT JOIN investment_opportunities d ON d.company_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.name ASC
     LIMIT $${values.length}`,
    values,
  );
}

/**
 * Get company with its people.
 */
export async function getCompanyWithPeople(
  companyId: string,
): Promise<{ company: DbCompany | null; people: { id: string; display_name: string | null; email: string; relationship_type: string; title: string | null; battery_level: number }[] }> {
  const db = await getDb();
  
  const companyRows = await db.select<DbCompany[]>(
    "SELECT * FROM companies WHERE id = $1",
    [companyId],
  );
  
  const peopleRows = await db.select<{ id: string; display_name: string | null; email: string; relationship_type: string; title: string | null; battery_level: number }[]>(
    `SELECT id, display_name, email, relationship_type, title, battery_level
     FROM contacts
     WHERE company_id = $1
     ORDER BY battery_level DESC, display_name ASC`,
    [companyId],
  );

  return {
    company: companyRows[0] ?? null,
    people: peopleRows,
  };
}

/**
 * Extract domain from email address.
 */
export function extractDomainFromEmail(email: string): string | null {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return null;
  return email.slice(atIndex + 1).toLowerCase();
}

/**
 * Check if domain is a public email provider (not a company domain).
 */
export function isPublicEmailDomain(domain: string): boolean {
  const publicDomains = new Set([
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com",
    "live.com", "yahoo.com", "yahoo.co.uk", "aol.com", "icloud.com",
    "me.com", "mac.com", "protonmail.com", "proton.me", "mail.com",
    "zoho.com", "yandex.com", "gmx.com", "gmx.net", "fastmail.com",
    "hey.com", "qq.com", "163.com", "126.com",
  ]);
  return publicDomains.has(domain.toLowerCase());
}

/**
 * Auto-create company from email domain if not exists.
 * Returns company ID and whether it was newly created.
 */
export async function autoCreateCompanyFromEmail(
  email: string,
): Promise<{ companyId: string | null; created: boolean }> {
  const domain = extractDomainFromEmail(email);
  if (!domain || isPublicEmailDomain(domain)) {
    return { companyId: null, created: false };
  }

  // Check if company already exists
  const existing = await getCompanyByDomain(domain);
  if (existing) {
    return { companyId: existing.id, created: false };
  }

  // Create new company from domain
  const domainParts = domain.split(".");
  const domainName = domainParts[0] ?? domain;
  const companyName = domainName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const id = await createCompany({
    name: companyName,
    domain,
    company_type: "other",
    website: `https://${domain}`,
    description: null,
    location: null,
    linkedin_url: null,
    crunchbase_url: null,
    employee_count: null,
    funding_stage: null,
    total_funding: null,
    valuation: null,
    is_portfolio_company: 0,
    is_target: 0,
    notes: `Auto-created from email domain: ${domain}`,
  });

  return { companyId: id, created: true };
}
