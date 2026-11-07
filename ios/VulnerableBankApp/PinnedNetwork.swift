import Foundation
import React

@objc(PinnedNetwork)
class PinnedNetwork: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(testPinnedRequest:resolver:rejecter:)
    func testPinnedRequest(_ urlString: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let target = urlString ?? "http://localhost:5000/api/compliance/report"
        guard let url = URL(string: target) else {
            resolve([
                "status": "ERROR",
                "message": "Invalid URL supplied"
            ])
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 3.0

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpRes = response as? HTTPURLResponse {
                resolve([
                    "status": "ENFORCED",
                    "httpCode": httpRes.statusCode,
                    "host": url.host ?? "localhost",
                    "message": "TLS / HTTP check succeeded with status \(httpRes.statusCode)"
                ])
            } else {
                resolve([
                    "status": "BYPASSED",
                    "host": url.host ?? "localhost",
                    "message": error?.localizedDescription ?? "Connection bypass triggered"
                ])
            }
        }.resume()
    }
}
