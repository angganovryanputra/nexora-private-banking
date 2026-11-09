import SwiftUI

/// Responsive Luxury Dashboard for Apple watchOS
/// Full parity with Android Wear OS & Mobile Companion suite.
struct BalanceView: View {
    @Binding var currentScreen: String
    @Binding var isAuthenticated: Bool
    @ObservedObject var sessionManager = WatchSessionManager.shared
    @ObservedObject var wristManager = WristSensorManager.shared
    @ObservedObject var networkManager = WatchNetworkManager.shared
    
    @State private var balance: Double = InsecureStorage.shared.getBalance()
    @State private var isBalanceMasked: Bool = false
    @State private var isAccountMasked: Bool = true
    @State private var isRefreshing: Bool = false
    @State private var lastUpdatedText: String = "Updated 21:45 WIB"
    
    var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let heroFontSize: CGFloat = isSmallWatch ? 12 : (geometry.size.height > 250 ? 15 : 13.5)
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            let isUltra = geometry.size.height > 250
            
            ScrollView {
                VStack(spacing: 4) {
                    // Header Bar with Link & Dual-Mode Status
                    HStack(spacing: 3) {
                        Image(systemName: "diamond.fill")
                            .foregroundColor(WatchTheme.gold)
                            .font(.system(size: 8))
                        Text("Nexora Private")
                            .font(.system(size: WatchTheme.scaledFont(10, geometry.size), weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Circle()
                            .fill(networkManager.isOnline ? WatchTheme.emerald : (sessionManager.isReachable ? WatchTheme.gold : WatchTheme.textMuted))
                            .frame(width: 5, height: 5)
                        Text(networkManager.isOnline ? "HTTP" : (sessionManager.isReachable ? "WCSync" : "Local"))
                            .font(.system(size: 6.5, weight: .semibold))
                            .foregroundColor(networkManager.isOnline ? WatchTheme.emerald : WatchTheme.textMuted)
                    }
                    .padding(.horizontal, 4)
                    
                    // Balance Card with Masking & Tap-to-Refresh
                    VStack(spacing: 2) {
                        HStack {
                            Text("TOTAL LIQUID ASSETS")
                                .font(.system(size: 6.5, weight: .bold))
                                .foregroundColor(WatchTheme.textMuted)
                                .tracking(0.5)
                            Spacer()
                            Button(action: {
                                WatchTheme.playHaptic(.click)
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    isBalanceMasked.toggle()
                                }
                            }) {
                                Image(systemName: isBalanceMasked ? "eye.slash.fill" : "eye.fill")
                                    .font(.system(size: 7.5))
                                    .foregroundColor(WatchTheme.gold)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        
                        Text(isBalanceMasked ? "Rp •••••••••" : WatchTheme.formatRupiah(balance))
                            .font(.system(size: heroFontSize, weight: .heavy, design: .rounded))
                            .foregroundColor(WatchTheme.gold)
                            .minimumScaleFactor(0.7)
                            .lineLimit(1)
                            .onTapGesture {
                                refreshBalance()
                            }
                        
                        // Maskable Account Number & Holder
                        HStack(spacing: 3) {
                            Text(maskedAccountDisplay())
                                .font(.system(size: 6.5, design: .monospaced))
                                .foregroundColor(WatchTheme.textLight)
                                .onTapGesture {
                                    WatchTheme.playHaptic(.click)
                                    isAccountMasked.toggle()
                                }
                            Text("•")
                                .font(.system(size: 6.5))
                                .foregroundColor(WatchTheme.textMuted)
                            Text(InsecureStorage.shared.getAccountHolder())
                                .font(.system(size: 6.5, weight: .semibold))
                                .foregroundColor(WatchTheme.emerald)
                                .lineLimit(1)
                        }
                        
                        // Last Synchronized Timestamp
                        HStack(spacing: 3) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 5.5))
                                .foregroundColor(WatchTheme.textMuted)
                                .rotationEffect(.degrees(isRefreshing ? 360 : 0))
                            Text(lastUpdatedText)
                                .font(.system(size: 6, weight: .medium))
                                .foregroundColor(WatchTheme.textMuted)
                        }
                        .padding(.top, 1)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, isSmallWatch ? 3 : 5)
                    .padding(.horizontal, 6)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(WatchTheme.surfaceElevated, lineWidth: 1)
                    )
                    
                    // Sensor & PPG Biometrics Telemetry
                    HStack {
                        HStack(spacing: 3) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 7.5))
                                .foregroundColor(WatchTheme.ruby)
                            Text("\(wristManager.simulatedHeartRate) BPM")
                                .font(.system(size: 6.5, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text("PPG Sensor Active")
                            .font(.system(size: 6.5))
                            .foregroundColor(WatchTheme.emerald)
                    }
                    .padding(.horizontal, 4)
                    
                    // 1. SNAP QRIS Payment
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "qris"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "qrcode")
                                .font(.system(size: 9))
                            Text("SNAP QRIS Pay")
                                .font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.gold)
                        .foregroundColor(.black)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Transfer
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "transfer"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 9))
                            Text("Transfer").font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())

                    // Transaction History
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "transactions"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "list.bullet.rectangle.portrait.fill").font(.system(size: 9))
                            Text("History").font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.emerald)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())

                    // Loans
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "loans"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "building.columns.fill").font(.system(size: 9))
                            Text("Loans").font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())

                    // 2. Cardless ATM Withdrawal
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "cardless"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "banknote.fill")
                                .font(.system(size: 9))
                            Text("Cardless ATM OTP")
                                .font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // 3. Emergency Card Kill-Switch
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "cards"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "creditcard.and.123")
                                .font(.system(size: 9))
                            Text("Card Kill-Switch")
                                .font(.system(size: 8.5, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.emerald)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // 4. Security Audit Lab
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        currentScreen = "lab"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "shield.lefthalf.filled.trianglebadge.exclamationmark")
                                .font(.system(size: 8.5))
                            Text("Security Audit Lab")
                                .font(.system(size: 8, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 22 : 25)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // 5. Test Wrist Lock
                    Button(action: {
                        WatchTheme.playHaptic(.warning)
                        wristManager.triggerWristOff()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "sensor.tag.radiowaves.forward.fill")
                                .font(.system(size: 7.5))
                            Text("Test Wrist Lock")
                                .font(.system(size: 7.5, weight: .medium))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 19 : 22)
                        .background(WatchTheme.ruby.opacity(0.18))
                        .foregroundColor(WatchTheme.ruby)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Lock Screen
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        isAuthenticated = false
                    }) {
                        Text("Lock Screen")
                            .font(.system(size: 7.5))
                            .foregroundColor(WatchTheme.textMuted)
                            .padding(.vertical, 1)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            refreshBalance()
        }
        .onReceive(sessionManager.$lastReceivedPacket) { _ in
            balance = InsecureStorage.shared.getBalance()
            updateLastSyncTime()
        }
    }
    
    private func maskedAccountDisplay() -> String {
        let acct = InsecureStorage.shared.getAccountNumber()
        if isAccountMasked {
            let suffix = acct.count >= 3 ? String(acct.suffix(3)) : "014"
            return "NX-••••\(suffix)"
        }
        return acct
    }
    
    private func updateLastSyncTime() {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        let timeStr = formatter.string(from: Date())
        lastUpdatedText = "Updated \(timeStr) WIB"
    }
    
    private func refreshBalance() {
        WatchTheme.playHaptic(.click)
        withAnimation(.easeInOut(duration: 0.3)) {
            isRefreshing = true
        }
        balance = InsecureStorage.shared.getBalance()
        updateLastSyncTime()
        WatchNetworkManager.shared.checkBalance { result in
            DispatchQueue.main.async {
                self.isRefreshing = false
                if case .success(let b) = result {
                    WatchTheme.playHaptic(.success)
                    self.balance = b
                    self.updateLastSyncTime()
                }
            }
        }
    }
}
