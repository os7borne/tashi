import { getDb } from "@/services/db/connection";
// normalizeEmail is used indirectly via domain extraction

export interface DbPerson {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
  relationship_type: string;
  title: string | null;
  battery_level: number;
  battery_factors_json: string | null;
  notes: string | null;
  frequency: number;
  last_contacted_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface PersonWithCompany extends DbPerson {
  company_name: string | null;
  company_type: string | null;
}

export type RelationshipType = "founder" | "investor" | "team" | "advisor" | "partner" | "other";

export const RELATIONSHIP_TYPES: { value: RelationshipType; label: string; color: string }[] = [
  { value: "founder", label: "Founder", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "investor", label: "Investor", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "team", label: "Team", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  { value: "advisor", label: "Advisor", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "partner", label: "Partner", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  { value: "other", label: "Other", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
];

/**
 * Get all people with optional filters.
 */
export async function getPeople(
  filters?: {
    relationshipType?: RelationshipType;
    companyId?: string;
    minBattery?: number;
    searchQuery?: string;
  },
  limit = 500,
  offset = 0,
): Promise<PersonWithCompany[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filters?.relationshipType) {
    conditions.push("c.relationship_type = $" + (values.length + 1));
    values.push(filters.relationshipType);
  }
  if (filters?.companyId) {
    conditions.push("c.company_id = $" + (values.length + 1));
    values.push(filters.companyId);
  }
  if (filters?.minBattery !== undefined) {
    conditions.push("c.battery_level >= $" + (values.length + 1));
    values.push(filters.minBattery);
  }
  if (filters?.searchQuery) {
    conditions.push("(c.display_name LIKE $" + (values.length + 1) + " OR c.email LIKE $" + (values.length + 1) + ")");
    values.push(`%${filters.searchQuery}%`);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  values.push(limit, offset);

  return db.select<PersonWithCompany[]>(
    `SELECT 
      c.*,
      co.name as company_name,
      co.company_type
     FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     ${whereClause}
     ORDER BY c.battery_level DESC, c.frequency DESC, c.display_name ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
}

/**
 * Get a single person by ID with company info.
 */
export async function getPersonById(id: string): Promise<PersonWithCompany | null> {
  const db = await getDb();
  const rows = await db.select<PersonWithCompany[]>(
    `SELECT 
      c.*,
      co.name as company_name,
      co.company_type
     FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Update person's relationship type.
 */
export async function updateRelationshipType(
  id: string,
  relationshipType: RelationshipType,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE contacts SET relationship_type = $1, updated_at = unixepoch() WHERE id = $2",
    [relationshipType, id],
  );
}

/**
 * Update person's title.
 */
export async function updateTitle(
  id: string,
  title: string | null,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE contacts SET title = $1, updated_at = unixepoch() WHERE id = $2",
    [title, id],
  );
}

/**
 * Link a person to a company.
 */
export async function linkPersonToCompany(
  personId: string,
  companyId: string | null,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE contacts SET company_id = $1, updated_at = unixepoch() WHERE id = $2",
    [companyId, personId],
  );
}

/**
 * Update battery level and factors.
 */
export async function updateBatteryLevel(
  personId: string,
  batteryLevel: number,
  factors: BatteryFactors,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE contacts SET battery_level = $1, battery_factors_json = $2, updated_at = unixepoch() WHERE id = $3",
    [Math.max(0, Math.min(100, batteryLevel)), JSON.stringify(factors), personId],
  );
}

export interface BatteryFactors {
  emailFrequency: number;
  recencyScore: number;
  responseRate: number;
  networkCentrality: number;
  meetingCount: number;
  dealsIntroduced: number;
  inactivityPenalty: number;
  ghostRatePenalty: number;
  lastCalculatedAt: number;
}

/**
 * Get people by company.
 */
export async function getPeopleByCompany(
  companyId: string,
): Promise<DbPerson[]> {
  const db = await getDb();
  return db.select<DbPerson[]>(
    `SELECT * FROM contacts 
     WHERE company_id = $1
     ORDER BY battery_level DESC, display_name ASC`,
    [companyId],
  );
}

/**
 * Get relationship type label and color.
 */
export function getRelationshipTypeMeta(type: string): { label: string; color: string } {
  const meta = RELATIONSHIP_TYPES.find((t) => t.value === type);
  return meta ?? { label: "Other", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" };
}

/**
 * Get battery level color and icon.
 */
export function getBatteryMeta(level: number): { color: string; label: string; icon: string } {
  if (level >= 80) {
    return { color: "text-emerald-500", label: "Strong", icon: "battery-full" };
  } else if (level >= 50) {
    return { color: "text-amber-500", label: "Warm", icon: "battery-medium" };
  } else {
    return { color: "text-red-500", label: "Cold", icon: "battery-low" };
  }
}

/**
 * Search people with company info.
 */
export async function searchPeople(
  query: string,
  limit = 20,
): Promise<PersonWithCompany[]> {
  const db = await getDb();
  const pattern = `%${query}%`;
  return db.select<PersonWithCompany[]>(
    `SELECT 
      c.*,
      co.name as company_name,
      co.company_type
     FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     WHERE c.display_name LIKE $1 OR c.email LIKE $1
     ORDER BY c.battery_level DESC, c.display_name ASC
     LIMIT $2`,
    [pattern, limit],
  );
}

/**
 * Auto-link a person to a company based on email domain.
 * Returns true if a link was made.
 */
export async function autoLinkPersonToCompany(personId: string): Promise<boolean> {
  const db = await getDb();
  
  // Get person's email
  const personRows = await db.select<{ email: string }[]>(
    "SELECT email FROM contacts WHERE id = $1",
    [personId],
  );
  
  const personRow = personRows[0];
  if (!personRow) return false;
  
  const email = personRow.email;
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return false;
  
  const domain = email.slice(atIndex + 1).toLowerCase();
  
  // Skip public domains
  const publicDomains = new Set([
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com",
    "live.com", "yahoo.com", "icloud.com", "protonmail.com",
  ]);
  if (publicDomains.has(domain)) return false;
  
  // Find company by domain
  const companyRows = await db.select<{ id: string }[]>(
    "SELECT id FROM companies WHERE domain = $1",
    [domain],
  );
  
  const companyRow = companyRows[0];
  if (!companyRow) return false;
  
  // Link person to company
  await linkPersonToCompany(personId, companyRow.id);
  return true;
}

/**
 * Get people count by relationship type.
 */
export async function getPeopleCountsByType(): Promise<Record<RelationshipType, number>> {
  const db = await getDb();
  const rows = await db.select<{ relationship_type: string; count: number }[]>(
    `SELECT relationship_type, COUNT(*) as count
     FROM contacts
     GROUP BY relationship_type`,
  );
  
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.relationship_type] = row.count;
  }
  
  // Ensure all types have a count
  for (const type of RELATIONSHIP_TYPES) {
    if (!(type.value in counts)) {
      counts[type.value] = 0;
    }
  }
  
  return counts as Record<RelationshipType, number>;
}
