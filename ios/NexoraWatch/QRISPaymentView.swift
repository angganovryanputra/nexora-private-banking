import SwiftUI
import WatchConnectivity

/// [Skenario 6 & V-AP06] Dynamic SNAP QRIS Payment on Apple watchOS
/// Scaled dynamically across all Apple Watch sizes.
/// Vulnerability: Dynamic QR string has a static transaction identifier without timestamp validation / TOTP replay protection (CWE-294).
public struct QRISPaymentView: View {
    @Binding var currentScreen: String
    @State private var countdown: Int = 120
    @State private var qrisString: String = "00020101021226610016ID.NEXORA.WWW01189360099800000000015204581253033605802ID5920NEXORA DIGITAL MERCH6007JAKARTA62070703A016304E8A2"
    @State private var timer: Timer?
    @State private var statusMessage: String = "Merchant: NEXORA DIGITAL MERCH 001"
    @State private var isProcessing: Bool = false
    @State private var scanBeamOffset: CGFloat = -25
    
    public init(currentScreen: Binding<String>) {
        self._currentScreen = currentScreen
    }
    
    public var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let qrBoxSize: CGFloat = isSmallWatch ? 64 : (geometry.size.height > 250 ? 84 : 72)
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            
            ScrollView {
                VStack(spacing: 5) {
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
                        Text("SNAP QRIS")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    
                    // Dynamic QR Code Card with Matrix Scanner Effect
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.white)
                            .frame(width: qrBoxSize, height: qrBoxSize)
                            .shadow(color: Color.black.opacity(0.3), radius: 4, x: 0, y: 2)
                        
                        VStack(spacing: 1) {
                            Image(systemName: "qrcode")
                                .font(.system(size: qrBoxSize * 0.55))
                                .foregroundColor(.black)
                            Text("NEXORA")
                                .font(.system(size: 6, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                                .tracking(0.5)
                        }
                        
                        // Scanner Beam Simulation
                        Rectangle()
                            .fill(LinearGradient(
                                colors: [Color.clear, WatchTheme.ruby.opacity(0.6), Color.clear],
                                startPoint: .top,
                                endPoint: .bottom
                            ))
                            .frame(width: qrBoxSize - 8, height: 2)
                            .offset(y: scanBeamOffset)
                    }
                    .padding(.vertical, 2)
                    
                    // Official National Merchant ID (NMID) Badge
                    VStack(spacing: 1) {
                        Text("NMID: ID1020021189360")
                            .font(.system(size: 6.5, weight: .bold, design: .monospaced))
                            .foregroundColor(WatchTheme.gold)
                        Text(statusMessage)
                            .font(.system(size: 7, weight: .medium))
                            .foregroundColor(WatchTheme.textLight)
                            .multilineTextAlignment(.center)
                    }
                    
                    // Timer & Status Pill
                    HStack(spacing: 3) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 8))
                            .foregroundColor(WatchTheme.gold)
                        Text("Expires in: \(countdown)s")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(WatchTheme.gold)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)
                    
                    // 1-Tap POS Scan Simulation Button (Rp 75.000)
                    Button(action: {
                        executeQrisPayment()
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 9))
                                .foregroundColor(.black)
                            Text("Simulate POS Scan (Rp 75.000)")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundColor(.black)
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(isProcessing)
                    
                    // Exploit Trigger: Skenario 6 (Replay Captured QRIS Token)
                    Button(action: {
                        triggerQrisReplayExploit()
                    }) {
                        HStack(spacing: 3) {
                            Image(systemName: "arrow.counterclockwise.circle.fill")
                                .font(.system(size: 8))
                            Text("Exploit: Replay QRIS Token")
                                .font(.system(size: 7.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 20 : 22)
                        .background(WatchTheme.ruby.opacity(0.18))
                        .foregroundColor(WatchTheme.ruby)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            startCountdown()
            startBeamAnimation()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private func startBeamAnimation() {
        withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
            scanBeamOffset = 25
        }
    }
    
    private func startCountdown() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if countdown > 0 {
                countdown -= 1
            } else {
                countdown = 120
            }
        }
    }
    
    private func executeQrisPayment() {
        WatchTheme.playHaptic(.click)
        isProcessing = true
        statusMessage = "Processing POS transaction Rp 75.000..."
        
        WatchNetworkManager.shared.checkoutQRIS(amount: 75000.0, qrPayload: qrisString) { result in
            DispatchQueue.main.async {
                self.isProcessing = false
                switch result {
                case .success(let data):
                    WatchTheme.playHaptic(.success)
                    let status = data["status"] as? String ?? "PAID"
                    self.statusMessage = "POS: \(status) (Rp 75.000) ✓"
                    let cur = InsecureStorage.shared.getBalance()
                    InsecureStorage.shared.saveBalance(max(0.0, cur - 75000.0))
                case .failure:
                    WatchTheme.playHaptic(.failure)
                    self.statusMessage = "Transaksi Gagal: Backend Offline"
                }
            }
            
            // Broadcast payment to iPhone bridge
            let payload: [String: Any] = [
                "action": "QRIS_PAYMENT_COMPLETED",
                "payload": [
                    "amount": 75000.0,
                    "currency": "IDR",
                    "merchant": "NEXORA DIGITAL MERCH 001",
                    "qr_payload": self.qrisString
                ]
            ]
            if WatchSessionManager.shared.isReachable {
                WCSession.default.sendMessage(payload, replyHandler: nil, errorHandler: nil)
            } else {
                WCSession.default.transferUserInfo(payload)
            }
        }
    }
    
    private func triggerQrisReplayExploit() {
        WatchTheme.playHaptic(.click)
        statusMessage = "Replaying captured static QR token..."
        // Fires duplicate transaction using identical QR payload (Skenario 6 POC)
        WatchNetworkManager.shared.checkoutQRIS(amount: 75000.0, qrPayload: qrisString) { res in
            DispatchQueue.main.async {
                switch res {
                case .success:
                    WatchTheme.playHaptic(.warning)
                    self.statusMessage = "[V-AP06 EXPLOIT] Token Replay Accepted!"
                case .failure:
                    WatchTheme.playHaptic(.warning)
                    self.statusMessage = "[V-AP06] Token Replay Dispatched."
                }
            }
        }
    }
}
