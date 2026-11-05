import SwiftUI

/// [V-AP05] Wrist-Off Security Lockout Screen
/// Simulates watch being removed from user's wrist.
/// Also provides an exploit button to demonstrate client-side bypass.
struct WristLockoutView: View {
    @ObservedObject var wristManager = WristSensorManager.shared
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 28))
                .foregroundColor(.red)
            
            Text("DEVICE LOCKED")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.red)
            
            Text("Watch was removed from wrist. Biometric telemetry halted.")
                .font(.system(size: 8))
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            Button(action: {
                wristManager.triggerWristOn()
            }) {
                Text("Put Back On Wrist")
                    .font(.system(size: 9, weight: .bold))
                    .frame(maxWidth: .infinity, minHeight: 26)
                    .background(Color.yellow)
                    .foregroundColor(.black)
                    .cornerRadius(13)
            }
            .buttonStyle(PlainButtonStyle())
            
            // Exploit trigger for Tender Demo
            Button(action: {
                wristManager.toggleBypass(true)
            }) {
                Text("Bypass via Frida Hook (V-AP05)")
                    .font(.system(size: 8, weight: .bold))
                    .frame(maxWidth: .infinity, minHeight: 22)
                    .background(Color.red.opacity(0.3))
                    .foregroundColor(.yellow)
                    .cornerRadius(11)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(6)
    }
}
