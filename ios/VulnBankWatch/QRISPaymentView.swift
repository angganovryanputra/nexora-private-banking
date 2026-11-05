import SwiftUI

/// [V-AP06] Dynamic QRIS Screen on Apple watchOS
/// Scaled dynamically across all Apple Watch sizes.
/// Vulnerability: Dynamic QR string has a static transaction identifier without timestamp validation.
struct QRISPaymentView: View {
    @Binding var currentScreen: String
    @State private var countdown: Int = 120
    @State private var qrisString: String = "00020101021226610016ID.VULNBANK.WWW01189360099800000000015204581253033605802ID5914VULNBANK MERCH6007JAKARTA62070703A016304E8A2"
    @State private var timer: Timer?
    
    var body: some View {
        GeometryReader { geometry in
            let isSmallWatch = geometry.size.height < 210
            let qrBoxSize: CGFloat = isSmallWatch ? 64 : (geometry.size.height > 250 ? 84 : 72)
            
            ScrollView {
                VStack(spacing: 5) {
                    HStack {
                        Button(action: {
                            currentScreen = "balance"
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(WatchTheme.gold)
                                .frame(width: 22, height: 22)
                                .background(WatchTheme.surface)
                                .clipShape(Circle())
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Spacer()
                        Text("SNAP QRIS")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    
                    // QR Code Card
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.white)
                            .frame(width: qrBoxSize, height: qrBoxSize)
                            .shadow(color: Color.black.opacity(0.3), radius: 4, x: 0, y: 2)
                        
                        VStack(spacing: 1) {
                            Image(systemName: "qrcode")
                                .font(.system(size: qrBoxSize * 0.55))
                                .foregroundColor(.black)
                            Text("VULNBANK")
                                .font(.system(size: 6, weight: .heavy, design: .rounded))
                                .foregroundColor(.black)
                                .tracking(0.5)
                        }
                    }
                    .padding(.vertical, 2)
                    
                    Text("Merchant: VULNBANK MERCH 001")
                        .font(.system(size: 7, weight: .medium))
                        .foregroundColor(WatchTheme.textLight)
                    
                    // Timer & Status Pill
                    HStack(spacing: 3) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 8))
                            .foregroundColor(WatchTheme.gold)
                        Text("Expires in: \(countdown)s")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(WatchTheme.gold)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(WatchTheme.surface)
                    .cornerRadius(8)
                    
                    Text("[V-AP06] Replay Vulnerability: Static ID")
                        .font(.system(size: 6.5))
                        .foregroundColor(WatchTheme.ruby)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 4)
            }
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
