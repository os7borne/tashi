import { upsertContact, getContactByEmail } from "@/services/db/contacts";
import { getSetting } from "@/services/db/settings";
import { normalizeEmail } from "@/utils/emailUtils";
import { autoLinkPersonToCompany } from "@/services/crm/crmPeople";

export interface AutoAddContactsOptions {
  /** Master toggle - auto-add contacts from incoming emails */
  enabled: boolean;
  /** Include CC recipients when auto-adding contacts */
  includeCc: boolean;
  /** Include BCC recipients when auto-adding contacts */
  includeBcc: boolean;
}

export interface MessageContactData {
  fromAddress: string | null;
  fromName: string | null;
  toAddresses: string | null; // JSON array string
  ccAddresses: string | null; // JSON array string
  bccAddresses: string | null; // JSON array string
}

/**
 * Get auto-add contacts settings from the database.
 * Returns defaults if settings don't exist yet.
 */
export async function getAutoAddContactsSettings(): Promise<AutoAddContactsOptions> {
  const [enabled, includeCc, includeBcc] = await Promise.all([
    getSetting("auto_add_contacts_enabled"),
    getSetting("auto_add_contacts_include_cc"),
    getSetting("auto_add_contacts_include_bcc"),
  ]);

  return {
    enabled: enabled !== "false", // default: true
    includeCc: includeCc !== "false", // default: true
    includeBcc: includeBcc === "true", // default: false
  };
}

/**
 * Parse email addresses from a JSON array string.
 * Handles both [{ email: string, name: string | null }] and plain string arrays.
 */
function parseEmailAddresses(
  addressesJson: string | null,
): Array<{ email: string; name: string | null }> {
  if (!addressesJson) return [];

  try {
    const parsed = JSON.parse(addressesJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((addr: unknown) => {
        if (typeof addr === "string") {
          return { email: addr, name: null };
        }
        if (
          addr &&
          typeof addr === "object" &&
          "email" in addr &&
          typeof addr.email === "string"
        ) {
          return {
            email: addr.email,
            name:
              "name" in addr && typeof addr.name === "string"
                ? addr.name
                : null,
          };
        }
        return null;
      })
      .filter((item): item is { email: string; name: string | null } =>
        item !== null && item.email.length > 0,
      );
  } catch {
    return [];
  }
}

/**
 * Auto-add contacts from a message based on settings.
 * This function is called during email sync for each incoming message.
 */
export async function autoAddContactsFromMessage(
  message: MessageContactData,
  options?: AutoAddContactsOptions,
): Promise<{ added: number; errors: number }> {
  const settings = options ?? (await getAutoAddContactsSettings());

  if (!settings.enabled) {
    return { added: 0, errors: 0 };
  }

  let added = 0;
  let errors = 0;

  // Always add the sender (from address)
  if (message.fromAddress) {
    try {
      const normalizedEmail = normalizeEmail(message.fromAddress);
      await upsertContact(normalizedEmail, message.fromName);
      
      // Auto-link to company if not already linked
      const contact = await getContactByEmail(normalizedEmail);
      if (contact && !contact.company_id) {
        await autoLinkPersonToCompany(contact.id);
      }
      
      added++;
    } catch (err) {
      console.error("Failed to upsert sender contact:", err);
      errors++;
    }
  }

  // Add CC recipients if enabled
  if (settings.includeCc && message.ccAddresses) {
    const ccRecipients = parseEmailAddresses(message.ccAddresses);
    for (const recipient of ccRecipients) {
      try {
        const normalizedEmail = normalizeEmail(recipient.email);
        await upsertContact(normalizedEmail, recipient.name);
        
        // Auto-link to company if not already linked
        const contact = await getContactByEmail(normalizedEmail);
        if (contact && !contact.company_id) {
          await autoLinkPersonToCompany(contact.id);
        }
        
        added++;
      } catch (err) {
        console.error("Failed to upsert CC contact:", err);
        errors++;
      }
    }
  }

  // Add BCC recipients if enabled
  if (settings.includeBcc && message.bccAddresses) {
    const bccRecipients = parseEmailAddresses(message.bccAddresses);
    for (const recipient of bccRecipients) {
      try {
        const normalizedEmail = normalizeEmail(recipient.email);
        await upsertContact(normalizedEmail, recipient.name);
        
        // Auto-link to company if not already linked
        const contact = await getContactByEmail(normalizedEmail);
        if (contact && !contact.company_id) {
          await autoLinkPersonToCompany(contact.id);
        }
        
        added++;
      } catch (err) {
        console.error("Failed to upsert BCC contact:", err);
        errors++;
      }
    }
  }

  return { added, errors };
}

/**
 * Batch process contacts from multiple messages.
 * More efficient for backfill operations.
 */
export async function autoAddContactsFromMessages(
  messages: MessageContactData[],
  options?: AutoAddContactsOptions,
  onProgress?: (current: number, total: number) => void,
): Promise<{ added: number; errors: number }> {
  const settings = options ?? (await getAutoAddContactsSettings());

  if (!settings.enabled) {
    return { added: 0, errors: 0 };
  }

  let totalAdded = 0;
  let totalErrors = 0;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (!message) continue;
    const result = await autoAddContactsFromMessage(message, settings);
    totalAdded += result.added;
    totalErrors += result.errors;

    if (onProgress) {
      onProgress(i + 1, messages.length);
    }
  }

  return { added: totalAdded, errors: totalErrors };
}
