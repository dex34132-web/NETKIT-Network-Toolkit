import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowRight, Binary, BookOpen, Calculator, Check, ChevronRight, Clipboard,
  Code2, Copy, Download, FileText, Hash, LayoutDashboard, Menu, Network,
  Pencil, Plus, Radio, RefreshCw, Search, Server, Settings2,
  SlidersHorizontal, Sparkles, Trash2, Upload, X, type LucideIcon,
} from 'lucide-react';
import {
  Link, Route, Switch, useLocation, Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Note = { id: number; title: string; body: string; tag: string; updated: string };
type Cidr = {
  ip: string; prefix: number; network: string; broadcast: string; first: string;
  last: string; mask: string; wildcard: string; hosts: number; blockSize: number;
};

const initialNotes: Note[] = [
  { id: 1, title: 'Branch office WAN handoff', body: 'Confirm /31 on the provider side before cutover. BGP neighbor: 198.51.100.14.', tag: 'WAN', updated: 'Today, 09:42' },
  { id: 2, title: 'Core switch uplift', body: 'New management SVI lives in 10.40.8.0/24. Reserve .1 for gateway and .254 for OOB.', tag: 'CHANGE', updated: 'Yesterday' },
  { id: 3, title: 'Lab rack addressing', body: 'Keep 172.20.0.0/16 available for the virtual lab. VLANs 210–219 are unassigned.', tag: 'LAB', updated: 'Mon, 16:18' },
];

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/notes', label: 'Notes', icon: FileText },
      { href: '/export', label: 'Export', icon: Upload },
    ],
  },
  {
    label: 'Network math',
    items: [
      { href: '/cidr-subnet', label: 'CIDR / subnet', icon: Calculator },
      { href: '/ip-tools', label: 'IP conversions', icon: Binary },
      { href: '/ip-range-tools', label: 'Range checker', icon: SlidersHorizontal },
      { href: '/vlan-tools', label: 'VLAN planner', icon: Network },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/port-reference', label: 'Port reference', icon: Radio },
      { href: '/command-builder', label: 'Command builder', icon: Code2 },
    ],
  },
];

