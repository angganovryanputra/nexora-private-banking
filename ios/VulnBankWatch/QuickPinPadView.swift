import SwiftUI

/// [V-AP03] 4-Digit Quick-PIN Keypad for Apple watchOS
/// Vulnerability: No rate limiting, no biometric lockout escalation, and no hardware-backed delay.
/// An automated script or UI testing tool can brute force all 10,000 combinations in under 2 minutes.
struct QuickPinPadView: View {
    @Binding var isAuthenticated: Bool
    @State private var enteredPin: String = ""
    @State private var errorMessage: String = ""
    @State private var attemptCount: Int = 0
    
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                Text("VulnBank Quick-PIN")
                    .font(.caption2)
                    .foregroundColor(.yellow)
                    .bold()
                
                // PIN Dots
                HStack(spacing: 8) {
                    ForEach(0..<4) { index in
                        Circle()
                            .fill(index < enteredPin.count ? Color.yellow : Color.gray.opacity(0.4))
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.vertical, 2)
                
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.system(size: 9))
                        .foregroundColor(.red)
                }
                
                // Keypad 3x4
                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(1...9, id: \.self) { num in
                        Button(action: {
                            appendDigit("\(num)")
                        }) {
                            Text("\(num)")
                                .font(.system(size: 14, weight: .bold))
                                .frame(maxWidth: .infinity, minHeight: 28)
                                .background(Color.gray.opacity(0.25))
                                .cornerRadius(14)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    // Clear button
                    Button(action: {
                        enteredPin = ""
                        errorMessage = ""
                    }) {
                        Image(systemName: "delete.left")
                            .font(.system(size: 11))
                            .frame(maxWidth: .infinity, minHeight: 28)
                            .background(Color.red.opacity(0.3))
                            .cornerRadius(14)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Zero
                    Button(action: {
                        appendDigit("0")
                    }) {
                        Text("0")
                            .font(.system(size: 14, weight: .bold))
                            .frame(maxWidth: .infinity, minHeight: 28)
                            .background(Color.gray.opacity(0.25))
                            .cornerRadius(14)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Demo Autofill (1234)
                    Button(action: {
                        enteredPin = "1234"
                        verify()
                    }) {
                        Text("PIN")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.yellow)
                            .frame(maxWidth: .infinity, minHeight: 28)
                            .background(Color.yellow.opacity(0.2))
                            .cornerRadius(14)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Text("V-AP03: Rate Limit Disabled (\(attemptCount) tries)")
                    .font(.system(size: 8))
                    .foregroundColor(.gray)
            }
            .padding(.horizontal, 4)
        }
    }
    
    private func appendDigit(_ digit: String) {
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
            isAuthenticated = true
        } else {
            errorMessage = "Invalid PIN (\(attemptCount))"
            enteredPin = ""
        }
    }
}
