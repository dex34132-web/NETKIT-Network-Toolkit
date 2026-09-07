import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowLeft, ArrowRight, Binary, BookOpen, Calculator, Check, ChevronRight, Clipboard,
  Code2, Copy, Download, FileText, Hash, LayoutDashboard, Menu, Network,
  Pencil, Plus, Radio, RefreshCw, Search, Server, Settings2,
  SlidersHorizontal, Sparkles, Trash2, Upload, X, Grid2X2, MapPin,
  Clock3, Moon, Sun, Zap, NotebookTabs, GitCompare, TerminalSquare, CircleDot, RotateCcw, type LucideIcon,
} from 'lucide-react';
import {
  Link, Route, Switch, useLocation, Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Note = { id: number; title: string; body: string; tag: string; updated: string };
type Cidr = {
  ip: string; prefix: number; network: string; broadcast: string; first: string;
  last: string; mask: string; wildcard: string; hosts: number; total: number; blockSize: number;
};
type SubnetMode = 'prefix' | 'subnets' | 'hosts';
type SubnetRow = Cidr & { number: number };
type SubnetPlan = {
  base: Cidr;
  targetPrefix: number;
  generated: number;
  increment: number;
  rows: SubnetRow[];
};
type IpRange = {
  source: string;
  start: number;
  end: number;
  startIp: string;
  endIp: string;
  cidr: string;
  mask: string;
  total: number;
};
type RangeRelation = {
  a: IpRange;
  b: IpRange;
  status: 'No Overlap' | 'Touching Ranges' | 'Partial Overlap' | 'Range A Contains Range B' | 'Range B Contains Range A' | 'Identical Ranges';
  explanation: string;
  overlapStart: number | null;
  overlapEnd: number | null;
};
type VlanPlanRow = {
  id: number;
  name: string;
  description: string;
  purpose: string;
  network: string;
  gateway: string;
  hostRequirement: number;
  subnet: Cidr;
  extended: boolean;
};
type PortEntry = {
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  service: string;
  transport: string;
  description: string;
  usage: string;
  notes: string;
  category: string;
};

const initialNotes: Note[] = [];

const navGroups = [
  {
    label: '',
    items: [
      { href: '/', label: 'Home', icon: LayoutDashboard },
      { href: '/cidr-subnet', label: 'CIDR Calculator', icon: Network },
      { href: '/subnet-calculator', label: 'Subnet Calculator', icon: Calculator },
      { href: '/ip-tools', label: 'IP Tools', icon: Binary },
      { href: '/ip-range-tools', label: 'IP Range / Overlap', icon: GitCompare },
      { href: '/vlan-tools', label: 'VLAN Calculator', icon: Network },
      { href: '/port-reference', label: 'Port Reference', icon: FileText },
      { href: '/command-builder', label: 'Command Builder', icon: TerminalSquare },
      { href: '/notes', label: 'Notes', icon: NotebookTabs },
    ],
  },
];

const toolCards = [
  { href: '/cidr-subnet', title: 'CIDR Calculator', description: 'Calculate network details, host range, broadcast address and more.', icon: Network, key: '01', accent: 'blue' },
  { href: '/subnet-calculator', title: 'Subnet Calculator', description: 'Split networks into subnets with custom sizes.', icon: Calculator, key: '02', accent: 'green' },
  { href: '/ip-tools', title: 'IP Tools', description: 'IP validation, binary/decimal/hex conversion and more.', icon: Binary, key: '03', accent: 'purple' },
  { href: '/ip-range-tools', title: 'IP Range / Overlap', description: 'Check for overlaps, find ranges and compare networks.', icon: GitCompare, key: '04', accent: 'orange' },
  { href: '/vlan-tools', title: 'VLAN Calculator', description: 'Plan VLANs and calculate subnet ranges.', icon: Network, key: '05', accent: 'green' },
  { href: '/port-reference', title: 'Port Reference', description: 'Common ports, protocols and service details.', icon: Radio, key: '06', accent: 'pink' },
  { href: '/command-builder', title: 'Command Builder', description: 'Generate device-specific configuration commands.', icon: TerminalSquare, key: '07', accent: 'blue' },
  { href: '/notes', title: 'Notes', description: 'Save and organize your networking notes.', icon: NotebookTabs, key: '08', accent: 'yellow' },
];

type Theme = 'dark' | 'light';
type ActivityRecord = { href: string; count: number; updatedAt: number };
const activityStorageKey = 'netkit-activity';
const activityEventName = 'netkit-activity-updated';
const themeEventName = 'netkit-theme-updated';

const activityMeta: Record<string, { title: string; icon: LucideIcon; color: string }> = {
  '/cidr-subnet': { title: 'CIDR Calculator', icon: Network, color: 'text-blue-300 bg-blue-500/20' },
  '/subnet-calculator': { title: 'Subnet Calculator', icon: Calculator, color: 'text-emerald-300 bg-emerald-500/20' },
  '/ip-tools': { title: 'IP Tools', icon: Binary, color: 'text-violet-300 bg-violet-500/20' },
  '/ip-range-tools': { title: 'IP Range / Overlap', icon: GitCompare, color: 'text-orange-300 bg-orange-500/20' },
  '/vlan-tools': { title: 'VLAN Calculator', icon: Network, color: 'text-emerald-300 bg-emerald-500/20' },
  '/port-reference': { title: 'Port Reference', icon: Radio, color: 'text-amber-300 bg-amber-500/20' },
  '/command-builder': { title: 'Command Builder', icon: TerminalSquare, color: 'text-cyan-300 bg-cyan-500/20' },
  '/notes': { title: 'Notes', icon: NotebookTabs, color: 'text-yellow-300 bg-yellow-500/20' },
  '/export': { title: 'Export Workspace', icon: Upload, color: 'text-sky-300 bg-sky-500/20' },
  '/settings': { title: 'Settings', icon: Settings2, color: 'text-slate-300 bg-slate-500/20' },
};

function readThemePreference(): Theme {
  try {
    return localStorage.getItem('netkit-theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function setThemePreference(theme: Theme) {
  localStorage.setItem('netkit-theme', theme);
  window.dispatchEvent(new Event(themeEventName));
}

function readActivity(): ActivityRecord[] {
  try {
    const stored = localStorage.getItem(activityStorageKey);
    const parsed = stored ? JSON.parse(stored) as ActivityRecord[] : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.href === 'string' && typeof item.updatedAt === 'number') : [];
  } catch {
    return [];
  }
}

function recordActivity(href: string) {
  if (href === '/' || !activityMeta[href]) return;
  const current = readActivity();
  const existing = current.find((item) => item.href === href);
  const next = existing
    ? current.map((item) => item.href === href ? { ...item, count: item.count + 1, updatedAt: Date.now() } : item)
    : [{ href, count: 1, updatedAt: Date.now() }, ...current];
  localStorage.setItem(activityStorageKey, JSON.stringify(next.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8)));
  window.dispatchEvent(new Event(activityEventName));
}

function formatActivityTime(timestamp: number): string {
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function useActivity() {
  const [activity, setActivity] = useState<ActivityRecord[]>(readActivity);
  useEffect(() => {
    const sync = () => setActivity(readActivity());
    window.addEventListener(activityEventName, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(activityEventName, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return activity;
}

function parseIp(value: string): number | null {
  const bits = value.trim().split('.');
  if (bits.length !== 4 || bits.some((bit) => !/^\d+$/.test(bit) || Number(bit) > 255)) return null;
  return bits.reduce((acc, bit) => (acc * 256) + Number(bit), 0);
}

function formatIp(value: number): string {
  const unsigned = value >>> 0;
  return [(unsigned >>> 24) & 255, (unsigned >>> 16) & 255, (unsigned >>> 8) & 255, unsigned & 255].join('.');
}

function calculateCidr(ip: string, prefix: number): Cidr | null {
  const parsed = parseIp(ip);
  if (parsed === null || prefix < 0 || prefix > 32) return null;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (parsed & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  const hosts = prefix === 31 ? total : prefix === 32 ? 0 : Math.max(0, total - 2);
  return {
    ip, prefix, network: formatIp(network), broadcast: formatIp(broadcast),
    first: prefix === 32 ? formatIp(network) : prefix === 31 ? formatIp(network) : formatIp(network + 1),
    last: prefix === 32 ? formatIp(network) : prefix === 31 ? formatIp(broadcast) : formatIp(broadcast - 1),
    mask: formatIp(mask), wildcard: formatIp((~mask) >>> 0), hosts, total, blockSize: total,
  };
}

function parseNetworkInput(value: string, fallbackPrefix: number): Cidr | null {
  const parts = value.trim().split('/');
  if (parts.length > 2 || !parts[0]) return null;
  const prefix = parts.length === 2 ? Number(parts[1]) : fallbackPrefix;
  return Number.isInteger(prefix) ? calculateCidr(parts[0], prefix) : null;
}

function buildSubnetPlan(input: string, originalPrefix: number, mode: SubnetMode, targetValue: number): { plan: SubnetPlan | null; error?: string } {
  const base = parseNetworkInput(input, originalPrefix);
  if (!base) return { plan: null, error: 'Enter a valid IPv4 address and an original prefix from /0 through /32.' };
  if (!Number.isInteger(targetValue) || targetValue <= 0) return { plan: null, error: 'Enter a positive whole number for the selected subnetting target.' };

  let targetPrefix = targetValue;
  if (mode === 'prefix') {
    if (targetPrefix < base.prefix || targetPrefix > 32) return { plan: null, error: `The target prefix must be between /${base.prefix} and /32.` };
  } else if (mode === 'subnets') {
    const maxSubnets = 2 ** (32 - base.prefix);
    if (targetValue > maxSubnets || (targetValue & (targetValue - 1)) !== 0) return { plan: null, error: 'The subnet count must be a power of two within the original network.' };
    targetPrefix = base.prefix + Math.log2(targetValue);
  } else {
    const maxHosts = base.prefix === 31 ? 2 : base.prefix === 32 ? 0 : (2 ** (32 - base.prefix)) - 2;
    if (targetValue > maxHosts) return { plan: null, error: `This network cannot provide ${targetValue.toLocaleString()} usable hosts.` };
    targetPrefix = -1;
    for (let prefix = 32; prefix >= base.prefix; prefix -= 1) {
      const hosts = prefix === 31 ? 2 : prefix === 32 ? 0 : Math.max(0, (2 ** (32 - prefix)) - 2);
      if (hosts >= targetValue) {
        targetPrefix = prefix;
        break;
      }
    }
    if (targetPrefix < 0) return { plan: null, error: 'No valid IPv4 prefix can satisfy that host requirement.' };
  }

  const generated = 2 ** (targetPrefix - base.prefix);
  const increment = 2 ** (32 - targetPrefix);
  if (generated > 4096) return { plan: null, error: `That request would generate ${generated.toLocaleString()} rows. Choose a smaller subnet count or a less specific target prefix (maximum 4,096 rows).` };

  const baseNumber = parseIp(base.network) as number;
  const rows: SubnetRow[] = [];
  for (let index = 0; index < generated; index += 1) {
    const row = calculateCidr(formatIp(baseNumber + (index * increment)), targetPrefix);
    if (row) rows.push({ ...row, number: index + 1 });
  }
  return { plan: { base, targetPrefix, generated, increment, rows } };
}

function calculateVlanSubnet(input: string, mode: 'prefix' | 'hosts', target: number): { subnet: Cidr | null; error?: string } {
  const parent = parseNetworkInput(input, 24);
  if (!parent) return { subnet: null, error: 'Enter a valid IPv4 network such as 10.120.0.0/24.' };
  if (mode === 'prefix') {
    if (!Number.isInteger(target) || target < 0 || target > 32) return { subnet: null, error: 'Enter a target prefix from /0 through /32.' };
    if (target < parent.prefix || target > 32) return { subnet: null, error: `The target prefix must be between /${parent.prefix} and /32.` };
    return { subnet: calculateCidr(parent.network, target) };
  }
  if (!Number.isInteger(target) || target < 1) return { subnet: null, error: 'Host requirements must be a positive whole number.' };
  const parentHosts = parent.prefix === 31 ? 2 : parent.prefix === 32 ? 0 : parent.total - 2;
  if (target > parentHosts) return { subnet: null, error: `The parent network cannot provide ${target.toLocaleString()} usable hosts.` };
  for (let prefix = 32; prefix >= parent.prefix; prefix -= 1) {
    const hosts = prefix === 31 ? 2 : prefix === 32 ? 0 : (2 ** (32 - prefix)) - 2;
    if (hosts >= target) return { subnet: calculateCidr(parent.network, prefix) };
  }
  return { subnet: null, error: 'No IPv4 prefix can satisfy that host requirement.' };
}

function vlanRangeClass(id: number): 'Normal' | 'Extended' | 'Invalid' {
  if (!Number.isInteger(id) || id < 1 || id > 4094) return 'Invalid';
  return id <= 1005 ? 'Normal' : 'Extended';
}

function parseRangeValue(value: string): { range: IpRange | null; error?: string } {
  const source = value.trim();
  if (!source) return { range: null, error: 'Enter an IPv4 address, CIDR network, or start-end range.' };
  if (source.includes('/')) {
    const parts = source.split('/');
    if (parts.length !== 2 || !/^\d+$/.test(parts[1])) return { range: null, error: `"${source}" has an invalid CIDR prefix.` };
    const cidr = calculateCidr(parts[0], Number(parts[1]));
    if (!cidr) return { range: null, error: `"${source}" is not a valid IPv4 network.` };
    const start = parseIp(cidr.network) as number;
    const end = parseIp(cidr.broadcast) as number;
    return { range: { source, start, end, startIp: cidr.network, endIp: cidr.broadcast, cidr: `${cidr.network}/${cidr.prefix}`, mask: cidr.mask, total: cidr.total } };
  }

  const rangeParts = source.split(/\s*(?:\.\.|-)\s*/);
  if (rangeParts.length === 2) {
    const start = parseIp(rangeParts[0]);
    const end = parseIp(rangeParts[1]);
    if (start === null || end === null) return { range: null, error: `"${source}" contains an invalid IPv4 address.` };
    if (end < start) return { range: null, error: `"${source}" is reversed. The end address must be after the start address.` };
    return { range: { source, start, end, startIp: formatIp(start), endIp: formatIp(end), cidr: '—', mask: '—', total: end - start + 1 } };
  }

  const parsed = parseIp(source);
  if (parsed === null) return { range: null, error: `"${source}" is not a valid IPv4 address, CIDR network, or range.` };
  return { range: { source, start: parsed, end: parsed, startIp: source, endIp: source, cidr: `${source}/32`, mask: '255.255.255.255', total: 1 } };
}

function compareRanges(a: IpRange, b: IpRange): RangeRelation {
  const overlapStart = Math.max(a.start, b.start);
  const overlapEnd = Math.min(a.end, b.end);
  if (a.start === b.start && a.end === b.end) return { a, b, status: 'Identical Ranges', explanation: 'Both inputs normalize to the same address range.', overlapStart, overlapEnd };
  if (a.start <= b.start && a.end >= b.end) return { a, b, status: 'Range A Contains Range B', explanation: 'Every address in range B is contained by range A.', overlapStart, overlapEnd };
  if (b.start <= a.start && b.end >= a.end) return { a, b, status: 'Range B Contains Range A', explanation: 'Every address in range A is contained by range B.', overlapStart, overlapEnd };
  if (overlapStart <= overlapEnd) return { a, b, status: 'Partial Overlap', explanation: 'The ranges share a contiguous subset of addresses.', overlapStart, overlapEnd };
  if (a.end + 1 === b.start || b.end + 1 === a.start) return { a, b, status: 'Touching Ranges', explanation: 'The ranges are adjacent with no shared address.', overlapStart: null, overlapEnd: null };
  return { a, b, status: 'No Overlap', explanation: 'The ranges are separate and have no adjacent boundary.', overlapStart: null, overlapEnd: null };
}

function downloadText(fileName: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function binaryIp(ip: string): string {
  const parsed = parseIp(ip);
  if (parsed === null) return '';
  return ip.split('.').map((octet) => Number(octet).toString(2).padStart(8, '0')).join('.');
}

function hexIp(ip: string): string {
  const parsed = parseIp(ip);
  if (parsed === null) return '';
  return `0x${(parsed >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (value: string) => {
    if (!value) return;
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return { copied, copy };
}

function Button({
  children, variant = 'primary', className = '', onClick, type = 'button', disabled = false,
}: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; className?: string;
  onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/88',
    secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
    danger: 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20',
  };
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}>{children}</button>;
}

function Field({
  label, value, onChange, placeholder, type = 'text', className = '', min, max,
}: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
  type?: string; className?: string; min?: number; max?: number;
}) {
  return <label className={`block ${className}`}>
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    <input data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`} min={min} max={max} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50" />
  </label>;
}

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const { copied, copy } = useCopy();
  return <Button variant="ghost" className="px-2 text-xs" onClick={() => copy(value)} disabled={!value}><Clipboard size={13} />{copied ? 'Copied' : label}</Button>;
}

function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(readThemePreference);
  const pageName = location === '/settings' ? 'Settings' : [...navGroups.flatMap((group) => group.items)].find((item) => item.href === location)?.label ?? 'Dashboard';
  const allNav = navGroups.flatMap((group) => group.items);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    setThemePreference(theme);
  }, [theme]);
  useEffect(() => {
    const syncTheme = () => setTheme(readThemePreference());
    window.addEventListener(themeEventName, syncTheme);
    return () => window.removeEventListener(themeEventName, syncTheme);
  }, []);
  useEffect(() => {
    recordActivity(location);
  }, [location]);
  return <div className="scanline flex min-h-[100dvh] bg-background">
    <aside className="hidden w-[190px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-[62px] items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="relative flex h-8 w-8 items-center justify-center text-primary">
          <Network size={29} strokeWidth={1.65} />
          <span className="absolute bottom-[4px] right-[2px] h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
        <div><div className="text-[16px] font-bold tracking-tight text-foreground">NETKIT</div><div className="text-[7px] leading-3 text-muted-foreground">Network Engineering Toolkit</div></div>
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {navGroups.map((group) => <div key={group.label || 'main'} className="space-y-0.5">
          {group.items.map(({ href, label, icon: Icon }) => <NavItem key={`${group.label}-${label}`} href={href} label={label} icon={Icon} active={location === href} />)}
        </div>)}
      </div>
      <div className="border-t border-sidebar-border px-2.5 py-2">
        <Link href="/settings" onClick={() => setMenuOpen(false)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[10px] transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'}`}><Settings2 size={15} />Settings</Link>
        <button type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} className="mt-1 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[10px] text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><span className="flex items-center gap-2">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span><span className={`relative h-3.5 w-6 rounded-full transition ${theme === 'dark' ? 'bg-blue-500' : 'bg-slate-500'}`}><span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-slate-100 transition-transform ${theme === 'dark' ? 'translate-x-3' : 'translate-x-0.5'}`} /></span></button>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md md:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground md:hidden" aria-label="Open navigation" aria-expanded={menuOpen}><Menu size={16} /></button>
          <div className="relative hidden max-w-[402px] flex-1 sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/80" />
            <input aria-label="Search tools, commands, or keywords" placeholder="Search for tools, commands, or keywords..." className="h-[30px] w-full rounded-md border border-input bg-card pl-9 pr-3 text-[10px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15" />
          </div>
          <div className="truncate text-[10px] text-muted-foreground sm:hidden">NETKIT / <span className="text-primary">{pageName}</span></div>
        </div>
        <div className="ml-3 flex items-center gap-4">
          {theme === 'dark' ? <Sun size={16} className="text-muted-foreground" /> : <Moon size={16} className="text-muted-foreground" />}
        </div>
      </header>
      {menuOpen && <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/40 px-3 py-2 md:hidden">{allNav.map(({ href, label, icon: Icon }) => <Link key={`${href}-${label}`} href={href} onClick={() => setMenuOpen(false)} data-testid={`link-mobile-${label}`} className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-xs ${location === href ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}><Icon size={13} />{label}</Link>)}<Link href="/settings" onClick={() => setMenuOpen(false)} data-testid="link-mobile-settings" className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-xs ${location === '/settings' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}><Settings2 size={13} />Settings</Link></nav>}
      <main className="netkit-grid min-h-[calc(100dvh-62px)] px-3 py-3 md:px-5 md:py-3"><div className="mx-auto max-w-[1160px] page-enter">{children}</div></main>
    </div>
  </div>;
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return <Link href={href} data-testid={`link-nav-${label}`} className={`group flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[10px] transition-all ${active ? 'bg-sidebar-accent font-semibold text-foreground shadow-[inset_0_0_0_1px_rgba(70,143,255,.1)]' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Icon size={15} strokeWidth={active ? 2.1 : 1.7} className={active ? 'text-blue-300' : ''} /><span className="flex-1">{label}</span></Link>;
}

function PageHeader({ eyebrow, title, description, action, compact = false }: { eyebrow: string; title: string; description: string; action?: ReactNode; compact?: boolean }) {
  const [, navigate] = useLocation();
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };
  return <div className={`${compact ? 'mb-4 gap-3' : 'mb-7 gap-5'} flex flex-col justify-between md:flex-row md:items-end`}><div><button type="button" onClick={goBack} className={`${compact ? 'mb-2 px-2 py-1' : 'mb-4 px-2.5 py-1.5'} inline-flex items-center gap-1.5 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary`} data-testid="button-back"><ArrowLeft size={13} /> Back</button><div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary"><span className="h-px w-5 bg-primary" />{eyebrow}</div><h1 className={`${compact ? 'text-xl' : 'text-2xl md:text-3xl'} font-semibold tracking-tight text-foreground`}>{title}</h1><p className={`${compact ? 'mt-1 text-[11px]' : 'mt-2 text-sm'} max-w-2xl leading-relaxed text-muted-foreground`}>{description}</p></div>{action}</div>;
}

function SectionTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold tracking-tight text-foreground">{children}</h2>{detail && <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{detail}</span>}</div>;
}

function Stat({ label, value, accent = 'text-primary' }: { label: string; value: string; accent?: string }) {
  return <div className="border-l border-border pl-3"><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className={`mt-1 font-mono text-lg ${accent}`}>{value}</div></div>;
}

function Dashboard() {
  const [quickIp, setQuickIp] = useState('10.24.8.0');
  const [quickPrefix, setQuickPrefix] = useState('24');
  const [result, setResult] = useState<Cidr | null>(() => calculateCidr('10.24.8.0', 24));
  const [notes] = useState(initialNotes);
  const run = () => setResult(calculateCidr(quickIp, Number(quickPrefix)));
  return <><PageHeader eyebrow="Overview / 01" title="Ready when the network is." description="A tight set of instruments for the moments between a diagram and a change window." action={<Link href="/export" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary" data-testid="link-export-dashboard"><Download size={15} /> Export workspace</Link>} />
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <section className="relative overflow-hidden rounded-lg border border-border bg-card p-5 md:p-6"><div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl" /><div className="relative"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Quick calculation</div><h2 className="mt-1 text-lg font-semibold">Subnet a network</h2></div><span className="rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">IPv4 / CIDR</span></div><div className="grid gap-3 sm:grid-cols-[1fr_108px_auto] sm:items-end"><Field label="Network address" value={quickIp} onChange={setQuickIp} placeholder="192.168.1.0" /><Field label="Prefix" value={quickPrefix} onChange={setQuickPrefix} type="number" min={0} max={32} /><Button onClick={run} data-testid="button-dashboard-calculate"><Sparkles size={15} /> Calculate</Button></div>{result ? <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-5 sm:grid-cols-4"><Stat label="Network" value={`${result.network}/${result.prefix}`} /><Stat label="Broadcast" value={result.broadcast} /><Stat label="Usable hosts" value={result.hosts.toLocaleString()} accent="text-accent" /><Stat label="Netmask" value={result.mask} /></div> : <div className="mt-5 rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">Enter a valid IPv4 address and prefix from 0 to 32.</div>}</div></section>
      <section className="rounded-lg border border-border bg-card p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Workspace pulse</div><h2 className="mt-1 text-lg font-semibold">Your toolkit at a glance</h2></div><Settings2 size={18} className="text-muted-foreground" /></div><div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border"><div className="bg-card p-4"><div className="font-mono text-2xl text-primary">{toolCards.length.toString().padStart(2, '0')}</div><div className="mt-1 text-xs text-muted-foreground">instruments ready</div></div><div className="bg-card p-4"><div className="font-mono text-2xl text-accent">{notes.length.toString().padStart(2, '0')}</div><div className="mt-1 text-xs text-muted-foreground">local notes</div></div><div className="bg-card p-4"><div className="font-mono text-2xl text-amber-300">{ports.length}</div><div className="mt-1 text-xs text-muted-foreground">reference entries</div></div><div className="bg-card p-4"><div className="font-mono text-sm text-sky-300">Browser local</div><div className="mt-1 text-xs text-muted-foreground">execution mode</div></div></div><Link href="/command-builder" className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground transition hover:text-primary" data-testid="link-dashboard-command"><span className="flex items-center gap-2"><Code2 size={14} /> Build a change command</span><ArrowRight size={14} /></Link></section>
    </div>
    <section className="mt-8"><SectionTitle detail="6 instruments">Network tools</SectionTitle><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{toolCards.map((tool, index) => <Link key={tool.key} href={tool.href} data-testid={`card-tool-${tool.key}`} className={`group page-enter stagger-${Math.min(index + 1, 3)} relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card/80`}><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-md border ${tool.accent === 'cyan' ? 'border-primary/25 bg-primary/10 text-primary' : tool.accent === 'lime' ? 'border-accent/25 bg-accent/10 text-accent' : 'border-amber-300/25 bg-amber-300/10 text-amber-300'}`}><tool.icon size={17} /></div><span className="font-mono text-[10px] text-muted-foreground/60">{tool.key}</span></div><div><div className="flex items-center justify-between"><h3 className="text-sm font-semibold group-hover:text-primary">{tool.title}</h3><ArrowRight size={14} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div><p className="mt-1 text-xs text-muted-foreground">{tool.description}</p></div></Link>)}</div></section>
    <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]"><div><SectionTitle detail="local state">Recent notes</SectionTitle><div className="overflow-hidden rounded-lg border border-border bg-card">{notes.map((note) => <Link href="/notes" key={note.id} data-testid={`row-dashboard-note-${note.id}`} className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition last:border-b-0 hover:bg-secondary/50"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-secondary font-mono text-[10px] text-primary">{String(note.id).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{note.title}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{note.body}</div></div><span className="hidden font-mono text-[10px] text-muted-foreground sm:block">{note.updated}</span></Link>)}</div></div><div><SectionTitle detail="shortcuts">Quick tools</SectionTitle><div className="grid grid-cols-2 gap-2"><Link href="/port-reference" className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/40" data-testid="card-quick-port"><div className="mb-5 flex items-center justify-between"><Radio size={16} className="text-accent" /><span className="font-mono text-[10px] text-muted-foreground">CTRL K</span></div><div className="text-sm font-semibold">Port reference</div><div className="mt-1 text-xs text-muted-foreground">TCP, UDP and service notes</div></Link><Link href="/ip-tools" className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/40" data-testid="card-quick-convert"><div className="mb-5 flex items-center justify-between"><Binary size={16} className="text-primary" /><span className="font-mono text-[10px] text-muted-foreground">IPV4</span></div><div className="text-sm font-semibold">Convert an address</div><div className="mt-1 text-xs text-muted-foreground">See every representation</div></Link></div></div></section>
  </>;
}

function RefinedDashboard() {
  const quickAccess: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/cidr-subnet', label: 'CIDR Calculator', icon: Network },
    { href: '/subnet-calculator', label: 'Subnet Calculator', icon: Calculator },
    { href: '/ip-tools', label: 'IP Tools', icon: Binary },
    { href: '/vlan-tools', label: 'VLAN Calculator', icon: Network },
  ];
  const activity = useActivity();
  const accentStyles: Record<string, string> = {
    blue: 'border-blue-400/20 bg-blue-500/15 text-blue-300',
    green: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300',
    purple: 'border-violet-400/20 bg-violet-500/15 text-violet-300',
    orange: 'border-orange-400/20 bg-orange-500/15 text-orange-300',
    pink: 'border-pink-400/20 bg-pink-500/15 text-pink-300',
    yellow: 'border-amber-400/20 bg-amber-500/15 text-amber-300',
  };
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_196px]">
    <div className="min-w-0">
      <section className="netkit-hero relative mb-4 h-[146px] overflow-hidden rounded-md border border-blue-400/20 px-6 py-5">
        <div className="relative z-10">
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-blue-200">Welcome to</div>
          <h1 className="mt-1 text-[30px] font-bold leading-none tracking-tight text-foreground">NET<span className="text-blue-400">KIT</span></h1>
          <p className="mt-2 text-[12px] text-foreground/80">Your all-in-one network engineering toolkit.</p>
          <div className="mt-3 flex gap-4 text-[8px] text-blue-200/75"><span>Calculate</span><span>Configure</span><span>Troubleshoot</span><span>Simplify</span></div>
        </div>
        <div className="absolute right-3 top-0 h-full w-[44%] opacity-80">
          <svg viewBox="0 0 260 150" className="h-full w-full" aria-hidden="true">
            <g fill="none" stroke="#4d9cff" strokeOpacity=".35" strokeWidth="1"><path d="M25 102 75 72 123 114 178 87 228 111M75 72 91 27 154 39 178 87M154 39 211 49 228 111" /><circle cx="151" cy="72" r="25" /><ellipse cx="151" cy="72" rx="10" ry="25" /><path d="M126 72h50M132 59h38M132 85h38" /></g>
            <g fill="#10294e" stroke="#4d9cff" strokeOpacity=".65"><rect x="15" y="91" width="29" height="22" rx="4" /><rect x="78" y="15" width="29" height="22" rx="4" /><rect x="169" y="77" width="31" height="24" rx="4" /><rect x="211" y="104" width="28" height="18" rx="4" /></g>
            <g fill="#64adff"><circle cx="75" cy="72" r="2.5" /><circle cx="91" cy="27" r="2.5" /><circle cx="211" cy="49" r="2.5" /><circle cx="228" cy="111" r="2.5" /></g>
          </svg>
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2"><Grid2X2 size={17} className="text-slate-200" /><h2 className="text-[15px] font-semibold">Network Tools</h2></div>
        <p className="mb-2 pl-[25px] text-[9px] text-muted-foreground">Essential tools for everyday network engineering tasks.</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {toolCards.map((tool) => <Link key={tool.key} href={tool.href} data-testid={`card-tool-${tool.key}`} className="group relative flex min-h-[124px] flex-col justify-between overflow-hidden rounded-md border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-blue-400/45 hover:bg-card/80">
            <div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-md border ${accentStyles[tool.accent]}`}><tool.icon size={18} /></div><span className="font-mono text-[9px] text-muted-foreground/60">{tool.key}</span></div>
            <div><div className="flex items-center justify-between gap-1"><h3 className="truncate text-[10px] font-semibold group-hover:text-blue-300">{tool.title}</h3><ArrowRight size={12} className="shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-blue-300" /></div><p className="mt-1 line-clamp-2 text-[8px] leading-[1.35] text-muted-foreground">{tool.description}</p></div>
          </Link>)}
        </div>
      </section>
      <section className="mt-3 rounded-md border border-border bg-card p-3">
        <div className="mb-2 flex items-center gap-2"><Zap size={16} className="text-blue-300" /><div><h2 className="text-[13px] font-semibold">Quick Access</h2><p className="text-[8px] text-muted-foreground">Jump straight into the tools you use most.</p></div></div>
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">{quickAccess.map(({ href, label, icon: Icon }) => <Link key={label} href={href} className="flex items-center justify-between rounded border border-border bg-secondary px-2 py-1.5 text-[8px] text-secondary-foreground transition hover:border-blue-400/40 hover:text-primary"><span className="flex items-center gap-1.5"><Icon size={12} className="text-blue-300" />{label}</span><ChevronRight size={11} className="text-muted-foreground" /></Link>)}</div>
      </section>
    </div>
    <aside className="space-y-3">
      <section className="rounded-md border border-border bg-card p-3">
        <div className="mb-3 flex items-center gap-2"><Zap size={15} className="text-slate-100" /><h2 className="text-[12px] font-semibold">Quick Info</h2></div>
        <div className="space-y-3 text-[8px]">
          <div className="flex gap-2"><MapPin size={13} className="shrink-0 text-slate-200" /><div><div className="font-semibold text-slate-200">Private IP ranges · RFC 1918</div><p className="mt-1 leading-4 text-muted-foreground">10.0.0.0/8<br />172.16.0.0/12<br />192.168.0.0/16</p></div></div>
          <div className="flex gap-2"><CircleDot size={13} className="shrink-0 text-slate-200" /><div><div className="font-semibold text-slate-200">Common subnet masks</div><p className="mt-1 leading-4 text-muted-foreground">/8 · 255.0.0.0<br />/16 · 255.255.0.0<br />/24 · 255.255.255.0</p></div></div>
          <div className="flex gap-2"><Server size={13} className="shrink-0 text-slate-200" /><div><div className="font-semibold text-slate-200">Well-known ports</div><p className="mt-1 leading-4 text-muted-foreground">SSH 22 · DNS 53<br />HTTP 80 · HTTPS 443</p></div></div>
        </div>
        <Link href="/port-reference" className="mt-3 flex items-center gap-1 text-[8px] text-blue-300 hover:text-blue-200">View More <ArrowRight size={11} /></Link>
      </section>
      <section className="rounded-md border border-border bg-card p-3">
        <div className="mb-3 flex items-center gap-2"><Clock3 size={14} className="text-slate-100" /><h2 className="text-[12px] font-semibold">Recent Activity</h2></div>
        {activity.length === 0 ? <div className="rounded border border-dashed border-border px-2 py-3 text-[9px] leading-4 text-muted-foreground">No tool activity yet. Open a tool and it will appear here.</div> : <div className="space-y-3">{activity.slice(0, 4).map((entry) => { const meta = activityMeta[entry.href]; if (!meta) return null; const Icon = meta.icon; return <Link key={entry.href} href={entry.href} className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded ${meta.color}`}><Icon size={14} /></span><span className="min-w-0"><span className="block truncate text-[9px] font-medium text-slate-200">{meta.title}</span><span className="mt-0.5 block text-[8px] text-muted-foreground">{entry.count} {entry.count === 1 ? 'visit' : 'visits'} · {formatActivityTime(entry.updatedAt)}</span></span></Link>; })}</div>}
      </section>
    </aside>
  </div>;
}

