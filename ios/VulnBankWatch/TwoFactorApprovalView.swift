import SwiftUI

/// [V-AP04] High-Value $50,000 2FA Push Notification Approval Modal
/// Vulnerability: Authorizes wire transfers without hardware cryptographic proof (Secure Enclave).
/// Clicking "APPROVE" transmits an unauthenticated dictionary packet back to the iPhone or API relay.
struct TwoFactorApprovalView: View {
    @ObservedObject var sessionManager = WatchSessionManager.shared
    
    var body: some View {
        if let tx = sessionManager.pending2FATransaction {
            ScrollView {
                VStack(spacing: 5) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text("HIGH-VALUE 2FA")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.red)
                    }
                    
                    VStack(spacing: 2) {
                        Text("Authorize Wire Transfer?")
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                        
                        Text("$\(String(format: "%.2f", tx["amount"] as? Double ?? 50000.0))")
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundColor(.yellow)
                        
                        Text("To: \(tx["recipient"] as? String ?? "OFFSHORE-SWIFT-991")")
                            .font(.system(size: 8, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    .padding(4)
                    .background(Color.red.opacity(0.15))
                    .cornerRadius(8)
                    
                    HStack(spacing: 6) {
                        Button(action: {
                            sessionManager.approvePendingTransaction()
                        }) {
                            Text("APPROVE")
                                .font(.system(size: 9, weight: .bold))
                                .frame(maxWidth: .infinity, minHeight: 26)
                                .background(Color.green)
                                .foregroundColor(.black)
                                .cornerRadius(13)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Button(action: {
                            sessionManager.rejectPendingTransaction()
                        }) {
                            Text("REJECT")
                                .font(.system(size: 9, weight: .bold))
                                .frame(maxWidth: .infinity, minHeight: 26)
                                .background(Color.gray.opacity(0.4))
                                .foregroundColor(.white)
                                .cornerRadius(13)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    Text("[V-AP04] No Cryptographic Biometric Challenge")
                        .font(.system(size: 7))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 4)
            }
        }
    }
}
