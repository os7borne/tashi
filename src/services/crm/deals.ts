import { getDb } from "@/services/db/connection";

export interface DbDeal {
  id: string;
  company_id: string;
  deal_name: string;
  stage: string;
  deal_type: string;
  check_size_min: number | null;
  check_size_max: number | null;
  valuation: string | null;
  equity_percentage: number | null;
  priority: string;
  source: string | null;
  source_contact_id: string | null;
  next_step: string | null;
  next_step_date: number | null;
  decision_date: number | null;
  memo: string | null;
  thesis_fit: string | null;
  risks: string | null;
  status: string;
  passed_reason: string | null;
  created_at: number;
  updated_at: number;
}

export interface DealWithCompany extends DbDeal {
  company_name: string;
  company_type: string;
  source_contact_name: string | null;
}

export type DealStage = 
  | "sourced" 
  | "screening" 
  | "first_meeting" 
  | "diligence" 
  | "partner_meeting" 
  | "term_sheet" 
  | "negotiation" 
  | "committed" 
  | "closed" 
  | "passed" 
  | "on_hold";

export type DealType = "new_investment" | "follow_on" | "secondary";
export type DealPriority = "high" | "medium" | "low";
export type DealStatus = "active" | "passed" | "invested" | "on_hold";

export const DEAL_STAGES: { value: DealStage; label: string; order: number }[] = [
  { value: "sourced", label: "Sourced", order: 1 },
  { value: "screening", label: "Screening", order: 2 },
  { value: "first_meeting", label: "First Meeting", order: 3 },
  { value: "diligence", label: "Diligence", order: 4 },
  { value: "partner_meeting", label: "Partner Meeting", order: 5 },
  { value: "term_sheet", label: "Term Sheet", order: 6 },
  { value: "negotiation", label: "Negotiation", order: 7 },
  { value: "committed", label: "Committed", order: 8 },
  { value: "closed", label: "Closed", order: 9 },
  { value: "on_hold", label: "On Hold", order: 99 },
  { value: "passed", label: "Passed", order: 100 },
];

export const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: "new_investment", label: "New Investment" },
  { value: "follow_on", label: "Follow-On" },
  { value: "secondary", label: "Secondary" },
];

export const DEAL_PRIORITIES: { value: DealPriority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
];

export const DEAL_SOURCES = [
  "warm_intro",
  "cold_outbound",
  "accelerator",
  "incubator",
  "event",
  "portfolio_referral",
  "investor_referral",
  "online",
  "other",
] as const;

/**
 * Create a new deal.
 */
export async function createDeal(
  data: Omit<DbDeal, "id" | "created_at" | "updated_at">,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO investment_opportunities (
      id, company_id, deal_name, stage, deal_type, check_size_min, check_size_max,
      valuation, equity_percentage, priority, source, source_contact_id,
      next_step, next_step_date, decision_date, memo, thesis_fit, risks,
      status, passed_reason
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
    [
      id,
      data.company_id,
      data.deal_name,
      data.stage,
      data.deal_type,
      data.check_size_min,
      data.check_size_max,
      data.valuation,
      data.equity_percentage,
      data.priority,
      data.source,
      data.source_contact_id,
      data.next_step,
      data.next_step_date,
      data.decision_date,
      data.memo,
      data.thesis_fit,
      data.risks,
      data.status,
      data.passed_reason,
    ],
  );
  
  // Log activity
  await logActivity(id, "deal_created", "Deal created", null, data.stage);
  
  return id;
}

/**
 * Update a deal.
 */
