import SwiftUI

/// [V-AP05] Wrist-Off Security Lockout Screen
/// Simulates watch being removed from user's wrist.
/// Exploit trigger: Demonstrates client-side bypass via Frida hook / runtime method swizzling.
struct WristLockoutView: View {
    @ObservedObject var wristManager = WristSensorManager.shared
    
    var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let iconSize: CGFloat = isSmallWatch ? 22 : 28
            let btnHeight: CGFloat = isSmallWatch ? 24 : 28
            
            VStack(spacing: 5) {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: iconSize))
                    .foregroundColor(WatchTheme.ruby)
                
                Text("SESSION LOCKED")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(WatchTheme.ruby)
                    .tracking(0.5)
                
                Text("Watch removed from wrist. Biometric telemetry halted.")
                    .font(.system(size: 7.5))
                    .foregroundColor(WatchTheme.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 4)
                
                Button(action: {
                    wristManager.triggerWristOn()
                }) {
                    Text("Resume Session")
                        .font(.system(size: 8.5, weight: .bold))
                        .frame(maxWidth: .infinity, minHeight: btnHeight)
                        .background(WatchTheme.gold)
                        .foregroundColor(.black)
                        .cornerRadius(btnHeight / 2)
                }
                .buttonStyle(PlainButtonStyle())
                
                // Exploit trigger for Tender Demonstration
                Button(action: {
                    wristManager.toggleBypass(true)
                }) {
                    HStack(spacing: 3) {
                        Image(systemName: "ladybug.fill")
                            .font(.system(size: 8))
                        Text("Bypass (V-AP05 Frida)")
                            .font(.system(size: 8, weight: .bold))
                    }
                    .frame(maxWidth: .infinity, minHeight: isSmallWatch ? 20 : 22)
                    .background(WatchTheme.surfaceElevated)
                    .foregroundColor(WatchTheme.gold)
                    .cornerRadius(btnHeight / 2)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(6)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WatchTheme.bgDark)
        }
    }
}
