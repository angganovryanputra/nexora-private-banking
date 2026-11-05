import Foundation
import WatchConnectivity
import React

@objc(WatchBridge)
class WatchBridge: RCTEventEmitter, WCSessionDelegate {
    private var hasListeners = false
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return ["WatchMessageReceived", "WatchContextUpdated", "Watch2FAResolution"]
    }
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    @objc(isWatchSupported:rejecter:)
    func isWatchSupported(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve(WCSession.isSupported())
    }
    
    @objc(isWatchPaired:rejecter:)
    func isWatchPaired(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard WCSession.isSupported() else {
            resolve(false)
            return
        }
        resolve(WCSession.default.isPaired)
    }
    
    @objc(isWatchAppInstalled:rejecter:)
    func isWatchAppInstalled(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard WCSession.isSupported() else {
            resolve(false)
            return
        }
        resolve(WCSession.default.isWatchAppInstalled)
    }
    
    @objc(sendMessageToWatch:resolver:rejecter:)
    func sendMessageToWatch(_ message: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard WCSession.isSupported(), WCSession.default.isReachable else {
            // Queue via applicationContext or transferUserInfo if not immediately reachable
            if let swiftDict = message as? [String: Any] {
                do {
                    try WCSession.default.updateApplicationContext(swiftDict)
                    resolve(["status": "QUEUED_IN_CONTEXT", "message": "Delivered to background context"])
                } catch {
                    reject("E_QUEUE_FAILED", error.localizedDescription, error)
                }
            } else {
                reject("E_NOT_REACHABLE", "Apple Watch is not currently reachable", nil)
            }
            return
        }
        
        if let swiftDict = message as? [String: Any] {
            WCSession.default.sendMessage(swiftDict, replyHandler: { reply in
                resolve(reply)
            }, errorHandler: { error in
                reject("E_SEND_FAILED", error.localizedDescription, error)
            })
        }
    }
    
    @objc(updateWatchContext:resolver:rejecter:)
    func updateWatchContext(_ context: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard WCSession.isSupported() else {
            reject("E_NOT_SUPPORTED", "WCSession is not supported on this device", nil)
            return
        }
        
        if let swiftDict = context as? [String: Any] {
            do {
                try WCSession.default.updateApplicationContext(swiftDict)
                resolve(["status": "CONTEXT_UPDATED"])
            } catch {
                reject("E_UPDATE_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    // MARK: - WCSessionDelegate
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if hasListeners {
            sendEvent(withName: "WatchMessageReceived", body: message)
        }
    }
    
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        if hasListeners {
            sendEvent(withName: "WatchMessageReceived", body: userInfo)
        }
    }
}

