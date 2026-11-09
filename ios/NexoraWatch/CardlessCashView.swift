import SwiftUI

/// [Skenario 8 & 21] ATM Cardless Cash-Out Screen for Apple watchOS
/// Features:
/// - Generates short-lived 6-digit withdrawal OTP (15-minute countdown).
/// - Demonstrates OTP Brute-Force vulnerability (CWE-307) and Double-Dispense Race Condition (CWE-362).
public struct CardlessCashView: View {
    @Binding var currentScreen: String
    
    @State private var otpCode: String = InsecureStorage.shared.getCardlessOtp() ?? "463544"
    @State private var countdown: Int = 900 // 15 minutes
    @State private var statusMessage: String = "Present code at any Nexora ATM"
    @State private var isProcessing: Bool = false
    @State private var isDispensing: Bool = false
    @State private var timer: Timer?
    
    public init(currentScreen: Binding<String>) {
        self._currentScreen = currentScreen
    }
    
    public var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            
            ScrollView {
                VStack(spacing: 5) {
                    // Header Bar
                    HStack {
                        Button(action: {
                            WatchTheme.playHaptic(.click)
                            currentScreen = "balance"
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(WatchTheme.gold)
                                .frame(width: 22, height: 22)
                                .background(WatchTheme.surface)
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Spacer()
                        Text("Cardless ATM")
                            .font(.system(size: WatchTheme.scaledFont(10, geometry.size), weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    
                    // OTP Box Card
                    VStack(spacing: 2) {
                        Text("WITHDRAWAL CODE")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(WatchTheme.textMuted)
                            .tracking(0.5)
                        
                        Text(formatOtp(otpCode))
                            .font(.system(size: isSmallWatch ? 18 : 22, weight: .heavy, design: .monospaced))
                            .foregroundColor(WatchTheme.gold)
                            .tracking(2)
                            .padding(.vertical, 2)
                        
                        HStack(spacing: 4) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 8))
                                .foregroundColor(WatchTheme.emerald)
                            Text("Valid for: \(countdown / 60)m \(countdown % 60)s")
                                .font(.system(size: 7, weight: .semibold))
                                .foregroundColor(WatchTheme.emerald)
                        }
                        
                        // Visual Countdown Progress Bar (15 minutes)
                        GeometryReader { barGeo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 1.5)
                                    .fill(WatchTheme.surfaceElevated)
                                    .frame(height: 3)
                                RoundedRectangle(cornerRadius: 1.5)
                                    .fill(countdown > 120 ? WatchTheme.emerald : WatchTheme.ruby)
                                    .frame(width: max(0, barGeo.size.width * CGFloat(countdown) / 900.0), height: 3)
                            }
                        }
                        .frame(height: 3)
                        .padding(.horizontal, 4)
                        .padding(.top, 2)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(5)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(WatchTheme.surfaceElevated, lineWidth: 1)
                    )
                    
                    // ATM Terminal Sound Simulation Cue
                    HStack(spacing: 3) {
                        Image(systemName: isDispensing ? "speaker.wave.3.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 6.5))
                            .foregroundColor(isDispensing ? WatchTheme.gold : WatchTheme.emerald)
                        Text(isDispensing ? "ATM Dispense Chime: Playing..." : "ATM Chime Simulation: Active")
                            .font(.system(size: 6, weight: .medium))
                            .foregroundColor(WatchTheme.textMuted)
                    }
                    .padding(.vertical, 1)
                    
                    // Status Pill
                    Text(statusMessage)
                        .font(.system(size: 7, design: .monospaced))
                        .foregroundColor(WatchTheme.textLight)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 4)
                    
                    // Generate New OTP Button
                    Button(action: {
                        generateNewOtp()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 9))
                            Text("Generate New OTP")
                                .font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(isProcessing)
                    
                    // Simulate ATM Withdrawal (Rp 100.000)
                    Button(action: {
                        simulateAtmWithdrawal()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "banknote.fill")
                                .font(.system(size: 9))
                            Text("Simulate Dispense (Rp 100.000)")
                                .font(.system(size: 8, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.emerald)
                        .foregroundColor(.black)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(isProcessing)
                    
                    // Exploit Trigger: Skenario 21 (Race Condition Double-Dispense)
                    Button(action: {
                        triggerRaceConditionExploit()
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: "bolt.horizontal.fill")
                                .font(.system(size: 8))
                            Text("Exploit: Double-Dispense Race")
                                .font(.system(size: 7.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 20 : 22)
                        .background(WatchTheme.ruby.opacity(0.2))
                        .foregroundColor(WatchTheme.ruby)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private func formatOtp(_ otp: String) -> String {
        if otp.count == 6 {
            let p1 = otp.prefix(3)
            let p2 = otp.suffix(3)
            return "\(p1) \(p2)"
        }
        return otp
    }
    
    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if countdown > 0 {
                countdown -= 1
            } else {
                statusMessage = "OTP expired. Tap Generate New OTP."
            }
        }
    }
    
    private func generateNewOtp() {
        WatchTheme.playHaptic(.click)
        isProcessing = true
        statusMessage = "Requesting ATM Token from Core..."
        WatchNetworkManager.shared.generateCardlessOtp(amount: 100000.0) { result in
            DispatchQueue.main.async {
                self.isProcessing = false
                switch result {
                case .success(let data):
                    WatchTheme.playHaptic(.success)
                    if let token = data["token"] as? String {
                        self.otpCode = token
                        self.countdown = 900
                        self.statusMessage = "Token issued: Rp 100.000"
                    }
                case .failure(let err):
                    WatchTheme.playHaptic(.failure)
                    self.otpCode = ""
                    self.statusMessage = "Backend unreachable — \(err.localizedDescription)"
                }
            }
        }
    }
    
    private func simulateAtmWithdrawal() {
        WatchTheme.playHaptic(.click)
        isProcessing = true
        isDispensing = true
        statusMessage = "Submitting OTP \(otpCode) to ATM..."
        WatchNetworkManager.shared.verifyCardlessOtp(token: otpCode) { result in
            DispatchQueue.main.async {
                self.isProcessing = false
                self.isDispensing = false
                switch result {
                case .success(let data):
                    WatchTheme.playHaptic(.success)
                    let status = data["status"] as? String ?? "DISPENSED"
                    self.statusMessage = "ATM: \(status)! Rp 100.000 dispensed."
                    WatchNetworkManager.shared.checkBalance { _ in }
                case .failure(let err):
                    WatchTheme.playHaptic(.failure)
                    self.statusMessage = "ATM Error: \(err.localizedDescription)"
                }
            }
        }
    }
    
    private func triggerRaceConditionExploit() {
        WatchTheme.playHaptic(.click)
        statusMessage = "Firing concurrent double-dispense threads..."
        // Fires two parallel requests simulating simultaneous ATM withdrawal race condition (Skenario 21)
        let token = otpCode
        DispatchQueue.global(qos: .userInteractive).async {
            WatchNetworkManager.shared.verifyCardlessOtp(token: token) { _ in }
        }
        DispatchQueue.global(qos: .userInteractive).async {
            WatchNetworkManager.shared.verifyCardlessOtp(token: token) { res in
                DispatchQueue.main.async {
                    switch res {
                    case .success:
                        WatchTheme.playHaptic(.warning)
                        self.statusMessage = "[V-L04 EXPLOIT] Double-Dispense Succeeded!"
                    case .failure:
                        WatchTheme.playHaptic(.warning)
                        self.statusMessage = "[V-L04] Race execution triggered."
                    }
                }
            }
        }
    }
}