function CidrPage() {
  const [ip, setIp] = useState('192.168.10.0');
  const [prefix, setPrefix] = useState('24');
  const [result, setResult] = useState<Cidr | null>(() => calculateCidr('192.168.10.0', 24));
  const run = () => setResult(calculateCidr(ip, Number(prefix)));
  const error = !result;
  const binaryAddress = result ? binaryIp(result.network) : '';
  const binaryMask = result ? binaryIp(result.mask) : '';
  const binaryWildcard = result ? binaryIp(result.wildcard) : '';
  const className = result?.prefix !== undefined && result.prefix <= 7 ? 'Class A Network' : result?.prefix !== undefined && result.prefix <= 15 ? 'Class B Network' : 'Class C Network';
  return <><PageHeader compact eyebrow="Network / 01" title="CIDR Calculator" description="Calculate network boundaries, host ranges, masks and address capacity." action={<span className="hidden rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary sm:inline">IPv4 / CIDR</span>} />
    <section className="mb-3 rounded-md border border-border bg-card p-3 md:p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px_auto] md:items-end">
        <Field label="IPv4 address" value={ip} onChange={setIp} placeholder="192.168.10.0" />
        <Field label="CIDR prefix" value={prefix} onChange={setPrefix} type="number" min={0} max={32} />
        <Button onClick={run} className="h-10 min-w-[105px]" data-testid="button-calculate-cidr"><Calculator size={13} /> Calculate</Button>
      </div>
      {error && <div className="mt-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive" role="alert">Enter a valid IPv4 address and a prefix from /0 through /32.</div>}
    </section>
    {result ? <div className="space-y-3">
      <section className="rounded-md border border-border bg-card p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between"><SectionTitle detail={`${result.network}/${result.prefix}`}>Network Details</SectionTitle><span className="font-mono text-[9px] text-muted-foreground">{className}</span></div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_180px]">
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              ['Network Address', `${result.network}/${result.prefix}`],
              ['Broadcast Address', result.broadcast],
              ['First Usable Host', result.prefix === 31 ? `${result.first} · endpoint` : result.first],
              ['Last Usable Host', result.prefix === 31 ? `${result.last} · endpoint` : result.last],
              ['Subnet Mask', result.mask],
              ['Wildcard Mask', result.wildcard],
              ['Total Addresses', result.total.toLocaleString()],
              ['Usable Hosts', result.hosts.toLocaleString()],
            ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5 last:border-0 sm:block"><span className="text-[10px] text-muted-foreground">{label}</span><span className="font-mono text-[11px] text-foreground">{value}</span></div>)}
          </div>
          <div className="flex flex-col items-center justify-center border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pt-0">
            <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-primary bg-primary/5 font-mono text-xl text-foreground shadow-[0_0_0_5px_rgba(42,130,255,.08)]">/{result.prefix}</div>
            <div className="mt-2 text-[10px] font-semibold text-foreground">{className}</div>
            <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{result.mask}</div>
            <div className="mt-4 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, Math.min(100, (result.hosts / Math.max(result.total, 1)) * 100))}%` }} /></div>
            <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{result.hosts.toLocaleString()} usable hosts</div>
          </div>
        </div>
      </section>
      <section className="rounded-md border border-border bg-card p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between"><SectionTitle>Binary Representation</SectionTitle><CopyButton value={`Network Address (Binary): ${binaryAddress}\nSubnet Mask (Binary): ${binaryMask}\nWildcard Mask (Binary): ${binaryWildcard}`} label="Copy All" /></div>
        <div className="space-y-2">{[['Network Address (Binary)', binaryAddress], ['Subnet Mask (Binary)', binaryMask], ['Wildcard Mask (Binary)', binaryWildcard]].map(([label, value]) => <div key={label} className="grid gap-1.5 sm:grid-cols-[175px_1fr] sm:items-center"><span className="pl-1 text-[10px] text-muted-foreground">{label}</span><code className="overflow-x-auto rounded border border-border bg-background/60 px-2 py-1.5 font-mono text-[10px] tracking-wide text-foreground">{value}</code></div>)}</div>
      </section>
      <section className="rounded-md border border-border bg-card p-3 md:p-4">
        <SectionTitle>Quick Reference</SectionTitle>
        <div className="grid grid-cols-3 divide-x divide-border rounded border border-border bg-background/35">
          <div className="p-3"><div className="text-[9px] text-muted-foreground">CIDR / Prefix</div><div className="mt-1 font-mono text-xs text-foreground">/{result.prefix}</div></div>
          <div className="p-3"><div className="text-[9px] text-muted-foreground">Subnet Mask</div><div className="mt-1 font-mono text-xs text-foreground">{result.mask}</div></div>
          <div className="p-3"><div className="text-[9px] text-muted-foreground">Usable Hosts</div><div className="mt-1 font-mono text-xs text-accent">{result.hosts.toLocaleString()}</div></div>
        </div>
      </section>
    </div> : <EmptyState icon={Calculator} title="Waiting for a valid network" text="Enter an IPv4 address and prefix to see the computed boundaries." />}</>;
}

