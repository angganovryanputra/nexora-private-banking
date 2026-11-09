import SwiftUI

/// [V-AP03] 4-Digit Quick-PIN Keypad for Apple watchOS
/// Features dynamic responsive layout scaling across 40mm, 41mm, 44mm, 45mm, and 49mm Ultra.
/// Vulnerability: No rate limiting, no biometric lockout escalation, and no hardware-backed delay.
struct QuickPinPadView: View {
    @Binding var isAuthenticated: Bool
    @State private var enteredPin: String = ""
    @State private var errorMessage: String = ""
    @State private var attemptCount: Int = 0
    
    let columns = [
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4),
        GridItem(.flexible(), spacing: 4)
    ]
    
    var body: some View {
        GeometryReader { geometry in
            let btnHeight = WatchTheme.buttonHeight(screenHeight: geometry.size.height)
            let keyFont = WatchTheme.keyFontSize(screenWidth: geometry.size.width)
            
            VStack(spacing: 3) {
                // Header
                HStack(spacing: 4) {
                    Image(systemName: "lock.shield.fill")
                        .foregroundColor(WatchTheme.gold)
                        .font(.system(size: 10))
                    Text("Quick-PIN")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                }
                
                // PIN Dots
                HStack(spacing: 7) {
                    ForEach(0..<4) { index in
                        Circle()
                            .fill(index < enteredPin.count ? WatchTheme.gold : WatchTheme.surfaceElevated)
                            .frame(width: 7, height: 7)
                    }
                }
                .padding(.vertical, 1)
                
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundColor(WatchTheme.ruby)
                }
                
                // Keypad 3x4 Grid
                LazyVGrid(columns: columns, spacing: 3) {
                    ForEach(1...9, id: \.self) { num in
                        Button(action: {
                            appendDigit("\(num)")
                        }) {
                            Text("\(num)")
                                .font(.system(size: keyFont, weight: .bold))
                                .frame(maxWidth: .infinity, minHeight: btnHeight)
                                .background(WatchTheme.surface)
                                .foregroundColor(.white)
                                .cornerRadius(btnHeight / 2)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    // Clear button
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        enteredPin = ""
                        errorMessage = ""
                    }) {
                        Image(systemName: "delete.left.fill")
                            .font(.system(size: 10))
                            .frame(maxWidth: .infinity, minHeight: btnHeight)
                            .background(WatchTheme.ruby.opacity(0.3))
                            .foregroundColor(WatchTheme.ruby)
                            .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Zero
                    Button(action: {
                        appendDigit("0")
                    }) {
                        Text("0")
                            .font(.system(size: keyFont, weight: .bold))
                            .frame(maxWidth: .infinity, minHeight: btnHeight)
                            .background(WatchTheme.surface)
                            .foregroundColor(.white)
                            .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Demo Autofill (1234)
                    Button(action: {
                        WatchTheme.playHaptic(.click)
                        enteredPin = "1234"
                        verify()
                    }) {
                        Text("1234")
                            .font(.system(size: 9, weight: .heavy))
                            .foregroundColor(WatchTheme.gold)
                            .frame(maxWidth: .infinity, minHeight: btnHeight)
                            .background(WatchTheme.gold.opacity(0.2))
                            .cornerRadius(btnHeight / 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Text("[V-AP03] No Rate Limit (\(attemptCount) tries)")
                    .font(.system(size: 7))
                    .foregroundColor(WatchTheme.textMuted)
                    .padding(.top, 1)
            }
            .padding(.horizontal, 4)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
    
    private func appendDigit(_ digit: String) {
        WatchTheme.playHaptic(.click)
        if enteredPin.count < 4 {
            enteredPin.append(digit)
            if enteredPin.count == 4 {
                verify()
            }
        }
    }
    
    private func verify() {
        attemptCount += 1
        if InsecureStorage.shared.verifyPin(enteredPin) {
            WatchTheme.playHaptic(.success)
            // V-AP03 → real backend sign-in: fetch a live JWT + account number so
            // the watch reads the SAME SQLite ledger as the phone/Wear OS app.
            // (No mock session; the token is cached in insecure UserDefaults.)
            WatchNetworkManager.shared.login(username: "alexander.vance", password: "Password123!") { _ in }
            isAuthenticated = true
        } else {
            WatchTheme.playHaptic(.failure)
            errorMessage = "Invalid PIN (\(attemptCount))"
            enteredPin = ""
        }
    }
}
