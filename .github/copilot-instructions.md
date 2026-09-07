# NETKIT Command Builder + Notes Rewrite — Implementation Prompt

## Project Context

You are working in **NETKIT**, a browser-local network engineering toolkit built as a
pnpm monorepo. The main frontend app lives at:

```
artifacts/netkit/src/App.tsx
```

This is a **single 1347-line file** containing all page components, utility functions,
type definitions, shared UI components, and the router. The app uses:
- React 19.1 with TypeScript 5.9
- Vite 7.3 with Tailwind CSS v4
- wouter for routing (lightweight)
- Lucide React for icons
- shadcn/ui components (55 files in `src/components/ui/`)
- All state is browser-local (localStorage), no backend calls

## What Has Already Been Done

Three utility functions have been added after the `useCopy()` function (around line 528)
in App.tsx. These are READY TO USE and must NOT be recreated:

```typescript
function renderMarkdown(text: string): string {
  // Converts markdown to HTML: headings, bold, italic, inline code, code blocks,
  // bullet lists, numbered lists, checklists, horizontal rules
  // Returns sanitized HTML string
}

function exportNotesToFile(notes: Note[]): string {
  // Returns JSON string: { exportedAt, app: 'NETKIT', version: 1, notes }
}

function importNotesFromFile(text: string): Note[] | null {
  // Parses JSON, returns Note[] using normalizeNote(), or null on failure
}
```

## Existing Infrastructure (DO NOT RECREATE)

The file already contains ALL the builder infrastructure you need. Search the file for
these exact identifiers — they are defined at the top and must be reused:

### Types (lines 87-89)
```typescript
type BuilderVendor = 'Cisco IOS / IOS-XE' | 'Juniper Junos' | 'FortiGate' | 'Palo Alto Networks' | 'F5 BIG-IP';
type BuilderCategory = 'interface' | 'ip-address' | 'vlan' | 'static-route' | 'routing' | 'policy' | 'diagnostics' | 'show';
type BuilderField = { key: string; label: string; placeholder: string; required?: boolean; type?: string; min?: number; max?: number; options?: string[] };
```

### Constants (lines 91-150)
```typescript
const builderVendors: BuilderVendor[] = ['Cisco IOS / IOS-XE', 'Juniper Junos', 'FortiGate', 'Palo Alto Networks', 'F5 BIG-IP'];
const builderCategories: { value: BuilderCategory; label: string }[] = [
  { value: 'interface', label: 'Interface configuration' },
  { value: 'ip-address', label: 'IP addressing' },
  { value: 'vlan', label: 'VLAN configuration' },
  { value: 'static-route', label: 'Static route' },
  { value: 'routing', label: 'Routing protocol' },
  { value: 'policy', label: 'Access / control policy' },
  { value: 'diagnostics', label: 'Diagnostics' },
  { value: 'show', label: 'Show / display command' },
];
const builderFieldDefinitions: Record<BuilderCategory, BuilderField[]> = {
  interface: [
    { key: 'interfaceName', label: 'Interface name', placeholder: 'GigabitEthernet1/0/24', required: true },
    { key: 'description', label: 'Description', placeholder: 'EDGE_USERS access', required: true },
    { key: 'vlan', label: 'VLAN ID', placeholder: '120', required: true, type: 'number', min: 1, max: 4094 },
  ],
  'ip-address': [
    { key: 'interfaceName', label: 'Interface name', placeholder: 'GigabitEthernet1/0/24', required: true },
    { key: 'ip', label: 'IPv4 address', placeholder: '10.120.0.1', required: true },
    { key: 'prefix', label: 'Prefix', placeholder: '24', required: true, type: 'number', min: 0, max: 32 },
    { key: 'description', label: 'Description', placeholder: 'User gateway', required: true },
  ],
  vlan: [
    { key: 'vlan', label: 'VLAN ID', placeholder: '120', required: true, type: 'number', min: 1, max: 4094 },
    { key: 'vlanName', label: 'VLAN name', placeholder: 'EDGE_USERS', required: true },
    { key: 'interfaceName', label: 'Interface / trunk', placeholder: 'GigabitEthernet1/0/1', required: true },
    { key: 'description', label: 'Description', placeholder: 'User access VLAN', required: true },
  ],
  'static-route': [
    { key: 'destination', label: 'Destination network', placeholder: '10.40.0.0', required: true },
    { key: 'prefix', label: 'Prefix', placeholder: '24', required: true, type: 'number', min: 0, max: 32 },
    { key: 'nextHop', label: 'Next hop', placeholder: '10.120.0.254', required: true },
    { key: 'description', label: 'Route name / description', placeholder: 'Branch network', required: true },
  ],
  routing: [
    { key: 'protocol', label: 'Protocol', placeholder: 'OSPF', required: true, options: ['OSPF', 'BGP'] },
    { key: 'process', label: 'Process / ASN', placeholder: '10', required: true },
    { key: 'network', label: 'Advertised network', placeholder: '10.120.0.0', required: true },
    { key: 'wildcard', label: 'Wildcard / mask', placeholder: '0.0.0.255', required: true },
    { key: 'area', label: 'Area / peer', placeholder: '0', required: true },
  ],
  policy: [
    { key: 'policyName', label: 'Policy name', placeholder: 'ALLOW_DNS', required: true },
    { key: 'source', label: 'Source', placeholder: 'LAN_USERS', required: true },
    { key: 'destination', label: 'Destination', placeholder: 'ANY', required: true },
    { key: 'service', label: 'Service', placeholder: 'DNS', required: true },
    { key: 'action', label: 'Action', placeholder: 'permit', required: true, options: ['permit', 'deny'] },
  ],
  diagnostics: [{ key: 'command', label: 'Diagnostic target', placeholder: '10.120.0.1', required: true }],
  show: [{ key: 'command', label: 'Show target', placeholder: 'interfaces status', required: true }],
};
const defaultBuilderValues: Record<string, string> = {
  interfaceName: 'GigabitEthernet1/0/24', description: 'EDGE_USERS access', vlan: '120',
  ip: '10.120.0.1', prefix: '24', vlanName: 'EDGE_USERS', destination: '10.40.0.0',
  nextHop: '10.120.0.254', protocol: 'OSPF', process: '10', network: '10.120.0.0',
  wildcard: '0.0.0.255', area: '0', policyName: 'ALLOW_DNS', source: 'LAN_USERS',
  service: 'DNS', action: 'permit', command: 'interfaces status',
};
```

