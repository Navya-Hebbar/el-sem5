import { useEffect, useState } from "react";
import { io } from "socket.io-client";
//import ChatbotWidget from "../components/ChatbotWidget";
import AttackDistribution from "../components/AttackDistribution";
import AttackTypeInfo from "../components/AttackTypeInfo";
import MLFeaturesInfo from "../components/MLFeaturesInfo";

const socket = io("http://localhost:5000");

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    packets_per_sec: 0,
    active_sessions: 0,
    attack_count: 0,
    total_packets: 0,
  });
  const [latestDecision, setLatestDecision] = useState(null);

  const normalizeAction = (action) => {
    const value = String(action || "allow").toLowerCase();
    if (value === "drop_packet" || value === "drop") return "DROP";
    if (value === "block_ip" || value === "block") return "BLOCK";
    if (value === "alert") return "ALERT";
    return "ALLOW";
  };

  const actionColor = (action) => {
    const normalized = normalizeAction(action);
    if (normalized === "BLOCK") return "text-rose-400";
    if (normalized === "DROP") return "text-amber-300";
    if (normalized === "ALERT") return "text-cyan-300";
    return "text-emerald-400";
  };

  useEffect(() => {
    // Fetch initial stats
    fetch("http://localhost:5000/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setMetrics({
          packets_per_sec: data.packets_per_sec,
          active_sessions: data.active_sessions,
          attack_count: data.attack_count,
          total_packets: data.total_packets,
        });
      })
      .catch((err) => console.error("Error fetching stats:", err));

    // Listen for real-time stats updates
    socket.on("stats_update", (data) => {
      setMetrics({
        packets_per_sec: data.packets_per_sec,
        active_sessions: data.active_sessions,
        attack_count: data.attack_count,
        total_packets: data.total_packets,
      });
    });

    // Fetch latest IPS event (if available) to fill right-side detection summary.
    fetch("http://localhost:5000/api/ips/events?limit=1")
      .then((res) => res.json())
      .then((payload) => {
        const ev = payload?.events?.[0];
        if (ev) {
          setLatestDecision({
            anomalyType: ev?.ml?.attack_type || "normal",
            aiScore: ev?.ml?.confidence ?? 0,
            action: ev?.decision?.action || "allow",
            risk: ev?.decision?.risk ?? 0,
            zeroDayScore: ev?.zero_day?.anomaly_score ?? 0,
            updatedAt: ev?.timestamp,
          });
        }
      })
      .catch(() => {});

    // Live IPS decision stream.
    socket.on("ips_event", (ev) => {
      setLatestDecision({
        anomalyType: ev?.ml?.attack_type || "normal",
        aiScore: ev?.ml?.confidence ?? 0,
        action: ev?.decision?.action || "allow",
        risk: ev?.decision?.risk ?? 0,
        zeroDayScore: ev?.zero_day?.anomaly_score ?? 0,
        updatedAt: ev?.timestamp,
      });
    });

    return () => {
      socket.off("stats_update");
      socket.off("ips_event");
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-black via-slate-900 to-black text-white p-6 flex flex-col">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-widest text-cyan-400">
          AnomalyX Monitor
        </h1>
        <span className="flex items-center gap-2 text-sm text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
          LIVE
        </span>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-4 overflow-hidden" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
        {/* LEFT - STATS & CHARTS */}
        <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden" style={{ minHeight: 0 }}>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            <LiveMetric
              label="Packets/sec"
              value={metrics.packets_per_sec}
            />
            <LiveMetric
              label="Total Packets"
              value={metrics.total_packets}
            />
            <LiveMetric
              label="Active Sessions"
              value={metrics.active_sessions}
            />
            <LiveMetric
              label="Attacks"
              value={metrics.attack_count}
              alert
            />
          </div>

          {/* Attack Distribution Pie Chart */}
          <div className="flex-1 min-h-0 overflow-hidden" style={{ minHeight: 0 }}>
            <AttackDistribution />
          </div>
        </div>

        {/* CENTER - ATTACK LOGS */}
        <div className="col-span-5 flex flex-col gap-4 h-full overflow-hidden" style={{ minHeight: 0 }}>
          <div className="flex-1 min-h-0 overflow-hidden h-full" style={{ minHeight: 0 }}>
            <AttackTypeInfo />
          </div>
        </div>

        {/* RIGHT - LIVE DATA */}
        <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden" style={{ minHeight: 0 }}>
          <div className="rounded-2xl border border-cyan-500/30 bg-white/5 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(0,255,255,0.15)] flex-1 overflow-auto h-full">
            <h2 className="text-xl font-semibold text-cyan-300 mb-4">
              Network Statistics
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <StatCard
                title="Attack Rate"
                value={
                  metrics.total_packets > 0
                    ? (
                        ((metrics.attack_count / metrics.total_packets) * 100).toFixed(
                          2
                        )
                      )
                    : "0"
                }
                unit="%"
                color="text-red-400"
              />
              <StatCard
                title="System Status"
                value="OPERATIONAL"
                unit=""
                color="text-green-400"
              />
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm text-gray-400 mb-3">Recent Activity</h3>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span className="text-cyan-300">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-sm text-gray-400 mb-3">Latest Detection Decision</h3>
              {latestDecision ? (
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Anomaly Type:</span>
                    <span className="text-cyan-300 uppercase font-semibold">
                      {latestDecision.anomalyType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Score:</span>
                    <span className="text-cyan-300">{Number(latestDecision.aiScore).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zero-Day Score:</span>
                    <span className="text-cyan-300">{Number(latestDecision.zeroDayScore).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk:</span>
                    <span className="text-cyan-300">{Number(latestDecision.risk).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classification:</span>
                    <span className={`font-bold ${actionColor(latestDecision.action)}`}>
                      {normalizeAction(latestDecision.action)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decision Time:</span>
                    <span className="text-cyan-300">
                      {latestDecision.updatedAt ? new Date(latestDecision.updatedAt).toLocaleTimeString() : "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No IPS decisions yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* <ChatbotWidget /> */}
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

const LiveMetric = ({ label, value, alert }) => (
  <div
    className={`rounded-xl p-3 border ${
      alert
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
    }`}
  >
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const StatCard = ({ title, value, unit, color }) => (
  <div className="rounded-lg border border-gray-700/50 bg-gray-800/20 p-4">
    <p className="text-xs text-gray-400 mb-2">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>
      {value}
      <span className="text-lg">{unit}</span>
    </p>
  </div>
);
