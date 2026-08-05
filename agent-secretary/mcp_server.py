#!/usr/bin/env python
"""
MCP (Model Context Protocol) Server untuk Agent-Secretary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON-RPC 2.0 over stdio — tanpa dependency eksternal.
Menjembatani Claude Code dengan Agent-Secretary API di port 8000.

Tools:
  - secretary_recent_events  →  GET  /notulensi/terakhir
  - secretary_filter_events  →  GET  /notulensi/filter
  - secretary_rollback       →  POST /notulensi/rollback
"""

import json
import sys
import urllib.request
import urllib.error

API_BASE = "http://127.0.0.1:8000"

# ── HTTP Helpers ──────────────────────────────────────────
def api_get(endpoint, params=None):
    """GET request ke Agent-Secretary API."""
    url = f"{API_BASE}{endpoint}"
    if params:
        query_parts = []
        for k, v in params.items():
            if v is not None:
                query_parts.append(f"{k}={urllib.request.quote(str(v))}")
        if query_parts:
            url += "?" + "&".join(query_parts)
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else str(e)
        return {"error": True, "status": e.code, "detail": body}
    except Exception as e:
        return {"error": True, "detail": str(e)}

def api_post(endpoint, body):
    """POST request ke Agent-Secretary API."""
    url = f"{API_BASE}{endpoint}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else str(e)
        return {"error": True, "status": e.code, "detail": body}
    except Exception as e:
        return {"error": True, "detail": str(e)}

# ── MCP JSON-RPC Handlers ─────────────────────────────────
def handle_initialize(_params):
    """MCP initialize — return server capabilities."""
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "tools": {}
        },
        "serverInfo": {
            "name": "agent-secretary",
            "version": "1.5.0"
        }
    }

def handle_tools_list(_params):
    """Return daftar MCP tools."""
    return {
        "tools": [
            {
                "name": "secretary_recent_events",
                "description": "Ambil N event terakhir dari Agent-Secretary (perubahan file di repo). Gunakan untuk menjawab pertanyaan seperti 'apa yang terjadi?' atau 'apa yang berubah akhir-akhir ini?'",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Jumlah event terakhir yang diambil (default 10, maks 100)",
                            "default": 10,
                            "minimum": 1,
                            "maximum": 100
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "secretary_filter_events",
                "description": "Filter event Agent-Secretary berdasarkan menit terakhir dan/atau kata kunci di nama file. Gunakan saat user bertanya 'apa yang terjadi X menit lalu?' atau 'apa yang berubah di file Y?'",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "minutes": {
                            "type": "integer",
                            "description": "Filter event dalam N menit terakhir (contoh: 5 untuk 5 menit terakhir)",
                            "minimum": 1
                        },
                        "keyword": {
                            "type": "string",
                            "description": "Filter event yang nama file-nya mengandung kata kunci ini (case-insensitive)"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "secretary_rollback",
                "description": "Rollback file ke versi backup sebelumnya. Gunakan dengan hati-hati — ini menimpa file dengan versi dari shadow backup.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "target_file": {
                            "type": "string",
                            "description": "Path relatif file yang ingin di-rollback (contoh: 'src/app.ts')"
                        },
                        "timestamp": {
                            "type": "string",
                            "description": "Timestamp tujuan rollback (format: YYYY-MM-DD HH:MM:SS). Kosongkan untuk restore ke backup terbaru."
                        }
                    },
                    "required": ["target_file"]
                }
            }
        ]
    }

def handle_tools_call(params):
    """Eksekusi MCP tool call."""
    tool_name = params.get("name", "")
    arguments = params.get("arguments", {})

    try:
        if tool_name == "secretary_recent_events":
            limit = arguments.get("limit", 10)
            data = api_get("/notulensi/terakhir", {"limit": limit})
            return format_tool_result(data)

        elif tool_name == "secretary_filter_events":
            minutes = arguments.get("minutes")
            keyword = arguments.get("keyword")
            data = api_get("/notulensi/filter", {"menit": minutes, "kata_kunci": keyword})
            return format_tool_result(data)

        elif tool_name == "secretary_rollback":
            body = {
                "target_file": arguments.get("target_file", ""),
                "rollback_to_timestamp": arguments.get("timestamp", "")
            }
            data = api_post("/notulensi/rollback", body)
            return format_tool_result(data)

        else:
            return {
                "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}],
                "isError": True
            }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Error executing {tool_name}: {str(e)}"}],
            "isError": True
        }

def format_tool_result(data):
    """Format API response jadi MCP tool result content."""
    text = json.dumps(data, ensure_ascii=False, indent=2)
    return {
        "content": [{"type": "text", "text": text}]
    }

# ── Main JSON-RPC Loop ────────────────────────────────────
METHOD_MAP = {
    "initialize": handle_initialize,
    "tools/list": handle_tools_list,
    "tools/call": handle_tools_call,
}

def send_response(id_, result):
    """Kirim JSON-RPC response ke stdout."""
    response = {"jsonrpc": "2.0", "id": id_, "result": result}
    sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def send_error(id_, code, message):
    """Kirim JSON-RPC error ke stdout."""
    response = {
        "jsonrpc": "2.0",
        "id": id_,
        "error": {"code": code, "message": message}
    }
    sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def main():
    # Kirim log startup ke stderr agar tidak mengganggu stdio protocol
    print("MCP Agent-Secretary Server v1.5.0 — ready", file=sys.stderr)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            continue

        req_id = request.get("id")
        method = request.get("method", "")
        params = request.get("params", {})

        # notifications (no id) — skip, tidak perlu response
        if req_id is None:
            if method == "notifications/initialized":
                print("Client initialized", file=sys.stderr)
            continue

        handler = METHOD_MAP.get(method)
        if handler:
            try:
                result = handler(params)
                send_response(req_id, result)
            except Exception as e:
                send_error(req_id, -32603, f"Handler error: {str(e)}")
        else:
            send_error(req_id, -32601, f"Method not found: {method}")

if __name__ == "__main__":
    main()
