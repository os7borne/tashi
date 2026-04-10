import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  autoAddContactsFromMessage,
  autoAddContactsFromMessages,
  getAutoAddContactsSettings,
  type MessageContactData,
} from "./autoAddContacts";
import { upsertContact } from "@/services/db/contacts";
import { getSetting } from "@/services/db/settings";

// Mock dependencies
vi.mock("@/services/db/contacts", () => ({
  upsertContact: vi.fn(() => Promise.resolve()),
  getContactByEmail: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/services/db/settings", () => ({
  getSetting: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/services/crm/crmPeople", () => ({
  autoLinkPersonToCompany: vi.fn(() => Promise.resolve(false)),
}));

describe("autoAddContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAutoAddContactsSettings", () => {
    it("returns defaults when settings are null", async () => {
      (getSetting as Mock).mockResolvedValue(null);

      const settings = await getAutoAddContactsSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.includeCc).toBe(true);
      expect(settings.includeBcc).toBe(false);
    });

    it("returns false for enabled when set to 'false'", async () => {
      (getSetting as Mock).mockImplementation((key: string) => {
        if (key === "auto_add_contacts_enabled") return Promise.resolve("false");
        return Promise.resolve(null);
      });

      const settings = await getAutoAddContactsSettings();

      expect(settings.enabled).toBe(false);
    });

    it("returns true for includeBcc when set to 'true'", async () => {
      (getSetting as Mock).mockImplementation((key: string) => {
        if (key === "auto_add_contacts_include_bcc") return Promise.resolve("true");
        return Promise.resolve(null);
      });

      const settings = await getAutoAddContactsSettings();

      expect(settings.includeBcc).toBe(true);
    });
  });

  describe("autoAddContactsFromMessage", () => {
    const baseMessage: MessageContactData = {
      fromAddress: "sender@example.com",
      fromName: "John Sender",
      toAddresses: JSON.stringify([{ email: "user@example.com", name: "User" }]),
      ccAddresses: JSON.stringify([{ email: "cc@example.com", name: "CC Person" }]),
      bccAddresses: JSON.stringify([{ email: "bcc@example.com", name: "BCC Person" }]),
    };

    it("adds sender contact when enabled", async () => {
      const result = await autoAddContactsFromMessage(baseMessage, {
        enabled: true,
        includeCc: false,
        includeBcc: false,
      });

      expect(upsertContact).toHaveBeenCalledWith("sender@example.com", "John Sender");
      expect(result.added).toBe(1);
      expect(result.errors).toBe(0);
    });

    it("does nothing when disabled", async () => {
      const result = await autoAddContactsFromMessage(baseMessage, {
        enabled: false,
        includeCc: true,
        includeBcc: true,
      });

      expect(upsertContact).not.toHaveBeenCalled();
      expect(result.added).toBe(0);
    });

    it("adds CC recipients when includeCc is true", async () => {
      const result = await autoAddContactsFromMessage(baseMessage, {
        enabled: true,
        includeCc: true,
        includeBcc: false,
      });

      expect(upsertContact).toHaveBeenCalledWith("sender@example.com", "John Sender");
      expect(upsertContact).toHaveBeenCalledWith("cc@example.com", "CC Person");
      expect(upsertContact).not.toHaveBeenCalledWith("bcc@example.com", expect.anything());
      expect(result.added).toBe(2);
    });

    it("adds BCC recipients when includeBcc is true", async () => {
      const result = await autoAddContactsFromMessage(baseMessage, {
        enabled: true,
        includeCc: false,
        includeBcc: true,
      });

      expect(upsertContact).toHaveBeenCalledWith("sender@example.com", "John Sender");
      expect(upsertContact).not.toHaveBeenCalledWith("cc@example.com", expect.anything());
      expect(upsertContact).toHaveBeenCalledWith("bcc@example.com", "BCC Person");
      expect(result.added).toBe(2);
    });

    it("handles string array format for addresses", async () => {
      const message: MessageContactData = {
        fromAddress: "sender@example.com",
        fromName: null,
        toAddresses: JSON.stringify(["user@example.com"]),
        ccAddresses: JSON.stringify(["cc1@example.com", "cc2@example.com"]),
        bccAddresses: null,
      };

      await autoAddContactsFromMessage(message, {
        enabled: true,
        includeCc: true,
        includeBcc: false,
      });

      expect(upsertContact).toHaveBeenCalledWith("sender@example.com", null);
      expect(upsertContact).toHaveBeenCalledWith("cc1@example.com", null);
      expect(upsertContact).toHaveBeenCalledWith("cc2@example.com", null);
    });

    it("handles null fromAddress gracefully", async () => {
      const message: MessageContactData = {
        fromAddress: null,
        fromName: null,
        toAddresses: null,
        ccAddresses: JSON.stringify([{ email: "cc@example.com", name: "CC" }]),
        bccAddresses: null,
      };

      const result = await autoAddContactsFromMessage(message, {
        enabled: true,
        includeCc: true,
        includeBcc: false,
      });

      expect(upsertContact).not.toHaveBeenCalledWith(null, expect.anything());
      expect(upsertContact).toHaveBeenCalledWith("cc@example.com", "CC");
      expect(result.added).toBe(1);
    });

    it("handles empty CC/BCC arrays", async () => {
      const message: MessageContactData = {
        fromAddress: "sender@example.com",
        fromName: "Sender",
        toAddresses: null,
        ccAddresses: JSON.stringify([]),
        bccAddresses: "[]",
      };

      const result = await autoAddContactsFromMessage(message, {
        enabled: true,
        includeCc: true,
        includeBcc: true,
      });

      expect(upsertContact).toHaveBeenCalledTimes(1);
      expect(upsertContact).toHaveBeenCalledWith("sender@example.com", "Sender");
      expect(result.added).toBe(1);
    });

    it("handles invalid JSON in address fields", async () => {
      const message: MessageContactData = {
        fromAddress: "sender@example.com",
        fromName: null,
        toAddresses: null,
        ccAddresses: "invalid json",
        bccAddresses: null,
      };

      const result = await autoAddContactsFromMessage(message, {
        enabled: true,
        includeCc: true,
        includeBcc: false,
      });

      expect(upsertContact).toHaveBeenCalledTimes(1);
      expect(result.added).toBe(1);
    });

    it("normalizes email addresses", async () => {
      const message: MessageContactData = {
        fromAddress: "Sender@Example.COM",
        fromName: "Sender",
        toAddresses: null,
        ccAddresses: null,
        bccAddresses: null,
      };

      await autoAddContactsFromMessage(message, {
        enabled: true,
        includeCc: false,
        includeBcc: false,
      });

      expect(upsertContact).toHaveBeenCalledWith("sender@example.com", "Sender");
    });

    it("counts errors when upsertContact fails", async () => {
      (upsertContact as Mock).mockRejectedValueOnce(new Error("DB error"));

      const result = await autoAddContactsFromMessage(baseMessage, {
        enabled: true,
        includeCc: false,
        includeBcc: false,
      });

      expect(result.added).toBe(0);
      expect(result.errors).toBe(1);
    });

    it("continues processing other contacts after an error", async () => {
      (upsertContact as Mock)
        .mockRejectedValueOnce(new Error("DB error"))
        .mockResolvedValueOnce(undefined);

      const result = await autoAddContactsFromMessage(baseMessage, {
        enabled: true,
        includeCc: true,
        includeBcc: false,
      });

      // Sender failed, CC succeeded
      expect(result.added).toBe(1);
      expect(result.errors).toBe(1);
    });
  });

  describe("autoAddContactsFromMessages", () => {
    const messages: MessageContactData[] = [
      {
        fromAddress: "sender1@example.com",
        fromName: "Sender 1",
        toAddresses: null,
        ccAddresses: null,
        bccAddresses: null,
      },
      {
        fromAddress: "sender2@example.com",
        fromName: "Sender 2",
        toAddresses: null,
        ccAddresses: null,
        bccAddresses: null,
      },
    ];

    it("processes all messages and returns totals", async () => {
      const result = await autoAddContactsFromMessages(messages, {
        enabled: true,
        includeCc: false,
        includeBcc: false,
      });

      expect(result.added).toBe(2);
      expect(upsertContact).toHaveBeenCalledTimes(2);
    });

    it("calls progress callback", async () => {
      const onProgress = vi.fn();

      await autoAddContactsFromMessages(messages, {
        enabled: true,
        includeCc: false,
        includeBcc: false,
      }, onProgress);

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
    });

    it("does nothing when disabled", async () => {
      const result = await autoAddContactsFromMessages(messages, {
        enabled: false,
        includeCc: true,
        includeBcc: true,
      });

      expect(upsertContact).not.toHaveBeenCalled();
      expect(result.added).toBe(0);
    });
  });
});
