import { getDb } from "@/services/db/connection";
import {
  autoAddContactsFromMessage,
  getAutoAddContactsSettings,
  type MessageContactData,
} from "./autoAddContacts";

export interface BackfillProgress {
  current: number;
  total: number;
  message: string;
}

export interface BackfillResult {
  processed: number;
  added: number;
  errors: number;
  skipped: number;
}

/**
 * Backfill contacts from existing messages for a specific account.
 * This scans all messages and adds contacts based on current settings.
 */
export async function backfillContactsFromExistingMessages(
  accountId: string,
  onProgress?: (progress: BackfillProgress) => void,
): Promise<BackfillResult> {
  const db = await getDb();
  const settings = await getAutoAddContactsSettings();

  if (!settings.enabled) {
    return { processed: 0, added: 0, errors: 0, skipped: 0 };
  }

  // Get all messages for this account with contact data
  const messages = await db.select<
    {
      from_address: string | null;
      from_name: string | null;
      to_addresses: string | null;
      cc_addresses: string | null;
      bcc_addresses: string | null;
    }[]
  >(
    `SELECT DISTINCT 
       from_address, from_name, to_addresses, cc_addresses, bcc_addresses
     FROM messages
     WHERE account_id = $1
       AND (from_address IS NOT NULL 
         OR cc_addresses IS NOT NULL 
         OR bcc_addresses IS NOT NULL)
     ORDER BY date DESC`,
    [accountId],
  );

  const result: BackfillResult = {
    processed: 0,
    added: 0,
    errors: 0,
    skipped: 0,
  };

  onProgress?.({
    current: 0,
    total: messages.length,
    message: `Processing ${messages.length} messages...`,
  });

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    const messageData: MessageContactData = {
      fromAddress: msg.from_address,
      fromName: msg.from_name,
      toAddresses: msg.to_addresses,
      ccAddresses: msg.cc_addresses,
      bccAddresses: msg.bcc_addresses,
    };

    // Skip if no relevant addresses based on settings
    if (!messageData.fromAddress) {
      result.skipped++;
      continue;
    }

    try {
      const addResult = await autoAddContactsFromMessage(messageData, settings);
      result.added += addResult.added;
      result.errors += addResult.errors;
      result.processed++;
    } catch (err) {
      console.error("Failed to process message for backfill:", err);
      result.errors++;
    }

    if (onProgress && (i + 1) % 100 === 0) {
      onProgress({
        current: i + 1,
        total: messages.length,
        message: `Processed ${i + 1}/${messages.length} messages...`,
      });
    }
  }

  onProgress?.({
    current: messages.length,
    total: messages.length,
    message: `Complete! Processed ${result.processed} messages, added ${result.added} contacts.`,
  });

  return result;
}

/**
 * Backfill contacts from all messages across all accounts.
 * Useful for initial migration or re-processing.
 */
export async function backfillContactsFromAllMessages(
  onProgress?: (progress: BackfillProgress) => void,
): Promise<BackfillResult> {
  const db = await getDb();

  // Get all accounts
  const accounts = await db.select<{ id: string; email: string }[]>(
    "SELECT id, email FROM accounts WHERE provider != 'caldav'",
  );

  const totalResult: BackfillResult = {
    processed: 0,
    added: 0,
    errors: 0,
    skipped: 0,
  };

  for (const account of accounts) {
    onProgress?.({
      current: 0,
      total: accounts.length,
      message: `Processing account: ${account.email}...`,
    });

    const accountResult = await backfillContactsFromExistingMessages(
      account.id,
      (progress) => {
        onProgress?.({
          current: progress.current,
          total: progress.total,
          message: `${account.email}: ${progress.message}`,
        });
      },
    );

    totalResult.processed += accountResult.processed;
    totalResult.added += accountResult.added;
    totalResult.errors += accountResult.errors;
    totalResult.skipped += accountResult.skipped;
  }

  onProgress?.({
    current: accounts.length,
    total: accounts.length,
    message: `Complete! Added ${totalResult.added} contacts from ${totalResult.processed} messages.`,
  });

  return totalResult;
}

/**
 * Get a count of messages that would be processed during backfill.
 */
export async function getBackfillMessageCount(accountId?: string): Promise<number> {
  const db = await getDb();

  if (accountId) {
    const result = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM messages
       WHERE account_id = $1
         AND (from_address IS NOT NULL 
           OR cc_addresses IS NOT NULL 
           OR bcc_addresses IS NOT NULL)`,
      [accountId],
    );
    return result[0]?.count ?? 0;
  }

  const result = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM messages
     WHERE from_address IS NOT NULL 
        OR cc_addresses IS NOT NULL 
        OR bcc_addresses IS NOT NULL`,
  );
  return result[0]?.count ?? 0;
}
