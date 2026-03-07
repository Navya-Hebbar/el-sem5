import ctypes
import json
import os
import platform
import subprocess
import threading
import time
from datetime import datetime


class IPSEnforcer:
    """Applies IPS decisions to host firewall and logs enforcement actions."""

    def __init__(self):
        self.platform = platform.system().lower()
        self.enabled = os.getenv("IPS_ENFORCEMENT_ENABLED", "1") == "1"
        self.drop_ttl_sec = int(os.getenv("IPS_DROP_TTL_SEC", "120"))
        self.block_ttl_sec = int(os.getenv("IPS_BLOCK_TTL_SEC", "3600"))

        self._lock = threading.Lock()
        self._ephemeral_rules = {}
        self._total_enforced = 0
        self._failed_enforcements = 0

        self.log_path = os.path.join(os.path.dirname(__file__), "enforcement_actions.log")
        self.last_result = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": "init",
            "status": "ready",
            "details": "enforcer_initialized",
        }

    def _is_windows_admin(self):
        try:
            return bool(ctypes.windll.shell32.IsUserAnAdmin())
        except Exception:
            return False

    def _append_log(self, payload):
        line = json.dumps(payload, separators=(",", ":"))
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    def _run(self, args, timeout=10):
        completed = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return {
            "ok": completed.returncode == 0,
            "returncode": completed.returncode,
            "stdout": (completed.stdout or "").strip()[:500],
            "stderr": (completed.stderr or "").strip()[:500],
            "command": " ".join(args),
        }

    def _rule_name(self, action, remote_ip):
        safe_ip = str(remote_ip).replace(":", "_").replace(".", "_")
        return f"IPS_{action.upper()}_{safe_ip}"

    def _add_windows_block_rule(self, rule_name, remote_ip):
        cmd = [
            "netsh", "advfirewall", "firewall", "add", "rule",
            f"name={rule_name}",
            "dir=out",
            "action=block",
            f"remoteip={remote_ip}",
            "enable=yes",
        ]
        return self._run(cmd)

    def _delete_windows_rule(self, rule_name):
        cmd = [
            "netsh", "advfirewall", "firewall", "delete", "rule",
            f"name={rule_name}",
        ]
        return self._run(cmd)

    def _cleanup_expired_rules(self):
        now = time.time()
        expired = []
        with self._lock:
            for rule_name, expiry_ts in list(self._ephemeral_rules.items()):
                if now >= expiry_ts:
                    expired.append(rule_name)
            for rule_name in expired:
                self._ephemeral_rules.pop(rule_name, None)

        for rule_name in expired:
            self._delete_windows_rule(rule_name)

    def _validate_runtime(self):
        if not self.enabled:
            return False, "enforcement_disabled"

        if self.platform != "windows":
            return False, "unsupported_platform"

        if not self._is_windows_admin():
            return False, "administrator_required"

        probe = self._run(["netsh", "advfirewall", "show", "allprofiles"])
        if not probe["ok"]:
            return False, "netsh_unavailable"

        return True, "ok"

    def enforce(self, decision, packet):
        self._cleanup_expired_rules()

        action = str(decision.get("action", "allow") or "allow").lower()
        remote_ip = packet.get("traffic_source", {}).get("remote_ip") or packet.get("dst_ip") or packet.get("src_ip")

        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "remote_ip": remote_ip,
            "status": "no_action",
            "details": "not_required",
            "rule_name": None,
            "applied": False,
        }

        if action in {"allow", "alert"}:
            self.last_result = result
            self._append_log(result)
            return result

        runtime_ok, runtime_msg = self._validate_runtime()
        if not runtime_ok:
            result.update({"status": "failed", "details": runtime_msg})
            self._failed_enforcements += 1
            self.last_result = result
            self._append_log(result)
            return result

        if not remote_ip:
            result.update({"status": "failed", "details": "missing_remote_ip"})
            self._failed_enforcements += 1
            self.last_result = result
            self._append_log(result)
            return result

        if action not in {"drop_packet", "block_ip"}:
            result.update({"status": "failed", "details": f"unsupported_action:{action}"})
            self._failed_enforcements += 1
            self.last_result = result
            self._append_log(result)
            return result

        ttl = self.drop_ttl_sec if action == "drop_packet" else self.block_ttl_sec
        rule_name = self._rule_name(action, remote_ip)
        apply_result = self._add_windows_block_rule(rule_name, remote_ip)

        if apply_result["ok"]:
            if action == "drop_packet":
                with self._lock:
                    self._ephemeral_rules[rule_name] = time.time() + max(5, ttl)
            result.update(
                {
                    "status": "applied",
                    "details": "firewall_rule_added",
                    "rule_name": rule_name,
                    "applied": True,
                    "ttl_sec": ttl,
                    "command": apply_result["command"],
                }
            )
            self._total_enforced += 1
        else:
            result.update(
                {
                    "status": "failed",
                    "details": "firewall_rule_add_failed",
                    "rule_name": rule_name,
                    "applied": False,
                    "command": apply_result["command"],
                    "stderr": apply_result.get("stderr"),
                }
            )
            self._failed_enforcements += 1

        self.last_result = result
        self._append_log(result)
        return result

    def status(self):
        runtime_ok, runtime_msg = self._validate_runtime()
        with self._lock:
            active_ephemeral = len(self._ephemeral_rules)

        return {
            "enabled": self.enabled,
            "platform": self.platform,
            "runtime_ok": runtime_ok,
            "runtime_message": runtime_msg,
            "total_enforced": self._total_enforced,
            "failed_enforcements": self._failed_enforcements,
            "active_ephemeral_rules": active_ephemeral,
            "last_result": self.last_result,
            "log_path": self.log_path,
        }

    def tail_logs(self, limit=50):
        if not os.path.exists(self.log_path):
            return []

        with open(self.log_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()[-max(1, int(limit)):]

        parsed = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            try:
                parsed.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return parsed
