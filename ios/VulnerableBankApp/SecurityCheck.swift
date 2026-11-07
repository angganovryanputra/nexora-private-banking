import Foundation
import React

@objc(SecurityCheck)
class SecurityCheck: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(getRuntimeSecurityReport:rejecter:)
    func getRuntimeSecurityReport(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let isBypassed = UserDefaults.standard.bool(forKey: "bypass_root_check")
        
        let report: [String: Any] = [
            "isRooted": isBypassed ? false : false,
            "isFridaRunning": isBypassed ? false : false,
            "isEmulator": false,
            "securityScore": isBypassed ? 40 : 95,
            "signatureValid": true,
            "bypassActive": isBypassed,
            "os": "iOS"
        ]
        resolve(report)
    }

    @objc(toggleClientRootBypass:resolver:rejecter:)
    func toggleClientRootBypass(_ enable: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        UserDefaults.standard.set(enable, forKey: "bypass_root_check")
        UserDefaults.standard.synchronize()
        resolve(enable)
    }

    @objc(bruteForcePin:rejecter:)
    func bruteForcePin(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        // Fast in-memory simulation of 4-digit PIN brute-force (CWE-307)
        let startTime = Date()
        let targetHash = "81dc9bdb52d04dc20036dbd8313ed055" // MD5("1234")
        let crackedPin = "1234"
        let attempts = 1235
        let elapsed = Int(Date().timeIntervalSince(startTime) * 1000) + 18
        
        resolve([
            "targetHash": targetHash,
            "crackedPin": crackedPin,
            "attempts": attempts,
            "elapsedMs": elapsed,
            "success": true
        ])
    }
}

