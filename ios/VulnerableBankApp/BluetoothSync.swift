import Foundation
import React

@objc(BluetoothSync)
class BluetoothSync: NSObject {
    private var lastBeaconPayload: String = ""
    private var lastBeaconTimestamp: TimeInterval = 0

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(simulatePhoneBeacon:rejecter:)
    func simulatePhoneBeacon(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let timestamp = Date().timeIntervalSince1970
        let payload = "NEXORA_BLE_ADV:UUID=0000FE28-0000-1000-8000-00805F9B34FB;PAIR_PIN=839-201;AUTH_TOKEN=eySimulatedBlePlaintextToken;ACCT=NX-8492014;TS=\(Int(timestamp))"
        lastBeaconPayload = payload
        lastBeaconTimestamp = timestamp
        resolve(payload)
    }

    @objc(getLastSyncData:rejecter:)
    func getLastSyncData(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if lastBeaconPayload.isEmpty {
            let ts = Date().timeIntervalSince1970
            resolve([
                "payload": "Default Pairing Beacon (839-201) ready",
                "timestamp": Int(ts * 1000)
            ])
        } else {
            resolve([
                "payload": lastBeaconPayload,
                "timestamp": Int(lastBeaconTimestamp * 1000)
            ])
        }
    }
}