export async function updateDeal(
  id: string,
  data: Partial<Omit<DbDeal, "id" | "created_at" | "updated_at">>,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.deal_name !== undefined) { fields.push("deal_name = $" + (fields.length + 1)); values.push(data.deal_name); }
  if (data.stage !== undefined) { fields.push("stage = $" + (fields.length + 1)); values.push(data.stage); }
  if (data.deal_type !== undefined) { fields.push("deal_type = $" + (fields.length + 1)); values.push(data.deal_type); }
  if (data.check_size_min !== undefined) { fields.push("check_size_min = $" + (fields.length + 1)); values.push(data.check_size_min); }
  if (data.check_size_max !== undefined) { fields.push("check_size_max = $" + (fields.length + 1)); values.push(data.check_size_max); }
  if (data.valuation !== undefined) { fields.push("valuation = $" + (fields.length + 1)); values.push(data.valuation); }
  if (data.equity_percentage !== undefined) { fields.push("equity_percentage = $" + (fields.length + 1)); values.push(data.equity_percentage); }
  if (data.priority !== undefined) { fields.push("priority = $" + (fields.length + 1)); values.push(data.priority); }
  if (data.source !== undefined) { fields.push("source = $" + (fields.length + 1)); values.push(data.source); }
  if (data.source_contact_id !== undefined) { fields.push("source_contact_id = $" + (fields.length + 1)); values.push(data.source_contact_id); }
  if (data.next_step !== undefined) { fields.push("next_step = $" + (fields.length + 1)); values.push(data.next_step); }
  if (data.next_step_date !== undefined) { fields.push("next_step_date = $" + (fields.length + 1)); values.push(data.next_step_date); }
  if (data.decision_date !== undefined) { fields.push("decision_date = $" + (fields.length + 1)); values.push(data.decision_date); }
  if (data.memo !== undefined) { fields.push("memo = $" + (fields.length + 1)); values.push(data.memo); }
  if (data.thesis_fit !== undefined) { fields.push("thesis_fit = $" + (fields.length + 1)); values.push(data.thesis_fit); }
  if (data.risks !== undefined) { fields.push("risks = $" + (fields.length + 1)); values.push(data.risks); }
  if (data.status !== undefined) { fields.push("status = $" + (fields.length + 1)); values.push(data.status); }
  if (data.passed_reason !== undefined) { fields.push("passed_reason = $" + (fields.length + 1)); values.push(data.passed_reason); }

  if (fields.length === 0) return;

  fields.push("updated_at = unixepoch()");
  values.push(id);

  await db.execute(
    `UPDATE investment_opportunities SET ${fields.join(", ")} WHERE id = $${values.length}`,
    values,
  );
}

/**
 * Move deal to a new stage.
 */
export async function moveDealStage(
  dealId: string,
  newStage: DealStage,
  note?: string,
): Promise<void> {
  const db = await getDb();
  
  // Get current stage
  const currentRows = await db.select<{ stage: string }[]>(
    "SELECT stage FROM investment_opportunities WHERE id = $1",
    [dealId],
  );
  
  const currentRow = currentRows[0];
  if (!currentRow) return;
  const oldStage = currentRow.stage;
  
  // Update stage
  await db.execute(
    "UPDATE investment_opportunities SET stage = $1, updated_at = unixepoch() WHERE id = $2",
    [newStage, dealId],
  );
  
  // Log activity
  await logActivity(
    dealId,
    "stage_change",
    note || `Moved from ${getStageLabel(oldStage)} to ${getStageLabel(newStage)}`,
    oldStage,
    newStage,
  );
}

/**
 * Delete a deal.
 */
export async function deleteDeal(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM investment_opportunities WHERE id = $1", [id]);
}

/**
 * Get deal by ID with company info.
 */