function SubnetPage() {
  const [baseInput, setBaseInput] = useState('192.168.10.0');
  const [originalPrefix, setOriginalPrefix] = useState('24');
  const [mode, setMode] = useState<SubnetMode>('prefix');
  const [targetValue, setTargetValue] = useState('26');
  const [plan, setPlan] = useState<SubnetPlan | null>(() => buildSubnetPlan('192.168.10.0', 24, 'prefix', 26).plan);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<keyof SubnetRow>('number');
  const [ascending, setAscending] = useState(true);
  const run = () => {
    const result = buildSubnetPlan(baseInput, Number(originalPrefix), mode, Number(targetValue));
    setPlan(result.plan);
    setError(result.error ?? '');
  };
  const sortedRows = useMemo(() => {
    if (!plan) return [];
    return [...plan.rows].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true });
      return ascending ? comparison : -comparison;
    });
  }, [ascending, plan, sortKey]);
  const rowText = (row: SubnetRow) => `${row.number}\t${row.network}/${row.prefix}\t${row.first}\t${row.last}\t${row.broadcast}\t${row.mask}\t${row.hosts}`;
  const tableText = plan ? [['Subnet', 'CIDR', 'First usable', 'Last usable', 'Broadcast', 'Subnet mask', 'Usable hosts'], ...plan.rows.map((row) => rowText(row).split('\t'))].map((row) => row.join('\t')).join('\n') : '';
  const modeLabel = mode === 'prefix' ? 'Target subnet prefix' : mode === 'subnets' ? 'Number of subnets' : 'Usable hosts per subnet';
  const className = plan?.base.prefix !== undefined && plan.base.prefix <= 7 ? 'Class A Network' : plan?.base.prefix !== undefined && plan.base.prefix <= 15 ? 'Class B Network' : 'Class C Network';
  return <><PageHeader compact eyebrow="Network / 01" title="CIDR Calculator" description="Split an IPv4 network into precise, copy-ready subnets." action={<span className="hidden rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary sm:inline">IPv4 / CIDR</span>} />
    <section className="mb-3 rounded-md border border-border bg-card p-3 md:p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_115px_175px_auto] md:items-end">
        <Field label="Base IPv4 network or address" value={baseInput} onChange={setBaseInput} placeholder="192.168.10.0 or 192.168.10.0/24" />
        <Field label="Original prefix" value={originalPrefix} onChange={setOriginalPrefix} type="number" min={0} max={32} />
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Split by</span><select value={mode} onChange={(event) => setMode(event.target.value as SubnetMode)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-xs text-foreground outline-none focus:border-primary"><option value="prefix">Target prefix</option><option value="subnets">Number of subnets</option><option value="hosts">Usable hosts</option></select></label>
        <Field label={modeLabel} value={targetValue} onChange={setTargetValue} type="number" min={1} max={32} className="md:col-start-3 md:row-start-2" />
        <Button onClick={run} className="h-10 min-w-[105px] md:col-start-4 md:row-start-2" data-testid="button-calculate-cidr"><Calculator size={13} /> Calculate</Button>
      </div>
      {error && <div className="mt-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive" role="alert">{error}</div>}
    </section>
    {plan ? <div className="space-y-3">
      <section className="rounded-md border border-border bg-card p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between"><SectionTitle detail={`${plan.base.network}/${plan.base.prefix}`}>Subnet Plan</SectionTitle><span className="font-mono text-[10px] text-muted-foreground">{plan.generated.toLocaleString()} generated</span></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Original network', `${plan.base.network}/${plan.base.prefix}`],
            ['Subnet mask', plan.base.mask],
            ['Wildcard mask', plan.base.wildcard],
            ['Total addresses', plan.base.total.toLocaleString()],
            ['Usable hosts', plan.base.hosts.toLocaleString()],
            ['New prefix', `/${plan.targetPrefix}`],
            ['Address increment', plan.increment.toLocaleString()],
            ['Generated subnets', plan.generated.toLocaleString()],
          ].map(([label, value]) => <div key={label} className="rounded border border-border bg-background/35 p-2.5"><div className="text-[9px] text-muted-foreground">{label}</div><div className="mt-1 break-all font-mono text-[11px] text-foreground">{value}</div></div>)}
        </div>
        <div className="mt-4 rounded border border-border bg-background/35 p-3">
          <div className="mb-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>Address space · {className}</span><span>{plan.base.network} → {plan.base.broadcast}</span></div>
          <div className="flex h-7 overflow-hidden rounded border border-border bg-secondary" aria-label={`Address space split into ${plan.generated} subnets`}>{plan.rows.slice(0, 64).map((row) => <span key={row.number} title={`Subnet ${row.number}: ${row.network}/${row.prefix}`} className={`h-full border-r border-background/70 ${row.number % 2 === 0 ? 'bg-primary/70' : 'bg-primary/35'}`} style={{ width: `${100 / Math.min(plan.generated, 64)}%` }} />)}</div>
          {plan.generated > 64 && <p className="mt-2 text-[9px] text-muted-foreground">Showing the first 64 segments visually; the table contains all {plan.generated.toLocaleString()} generated subnets.</p>}
        </div>
      </section>
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3 md:px-4"><SectionTitle detail="sortable results">Generated Subnets</SectionTitle><div className="flex gap-1"><CopyButton value={tableText} label="Copy table" /><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => downloadText('netkit-subnets.tsv', tableText, 'text/tab-separated-values')}><Download size={13} />Export</Button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[10px]"><thead className="border-b border-border bg-secondary/40 font-mono uppercase tracking-wider text-muted-foreground"><tr>{[['number', '#'], ['network', 'Network / CIDR'], ['first', 'First usable'], ['last', 'Last usable'], ['broadcast', 'Broadcast'], ['mask', 'Subnet mask'], ['hosts', 'Usable hosts']].map(([key, label]) => <th key={key} className="px-3 py-2 font-medium"><button type="button" onClick={() => { const nextKey = key as keyof SubnetRow; if (sortKey === nextKey) setAscending((current) => !current); else { setSortKey(nextKey); setAscending(true); } }} className="inline-flex items-center gap-1 hover:text-primary">{label}{sortKey === key && <span>{ascending ? '↑' : '↓'}</span>}</button></th>)}</tr></thead><tbody>{sortedRows.map((row) => <tr key={row.number} className="border-b border-border/70 last:border-0 hover:bg-secondary/35"><td className="px-3 py-2 font-mono text-muted-foreground">{row.number}</td><td className="px-3 py-2 font-mono text-primary">{row.network}/{row.prefix}</td><td className="px-3 py-2 font-mono">{row.first}</td><td className="px-3 py-2 font-mono">{row.last}</td><td className="px-3 py-2 font-mono">{row.broadcast}</td><td className="px-3 py-2 font-mono">{row.mask}</td><td className="px-3 py-2 font-mono text-accent">{row.hosts.toLocaleString()}</td></tr>)}</tbody></table></div>
      </section>
    </div> : <EmptyState icon={Calculator} title="Enter a valid subnet plan" text="Choose a target prefix, subnet count, or host requirement to generate deterministic subnet rows." />}</>;
}

