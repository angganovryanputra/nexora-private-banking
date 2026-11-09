import SwiftUI

public struct ContentView: View {
    @State private var isAuthenticated: Bool = false
    @State private var currentScreen: String = "balance"
    @ObservedObject var sessionManager = WatchSessionManager.shared
    @ObservedObject var wristManager = WristSensorManager.shared
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)
            
            if wristManager.isLockedDueToWristOff {
                WristLockoutView()
            } else if sessionManager.pending2FATransaction != nil {
                TwoFactorApprovalView()
            } else if !isAuthenticated {
                QuickPinPadView(isAuthenticated: $isAuthenticated)
            } else {
                switch currentScreen {
                case "qris":
                    QRISPaymentView(currentScreen: $currentScreen)
                case "cardless":
                    CardlessCashView(currentScreen: $currentScreen)
                case "cards":
                    CardFreezeView(currentScreen: $currentScreen)
                case "transfer":
                    TransferView(currentScreen: $currentScreen)
                case "transactions":
                    TransactionsView(currentScreen: $currentScreen)
                case "loans":
                    LoansView(currentScreen: $currentScreen)
                case "lab":
                    WatchPentestLabView(currentScreen: $currentScreen)
                default:
                    BalanceView(currentScreen: $currentScreen, isAuthenticated: $isAuthenticated)
                }
            }
        }
        .onOpenURL { url in
            handleIncomingURL(url)
        }
    }
    
    private func handleIncomingURL(_ url: URL) {
        // Deep Link Handler (e.g. nexorabank://account?num=NX-7391048)
        // [V-AP07 / BOLA]: Directly loads arbitrary target account without session authentication check
        guard url.scheme == "nexorabank" else { return }
        if let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
           let queryItems = components.queryItems {
            for item in queryItems {
                if item.name == "num", let targetAcct = item.value {
                    InsecureStorage.shared.saveAccountNumber(targetAcct)
                    // Auto-authenticate and route to balance to show BOLA exposure
                    isAuthenticated = true
                    currentScreen = "balance"
                }
            }
        }
    }
}
