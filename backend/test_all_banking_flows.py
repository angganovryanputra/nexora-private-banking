#!/usr/bin/env python3
"""
Test suite for all enterprise core banking and wearable pentest endpoints.
"""
import unittest
import json
from server import app, init_db

class TestEnterpriseBankingFlows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = app.test_client()

    def test_qris_checkout_and_replay(self):
        # First checkout
        payload = {
            "account_number": "ADMIN001",
            "amount": 75.0,
            "merchant_name": "VULNBANK MERCH 001",
            "qr_payload": "00020101021226610016ID.VULNBANK.WWW"
        }
        res1 = self.client.post('/api/qris/checkout', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res1.status_code, 200)
        data1 = json.loads(res1.data)
        self.assertEqual(data1['status'], 'APPROVED')
        self.assertEqual(data1['amount'], 75.0)
        self.assertTrue('rrn' in data1)

        # Replay checkout with same payload (V-06 / V-W15)
        res2 = self.client.post('/api/qris/checkout', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res2.status_code, 200)
        data2 = json.loads(res2.data)
        self.assertEqual(data2['status'], 'APPROVED')

    def test_virtual_cards_lifecycle(self):
        # Create virtual card
        res = self.client.post('/api/virtual-cards/create', data=json.dumps({
            "card_type": "Titanium Wear OS",
            "card_limit": 3000.0
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        card_data = json.loads(res.data)['card']
        card_id = card_data['id']

        # List virtual cards
        res_list = self.client.get('/api/virtual-cards')
        self.assertEqual(res_list.status_code, 200)
        cards = json.loads(res_list.data)['cards']
        self.assertTrue(len(cards) >= 1)

        # Toggle freeze
        res_freeze = self.client.post(f'/api/virtual-cards/{card_id}/toggle-freeze')
        self.assertEqual(res_freeze.status_code, 200)

        # Update limit
        res_limit = self.client.post(f'/api/virtual-cards/{card_id}/update-limit', data=json.dumps({
            "limit": 8000.0
        }), content_type='application/json')
        self.assertEqual(res_limit.status_code, 200)

    def test_loan_request_and_admin_approval(self):
        # User requests loan
        res = self.client.post('/request_loan', data=json.dumps({
            "amount": 25000.0
        }), content_type='application/json')
        self.assertEqual(res.status_code, 200)

        # Admin gets pending loans
        res_pending = self.client.get('/admin/pending_loans')
        self.assertEqual(res_pending.status_code, 200)
        loans = json.loads(res_pending.data)['loans']
        self.assertTrue(len(loans) > 0)
        target_id = loans[0]['id']

        # Admin approves loan
        res_approve = self.client.post(f'/admin/approve_loan/{target_id}')
        self.assertEqual(res_approve.status_code, 200)

    def test_bill_payments(self):
        # Categories
        res_cat = self.client.get('/api/bill-categories')
        self.assertEqual(res_cat.status_code, 200)
        cats = json.loads(res_cat.data)['categories']
        self.assertTrue(len(cats) > 0)

        # Billers
        res_billers = self.client.get('/api/billers/by-category/1')
        self.assertEqual(res_billers.status_code, 200)

        # Pay Bill
        res_pay = self.client.post('/api/bill-payments/create', data=json.dumps({
            "amount": 50.0,
            "biller_name": "PLN Prepaid Token",
            "category_name": "Electricity (PLN)",
            "payment_method": "balance"
        }), content_type='application/json')
        self.assertEqual(res_pay.status_code, 200)

        # History
        res_hist = self.client.get('/api/bill-payments/history')
        self.assertEqual(res_hist.status_code, 200)

    def test_profile_and_reset_password(self):
        # Profile
        res_prof = self.client.get('/profile')
        self.assertEqual(res_prof.status_code, 200)

        # Password Reset
        res_reset = self.client.post('/api/v2/reset-password', data=json.dumps({
            "username": "admin",
            "reset_pin": "123",
            "new_password": "admin123_new"
        }), content_type='application/json')
        self.assertEqual(res_reset.status_code, 200)

        # Restore admin password for demo consistency
        self.client.post('/api/v2/reset-password', data=json.dumps({
            "username": "admin",
            "reset_pin": "123",
            "new_password": "admin123"
        }), content_type='application/json')

    def test_high_value_2fa_resolution_debit(self):
        # Dispatch 2FA
        res_disp = self.client.post('/api/wearable/dispatch', data=json.dumps({
            "target_device_id": "watch_9201",
            "action": "TRIGGER_HIGH_VALUE_2FA",
            "payload": {"amount": 50000.0, "recipient": "HACKER_SWIFT_CORP"}
        }), content_type='application/json')
        event_id = json.loads(res_disp.data)['event_id']

        # Resolve 2FA as APPLIED
        res_res = self.client.post('/api/wearable/resolve-event', data=json.dumps({
            "event_id": event_id,
            "resolution": "APPLIED"
        }), content_type='application/json')
        self.assertEqual(res_res.status_code, 200)

        # Check that transaction was logged
        res_tx = self.client.get('/transactions/ADMIN001')
        txs = json.loads(res_tx.data)['transactions']
        descriptions = [t['description'] for t in txs]
        self.assertTrue(any("2FA Wire Transfer" in d for d in descriptions))

    def test_cardless_cash_and_emergency_freeze(self):
        # 1. Generate ATM cardless cash token
        res_gen = self.client.post('/api/atm/cardless-cash/generate', data=json.dumps({
            "account_number": "ADMIN001",
            "amount": 250000.0
        }), content_type='application/json')
        self.assertEqual(res_gen.status_code, 200)
        data_gen = json.loads(res_gen.data)
        self.assertEqual(data_gen['status'], 'success')
        self.assertTrue('token' in data_gen)
        token = data_gen['token']

        # 2. Verify ATM cash token and dispense
        res_disp = self.client.post('/api/atm/cardless-cash/verify', data=json.dumps({
            "token": token
        }), content_type='application/json')
        self.assertEqual(res_disp.status_code, 200)
        data_disp = json.loads(res_disp.data)
        self.assertEqual(data_disp['status'], 'DISPENSED')

        # 3. Emergency wearable card freeze
        res_freeze = self.client.post('/api/wearable/card-freeze', data=json.dumps({
            "card_id": 1,
            "is_frozen": 1
        }), content_type='application/json')
        self.assertEqual(res_freeze.status_code, 200)
        data_freeze = json.loads(res_freeze.data)
        self.assertEqual(data_freeze['is_frozen'], 1)

if __name__ == '__main__':
    unittest.main()

