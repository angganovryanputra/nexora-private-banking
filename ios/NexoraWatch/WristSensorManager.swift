import Foundation
import WatchKit
import Combine

/// [V-AP05] Sensor & Wrist-Off Security Flaw on Apple watchOS
/// Vulnerability: The banking app relies on a purely client-side boolean flag
/// `isWristAttached` that can be spoofed or bypassed using Frida / runtime method swizzling
/// (`WKInterfaceDevice.current().isWristDetectEnabled`).
public class WristSensorManager: ObservableObject {
    public static let shared = WristSensorManager()
    
    @Published public var isWristAttached: Bool = true
    @Published public var isLockedDueToWristOff: Bool = false
    @Published public var simulatedHeartRate: Int = 74
    @Published public var bypassActive: Bool = false
    
    private var timer: Timer?
    
    private init() {
        startTelemetrySimulation()
    }
    
    public func startTelemetrySimulation() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if self.isWristAttached {
                self.simulatedHeartRate = Int.random(in: 68...82)
            } else {
                self.simulatedHeartRate = 0
            }
        }
    }
    
    public func triggerWristOff() {
        if bypassActive {
            // [V-AP05 Bypass]: Security check defeated by client-side override
            isLockedDueToWristOff = false
            return
        }
        isWristAttached = false
        isLockedDueToWristOff = true
    }
    
    public func triggerWristOn() {
        isWristAttached = true
        isLockedDueToWristOff = false
    }
    
    public func toggleBypass(_ enabled: Bool) {
        bypassActive = enabled
        if enabled {
            isLockedDueToWristOff = false
            isWristAttached = true
        }
    }
}