### Utility Functions (already defined, reuse them)
```typescript
function builderFields(category: BuilderCategory) {
  return builderFieldDefinitions[category];
}

function validateBuilderValues(category: BuilderCategory, values: Record<string, string>): Record<string, string> {
  // Returns { fieldKey: errorMessage } for invalid/missing required fields
  // Validates IP addresses, prefix ranges, VLAN ranges
}

function generateBuilderCommand(vendor: BuilderVendor, category: BuilderCategory, values: Record<string, string>): string {
  // Returns multi-line command string for the given vendor/category/values
  // Handles all 5 vendors × 8 categories = 40 templates
}

function downloadText(fileName: string, text: string, type: string) {
  // Creates Blob, generates URL, triggers download via anchor click
}
```

### Note-Related Infrastructure (already defined)
```typescript
type Note = {
  id: number; title: string; body: string; tag: string; updated: string;
  category: string; tags: string[]; pinned: boolean; archived: boolean;
  createdAt: number; updatedAt: number;
};
const noteCategories = ['Network Design', 'Troubleshooting', 'Commands', 'IP Planning', 'VLANs', 'Devices', 'General'];
function normalizeNote(value: Partial<Note>, index = 0): Note { /* ... */ }
function formatNoteTime(timestamp: number): string { /* ... */ }
```

### Shared UI Components (defined in the same file, use them)
```typescript
function Button({ children, variant, className, onClick, type, disabled }) { /* ... */ }
function Field({ label, value, onChange, placeholder, type, className, min, max }) { /* ... */ }
function CopyButton({ value, label }) { /* ... */ }
function PageHeader({ eyebrow, title, description, action, compact }) { /* ... */ }
function SectionTitle({ children, detail }) { /* ... */ }
function EmptyState({ icon, title, text }) { /* ... */ }
```

### Custom Hooks (defined in the same file)
```typescript
function useCopy() { return { copied: boolean, copy: (value: string) => void }; }
function useActivity() { return ActivityRecord[]; }
```

### Imports Already Available
```typescript
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowLeft, ArrowRight, Binary, BookOpen, Calculator, Check, ChevronRight, Clipboard,
  Code2, Copy, Download, FileText, Hash, LayoutDashboard, Menu, Network,
  Pencil, Plus, Radio, RefreshCw, Search, Server, Settings2,
  SlidersHorizontal, Sparkles, Trash2, Upload, X, Grid2X2, MapPin,
  Clock3, Moon, Sun, Zap, NotebookTabs, GitCompare, TerminalSquare, CircleDot, RotateCcw,
  type LucideIcon,
} from 'lucide-react';
```

