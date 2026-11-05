#!/usr/bin/env python3
"""
🏦 Nexora Bank OmniWear Suite — Local Pentest Backend
=====================================================
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
from werkzeug.exceptions import HTTPException

# Windows PowerShell UTF-8 fix
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

app = Flask(__name__)
DB_NAME = 'nexora_vault.db'
DB_PATH = os.path.join(os.path.dirname(__file__), DB_NAME)

# Hardcoded valid Master JWT (matches Secrets.java)
MASTER_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiaXNfYWRtaW4iOnRydWUsImlhdCI6MTc0NDk3NjIyM30.yXm-7iN-6sn3kvvXkOiOLVRHXSn6MBSpwbM2VcXVds8"

# ---------------------------------------------------------------------------
# High-Concurrency SQLite Database Connection Factory
# ---------------------------------------------------------------------------
def get_db():
    """
    Creates a thread-safe, high-concurrency SQLite connection.
    Configured with 30s busy timeout and synchronous=NORMAL to eliminate
    'database is locked' errors during rapid multi-client testing.
    """
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout=30000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

# ---------------------------------------------------------------------------
# Global Exception & Socket Disconnection Handler
# ---------------------------------------------------------------------------
@app.errorhandler(Exception)
def handle_server_exception(e):
    """
    Prevents abrupt process termination when emulators or devices drop TCP connections.
    """
    if isinstance(e, (ConnectionResetError, BrokenPipeError)):
        return ('', 204)
    if isinstance(e, OSError) and getattr(e, 'winerror', None) in (10053, 10054):
        return ('', 204)
    if isinstance(e, HTTPException):
        return e
    print(f"   ⚠️ [SERVER EXCEPTION] {type(e).__name__}: {e}")
    return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

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
    # Suppress verbose terminal log for continuous empty event polling to prevent Windows console lockup
    if request.path.startswith('/api/wearable/events'):
        return None
    print(f"\n📡 [\033[94m{request.method}\033[0m] {request.path}")
    auth = request.headers.get('Authorization')
    if auth:
        print(f"   🔑 Auth: {auth[:45]}...")
    payload = request.get_json(silent=True)
    if payload:
        print(f"   📦 Payload: {payload}")

# ---------------------------------------------------------------------------
# Database Initialization
# ---------------------------------------------------------------------------
def init_db():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("PRAGMA journal_mode=WAL;")
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

        cur.execute('''
            CREATE TABLE IF NOT EXISTS card_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id INTEGER,
                amount REAL,
                merchant TEXT,
                timestamp TEXT,
                status TEXT DEFAULT 'COMPLETED',
                type TEXT DEFAULT 'DEBIT'
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS loans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                account_number TEXT,
                amount REAL,
                status TEXT DEFAULT 'pending',
                created_at TEXT
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS bill_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS billers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                category_id INTEGER,
                minimum_amount REAL,
                maximum_amount REAL
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS bill_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_number TEXT,
                amount REAL,
                status TEXT DEFAULT 'SUCCESS',
                reference TEXT,
                biller_name TEXT,
                category_name TEXT,
                payment_method TEXT,
                card_number TEXT,
                description TEXT,
                created_at TEXT
            )
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS cardless_cash_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_number TEXT,
                token TEXT UNIQUE,
                amount REAL,
                status TEXT DEFAULT 'ACTIVE',
                expires_at TEXT,
                created_at TEXT
            )
        ''')

        # Check if realistic enterprise seed data is installed
        cur.execute("SELECT COUNT(*) FROM users WHERE username = 'alexander.vance'")
        has_vance = cur.fetchone()[0] > 0

        if not has_vance:
            print("🌱 Migrating and seeding authentic Nexora Private Banking records (IDR)...")
            cur.execute("DELETE FROM users;")
            cur.execute("DELETE FROM transactions;")
            cur.execute("DELETE FROM virtual_cards;")
            cur.execute("DELETE FROM card_transactions;")
            cur.execute("DELETE FROM loans;")
            cur.execute("DELETE FROM bill_categories;")
            cur.execute("DELETE FROM billers;")
            cur.execute("DELETE FROM bill_payments;")

            # Seed realistic private banking customers in IDR
            cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('alexander.vance', 'Password123!', 'NX-8492014', 999999000.0, 1)")
            cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('evelyn.sterling', 'Evelyn2026!', 'NX-7391048', 52800000.0, 0)")
            cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('marcus.holloway', 'MarcusPass!', 'NX-9201482', 18750000.0, 0)")
            cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('sophia.rodriguez', 'SophiaVault!', 'NX-5182930', 125400000.0, 0)")
            cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('julian.drake', 'DrakeSecure!', 'NX-6302914', 7500000.0, 0)")
            cur.execute("INSERT INTO users (username, password, account_number, balance, is_admin) VALUES ('clara.beaumont', 'ClaraSafe99!', 'NX-4102945', 94100000.0, 0)")

            # Realistic IDR transactions
            cur.execute("INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES ('NX-8492014', 'NX-7391048', 5000000.0, 'Private Retainer - Evelyn Sterling', datetime('now', '-2 hours'))")
            cur.execute("INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES ('NX-5182930', 'NX-8492014', 12500000.0, 'Yield Portfolio Payout', datetime('now', '-1 day'))")
            cur.execute("INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES ('NX-8492014', 'NX-9201482', 2750000.0, 'Private Aviation Concierge', datetime('now', '-3 days'))")

            # Virtual cards in IDR
            cur.execute("INSERT INTO virtual_cards (user_id, card_number, cvv, expiry_date, card_type, card_limit, balance, is_frozen, created_at) VALUES (1, '4532 8819 0021 9921', '921', '08/28', 'Titanium Wear OS', 50000000.0, 14250000.0, 0, datetime('now'))")
            cur.execute("INSERT INTO virtual_cards (user_id, card_number, cvv, expiry_date, card_type, card_limit, balance, is_frozen, created_at) VALUES (1, '5412 3310 9942 3349', '417', '11/29', 'Virtual NFC Tap', 10000000.0, 2500000.0, 1, datetime('now'))")

            # Card transactions in IDR
            cur.execute("INSERT INTO card_transactions (card_id, amount, merchant, timestamp, status, type) VALUES (1, 350000.0, 'Pacific Place Tap & Pay', datetime('now', '-2 hours'), 'COMPLETED', 'DEBIT')")
            cur.execute("INSERT INTO card_transactions (card_id, amount, merchant, timestamp, status, type) VALUES (1, 1250000.0, 'Grand Hyatt Jakarta Dining', datetime('now', '-1 day'), 'COMPLETED', 'DEBIT')")

            # Seed bill categories & billers in IDR
            cur.execute("INSERT INTO bill_categories (id, name, description) VALUES (1, 'Electricity (PLN)', 'Prepaid and Postpaid electricity bills')")
            cur.execute("INSERT INTO bill_categories (id, name, description) VALUES (2, 'Water (PDAM)', 'Municipal water supply payments')")
            cur.execute("INSERT INTO bill_categories (id, name, description) VALUES (3, 'Internet & Telecom', 'Fiber broadband, cellular and phone bills')")
            cur.execute("INSERT INTO bill_categories (id, name, description) VALUES (4, 'Mobile Top-Up', 'Prepaid airtime and data packages')")

            cur.execute("INSERT INTO billers (name, category_id, minimum_amount, maximum_amount) VALUES ('PLN Prepaid Token', 1, 20000.0, 5000000.0)")
            cur.execute("INSERT INTO billers (name, category_id, minimum_amount, maximum_amount) VALUES ('PLN Postpaid Bill', 1, 50000.0, 25000000.0)")
            cur.execute("INSERT INTO billers (name, category_id, minimum_amount, maximum_amount) VALUES ('PDAM Jaya Jakarta', 2, 25000.0, 5000000.0)")
            cur.execute("INSERT INTO billers (name, category_id, minimum_amount, maximum_amount) VALUES ('Indihome / Biznet Fiber', 3, 150000.0, 3000000.0)")
            cur.execute("INSERT INTO billers (name, category_id, minimum_amount, maximum_amount) VALUES ('Telkomsel Halo & Data', 4, 25000.0, 1000000.0)")

            # Loans in IDR
            cur.execute("INSERT INTO loans (user_id, account_number, amount, status, created_at) VALUES (1, 'NX-8492014', 50000000.0, 'approved', datetime('now', '-30 days'))")
            cur.execute("INSERT INTO loans (user_id, account_number, amount, status, created_at) VALUES (1, 'NX-8492014', 100000000.0, 'pending', datetime('now', '-2 days'))")

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# 1. AUTHENTICATION & SQL INJECTION (V-10)
# ---------------------------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get('username', ''))
    password = str(data.get('password', ''))

    conn = get_db()
    cur = conn.cursor()

    # INTENTIONALLY VULNERABLE: Direct string interpolation SQL Injection!
    # Exploit payload: username = "alexander.vance'--" or "admin'--" or "' OR 1=1--"
    effective_user = username.replace("admin'", "alexander.vance'") if username.startswith("admin'") else username
    raw_query = f"SELECT * FROM users WHERE username = '{effective_user}' AND password = '{password}'"
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
        user_dict = dict(user)
        is_admin = bool(user_dict.get('is_admin', 0))
        username_val = user_dict.get('username', 'alexander.vance')
        acct_val = user_dict.get('account_number', 'NX-8492014')
        user_id = user_dict.get('id', 1)
        print(f"   ✅ Login successful for user: \033[92m{username_val}\033[0m (Admin: {is_admin})")
        return jsonify({
            "message": "Login successful",
            "token": MASTER_JWT if is_admin else f"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.user_{user_id}",
            "username": username_val,
            "accountNumber": acct_val,
            "isAdmin": is_admin
        }), 200

    return jsonify({"message": "Invalid username or password"}), 401


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    acct_no = f"ACC_{str(username).upper()[:6]}{int(time.time()) % 1000}"
    conn = get_db()
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT username, account_number, balance FROM users WHERE account_number = ?", (account_number,))
        row = cur.fetchone()
    finally:
        conn.close()

    if row:
        print(f"   💰 BOLA Access: Balance for {account_number} returned: Rp {row['balance']:,.0f}")
        return jsonify({
            "accountNumber": row['account_number'],
            "balance": row['balance'],
            "currency": "IDR"
        }), 200

    # Fallback default
    return jsonify({
        "accountNumber": account_number,
        "balance": 999999000.00,
        "currency": "IDR"
    }), 200

# ---------------------------------------------------------------------------
# 3. TRANSFER — NEGATIVE AMOUNT & LOGIC FLAW (V-10)
# ---------------------------------------------------------------------------
@app.route('/transfer', methods=['POST'])
def transfer():
    data = request.get_json(silent=True) or {}
    from_acct = data.get('from_account', 'NX-8492014')
    to_acct = data.get('to_account', '')
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid amount format. Must be numeric."}), 400
    desc = data.get('description', 'Nexora Instant Transfer')
    ref = f"TX_{int(time.time())}"

    conn = get_db()
    cur = conn.cursor()
    try:
        # INTENTIONALLY VULNERABLE: Negative amount allowed!
        if amount < 0:
            print(f"   ⚠️ \033[91m[BUSINESS LOGIC EXPLOIT]\033[0m Negative transfer detected! Amount: Rp {amount:,.0f}")

        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amount, from_acct))
        cur.execute("UPDATE users SET balance = balance + ? WHERE account_number = ?", (amount, to_acct))
        cur.execute(
            "INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES (?, ?, ?, ?, datetime('now'))",
            (from_acct, to_acct, amount, desc)
        )

        # Retrieve new updated balance for real-time sync
        cur.execute("SELECT balance FROM users WHERE account_number = ?", (from_acct,))
        bal_row = cur.fetchone()
        new_balance = bal_row['balance'] if bal_row else 999999000.0 - amount

        # REAL-TIME WEARABLE EVENT DISPATCH:
        cur.execute(
            "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('all', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
            (json.dumps({"amount": new_balance, "currency": "IDR", "account": from_acct, "tx_ref": ref}),)
        )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    print(f"   💸 Transfer Executed: Rp {amount:,.0f} from {from_acct} to {to_acct} (New Balance: Rp {new_balance:,.0f})")
    return jsonify({
        "status": "success",
        "message": f"Successfully transferred Rp {amount:,.0f} to {to_acct}",
        "reference": ref,
        "new_balance": new_balance,
        "currency": "IDR"
    }), 200

# ---------------------------------------------------------------------------
# 4. TRANSACTIONS LIST — BOLA (V-10)
# ---------------------------------------------------------------------------
@app.route('/transactions/<account_number>', methods=['GET'])
def get_transactions(account_number):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT * FROM transactions WHERE from_account = ? OR to_account = ? ORDER BY id DESC LIMIT 20",
            (account_number, account_number)
        )
        rows = cur.fetchall()
    finally:
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM virtual_cards")
        rows = cur.fetchall()
    finally:
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE virtual_cards SET is_frozen = NOT is_frozen WHERE id = ?", (card_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
    return jsonify({"status": "success", "message": f"Card {card_id} freeze toggled"}), 200


@app.route('/api/virtual-cards/create', methods=['POST'])
def create_virtual_card():
    import random
    data = request.get_json(silent=True) or {}
    card_type = data.get('card_type', 'Titanium Wear OS')
    try:
        limit = float(data.get('card_limit', 5000.0))
    except (ValueError, TypeError):
        limit = 5000.0
    pan = f"4532 {random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
    cvv = f"{random.randint(100, 999)}"
    exp = "12/29"

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('''
            INSERT INTO virtual_cards (user_id, card_number, cvv, expiry_date, card_type, card_limit, balance, is_frozen, created_at)
            VALUES (1, ?, ?, ?, ?, ?, 0.0, 0, datetime('now'))
        ''', (pan, cvv, exp, card_type, limit))
        card_id = cur.lastrowid
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "message": "Virtual card created successfully",
        "card": {
            "id": card_id,
            "card_number": pan,
            "cvv": cvv,
            "expiry_date": exp,
            "card_type": card_type,
            "limit": limit,
            "balance": 0.0,
            "is_frozen": False
        }
    }), 201


@app.route('/api/virtual-cards/<int:card_id>/update-limit', methods=['POST'])
def update_card_limit(card_id):
    data = request.get_json(silent=True) or {}
    try:
        new_limit = float(data.get('limit', 5000.0))
    except (ValueError, TypeError):
        new_limit = 5000.0

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE virtual_cards SET card_limit = ? WHERE id = ?", (new_limit, card_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({"status": "success", "message": f"Card limit updated to ${new_limit}"}), 200


@app.route('/api/virtual-cards/<int:card_id>/transactions', methods=['GET'])
def get_card_transactions(card_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM card_transactions WHERE card_id = ? ORDER BY id DESC", (card_id,))
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({"transactions": [dict(r) for r in rows]}), 200


# ---------------------------------------------------------------------------
# 5B. SNAP QRIS MERCHANT CHECKOUT (V-06 / V-W15 / V-AP06 REPLAY VULNERABILITY)
# ---------------------------------------------------------------------------
@app.route('/api/qris/checkout', methods=['POST'])
def qris_checkout():
    """
    Bank Indonesia SNAP QRIS Merchant Terminal Checkout.
    INTENTIONALLY VULNERABLE (V-06 / V-W15 / V-AP06):
      - Accepts static QR token without freshness nonce / TOTP verification.
      - Replaying the same request multiple times succeeds without idempotency rejection.
    """
    data = request.get_json(silent=True) or {}
    account_number = data.get('account_number', 'NX-8492014')
    try:
        amount = float(data.get('amount', 75000.0))
    except (ValueError, TypeError):
        amount = 75000.0
    merchant = data.get('merchant_name', 'NEXORA DIGITAL MERCH 001')
    qr_payload = data.get('qr_payload', 'VULN-QRIS-992144-TOKEN')
    rrn = f"RRN-{int(time.time()) % 100000000:08d}"

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amount, account_number))
        cur.execute('''
            INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', (account_number, merchant, amount, f"Dynamic SNAP QRIS Checkout ({merchant} / {rrn})"))

        cur.execute('''
            INSERT INTO wearable_packets (source_device, target_device, action, payload, timestamp)
            VALUES ('MERCHANT_POS_SCANNER', 'SMARTWATCH_WEARABLE', 'QRIS_DEBIT_ACK', ?, datetime('now'))
        ''', (json.dumps({"rrn": rrn, "amount": amount, "merchant": merchant, "qr_payload": qr_payload}),))

        cur.execute("SELECT balance FROM users WHERE account_number = ?", (account_number,))
        bal_row = cur.fetchone()
        new_balance = bal_row['balance'] if bal_row else 999999000.0 - amount

        cur.execute(
            "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('all', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
            (json.dumps({"amount": new_balance, "currency": "IDR", "account": account_number, "tx_ref": rrn}),)
        )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    print(f"   💳 \033[92m[SNAP QRIS CHECKOUT EXECUTED]\033[0m -Rp {amount:,.0f} at {merchant} (RRN: {rrn})")
    return jsonify({
        "status": "APPROVED",
        "response_code": "00",
        "amount": amount,
        "currency": "IDR",
        "merchant": merchant,
        "terminal_id": "POS_SNAP_9921",
        "rrn": rrn,
        "message": "Payment Approved by Issuer",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }), 200


# ---------------------------------------------------------------------------
# 5C. COMMERCIAL & PERSONAL LOANS API (BOLA / BUSINESS LOGIC)
# ---------------------------------------------------------------------------
@app.route('/request_loan', methods=['POST'])
def request_loan():
    data = request.get_json(silent=True) or {}
    account_number = data.get('account_number', 'NX-8492014')
    try:
        amt = float(data.get('amount', 50000000.0))
    except (ValueError, TypeError):
        amt = 50000000.0

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO loans (user_id, account_number, amount, status, created_at) VALUES (1, ?, ?, 'pending', datetime('now'))", (account_number, amt))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({"status": "success", "message": f"Loan application for Rp {amt:,.0f} submitted"}), 200


@app.route('/loans/<account_number>', methods=['GET'])
def get_user_loans(account_number):
    """
    Returns loans for an account number.
    VULNERABILITY: BOLA / IDOR - any account number can be queried without ownership check.
    """
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM loans WHERE account_number = ? ORDER BY id DESC", (account_number,))
        rows = cur.fetchall()
    finally:
        conn.close()
    return jsonify({"loans": [dict(r) for r in rows]}), 200


@app.route('/admin/pending_loans', methods=['GET'])
def admin_pending_loans():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM loans WHERE status = 'pending' ORDER BY id DESC")
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({"loans": [dict(r) for r in rows]}), 200


@app.route('/admin/approve_loan/<int:loan_id>', methods=['POST'])
def admin_approve_loan(loan_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM loans WHERE id = ?", (loan_id,))
        loan = cur.fetchone()
        if loan:
            cur.execute("UPDATE loans SET status = 'approved' WHERE id = ?", (loan_id,))
            cur.execute("UPDATE users SET balance = balance + ? WHERE account_number = ?", (loan['amount'], loan['account_number']))
            cur.execute("INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES ('NEXORA_CREDIT', ?, ?, 'Approved Commercial Loan Disbursement', datetime('now'))", (loan['account_number'], loan['amount']))
            
            cur.execute("SELECT balance FROM users WHERE account_number = ?", (loan['account_number'],))
            bal_row = cur.fetchone()
            new_balance = bal_row['balance'] if bal_row else 999999000.0

            cur.execute(
                "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('all', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
                (json.dumps({"amount": new_balance, "currency": "IDR", "account": loan['account_number']}),)
            )
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({"status": "success", "message": f"Loan #{loan_id} approved and disbursed"}), 200


# ---------------------------------------------------------------------------
# 5D. UTILITY BILL PAYMENTS API
# ---------------------------------------------------------------------------
@app.route('/api/bill-categories', methods=['GET'])
def get_bill_categories():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM bill_categories")
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({"categories": [dict(r) for r in rows]}), 200


@app.route('/api/billers/by-category/<int:category_id>', methods=['GET'])
def get_billers_by_category(category_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM billers WHERE category_id = ?", (category_id,))
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({"billers": [dict(r) for r in rows]}), 200


@app.route('/api/bill-payments/create', methods=['POST'])
def create_bill_payment():
    data = request.get_json(silent=True) or {}
    try:
        amt = float(data.get('amount', 50000.0))
    except (ValueError, TypeError):
        amt = 50000.0
    acct = data.get('account_number', 'NX-8492014')
    biller_name = data.get('biller_name', 'PLN Prepaid Electricity')
    category_name = data.get('category_name', 'Utilities')
    method = data.get('payment_method', 'balance')
    desc = data.get('description', f'Nexora Bill Pay - {biller_name}')
    ref = f"BILL-{int(time.time())}"

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amt, acct))
        cur.execute('''
            INSERT INTO bill_payments (account_number, amount, status, reference, biller_name, category_name, payment_method, description, created_at)
            VALUES (?, ?, 'SUCCESS', ?, ?, ?, ?, ?, datetime('now'))
        ''', (acct, amt, ref, biller_name, category_name, method, desc))
        cur.execute('''
            INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        ''', (acct, biller_name, amt, f"Bill Payment - {biller_name} ({ref})"))

        # Fetch new balance
        cur.execute("SELECT balance FROM users WHERE account_number = ?", (acct,))
        bal_row = cur.fetchone()
        new_balance = bal_row['balance'] if bal_row else 999999000.0 - amt

        # Real-time wearable sync
        cur.execute(
            "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('all', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
            (json.dumps({"amount": new_balance, "currency": "IDR", "account": acct, "tx_ref": ref}),)
        )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({
        "status": "success",
        "message": f"Payment of Rp {amt:,.0f} to {biller_name} successful",
        "reference": ref,
        "new_balance": new_balance,
        "currency": "IDR"
    }), 200


@app.route('/api/bill-payments/history', methods=['GET'])
def get_bill_payment_history():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM bill_payments ORDER BY id DESC LIMIT 20")
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({"payments": [dict(r) for r in rows]}), 200


# ---------------------------------------------------------------------------
# 5E. PROFILE, ADMIN & RECOVERY API
# ---------------------------------------------------------------------------
@app.route('/profile', methods=['GET'])
def get_profile():
    # INTENTIONALLY VULNERABLE: BOLA/IDOR - returns profile without strict session auth
    acct = request.args.get('account_number', 'NX-8492014')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, account_number, balance, is_admin FROM users WHERE account_number = ?", (acct,))
        u = cur.fetchone()
    finally:
        conn.close()

    if u:
        return jsonify({
            "id": u['id'],
            "username": u['username'],
            "accountNumber": u['account_number'],
            "balance": u['balance'],
            "currency": "IDR",
            "isAdmin": bool(u['is_admin']),
            "email": "alexander.vance@nexorabank.internal",
            "phone": "+62 811-9201-441"
        }), 200
    return jsonify({"message": "User not found"}), 404


@app.route('/profile/update', methods=['POST'])
def update_profile():
    data = request.get_json(silent=True) or {}
    return jsonify({"status": "success", "message": "Profile updated successfully", "data": data}), 200


@app.route('/api/v2/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    reset_pin = data.get('reset_pin')
    new_password = data.get('new_password')
    # Vulnerability: Accepts any 3-digit PIN or "123"
    if reset_pin in ('123', '000', '999') or (reset_pin and len(str(reset_pin)) == 3):
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute("UPDATE users SET password = ? WHERE username = ?", (new_password, username))
            conn.commit()
        finally:
            conn.close()
        return jsonify({"status": "success", "message": "Password reset successfully"}), 200
    return jsonify({"message": "Invalid reset PIN"}), 400


@app.route('/admin/create_admin', methods=['POST'])
def create_admin():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, password, account_number, balance, is_admin) VALUES (?, ?, ?, 500000.0, 1)",
            (username, password, f"ADM_{str(username).upper()[:4]}")
        )
        conn.commit()
        return jsonify({"status": "success", "message": f"Administrator {username} created"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "User already exists"}), 409
    finally:
        conn.close()


@app.route('/admin/delete_account/<int:user_id>', methods=['DELETE', 'POST'])
def delete_account(user_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
    return jsonify({"status": "success", "message": f"Account {user_id} deleted"}), 200

# ---------------------------------------------------------------------------
# 6. WEARABLE HEALTH DATA EXFILTRATION (V-W04)
# ---------------------------------------------------------------------------
@app.route('/debug/heart', methods=['POST'])
def debug_heart():
    # INTENTIONALLY VULNERABLE: Unauthenticated telemetry exfiltration
    data = request.get_json(silent=True) or {}
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, password, account_number, balance, is_admin FROM users")
        rows = cur.fetchall()
    finally:
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
    data = request.get_json(silent=True) or {}
    pairing_code = str(data.get('pairing_code', '839-201')).replace('-', '').strip()
    device_name = data.get('device_name', 'Wear OS Smartwatch')
    device_type = data.get('device_type', 'WEAR_OS_WATCH')
    account_number = data.get('account_number', 'NX-8492014')

    device_id = f"watch_{pairing_code[-4:] if len(pairing_code) >= 4 else '480x480'}"

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('''
            INSERT INTO wearable_devices (device_id, device_type, device_name, pairing_code, paired_account, auth_token, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(device_id) DO UPDATE SET
                device_name=excluded.device_name,
                last_seen=datetime('now'),
                paired_account=excluded.paired_account
        ''', (device_id, device_type, device_name, pairing_code, account_number, MASTER_JWT))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM wearable_devices ORDER BY last_seen DESC")
        rows = cur.fetchall()
    finally:
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
    data = request.get_json(silent=True) or {}
    target_device_id = data.get('target_device_id', 'watch_9201')
    action = data.get('action', 'SYNC_BALANCE')
    payload = data.get('payload', {})
    payload_str = json.dumps(payload) if isinstance(payload, dict) else str(payload)

    conn = get_db()
    cur = conn.cursor()
    try:
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
    except Exception as e:
        conn.rollback()
        raise e
    finally:
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
    Optimized with throttled device heartbeat to prevent continuous database write locks.
    """
    conn = get_db()
    cur = conn.cursor()
    try:
        # Throttled heartbeat: only update last_seen if >15s have elapsed or unset
        cur.execute("""
            UPDATE wearable_devices 
            SET last_seen = datetime('now') 
            WHERE device_id = ? AND (last_seen IS NULL OR (strftime('%s', 'now') - strftime('%s', last_seen)) > 15)
        """, (device_id,))

        # Fetch pending events (or also events targeted at 'all')
        cur.execute('''
            SELECT * FROM wearable_events 
            WHERE (target_device_id = ? OR target_device_id = 'all') AND status = 'PENDING'
            ORDER BY id ASC
        ''', (device_id,))
        rows = cur.fetchall()
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
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

    if len(events) > 0:
        print(f"\n📡 [\033[92mWEARABLE EVENT DISPATCHED\033[0m] Sent {len(events)} pending event(s) to {device_id}")

    return jsonify({"events": events, "count": len(events)}), 200


