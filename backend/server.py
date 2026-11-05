#!/usr/bin/env python3
"""
🏦 VulnBank Wear OS — Local Pentest Backend
===========================================
Lightweight, zero-dependency Python Flask backend designed for local smartwatch
and mobile banking penetration testing demonstrations.

Key Pentest Vulnerabilities Implemented:
  1. SQL Injection on POST /login (raw string concatenation query)
  2. BOLA / IDOR on GET /check_balance/<acct> & GET /transactions/<acct>
  3. Business Logic Flaw on POST /transfer (negative amount increases balance)
  4. Unauthenticated Data Exfiltration on POST /debug/heart
  5. Information Disclosure on GET /debug/users & GET /sup3r_s3cr3t_admin
  6. Missing HMAC Request Signing & Anti-Tampering Validation
  7. Cross-Origin Resource Sharing (CORS: *)

Usage:
  python server.py
  (Runs on http://0.0.0.0:5000)

For Android Emulator: connect via http://10.0.2.2:5000
For Physical Smartwatch/Phone: connect via http://<YOUR_PC_IP>:5000
"""

import sqlite3
import json
import time
import os
import sys
from flask import Flask, request, jsonify

# Windows PowerShell UTF-8 fix
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), 'vulnbank.db')

# Hardcoded valid Master JWT (matches Secrets.java)
MASTER_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiaXNfYWRtaW4iOnRydWUsImlhdCI6MTc0NDk3NjIyM30.yXm-7iN-6sn3kvvXkOiOLVRHXSn6MBSpwbM2VcXVds8"

# ---------------------------------------------------------------------------
# CORS & Request Logger Middleware
# ---------------------------------------------------------------------------
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

@app.before_request
def log_request_info():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    print(f"\n📡 [\033[94m{request.method}\033[0m] {request.path}")
    auth = request.headers.get('Authorization')
    if auth:
        print(f"   🔑 Auth: {auth[:45]}...")
    if request.is_json and request.get_data():
        print(f"   📦 Payload: {request.get_json()}")

