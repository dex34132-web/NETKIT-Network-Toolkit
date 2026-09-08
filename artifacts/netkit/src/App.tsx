e responses.', category: 'DNS' },
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

function LegacyCommandBuilderPage() {
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

function LegacyNotesPage() {
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
  const save = () => { if (!draft.title.trim()) return; const next = normalizeNote({ id: selected ?? Date.now(), title: draft.title.trim(), body: draft.body.trim(), tag: draft.tag.trim() || 'NOTE', updated: 'Just now', category: 'General', tags: [], pinned: false, archived: false, updatedAt: Date.now(), createdAt: Date.now() }); setNotes((current) => selected ? current.map((note) => note.id === selected ? next : note) : [next, ...current]); setSelected(next.id); setEditing(false); };
  const remove = () => { if (!active) return; setNotes((current) => current.filter((note) => note.id !== active.id)); setSelected(null); setEditing(false); };
  return <><PageHeader eyebrow="Workspace / 07" title="Notes" description="Keep the little details that make the next network change safer. Notes are stored locally in this browser." action={<Button onClick={startNew} data-testid="button-new-note"><Plus size={15} /> New note</Button>} /><div className="grid min-h-[570px] gap-0 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[300px_1fr]"><aside className="border-b border-border bg-secondary/20 lg:border-b-0 lg:border-r"><div className="border-b border-border p-3"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-notes-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter notes..." className="h-9 w-full rounded border border-input bg-background/60 pl-8 pr-2 text-xs outline-none focus:border-primary" /></div></div><div className="max-h-[220px] overflow-y-auto p-2 lg:max-h-[500px]">{filtered.map((note) => <button key={note.id} data-testid={`button-note-${note.id}`} onClick={() => { setSelected(note.id); setEditing(false); }} className={`w-full rounded-md p-3 text-left transition ${selected === note.id ? 'bg-primary/10 ring-1 ring-primary/25' : 'hover:bg-secondary'}`}><div className="flex items-center justify-between gap-2"><span className={`font-mono text-[9px] tracking-wider ${selected === note.id ? 'text-primary' : 'text-muted-foreground'}`}>{note.tag}</span><span className="font-mono text-[9px] text-muted-foreground/70">{note.updated}</span></div><div className="mt-2 truncate text-sm font-semibold">{note.title}</div><div className="mt-1 truncate text-[11px] text-muted-foreground">{note.body}</div></button>)}</div>{filtered.length === 0 && <div className="p-5 text-center text-xs text-muted-foreground">No notes match that filter.</div>}</aside><section className="relative">{editing ? <div className="p-5 md:p-7"><div className="mb-5 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-wider text-primary">{selected ? 'Edit note' : 'New note'}</div><h2 className="mt-1 text-lg font-semibold">{selected ? 'Update this note' : 'Capture a detail'}</h2></div><Button variant="ghost" onClick={() => setEditing(false)}><X size={16} /></Button></div><div className="space-y-4"><Field label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} placeholder="A useful heading" /><div className="grid gap-4 sm:grid-cols-[1fr_160px]"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Details</span><textarea data-testid="input-note-body" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Write the address, caveat or next step..." className="min-h-[190px] w-full resize-y rounded-md border border-input bg-background/70 p-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label><Field label="Tag" value={draft.tag} onChange={(value) => setDraft((current) => ({ ...current, tag: value }))} placeholder="CHANGE" /></div><div className="flex gap-2 pt-2"><Button onClick={save} data-testid="button-save-note"><Check size={15} /> Save note</Button><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button></div></div></div> : active ? <div className="p-5 md:p-7"><div className="mb-7 flex items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2"><span className="rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">{active.tag}</span><span className="font-mono text-[10px] text-muted-foreground">{active.updated}</span></div><h2 className="text-xl font-semibold">{active.title}</h2></div><div className="flex gap-1"><Button variant="ghost" onClick={startEdit} data-testid="button-edit-note"><Pencil size={15} /></Button><Button variant="ghost" onClick={remove} data-testid="button-delete-note"><Trash2 size={15} className="text-destructive" /></Button></div></div><div className="max-w-2xl whitespace-pre-wrap text-sm leading-8 text-muted-foreground">{active.body}</div><div className="mt-10 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Stored in this browser · no sync</div></div> : <EmptyState icon={FileText} title="Select a note or start fresh" text="Your notes are local by design. Nothing leaves this workspace." />}</section></div></>;
}