function ResultCard({ label, value, accent = 'default' }: { label: string; value: string; accent?: 'default' | 'cyan' | 'lime' }) {
  return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span><CopyButton value={value} /></div><div data-testid={`text-result-${label.replace(/\s+/g, '-').toLowerCase()}`} className={`mt-4 font-mono text-xl ${accent === 'cyan' ? 'text-primary' : accent === 'lime' ? 'text-accent' : 'text-foreground'}`}>{value}</div></div>;
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="flex min-h-[230px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/60 p-8 text-center"><Icon size={25} className="mb-3 text-muted-foreground" /><div className="text-sm font-semibold">{title}</div><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{text}</p></div>;
}

function IpToolsPage() {
  const [ip, setIp] = useState('192.168.10.1');
  const [convertedIp, setConvertedIp] = useState('192.168.10.1');
  const [activeTab, setActiveTab] = useState('IP Converter');
  const [additional, setAdditional] = useState<Record<string, string>>({ 'IP to Binary': '', 'IP to Decimal': '', 'IP to Hex': '', 'Validate IP': '' });
  const valid = parseIp(convertedIp) !== null;
  const parsed = valid ? parseIp(convertedIp) as number : 0;
  const conversionValues = valid ? [
    ['Decimal', String(parsed >>> 0)],
    ['Binary', binaryIp(convertedIp)],
    ['Hexadecimal', hexIp(convertedIp)],
  ] : [];
  const tabs = ['IP Converter', 'IP Validator', 'IP Range', 'Binary / Decimal', 'MAC Address'];
  const runAdditional = (tool: string) => {
    const value = additional[tool] ?? '';
    const number = parseIp(value);
    let output = 'Enter a valid IPv4 address.';
    if (number !== null) output = tool === 'IP to Binary' ? binaryIp(value) : tool === 'IP to Decimal' ? String(number >>> 0) : tool === 'IP to Hex' ? hexIp(value) : 'Valid IPv4 address';
    setAdditional((current) => ({ ...current, [`${tool}-result`]: output }));
  };
  return <><PageHeader compact eyebrow="Network / 02" title="IP Tools" description="Convert, validate and analyze IP addresses." action={<span className="hidden rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary sm:inline">IPv4</span>} />
    <div className="mb-3 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} disabled={tab !== 'IP Converter'} data-testid={`tab-ip-${tab.toLowerCase().replace(/[^a-z]+/g, '-')}`} className={`shrink-0 border-b-2 px-3 py-2 text-[10px] font-medium transition ${activeTab === tab ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:text-slate-200'} disabled:cursor-default`}>{tab}{tab !== 'IP Converter' && <span className="ml-1 text-[8px] text-muted-foreground/60">soon</span>}</button>)}
    </div>
    <section className="rounded-md border border-border bg-card p-3 md:p-4">
      <SectionTitle detail="convert between formats">IP Converter</SectionTitle>
      <div className="mb-3 flex gap-1 rounded border border-border bg-background/45 p-1 sm:w-[150px]">
        <button type="button" className="flex-1 rounded bg-primary/15 px-3 py-1.5 text-[10px] font-semibold text-primary">IPv4</button>
        <button type="button" disabled className="flex-1 rounded px-3 py-1.5 text-[10px] text-muted-foreground/50" title="IPv6 conversion is coming soon">IPv6</button>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Field label="Enter IPv4 address" value={ip} onChange={setIp} placeholder="192.168.10.1" />
        <Button onClick={() => setConvertedIp(ip)} className="h-10 min-w-[100px]" data-testid="button-convert-ip"><RefreshCw size={13} /> Convert</Button>
      </div>
      {parseIp(ip) === null && <div className="mt-2 text-[11px] text-destructive">IPv4 octets must be numeric values from 0 to 255.</div>}
      <div className="mt-4 grid gap-2 border-t border-border pt-3 md:grid-cols-3">
        {conversionValues.map(([label, value], index) => <div key={label} className="rounded border border-border bg-background/45 p-3"><div className="text-[9px] text-muted-foreground">{label}</div><div data-testid={`text-ip-${label.toLowerCase()}`} className={`mt-2 break-all font-mono text-[11px] ${index === 0 ? 'text-slate-200' : index === 1 ? 'text-primary' : 'text-accent'}`}>{value}</div></div>)}
      </div>
    </section>
    <section className="mt-3">
      <SectionTitle detail="quick utilities">Additional Tools</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {['IP to Binary', 'IP to Decimal', 'IP to Hex', 'Validate IP'].map((tool, index) => {
          const value = additional[tool] ?? '';
          const output = additional[`${tool}-result`];
          return <div key={tool} className="rounded-md border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded border ${index === 0 ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : index === 1 ? 'border-violet-400/30 bg-violet-500/15 text-violet-300' : index === 2 ? 'border-orange-400/30 bg-orange-500/15 text-orange-300' : 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300'}`}><Binary size={13} /></span><span className="text-[11px] font-semibold">{tool}</span></div><span className="font-mono text-[8px] text-muted-foreground">LOCAL</span></div>
            <p className="mb-2 text-[9px] text-muted-foreground">{tool === 'Validate IP' ? 'Check if an IP address is valid (IPv4).' : `Convert an IPv4 address to ${tool.replace('IP to ', '').toLowerCase()}.`}</p>
            <div className="flex gap-1.5"><input aria-label={`${tool} address`} data-testid={`input-${tool.toLowerCase().replace(/\s+/g, '-')}`} value={value} onChange={(event) => setAdditional((current) => ({ ...current, [tool]: event.target.value }))} placeholder="Enter IP address" className="h-8 min-w-0 flex-1 rounded border border-input bg-background/60 px-2 text-[10px] font-mono outline-none focus:border-primary" /><Button onClick={() => runAdditional(tool)} className="h-8 px-2 text-[9px]" data-testid={`button-${tool.toLowerCase().replace(/\s+/g, '-')}`}><RefreshCw size={11} />{tool === 'Validate IP' ? 'Validate' : 'Convert'}</Button></div>
            <div className="mt-2 flex min-h-7 items-center justify-between gap-2 rounded border border-border bg-background/55 px-2 py-1.5 font-mono text-[9px] text-muted-foreground"><span className="truncate">{output ?? 'Result will appear here...'}</span>{output && output !== 'Enter a valid IPv4 address.' && <CopyButton value={output} label="" />}</div>
          </div>;
        })}
      </div>
    </section>
  </>;
}

