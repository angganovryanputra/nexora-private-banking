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
                            .font(.system(size: 10, weight: .bold))
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
                    }
                    .frame(maxWidth: .infinity)
                    .padding(5)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(WatchTheme.surfaceElevated, lineWidth: 1)
                    )
                    
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
        isProcessing = true
        statusMessage = "Requesting ATM Token from Core..."
        WatchNetworkManager.shared.generateCardlessOtp(amount: 100000.0) { result in
            isProcessing = false
            switch result {
            case .success(let data):
                if let token = data["token"] as? String {
                    otpCode = token
                    countdown = 900
                    statusMessage = "Token issued: Rp 100.000"
                }
            case .failure:
                let fallback = String(format: "%06d", Int.random(in: 100000...999999))
                otpCode = fallback
                InsecureStorage.shared.setCardlessOtp(fallback)
                countdown = 900
                statusMessage = "Offline Token issued: Rp 100.000"
            }
        }
    }
    
    private func simulateAtmWithdrawal() {
        isProcessing = true
        statusMessage = "Submitting OTP \(otpCode) to ATM..."
        WatchNetworkManager.shared.verifyCardlessOtp(token: otpCode) { result in
            isProcessing = false
            switch result {
            case .success(let data):
                let status = data["status"] as? String ?? "DISPENSED"
                statusMessage = "ATM: \(status)! Rp 100.000 dispensed."
                let cur = InsecureStorage.shared.getBalance()
                InsecureStorage.shared.saveBalance(max(0.0, cur - 100000.0))
            case .failure(let err):
                statusMessage = "ATM Error: \(err.localizedDescription)"
            }
        }
    }
    
    private func triggerRaceConditionExploit() {
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
                        statusMessage = "[V-L04 EXPLOIT] Double-Dispense Succeeded!"
                    case .failure:
                        statusMessage = "[V-L04] Race execution triggered."
                    }
                }
            }
        }
    }
}
