import SwiftUI

/// [V-AP06] Dynamic QRIS Screen on Apple watchOS
/// Vulnerability: The generated SNAP QR string has a static transaction identifier or lacks
/// server-side cryptographic timestamp validation, allowing attackers to photograph or capture
/// the QR matrix and replay the payment transaction indefinitely.
struct QRISPaymentView: View {
    @Binding var currentScreen: String
    @State private var countdown: Int = 120
    @State private var qrisString: String = "00020101021226610016ID.VULNBANK.WWW01189360099800000000015204581253033605802ID5914VULNBANK MERCH6007JAKARTA62070703A016304E8A2"
    @State private var timer: Timer?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                HStack {
                    Button(action: {
                        currentScreen = "balance"
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 11))
                            .foregroundColor(.yellow)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Spacer()
                    Text("SNAP Dynamic QRIS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                }
                
                // Simulated QR Block
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.white)
                        .frame(width: 80, height: 80)
                    
                    VStack(spacing: 2) {
                        Image(systemName: "qrcode")
                            .font(.system(size: 44))
                            .foregroundColor(.black)
                        Text("VULNBANK")
                            .font(.system(size: 7, weight: .heavy))
                            .foregroundColor(.black)
                    }
                }
                
                Text("Scan to Pay • Merchant 001")
                    .font(.system(size: 8))
                    .foregroundColor(.gray)
                
                // Countdown & Replay Warning
                HStack(spacing: 4) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 9))
                        .foregroundColor(.yellow)
                    Text("Expires in: \(countdown)s")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.yellow)
                }
                
                Text("[V-AP06] Missing Server Replay Protection")
                    .font(.system(size: 7))
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 4)
        }
        .onAppear {
            timer?.invalidate()
            timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
                if countdown > 0 {
                    countdown -= 1
                } else {
                    countdown = 120
                }
            }
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
}