---

## STEP 1: Replace CommandBuilderPage

**File:** `artifacts/netkit/src/App.tsx`
**Lines to replace:** The entire `function CommandBuilderPage() { ... }` block
(currently at lines 1214-1233, approximately 20 lines of old code).

### What the old version does (WRONG — replace entirely)
- Only 3 vendors: Cisco IOS, Arista EOS, MikroTik RouterOS
- Only 2 command types: "Access interface" and "SVI / gateway"
- Hardcoded inline command generation
- No validation display, no line numbers, no export

### What the new version must do

#### State
```typescript
const [vendor, setVendor] = useState<BuilderVendor>('Cisco IOS / IOS-XE');
const [category, setCategory] = useState<BuilderCategory>('interface');
const [values, setValues] = useState<Record<string, string>>(() => ({ ...defaultBuilderValues }));
const { copied, copy } = useCopy();
```

#### Computed values
```typescript
const fields = builderFields(category);  // Dynamic fields from existing function
const categoryLabel = builderCategories.find((c) => c.value === category)?.label ?? category;
const validationErrors = useMemo(() => validateBuilderValues(category, values), [category, values]);
const hasErrors = Object.keys(validationErrors).length > 0;
const command = useMemo(() => {
  if (hasErrors) return '';
  return generateBuilderCommand(vendor, category, values);
}, [vendor, category, values, hasErrors]);
const lines = command ? command.split('\n') : [];
```

#### Handlers
```typescript
const handleFieldChange = (key: string, value: string) => {
  setValues((prev) => ({ ...prev, [key]: value }));
};
const reset = () => setValues({ ...defaultBuilderValues });
const exportCommand = () => {
  if (command) downloadText('netkit-command.txt', command, 'text/plain');
};
const copyAll = () => {
  if (command) copy(command);
};
```

#### Layout: Two-column grid `xl:grid-cols-[390px_1fr]`

**Left column** — Configuration card:
```
<PageHeader
  eyebrow="Reference / 07"
  title="Command Builder"
  description="Select a vendor, command category, and parameters to generate copy-ready configuration blocks."
  action={<span className="hidden rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary sm:inline">TEMPLATE-BASED</span>}
/>
<section className="rounded-lg border border-border bg-card p-5">
  <SectionTitle detail="template">Configuration</SectionTitle>

  // Vendor/Platform select dropdown
  // Command Category select dropdown
  // Divider
  // SectionTitle with field count
  // Map over `fields` array to render Field components
  // Each field shows validation error below it if exists
  // Divider
  // Reset to defaults button (variant="secondary", full width)
</section>
```

**Right column** — Output card:
```
<section className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
  // Header bar: Code2 icon + "vendor · category" text + Copy/Export/Reset buttons
  // Content area (flex-1 overflow-auto):
  //   If hasErrors → validation error message in destructive styling
  //   If command → line-numbered <pre> block:
  //     Each line: <div className="flex hover:bg-secondary/30">
  //       <span className="mr-4 w-8 shrink-0 select-none text-right text-muted-foreground/40">{i + 1}</span>
  //       <span className="text-foreground">{line || '\u00A0'}</span>
  //     </div>
  //   If no command → empty state with TerminalSquare icon
  // Footer: amber dot + "Review before applying..." warning
</section>
```

#### Key behaviors
- When vendor or category changes, `values` state is PRESERVED (fields that exist in the new category keep their values; new fields get defaults from `defaultBuilderValues`)
- `useMemo` on `validationErrors` and `command` ensures no unnecessary recomputation
- Copy button shows "Copied" for 1.4s after click (uses `useCopy` hook)
- All buttons disabled when `!command || hasErrors`
- The `data-testid` attributes should be preserved for testing

---

## STEP 2: Replace NotesPage

**File:** `artifacts/netkit/src/App.tsx`
**Lines to replace:** The entire `function NotesPage() { ... }` block
(currently at lines 1235-1249, approximately 15 lines of old code).

### What the old version does (WRONG — replace entirely)
- Only title, body, tag fields
- No categories, no tags array, no pin, no archive
- No markdown preview
- No import/export
- No keyboard shortcuts
- No autosave indicator

### What the new version must do