const toolCards = [
  { href: '/cidr-subnet', title: 'CIDR / subnet', description: 'Break down a network in seconds.', icon: Calculator, key: '01', accent: 'cyan' },
  { href: '/ip-tools', title: 'IP conversions', description: 'Decimal, binary, hex and back.', icon: Binary, key: '02', accent: 'lime' },
  { href: '/vlan-tools', title: 'VLAN planner', description: 'Map IDs to clean address blocks.', icon: Network, key: '03', accent: 'amber' },
  { href: '/ip-range-tools', title: 'Range checker', description: 'Validate spans and usable hosts.', icon: SlidersHorizontal, key: '04', accent: 'cyan' },
  { href: '/port-reference', title: 'Port reference', description: 'Find the service before you type it.', icon: Radio, key: '05', accent: 'lime' },
  { href: '/command-builder', title: 'Command builder', description: 'Generate syntax without tab hopping.', icon: Code2, key: '06', accent: 'amber' },
];

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
  const hosts = prefix >= 31 ? total : Math.max(0, total - 2);
  return {
    ip, prefix, network: formatIp(network), broadcast: formatIp(broadcast),
    first: prefix >= 31 ? formatIp(network) : formatIp(network + 1),
    last: prefix >= 31 ? formatIp(broadcast) : formatIp(broadcast - 1),
    mask: formatIp(mask), wildcard: formatIp((~mask) >>> 0), hosts, blockSize: total,
  };
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
  const pageName = [...navGroups.flatMap((group) => group.items)].find((item) => item.href === location)?.label ?? 'Dashboard';
  return <div className="scanline flex min-h-[100dvh] bg-background">
    <aside className="hidden w-[252px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-6">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
          <span className="absolute h-2 w-2 rounded-full bg-primary pulse-dot" />
          <span className="h-4 w-4 rounded-full border border-primary/70" />
        </div>
        <div><div className="font-mono text-[15px] font-medium tracking-[0.2em] text-foreground">NETKIT</div><div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">NETWORK TOOLKIT</div></div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => <div key={group.label} className="mb-7">
          <div className="mb-2 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/65">{group.label}</div>
          <div className="space-y-0.5">{group.items.map(({ href, label, icon: Icon }) => <NavItem key={href} href={href} label={label} icon={Icon} active={location === href} />)}</div>
        </div>)}
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground md:hidden"><Menu size={16} /></div><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">NETKIT / <span className="text-primary">{pageName}</span></div><div className="mt-1 text-sm font-medium text-foreground">Network engineering workspace</div></div></div>
        <div className="flex items-center gap-2"><Link href="/notes" className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-primary" data-testid="link-header-notes"><FileText size={15} /></Link></div>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/40 px-4 py-2 md:hidden">{navGroups.flatMap((group) => group.items).map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-mobile-${label}`} className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-xs ${location === href ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}><Icon size={13} />{label}</Link>)}</nav>
      <main className="netkit-grid min-h-[calc(100dvh-76px)] px-4 py-6 md:px-8 md:py-8"><div className="mx-auto max-w-[1320px] page-enter">{children}</div></main>
    </div>
  </div>;
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return <Link href={href} data-testid={`link-nav-${label}`} className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all ${active ? 'bg-primary/12 font-semibold text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Icon size={16} strokeWidth={active ? 2.2 : 1.7} /><span className="flex-1">{label}</span>{active && <ChevronRight size={13} className="opacity-70" />}</Link>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary"><span className="h-px w-5 bg-primary" />{eyebrow}</div><h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>{action}</div>;
}

function SectionTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold tracking-tight text-foreground">{children}</h2>{detail && <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{detail}</span>}</div>;
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
      <section className="rounded-lg border border-border bg-card p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Workspace pulse</div><h2 className="mt-1 text-lg font-semibold">Your toolkit at a glance</h2></div><Settings2 size={18} className="text-muted-foreground" /></div><div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border"><div className="bg-card p-4"><div className="font-mono text-2xl text-primary">08</div><div className="mt-1 text-xs text-muted-foreground">instruments ready</div></div><div className="bg-card p-4"><div className="font-mono text-2xl text-accent">{notes.length.toString().padStart(2, '0')}</div><div className="mt-1 text-xs text-muted-foreground">local notes</div></div><div className="bg-card p-4"><div className="font-mono text-2xl text-amber-300">24</div><div className="mt-1 text-xs text-muted-foreground">common ports</div></div><div className="bg-card p-4"><div className="font-mono text-2xl text-sky-300">0 ms</div><div className="mt-1 text-xs text-muted-foreground">network overhead</div></div></div><Link href="/command-builder" className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground transition hover:text-primary" data-testid="link-dashboard-command"><span className="flex items-center gap-2"><Code2 size={14} /> Build a change command</span><ArrowRight size={14} /></Link></section>
    </div>
    <section className="mt-8"><SectionTitle detail="6 instruments">Network tools</SectionTitle><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{toolCards.map((tool, index) => <Link key={tool.href} href={tool.href} data-testid={`card-tool-${tool.key}`} className={`group page-enter stagger-${Math.min(index + 1, 3)} relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card/80`}><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-md border ${tool.accent === 'cyan' ? 'border-primary/25 bg-primary/10 text-primary' : tool.accent === 'lime' ? 'border-accent/25 bg-accent/10 text-accent' : 'border-amber-300/25 bg-amber-300/10 text-amber-300'}`}><tool.icon size={17} /></div><span className="font-mono text-[10px] text-muted-foreground/60">{tool.key}</span></div><div><div className="flex items-center justify-between"><h3 className="text-sm font-semibold group-hover:text-primary">{tool.title}</h3><ArrowRight size={14} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div><p className="mt-1 text-xs text-muted-foreground">{tool.description}</p></div></Link>)}</div></section>
    <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]"><div><SectionTitle detail="local state">Recent notes</SectionTitle><div className="overflow-hidden rounded-lg border border-border bg-card">{notes.map((note) => <Link href="/notes" key={note.id} data-testid={`row-dashboard-note-${note.id}`} className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition last:border-b-0 hover:bg-secondary/50"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-secondary font-mono text-[10px] text-primary">{String(note.id).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{note.title}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{note.body}</div></div><span className="hidden font-mono text-[10px] text-muted-foreground sm:block">{note.updated}</span></Link>)}</div></div><div><SectionTitle detail="shortcuts">Quick tools</SectionTitle><div className="grid grid-cols-2 gap-2"><Link href="/port-reference" className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/40" data-testid="card-quick-port"><div className="mb-5 flex items-center justify-between"><Radio size={16} className="text-accent" /><span className="font-mono text-[10px] text-muted-foreground">CTRL K</span></div><div className="text-sm font-semibold">Port reference</div><div className="mt-1 text-xs text-muted-foreground">TCP, UDP and service notes</div></Link><Link href="/ip-tools" className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/40" data-testid="card-quick-convert"><div className="mb-5 flex items-center justify-between"><Binary size={16} className="text-primary" /><span className="font-mono text-[10px] text-muted-foreground">IPV4</span></div><div className="text-sm font-semibold">Convert an address</div><div className="mt-1 text-xs text-muted-foreground">See every representation</div></Link></div></div></section>
  </>;
}

