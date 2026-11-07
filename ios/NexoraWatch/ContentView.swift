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
    }
}