export async function getDealById(id: string): Promise<DealWithCompany | null> {
  const db = await getDb();
  const rows = await db.select<DealWithCompany[]>(
    `SELECT 
      d.*,
      c.name as company_name,
      c.company_type,
      ct.display_name as source_contact_name
     FROM investment_opportunities d
     JOIN companies c ON c.id = d.company_id
     LEFT JOIN contacts ct ON ct.id = d.source_contact_id
     WHERE d.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Get deals grouped by stage for pipeline view.
 */
export async function getPipelineByStage(
  filters?: {
    status?: DealStatus;
    priority?: DealPriority;
    dealType?: DealType;
    hidePassed?: boolean;
  },
): Promise<Record<DealStage, DealWithCompany[]>> {
  const db = await getDb();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filters?.status) {
    conditions.push("d.status = $" + (values.length + 1));
    values.push(filters.status);
  }
  if (filters?.priority) {
    conditions.push("d.priority = $" + (values.length + 1));
    values.push(filters.priority);
  }
  if (filters?.dealType) {
    conditions.push("d.deal_type = $" + (values.length + 1));
    values.push(filters.dealType);
  }
  if (filters?.hidePassed) {
    conditions.push("d.stage != 'passed'");
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const rows = await db.select<DealWithCompany[]>(
    `SELECT 
      d.*,
      c.name as company_name,
      c.company_type,
      ct.display_name as source_contact_name
     FROM investment_opportunities d
     JOIN companies c ON c.id = d.company_id
     LEFT JOIN contacts ct ON ct.id = d.source_contact_id
     ${whereClause}
     ORDER BY 
      CASE d.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        ELSE 3 
      END,
      d.updated_at DESC`,
    values,
  );

  // Group by stage
  const pipeline = {} as Record<DealStage, DealWithCompany[]>;
  for (const stage of DEAL_STAGES) {
    pipeline[stage.value] = [];
  }

  for (const deal of rows) {
    if (pipeline[deal.stage as DealStage]) {
      pipeline[deal.stage as DealStage].push(deal);
    }
  }

  return pipeline;
}

/**
 * Get deals for a company.
 */
export async function getDealsByCompany(companyId: string): Promise<DbDeal[]> {
  const db = await getDb();
  return db.select<DbDeal[]>(
    `SELECT * FROM investment_opportunities
     WHERE company_id = $1
     ORDER BY created_at DESC`,
    [companyId],
  );
}

/**
 * DealActivity interface
 */
export interface DealActivity {
  id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: number;
}

/**
 * Log activity for a deal.
 */
export async function logActivity(
  dealId: string,
  activityType: string,
  description: string,
  oldValue: string | null,
  newValue: string | null,
): Promise<void> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO deal_activities (id, deal_id, activity_type, description, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, dealId, activityType, description, oldValue, newValue],
  );
}

/**
 * Get activity log for a deal.
 */
export async function getDealActivities(
  dealId: string,
  limit = 50,
): Promise<DealActivity[]> {
  const db = await getDb();
  return db.select(
    `SELECT * FROM deal_activities
     WHERE deal_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [dealId, limit],
  );
}

/**
 * Get stage label.
 */
export function getStageLabel(stage: string): string {
  const stageMeta = DEAL_STAGES.find((s) => s.value === stage);
  return stageMeta?.label ?? stage;
}

/**
 * Get priority meta.
 */
export function getPriorityMeta(priority: string): { label: string; color: string } {
  const meta = DEAL_PRIORITIES.find((p) => p.value === priority);
  return meta ?? { label: priority, color: "bg-zinc-100 text-zinc-600" };
}

/**
 * Format check size for display.
 */
export function formatCheckSize(min: number | null, max: number | null): string {
  if (!min && !max) return "TBD";
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

/**
 * Get deal type label.
 */
export function getDealTypeLabel(type: string): string {
  const meta = DEAL_TYPES.find((t) => t.value === type);
  return meta?.label ?? type.replace(/_/g, " ");
}

/**
 * Alias for logActivity for external use.
 */
export { logActivity as logDealActivity };

/**
 * Get deal counts by stage for analytics.
 */
export async function getDealCountsByStage(): Promise<{ stage: string; count: number; total_value: number }[]> {
  const db = await getDb();
  return db.select(
    `SELECT 
      stage,
      COUNT(*) as count,
      COALESCE(SUM(check_size_max), 0) as total_value
     FROM investment_opportunities
     WHERE status = 'active'
     GROUP BY stage
     ORDER BY MIN(CASE stage
       WHEN 'sourced' THEN 1
       WHEN 'screening' THEN 2
       WHEN 'first_meeting' THEN 3
       WHEN 'diligence' THEN 4
       WHEN 'partner_meeting' THEN 5
       WHEN 'term_sheet' THEN 6
       WHEN 'negotiation' THEN 7
       WHEN 'committed' THEN 8
       WHEN 'closed' THEN 9
       ELSE 99
     END)`,
  );
}