function CidrPage() {
  const [ip, setIp] = useState('192.168.10.0');
  const [prefix, setPrefix] = useState('24');
  const [result, setResult] = useState<Cidr | null>(() => calculateCidr('192.168.10.0', 24));
  const run = () => setResult(calculateCidr(ip, Number(prefix)));
  return <><PageHeader eyebrow="Network math / 01" title="CIDR / subnet calculator" description="Calculate network boundaries, usable hosts, masks and block sizes without leaving your change window." /><div className="grid gap-5 xl:grid-cols-[360px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="inputs">Address parameters</SectionTitle><div className="space-y-4"><Field label="IPv4 address" value={ip} onChange={setIp} placeholder="192.168.10.0" /><Field label="Prefix length" value={prefix} onChange={setPrefix} type="number" min={0} max={32} /><div className="rounded-md border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground"><span className="font-mono text-primary">TIP</span><br />Use any host address inside the subnet. NETKIT normalizes it to the network boundary.</div><Button onClick={run} className="w-full" data-testid="button-calculate-cidr"><Calculator size={15} /> Calculate subnet</Button></div></section><section>{result ? <div className="grid gap-3 sm:grid-cols-2"><ResultCard label="Network address" value={`${result.network}/${result.prefix}`} accent="cyan" /><ResultCard label="Broadcast address" value={result.broadcast} /><ResultCard label="First usable host" value={result.first} accent="lime" /><ResultCard label="Last usable host" value={result.last} accent="lime" /><ResultCard label="Subnet mask" value={result.mask} /><ResultCard label="Wildcard mask" value={result.wildcard} /><ResultCard label="Usable host count" value={result.hosts.toLocaleString()} accent="lime" /><ResultCard label="Address block size" value={result.blockSize.toLocaleString()} /></div> : <EmptyState icon={Calculator} title="Waiting for a valid network" text="Enter an IPv4 address and prefix to see the computed boundaries." />}</section></div></>;
}

function ResultCard({ label, value, accent = 'default' }: { label: string; value: string; accent?: 'default' | 'cyan' | 'lime' }) {
  return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span><CopyButton value={value} /></div><div data-testid={`text-result-${label.replace(/\s+/g, '-').toLowerCase()}`} className={`mt-4 font-mono text-xl ${accent === 'cyan' ? 'text-primary' : accent === 'lime' ? 'text-accent' : 'text-foreground'}`}>{value}</div></div>;
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="flex min-h-[230px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/60 p-8 text-center"><Icon size={25} className="mb-3 text-muted-foreground" /><div className="text-sm font-semibold">{title}</div><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{text}</p></div>;
}

