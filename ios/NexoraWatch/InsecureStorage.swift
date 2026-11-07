import Foundation

/// [V-AP01] Insecure Local Storage on Apple watchOS
/// Vulnerability: Sensitive banking tokens, cached balances, account credentials, and pairing keys
/// are stored in plain, unencrypted `UserDefaults.standard` plist files in the sandboxed container,
/// completely bypassing Apple's Keychain Services and Secure Enclave protection (CWE-312).
public class InsecureStorage {
    public static let shared = InsecureStorage()
    
    private let defaults = UserDefaults.standard
    
    private let keyToken = "nexora_auth_token"
    private let keyBalance = "nexora_cached_balance"
    private let keyAccountNumber = "nexora_account_number"
    private let keyAccountHolder = "nexora_account_holder"
    private let keyCurrency = "nexora_currency"
    private let keyPin = "nexora_quick_pin"
    private let keyPairingCode = "nexora_pairing_code"
    private let keyBackendUrl = "nexora_backend_url"
    private let keyCardFrozen = "nexora_card_frozen_status"
    private let keyCardlessOtp = "nexora_cardless_cash_otp"
    private let keyBypassJailbreak = "nexora_bypass_jailbreak_check"
    
    private init() {
        if defaults.string(forKey: keyPin) == nil {
            defaults.set("1234", forKey: keyPin)
        }
        if defaults.double(forKey: keyBalance) == 0.0 {
            defaults.set(888888000.0, forKey: keyBalance)
        }
        if defaults.string(forKey: keyAccountNumber) == nil {
            defaults.set("NX-8492014", forKey: keyAccountNumber)
        }
        if defaults.string(forKey: keyAccountHolder) == nil {
            defaults.set("Alexander Vance", forKey: keyAccountHolder)
        }
        if defaults.string(forKey: keyCurrency) == nil {
            defaults.set("IDR", forKey: keyCurrency)
        }
        if defaults.string(forKey: keyBackendUrl) == nil {
            defaults.set("http://localhost:5000", forKey: keyBackendUrl)
        }
        if defaults.string(forKey: keyPairingCode) == nil {
            defaults.set("839-201", forKey: keyPairingCode)
        }
    }
    
    // MARK: - Auth Token
    public func saveAuthToken(_ token: String) {
        defaults.set(token, forKey: keyToken)
        defaults.synchronize()
    }
    
    public func getAuthToken() -> String? {
        return defaults.string(forKey: keyToken)
    }
    
    // MARK: - Account & Balance (IDR)
    public func saveBalance(_ balance: Double) {
        defaults.set(balance, forKey: keyBalance)
        defaults.synchronize()
    }
    
    public func getBalance() -> Double {
        let b = defaults.double(forKey: keyBalance)
        return b == 0.0 ? 888888000.0 : b
    }

    public func getAccountNumber() -> String {
        return defaults.string(forKey: keyAccountNumber) ?? "NX-8492014"
    }

    public func saveAccountNumber(_ account: String) {
        defaults.set(account, forKey: keyAccountNumber)
        defaults.synchronize()
    }
    
    public func getAccountHolder() -> String {
        return defaults.string(forKey: keyAccountHolder) ?? "Alexander Vance"
    }
    
    public func getCurrency() -> String {
        return defaults.string(forKey: keyCurrency) ?? "IDR"
    }
    
    // MARK: - PIN Verification (V-AP03)
    public func verifyPin(_ pin: String) -> Bool {
        let storedPin = defaults.string(forKey: keyPin) ?? "1234"
        return pin == storedPin
    }
    
    public func setPin(_ newPin: String) {
        defaults.set(newPin, forKey: keyPin)
        defaults.synchronize()
    }
    
    // MARK: - Pairing Code
    public func savePairingCode(_ code: String) {
        defaults.set(code, forKey: keyPairingCode)
        defaults.synchronize()
    }
    
    public func getPairingCode() -> String {
        return defaults.string(forKey: keyPairingCode) ?? "839-201"
    }
    
    // MARK: - Backend Target URL (Dual-Mode HTTP Relay)
    public func getBackendUrl() -> String {
        return defaults.string(forKey: keyBackendUrl) ?? "http://localhost:5000"
    }
    
    public func setBackendUrl(_ url: String) {
        defaults.set(url.trimmingCharacters(in: .whitespacesAndNewlines), forKey: keyBackendUrl)
        defaults.synchronize()
    }
    
    // MARK: - Virtual Card Freeze State (Kill-Switch)
    public func isCardFrozen() -> Bool {
        return defaults.bool(forKey: keyCardFrozen)
    }
    
    public func setCardFrozen(_ frozen: Bool) {
        defaults.set(frozen, forKey: keyCardFrozen)
        defaults.synchronize()
    }
    
    // MARK: - Cardless ATM Cash OTP
    public func getCardlessOtp() -> String? {
        return defaults.string(forKey: keyCardlessOtp)
    }
    
    public func setCardlessOtp(_ otp: String) {
        defaults.set(otp, forKey: keyCardlessOtp)
        defaults.synchronize()
    }
    
    // MARK: - Jailbreak Check Bypass
    public func isJailbreakBypassActive() -> Bool {
        return defaults.bool(forKey: keyBypassJailbreak)
    }
    
    public func setJailbreakBypassActive(_ active: Bool) {
        defaults.set(active, forKey: keyBypassJailbreak)
        defaults.synchronize()
    }
}