# ---------------------------------------------------------------------------
# Database Initialization
# ---------------------------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            account_number TEXT UNIQUE,
            balance REAL,
            is_admin INTEGER DEFAULT 0
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_account TEXT,
            to_account TEXT,
            amount REAL,
            description TEXT,
            timestamp TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS virtual_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            card_number TEXT,
            cvv TEXT,
            expiry_date TEXT,
            card_type TEXT,
            card_limit REAL,
            balance REAL,
            is_frozen INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS wearable_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT UNIQUE,
            device_type TEXT,
            device_name TEXT,
            pairing_code TEXT,
            paired_account TEXT,
            auth_token TEXT,
            last_seen TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS wearable_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_device_id TEXT,
            action TEXT,
            payload TEXT,
            status TEXT DEFAULT 'PENDING',
            created_at TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS wearable_packets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_device TEXT,
            target_device TEXT,
            action TEXT,
            payload TEXT,
            timestamp TEXT
        )
    ''')

    # Seed initial test data
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        print("🌱 Seeding initial vulnerable bank records...")
        cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('admin', 'admin123', 'ADMIN001', 999999.0, 1)")
        cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('bob', 'bob123', 'ACC_BOB88', 1420.50, 0)")
        cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('alice', 'alice123', 'ACC_ALICE12', 5200.0, 0)")

        # Initial transactions
        cur.execute("INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES ('ADMIN001', 'ACC_BOB88', 250.0, 'Payroll Bonus', datetime('now'))")
        cur.execute("INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES ('ACC_ALICE12', 'ADMIN001', 50.0, 'Coffee Reimbursement', datetime('now'))")

        # Initial virtual cards
        cur.execute("INSERT INTO virtual_cards (user_id, card_number, cvv, expiry_date, card_type, card_limit, balance, is_frozen, created_at) VALUES (1, '4532 8819 0021 9921', '921', '08/28', 'Titanium Wear OS', 5000.0, 1420.50, 0, datetime('now'))")
        cur.execute("INSERT INTO virtual_cards (user_id, card_number, cvv, expiry_date, card_type, card_limit, balance, is_frozen, created_at) VALUES (1, '5412 3310 9942 3349', '417', '11/29', 'Virtual NFC Tap', 1000.0, 250.0, 1, datetime('now'))")

        conn.commit()
    conn.close()

# ---------------------------------------------------------------------------
# 1. AUTHENTICATION & SQL INJECTION (V-10)
# ---------------------------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '')
    password = data.get('password', '')

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # INTENTIONALLY VULNERABLE: Direct string interpolation SQL Injection!
    # Exploit payload: username = "admin'--" or username = "' OR 1=1--"
    raw_query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    print(f"   🔍 \033[93mExecuted SQL Query:\033[0m {raw_query}")

    try:
        cur.execute(raw_query)
        user = cur.fetchone()
    except Exception as e:
        print(f"   ❌ SQL Error: {e}")
        return jsonify({"message": f"Database SQL Error: {str(e)}"}), 500
    finally:
        conn.close()

    if user:
        is_admin = bool(user['is_admin'])
        print(f"   ✅ Login successful for user: \033[92m{user['username']}\033[0m (Admin: {is_admin})")
        return jsonify({
            "message": "Login successful",
            "token": MASTER_JWT if is_admin else f"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.user_{user['id']}",
            "username": user['username'],
            "accountNumber": user['account_number'],
            "isAdmin": is_admin
        }), 200

    return jsonify({"message": "Invalid username or password"}), 401


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    acct_no = f"ACC_{username.upper()[:6]}{int(time.time()) % 1000}"
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, password, account_number, balance, is_admin) VALUES (?, ?, ?, 1000.0, 0)",
            (username, password, acct_no)
        )
        conn.commit()
        return jsonify({
            "message": "Account created successfully",
            "accountNumber": acct_no,
            "balance": 1000.0
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already exists"}), 409
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 2. CHECK BALANCE — BOLA / IDOR VULNERABILITY (V-10)
# ---------------------------------------------------------------------------
@app.route('/check_balance/<account_number>', methods=['GET'])
def check_balance(account_number):
    # INTENTIONALLY VULNERABLE: No token authorization check against account_number!
    # Any user can query anyone's balance.
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT username, account_number, balance FROM users WHERE account_number = ?", (account_number,))
    row = cur.fetchone()
    conn.close()

    if row:
        print(f"   💰 BOLA Access: Balance for {account_number} returned: ${row['balance']}")
        return jsonify({
            "accountNumber": row['account_number'],
            "balance": row['balance'],
            "currency": "USD"
        }), 200

    # Fallback default for demo accounts
    return jsonify({
        "accountNumber": account_number,
        "balance": 999999.00,
        "currency": "USD"
    }), 200

# ---------------------------------------------------------------------------
# 3. TRANSFER — NEGATIVE AMOUNT & LOGIC FLAW (V-10)
# ---------------------------------------------------------------------------
@app.route('/transfer', methods=['POST'])
def transfer():
    data = request.get_json() or {}
    from_acct = data.get('from_account', 'ADMIN001')
    to_acct = data.get('to_account', '')
    amount = float(data.get('amount', 0))
    desc = data.get('description', 'Wear OS Transfer')

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # INTENTIONALLY VULNERABLE: Negative amount allowed!
    # balance = balance - (-100) -> balance becomes +100!
    if amount < 0:
        print(f"   ⚠️ \033[91m[BUSINESS LOGIC EXPLOIT]\033[0m Negative transfer detected! Amount: {amount}")

    cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amount, from_acct))
    cur.execute("UPDATE users SET balance = balance + ? WHERE account_number = ?", (amount, to_acct))
    cur.execute(
        "INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES (?, ?, ?, ?, datetime('now'))",
        (from_acct, to_acct, amount, desc)
    )
    conn.commit()
    conn.close()

    print(f"   💸 Transfer Executed: ${amount} from {from_acct} to {to_acct}")
    return jsonify({
        "status": "success",
        "message": f"Successfully transferred ${amount} to {to_acct}",
        "reference": f"TX_{int(time.time())}"
    }), 200

# ---------------------------------------------------------------------------
# 4. TRANSACTIONS LIST — BOLA (V-10)
# ---------------------------------------------------------------------------
@app.route('/transactions/<account_number>', methods=['GET'])
def get_transactions(account_number):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM transactions WHERE from_account = ? OR to_account = ? ORDER BY id DESC LIMIT 20",
        (account_number, account_number)
    )
    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r['id'],
            "from_account": r['from_account'],
            "to_account": r['to_account'],
            "amount": r['amount'],
            "description": r['description'],
            "timestamp": r['timestamp']
        })

    return jsonify({"transactions": results}), 200

# ---------------------------------------------------------------------------
# 5. VIRTUAL CARDS API
# ---------------------------------------------------------------------------
@app.route('/api/virtual-cards', methods=['GET'])
def get_virtual_cards():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM virtual_cards")
    rows = cur.fetchall()
    conn.close()

    cards = []
    for r in rows:
        cards.append({
            "id": r['id'],
            "card_number": r['card_number'],
            "cvv": r['cvv'],
            "expiry_date": r['expiry_date'],
            "card_type": r['card_type'],
            "limit": r['card_limit'],
            "balance": r['balance'],
            "is_frozen": bool(r['is_frozen']),
            "created_at": r['created_at']
        })

    return jsonify({"cards": cards}), 200


@app.route('/api/virtual-cards/<int:card_id>/toggle-freeze', methods=['POST'])
def toggle_card_freeze(card_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE virtual_cards SET is_frozen = NOT is_frozen WHERE id = ?", (card_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": f"Card {card_id} freeze toggled"}), 200

# ---------------------------------------------------------------------------
# 6. WEARABLE HEALTH DATA EXFILTRATION (V-W04)
# ---------------------------------------------------------------------------
@app.route('/debug/heart', methods=['POST'])
def debug_heart():
    # INTENTIONALLY VULNERABLE: Unauthenticated telemetry exfiltration
    data = request.get_json() or {}
    print(f"\n❤️  \033[91m[V-W04 EXFILTRATION DETECTED]\033[0m POST /debug/heart")
    print(f"   Account: {data.get('account_number', 'UNKNOWN')}")
    print(f"   Readings Count: {len(data.get('readings', []))}")
    print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
    return jsonify({"status": "received", "logged_count": len(data.get('readings', []))}), 200

# ---------------------------------------------------------------------------
# 7. INFORMATION DISCLOSURE & CTF (V-02, V-10)
# ---------------------------------------------------------------------------
@app.route('/debug/users', methods=['GET'])
@app.route('/sup3r_s3cr3t_admin', methods=['GET'])
def debug_users():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT id, username, password, account_number, balance, is_admin FROM users")
    rows = cur.fetchall()
    conn.close()

    users = [dict(r) for r in rows]
    print(f"   ⚠️  \033[91m[INFO DISCLOSURE]\033[0m /debug/users dumped {len(users)} user credentials!")
    return jsonify({
        "debug_flag": "FLAG{HardcodedSecretsAreBad}",
        "total_users": len(users),
        "users": users
    }), 200


@app.route('/api/v2/forgot-password', methods=['POST'])
def forgot_password():
    # Weak PIN reset endpoint
    return jsonify({
        "status": "pin_sent",
        "message": "3-digit reset PIN sent to registered email (Vulnerable to brute-force 000-999)"
    }), 200

# ---------------------------------------------------------------------------
# 8. WEARABLE RELAY & LIVE DUAL-DEVICE BRIDGE (Pillar 2 + Pillar 5)
# ---------------------------------------------------------------------------
@app.route('/api/wearable/pair', methods=['POST'])
def wearable_pair():
    """
    Pairs a wearable device (Smartwatch) with an account using a 6-digit PIN.
    INTENTIONALLY VULNERABLE:
      - Accepts any 6-digit PIN (default 839-201 or any code)
      - Assigns admin privileges unconditionally without device authentication
      - Leaks Master JWT directly to wearable over plaintext HTTP
    """
    data = request.get_json() or {}
    pairing_code = data.get('pairing_code', '839-201').replace('-', '').strip()
    device_name = data.get('device_name', 'Wear OS Smartwatch')
    device_type = data.get('device_type', 'WEAR_OS_WATCH')
    account_number = data.get('account_number', 'ADMIN001')

    device_id = f"watch_{pairing_code[-4:] if len(pairing_code) >= 4 else '480x480'}"

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO wearable_devices (device_id, device_type, device_name, pairing_code, paired_account, auth_token, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(device_id) DO UPDATE SET
            device_name=excluded.device_name,
            last_seen=datetime('now'),
            paired_account=excluded.paired_account
    ''', (device_id, device_type, device_name, pairing_code, account_number, MASTER_JWT))
    conn.commit()
    conn.close()

    print(f"   ⌚ \033[92m[WEARABLE PAIRED]\033[0m Device: {device_name} (ID: {device_id}) -> Account: {account_number}")

    return jsonify({
        "status": "paired",
        "device_id": device_id,
        "device_name": device_name,
        "paired_account": account_number,
        "auth_token": MASTER_JWT,
        "message": "Smartwatch successfully linked to companion account"
    }), 200