function IpToolsPage() {
  const [ip, setIp] = useState('172.16.4.25');
  const valid = parseIp(ip) !== null;
  const parsed = valid ? parseIp(ip) as number : 0;
  const values = valid ? [
    ['Decimal (32-bit)', String(parsed >>> 0)],
    ['Binary', binaryIp(ip)],
    ['Hexadecimal', hexIp(ip)],
    ['Dotted decimal', ip],
  ] : [];
  return <><PageHeader eyebrow="Network math / 02" title="IP conversion tools" description="One address, four useful representations. Keep the exact value visible while you work through ACLs, logs and documentation." /><div className="grid gap-5 xl:grid-cols-[360px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="source">IPv4 address</SectionTitle><Field label="Address" value={ip} onChange={setIp} placeholder="10.0.0.1" /><div className={`mt-4 rounded-md border p-3 text-xs ${valid ? 'border-accent/25 bg-accent/5 text-accent' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{valid ? 'Valid IPv4 address' : 'That does not look like an IPv4 address.'}</div><div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">Each octet is represented as 8 bits. The decimal value is unsigned.</div></section><section className="grid gap-3 sm:grid-cols-2">{valid ? values.map(([label, value], index) => <ResultCard key={label} label={label} value={value} accent={index === 1 ? 'cyan' : index === 2 ? 'lime' : 'default'} />) : <div className="sm:col-span-2"><EmptyState icon={Binary} title="Enter an IPv4 address" text="Conversion results will appear here as you type." /></div>}</section></div></>;
}

function VlanPage() {
  const [vlanId, setVlanId] = useState('120');
  const [name, setName] = useState('EDGE_USERS');
  const [base, setBase] = useState('10.120.0.0');
  const [prefix, setPrefix] = useState('24');
  const [rows, setRows] = useState<{ id: string; name: string; subnet: Cidr | null }[]>([]);
  const add = () => { if (Number(vlanId) >= 1 && Number(vlanId) <= 4094 && name.trim()) { setRows((current) => [{ id: vlanId, name: name.trim(), subnet: calculateCidr(base, Number(prefix)) }, ...current]); setVlanId(String(Number(vlanId) + 1)); } };
  return <><PageHeader eyebrow="Planning / 03" title="VLAN planner" description="Give every segment a deliberate name, ID and address block before it reaches a switch template." /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="new segment">VLAN definition</SectionTitle><div className="grid grid-cols-2 gap-3"><Field label="VLAN ID" value={vlanId} onChange={setVlanId} type="number" min={1} max={4094} /><Field label="Name" value={name} onChange={setName} placeholder="EDGE_USERS" /></div><div className="mt-4 grid grid-cols-[1fr_92px] gap-3"><Field label="Suggested subnet" value={base} onChange={setBase} placeholder="10.120.0.0" /><Field label="Prefix" value={prefix} onChange={setPrefix} type="number" min={0} max={32} /></div><Button onClick={add} className="mt-5 w-full" data-testid="button-add-vlan"><Plus size={15} /> Add VLAN to plan</Button><div className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground"><span className="font-mono text-primary">RANGE</span><br />1–4094 supported. Keep infrastructure and user segments in separate address families.</div></section><section>{rows.length === 0 ? <EmptyState icon={Network} title="No VLANs in this plan" text="Add a VLAN definition to start a lightweight local plan." /> : <div className="overflow-hidden rounded-lg border border-border bg-card"><div className="grid grid-cols-[72px_1fr_1fr_80px] border-b border-border bg-secondary/40 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>ID</span><span>Name</span><span>Subnet</span><span>Hosts</span></div>{rows.map((row, index) => <div key={`${row.id}-${index}`} data-testid={`row-vlan-${row.id}`} className="grid grid-cols-[72px_1fr_1fr_80px] items-center border-b border-border px-4 py-3.5 last:border-0"><span className="font-mono text-sm text-primary">{row.id}</span><span className="text-sm font-medium">{row.name}</span><span className="font-mono text-xs text-muted-foreground">{row.subnet ? `${row.subnet.network}/${row.subnet.prefix}` : '—'}</span><span className="font-mono text-xs text-accent">{row.subnet?.hosts.toLocaleString() ?? '—'}</span></div>)}</div>}</section></div></>;
}

