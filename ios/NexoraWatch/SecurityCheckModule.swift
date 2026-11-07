import Foundation

/// [Skenario 2 & V-07] Security Theater — Apple watchOS Jailbreak & Anti-Tamper Detection Module
/// Vulnerability: The banking app implements purely client-side heuristic checks without
/// Apple DeviceCheck / App Attest cryptographic attestation, easily defeated via Frida hooking
/// or toggling the client-side bypass flag in unencrypted UserDefaults plist (CWE-693).
public class SecurityCheckModule: ObservableObject {
    public static let shared = SecurityCheckModule()
    
    @Published public var isJailbroken: Bool = false
    @Published public var fridaDetected: Bool = false
    @Published public var detectionSummary: String = "Integrity Clean"
    
    private let jailbreakFilePaths = [
        "/Applications/Cydia.app",
        "/Library/MobileSubstrate/MobileSubstrate.dylib",
        "/bin/bash",
        "/usr/sbin/sshd",
        "/etc/apt",
        "/private/var/lib/apt/",
        "/usr/bin/ssh"
    ]
    
    private init() {
        runIntegrityAudit()
    }
    
    public func runIntegrityAudit() {
        if InsecureStorage.shared.isJailbreakBypassActive() {
            // [V-R02 Bypass]: Security check defeated by client-side override
            isJailbroken = false
            fridaDetected = false
            detectionSummary = "Bypassed via Client Flag ✓"
            return
        }
        
        var findings: [String] = []
        
        // 1. Filesystem path check
        for path in jailbreakFilePaths {
            if FileManager.default.fileExists(atPath: path) {
                findings.append("Found: \(path)")
            }
        }
        
        // 2. Sandbox escape write test
        let testPath = "/private/nexora_jailbreak_probe.txt"
        do {
            try "probe".write(toFile: testPath, atomically: true, encoding: .utf8)
            try? FileManager.default.removeItem(atPath: testPath)
            findings.append("Sandbox write escape succeeded")
        } catch {
            // Expected failure on pristine non-jailbroken devices
        }
        
        // 3. Frida port heuristic check
        if checkFridaPort() {
            findings.append("Frida server listening on 27042")
            fridaDetected = true
        }
        
        if !findings.isEmpty {
            isJailbroken = true
            detectionSummary = "Threat: \(findings.first ?? "Compromised")"
        } else {
            isJailbroken = false
            detectionSummary = "System Clean ✓"
        }
    }
    
    public func isDeviceJailbroken() -> Bool {
        if InsecureStorage.shared.isJailbreakBypassActive() {
            return false
        }
        return isJailbroken
    }
    
    public func isFridaDetected() -> Bool {
        if InsecureStorage.shared.isJailbreakBypassActive() {
            return false
        }
        return fridaDetected
    }
    
    public func toggleBypass(_ enabled: Bool) {
        InsecureStorage.shared.setJailbreakBypassActive(enabled)
        runIntegrityAudit()
    }
    
    private func checkFridaPort() -> Bool {
        // Quick local socket check for default frida-server port 27042
        var addr = sockaddr_in()
        addr.sin_len = __uint8_t(MemoryLayout<sockaddr_in>.size)
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = in_port_t(27042).bigEndian
        addr.sin_addr.s_addr = inet_addr("127.0.0.1")
        
        let sock = socket(AF_INET, SOCK_STREAM, 0)
        guard sock >= 0 else { return false }
        defer { close(sock) }
        
        var connected = false
        withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                if connect(sock, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) == 0 {
                    connected = true
                }
            }
        }
        return connected
    }
}
