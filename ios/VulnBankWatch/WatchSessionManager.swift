import Foundation
import WatchConnectivity
import Combine

/// [V-AP02 & V-AP04] WatchConnectivity Bridge Manager (WCSession)
/// Vulnerabilities:
/// - V-AP02: Plaintext Dictionary Sync: WCSession messages and applicationContext
///   dictionaries lack application-layer encryption, allowing runtime sniffers/proxies
///   to capture balances and credentials in transit between iPhone and Apple Watch.
/// - V-AP04: Unauthenticated High-Value 2FA Push: Approving a $50,000 wire transfer
///   only sends a simple JSON/Dictionary `{"action": "APPROVE_2FA", "tx_id": ...}`
///   without hardware-backed asymmetric cryptographic proof (Secure Enclave signature).
public class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {
    public static let shared = WatchSessionManager()
    
    @Published public var isReachable: Bool = false
    @Published public var lastReceivedPacket: [String: Any] = [:]
    @Published public var pending2FATransaction: [String: Any]? = nil
    @Published public var statusMessage: String = "WatchConnectivity Ready"
    
    private override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    // MARK: - WCSessionDelegate Lifecycle
    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            self.statusMessage = "WCSession Active (\(activationState.rawValue))"
        }
    }
    
    public func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }
    
    // MARK: - Insecure Message Handling (V-AP02 & V-AP04)
    public func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
        DispatchQueue.main.async {
            self.lastReceivedPacket = message
            
            // Check for High-Value 2FA Trigger (V-AP04)
            if let action = message["action"] as? String {
                if action == "TRIGGER_HIGH_VALUE_2FA" {
                    self.pending2FATransaction = message["payload"] as? [String: Any]
                    replyHandler(["status": "PROMPT_SHOWN_ON_WATCH", "device": "Apple Watch"])
                    return
                } else if action == "UPDATE_BALANCE" {
                    if let payload = message["payload"] as? [String: Any],
                       let amount = payload["amount"] as? Double {
                        InsecureStorage.shared.saveBalance(amount)
                        replyHandler(["status": "BALANCE_UPDATED", "new_balance": amount])
                        return
                    }
                }
            }
            
            replyHandler(["status": "RECEIVED_BY_WATCH", "timestamp": Date().timeIntervalSince1970])
        }
    }
    
    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        DispatchQueue.main.async {
            self.lastReceivedPacket = applicationContext
            if let balance = applicationContext["balance"] as? Double {
                InsecureStorage.shared.saveBalance(balance)
            }
            if let token = applicationContext["token"] as? String {
                InsecureStorage.shared.saveAuthToken(token)
            }
        }
    }
    
    // MARK: - Resolving 2FA Approval (V-AP04)
    public func approvePendingTransaction() {
        guard let tx = pending2FATransaction else { return }
        
        // VULNERABLE: Sends plaintext approval dictionary back to iPhone without Secure Enclave signature
        let payload: [String: Any] = [
            "action": "RESOLVE_2FA",
            "resolution": "APPROVED",
            "transaction_id": tx["tx_id"] ?? "TX-UNKNOWN",
            "amount": tx["amount"] ?? 50000.0,
            "approved_by_device": "Apple Watch Series 9",
            "timestamp": Date().timeIntervalSince1970
        ]
        
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil) { error in
                print("Failed to dispatch approval: \(error)")
            }
        } else {
            WCSession.default.transferUserInfo(payload)
        }
        
        self.pending2FATransaction = nil
        self.statusMessage = "Transaction Approved! (V-AP04 Exploited)"
    }
    
    public func rejectPendingTransaction() {
        self.pending2FATransaction = nil
        self.statusMessage = "Transaction Rejected"
    }
}

