import SwiftUI

/// Responsive Luxury Dashboard for Apple watchOS
struct BalanceView: View {
    @Binding var currentScreen: String
    @Binding var isAuthenticated: Bool
    @ObservedObject var sessionManager = WatchSessionManager.shared
    @ObservedObject var wristManager = WristSensorManager.shared
    
    @State private var balance: Double = InsecureStorage.shared.getBalance()
    
    var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let heroFontSize: CGFloat = isSmallWatch ? 14 : (geometry.size.height > 250 ? 18 : 16)
            let btnHeight: CGFloat = isSmallWatch ? 24 : 28
            
            ScrollView {
                VStack(spacing: 5) {
                    // Header Bar
                    HStack(spacing: 4) {
                        Image(systemName: "banknote.fill")
                            .foregroundColor(WatchTheme.gold)
                            .font(.system(size: 10))
                        Text("VulnBank")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Circle()
                            .fill(sessionManager.isReachable ? WatchTheme.emerald : WatchTheme.goldMuted)
                            .frame(width: 6, height: 6)
                        Text(sessionManager.isReachable ? "Linked" : "Local")
                            .font(.system(size: 7, weight: .semibold))
                            .foregroundColor(sessionManager.isReachable ? WatchTheme.emerald : WatchTheme.goldMuted)
                    }
                    .padding(.horizontal, 4)
                    
                    // Balance Card
                    VStack(spacing: 2) {
                        Text("TOTAL LIQUID BALANCE")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(WatchTheme.textMuted)
                            .tracking(0.5)
                        
                        Text("Rp \(formatCurrency(balance))")
                            .font(.system(size: heroFontSize, weight: .heavy, design: .rounded))
                            .foregroundColor(WatchTheme.gold)
                            .minimumScaleFactor(0.8)
                            .lineLimit(1)
                        
                        HStack(spacing: 4) {
                            Text(InsecureStorage.shared.getAccountNumber())
                                .font(.system(size: 7, design: .monospaced))
                                .foregroundColor(WatchTheme.textLight)
                            Text("• VIP")
                                .font(.system(size: 7, weight: .bold))
                                .foregroundColor(WatchTheme.emerald)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, isSmallWatch ? 4 : 6)
                    .padding(.horizontal, 6)
                    .background(WatchTheme.surface)
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(WatchTheme.surfaceElevated, lineWidth: 1)
                    )
                    
                    // Sensor & Health Telemetry
                    HStack {
                        HStack(spacing: 3) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 8))
                                .foregroundColor(WatchTheme.ruby)
                            Text("\(wristManager.simulatedHeartRate) BPM")
                                .font(.system(size: 7, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text("[V-AP02] Plain WCSession")
                            .font(.system(size: 7))
                            .foregroundColor(WatchTheme.textMuted)
                    }
                    .padding(.horizontal, 4)
                    
                    // Action Buttons (Full width with smooth radii)
                    Button(action: {
                        currentScreen = "qris"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "qrcode")
                                .font(.system(size: 10))
                            Text("QRIS Pay (V-AP06)")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.gold)
                        .foregroundColor(.black)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: {
                        currentScreen = "lab"
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "shield.lefthalf.filled.trianglebadge.exclamationmark")
                                .font(.system(size: 9))
                            Text("Pentest Lab (6 Flaws)")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.surfaceElevated)
                        .foregroundColor(WatchTheme.gold)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: {
                        wristManager.triggerWristOff()
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "sensor.tag.radiowaves.forward.fill")
                                .font(.system(size: 8))
                            Text("Test Wrist Lock (V-AP05)")
                                .font(.system(size: 8, weight: .medium))
                        }
                        .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 22 : 24)
                        .background(WatchTheme.ruby.opacity(0.2))
                        .foregroundColor(WatchTheme.ruby)
                        .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: {
                        isAuthenticated = false
                    }) {
                        Text("Lock Screen")
                            .font(.system(size: 8))
                            .foregroundColor(WatchTheme.textMuted)
                            .padding(.vertical, 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            balance = InsecureStorage.shared.getBalance()
        }
        .onReceive(sessionManager.$lastReceivedPacket) { _ in
            balance = InsecureStorage.shared.getBalance()
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = "."
        return formatter.string(from: NSNumber(value: value)) ?? "\(Int(value))"
    }
}