@app.route('/api/wearable/resolve-event', methods=['POST'])
def resolve_wearable_event():
    """
    Marks an event as resolved (e.g. 2FA approved or balance applied on watch).
    """
    data = request.get_json(silent=True) or {}
    event_id = data.get('event_id')
    resolution = data.get('resolution', 'APPLIED')  # APPLIED, REJECTED

    if not event_id:
        return jsonify({"message": "event_id is required"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM wearable_events WHERE id = ?", (event_id,))
        ev = cur.fetchone()
        if not ev:
            return jsonify({"message": "Event not found"}), 404

        cur.execute("UPDATE wearable_events SET status = ? WHERE id = ?", (resolution, event_id))

        # Safely parse payload
        p = {}
        try:
            raw_p = ev['payload']
            if isinstance(raw_p, str):
                p = json.loads(raw_p)
                if not isinstance(p, dict):
                    p = {"raw": p}
            elif isinstance(raw_p, dict):
                p = raw_p
        except Exception:
            p = {"raw": ev['payload']}

        # Target account for deduction (supports both 'account_number' and 'account' keys)
        target_acct = (p.get('account_number') or p.get('account') or 'NX-8492014') if isinstance(p, dict) else 'NX-8492014'

        # If action was UPDATE_BALANCE, also update the database balance
        if ev['action'] == 'UPDATE_BALANCE' and resolution == 'APPLIED':
            try:
                amt = float(p.get('amount', 0)) if isinstance(p, dict) else 0.0
                cur.execute("UPDATE users SET balance = ? WHERE account_number = ?", (amt, target_acct))
            except Exception as e:
                print(f"Error updating balance on resolve: {e}")
        elif ev['action'] in ('PUSH_2FA', 'TRIGGER_HIGH_VALUE_2FA') and resolution == 'APPLIED':
            try:
                amt = float(p.get('amount', 50000000.0)) if isinstance(p, dict) else 50000000.0
                recipient = (p.get('recipient') or p.get('merchant') or 'CyberStore Vault') if isinstance(p, dict) else 'CyberStore Vault'
                cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amt, target_acct))
                cur.execute('''
                    INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
                    VALUES (?, ?, ?, 'OOB 2FA Wire Transfer Authorization (Watch Approved)', datetime('now'))
                ''', (target_acct, recipient, amt))
                print(f"   💸 \033[92m[2FA HIGH-VALUE TRANSFER DEBITED]\033[0m -Rp {amt:,.0f} to {recipient}")
            except Exception as e:
                print(f"Error executing 2FA debit on resolve: {e}")
        elif ev['action'] == 'QRIS_PAYMENT_COMPLETED' and resolution == 'APPLIED':
            try:
                amt = float(p.get('amount', 75000.0)) if isinstance(p, dict) else 75000.0
                merchant = p.get('merchant', 'NEXORA DIGITAL MERCH 001') if isinstance(p, dict) else 'NEXORA DIGITAL MERCH 001'
                cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amt, target_acct))
                cur.execute('''
                    INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
                    VALUES (?, ?, ?, 'Dynamic SNAP QRIS Wearable Checkout', datetime('now'))
                ''', (target_acct, merchant, amt))
                print(f"   💳 \033[92m[QRIS PAYMENT DEBITED]\033[0m -Rp {amt:,.0f} at {merchant}")
            except Exception as e:
                print(f"Error executing QRIS debit on resolve: {e}")
        elif ev['action'] == 'QUICK_PAY' and resolution == 'APPLIED':
            try:
                amt = float(p.get('amount', 50000000.0)) if isinstance(p, dict) else 50000000.0
                recipient = p.get('recipient', 'CyberStore Vault') if isinstance(p, dict) else 'CyberStore Vault'
                cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amt, target_acct))
                cur.execute('''
                    INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
                    VALUES (?, ?, ?, 'Quick Pay Direct Injection (Unauthenticated)', datetime('now'))
                ''', (target_acct, recipient, amt))
                print(f"   ⚡ \033[92m[QUICK PAY DEBITED]\033[0m -Rp {amt:,.0f} to {recipient}")
            except Exception as e:
                print(f"Error executing Quick Pay debit on resolve: {e}")

        # Log response packet
        cur.execute('''
            INSERT INTO wearable_packets (source_device, target_device, action, payload, timestamp)
            VALUES (?, 'SMARTPHONE_COMPANION', ?, ?, datetime('now'))
        ''', (ev['target_device_id'], f"RESOLVE_{ev['action']}", json.dumps({"resolution": resolution, "event_id": event_id})))

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
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
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM wearable_packets ORDER BY id DESC LIMIT 50")
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify({
        "total_packets": len(rows),
        "packets": [dict(r) for r in rows]
    }), 200

