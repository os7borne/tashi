import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Mail,
  MoreHorizontal,
  UserPlus,
  SlidersHorizontal,
  X,
  ContactRound,
} from "lucide-react";
import {
  getAllContacts,
  getContactStats,
  updateContactNotes,
  type DbContact,
  type ContactStats,
} from "@/services/db/contacts";
import { navigateToLabel } from "@/router/navigate";
import { formatRelativeDate } from "@/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

const DEAL_STAGES = ["Lead", "Prospect", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const DEAL_STAGE_COLORS: Record<string, string> = {
  "Lead": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  "Prospect": "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "Qualified": "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Proposal": "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "Negotiation": "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "Closed Won": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Closed Lost": "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

interface ContactWithStats extends DbContact {
  stats?: ContactStats;
  dealStage?: string;
}

export function CrmPage() {
  const [contacts, setContacts] = useState<ContactWithStats[]>([]);
  const [filtered, setFiltered] = useState<ContactWithStats[]>([]);
  const [selected, setSelected] = useState<ContactWithStats | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllContacts(500);
      setContacts(rows);
      setFiltered(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(contacts);
    } else {
      const q = query.toLowerCase();
      setFiltered(contacts.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          (c.display_name ?? "").toLowerCase().includes(q),
      ));
    }
  }, [query, contacts]);

  const handleSelect = useCallback(async (contact: ContactWithStats) => {
    setSelected(contact);
    setNotes(contact.notes ?? "");
    // Load stats if not already loaded
    if (!contact.stats) {
      const stats = await getContactStats(contact.email);
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, stats } : c)),
      );
      setSelected((prev) => (prev?.id === contact.id ? { ...prev, stats } : prev));
    }
  }, []);

  const handleNotesSave = useCallback(async () => {
    if (!selected) return;
    setNotesSaving(true);
    try {
      await updateContactNotes(selected.email, notes || null);
      setContacts((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, notes } : c)),
      );
    } finally {
      setNotesSaving(false);
    }
  }, [selected, notes]);

  const handleEmailContact = useCallback(() => {
    if (!selected) return;
    navigateToLabel("inbox");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("velo-compose-to", { detail: { to: selected.email, name: selected.display_name } }));
    }, 100);
  }, [selected]);

  const initial = (name: string | null, email: string) =>
    ((name?.[0] ?? email[0] ?? "?")).toUpperCase();

  const bgForEmail = (email: string) => {
    const colors = [
      "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
      "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
    ];
    let hash = 0;
    for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
    return colors[hash % colors.length]!;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-border-primary bg-bg-primary/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <ContactRound size={18} className="text-accent" />
          <h1 className="text-base font-semibold text-text-primary">Contacts</h1>
          {!loading && (
            <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 bg-bg-secondary">
        {/* Left: Contact list */}
        <div className="w-72 shrink-0 flex flex-col border-r border-border-primary">
          {/* Search header */}
          <div className="px-3 py-2 border-b border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors" title="Filter">
                  <SlidersHorizontal size={14} />
                </button>
                <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors" title="Add contact">
                  <UserPlus size={14} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-7 pr-7 py-1.5 text-xs bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/50"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Contact count */}
          <div className="px-3 py-1.5 text-xs text-text-tertiary border-b border-border-secondary">
            {loading ? "Loading..." : `${filtered.length} contact${filtered.length !== 1 ? "s" : ""}`}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelect(contact)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border-secondary transition-colors ${
                  selected?.id === contact.id
                    ? "bg-accent/8 border-l-2 border-l-accent"
                    : "hover:bg-bg-hover"
                }`}
              >
                {/* Avatar */}
                {contact.avatar_url ? (
                  <img
                    src={contact.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${bgForEmail(contact.email)} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
                    {initial(contact.display_name, contact.email)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {contact.display_name ?? contact.email}
                  </div>
                  {contact.display_name && (
                    <div className="text-xs text-text-tertiary truncate">{contact.email}</div>
                  )}
                </div>

                {/* Frequency badge */}
                {contact.frequency > 1 && (
                  <span className="text-[10px] bg-bg-tertiary text-text-tertiary px-1.5 py-0.5 rounded-full shrink-0">
                    {contact.frequency}
                  </span>
                )}
              </button>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="px-3 py-6 text-center">
                <EmptyState
                  icon={ContactRound}
                  title={query ? "No matches found" : "No contacts yet"}
                  subtitle={query ? "Try a different search term" : "Contacts from your emails will appear here"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Contact detail */}
        {selected ? (
          <ContactDetail
            contact={selected}
            notes={notes}
            onNotesChange={setNotes}
            onNotesSave={handleNotesSave}
            notesSaving={notesSaving}
            onEmail={handleEmailContact}
            bgForEmail={bgForEmail}
            initial={initial}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={ContactRound}
              title="Select a contact"
              subtitle="Choose a contact from the list to view details"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ContactDetailProps {
  contact: ContactWithStats;
  notes: string;
  onNotesChange: (v: string) => void;
  onNotesSave: () => void;
  notesSaving: boolean;
  onEmail: () => void;
  bgForEmail: (email: string) => string;
  initial: (name: string | null, email: string) => string;
}

function ContactDetail({
  contact,
  notes,
  onNotesChange,
  onNotesSave,
  notesSaving,
  onEmail,
  bgForEmail,
  initial,
}: ContactDetailProps) {
  const [dealStage, setDealStage] = useState(contact.dealStage ?? "Lead");

  return (
    <div className="flex-1 overflow-y-auto bg-bg-primary">
      {/* Contact header */}
      <div className="px-6 py-6 border-b border-border-primary">
        <div className="flex items-start gap-4">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className={`w-16 h-16 rounded-full ${bgForEmail(contact.email)} flex items-center justify-center text-white text-2xl font-semibold shrink-0`}>
              {initial(contact.display_name, contact.email)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary truncate">
              {contact.display_name ?? contact.email}
            </h2>
            <p className="text-sm text-text-tertiary mt-0.5">{contact.email}</p>

            {/* Deal stage */}
            <div className="flex items-center gap-2 mt-2">
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
                className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/50 ${DEAL_STAGE_COLORS[dealStage] ?? DEAL_STAGE_COLORS["Lead"]}`}
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-md hover:bg-accent-hover transition-colors font-medium"
            >
              <Mail size={12} />
              Email
            </button>
            <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {contact.stats && (
        <div className="grid grid-cols-3 divide-x divide-border-primary border-b border-border-primary">
          <StatCell label="Total emails" value={String(contact.stats.emailCount)} />
          <StatCell
            label="First contact"
            value={contact.stats.firstEmail ? formatRelativeDate(contact.stats.firstEmail) : "—"}
          />
          <StatCell
            label="Last contact"
            value={contact.stats.lastEmail ? formatRelativeDate(contact.stats.lastEmail) : "—"}
          />
        </div>
      )}

      <div className="px-6 py-4 space-y-6">
        {/* CRM fields */}
        <Section title="Relationship">
          <div className="space-y-2">
            <FieldRow label="Email" value={contact.email} />
            <FieldRow label="Frequency" value={`${contact.frequency} interaction${contact.frequency !== 1 ? "s" : ""}`} />
            {contact.last_contacted_at && (
              <FieldRow label="Last contacted" value={formatRelativeDate(contact.last_contacted_at)} />
            )}
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            onBlur={onNotesSave}
            placeholder="Add notes about this contact..."
            rows={4}
            className="w-full text-sm bg-bg-secondary border border-border-primary rounded-md px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/50 resize-none"
          />
          {notesSaving && (
            <p className="text-xs text-text-tertiary mt-1">Saving...</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <div className="text-base font-semibold text-text-primary">{value}</div>
      <div className="text-xs text-text-tertiary mt-0.5">{label}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-xs text-text-primary font-medium">{value}</span>
    </div>
  );
}
