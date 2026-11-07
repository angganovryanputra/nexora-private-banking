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

    // MARK: - Shared JSON helpers
    private func makeJSONRequest(path: String, method: String, body: [String: Any]?) -> URLRequest? {
        guard let url = URL(string: "\(getBaseUrl())\(path)") else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = method
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        // V-AP01: bearer token read from insecure UserDefaults (plaintext).
        if let token = InsecureStorage.shared.getAuthToken(), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func runJSON(_ request: URLRequest, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        session.dataTask(with: request) { data, _, error in
            if let error = error {
                DispatchQueue.main.async { completion(.failure(error)) }
                return
            }
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: [NSLocalizedDescriptionKey: "Malformed response"]))) }
                return
            }
            DispatchQueue.main.async { completion(.success(json)) }
        }.resume()
    }

    // MARK: - Login (SQLi-susceptible by design) + session caching
    public func login(username: String, password: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let request = makeJSONRequest(path: "/login", method: "POST",
                                            body: ["username": username, "password": password]) else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil))); return
        }
        runJSON(request) { result in
            if case .success(let json) = result {
                // V-AP01: JWT + account cached in plaintext UserDefaults.
                if let token = json["token"] as? String { InsecureStorage.shared.saveAuthToken(token) }
                if let acct = json["accountNumber"] as? String { InsecureStorage.shared.saveAccountNumber(acct) }
            }
            completion(result)
        }
    }

    // MARK: - Transfer (negative-amount logic flaw lives server-side, by design)
    public func transfer(toAccount: String, amount: Double, note: String = "Apple Watch transfer",
                         completion: @escaping (Result<[String: Any], Error>) -> Void) {
        let body: [String: Any] = [
            "from_account": InsecureStorage.shared.getAccountNumber(),
            "to_account": toAccount,
            "amount": amount,
            "description": note
        ]
        guard let request = makeJSONRequest(path: "/transfer", method: "POST", body: body) else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil))); return
        }
        runJSON(request) { result in
            if case .success(let json) = result, let nb = json["new_balance"] as? Double {
                InsecureStorage.shared.saveBalance(nb)
            }
            completion(result)
        }
    }

    // MARK: - Quick Pay (Skenario 11 & V-W06)
    public func quickPay(recipient: String = "NX-7391048", amount: Double = 50000.0,
                         completion: @escaping (Result<[String: Any], Error>) -> Void) {
        transfer(toAccount: recipient, amount: amount, note: "Quick Pay Transfer via Apple Watch", completion: completion)
    }

    // MARK: - Transactions (BOLA/IDOR by design: any account works)
    public func fetchTransactions(accountNumber: String? = nil,
                                  completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        let acct = accountNumber ?? InsecureStorage.shared.getAccountNumber()
        guard let request = makeJSONRequest(path: "/transactions/\(acct)", method: "GET", body: nil) else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil))); return
        }
        runJSON(request) { result in
            switch result {
            case .success(let json):
                let list = (json["transactions"] as? [[String: Any]]) ?? []
                completion(.success(list))
            case .failure(let e):
                completion(.failure(e))
            }
        }
    }

    // MARK: - Virtual cards list
    public func fetchCards(completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        guard let request = makeJSONRequest(path: "/api/virtual-cards", method: "GET", body: nil) else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil))); return
        }
        session.dataTask(with: request) { data, _, error in
            if let error = error { DispatchQueue.main.async { completion(.failure(error)) }; return }
            guard let data = data else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }; return
            }
            // Backend may return a bare array or {"cards": [...]}; handle both.
            let obj = try? JSONSerialization.jsonObject(with: data)
            let list = (obj as? [[String: Any]]) ?? ((obj as? [String: Any])?["cards"] as? [[String: Any]]) ?? []
            DispatchQueue.main.async { completion(.success(list)) }
        }.resume()
    }

    // MARK: - Loans
    public func fetchLoans(accountNumber: String? = nil,
                           completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        let acct = accountNumber ?? InsecureStorage.shared.getAccountNumber()
        guard let request = makeJSONRequest(path: "/loans/\(acct)", method: "GET", body: nil) else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil))); return
        }
        session.dataTask(with: request) { data, _, error in
            if let error = error { DispatchQueue.main.async { completion(.failure(error)) }; return }
            guard let data = data else {
                DispatchQueue.main.async { completion(.failure(NSError(domain: "NexoraNetwork", code: 500, userInfo: nil))) }; return
            }
            let obj = try? JSONSerialization.jsonObject(with: data)
            let list = (obj as? [[String: Any]]) ?? ((obj as? [String: Any])?["loans"] as? [[String: Any]]) ?? []
            DispatchQueue.main.async { completion(.success(list)) }
        }.resume()
    }

    public func requestLoan(amount: Double, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        let body: [String: Any] = ["account_number": InsecureStorage.shared.getAccountNumber(), "amount": amount]
        guard let request = makeJSONRequest(path: "/request_loan", method: "POST", body: body) else {
            completion(.failure(NSError(domain: "NexoraNetwork", code: 400, userInfo: nil))); return
        }
        runJSON(request, completion: completion)
    }
}

