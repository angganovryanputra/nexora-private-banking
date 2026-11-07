import Foundation
import WatchConnectivity
import Combine

/// [V-AP02 & V-AP04] WatchConnectivity Bridge Manager (WCSession)
/// Vulnerabilities:
/// - V-AP02: Plaintext Dictionary Sync: WCSession messages and applicationContext
///   dictionaries lack application-layer encryption, allowing runtime sniffers/proxies
///   to capture balances and credentials in transit between iPhone and Apple Watch.
/// - V-AP04: Unauthenticated High-Value 2FA Push: Approving an Rp 50.000.000 wire transfer
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
            
            if let action = message["action"] as? String {
                switch action {
                case "TRIGGER_HIGH_VALUE_2FA":
                    self.pending2FATransaction = message["payload"] as? [String: Any] ?? [
                        "tx_id": "TX-9921",
                        "amount": 50000000.0,
                        "recipient": "Evelyn Sterling (NX-7391048)"
                    ]
                    replyHandler(["status": "PROMPT_SHOWN_ON_WATCH", "device": "Apple Watch", "currency": "IDR"])
                    return
                    
                case "UPDATE_BALANCE":
                    if let payload = message["payload"] as? [String: Any],
                       let amount = payload["amount"] as? Double {
                        InsecureStorage.shared.saveBalance(amount)
                        replyHandler(["status": "BALANCE_UPDATED", "new_balance": amount, "currency": "IDR"])
                        return
                    }
                    
                case "FREEZE_CARD":
                    if let payload = message["payload"] as? [String: Any],
                       let frozen = payload["frozen"] as? Bool {
                        InsecureStorage.shared.setCardFrozen(frozen)
                        replyHandler(["status": "CARD_STATUS_UPDATED", "frozen": frozen])
                        return
                    }
                    
                case "ATM_CASH_OTP":
                    if let payload = message["payload"] as? [String: Any],
                       let otp = payload["token"] as? String {
                        InsecureStorage.shared.setCardlessOtp(otp)
                        replyHandler(["status": "OTP_STORED", "token": otp])
                        return
                    }
                    
                default:
                    break
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
            if let frozen = applicationContext["card_frozen"] as? Bool {
                InsecureStorage.shared.setCardFrozen(frozen)
            }
        }
    }
    
    // MARK: - Resolving 2FA Approval (V-AP04)
    public func approvePendingTransaction() {
        guard let tx = pending2FATransaction else { return }
        
        let amt = tx["amount"] as? Double ?? 50000000.0
        let txId = tx["tx_id"] as? String ?? "TX-9921"
        let currentBal = InsecureStorage.shared.getBalance()
        InsecureStorage.shared.saveBalance(max(0.0, currentBal - amt))
        
        // Also fire direct HTTP relay if backend is reachable
        WatchNetworkManager.shared.authorize2FA(txId: txId, amount: amt, resolution: "APPROVED") { _ in }
        
        // VULNERABLE: Sends plaintext approval dictionary back to iPhone without Secure Enclave signature
        let payload: [String: Any] = [
            "action": "RESOLVE_2FA",
            "resolution": "APPROVED",
            "transaction_id": txId,
            "amount": amt,
            "currency": "IDR",
            "approved_by_device": "Apple Watch Ultra 2",
            "timestamp": Date().timeIntervalSince1970
        ]
        
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil) { error in
                print("[WCSession] Failed to send 2FA approval: \(error.localizedDescription)")
            }
        } else {
            WCSession.default.transferUserInfo(payload)
        }
        
        pending2FATransaction = nil
    }
    
    public func rejectPendingTransaction() {
        guard let tx = pending2FATransaction else { return }
        let txId = tx["tx_id"] as? String ?? "TX-9921"
        
        WatchNetworkManager.shared.authorize2FA(txId: txId, amount: 0.0, resolution: "REJECTED") { _ in }
        
        let payload: [String: Any] = [
            "action": "RESOLVE_2FA",
            "resolution": "REJECTED",
            "transaction_id": txId,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil, errorHandler: nil)
        } else {
            WCSession.default.transferUserInfo(payload)
        }
        
        pending2FATransaction = nil
    }
}
