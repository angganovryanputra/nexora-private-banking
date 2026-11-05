import Foundation

/// [V-AP01] Insecure Local Storage on Apple watchOS
/// Vulnerability: Sensitive banking tokens, cached balances, and pairing keys
/// are stored in plain, unencrypted `UserDefaults.standard` plist files in the sandboxed container,
/// completely bypassing Apple's Keychain Services and Secure Enclave protection.
public class InsecureStorage {
    public static let shared = InsecureStorage()
    
    private let defaults = UserDefaults.standard
    
    private let keyToken = "vulnbank_auth_token"
    private let keyBalance = "vulnbank_cached_balance"
    private let keyAccountNumber = "vulnbank_account_number"
    private let keyPin = "vulnbank_quick_pin"
    private let keyPairingCode = "vulnbank_pairing_code"
    
    private init() {
        if defaults.string(forKey: keyPin) == nil {
            defaults.set("1234", forKey: keyPin)
        }
        if defaults.double(forKey: keyBalance) == 0.0 {
            defaults.set(12500000.0, forKey: keyBalance)
        }
        if defaults.string(forKey: keyAccountNumber) == nil {
            defaults.set("ACC-9821-4401", forKey: keyAccountNumber)
        }
    }
    
    public func saveAuthToken(_ token: String) {
        // VULNERABLE: Direct plaintext write to UserDefaults plist
        defaults.set(token, forKey: keyToken)
        defaults.synchronize()
    }
    
    public func getAuthToken() -> String? {
        return defaults.string(forKey: keyToken)
    }
    
    public func saveBalance(_ balance: Double) {
        defaults.set(balance, forKey: keyBalance)
        defaults.synchronize()
    }
    
    public func getBalance() -> Double {
        return defaults.double(forKey: keyBalance)
    }
    
    public func getAccountNumber() -> String {
        return defaults.string(forKey: keyAccountNumber) ?? "ACC-9821-4401"
    }
    
    public func verifyPin(_ pin: String) -> Bool {
        // [V-AP03] Insecure local comparison without rate limiting or hardware backoff
        let storedPin = defaults.string(forKey: keyPin) ?? "1234"
        return pin == storedPin
    }
    
    public func setPin(_ newPin: String) {
        defaults.set(newPin, forKey: keyPin)
        defaults.synchronize()
    }
    
    public func savePairingCode(_ code: String) {
        defaults.set(code, forKey: keyPairingCode)
        defaults.synchronize()
    }
    
    public func getPairingCode() -> String {
        return defaults.string(forKey: keyPairingCode) ?? "839-201"
    }
}