#### State
```typescript
const [notes, setNotes] = useState<Note[]>(() => {
  try {
    const stored = localStorage.getItem('netkit-notes');
    return stored ? JSON.parse(stored) as Note[] : [];
  } catch { return []; }
});
const [selectedId, setSelectedId] = useState<number | null>(null);
const [query, setQuery] = useState('');
const [categoryFilter, setCategoryFilter] = useState('All');
const [showArchived, setShowArchived] = useState(false);
const [editing, setEditing] = useState(false);
const [draft, setDraft] = useState({ title: '', body: '', category: 'General', tags: '' });
const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
```

#### Computed values
```typescript
const active = notes.find((n) => n.id === selectedId) ?? null;
const filteredNotes = useMemo(() => {
  return notes
    .filter((note) => {
      if (note.archived !== showArchived) return false;
      if (categoryFilter !== 'All' && note.category !== categoryFilter) return false;
      if (query) {
        const search = `${note.title} ${note.body} ${note.category} ${note.tags.join(' ')}`.toLowerCase();
        if (!search.includes(query.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
}, [notes, query, categoryFilter, showArchived]);
```

#### Effects
```typescript
// Autosave to localStorage
useEffect(() => {
  localStorage.setItem('netkit-notes', JSON.stringify(notes));
}, [notes]);

// Keyboard shortcuts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (editing) saveNote();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNote();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [editing, draft, selectedId]);
```

#### CRUD Handlers
```typescript
const createNote = () => {
  setSelectedId(null);
  setDraft({ title: '', body: '', category: 'General', tags: '' });
  setEditing(true);
  setViewMode('edit');
};

const selectNote = (id: number) => {
  const note = notes.find((n) => n.id === id);
  if (note) {
    setSelectedId(id);
    setDraft({
      title: note.title,
      body: note.body,
      category: note.category,
      tags: note.tags.join(', '),
    });
    setEditing(true);
    setViewMode('edit');
  }
};

const saveNote = () => {
  if (!draft.title.trim()) return;
  const tagList = draft.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const now = Date.now();
  if (selectedId) {
    setNotes((prev) => prev.map((n) =>
      n.id === selectedId
        ? { ...n, title: draft.title.trim(), body: draft.body, category: draft.category,
            tags: tagList, updatedAt: now, updated: formatNoteTime(now) }
        : n
    ));
  } else {
    const newNote: Note = {
      id: now, title: draft.title.trim(), body: draft.body, category: draft.category,
      tags: tagList, tag: draft.category, updated: 'Just now',
      pinned: false, archived: false, createdAt: now, updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
  }
  setSaveStatus('saved');
};

const deleteNote = () => {
  if (!active) return;
  if (!window.confirm(`Delete "${active.title}"? This cannot be undone.`)) return;
  setNotes((prev) => prev.filter((n) => n.id !== active.id));
  setSelectedId(null);
  setEditing(false);
};

const pinNote = () => {
  if (!active) return;
  setNotes((prev) => prev.map((n) => (n.id === active.id ? { ...n, pinned: !n.pinned } : n)));
};

const archiveNote = () => {
  if (!active) return;
  setNotes((prev) => prev.map((n) => (n.id === active.id ? { ...n, archived: !n.archived } : n)));
};

const duplicateNote = () => {
  if (!active) return;
  const now = Date.now();
  const dup: Note = {
    ...active, id: now, title: `${active.title} (copy)`,
    pinned: false, archived: false, createdAt: now, updatedAt: now, updated: 'Just now',
  };
  setNotes((prev) => [dup, ...prev]);
  setSelectedId(dup.id);
  setDraft({ title: dup.title, body: dup.body, category: dup.category, tags: dup.tags.join(', ') });
};

const exportNotes = () => {
  const text = exportNotesToFile(notes);
  downloadText('netkit-notes.json', text, 'application/json');
};

const importNotes = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const imported = importNotesFromFile(text);
      if (imported) {
        setNotes((prev) => [...imported, ...prev]);
      } else {
        window.alert('Invalid NETKIT notes file.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
```

#### Layout: Two-panel grid `lg:grid-cols-[300px_1fr]`

**PageHeader:**
```
eyebrow="Workspace / 08"
title="Notes"
description="Document network work, store command snippets, and keep engineering notes organized."
action: Import button + Export button + New note button (in a flex gap-1)
```

