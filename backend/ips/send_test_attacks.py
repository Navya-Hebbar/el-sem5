"""Safe IPS attack simulator for local testing.

This script sends synthetic packets to /api/ips/inject-packet so you can validate:
- Signature engine triggering
- AI model behavior on attack-like feature patterns
- Zero-day anomaly scoring after warmup

It does NOT transmit real attack traffic on the network.
"""

import argparse
import random
import time
from datetime import datetime

import requests


def _post(session, url, payload, timeout=20, retries=3):
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            res = session.post(url, json=payload, timeout=timeout)
            res.raise_for_status()
            data = res.json()
            return data.get("event", {})
        except requests.exceptions.RequestException as exc:
            last_exc = exc
            if attempt < retries:
                time.sleep(0.2 * attempt)
            else:
                raise last_exc


def _status(session, url, timeout=10):
    res = session.get(url, timeout=timeout)
    res.raise_for_status()
    return res.json()


def _build_packet(src_ip, dst_ip, src_port, dst_port, protocol="tcp", tcp_flags="S", length=100, extra=None):
    pkt = {
        "timestamp": datetime.utcnow().isoformat(),
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": int(src_port),
        "dst_port": int(dst_port),
        "protocol": protocol,
        "tcp_flags": tcp_flags,
        "length": int(length),
    }
    if extra:
        pkt.update(extra)
    return pkt


def send_baseline(session, base_url, count, src_ip, dst_ip, request_timeout, pace_sec):
    inject_url = f"{base_url}/api/ips/inject-packet"
    print(f"[1/4] Sending baseline traffic: {count} packets")

    for i in range(count):
        pkt = _build_packet(
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=40000 + (i % 1000),
            dst_port=443,
            tcp_flags="A",
            length=120,
        )
        _post(session, inject_url, pkt, timeout=request_timeout)
        if pace_sec > 0:
            time.sleep(pace_sec)


def send_syn_flood_like(session, base_url, count, src_ip, dst_ip, request_timeout, pace_sec):
    inject_url = f"{base_url}/api/ips/inject-packet"
    print(f"[2/4] Sending SYN-flood-like burst: {count} packets")

    last_event = None
    for i in range(count):
        pkt = _build_packet(
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=50000 + (i % 1000),
            dst_port=443,
            tcp_flags="S",
            length=64,
            extra={
                "src_bytes": 0,
                "dst_bytes": 0,
                "wrong_fragment": 1 if i % 7 == 0 else 0,
            },
        )
        last_event = _post(session, inject_url, pkt, timeout=request_timeout)
        if pace_sec > 0:
            time.sleep(pace_sec)

    if last_event:
        decision = last_event.get("decision", {})
        sig = last_event.get("signature", {})
        print(
            f"  last decision={decision.get('action')} risk={decision.get('risk')} "
            f"signature={sig.get('matches')}"
        )


def send_sensitive_port_scan(session, base_url, count, src_ip, dst_ip, request_timeout, pace_sec):
    inject_url = f"{base_url}/api/ips/inject-packet"
    print(f"[3/4] Sending scan-like traffic over sensitive ports: {count} packets")

    sensitive_ports = [22, 23, 445, 3389]
    for i in range(count):
        pkt = _build_packet(
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=52000 + (i % 1000),
            dst_port=sensitive_ports[i % len(sensitive_ports)],
            tcp_flags="S",
            length=70,
            extra={
                "num_failed_logins": 5 if i % 3 == 0 else 0,
                "hot": 8 if i % 5 == 0 else 0,
                "num_compromised": 3 if i % 4 == 0 else 0,
            },
        )
        _post(session, inject_url, pkt, timeout=request_timeout)
        if pace_sec > 0:
            time.sleep(pace_sec)


