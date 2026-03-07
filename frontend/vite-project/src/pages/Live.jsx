import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Live() {
  const [status, setStatus] = useState({
    running: false,
    processed_packets: 0,
    actions: { allow: 0, alert: 0, drop_packet: 0, block_ip: 0 },
    blocklisted_ips: [],
    capture_error: null,
  });
  const [events, setEvents] = useState([]);
  const [interfaceName, setInterfaceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [interfaces, setInterfaces] = useState([]);

  const loadStatus = async () => {
    const res = await fetch("http://localhost:5000/api/ips/status");
    const data = await res.json();
    setStatus(data);
  };

  const loadEvents = async () => {
    const res = await fetch("http://localhost:5000/api/ips/events?limit=80");
    const data = await res.json();
    setEvents(data.events || []);
  };

  const loadInterfaces = async () => {
    const res = await fetch("http://localhost:5000/api/ips/interfaces");
    const data = await res.json();
    setInterfaces(data.interfaces || []);
  };

  useEffect(() => {
    loadStatus().catch(console.error);
    loadEvents().catch(console.error);
    loadInterfaces().catch(console.error);

    const onStatus = (payload) => setStatus(payload);
    const onEvent = (payload) => {
      setEvents((prev) => [payload, ...prev].slice(0, 120));
    };

    socket.on("ips_status", onStatus);
    socket.on("ips_event", onEvent);

    // Polling fallback so async capture errors always show up.
    const poll = setInterval(() => {
      loadStatus().catch(console.error);
    }, 2000);

    return () => {
      socket.off("ips_status", onStatus);
      socket.off("ips_event", onEvent);
      clearInterval(poll);
    };
  }, []);

  const startCapture = async () => {
    setBusy(true);
    try {
      const res = await fetch("http://localhost:5000/api/ips/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: interfaceName || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Start failed:", data.error || res.statusText);
      }
      await loadStatus();
    } finally {
      setBusy(false);
    }
  };

  const stopCapture = async () => {
    setBusy(true);
    try {
      const res = await fetch("http://localhost:5000/api/ips/stop", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Stop failed:", data.error || res.statusText);
      }
      await loadStatus();
    } finally {
      setBusy(false);
    }
  };

  const injectTestPacket = async () => {
    setBusy(true);
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        src_ip: "192.168.1.250",
        dst_ip: "192.168.1.10",
        src_port: 55123,
        dst_port: 80,
        protocol: "tcp",
        length: 120,
        tcp_flags: "S",
      };

      const res = await fetch("http://localhost:5000/api/ips/inject-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (data.error) {
        console.error("Inject failed:", data.error);
      } else if (!res.ok) {
        console.error("Inject failed:", res.statusText);
      }

      await loadStatus();
      await loadEvents();
    } finally {
      setBusy(false);
    }
  };

  const totals = useMemo(() => {
    const a = status.actions || {};
    return (a.allow || 0) + (a.alert || 0) + (a.drop_packet || a.drop || 0) + (a.block_ip || a.block || 0);
  }, [status]);

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-cyan-300">Live Network Traffic Dashboard</h1>
            <p className="text-sm text-slate-400">
              Captures local traffic, extracts NSL-KDD-like features, then runs Signature + AI + Zero-day pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={interfaceName}
              onChange={(e) => setInterfaceName(e.target.value)}
              className="px-3 py-2 rounded border border-slate-700 bg-slate-900 text-sm min-w-[220px]"
            >
              <option value="">Default interface (auto)</option>
              {interfaces.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              disabled={busy || status.running}
              onClick={startCapture}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold"
            >
              Start
            </button>
            <button
              disabled={busy || !status.running}
              onClick={stopCapture}
              className="px-4 py-2 rounded bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-sm font-semibold"
            >
              Stop
            </button>
            <button
              disabled={busy}
              onClick={injectTestPacket}
              className="px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-sm font-semibold"
            >
              Inject Test Packet
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Metric label="Capture Status" value={status.running ? "RUNNING" : "STOPPED"} accent={status.running ? "text-emerald-400" : "text-rose-400"} />
          <Metric label="Processed" value={String(status.processed_packets || 0)} />
          <Metric label="Blocked IP" value={String(status.actions?.block_ip || 0)} accent="text-rose-300" />
          <Metric label="Dropped" value={String(status.actions?.drop_packet || status.actions?.drop || 0)} accent="text-amber-300" />
          <Metric label="Alerts" value={String(status.actions?.alert || 0)} accent="text-cyan-300" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Metric
            label="Enforcement Runtime"
            value={status.enforcement?.runtime_ok ? "READY" : "NOT READY"}
            accent={status.enforcement?.runtime_ok ? "text-emerald-300" : "text-rose-300"}
          />
          <Metric
            label="Total Enforced"
            value={String(status.enforcement?.total_enforced || 0)}
            accent="text-cyan-300"
          />
          <Metric
            label="Enforcement Failures"
            value={String(status.enforcement?.failed_enforcements || 0)}
            accent="text-amber-300"
          />
          <Metric
            label="Active Temp Rules"
            value={String(status.enforcement?.active_ephemeral_rules || 0)}
            accent="text-violet-300"
          />
        </section>

        {!status.enforcement?.runtime_ok ? (
          <div className="p-3 rounded border border-amber-500/50 bg-amber-900/20 text-amber-200 text-xs">
            Enforcement runtime message: {status.enforcement?.runtime_message || "unknown"}
          </div>
        ) : null}

        {/* <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Metric
            label="Signature Mode"
            value={String(status.signature?.mode || "fallback_rules_v2")}
            accent="text-emerald-300"
          />
          <Metric
            label="Rule Hits"
            value={String(status.signature?.rule_hit_count || 0)}
          />
          <Metric
            label="Critical Rule Hits"
            value={String(status.signature?.critical_rule_hits || 0)}
            accent="text-rose-300"
          />
        </section> */}

        {status.capture_error ? (
          <div className="p-3 rounded border border-rose-500/50 bg-rose-900/20 text-rose-300 text-sm">
            Capture error: {status.capture_error}
          </div>
        ) : null}

        {/* {!status.running ? (
          <div className="p-3 rounded border border-amber-500/40 bg-amber-900/20 text-amber-200 text-sm">
            If live capture stays stopped on Windows, run backend as Administrator and ensure Npcap is installed.
          </div>
        ) : null} */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-sm text-slate-300 flex items-center justify-between">
              <span>Pipeline Events</span>
              <span className="text-xs text-slate-500">{events.length} shown</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-800">
              {events.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">No events yet. Start capture or inject packets.</div>
              ) : (
                events.map((event, idx) => (
                  <EventRow key={idx} event={event} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h2 className="text-sm text-slate-300 font-semibold">Action Summary</h2>
            <div className="text-3xl font-bold text-cyan-300">{totals}</div>
            <p className="text-xs text-slate-500">Total IPS decisions made</p>

            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Blocklisted IPs</h3>
              {status.blocklisted_ips?.length ? (
                <div className="space-y-1">
                  {status.blocklisted_ips.map((ip) => (
                    <div key={ip} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300">
                      {ip}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No blocklisted IPs yet</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = "text-cyan-200" }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function EventRow({ event }) {
  const packet = event.packet || {};
  const signature = event.signature || {};
  const ml = event.ml || {};
  const zero = event.zero_day || {};
  const decision = event.decision || {};
  const enforcement = event.enforcement || {};
  const source = packet.traffic_source || {};

  const actionColor = {
    allow: "text-emerald-300",
    alert: "text-cyan-300",
    drop: "text-amber-300",
    drop_packet: "text-amber-300",
    block: "text-rose-300",
    block_ip: "text-rose-300",
  }[decision.action] || "text-slate-200";

  return (
    <div className="p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-slate-300">
          {(packet.src_ip || "n/a")}:{packet.src_port || "-"} {"->"} {(packet.dst_ip || "n/a")}:{packet.dst_port || "-"}
        </div>
        <div className={`font-semibold uppercase tracking-wide ${actionColor}`}>{decision.action || "allow"}</div>
      </div>

      <div className="mt-1 text-xs text-slate-500">
        Source: {source.direction || "unknown"} | Remote: {source.remote_ip || "n/a"} ({source.remote_host || "unknown"})
      </div>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-slate-400">
        <div>Signature: {signature.is_match ? `${signature.severity} (${(signature.matches || []).join(",")})` : "none"}</div>
        <div>AI: {ml.attack_type || "normal"} ({ml.confidence || 0}%)</div>
        <div>Zero-Day: {zero.is_zero_day ? "Yes" : "No"} ({zero.anomaly_score || 0})</div>
        <div>Risk: {decision.risk || 0}</div>
      </div>

      <div className="mt-1 text-xs text-slate-500">Signature engine: {signature.engine || "fallback"}</div>

      <div className="mt-1 text-xs text-slate-500">
        Enforcement: {enforcement.status || "n/a"}
        {enforcement.rule_name ? ` | Rule: ${enforcement.rule_name}` : ""}
        {enforcement.details ? ` | ${enforcement.details}` : ""}
      </div>

      <div className="mt-1 text-xs text-slate-500">{event.timestamp}</div>
    </div>
  );
}