@app.route('/api/wearable/devices', methods=['GET'])
def get_wearable_devices():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM wearable_devices ORDER BY last_seen DESC")
    rows = cur.fetchall()
    conn.close()
    return jsonify({"devices": [dict(r) for r in rows]}), 200


@app.route('/api/wearable/dispatch', methods=['POST'])
def wearable_dispatch():
    """
    Dispatches an event from smartphone companion to wearable smartwatch.
    INTENTIONALLY VULNERABLE:
      - No HMAC request signature
      - No anti-tampering or anti-replay timestamp verification
    """
    data = request.get_json() or {}
    target_device_id = data.get('target_device_id', 'watch_9201')
    action = data.get('action', 'SYNC_BALANCE')
    payload = data.get('payload', {})
    payload_str = json.dumps(payload) if isinstance(payload, dict) else str(payload)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO wearable_events (target_device_id, action, payload, status, created_at)
        VALUES (?, ?, ?, 'PENDING', datetime('now'))
    ''', (target_device_id, action, payload_str))
    event_id = cur.lastrowid

    # Log packet into sniffer table
    cur.execute('''
        INSERT INTO wearable_packets (source_device, target_device, action, payload, timestamp)
        VALUES ('SMARTPHONE_COMPANION', ?, ?, ?, datetime('now'))
    ''', (target_device_id, action, payload_str))

    conn.commit()
    conn.close()

    print(f"   📡 \033[93m[WEARABLE DISPATCH]\033[0m Action: {action} -> Target: {target_device_id} (Event #{event_id})")
    return jsonify({
        "status": "dispatched",
        "event_id": event_id,
        "target_device_id": target_device_id,
        "action": action
    }), 200


@app.route('/api/wearable/events/<device_id>', methods=['GET'])
def get_wearable_events(device_id):
    """
    Polls pending events for a specific smartwatch device.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Update last seen
    cur.execute("UPDATE wearable_devices SET last_seen = datetime('now') WHERE device_id = ?", (device_id,))

    # Fetch pending events (or also events targeted at 'all')
    cur.execute('''
        SELECT * FROM wearable_events 
        WHERE (target_device_id = ? OR target_device_id = 'all') AND status = 'PENDING'
        ORDER BY id ASC
    ''', (device_id,))
    rows = cur.fetchall()
    conn.commit()
    conn.close()

    events = []
    for r in rows:
        payload_obj = {}
        try:
            payload_obj = json.loads(r['payload'])
        except Exception:
            payload_obj = {"raw": r['payload']}

        events.append({
            "id": r['id'],
            "target_device_id": r['target_device_id'],
            "action": r['action'],
            "payload": payload_obj,
            "status": r['status'],
            "created_at": r['created_at']
        })

    return jsonify({"events": events, "count": len(events)}), 200


@app.route('/api/wearable/resolve-event', methods=['POST'])
def resolve_wearable_event():
    """
    Marks an event as resolved (e.g. 2FA approved or balance applied on watch).
    """
    data = request.get_json() or {}
    event_id = data.get('event_id')
    resolution = data.get('resolution', 'APPLIED')  # APPLIED, REJECTED

    if not event_id:
        return jsonify({"message": "event_id is required"}), 400

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT * FROM wearable_events WHERE id = ?", (event_id,))
    ev = cur.fetchone()
    if not ev:
        conn.close()
        return jsonify({"message": "Event not found"}), 404

    cur.execute("UPDATE wearable_events SET status = ? WHERE id = ?", (resolution, event_id))

    # If action was UPDATE_BALANCE, also update the database balance
    if ev['action'] == 'UPDATE_BALANCE' and resolution == 'APPLIED':
        try:
            p = json.loads(ev['payload'])
            amt = float(p.get('amount', 0))
            cur.execute("UPDATE users SET balance = ? WHERE account_number = 'ADMIN001'", (amt,))
        except Exception as e:
            print(f"Error updating balance on resolve: {e}")
    elif ev['action'] == 'QRIS_PAYMENT_COMPLETED' and resolution == 'APPLIED':
        try:
            p = json.loads(ev['payload'])
            amt = float(p.get('amount', 75.0))
            merchant = p.get('merchant', 'VULNBANK MERCH 001')
            cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = 'ADMIN001'", (amt,))
            cur.execute('''
                INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
                VALUES ('ADMIN001', ?, ?, 'Dynamic SNAP QRIS Wearable Checkout', datetime('now'))
            ''', (merchant, amt))
            print(f"   💳 \033[92m[QRIS PAYMENT DEBITED]\033[0m -$ {amt:.2f} at {merchant}")
        except Exception as e:
            print(f"Error executing QRIS debit on resolve: {e}")

    # Log response packet
    cur.execute('''
        INSERT INTO wearable_packets (source_device, target_device, action, payload, timestamp)
        VALUES (?, 'SMARTPHONE_COMPANION', ?, ?, datetime('now'))
    ''', (ev['target_device_id'], f"RESOLVE_{ev['action']}", json.dumps({"resolution": resolution, "event_id": event_id})))

    conn.commit()
    conn.close()

    print(f"   ✅ \033[92m[EVENT RESOLVED]\033[0m Event #{event_id} ({ev['action']}) -> Status: {resolution}")
    return jsonify({
        "status": "resolved",
        "event_id": event_id,
        "resolution": resolution
    }), 200


@app.route('/api/wearable/packets', methods=['GET'])
def get_wearable_packets():
    """
    Exposes raw unencrypted BLE/Wearable sync packets.
    Used by pentester to demonstrate sniffing, MITM, and packet replay.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM wearable_packets ORDER BY id DESC LIMIT 50")
    rows = cur.fetchall()
    conn.close()

    return jsonify({
        "total_packets": len(rows),
        "packets": [dict(r) for r in rows]
    }), 200

# ---------------------------------------------------------------------------
# 9. CISO REGULATORY & COMPLIANCE SCORECARD (POJK 11, SNAP QRIS, PCI-DSS)
# ---------------------------------------------------------------------------
@app.route('/api/compliance/report', methods=['GET'])
def get_compliance_report():
    return jsonify({
        "overall_score": 24,
        "rating": "CRITICAL RISK (AUDIT FAILED)",
        "audit_timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "frameworks": [
            {
                "standard": "OJK POJK 11/POJK.03/2022",
                "clause": "Pasal 38 & 39 (Perlindungan Data Nasabah)",
                "status": "NON-COMPLIANT",
                "finding": "Kredensial dan PIN tersimpan di plaintext SharedPreferences & SQLite tanpa enkripsi."
            },
            {
                "standard": "OJK POJK 11/POJK.03/2022",
                "clause": "Pasal 42 (Pencegahan Serangan Siber)",
                "status": "NON-COMPLIANT",
                "finding": "Client-side root & tamper detection dapat dimanipulasi dengan 1-line script hooking."
            },
            {
                "standard": "Bank Indonesia SNAP QRIS",
                "clause": "PADG No. 24/1/PADG/2022 (Integritas Transaksi QRIS)",
                "status": "NON-COMPLIANT",
                "finding": "QRIS payment token tidak memiliki cryptographic TOTP timestamp freshness (Replayable)."
            },
            {
                "standard": "PCI-DSS v4.0",
                "clause": "Requirement 3 & 4 (Cardholder Data Protection)",
                "status": "FAILED",
                "finding": "Unencrypted wearable sync & unauthenticated broadcast receivers."
            },
            {
                "standard": "OWASP Mobile Top 10 (2024)",
                "clause": "M1, M3, M5, M8, M9",
                "status": "FAILED",
                "finding": "14 active high/critical vulnerabilities identified across 5 pillars."
            }
        ]
    }), 200

# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    init_db()
    print("""
    ================================================================
    🏦  VulnBank Wear OS — Local Pentest Backend (Flask)
    ================================================================
    ✓ Server running at: http://0.0.0.0:5000
    ✓ Localhost URL:     http://127.0.0.1:5000
    ✓ Emulator Alias:    http://10.0.2.2:5000
    
    Active Vulnerabilities:
      [!] SQL Injection:       POST /login (username="admin'--")
      [!] BOLA / IDOR:         GET /check_balance/<account_number>
      [!] Business Logic:      POST /transfer (negative amount increases money)
      [!] Info Disclosure:     GET /debug/users (dumps credentials + FLAG)
      [!] Health Exfiltration: POST /debug/heart (unauthenticated POST)
    ================================================================
    """)
    app.run(host='0.0.0.0', port=5000, debug=False)