function CommandBuilderPage() {
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const [vendor, setVendor] = useState<BuilderVendor>('Cisco IOS / IOS-XE');
  const [category, setCategory] = useState<BuilderCategory>('interface');
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...defaultBuilderValues }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('Ready to generate.');
  const fields = builderFields(category);
  const command = useMemo(() => generateBuilderCommand(vendor, category, values), [category, values, vendor]);
  const lines = command.split('\n');

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setNotice('Inputs changed · regenerate when ready.');
  };
  const generate = () => {
    const nextErrors = validateBuilderValues(category, values);
    setErrors(nextErrors);
    setNotice(Object.keys(nextErrors).length ? 'Resolve the highlighted fields before generating.' : 'Generated locally · review before applying.');
  };
  const reset = () => {
    setValues((current) => {
      const next = { ...current };
      fields.forEach((field) => { next[field.key] = defaultBuilderValues[field.key] ?? ''; });
      return next;
    });
    setErrors({});
    setNotice('Inputs reset to a safe example.');
  };
  const editInputs = () => {
    inputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    inputPanelRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select')?.focus();
  };
  const copyCommand = () => {
    void navigator.clipboard?.writeText(command);
    setCopied(true);
    setNotice('Command copied to clipboard.');
    window.setTimeout(() => setCopied(false), 1400);
  };
  const downloadCommand = () => {
    const blob = new Blob([command + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `netkit-${vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${category}.conf`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Command file downloaded.');
  };
  const changeCategory = (next: BuilderCategory) => {
    setCategory(next);
    setErrors({});
    setNotice('Template changed · complete the parameters below.');
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const commandKey = event.metaKey || event.ctrlKey;
      if (!commandKey) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        generate();
      } else if (event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copyCommand();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <><PageHeader eyebrow="Automation / 06" title="Command builder" description="Generate review-ready configuration for common network platforms. Every template stays local and is clearly marked for verification before use." action={<span className="hidden rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary sm:inline">OFFLINE GENERATOR</span>} />
    <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-5 text-amber-200"><CircleDot size={15} className="mt-0.5 shrink-0 text-amber-300" /><div><span className="font-semibold text-amber-100">Review before applying.</span> Templates are deterministic starting points, not deployment approvals. Validate syntax, interface names, policy scope, maintenance window, and rollback steps against your device and standards.</div></div>
    <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
      <section ref={inputPanelRef} className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between"><SectionTitle detail="dynamic inputs">Template inputs</SectionTitle><button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary"><RotateCcw size={12} /> Reset</button></div>
        <div className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Platform</span><select data-testid="select-command-vendor" value={vendor} onChange={(event) => setVendor(event.target.value as BuilderVendor)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">{builderVendors.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Template category</span><select data-testid="select-command-type" value={category} onChange={(event) => changeCategory(event.target.value as BuilderCategory)} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">{builderCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          {fields.map((field) => <label key={field.key} className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{field.label}{field.required && <span className="ml-1 text-primary">*</span>}</span>{field.options ? <select aria-label={field.label} value={values[field.key] ?? ''} onChange={(event) => updateValue(field.key, event.target.value)} className={`h-10 w-full rounded-md border bg-background/70 px-3 text-sm outline-none focus:border-primary ${errors[field.key] ? 'border-destructive' : 'border-input'}`}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input aria-label={field.label} data-testid={`input-command-${field.key}`} type={field.type ?? 'text'} min={field.min} max={field.max} value={values[field.key] ?? ''} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} className={`h-10 w-full rounded-md border bg-background/70 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors[field.key] ? 'border-destructive' : 'border-input'}`} />}{errors[field.key] && <span className="mt-1 block text-[10px] text-destructive">{errors[field.key]}</span>}</label>)}
          <Button variant="primary" className="w-full" onClick={generate} data-testid="button-generate-command"><Sparkles size={15} /> Generate command</Button>
        </div>
        <div className="mt-4 rounded border border-border bg-background/40 p-3 text-[10px] leading-5 text-muted-foreground"><span className="font-mono text-primary">SHORTCUTS</span><br />Ctrl/Cmd + Enter generates · Ctrl/Cmd + Shift + C copies output</div>
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-3"><div className="flex items-center gap-2"><Code2 size={15} className="text-primary" /><div><div className="font-mono text-xs text-muted-foreground">{vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.conf</div><div className="text-[10px] text-muted-foreground">{builderCategories.find((item) => item.value === category)?.label}</div></div></div><div className="flex gap-1"><Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={editInputs}><Pencil size={13} /> Edit inputs</Button><Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={downloadCommand}><Download size={13} /> Download</Button><Button variant="primary" className="px-2.5 py-1.5 text-xs" onClick={copyCommand}><Copy size={13} /> {copied ? 'Copied' : 'Copy'}</Button></div></div>
        <div className="overflow-x-auto bg-[#0a0e14] p-4 md:p-5"><pre data-testid="text-generated-command" className="min-h-[390px] min-w-max font-mono text-xs leading-7 text-slate-300">{lines.map((line, index) => <div key={`${index}-${line}`} className="flex"><span className="mr-5 inline-block w-6 select-none text-right text-slate-600">{String(index + 1).padStart(2, '0')}</span><code>{line || ' '}</code></div>)}</pre></div>
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card/35 px-4 py-3 text-[10px] text-muted-foreground"><span>{notice}</span><span className="hidden font-mono text-primary sm:inline">LOCAL · NO DEVICE CONNECTION</span></div>
      </section>
    </div>
  </>;
}

function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem('netkit-notes');
      const parsed = stored ? JSON.parse(stored) : initialNotes;
      return Array.isArray(parsed) ? parsed.map((item, index) => normalizeNote(item, index)) : initialNotes;
    } catch { return initialNotes; }
  });
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [tagFilter, setTagFilter] = useState('All tags');
  const [viewFilter, setViewFilter] = useState<'all' | 'pinned' | 'archived' | 'recent'>('all');
  const [selected, setSelected] = useState<number | null>(notes[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '', category: 'General', tags: '' });
  const [saveState, setSaveState] = useState('Saved locally');
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(() => { localStorage.setItem('netkit-notes', JSON.stringify(notes)); }, [notes]);
  const active = notes.find((note) => note.id === selected) ?? null;
  const tags = Array.from(new Set(notes.flatMap((note) => note.tags))).sort();
  const filtered = useMemo(() => notes.filter((note) => {
    const haystack = `${note.title} ${note.body} ${note.category} ${note.tags.join(' ')}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesCategory = categoryFilter === 'All categories' || note.category === categoryFilter;
    const matchesTag = tagFilter === 'All tags' || note.tags.includes(tagFilter);
    const matchesView = viewFilter === 'all' || (viewFilter === 'pinned' && note.pinned) || (viewFilter === 'archived' && note.archived) || (viewFilter === 'recent' && Date.now() - note.updatedAt < 1000 * 60 * 60 * 24 * 7);
    return matchesQuery && matchesCategory && matchesTag && matchesView;
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt), [categoryFilter, notes, query, tagFilter, viewFilter]);

  const commitDraft = (nextDraft = draft, id = selected) => {
    if (!nextDraft.title.trim()) { setSaveState('Add a title to save'); return; }
    const timestamp = Date.now();
    const nextNote = normalizeNote({
      id: id ?? timestamp,
      title: nextDraft.title.trim(),
      body: nextDraft.body,
      category: nextDraft.category,
      tags: nextDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      tag: nextDraft.category.toUpperCase(),
      updated: formatNoteTime(timestamp),
      updatedAt: timestamp,
      createdAt: active?.createdAt ?? timestamp,
      pinned: active?.pinned ?? false,
      archived: active?.archived ?? false,
    });
    setNotes((current) => id ? current.map((note) => note.id === id ? nextNote : note) : [nextNote, ...current]);
    setSelected(nextNote.id);
    setSaveState('Saved locally');
  };
  useEffect(() => {
    if (!editing || !draft.title.trim()) return;
    setSaveState('Saving…');
    const timer = window.setTimeout(() => commitDraft(draft, selected), 850);
    return () => window.clearTimeout(timer);
  }, [draft, editing, selected]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const commandKey = event.metaKey || event.ctrlKey;
      if (commandKey && event.key.toLowerCase() === 'n') { event.preventDefault(); startNew(); }
      else if (commandKey && event.key.toLowerCase() === 's') { event.preventDefault(); commitDraft(); }
      else if (commandKey && event.shiftKey && event.key.toLowerCase() === 'c' && active) { event.preventDefault(); void navigator.clipboard?.writeText(active.body); setCopiedBlock(-1); window.setTimeout(() => setCopiedBlock(null), 1200); }
      else if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const startNew = () => { setSelected(null); setDraft({ title: '', body: '', category: 'General', tags: '' }); setEditing(true); setSaveState('Not saved'); };
  const startEdit = () => { if (active) { setDraft({ title: active.title, body: active.body, category: active.category, tags: active.tags.join(', ') }); setEditing(true); setSaveState('Editing…'); } };
  const selectNote = (id: number) => { const note = notes.find((item) => item.id === id); if (!note) return; setSelected(id); setDraft({ title: note.title, body: note.body, category: note.category, tags: note.tags.join(', ') }); setEditing(false); };
  const toggleNote = (key: 'pinned' | 'archived') => { if (!active) return; setNotes((current) => current.map((note) => note.id === active.id ? { ...note, [key]: !note[key], updated: formatNoteTime(Date.now()), updatedAt: Date.now() } : note)); };
  const duplicate = () => { if (!active) return; const copy = normalizeNote({ ...active, id: Date.now(), title: `${active.title} copy`, pinned: false, archived: false, createdAt: Date.now(), updatedAt: Date.now(), updated: 'Just now' }); setNotes((current) => [copy, ...current]); setSelected(copy.id); setEditing(true); setDraft({ title: copy.title, body: copy.body, category: copy.category, tags: copy.tags.join(', ') }); };
  const deleteNote = () => { if (!active || !window.confirm(`Delete “${active.title}”? This removes the local note permanently.`)) return; setNotes((current) => current.filter((note) => note.id !== active.id)); setSelected(null); setEditing(false); };
  const insertFormatting = (before: string, after = '') => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = draft.body.slice(start, end) || 'text';
    const body = draft.body.slice(0, start) + before + selection + after + draft.body.slice(end);
    setDraft((current) => ({ ...current, body }));
    window.setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selection.length); }, 0);
  };
  const exportNotes = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'netkit-notes.json'; anchor.click(); URL.revokeObjectURL(url);
  };
  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error('Expected a note array');
        const imported = parsed.map((item, index) => normalizeNote(item, index));
        setNotes((current) => [...imported, ...current.filter((note) => !imported.some((item) => item.id === note.id))]);
        setSaveState(`Imported ${imported.length} note${imported.length === 1 ? '' : 's'}`);
      } catch { setSaveState('Import failed · choose a NETKIT JSON export'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  const codeBlocks = active ? Array.from(active.body.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)).map((match) => match[1].trimEnd()) : [];

  return <><PageHeader eyebrow="Workspace / 07" title="Notes" description="Capture designs, caveats, commands, and handoff details. Notes are formatted and stored only in this browser." action={<div className="flex gap-2"><input ref={importRef} type="file" accept="application/json" onChange={importNotes} className="hidden" /><Button variant="secondary" onClick={exportNotes} data-testid="button-export-notes"><Download size={14} /> Export</Button><Button variant="secondary" onClick={() => importRef.current?.click()} data-testid="button-import-notes"><Upload size={14} /> Import</Button><Button onClick={startNew} data-testid="button-new-note"><Plus size={15} /> New note</Button></div>} />
    <div className="grid min-h-[650px] gap-0 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-border bg-secondary/15 lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-3"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input ref={searchRef} data-testid="input-notes-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes…  /" className="h-9 w-full rounded border border-input bg-background/60 pl-8 pr-2 text-xs outline-none focus:border-primary" /></div><div className="mt-2 grid grid-cols-2 gap-2"><select aria-label="Filter note category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-8 min-w-0 rounded border border-input bg-background/60 px-2 text-[10px] outline-none focus:border-primary"><option>All categories</option>{noteCategories.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter note tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-8 min-w-0 rounded border border-input bg-background/60 px-2 text-[10px] outline-none focus:border-primary"><option>All tags</option>{tags.map((item) => <option key={item}>{item}</option>)}</select></div><div className="mt-2 flex gap-1 overflow-x-auto">{[['all', 'All'], ['pinned', 'Pinned'], ['recent', 'Recent'], ['archived', 'Archived']].map(([value, label]) => <button type="button" key={value} onClick={() => setViewFilter(value as typeof viewFilter)} className={`whitespace-nowrap rounded px-2 py-1 font-mono text-[9px] ${viewFilter === value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}>{label}</button>)}</div></div>
        <div className="max-h-[420px] overflow-y-auto p-2 lg:max-h-[560px]">{filtered.map((note) => <button key={note.id} data-testid={`button-note-${note.id}`} onClick={() => selectNote(note.id)} className={`w-full rounded-md p-3 text-left transition ${selected === note.id ? 'bg-primary/10 ring-1 ring-primary/25' : 'hover:bg-secondary'}`}><div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-[9px] tracking-wider text-primary">{note.category.toUpperCase()}{note.pinned && ' · PINNED'}</span><span className="shrink-0 font-mono text-[9px] text-muted-foreground/70">{formatNoteTime(note.updatedAt)}</span></div><div className="mt-2 truncate text-sm font-semibold">{note.title}</div><div className="mt-1 truncate text-[11px] text-muted-foreground">{note.body.replace(/[#*`]/g, '')}</div><div className="mt-2 flex gap-1">{note.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground">{tag}</span>)}</div></button>)}</div>
        {filtered.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">No notes match these filters.<br /><button type="button" onClick={startNew} className="mt-2 text-primary hover:underline">Create one now</button></div>}
        <div className="border-t border-border p-3 font-mono text-[9px] text-muted-foreground">{notes.length} total · {notes.filter((note) => note.pinned).length} pinned · {notes.filter((note) => note.archived).length} archived</div>
      </aside>
      <section className="relative min-w-0">
        {editing ? <div className="p-5 md:p-7"><div className="mb-5 flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-wider text-primary">{selected ? 'Edit note' : 'New note'}</div><h2 className="mt-1 text-lg font-semibold">{selected ? 'Update this note' : 'Capture a detail'}</h2></div><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{saveState}</span><Button variant="ghost" onClick={() => setEditing(false)}><X size={16} /></Button></div></div><div className="space-y-4"><Field label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} placeholder="A useful heading" /><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Category</span><select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background/70 px-3 text-sm outline-none focus:border-primary">{noteCategories.map((item) => <option key={item}>{item}</option>)}</select></label><Field label="Tags" value={draft.tags} onChange={(value) => setDraft((current) => ({ ...current, tags: value }))} placeholder="ospf, change-window" /></div><div className="overflow-hidden rounded-md border border-input bg-background/70"><div className="flex flex-wrap items-center gap-1 border-b border-input bg-secondary/30 p-2"><button type="button" onClick={() => insertFormatting('# ', '')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">H1</button><button type="button" onClick={() => insertFormatting('**', '**')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">Bold</button><button type="button" onClick={() => insertFormatting('*', '*')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">Italic</button><button type="button" onClick={() => insertFormatting('- ', '')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">List</button><button type="button" onClick={() => insertFormatting('- [ ] ', '')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">Checklist</button><button type="button" onClick={() => insertFormatting('`', '`')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">Code</button><button type="button" onClick={() => insertFormatting('```\n', '\n```')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">Code block</button><button type="button" onClick={() => insertFormatting('| Column | Value |\n| --- | --- |\n| ', ' |  |')} className="rounded px-2 py-1 font-mono text-[10px] hover:bg-secondary">Table</button></div><textarea ref={bodyRef} data-testid="input-note-body" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Write a design decision, command, caveat, or next step…" className="min-h-[300px] w-full resize-y bg-transparent p-3 text-sm leading-7 outline-none" /></div><div className="flex flex-wrap items-center gap-2 pt-1"><Button onClick={() => { commitDraft(); setEditing(false); }} data-testid="button-save-note"><Check size={15} /> Save note</Button><Button variant="secondary" onClick={() => setEditing(false)}>Done editing</Button><span className="ml-auto font-mono text-[10px] text-muted-foreground">Ctrl/Cmd + S saves · edits autosave</span></div></div></div> : active ? <div className="p-5 md:p-7"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">{active.category}</span>{active.tags.map((tag) => <span key={tag} className="rounded border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">{tag}</span>)}<span className="font-mono text-[10px] text-muted-foreground">{formatNoteTime(active.updatedAt)}</span></div><h2 className="text-xl font-semibold">{active.title}</h2></div><div className="flex gap-1"><Button variant="ghost" onClick={() => toggleNote('pinned')}><MapPin size={15} className={active.pinned ? 'text-primary' : ''} /></Button><Button variant="ghost" onClick={() => toggleNote('archived')}><FileText size={15} className={active.archived ? 'text-primary' : ''} /></Button><Button variant="ghost" onClick={duplicate}><Plus size={15} /></Button><Button variant="ghost" onClick={startEdit} data-testid="button-edit-note"><Pencil size={15} /></Button><Button variant="ghost" onClick={deleteNote} data-testid="button-delete-note"><Trash2 size={15} className="text-destructive" /></Button></div></div><div className="max-w-3xl whitespace-pre-wrap text-sm leading-8 text-muted-foreground">{active.body || <span className="italic">This note is empty. Edit it to add details.</span>}</div>{codeBlocks.length > 0 && <div className="mt-6 space-y-2"><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Code blocks</div>{codeBlocks.map((block, index) => <div key={index} className="overflow-hidden rounded border border-border bg-[#0a0e14]"><div className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[9px] text-muted-foreground">LOCAL SNIPPET <button type="button" onClick={() => { void navigator.clipboard?.writeText(block); setCopiedBlock(index); window.setTimeout(() => setCopiedBlock(null), 1200); }} className="text-primary hover:underline">{copiedBlock === index ? 'Copied' : 'Copy'}</button></div><pre className="overflow-x-auto p-3 text-xs leading-6 text-slate-300">{block}</pre></div>)}</div>}<div className="mt-10 flex items-center justify-between border-t border-border pt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>Stored in this browser · no sync</span><span>Ctrl/Cmd + Shift + C copies note</span></div></div> : <EmptyState icon={NotebookTabs} title="Select a note or start fresh" text="Your notes are local by design. Nothing leaves this workspace." />}
      </section>
    </div>
  </>;
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