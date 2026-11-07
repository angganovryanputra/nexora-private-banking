import SwiftUI

/// [Skenario 4 & 17] High-Value Rp 50.000.000 Out-of-Band (OOB) 2FA Wire Transfer Approval Modal
/// Responsive modal adapting to small (40mm) and large (49mm Ultra) Apple Watches.
/// Vulnerability: Approves wire transfer without biometric verification, wrist PIN challenge, or Secure Enclave signature (CWE-287).
public struct TwoFactorApprovalView: View {
    @ObservedObject var sessionManager = WatchSessionManager.shared
    
    public init() {}
    
    public var body: some View {
        if let tx = sessionManager.pending2FATransaction {
            GeometryReader { geometry in
                let isSmallWatch = geometry.size.height < 210
                let actionBtnHeight: CGFloat = isSmallWatch ? 24 : 28
                let amount = tx["amount"] as? Double ?? 50000000.0
                let recipient = tx["recipient"] as? String ?? "Evelyn Sterling (NX-7391048)"
                
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
                            
                            Text(WatchTheme.formatRupiah(amount))
                                .font(.system(size: isSmallWatch ? 14 : 16, weight: .heavy, design: .rounded))
                                .foregroundColor(WatchTheme.gold)
                                .minimumScaleFactor(0.8)
                                .lineLimit(1)
                            
                            Text("To: \(recipient)")
                                .font(.system(size: 7, design: .monospaced))
                                .foregroundColor(.white)
                                .lineLimit(1)
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
                        
                        Text("[V-W09] Missing Biometric / Enclave Challenge")
                            .font(.system(size: 6.5))
                            .foregroundColor(WatchTheme.textMuted)
                    }
                    .padding(.horizontal, 4)
                }
            }
        }
    }
}