function RangePage() {
  const [start, setStart] = useState('10.0.0.10');
  const [end, setEnd] = useState('10.0.0.50');
  const startNum = parseIp(start); const endNum = parseIp(end);
  const valid = startNum !== null && endNum !== null && endNum >= startNum;
  const count = valid ? endNum - startNum + 1 : 0;
  const usable = valid ? Math.max(0, count - (count > 2 ? 2 : 0)) : 0;
  return <><PageHeader eyebrow="Network math / 04" title="IP range checker" description="Check a contiguous address span, catch reversed inputs and see the usable count before you reserve it." /><div className="grid gap-5 xl:grid-cols-[380px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="range inputs">Address span</SectionTitle><div className="space-y-4"><Field label="Start address" value={start} onChange={setStart} placeholder="10.0.0.10" /><Field label="End address" value={end} onChange={setEnd} placeholder="10.0.0.50" /></div>{startNum !== null && endNum !== null && endNum < startNum && <div className="mt-4 flex gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"><X size={14} /> End address must come after start.</div>}</section><section className="grid gap-3 sm:grid-cols-2">{valid ? <><ResultCard label="Total addresses" value={count.toLocaleString()} accent="cyan" /><ResultCard label="Usable host count" value={usable.toLocaleString()} accent="lime" /><ResultCard label="First address" value={start} /><ResultCard label="Last address" value={end} /></> : <div className="sm:col-span-2"><EmptyState icon={SlidersHorizontal} title="Enter a valid address span" text="Both IPv4 inputs must be valid, and the end must not precede the start." /></div>}</section></div></>;
}

const ports = [
  { port: '20 / 21', protocol: 'TCP', service: 'FTP', detail: 'File transfer control and data' },
  { port: '22', protocol: 'TCP', service: 'SSH', detail: 'Secure remote administration' },
  { port: '23', protocol: 'TCP', service: 'Telnet', detail: 'Unencrypted terminal access' },
  { port: '25', protocol: 'TCP', service: 'SMTP', detail: 'Mail transfer' },
  { port: '53', protocol: 'TCP / UDP', service: 'DNS', detail: 'Domain name resolution' },
  { port: '67 / 68', protocol: 'UDP', service: 'DHCP', detail: 'Dynamic host configuration' },
  { port: '80', protocol: 'TCP', service: 'HTTP', detail: 'Web traffic' },
  { port: '123', protocol: 'UDP', service: 'NTP', detail: 'Network time synchronization' },
  { port: '161 / 162', protocol: 'UDP', service: 'SNMP', detail: 'Monitoring and traps' },
  { port: '443', protocol: 'TCP', service: 'HTTPS', detail: 'Encrypted web traffic' },
  { port: '514', protocol: 'UDP', service: 'Syslog', detail: 'Centralized event logging' },
  { port: '3389', protocol: 'TCP', service: 'RDP', detail: 'Remote desktop services' },
];

