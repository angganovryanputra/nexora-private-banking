import SwiftUI

struct BalanceView: View {
    @Binding var currentScreen: String
    @Binding var isAuthenticated: Bool
    @ObservedObject var sessionManager = WatchSessionManager.shared
    @ObservedObject var wristManager = WristSensorManager.shared
    
    @State private var balance: Double = InsecureStorage.shared.getBalance()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                // Header
                HStack {
                    Image(systemName: "banknote.fill")
                        .foregroundColor(.yellow)
                        .font(.system(size: 11))
                    Text("VulnBank Watch")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Circle()
                        .fill(sessionManager.isReachable ? Color.green : Color.orange)
                        .frame(width: 6, height: 6)
                }
                .padding(.horizontal, 4)
                
                // Balance Card
                VStack(spacing: 2) {
                    Text("TOTAL BALANCE")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.gray)
                    
                    Text("Rp \(formatCurrency(balance))")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundColor(.yellow)
                    
                    Text(InsecureStorage.shared.getAccountNumber())
                        .font(.system(size: 8, design: .monospaced))
                        .foregroundColor(.white.opacity(0.8))
                }
                .frame(maxWidth: .infinity)
                .padding(6)
                .background(Color.white.opacity(0.1))
                .cornerRadius(10)
                
                // Sensor & Sync Pill
                HStack {
                    Label("\(wristManager.simulatedHeartRate) bpm", systemImage: "heart.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.red)
                    Spacer()
                    Text(sessionManager.isReachable ? "iPhone Linked" : "Standalone")
                        .font(.system(size: 8))
                        .foregroundColor(sessionManager.isReachable ? .green : .orange)
                }
                .padding(.horizontal, 6)
                
                // Action Buttons
                Button(action: {
                    currentScreen = "qris"
                }) {
                    HStack {
                        Image(systemName: "qrcode")
                        Text("QRIS Pay (V-AP06)")
                    }
                    .font(.system(size: 10, weight: .bold))
                    .frame(maxWidth: .infinity, minHeight: 28)
                    .background(Color.yellow)
                    .foregroundColor(.black)
                    .cornerRadius(14)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    currentScreen = "lab"
                }) {
                    HStack {
                        Image(systemName: "ladybug.fill")
                        Text("Pentest Lab (6 Flaws)")
                    }
                    .font(.system(size: 10, weight: .bold))
                    .frame(maxWidth: .infinity, minHeight: 26)
                    .background(Color.orange.opacity(0.8))
                    .foregroundColor(.black)
                    .cornerRadius(13)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    wristManager.triggerWristOff()
                }) {
                    HStack {
                        Image(systemName: "sensor.tag.radiowaves.forward.fill")
                        Text("Test Wrist-Off (V-AP05)")
                    }
                    .font(.system(size: 9))
                    .frame(maxWidth: .infinity, minHeight: 24)
                    .background(Color.red.opacity(0.2))
                    .foregroundColor(.red)
                    .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    isAuthenticated = false
                }) {
                    Text("Lock Watch")
                        .font(.system(size: 9))
                        .foregroundColor(.gray)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 4)
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