# ---------------------------------------------------------------------------
# 8B. REALISTIC WEARABLE BANKING FLOWS: ATM CARDLESS CASH & EMERGENCY FREEZE
# ---------------------------------------------------------------------------
@app.route('/api/atm/cardless-cash/generate', methods=['POST'])
def generate_cardless_cash():
    """
    Generates a 6-digit dynamic ATM cash withdrawal code directly from the smartwatch.
    VULNERABILITY: Short 6-digit numeric token without brute-force rate limit (CWE-330 / CWE-307).
    """
    data = request.get_json(silent=True) or {}
    account_number = data.get('account_number', 'NX-8492014')
    try:
        amount = float(data.get('amount', 100000.0))
    except (ValueError, TypeError):
        amount = 100000.0

    import random
    token = f"{random.randint(100000, 999999)}"
    
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('''
            INSERT INTO cardless_cash_tokens (account_number, token, amount, status, expires_at, created_at)
            VALUES (?, ?, ?, 'ACTIVE', datetime('now', '+5 minutes'), datetime('now'))
        ''', (account_number, token, amount))
        
        cur.execute('''
            INSERT INTO wearable_packets (source_device, target_device, action, payload, timestamp)
            VALUES ('NEXORA_WATCH', 'ATM_GATEWAY', 'CARDLESS_CASH_TOKEN_GENERATED', ?, datetime('now'))
        ''', (json.dumps({"token": token, "amount": amount, "account_number": account_number}),))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    print(f"   🏧 \033[92m[ATM CARDLESS CASH TOKEN GENERATED]\033[0m Account: {account_number} -> Code: {token} (Rp {amount:,.2f})")
    return jsonify({
        "status": "success",
        "token": token,
        "amount": amount,
        "currency": "IDR",
        "account_number": account_number,
        "expires_in_seconds": 300,
        "message": "ATM Cardless Cash Withdrawal code generated. Enter this 6-digit code at any ATM."
    }), 200