function VlanPage() {
  const [rows, setRows] = useState<VlanPlanRow[]>(() => {
    try {
      const stored = localStorage.getItem('netkit-vlan-plan');
      return stored ? JSON.parse(stored) as VlanPlanRow[] : [];
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vlanId, setVlanId] = useState('120');
  const [name, setName] = useState('EDGE_USERS');
  const [description, setDescription] = useState('User access segment');
  const [purpose, setPurpose] = useState('User access');
  const [network, setNetwork] = useState('10.120.0.0/24');
  const [mode, setMode] = useState<'prefix' | 'hosts'>('hosts');
  const [target, setTarget] = useState('50');
  const [gateway, setGateway] = useState('');
  const [formError, setFormError] = useState('');
  const calculation = useMemo(() => calculateVlanSubnet(network, mode, Number(target)), [mode, network, target]);
  const subnet = calculation.subnet;
  const duplicateIds = useMemo(() => {
    const counts = rows.reduce<Record<number, number>>((acc, row) => ({ ...acc, [row.id]: (acc[row.id] ?? 0) + 1 }), {});
    return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([id]) => Number(id)));
  }, [rows]);
  const overlapIds = useMemo(() => {
    const conflicts = new Set<number>();
    for (let index = 0; index < rows.length; index += 1) {
      for (let other = index + 1; other < rows.length; other += 1) {
        const firstStart = parseIp(rows[index].subnet.network) as number;
        const firstEnd = parseIp(rows[index].subnet.broadcast) as number;
        const secondStart = parseIp(rows[other].subnet.network) as number;
        const secondEnd = parseIp(rows[other].subnet.broadcast) as number;
        if (Math.max(firstStart, secondStart) <= Math.min(firstEnd, secondEnd)) {
          conflicts.add(rows[index].id);
          conflicts.add(rows[other].id);
        }
      }
    }
    return conflicts;
  }, [rows]);
  useEffect(() => {
    localStorage.setItem('netkit-vlan-plan', JSON.stringify(rows));
  }, [rows]);
  const clearForm = () => {
    setEditingId(null);
    setVlanId(String(Math.max(1, ...rows.map((row) => row.id + 1))));
    setName('');
    setDescription('');
    setPurpose('');
    setNetwork('10.120.0.0/24');
    setMode('hosts');
    setTarget('50');
    setGateway('');
    setFormError('');
  };
  const save = () => {
    const id = Number(vlanId);
    const range = vlanRangeClass(id);
    if (range === 'Invalid') return setFormError('VLAN IDs must be whole numbers from 1 through 4094. VLAN 0 and 4095 are reserved.');
    if (!name.trim()) return setFormError('Give this VLAN a name before adding it to the plan.');
    if (!subnet) return setFormError(calculation.error ?? 'Fix the subnet configuration before saving.');
    if (rows.some((row) => row.id === id && row.id !== editingId)) return setFormError(`VLAN ${id} is already in this plan. Choose a unique ID.`);
    const parsedGateway = gateway.trim() ? parseIp(gateway) : parseIp(subnet.first);
    const subnetStart = parseIp(subnet.network) as number;
    const subnetEnd = parseIp(subnet.broadcast) as number;
    if (parsedGateway === null || parsedGateway < subnetStart || parsedGateway > subnetEnd) return setFormError('The gateway must be a valid IPv4 address inside the calculated subnet.');
    const next: VlanPlanRow = {
      id, name: name.trim(), description: description.trim(), purpose: purpose.trim() || 'Unspecified',
      network: `${subnet.network}/${subnet.prefix}`, gateway: formatIp(parsedGateway),
      hostRequirement: mode === 'hosts' ? Number(target) : subnet.hosts, subnet, extended: range === 'Extended',
    };
    setRows((current) => editingId === null ? [next, ...current] : current.map((row) => row.id === editingId ? next : row));
    clearForm();
  };
  const edit = (row: VlanPlanRow) => {
    setEditingId(row.id);
    setVlanId(String(row.id)); setName(row.name); setDescription(row.description); setPurpose(row.purpose);
    setNetwork(row.network); setMode('prefix'); setTarget(String(row.subnet.prefix)); setGateway(row.gateway); setFormError('');
  };
  const duplicate = (row: VlanPlanRow) => {
    setEditingId(null); setVlanId(String(row.id)); setName(`${row.name}_COPY`); setDescription(row.description); setPurpose(row.purpose);
    setNetwork(row.network); setMode('prefix'); setTarget(String(row.subnet.prefix)); setGateway(row.gateway); setFormError('Change the VLAN ID before adding this duplicate.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const remove = (id: number) => {
    if (window.confirm(`Remove VLAN ${id} from this local plan?`)) setRows((current) => current.filter((row) => row.id !== id));
  };
  const reset = () => {
    if (rows.length && window.confirm('Clear every VLAN from this local plan?')) setRows([]);
  };
  const exportPlan = () => {
    const text = ['VLAN ID\tName\tRange\tPurpose\tNetwork\tGateway\tHost requirement\tUsable hosts\tStatus', ...rows.map((row) => `${row.id}\t${row.name}\t${row.extended ? 'Extended' : 'Normal'}\t${row.purpose}\t${row.network}\t${row.gateway}\t${row.hostRequirement}\t${row.subnet.hosts}\t${duplicateIds.has(row.id) || overlapIds.has(row.id) ? 'Conflict' : 'OK'}`)].join('\n');
    downloadText('netkit-vlan-plan.tsv', text, 'text/tab-separated-values');
  };
  const conflictCount = new Set([...duplicateIds, ...overlapIds]).size;
  return <><PageHeader eyebrow="Planning / 05" title="VLAN calculator" description="Calculate VLAN subnets and keep a conflict-aware local plan for the segments in your network." action={<div className="flex gap-1"><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={exportPlan} disabled={!rows.length}><Download size={13} /> Export</Button><Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={reset} disabled={!rows.length}><RotateCcw size={13} /> Reset</Button></div>} />
    <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
      <section className="rounded-md border border-border bg-card p-4">
        <SectionTitle detail={editingId === null ? 'new segment' : `editing VLAN ${editingId}`}>VLAN definition</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="VLAN ID" value={vlanId} onChange={setVlanId} type="number" min={1} max={4094} /><Field label="VLAN name" value={name} onChange={setName} placeholder="EDGE_USERS" /><Field label="Description" value={description} onChange={setDescription} placeholder="User access segment" /><Field label="Purpose" value={purpose} onChange={setPurpose} placeholder="User access" /></div>
        <div className="mt-3"><Field label="Parent network / CIDR" value={network} onChange={setNetwork} placeholder="10.120.0.0/24" /></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Plan by</span><select value={mode} onChange={(event) => setMode(event.target.value as 'prefix' | 'hosts')} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary"><option value="hosts">Usable host target</option><option value="prefix">Target CIDR prefix</option></select></label>
          <Field label={mode === 'hosts' ? 'Desired usable hosts' : 'Target prefix'} value={target} onChange={setTarget} type="number" min={mode === 'hosts' ? 1 : 0} max={mode === 'hosts' ? 4294967294 : 32} />
        </div>
        <div className="mt-3"><Field label="Gateway (optional)" value={gateway} onChange={setGateway} placeholder="Uses first usable address" /></div>
        {calculation.error && <div className="mt-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[10px] leading-4 text-destructive" role="alert">{calculation.error}</div>}
        {formError && <div className="mt-3 rounded border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-[10px] leading-4 text-amber-200" role="alert">{formError}</div>}
        <div className="mt-4 flex gap-2"><Button onClick={save} className="flex-1" data-testid="button-add-vlan"><Plus size={14} /> {editingId === null ? 'Add to plan' : 'Save changes'}</Button>{editingId !== null && <Button variant="secondary" onClick={clearForm}>Cancel</Button>}</div>
        <div className="mt-4 border-t border-border pt-3 text-[10px] leading-4 text-muted-foreground"><span className="font-mono text-primary">802.1Q ID RANGE</span><br />1–1005 normal VLAN IDs · 1006–4094 extended VLAN IDs · 0 and 4095 reserved.</div>
      </section>
      <section className="space-y-3">
        {subnet ? <div className="rounded-md border border-primary/25 bg-primary/5 p-4"><div className="mb-3 flex items-center justify-between"><SectionTitle detail={vlanRangeClass(Number(vlanId))}>{name || 'Calculated segment'}</SectionTitle><span className="font-mono text-xs text-primary">VLAN {vlanId || '—'}</span></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{[['Network', `${subnet.network}/${subnet.prefix}`], ['Subnet mask', subnet.mask], ['Wildcard', subnet.wildcard], ['Address range', `${subnet.first} – ${subnet.last}`], ['Broadcast', subnet.broadcast], ['Total addresses', subnet.total.toLocaleString()], ['Usable hosts', subnet.hosts.toLocaleString()], ['Gateway', gateway || subnet.first]].map(([label, value]) => <div key={label} className="rounded border border-border bg-card/70 p-2.5"><div className="text-[9px] text-muted-foreground">{label}</div><div className="mt-1 break-words font-mono text-[10px] text-foreground">{value}</div></div>)}</div><div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{mode === 'hosts' ? `${subnet.hosts - Number(target)} usable addresses remain after the requested host target.` : 'Calculated directly from the target prefix.'}</div></div> : <EmptyState icon={Network} title="Waiting for a valid VLAN subnet" text="Enter a parent network and a subnet target to preview the segment details." />}
        <div className="rounded-md border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><SectionTitle detail={`${rows.length} saved locally`}>VLAN plan</SectionTitle>{conflictCount > 0 && <span className="rounded border border-amber-300/30 bg-amber-500/10 px-2 py-1 font-mono text-[9px] text-amber-200">{conflictCount} conflict{conflictCount === 1 ? '' : 's'}</span>}</div>{conflictCount > 0 && <div className="mb-3 rounded border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">Review highlighted rows for duplicate VLAN IDs or overlapping subnet assignments before exporting.</div>}{rows.length === 0 ? <EmptyState icon={Network} title="No VLANs in this plan" text="Add a VLAN definition to start a browser-local network plan." /> : <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-[10px]"><thead className="border-b border-border bg-secondary/40 font-mono uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 font-medium">ID</th><th className="px-3 py-2 font-medium">Name / purpose</th><th className="px-3 py-2 font-medium">Network</th><th className="px-3 py-2 font-medium">Gateway</th><th className="px-3 py-2 font-medium">Hosts</th><th className="px-3 py-2 font-medium">Actions</th></tr></thead><tbody>{rows.map((row) => { const conflict = duplicateIds.has(row.id) || overlapIds.has(row.id); return <tr key={`${row.id}-${row.network}`} data-testid={`row-vlan-${row.id}`} className={`border-b border-border/70 last:border-0 ${conflict ? 'bg-amber-500/5' : 'hover:bg-secondary/35'}`}><td className="px-3 py-2.5 align-top"><div className={`font-mono text-sm ${conflict ? 'text-amber-200' : 'text-primary'}`}>{row.id}</div><div className="mt-1 font-mono text-[8px] text-muted-foreground">{row.extended ? 'EXTENDED' : 'NORMAL'}</div></td><td className="px-3 py-2.5 align-top"><div className="font-semibold text-foreground">{row.name}</div><div className="mt-1 text-[9px] text-muted-foreground">{row.purpose} · {row.description || 'No description'}</div>{duplicateIds.has(row.id) && <div className="mt-1 text-[9px] text-amber-200">Duplicate VLAN ID</div>}{overlapIds.has(row.id) && <div className="mt-1 text-[9px] text-amber-200">Overlapping subnet</div>}</td><td className="px-3 py-2.5 font-mono text-primary">{row.network}<div className="mt-1 text-[9px] text-muted-foreground">{row.subnet.mask}</div></td><td className="px-3 py-2.5 font-mono">{row.gateway}</td><td className="px-3 py-2.5 font-mono text-accent">{row.subnet.hosts.toLocaleString()}<div className="mt-1 text-[9px] text-muted-foreground">target {row.hostRequirement.toLocaleString()}</div></td><td className="px-3 py-2.5"><div className="flex gap-1"><Button variant="ghost" className="px-2 py-1 text-[10px]" onClick={() => edit(row)} aria-label={`Edit VLAN ${row.id}`}><Pencil size={12} /></Button><Button variant="ghost" className="px-2 py-1 text-[10px]" onClick={() => duplicate(row)} aria-label={`Duplicate VLAN ${row.id}`}><Copy size={12} /></Button><Button variant="ghost" className="px-2 py-1 text-[10px]" onClick={() => remove(row.id)} aria-label={`Delete VLAN ${row.id}`}><Trash2 size={12} className="text-destructive" /></Button></div></td></tr>; })}</tbody></table></div>}</div>
      </section>
    </div>
  </>;
}