function PortPage() {
  const [query, setQuery] = useState('');
  const shown = ports.filter((item) => `${item.port} ${item.service} ${item.protocol} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow="Reference / 05" title="Port reference" description="A compact list of the ports you reach for most. Search by number, protocol or service." /><section className="rounded-lg border border-border bg-card"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-port-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search port, service or protocol..." className="h-10 w-full rounded-md border border-input bg-background/70 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{shown.length} of {ports.length} entries</span></div><div className="overflow-x-auto"><div className="min-w-[620px]"><div className="grid grid-cols-[120px_140px_1fr_1.8fr] border-b border-border bg-secondary/35 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>Port</span><span>Protocol</span><span>Service</span><span>Use</span></div>{shown.map((item) => <div key={item.port + item.service} data-testid={`row-port-${item.service}`} className="grid grid-cols-[120px_140px_1fr_1.8fr] items-center border-b border-border px-5 py-3.5 last:border-0 transition hover:bg-secondary/40"><span className="font-mono text-sm text-primary">{item.port}</span><span><span className="rounded border border-border bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground">{item.protocol}</span></span><span className="text-sm font-semibold">{item.service}</span><span className="text-xs text-muted-foreground">{item.detail}</span></div>)}</div></div>{shown.length === 0 && <div className="p-10"><EmptyState icon={Search} title="No matching ports" text="Try a service name, a port number or TCP/UDP." /></div>}</section></>;
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
  return <><PageHeader eyebrow="Reference / 06" title="Command builder" description="Generate a clean starting point for common access-port and SVI changes. Verify against your platform standards before applying." /><div className="grid gap-5 xl:grid-cols-[390px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="parameters">Change inputs</SectionTitle><div className="space-y-4"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Platform</span><select data-testid="select-command-vendor" value={vendor} onChange={(event) => setVendor(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary"><option>Cisco IOS</option><option>Arista EOS</option><option>MikroTik RouterOS</option></select></label><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Change type</span><select data-testid="select-command-type" value={commandType} onChange={(event) => setCommandType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary"><option value="interface">Access interface</option><option value="svi">SVI / gateway</option></select></label><Field label="Interface" value={interfaceName} onChange={setInterfaceName} /><Field label="VLAN ID" value={vlan} onChange={setVlan} type="number" /><Field label="Description" value={description} onChange={setDescription} />{commandType === 'svi' && <Field label="Gateway IP" value={ip} onChange={setIp} />}</div></section><section className="overflow-hidden rounded-lg border border-border bg-[#0a1015]"><div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3"><div className="flex items-center gap-2"><Code2 size={15} className="text-primary" /><span className="font-mono text-xs text-muted-foreground">{vendor.toLowerCase().replace(' ', '-')}.conf</span></div><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => copy(command)}><Copy size={13} />{copied ? 'Copied' : 'Copy command'}</Button></div><pre data-testid="text-generated-command" className="min-h-[330px] overflow-x-auto p-5 font-mono text-sm leading-7 text-slate-300"><code>{command}</code></pre><div className="border-t border-border bg-card/35 px-4 py-3 text-[11px] text-muted-foreground">Generated locally · Review interface names and policy before deployment.</div></section></div></>;
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
  return <><PageHeader eyebrow="Workspace / 08" title="Export workspace" description="Take a clean snapshot of your current working set. Copy it into a ticket or download it for your records." /><div className="grid gap-5 xl:grid-cols-[300px_1fr]"><section className="rounded-lg border border-border bg-card p-5"><SectionTitle detail="output">Export format</SectionTitle><div className="space-y-2">{[['markdown', 'Markdown', 'Readable handoff'], ['json', 'JSON', 'Structured snapshot'], ['csv', 'CSV', 'Spreadsheet ready']].map(([value, label, detail]) => <button key={value} data-testid={`button-format-${value}`} onClick={() => setFormat(value)} className={`w-full rounded-md border p-3 text-left transition ${format === value ? 'border-primary/50 bg-primary/10' : 'border-border hover:bg-secondary'}`}><div className="flex items-center justify-between"><span className={`text-sm font-semibold ${format === value ? 'text-primary' : ''}`}>{label}</span>{format === value && <Check size={15} className="text-primary" />}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></button>)}</div><div className="mt-6 rounded-md border border-border bg-background/50 p-3 text-[11px] leading-relaxed text-muted-foreground">Exports are generated entirely in your browser. No project data is uploaded.</div></section><section className="overflow-hidden rounded-lg border border-border bg-[#0a1015]"><div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3"><div className="flex items-center gap-2"><FileText size={15} className="text-accent" /><span className="font-mono text-xs text-muted-foreground">{fileName}</span></div><div className="flex gap-1"><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={copy}><Copy size={13} />{copied ? 'Copied' : 'Copy'}</Button><Button variant="primary" className="px-2.5 py-1.5 text-xs" onClick={download}><Download size={13} />Download</Button></div></div><pre data-testid="text-export-preview" className="min-h-[390px] overflow-auto p-5 font-mono text-xs leading-6 text-slate-300"><code>{text}</code></pre></section></div></>;
}

function NotFoundPage() {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center"><div className="font-mono text-5xl text-primary">404</div><h1 className="mt-4 text-xl font-semibold">Instrument not found</h1><p className="mt-2 text-sm text-muted-foreground">That route is outside the current toolkit.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-return-dashboard">Return to dashboard <ArrowRight size={15} /></Link></div>;
}

function Router() {
  return <Layout><ErrorBoundary resetKey={window.location.pathname}><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/cidr-subnet" component={CidrPage} />
    <Route path="/ip-tools" component={IpToolsPage} />
    <Route path="/vlan-tools" component={VlanPage} />
    <Route path="/ip-range-tools" component={RangePage} />
    <Route path="/port-reference" component={PortPage} />
    <Route path="/command-builder" component={CommandBuilderPage} />
    <Route path="/notes" component={NotesPage} />
    <Route path="/export" component={ExportPage} />
    <Route component={NotFoundPage} />
  </Switch></ErrorBoundary></Layout>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;