def send_zero_day_like(session, base_url, count, src_ip, dst_ip, request_timeout, pace_sec):
    inject_url = f"{base_url}/api/ips/inject-packet"
    print(f"[4/4] Sending anomaly-heavy packets: {count} packets")

    for i in range(count):
        pkt = _build_packet(
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=53000 + (i % 1000),
            dst_port=random.choice([53, 123, 8080, 9000, 1883]),
            protocol=random.choice(["tcp", "udp"]),
            tcp_flags=random.choice(["S", "R", "F", "S" ]),
            length=random.randint(48, 1500),
            extra={
                "src_bytes": random.choice([0, 1, 2048, 8192, 65535]),
                "dst_bytes": random.choice([0, 1, 4096, 16384, 131072]),
                "wrong_fragment": random.choice([0, 0, 2, 3]),
                "urgent": random.choice([0, 0, 1]),
                "hot": random.choice([0, 0, 12, 20]),
                "num_failed_logins": random.choice([0, 0, 6, 12]),
                "num_compromised": random.choice([0, 0, 10, 30]),
                "root_shell": random.choice([0, 1]),
                "su_attempted": random.choice([0, 1]),
                "num_root": random.choice([0, 0, 20]),
                "num_shells": random.choice([0, 0, 4]),
                "num_access_files": random.choice([0, 0, 5]),
                "is_guest_login": random.choice([0, 1]),
            },
        )
        _post(session, inject_url, pkt, timeout=request_timeout)
        if pace_sec > 0:
            time.sleep(pace_sec)


def run_scenario(base_url, src_ip, dst_ip, baseline_count, syn_count, scan_count, anomaly_count, pause_sec, request_timeout, pace_sec):
    print("Starting synthetic IPS attack test scenario...")
    with requests.Session() as session:
        before = _status(session, f"{base_url}/api/ips/status")
        print(f"Before: processed={before.get('processed_packets')} actions={before.get('actions')}")

        send_baseline(session, base_url, baseline_count, src_ip, dst_ip, request_timeout, pace_sec)
        if pause_sec:
            time.sleep(pause_sec)

        send_syn_flood_like(session, base_url, syn_count, src_ip, dst_ip, request_timeout, pace_sec)
        if pause_sec:
            time.sleep(pause_sec)

        send_sensitive_port_scan(session, base_url, scan_count, src_ip, dst_ip, request_timeout, pace_sec)
        if pause_sec:
            time.sleep(pause_sec)

        send_zero_day_like(session, base_url, anomaly_count, src_ip, dst_ip, request_timeout, pace_sec)

        after = _status(session, f"{base_url}/api/ips/status")
        print(f"After:  processed={after.get('processed_packets')} actions={after.get('actions')}")
        print("Done. Open Live IPS Receiver tab to inspect decisions and evidence.")


def main():
    parser = argparse.ArgumentParser(description="Send safe synthetic attack-like packets into local IPS API.")
    parser.add_argument("--base-url", default="http://localhost:5000", help="Backend base URL")
    parser.add_argument("--src-ip", default="198.51.100.10", help="Synthetic source IP")
    parser.add_argument("--dst-ip", default="10.54.33.175", help="Target/local IP")
    parser.add_argument("--baseline", type=int, default=70, help="Baseline warmup packet count")
    parser.add_argument("--syn", type=int, default=80, help="SYN-like burst packet count")
    parser.add_argument("--scan", type=int, default=60, help="Sensitive-port scan packet count")
    parser.add_argument("--anomaly", type=int, default=80, help="Anomaly-heavy packet count")
    parser.add_argument("--pause", type=float, default=0.2, help="Pause seconds between phases")
    parser.add_argument("--request-timeout", type=float, default=20.0, help="HTTP request timeout seconds")
    parser.add_argument("--pace", type=float, default=0.01, help="Per-packet pacing seconds")
    args = parser.parse_args()

    run_scenario(
        base_url=args.base_url,
        src_ip=args.src_ip,
        dst_ip=args.dst_ip,
        baseline_count=args.baseline,
        syn_count=args.syn,
        scan_count=args.scan,
        anomaly_count=args.anomaly,
        pause_sec=args.pause,
        request_timeout=args.request_timeout,
        pace_sec=args.pace,
    )


if __name__ == "__main__":
    main()