@app.route('/api/atm/cardless-cash/verify', methods=['POST'])
def verify_cardless_cash():
    """
    Simulates an ATM terminal verifying and dispensing cash via the 6-digit wearable code.
    """
    data = request.get_json(silent=True) or {}
    token = data.get('token')

    if not token:
        return jsonify({"message": "Withdrawal token is required"}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('''
            SELECT * FROM cardless_cash_tokens 
            WHERE token = ? AND status = 'ACTIVE' AND expires_at > datetime('now')
        ''', (token,))
        record = cur.fetchone()

        if not record:
            return jsonify({"message": "Invalid or expired ATM cash token"}), 400

        # V-L04: Intentional Race Condition window (CWE-362 / TOCTOU)
        # Non-atomic verification without row-level lock allows concurrent requests to double dispense
        time.sleep(0.06)

        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (record['amount'], record['account_number']))
        cur.execute("UPDATE cardless_cash_tokens SET status = 'DISPENSED' WHERE id = ?", (record['id'],))
        cur.execute('''
            INSERT INTO transactions (from_account, to_account, amount, description, timestamp)
            VALUES (?, 'ATM-NEXORA-008', ?, 'Cardless Cash Withdrawal (Wearable OTP)', datetime('now'))
        ''', (record['account_number'], record['amount']))

        cur.execute("SELECT balance FROM users WHERE account_number = ?", (record['account_number'],))
        bal_row = cur.fetchone()
        new_balance = bal_row['balance'] if bal_row else 999999000.0 - record['amount']

        cur.execute(
            "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('all', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
            (json.dumps({"amount": new_balance, "currency": "IDR", "account": record['account_number']}),)
        )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    print(f"   💵 \033[92m[ATM CASH DISPENSED]\033[0m Token: {token} -> Dispensed: Rp {record['amount']:,.2f}")
    return jsonify({
        "status": "DISPENSED",
        "amount": record['amount'],
        "currency": "IDR",
        "account_number": record['account_number'],
        "new_balance": new_balance,
        "atm_terminal_id": "ATM-NEXORA-008",
        "message": "Cash dispensed successfully from ATM"
    }), 200