function RangePage() {
  const [input, setInput] = useState('10.0.0.0/24\n10.0.0.128/25');
  const analysis = useMemo(() => {
    const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed = lines.map((line) => parseRangeValue(line));
    const errors = parsed.flatMap((item) => item.error ? [item.error] : []);
    const ranges = parsed.flatMap((item) => item.range ? [item.range] : []);
    const comparisons: RangeRelation[] = [];
    for (let index = 0; index < ranges.length; index += 1) {
      for (let other = index + 1; other < ranges.length; other += 1) comparisons.push(compareRanges(ranges[index], ranges[other]));
    }
    return { ranges, errors, comparisons };
  }, [input]);
  const primaryStatus = analysis.ranges.length < 2
    ? 'Add at least two ranges'
    : analysis.comparisons.some((item) => item.status === 'Identical Ranges') ? 'Identical Ranges'
      : analysis.comparisons.some((item) => item.status === 'Range A Contains Range B' || item.status === 'Range B Contains Range A') ? 'Contained Range'
        : analysis.comparisons.some((item) => item.status === 'Partial Overlap') ? 'Partial Overlap'
          : analysis.comparisons.some((item) => item.status === 'Touching Ranges') ? 'Touching Ranges' : 'No Overlap';
  const primaryExplanation = analysis.ranges.length < 2
    ? 'Enter one address, CIDR network, or explicit range per line.'
    : analysis.errors.length > 0 ? 'Fix the highlighted inputs before trusting the comparison.'
      : `${analysis.comparisons.filter((item) => item.overlapStart !== null).length} of ${analysis.comparisons.length} range pairs share addresses or contain one another.`;
  const statusClass = primaryStatus === 'No Overlap' ? 'border-accent/30 bg-accent/10 text-accent' : primaryStatus === 'Add at least two ranges' ? 'border-border bg-background/35 text-muted-foreground' : 'border-primary/30 bg-primary/10 text-primary';
  const minAddress = analysis.ranges.length ? Math.min(...analysis.ranges.map((range) => range.start)) : 0;
  const maxAddress = analysis.ranges.length ? Math.max(...analysis.ranges.map((range) => range.end)) : 1;
  const addressSpan = Math.max(1, maxAddress - minAddress + 1);
  const comparisonText = analysis.comparisons.map((item) => {
    const overlap = item.overlapStart !== null && item.overlapEnd !== null ? `\t${formatIp(item.overlapStart)}-${formatIp(item.overlapEnd)}\t${(item.overlapEnd - item.overlapStart + 1).toLocaleString()}` : '\t—\t0';
    return `${item.a.source}\t${item.b.source}\t${item.status}${overlap}`;
  });
  const exportText = ['Range A\tRange B\tRelationship\tOverlap range\tOverlap addresses', ...comparisonText].join('\n');
  return <><PageHeader eyebrow="Network math / 04" title="IP range / overlap checker" description="Normalize CIDR networks and explicit ranges, then find overlap, containment, adjacency, and conflicts." />
    <section className="mb-3 rounded-md border border-border bg-card p-3 md:p-4">
      <div className="mb-2 flex items-center justify-between"><SectionTitle detail="one input per line">Ranges to compare</SectionTitle><span className="font-mono text-[9px] text-muted-foreground">IPv4 only</span></div>
      <textarea aria-label="Ranges to compare" data-testid="input-range-list" value={input} onChange={(event) => setInput(event.target.value)} placeholder={'10.0.0.0/24\n10.0.0.128/25\n10.0.1.10-10.0.1.30'} className="min-h-[112px] w-full resize-y rounded-md border border-input bg-background/70 p-3 font-mono text-xs leading-6 text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" />
      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Accepted formats: single IPv4 addresses, CIDR networks such as 10.0.0.0/24, and explicit ranges such as 10.0.0.10-10.0.0.50.</p>
      {analysis.errors.length > 0 && <div className="mt-3 space-y-1 rounded border border-destructive/30 bg-destructive/10 p-3 text-[10px] text-destructive" role="alert">{analysis.errors.map((message) => <div key={message} className="flex gap-2"><X size={13} className="shrink-0" />{message}</div>)}</div>}
    </section>
    <div className={`mb-3 rounded-md border p-4 ${statusClass}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-75">Comparison result</div><div className="mt-1 text-xl font-semibold">{primaryStatus}</div><p className="mt-1 text-xs opacity-80">{primaryExplanation}</p></div><div className="flex gap-1"><CopyButton value={exportText} label="Copy report" /><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => downloadText('netkit-range-report.tsv', exportText, 'text/tab-separated-values')}><Download size={13} />Export</Button></div></div></div>
    {analysis.ranges.length > 0 && <section className="mb-3 rounded-md border border-border bg-card p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between"><SectionTitle detail={`${analysis.ranges.length} normalized`}>Address Space</SectionTitle><span className="font-mono text-[9px] text-muted-foreground">{formatIp(minAddress)} → {formatIp(maxAddress)}</span></div>
      <div className="space-y-2">{analysis.ranges.map((range, index) => { const left = ((range.start - minAddress) / addressSpan) * 100; const width = Math.max(1.2, ((range.end - range.start + 1) / addressSpan) * 100); return <div key={`${range.source}-${index}`}><div className="mb-1 flex items-center justify-between gap-2 text-[9px]"><span className="truncate font-mono text-muted-foreground">{range.source}</span><span className="font-mono text-primary">{range.startIp} → {range.endIp}</span></div><div className="relative h-5 rounded border border-border bg-secondary"><span className={`absolute top-0.5 h-[17px] rounded ${index % 2 === 0 ? 'bg-primary/75' : 'bg-accent/70'}`} style={{ left: `${left}%`, width: `${Math.min(100 - left, width)}%` }} /></div></div>; })}</div>
    </section>}
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border px-3 py-3 md:px-4"><SectionTitle detail="normalized inputs">Ranges</SectionTitle></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[10px]"><thead className="border-b border-border bg-secondary/40 font-mono uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Input</th><th className="px-3 py-2 font-medium">Start</th><th className="px-3 py-2 font-medium">End</th><th className="px-3 py-2 font-medium">CIDR</th><th className="px-3 py-2 font-medium">Subnet mask</th><th className="px-3 py-2 font-medium">Addresses</th></tr></thead><tbody>{analysis.ranges.map((range, index) => <tr key={`${range.source}-${index}`} className="border-b border-border/70 last:border-0"><td className="max-w-[180px] truncate px-3 py-2 font-mono text-primary">{range.source}</td><td className="px-3 py-2 font-mono">{range.startIp}</td><td className="px-3 py-2 font-mono">{range.endIp}</td><td className="px-3 py-2 font-mono">{range.cidr}</td><td className="px-3 py-2 font-mono">{range.mask}</td><td className="px-3 py-2 font-mono text-accent">{range.total.toLocaleString()}</td></tr>)}</tbody></table></div>
    </section>
    <section className="mt-3 overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border px-3 py-3 md:px-4"><SectionTitle detail={`${analysis.comparisons.length} pair${analysis.comparisons.length === 1 ? '' : 's'}`}>Relationships</SectionTitle></div>
      {analysis.comparisons.length === 0 ? <div className="p-6 text-center text-xs text-muted-foreground">Add at least two valid inputs to compare ranges.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[10px]"><thead className="border-b border-border bg-secondary/40 font-mono uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Range A</th><th className="px-3 py-2 font-medium">Range B</th><th className="px-3 py-2 font-medium">Relationship</th><th className="px-3 py-2 font-medium">Exact overlap</th><th className="px-3 py-2 font-medium">Addresses</th></tr></thead><tbody>{analysis.comparisons.map((item) => <tr key={`${item.a.source}-${item.b.source}`} className="border-b border-border/70 last:border-0"><td className="max-w-[190px] truncate px-3 py-2 font-mono">{item.a.source}</td><td className="max-w-[190px] truncate px-3 py-2 font-mono">{item.b.source}</td><td className={`px-3 py-2 font-semibold ${item.status === 'No Overlap' ? 'text-accent' : item.status === 'Touching Ranges' ? 'text-muted-foreground' : 'text-primary'}`}>{item.status}<div className="mt-0.5 font-normal text-muted-foreground">{item.explanation}</div></td><td className="px-3 py-2 font-mono">{item.overlapStart !== null && item.overlapEnd !== null ? `${formatIp(item.overlapStart)}-${formatIp(item.overlapEnd)}` : '—'}</td><td className="px-3 py-2 font-mono text-accent">{item.overlapStart !== null && item.overlapEnd !== null ? (item.overlapEnd - item.overlapStart + 1).toLocaleString() : '0'}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}

const ports: PortEntry[] = [
  { port: 20, protocol: 'TCP', service: 'FTP data', transport: 'Connection-oriented', description: 'File Transfer Protocol data channel.', usage: 'Active-mode file transfers', notes: 'Uses port 21 for control; passive FTP may use a negotiated data range.', category: 'File transfer' },
  { port: 21, protocol: 'TCP', service: 'FTP control', transport: 'Connection-oriented', description: 'File Transfer Protocol command channel.', usage: 'Legacy file transfer', notes: 'Credentials and data are not encrypted by FTP itself.', category: 'File transfer' },
  { port: 22, protocol: 'TCP', service: 'SSH', transport: 'Connection-oriented', description: 'Secure Shell remote access and tunneling.', usage: 'Device administration, SCP, SFTP', notes: 'The port number alone does not prove that SSH is running.', category: 'Remote access' },
  { port: 23, protocol: 'TCP', service: 'Telnet', transport: 'Connection-oriented', description: 'Legacy remote terminal protocol.', usage: 'Legacy device access', notes: 'Unencrypted; prefer SSH wherever possible.', category: 'Remote access' },
  { port: 25, protocol: 'TCP', service: 'SMTP', transport: 'Connection-oriented', description: 'Simple Mail Transfer Protocol server-to-server delivery.', usage: 'Mail transfer', notes: 'Authenticated message submission commonly uses 587 instead.', category: 'Email' },
  { port: 53, protocol: 'TCP/UDP', service: 'DNS', transport: 'Both', description: 'Domain Name System queries and responses.', usage: 'Name resolution', notes: 'UDP is common; TCP is used for zone transfers and large responses.', category: 'DNS' },
  { port: 67, protocol: 'UDP', service: 'DHCP server', transport: 'Datagram', description: 'Dynamic Host Configuration Protocol server endpoint.', usage: 'Address assignment', notes: 'The client endpoint is port 68.', category: 'Network management' },
  { port: 68, protocol: 'UDP', service: 'DHCP client', transport: 'Datagram', description: 'Dynamic Host Configuration Protocol client endpoint.', usage: 'Address assignment', notes: 'The server endpoint is port 67.', category: 'Network management' },
  { port: 69, protocol: 'UDP', service: 'TFTP', transport: 'Datagram', description: 'Trivial File Transfer Protocol.', usage: 'Firmware and boot files', notes: 'No built-in authentication or encryption.', category: 'File transfer' },
  { port: 80, protocol: 'TCP', service: 'HTTP', transport: 'Connection-oriented', description: 'Hypertext Transfer Protocol for web traffic.', usage: 'Unencrypted web services', notes: 'Redirect or protect application traffic with HTTPS when possible.', category: 'Web' },
  { port: 110, protocol: 'TCP', service: 'POP3', transport: 'Connection-oriented', description: 'Post Office Protocol version 3 mailbox retrieval.', usage: 'Email retrieval', notes: 'TLS-enabled POP3 commonly uses port 995.', category: 'Email' },
  { port: 123, protocol: 'UDP', service: 'NTP', transport: 'Datagram', description: 'Network Time Protocol synchronization.', usage: 'Clock synchronization', notes: 'Accurate time is important for logs, certificates, and authentication.', category: 'Network management' },
  { port: 143, protocol: 'TCP', service: 'IMAP', transport: 'Connection-oriented', description: 'Internet Message Access Protocol mailbox access.', usage: 'Email retrieval and sync', notes: 'TLS-enabled IMAP commonly uses port 993.', category: 'Email' },
  { port: 161, protocol: 'UDP', service: 'SNMP', transport: 'Datagram', description: 'Simple Network Management Protocol queries.', usage: 'Monitoring and inventory', notes: 'Prefer SNMPv3 for authenticated and private management.', category: 'Monitoring' },
  { port: 162, protocol: 'UDP', service: 'SNMP traps', transport: 'Datagram', description: 'Asynchronous SNMP notifications.', usage: 'Monitoring alerts', notes: 'Trap and inform behavior depends on the SNMP manager and agent.', category: 'Monitoring' },
  { port: 389, protocol: 'TCP/UDP', service: 'LDAP', transport: 'Both', description: 'Lightweight Directory Access Protocol.', usage: 'Directory and identity services', notes: 'LDAPS commonly uses 636; StartTLS can protect 389.', category: 'Directory / auth' },
  { port: 443, protocol: 'TCP', service: 'HTTPS', transport: 'Connection-oriented', description: 'HTTP protected with TLS.', usage: 'Secure web services and APIs', notes: 'Modern HTTP/3 may use UDP 443 via QUIC.', category: 'Web' },
  { port: 445, protocol: 'TCP', service: 'SMB', transport: 'Connection-oriented', description: 'Server Message Block file and printer sharing.', usage: 'Windows file services', notes: 'Restrict exposure; do not place SMB directly on the public internet.', category: 'File transfer' },
  { port: 514, protocol: 'UDP', service: 'Syslog', transport: 'Datagram', description: 'Common syslog event transport.', usage: 'Centralized logging', notes: 'TCP or TLS syslog deployments may use different ports.', category: 'Monitoring' },
  { port: 587, protocol: 'TCP', service: 'SMTP submission', transport: 'Connection-oriented', description: 'Authenticated mail submission from clients.', usage: 'Application and user mail submission', notes: 'Typically paired with STARTTLS and authentication.', category: 'Email' },
  { port: 636, protocol: 'TCP', service: 'LDAPS', transport: 'Connection-oriented', description: 'LDAP over TLS.', usage: 'Secure directory services', notes: 'Validate the directory server certificate and hostname.', category: 'Directory / auth' },
  { port: 1433, protocol: 'TCP', service: 'Microsoft SQL Server', transport: 'Connection-oriented', description: 'Common Microsoft SQL Server listener.', usage: 'Database access', notes: 'Named instances may use dynamic or configured alternate ports.', category: 'Databases' },
  { port: 3306, protocol: 'TCP', service: 'MySQL', transport: 'Connection-oriented', description: 'Common MySQL database listener.', usage: 'Database access', notes: 'Restrict access to application or administration networks.', category: 'Databases' },
  { port: 3389, protocol: 'TCP', service: 'RDP', transport: 'Connection-oriented', description: 'Remote Desktop Protocol.', usage: 'Windows remote administration', notes: 'Use VPN or a gateway rather than exposing RDP directly.', category: 'Remote access' },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL', transport: 'Connection-oriented', description: 'Common PostgreSQL database listener.', usage: 'Database access', notes: 'Authentication and network policy still need to be configured separately.', category: 'Databases' },
  { port: 6443, protocol: 'TCP', service: 'Kubernetes API', transport: 'Connection-oriented', description: 'Common secure Kubernetes API server listener.', usage: 'Cluster control plane access', notes: 'Managed clusters and distributions may expose a different endpoint.', category: 'Network management' },
  { port: 8080, protocol: 'TCP', service: 'HTTP alternate', transport: 'Connection-oriented', description: 'Common alternate HTTP or proxy listener.', usage: 'Development servers and proxies', notes: 'Registered usage is common, not guaranteed by the port number.', category: 'Web' },
];

function PortPage() {
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState('');
  const [protocol, setProtocol] = useState<'All' | 'TCP' | 'UDP' | 'TCP/UDP'>('All');
  const [category, setCategory] = useState('All categories');
  const [sortKey, setSortKey] = useState<'port' | 'service' | 'category'>('port');
  const [ascending, setAscending] = useState(true);
  const [selectedPort, setSelectedPort] = useState(443);
  const categories = [...new Set(ports.map((item) => item.category))].sort();
  const shown = useMemo(() => {
    const search = (lookup || query).trim().toLowerCase();
    return ports.filter((item) => {
      const haystack = `${item.port} ${item.protocol} ${item.service} ${item.description} ${item.usage} ${item.notes} ${item.category}`.toLowerCase();
      return (!search || haystack.includes(search)) && (protocol === 'All' || item.protocol === protocol) && (category === 'All categories' || item.category === category);
    }).sort((a, b) => {
      const comparison = sortKey === 'port' ? a.port - b.port : sortKey === 'service' ? a.service.localeCompare(b.service) : a.category.localeCompare(b.category);
      return ascending ? comparison : -comparison;
    });
  }, [category, lookup, protocol, query, sortKey, ascending]);
  const selected = ports.find((item) => item.port === selectedPort) ?? shown[0] ?? ports[0];
  const rangeLabel = selected.port <= 1023 ? 'Well-known · 0–1023' : selected.port <= 49151 ? 'Registered · 1024–49151' : 'Dynamic / private · 49152–65535';
  const toggleSort = (key: 'port' | 'service' | 'category') => {
    if (sortKey === key) setAscending((value) => !value);
    else { setSortKey(key); setAscending(true); }
  };
  return <><PageHeader eyebrow="Reference / 06" title="Port reference" description="Search common networking services by number, protocol, category, or usage before you open a change ticket." action={<span className="hidden rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary sm:inline">LOCAL DATASET</span>} />
    <section className="mb-3 rounded-md border border-border bg-card p-3 md:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Quick lookup</span><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Quick port lookup" data-testid="input-port-lookup" value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Try 443, SSH, DNS, or remote access..." className="h-10 w-full rounded-md border border-input bg-background/70 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Search details</span><input aria-label="Search port reference" data-testid="input-port-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keywords, notes, service..." className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select aria-label="Filter by protocol" value={protocol} onChange={(event) => setProtocol(event.target.value as typeof protocol)} className="h-8 rounded border border-input bg-background/70 px-2 text-[10px] outline-none focus:border-primary"><option>All</option><option>TCP</option><option>UDP</option><option>TCP/UDP</option></select>
        <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-8 rounded border border-input bg-background/70 px-2 text-[10px] outline-none focus:border-primary"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{shown.length} of {ports.length} entries</span>
      </div>
    </section>
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-3 md:px-4"><SectionTitle detail="click a row for details">Common services</SectionTitle><span className="font-mono text-[9px] text-muted-foreground">SORT: {sortKey} {ascending ? '↑' : '↓'}</span></div>
        {shown.length === 0 ? <div className="p-8"><EmptyState icon={Search} title="No matching ports" text="Try a port number, service name, category, or protocol." /></div> : <div className="overflow-x-auto"><div className="min-w-[850px]"><div className="grid grid-cols-[70px_90px_1.1fr_1.15fr_1.3fr_44px] border-b border-border bg-secondary/40 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><button type="button" onClick={() => toggleSort('port')} className="text-left hover:text-primary">Port {sortKey === 'port' && (ascending ? '↑' : '↓')}</button><span>Protocol</span><button type="button" onClick={() => toggleSort('service')} className="text-left hover:text-primary">Service {sortKey === 'service' && (ascending ? '↑' : '↓')}</button><span>Transport</span><span>Common usage</span><span /></div>{shown.map((item) => <div key={item.port} role="button" tabIndex={0} onClick={() => setSelectedPort(item.port)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedPort(item.port); }} data-testid={`row-port-${item.service.replace(/\s+/g, '-').toLowerCase()}`} className={`grid grid-cols-[70px_90px_1.1fr_1.15fr_1.3fr_44px] items-center border-b border-border/70 px-3 py-2.5 transition last:border-0 hover:bg-secondary/35 focus:bg-primary/5 focus:outline-none ${selected.port === item.port ? 'bg-primary/5' : ''}`}><span className="font-mono text-sm text-primary">{item.port}</span><span><span className="rounded border border-border bg-secondary px-1.5 py-1 font-mono text-[9px] text-muted-foreground">{item.protocol}</span></span><span className="text-[11px] font-semibold">{item.service}</span><span className="text-[10px] text-muted-foreground">{item.transport}</span><span className="truncate text-[10px] text-muted-foreground">{item.usage}</span><CopyButton value={`${item.port}\t${item.protocol}\t${item.service}`} label="" /></div>)}</div></div>}
      </section>
      <aside className="space-y-3">
        <section className="rounded-md border border-primary/25 bg-primary/5 p-4"><div className="mb-3 flex items-center justify-between"><SectionTitle detail={rangeLabel}>{selected.service}</SectionTitle><span className="font-mono text-lg text-primary">{selected.port}</span></div><div className="space-y-3 text-[10px]"><div><div className="text-muted-foreground">Protocol / transport</div><div className="mt-1 font-mono text-foreground">{selected.protocol} · {selected.transport}</div></div><div><div className="text-muted-foreground">Description</div><div className="mt-1 leading-4 text-foreground">{selected.description}</div></div><div><div className="text-muted-foreground">Common usage</div><div className="mt-1 leading-4 text-foreground">{selected.usage}</div></div><div><div className="text-muted-foreground">Notes</div><div className="mt-1 leading-4 text-muted-foreground">{selected.notes}</div></div></div><CopyButton value={`${selected.port} ${selected.protocol} ${selected.service} — ${selected.description}`} label="Copy reference" /></section>
        <section className="rounded-md border border-border bg-card p-4"><SectionTitle detail="IANA-style ranges">Port range</SectionTitle><div className="space-y-2 text-[10px]"><div className="flex items-center justify-between border-b border-border pb-2"><span className="text-muted-foreground">Well-known</span><span className="font-mono text-foreground">0–1023</span></div><div className="flex items-center justify-between border-b border-border pb-2"><span className="text-muted-foreground">Registered</span><span className="font-mono text-foreground">1024–49151</span></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Dynamic / private</span><span className="font-mono text-foreground">49152–65535</span></div></div><p className="mt-3 text-[9px] leading-4 text-muted-foreground">A port number is only a convention. Confirm the listening process, transport, and device policy before making a change.</p></section>
      </aside>
    </div>
  </>;
}

function CommandBuilderPage() {
  const [vendor, setVendor] = useState('Cisco IOS');
  const [commandType, setCommandType] = useState('interface');
  const [interfaceName, setInterfaceName] = useState('GigabitEthernet1/0/24');
  const [vlan, setVlan] = useState('120');
  const [description, setDescription] = useState('EDGE_USERS access');
  const [ip, setIp] = useState('10.120.0.1');
  const { copied, copy } = useCopy();
  const command = useMemo(() => {
    if (commandType === 'interface') {
      if (vendor === 'Cisco IOS') return `interface ${interfaceName}\n description ${description}\n switchport mode access\n switchport access vlan ${vlan}\n spanning-tree portfast`;
      if (vendor === 'Arista EOS') return `interface ${interfaceName}\n description ${description}\n switchport mode access\n switchport access vlan ${vlan}\n spanning-tree portfast`;
      return `/interface ethernet ${interfaceName}\nset comment="${description}"\nset bridge-mode=access\nset bridge-access=${vlan}`;
    }
    if (vendor === 'Cisco IOS') return `interface Vlan${vlan}\n description ${description}\n ip address ${ip} 255.255.255.0\n no shutdown`;
    if (vendor === 'Arista EOS') return `interface Vlan${vlan}\n description ${description}\n ip address ${ip}/24\n no shutdown`;
    return `/interface vlan\nadd name=${description} vlan-id=${vlan}\n/ip address\nadd address=${ip}/24 interface=${description}`;
  }, [commandType, description, interfaceName, ip, vendor, vlan]);
  return <><PageHeader eyebrow="Reference / 06" title="Command builder" description="Generate a clean starting point for common access-port and SVI changes. Verify against your platform standards before applying." /><div className="grid gap-5 xl:grid-cols-[390px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="parameters">Change inputs</SectionTitle><div className="space-y-4"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Platform</span><select data-testid="select-command-vendor" value={vendor} onChange={(event) => setVendor(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary"><option>Cisco IOS</option><option>Arista EOS</option><option>MikroTik RouterOS</option></select></label><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Change type</span><select data-testid="select-command-type" value={commandType} onChange={(event) => setCommandType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary"><option value="interface">Access interface</option><option value="svi">SVI / gateway</option></select></label><Field label="Interface" value={interfaceName} onChange={setInterfaceName} /><Field label="VLAN ID" value={vlan} onChange={setVlan} type="number" /><Field label="Description" value={description} onChange={setDescription} />{commandType === 'svi' && <Field label="Gateway IP" value={ip} onChange={setIp} />}</div></section><section className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3"><div className="flex items-center gap-2"><Code2 size={15} className="text-primary" /><span className="font-mono text-xs text-muted-foreground">{vendor.toLowerCase().replace(' ', '-')}.conf</span></div><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => copy(command)}><Copy size={13} />{copied ? 'Copied' : 'Copy command'}</Button></div><pre data-testid="text-generated-command" className="min-h-[330px] overflow-x-auto p-5 font-mono text-sm leading-7 text-slate-300"><code>{command}</code></pre><div className="border-t border-border bg-card/35 px-4 py-3 text-[11px] text-muted-foreground">Generated locally · Review interface names and policy before deployment.</div></section></div></>;
}

function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(() => { try { const stored = localStorage.getItem('netkit-notes'); return stored ? JSON.parse(stored) as Note[] : initialNotes; } catch { return initialNotes; } });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(notes[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '', tag: '' });
  useEffect(() => { localStorage.setItem('netkit-notes', JSON.stringify(notes)); }, [notes]);
  const filtered = notes.filter((note) => `${note.title} ${note.body} ${note.tag}`.toLowerCase().includes(query.toLowerCase()));
  const active = notes.find((note) => note.id === selected) ?? null;
  const startNew = () => { setSelected(null); setDraft({ title: '', body: '', tag: 'NOTE' }); setEditing(true); };
  const startEdit = () => { if (active) { setDraft({ title: active.title, body: active.body, tag: active.tag }); setEditing(true); } };
  const save = () => { if (!draft.title.trim()) return; const next: Note = { id: selected ?? Date.now(), title: draft.title.trim(), body: draft.body.trim(), tag: draft.tag.trim() || 'NOTE', updated: 'Just now' }; setNotes((current) => selected ? current.map((note) => note.id === selected ? next : note) : [next, ...current]); setSelected(next.id); setEditing(false); };
  const remove = () => { if (!active) return; setNotes((current) => current.filter((note) => note.id !== active.id)); setSelected(null); setEditing(false); };
  return <><PageHeader eyebrow="Workspace / 07" title="Notes" description="Keep the little details that make the next network change safer. Notes are stored locally in this browser." action={<Button onClick={startNew} data-testid="button-new-note"><Plus size={15} /> New note</Button>} /><div className="grid min-h-[570px] gap-0 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[300px_1fr]"><aside className="border-b border-border bg-secondary/20 lg:border-b-0 lg:border-r"><div className="border-b border-border p-3"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-notes-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter notes..." className="h-9 w-full rounded border border-input bg-background/60 pl-8 pr-2 text-xs outline-none focus:border-primary" /></div></div><div className="max-h-[220px] overflow-y-auto p-2 lg:max-h-[500px]">{filtered.map((note) => <button key={note.id} data-testid={`button-note-${note.id}`} onClick={() => { setSelected(note.id); setEditing(false); }} className={`w-full rounded-md p-3 text-left transition ${selected === note.id ? 'bg-primary/10 ring-1 ring-primary/25' : 'hover:bg-secondary'}`}><div className="flex items-center justify-between gap-2"><span className={`font-mono text-[9px] tracking-wider ${selected === note.id ? 'text-primary' : 'text-muted-foreground'}`}>{note.tag}</span><span className="font-mono text-[9px] text-muted-foreground/70">{note.updated}</span></div><div className="mt-2 truncate text-sm font-semibold">{note.title}</div><div className="mt-1 truncate text-[11px] text-muted-foreground">{note.body}</div></button>)}</div>{filtered.length === 0 && <div className="p-5 text-center text-xs text-muted-foreground">No notes match that filter.</div>}</aside><section className="relative">{editing ? <div className="p-5 md:p-7"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-wider text-primary">{selected ? 'Edit note' : 'New note'}</div><h2 className="mt-1 text-lg font-semibold">{selected ? 'Update this note' : 'Capture a detail'}</h2></div><Button variant="ghost" onClick={() => setEditing(false)}><X size={16} /></Button></div><div className="space-y-4"><Field label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} placeholder="A useful heading" /><div className="grid gap-4 sm:grid-cols-[1fr_160px]"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Details</span><textarea data-testid="input-note-body" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Write the address, caveat or next step..." className="min-h-[190px] w-full resize-y rounded-md border border-input bg-background/70 p-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label><Field label="Tag" value={draft.tag} onChange={(value) => setDraft((current) => ({ ...current, tag: value }))} placeholder="CHANGE" /></div><div className="flex gap-2 pt-2"><Button onClick={save} data-testid="button-save-note"><Check size={15} /> Save note</Button><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button></div></div></div> : active ? <div className="p-5 md:p-7"><div className="mb-7 flex items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2"><span className="rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">{active.tag}</span><span className="font-mono text-[10px] text-muted-foreground">{active.updated}</span></div><h2 className="text-xl font-semibold">{active.title}</h2></div><div className="flex gap-1"><Button variant="ghost" onClick={startEdit} data-testid="button-edit-note"><Pencil size={15} /></Button><Button variant="ghost" onClick={remove} data-testid="button-delete-note"><Trash2 size={15} className="text-destructive" /></Button></div></div><div className="max-w-2xl whitespace-pre-wrap text-sm leading-8 text-muted-foreground">{active.body}</div><div className="mt-10 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Stored in this browser · no sync</div></div> : <EmptyState icon={FileText} title="Select a note or start fresh" text="Your notes are local by design. Nothing leaves this workspace." />}</section></div></>;
}

function ExportPage() {
  const [format, setFormat] = useState('markdown');
  const [copied, setCopied] = useState(false);
  const { text, fileName } = useMemo(() => {
    if (format === 'json') return { fileName: 'netkit-workspace.json', text: JSON.stringify({ exportedAt: new Date().toISOString(), cidr: calculateCidr('10.24.8.0', 24), tools: ['cidr-subnet', 'ip-tools', 'vlan-tools', 'ip-range-tools', 'port-reference', 'command-builder'] }, null, 2) };
    if (format === 'csv') return { fileName: 'netkit-results.csv', text: 'tool,value\nCIDR network,10.24.8.0/24\nCIDR broadcast,10.24.8.255\nUsable hosts,254\n' };
    return { fileName: 'netkit-workspace.md', text: '# NETKIT workspace\n\n## Current subnet\n- Network: `10.24.8.0/24`\n- Broadcast: `10.24.8.255`\n- Usable hosts: `254`\n\n_Exported locally from NETKIT._' };
  }, [format]);
  const copy = () => { void navigator.clipboard?.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  const download = () => { const blob = new Blob([text], { type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/markdown' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url); };
  return <><PageHeader eyebrow="Workspace / 08" title="Export workspace" description="Take a clean snapshot of your current working set. Copy it into a ticket or download it for your records." /><div className="grid gap-5 xl:grid-cols-[300px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="output">Export format</SectionTitle><div className="space-y-2">{[['markdown', 'Markdown', 'Readable handoff'], ['json', 'JSON', 'Structured snapshot'], ['csv', 'CSV', 'Spreadsheet ready']].map(([value, label, detail]) => <button key={value} data-testid={`button-format-${value}`} onClick={() => setFormat(value)} className={`w-full rounded-md border p-3 text-left transition ${format === value ? 'border-primary/50 bg-primary/10' : 'border-border hover:bg-secondary'}`}><div className="flex items-center justify-between"><span className={`text-sm font-semibold ${format === value ? 'text-primary' : ''}`}>{label}</span>{format === value && <Check size={15} className="text-primary" />}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></button>)}</div><div className="mt-6 rounded-md border border-border bg-background/50 p-3 text-[11px] leading-relaxed text-muted-foreground">Exports are generated entirely in your browser. No project data is uploaded.</div></section><section className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3"><div className="flex items-center gap-2"><FileText size={15} className="text-accent" /><span className="font-mono text-xs text-muted-foreground">{fileName}</span></div><div className="flex gap-1"><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={copy}><Copy size={13} />{copied ? 'Copied' : 'Copy'}</Button><Button variant="primary" className="px-2.5 py-1.5 text-xs" onClick={download}><Download size={13} />Download</Button></div></div><pre data-testid="text-export-preview" className="min-h-[390px] overflow-auto p-5 font-mono text-xs leading-6 text-slate-300"><code>{text}</code></pre></section></div></>;
}

function SettingsPage() {
  const [theme, setTheme] = useState<Theme>(readThemePreference);
  const [status, setStatus] = useState('');
  const [activityCount, setActivityCount] = useState(() => readActivity().length);
  const [noteCount, setNoteCount] = useState(() => {
    try {
      const stored = localStorage.getItem('netkit-notes');
      return stored ? (JSON.parse(stored) as Note[]).length : 0;
    } catch {
      return 0;
    }
  });

  const chooseTheme = (next: Theme) => {
    setTheme(next);
    setThemePreference(next);
    setStatus(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled.`);
  };
  const clearActivity = () => {
    if (!window.confirm('Clear your local tool activity history?')) return;
    localStorage.removeItem(activityStorageKey);
    window.dispatchEvent(new Event(activityEventName));
    setActivityCount(0);
    setStatus('Activity history cleared.');
  };
  const clearNotes = () => {
    if (!window.confirm('Delete all notes saved in this browser?')) return;
    localStorage.removeItem('netkit-notes');
    setNoteCount(0);
    setStatus('Local notes cleared.');
  };

  return <><PageHeader eyebrow="Workspace / 09" title="Settings" description="Control NETKIT appearance and the local data stored in this browser." />
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-md border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2"><Sun size={16} className="text-primary" /><div><h2 className="text-sm font-semibold">Appearance</h2><p className="text-[10px] text-muted-foreground">Choose the interface contrast for this browser.</p></div></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['dark', 'light'] as Theme[]).map((option) => <button key={option} type="button" onClick={() => chooseTheme(option)} className={`rounded-md border p-3 text-left transition ${theme === option ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'}`} data-testid={`button-theme-${option}`}><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold">{option === 'dark' ? <Moon size={14} /> : <Sun size={14} />}{option === 'dark' ? 'Dark mode' : 'Light mode'}</span>{theme === option && <Check size={14} className="text-primary" />}</div><div className="mt-2 text-[10px] leading-4 text-muted-foreground">{option === 'dark' ? 'Low-light workspace with blue network accents.' : 'Higher-contrast workspace for bright environments.'}</div></button>)}
        </div>
      </section>
      <section className="rounded-md border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2"><Settings2 size={16} className="text-primary" /><div><h2 className="text-sm font-semibold">Local workspace</h2><p className="text-[10px] text-muted-foreground">NETKIT does not upload these browser-only records.</p></div></div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
          <div className="bg-card p-3"><div className="font-mono text-lg text-primary">{activityCount}</div><div className="mt-1 text-[10px] text-muted-foreground">tracked tools</div></div>
          <div className="bg-card p-3"><div className="font-mono text-lg text-accent">{noteCount}</div><div className="mt-1 text-[10px] text-muted-foreground">saved notes</div></div>
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start text-xs" onClick={clearActivity} disabled={activityCount === 0}><RotateCcw size={13} /> Clear activity history</Button>
          <Button variant="danger" className="w-full justify-start text-xs" onClick={clearNotes} disabled={noteCount === 0}><Trash2 size={13} /> Delete local notes</Button>
        </div>
      </section>
    </div>
    <section className="mt-4 rounded-md border border-border bg-card p-4 md:p-5">
      <div className="flex items-start gap-3"><div className="flex h-8 w-8 items-center justify-center rounded border border-primary/20 bg-primary/10 text-primary"><SlidersHorizontal size={15} /></div><div><h2 className="text-sm font-semibold">About this workspace</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Calculations, conversion results, activity tracking, theme preference, and notes stay in your browser. Network tools do not send addresses to a remote service.</p>{status && <p className="mt-3 font-mono text-[10px] text-accent">{status}</p>}</div></div>
    </section>
  </>;
}

function NotFoundPage() {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center"><div className="font-mono text-5xl text-primary">404</div><h1 className="mt-4 text-xl font-semibold">Instrument not found</h1><p className="mt-2 text-sm text-muted-foreground">That route is outside the current toolkit.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-return-dashboard">Return to dashboard <ArrowRight size={15} /></Link></div>;
}

function Router() {
  return <Layout><ErrorBoundary resetKey={window.location.pathname}><Switch>
    <Route path="/" component={RefinedDashboard} />
    <Route path="/cidr-subnet" component={CidrPage} />
    <Route path="/subnet-calculator" component={SubnetPage} />
    <Route path="/ip-tools" component={IpToolsPage} />
    <Route path="/vlan-tools" component={VlanPage} />
    <Route path="/ip-range-tools" component={RangePage} />
    <Route path="/port-reference" component={PortPage} />
    <Route path="/command-builder" component={CommandBuilderPage} />
    <Route path="/notes" component={NotesPage} />
    <Route path="/export" component={ExportPage} />
    <Route path="/settings" component={SettingsPage} />
    <Route component={NotFoundPage} />
  </Switch></ErrorBoundary></Layout>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;