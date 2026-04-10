import { getDb } from "@/services/db/connection";
import type { BatteryFactors } from "./crmPeople";

export { type BatteryFactors };

/**
 * Calculate battery level for a person based on various factors.
 * Base score: 50
 * Returns score between 0-100
 */
export async function calculateBatteryLevel(personId: string): Promise<{ level: number; factors: BatteryFactors }> {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  
  // Get person's basic info
  const personRows = await db.select<{
    frequency: number;
    last_contacted_at: number | null;
    email: string;
  }[]>(
    "SELECT frequency, last_contacted_at, email FROM contacts WHERE id = $1",
    [personId],
  );
  
  if (personRows.length === 0) {
    return { level: 50, factors: createEmptyFactors(now) };
  }
  
  const person = personRows[0];
  if (!person) {
    return { level: 50, factors: createEmptyFactors(now) };
  }
  
  // Calculate individual factors
  const emailFrequency = Math.min(person.frequency / 10, 5); // Max 5 points for 50+ emails
  
  const recencyScore = calculateRecencyScore(person.last_contacted_at, now);
  
  const responseRate = await calculateResponseRate(person.email);
  
  const networkCentrality = await calculateNetworkCentrality(personId);
  
  const meetingCount = await countMeetings(personId);
  const meetingScore = Math.min(meetingCount * 2, 10); // Max 10 points for 5+ meetings
  
  const dealsIntroduced = await countDealsIntroduced(personId);
  const dealScore = Math.min(dealsIntroduced * 5, 15); // Max 15 points for 3+ deals
  
  const inactivityPenalty = calculateInactivityPenalty(person.last_contacted_at, now);
  
  const ghostRatePenalty = await calculateGhostRatePenalty(person.email);
  
  // Calculate total score
  let total = 50 + // Base score
    emailFrequency +
    recencyScore +
    responseRate +
    networkCentrality +
    meetingScore +
    dealScore -
    inactivityPenalty -
    ghostRatePenalty;
  
  // Clamp between 0-100
  total = Math.max(0, Math.min(100, total));
  
  const factors: BatteryFactors = {
    emailFrequency,
    recencyScore,
    responseRate,
    networkCentrality,
    meetingCount,
    dealsIntroduced,
    inactivityPenalty,
    ghostRatePenalty,
    lastCalculatedAt: now,
  };
  
  return { level: Math.round(total), factors };
}

/**
 * Calculate recency score based on last contact date.
 */
function calculateRecencyScore(lastContactedAt: number | null, now: number): number {
  if (!lastContactedAt) return 0;
  
  const daysSince = (now - lastContactedAt) / (24 * 60 * 60);
  
  if (daysSince < 7) return 5;
  if (daysSince < 30) return 3;
  if (daysSince < 90) return 1;
  return 0;
}

/**
 * Calculate response rate (what % of emails we sent did they reply to).
 */
async function calculateResponseRate(email: string): Promise<number> {
  const db = await getDb();
  
  // Count emails sent to this person
  const sentRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM messages
     WHERE to_addresses LIKE $1`,
    [`%${email}%`],
  );
  
  const sentCount = sentRows[0]?.count ?? 0;
  if (sentCount === 0) return 5; // Neutral if no emails sent
  
  // Count emails received from this person
  const receivedRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM messages
     WHERE from_address = $1`,
    [email],
  );
  
  const receivedCount = receivedRows[0]?.count ?? 0;
  
  // Calculate ratio (capped at 100%)
  const ratio = Math.min(receivedCount / sentCount, 1);
  
  // Score: 0-10 based on ratio
  return ratio * 10;
}

/**
 * Calculate network centrality (how connected this person is to your other contacts).
 */
async function calculateNetworkCentrality(personId: string): Promise<number> {
  const db = await getDb();
  
  // Get person's email
  const personRows = await db.select<{ email: string }[]>(
    "SELECT email FROM contacts WHERE id = $1",
    [personId],
  );
  
  const personRow = personRows[0];
  if (!personRow) return 0;
  
  const email = personRow.email;
  
  // Find threads where this person is involved
  const threadRows = await db.select<{ thread_id: string }[]>(
    `SELECT DISTINCT thread_id FROM messages
     WHERE from_address = $1 OR to_addresses LIKE $2`,
    [email, `%${email}%`],
  );
  
  if (threadRows.length === 0) return 0;
  
  const threadIds = threadRows.map((r) => r.thread_id);
  const placeholders = threadIds.map((_, i) => `$${i + 2}`).join(",");
  
  // Count unique other contacts in those threads
  const connectionRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(DISTINCT from_address) as count 
     FROM messages 
     WHERE thread_id IN (${placeholders})
     AND from_address != $1`,
    [email, ...threadIds],
  );
  
  const connectionRow = connectionRows[0];
  const connectionCount = connectionRow?.count ?? 0;
  
  // Score: 0-5 based on connections (max at 50 connections)
  return Math.min(connectionCount / 10, 5);
}

/**
 * Count meetings with this person (threads with back-and-forth).
 */
async function countMeetings(personId: string): Promise<number> {
  const db = await getDb();
  
  // Get person's email
  const personRows = await db.select<{ email: string }[]>(
    "SELECT email FROM contacts WHERE id = $1",
    [personId],
  );
  
  const personRow = personRows[0];
  if (!personRow) return 0;
  
  const email = personRow.email;
  
  // Count threads with at least 3 messages (indicates a conversation/meeting)
  const meetingRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM (
      SELECT thread_id, COUNT(*) as msg_count
      FROM messages
      WHERE thread_id IN (
        SELECT DISTINCT thread_id FROM messages
        WHERE from_address = $1 OR to_addresses LIKE $2
      )
      GROUP BY thread_id
      HAVING msg_count >= 3
    )`,
    [email, `%${email}%`],
  );
  
  const meetingRow = meetingRows[0];
  return meetingRow?.count ?? 0;
}

