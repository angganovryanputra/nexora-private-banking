# backend/test_wearable_relay.py
import unittest
import json
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from server import app, init_db

class TestWearableRelay(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = app.test_client()

    def test_pair_and_dispatch_event(self):
        # 1. Pair watch with default code 839-201
        pair_res = self.client.post('/api/wearable/pair', json={
            'pairing_code': '839-201',
            'device_type': 'WEAR_OS_WATCH',
            'device_name': 'Galaxy Watch 6 (480x480)'
        })
        self.assertEqual(pair_res.status_code, 200)
        data = pair_res.get_json()
        self.assertIn('device_id', data)
        device_id = data['device_id']
        self.assertEqual(data['paired_account'], 'ADMIN001')

        # 2. Dispatch balance update from phone companion
        dispatch_res = self.client.post('/api/wearable/dispatch', json={
            'target_device_id': device_id,
            'action': 'UPDATE_BALANCE',
            'payload': {'amount': 888888.0, 'currency': 'USD'}
        })
        self.assertEqual(dispatch_res.status_code, 200)
        event_id = dispatch_res.get_json()['event_id']

        # 3. Poll pending events on watch
        poll_res = self.client.get(f'/api/wearable/events/{device_id}')
        self.assertEqual(poll_res.status_code, 200)
        events = poll_res.get_json()['events']
        self.assertTrue(any(e['id'] == event_id for e in events))

        # 4. Resolve event from watch
        resolve_res = self.client.post('/api/wearable/resolve-event', json={
            'event_id': event_id,
            'resolution': 'APPLIED'
        })
        self.assertEqual(resolve_res.status_code, 200)

        # 5. Check packet sniffer endpoint
        packets_res = self.client.get('/api/wearable/packets')
        self.assertEqual(packets_res.status_code, 200)
        packets = packets_res.get_json()['packets']
        self.assertTrue(len(packets) > 0)

        # 6. Check compliance report endpoint
        comp_res = self.client.get('/api/compliance/report')
        self.assertEqual(comp_res.status_code, 200)
        comp_data = comp_res.get_json()
        self.assertEqual(comp_data['overall_score'], 24)
        self.assertEqual(len(comp_data['frameworks']), 5)

if __name__ == '__main__':
    unittest.main()

