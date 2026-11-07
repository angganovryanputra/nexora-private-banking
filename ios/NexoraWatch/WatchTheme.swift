import SwiftUI

/// Luxury private-banking design tokens + continuous responsive scaling for
/// Apple watchOS. The scale is derived from the device's shortest side so the
/// SAME views render proportionately on every Apple Watch size — 40/41/42mm,
/// 44/45/46mm, and the 49mm Ultra — instead of three hard buckets.
public struct WatchTheme {
    // MARK: - Palette (Nexora AMOLED private-bank identity)
    public static let bgDark = Color(red: 10/255, green: 14/255, blue: 26/255)          // #0A0E1A
    public static let surface = Color(red: 22/255, green: 31/255, blue: 48/255)         // #161F30
    public static let surfaceElevated = Color(red: 30/255, green: 42/255, blue: 66/255) // #1E2A42
    public static let gold = Color(red: 245/255, green: 158/255, blue: 11/255)          // #F59E0B
    public static let goldMuted = Color(red: 217/255, green: 119/255, blue: 6/255)      // #D97706
    public static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255)       // #10B981
    public static let ruby = Color(red: 239/255, green: 68/255, blue: 68/255)           // #EF4444
    public static let textMuted = Color(red: 148/255, green: 163/255, blue: 184/255)    // #94A3B8
    public static let textLight = Color.white.opacity(0.85)

    // MARK: - Continuous scaling
    /// Reference width ≈ 176pt (41mm). Clamped so 40mm text stays readable and
    /// the 49mm Ultra doesn't balloon.
    public static func ratio(_ size: CGSize) -> CGFloat {
        let shortest = min(size.width, size.height)
        return min(max(shortest / 176.0, 0.9), 1.3)
    }

    /// Scale a reference font size (points) to the current device.
    public static func scaledFont(_ base: CGFloat, _ size: CGSize) -> CGFloat {
        (base * ratio(size)).rounded()
    }

    /// Scale a reference spacing/padding value to the current device.
    public static func scaledSpace(_ base: CGFloat, _ size: CGSize) -> CGFloat {
        max(1, (base * ratio(size)).rounded())
    }

    /// Scale a reference corner radius to the current device.
    public static func scaledRadius(_ base: CGFloat, _ size: CGSize) -> CGFloat {
        (base * ratio(size)).rounded()
    }

    // MARK: - Back-compatible helpers (now continuous, same signatures)
    /// Primary touch-target height — continuous across 40mm → 49mm Ultra.
    public static func buttonHeight(screenHeight: CGFloat) -> CGFloat {
        min(max((screenHeight * 0.135).rounded(), 22), 36)
    }

    /// Keypad digit font — continuous across all widths.
    public static func keyFontSize(screenWidth: CGFloat) -> CGFloat {
        min(max((screenWidth * 0.08).rounded(), 12), 17)
    }

    // MARK: - Formatting
    /// Format a numeric balance as Indonesian Rupiah (e.g. "Rp 888.888.000").
    public static func formatRupiah(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = "."
        formatter.decimalSeparator = ","
        formatter.maximumFractionDigits = 0
        let formatted = formatter.string(from: NSNumber(value: value)) ?? "\(Int(value))"
        return "Rp \(formatted)"
    }
}
