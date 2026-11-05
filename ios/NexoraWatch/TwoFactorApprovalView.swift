import SwiftUI

/// [V-AP04] High-Value $50,000 Out-of-Band 2FA Approval Modal
/// Responsive modal adapting to small (40mm) and large (49mm Ultra) Apple Watches.
/// Vulnerability: Approves wire transfer without biometric verification or Secure Enclave signature.
struct TwoFactorApprovalView: View {
    @ObservedObject var sessionManager = WatchSessionManager.shared
    
    var body: some View {
        if let tx = sessionManager.pending2FATransaction {
            GeometryReader { geometry in
                let isSmallWatch = geometry.size.height < 210
                let actionBtnHeight: CGFloat = isSmallWatch ? 24 : 28
                
                ScrollView {
                    VStack(spacing: 4) {
                        HStack(spacing: 3) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(WatchTheme.ruby)
                                .font(.system(size: 10))
                            Text("HIGH-VALUE 2FA")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(WatchTheme.ruby)
                        }
                        
                        VStack(spacing: 2) {
                            Text("Wire Transfer Request")
                                .font(.system(size: 8))
                                .foregroundColor(WatchTheme.textMuted)
                            
                            Text("$\(String(format: "%.2f", tx["amount"] as? Double ?? 50000.0))")
                                .font(.system(size: isSmallWatch ? 15 : 18, weight: .heavy, design: .rounded))
                                .foregroundColor(WatchTheme.gold)
                            
                            Text("To: \(tx["recipient"] as? String ?? "OFFSHORE-SWIFT-991")")
                                .font(.system(size: 7, design: .monospaced))
                                .foregroundColor(.white)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(5)
                        .background(WatchTheme.surface)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(WatchTheme.ruby.opacity(0.5), lineWidth: 1)
                        )
                        
                        // Action Buttons
                        HStack(spacing: 5) {
                            Button(action: {
                                sessionManager.approvePendingTransaction()
                            }) {
                                Text("APPROVE")
                                    .font(.system(size: 8.5, weight: .heavy))
                                    .frame(maxWidth: .infinity, minHeight: actionBtnHeight)
                                    .background(WatchTheme.emerald)
                                    .foregroundColor(.black)
                                    .cornerRadius(actionBtnHeight / 2)
                            }
                            .buttonStyle(PlainButtonStyle())
                            
                            Button(action: {
                                sessionManager.rejectPendingTransaction()
                            }) {
                                Text("REJECT")
                                    .font(.system(size: 8.5, weight: .bold))
                                    .frame(maxWidth: .infinity, minHeight: actionBtnHeight)
                                    .background(WatchTheme.surfaceElevated)
                                    .foregroundColor(WatchTheme.textMuted)
                                    .cornerRadius(actionBtnHeight / 2)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        
                        Text("[V-AP04] Missing Biometric Challenge")
                            .font(.system(size: 6.5))
                            .foregroundColor(WatchTheme.textMuted)
                    }
                    .padding(.horizontal, 4)
                }
            }
        }
    }
}