# ---------------------------------------------------------------------------
# V-B04: WEARABLE PUSH 2FA AUTHORIZATION REPLAY ENDPOINT (Pillar 2)
# ---------------------------------------------------------------------------
@app.route('/api/wearable/authorize_2fa', methods=['POST'])
def authorize_wearable_2fa():
    """
    V-B04: Replay vulnerability on Wearable Push 2FA Authorization.
    Accepts authorization payloads without cryptographic nonce freshness or replay protection.
    """
    data = request.get_json(silent=True) or {}
    tx_id = data.get('tx_id', 'TX-HIGHVAL-9921')
    try:
        amount = float(data.get('amount', 50000000.0))
    except (ValueError, TypeError):
        amount = 50000000.0
    account = data.get('account_number', 'NX-8492014')
    recipient = data.get('recipient', 'CyberStore Luxury Vault')

    conn = get_db()
    cur = conn.cursor()
    try:
        # Vulnerable: Executes debit without verifying whether tx_id was already processed!
        cur.execute("UPDATE users SET balance = balance - ? WHERE account_number = ?", (amount, account))
        cur.execute(
            "INSERT INTO transactions (from_account, to_account, amount, description, timestamp) VALUES (?, ?, ?, ?, datetime('now'))",
            (account, recipient, amount, f"Smartwatch 2FA Approved Wire: {tx_id}")
        )
        cur.execute("SELECT balance FROM users WHERE account_number = ?", (account,))
        bal_row = cur.fetchone()
        new_balance = bal_row['balance'] if bal_row else 999999000.0 - amount

        cur.execute(
            "INSERT INTO wearable_events (target_device_id, action, payload, status, created_at) VALUES ('all', 'UPDATE_BALANCE', ?, 'PENDING', datetime('now'))",
            (json.dumps({"amount": new_balance, "currency": "IDR", "account": account, "tx_ref": tx_id}),)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    print(f"   🔓 [V-B04 EXPLOIT] 2FA Authorization Replayed: Rp {amount:,.0f} debited for {tx_id}")
    return jsonify({
        "status": "APPROVED",
        "message": f"High-Value Transaction {tx_id} Authorized via Wearable Push",
        "tx_id": tx_id,
        "amount": amount,
        "new_balance": new_balance,
        "currency": "IDR"
    }), 200


@app.route('/api/wearable/card-freeze', methods=['POST'])
def wearable_card_freeze():
    """
    Emergency card freeze triggered with a single tap directly from the smartwatch.
    """
    data = request.get_json(silent=True) or {}
    card_id = data.get('card_id', 1)
    is_frozen = 0 if data.get('is_frozen') in (0, '0', False, 'false') else 1

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE virtual_cards SET is_frozen = ? WHERE id = ?", (is_frozen, card_id))
        cur.execute('''
            INSERT INTO wearable_packets (source_device, target_device, action, payload, timestamp)
            VALUES ('NEXORA_WATCH', 'CARD_PROCESSOR', 'EMERGENCY_CARD_FREEZE_TOGGLED', ?, datetime('now'))
        ''', (json.dumps({"card_id": card_id, "is_frozen": is_frozen}),))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    status_str = "FROZEN" if is_frozen else "UNFROZEN"
    print(f"   ❄️ \033[96m[WEARABLE CARD KILL-SWITCH]\033[0m Card #{card_id} is now {status_str}")
    return jsonify({
        "status": "success",
        "card_id": card_id,
        "is_frozen": is_frozen,
        "message": f"Card #{card_id} successfully updated to {status_str} from wrist."
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
    import socket
    import signal

    def handle_exit(sig, frame):
        print("\n🛑 [SHUTDOWN] Nexora Bank Backend stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    if hasattr(signal, 'SIGTERM'):
        signal.signal(signal.SIGTERM, handle_exit)

    # Check if port 5000 is already in use
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('0.0.0.0', 5000))
        sock.close()
    except OSError:
        print("\n❌ [PORT CONFLICT] Port 5000 is already in use by another running instance!")
        print("   To terminate background Python instances on Windows PowerShell, run:")
        print("   Get-Process python | Stop-Process -Force\n")
        sys.exit(1)

    init_db()
    print("""
    ================================================================
    🏦  Nexora Bank OmniWear Suite — Local Pentest Backend (Flask)
    ================================================================
    ✓ Server running at: http://0.0.0.0:5000 (Multi-Threaded)
    ✓ Localhost URL:     http://127.0.0.1:5000
    ✓ Emulator Alias:    http://10.0.2.2:5000
    ✓ Concurrency Mode:  WAL Enabled (PRAGMA journal_mode=WAL)
    
    Active Vulnerabilities:
      [!] SQL Injection:       POST /login (username="admin'--")
      [!] BOLA / IDOR:         GET /check_balance/<account_number>
      [!] Business Logic:      POST /transfer (negative amount increases money)
      [!] Info Disclosure:     GET /debug/users (dumps credentials + FLAG)
      [!] Health Exfiltration: POST /debug/heart (unauthenticated POST)
      [!] SNAP QRIS Replay:    POST /api/qris/checkout (missing TOTP / nonce)
      [!] Wearable Insecure:   POST /api/wearable/dispatch (no HMAC / signature)
      [!] ATM OTP Brute-Force: POST /api/atm/cardless-cash/verify (weak 6-digit)
    ================================================================
    """)
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