**Left sidebar** (`<aside>`):
```
- Search input with Search icon
- Category filter dropdown (options: "All" + noteCategories)
- Active / Archive toggle buttons (two side-by-side buttons, active one gets bg-primary/15 text-primary)
- Scrollable note list:
  - Each note card: button element, full width, rounded-md, p-3
  - Shows: pin badge ("PINNED" in amber if pinned), category tag, title (truncate), first line of body (truncate), up to 3 tag chips, timestamp
  - Selected note gets bg-primary/10 ring-1 ring-primary/25
- Footer: "{count} notes"
```

**Right editor panel:**
```
If editing && active:
  // Header bar: NotebookTabs icon + draft title + save status dot + Pin/Archive/Duplicate/Delete buttons
  // Edit/Preview toggle tabs (border-b-2, primary when active)
  // Save button in tab bar right side
  // Content:
  //   Edit mode: title input (borderless, large) + category/tags row + textarea (min-h-[400px], monospace, resize-y)
  //   Preview mode: title + category/tags chips + rendered markdown via dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.body) }}
If not editing:
  // Empty state: NotebookTabs icon + "Select a note or create a new one" + hint about Ctrl+N
```

#### Key behaviors
- Notes sorted: pinned first, then by `updatedAt` descending
- `saveStatus` transitions: "unsaved" on any draft change → "saved" after saveNote()
- Category filter and archived toggle work together with search
- `draft.tags` stored as comma-separated string, parsed to array on save
- Duplicate prepends " (copy)" to title
- Delete requires window.confirm()
- Import uses file picker (.json only), merges imported notes at the top
- Ctrl+S saves, Ctrl+N creates new note
- Autosave via useEffect on `notes` state

---

## Design System Rules (match existing patterns)

### Colors & Styling
- Background: `bg-background`, `bg-card`, `bg-secondary/20`
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-accent`
- Borders: `border-border`, `border-input`
- Destructive: `text-destructive`, `bg-destructive/10`, `border-destructive/30`
- Primary actions: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground border border-border`
- Ghost: `text-muted-foreground hover:text-foreground hover:bg-secondary/70`

### Typography
- Font sizes: `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs`, `text-sm`, `text-base`, `text-lg`
- Monospace: `font-mono` (uses DM Mono font)
- Tracking: `tracking-wider`, `tracking-[0.14em]`, `tracking-[0.18em]`
- Uppercase labels: `text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground`

### Spacing
- Card padding: `p-3`, `p-4`, `p-5`
- Section gaps: `gap-3`, `gap-5`
- Grid: `grid gap-5 xl:grid-cols-[390px_1fr]` (command builder), `lg:grid-cols-[300px_1fr]` (notes)

### Components
- Buttons: Use the existing `Button` component with variants: `primary`, `secondary`, `ghost`, `danger`
- Fields: Use the existing `Field` component
- Copy: Use the existing `CopyButton` component
- Sections: Use `SectionTitle` with optional `detail` prop
- Cards: `rounded-lg border border-border bg-card`

### Layout Patterns
- PageHeader always first: eyebrow + title + description + optional action
- Content in `<section>` or `<div>` with `rounded-lg border border-border bg-card`
- Responsive: mobile-first, xl: breakpoint for two-column layouts

---

## Verification

After implementing both functions, run:
```bash
pnpm --filter @workspace/netkit run typecheck
```

This will catch any TypeScript errors. The file should remain valid JSX/TSX with no
type errors. All existing routes in the Router component already reference
`CommandBuilderPage` and `NotesPage` by name, so no router changes are needed.

## Critical Constraints

1. **DO NOT** add new imports — everything needed is already imported
2. **DO NOT** create new files — everything goes in App.tsx
3. **DO NOT** modify any existing types, constants, or utility functions
4. **DO NOT** add comments to the code
5. **DO NOT** add marketing text, fake metrics, or decorative elements
6. **DO NOT** use `any` type — use proper TypeScript types
7. **PRESERVE** the existing `data-testid` attributes for test compatibility
8. **REUSE** existing components (Button, Field, CopyButton, PageHeader, SectionTitle, EmptyState)
9. **REUSE** existing utility functions (generateBuilderCommand, validateBuilderValues, builderFields, downloadText, renderMarkdown, exportNotesToFile, importNotesFromFile, normalizeNote, formatNoteTime)
10. The CommandBuilderPage must use the existing builder infrastructure (builderVendors, builderCategories, builderFieldDefinitions, defaultBuilderValues) — NOT inline hardcoded commands
