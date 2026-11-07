import Foundation
import React

@objc(HeartRate)
class HeartRate: RCTEventEmitter {
    private var isMonitoring = false
    private var timer: Timer?
    private var hasListeners = false
    private var wristState = true
    private var readingsHistory: [[String: Any]] = []

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["HeartRate"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    @objc func start() {
        guard !isMonitoring else { return }
        isMonitoring = true
        DispatchQueue.main.async {
            self.timer?.invalidate()
            self.timer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
                guard let self = self, self.hasListeners else { return }
                let bpm = self.wristState ? Int.random(in: 68...82) : 0
                let timestamp = Int(Date().timeIntervalSince1970 * 1000)
                let item: [String: Any] = ["bpm": bpm, "timestamp": timestamp]
                self.readingsHistory.append(item)
                if self.readingsHistory.count > 50 { self.readingsHistory.removeFirst() }
                self.sendEvent(withName: "HeartRate", body: item)
            }
        }
    }

    @objc func stop() {
        isMonitoring = false
        DispatchQueue.main.async {
            self.timer?.invalidate()
            self.timer = nil
        }
    }

    @objc(getWristState:rejecter:)
    func getWristState(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        resolve(wristState)
    }

    @objc(setWristPresent:resolver:rejecter:)
    func setWristPresent(_ present: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        wristState = present
        resolve(present)
    }

    @objc(getHistory:rejecter:)
    func getHistory(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if let data = try? JSONSerialization.data(withJSONObject: readingsHistory),
           let str = String(data: data, encoding: .utf8) {
            resolve(str)
        } else {
            resolve("[]")
        }
    }

    @objc(clearHistory:rejecter:)
    func clearHistory(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        readingsHistory.removeAll()
        resolve(nil)
    }
}