/**
 * Count deals introduced by this person.
 */
async function countDealsIntroduced(personId: string): Promise<number> {
  const db = await getDb();
  
  const dealRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM investment_opportunities
     WHERE source_contact_id = $1`,
    [personId],
  );
  
  return dealRows[0]?.count ?? 0;
}

/**
 * Calculate inactivity penalty.
 */
function calculateInactivityPenalty(lastContactedAt: number | null, now: number): number {
  if (!lastContactedAt) return 20; // Max penalty if never contacted
  
  const daysSince = (now - lastContactedAt) / (24 * 60 * 60);
  
  // Cap at 20 points penalty
  return Math.min(daysSince / 30, 20);
}

/**
 * Calculate ghost rate penalty (emails we sent that weren't replied to).
 */
async function calculateGhostRatePenalty(email: string): Promise<number> {
  const db = await getDb();
  
  // Get recent threads (last 90 days)
  const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
  
  // Count threads where we sent first email but no reply
  const ghostRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM (
      SELECT thread_id, 
        SUM(CASE WHEN to_addresses LIKE $1 THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN from_address = $1 THEN 1 ELSE 0 END) as received
      FROM messages
      WHERE date > $2
        AND (from_address = $1 OR to_addresses LIKE $1)
      GROUP BY thread_id
      HAVING sent > 0 AND received = 0
    )`,
    [`%${email}%`, ninetyDaysAgo],
  );
  
  const ghostRow = ghostRows[0];
  const ghostCount = ghostRow?.count ?? 0;
  
  // Penalty: 2 points per ghosted thread, max 10
  return Math.min(ghostCount * 2, 10);
}

/**
 * Create empty factors object.
 */
function createEmptyFactors(now: number): BatteryFactors {
  return {
    emailFrequency: 0,
    recencyScore: 0,
    responseRate: 0,
    networkCentrality: 0,
    meetingCount: 0,
    dealsIntroduced: 0,
    inactivityPenalty: 0,
    ghostRatePenalty: 0,
    lastCalculatedAt: now,
  };
}

/**
 * Recalculate battery level for a person and save to DB.
 */
export async function recalculateAndSaveBattery(personId: string): Promise<number> {
  const { level, factors } = await calculateBatteryLevel(personId);
  
  const db = await getDb();
  await db.execute(
    "UPDATE contacts SET battery_level = $1, battery_factors_json = $2, updated_at = unixepoch() WHERE id = $3",
    [level, JSON.stringify(factors), personId],
  );
  
  return level;
}

/**
 * Recalculate battery levels for all people in batches.
 */
export async function recalculateAllBatteries(
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const db = await getDb();
  
  // Get all person IDs
  const rows = await db.select<{ id: string }[]>(
    "SELECT id FROM contacts",
  );
  
  const total = rows.length;
  let done = 0;
  
  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (row) => {
        await recalculateAndSaveBattery(row.id);
        done++;
      }),
    );
    
    if (onProgress) {
      onProgress(done, total);
    }
  }
}

/**
 * Get battery factors for a person.
 */
export async function getBatteryFactors(personId: string): Promise<BatteryFactors | null> {
  const db = await getDb();
  
  const rows = await db.select<{ battery_factors_json: string }[]>(
    "SELECT battery_factors_json FROM contacts WHERE id = $1",
    [personId],
  );
  
  const row = rows[0];
  if (!row || !row.battery_factors_json) {
    return null;
  }
  
  try {
    return JSON.parse(row.battery_factors_json) as BatteryFactors;
  } catch {
    return null;
  }
}

/**
 * Get battery level distribution for analytics.
 */
export async function getBatteryDistribution(): Promise<{ range: string; count: number }[]> {
  const db = await getDb();
  
  const rows = await db.select<{ bucket: number; count: number }[]>(
    `SELECT 
      CASE 
        WHEN battery_level >= 80 THEN 4
        WHEN battery_level >= 60 THEN 3
        WHEN battery_level >= 40 THEN 2
        WHEN battery_level >= 20 THEN 1
        ELSE 0
      END as bucket,
      COUNT(*) as count
     FROM contacts
     GROUP BY bucket
     ORDER BY bucket DESC`,
  );
  
  const ranges = [
    { bucket: 4, range: "80-100%", label: "Strong" },
    { bucket: 3, range: "60-79%", label: "Good" },
    { bucket: 2, range: "40-59%", label: "Warm" },
    { bucket: 1, range: "20-39%", label: "Cool" },
    { bucket: 0, range: "0-19%", label: "Cold" },
  ];
  
  return ranges.map((r) => ({
    range: r.range,
    label: r.label,
    count: rows.find((row) => row.bucket === r.bucket)?.count ?? 0,
  }));
}
