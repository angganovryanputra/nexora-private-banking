import Foundation

/// [Dual-Mode Network Relay for Apple watchOS]
/// Provides standalone direct HTTP communication between Apple Watch and the Python Flask core banking backend
/// via `URLSession` over Wi-Fi / direct Ethernet without requiring an active paired iPhone proxy.
public class WatchNetworkManager: ObservableObject {
    public static let shared = WatchNetworkManager()
    
    @Published public var isOnline: Bool = false
    @Published public var lastStatusMessage: String = "Idle"
    
    private let session: URLSession
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 4.0
        config.timeoutIntervalForResource = 6.0
        // INTENTIONALLY VULNERABLE: Trust user certs / unpinned HTTP for lab research
        self.session = URLSession(configuration: config)
    }
    
    private func getBaseUrl() -> String {
        return InsecureStorage.shared.getBackendUrl().replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
    }
    
    // MARK: - Health Check / Ping
    public func pingBackend(url: String? = nil, completion: @escaping (Bool, String) -> Void) {
        let base = (url ?? getBaseUrl()).replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
        guard let requestUrl = URL(string: "\(base)/api/compliance/report") else {
            completion(false, "Invalid URL")
            return
        }
        
        var request = URLRequest(url: requestUrl)
        request.httpMethod = "GET"
        
        session.dataTask(with: request) { [weak self] _, response, error in
            DispatchQueue.main.async {
                if let httpRes = response as? HTTPURLResponse, httpRes.statusCode == 200 {
                    self?.isOnline = true
                    self?.lastStatusMessage = "Backend Online ✓"
                    completion(true, "Backend online at \(base)")
                } else {
                    self?.isOnline = false
                    self?.lastStatusMessage = "Backend Unreachable"
                    completion(false, error?.localizedDescription ?? "Connection refused")
                }
            }
        }.resume()
    }
    
    // MARK: - Check Balance (BOLA / IDOR V-15)
    public func checkBalance(accountNumber: String? = nil, completion: @escaping (Result<Double, Error>) -> Void) {
        let acct = accountNumber ?? InsecureStorage.shared.getAccountNumber()
        guard let url = URL(string: "\(getBaseUrl())/check_balance/\(acct)") else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: [NSLocalizedDescriptionKey: "No data received"]))) }
                return
            }
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let bal = json["balance"] as? Double {
                    InsecureStorage.shared.saveBalance(bal)
                    DispatchQueue.main.async { completion(.success(bal)) }
                } else {
                    DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 422, userInfo: [NSLocalizedDescriptionKey: "Malformed response"]))) }
                }
            } catch {
                DispatchQueue.main.async { completion(.failure(error)) }
            }
        }.resume()
    }
    
    // MARK: - SNAP QRIS Checkout (V-W15)
    public func checkoutQRIS(amount: Double = 75000.0, merchant: String = "NEXORA MERCH 001", qrPayload: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(getBaseUrl())/api/qris/checkout") else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "account_number": InsecureStorage.shared.getAccountNumber(),
            "amount": amount,
            "merchant_name": merchant,
            "qr_payload": qrPayload,
            "currency": "IDR"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }
                return
            }
            if let newBal = json["new_balance"] as? Double {
                InsecureStorage.shared.saveBalance(newBal)
            }
            DispatchQueue.main.async { completion(.success(json)) }
        }.resume()
    }
    
    // MARK: - Cardless ATM Cash-Out: Generate OTP (Skenario 8)
    public func generateCardlessOtp(accountNumber: String? = nil, amount: Double = 100000.0, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(getBaseUrl())/api/atm/cardless-cash/generate") else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "account_number": accountNumber ?? InsecureStorage.shared.getAccountNumber(),
            "amount": amount,
            "device_id": "watch_apple_01"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }
                return
            }
            if let otp = json["token"] as? String {
                InsecureStorage.shared.setCardlessOtp(otp)
            }
            DispatchQueue.main.async { completion(.success(json)) }
        }.resume()
    }
    
    // MARK: - Cardless ATM Cash-Out: Verify / Dispense (Skenario 8 & 21)
    public func verifyCardlessOtp(token: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(getBaseUrl())/api/atm/cardless-cash/verify") else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "token": token,
            "atm_id": "ATM-JKT-CENTRAL-01"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }
                return
            }
            if let newBal = json["new_balance"] as? Double {
                InsecureStorage.shared.saveBalance(newBal)
            }
            DispatchQueue.main.async { completion(.success(json)) }
        }.resume()
    }
    
    // MARK: - Virtual Card Freeze / Unfreeze (Skenario 9 & 16)
    public func toggleCardFreeze(cardId: Int = 1, frozen: Bool, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(getBaseUrl())/api/wearable/card-freeze") else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "card_id": cardId,
            "frozen": frozen,
            "device_id": "watch_apple_01",
            "account_number": InsecureStorage.shared.getAccountNumber()
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }
                return
            }
            InsecureStorage.shared.setCardFrozen(frozen)
            DispatchQueue.main.async { completion(.success(json)) }
        }.resume()
    }
    
    // MARK: - High-Value 2FA Authorization (Skenario 4 & 17)
    public func authorize2FA(txId: String, amount: Double = 50000000.0, resolution: String = "APPROVED", completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\(getBaseUrl())/api/wearable/authorize_2fa") else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "tx_id": txId,
            "amount": amount,
            "resolution": resolution,
            "device_id": "watch_apple_01",
            "authenticated_without_biometrics": true
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }
                return
            }
            if resolution == "APPROVED" {
                let cur = InsecureStorage.shared.getBalance()
                InsecureStorage.shared.saveBalance(max(0.0, cur - amount))
            }
            DispatchQueue.main.async { completion(.success(json)) }
        }.resume()
    }
}
