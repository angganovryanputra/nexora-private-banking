import SwiftUI

/// Luxury Swiss-Banking Design Tokens for Apple watchOS
public struct WatchTheme {
    public static let bgDark = Color(red: 10/255, green: 14/255, blue: 26/255) // #0A0E1A
    public static let surface = Color(red: 22/255, green: 31/255, blue: 48/255) // #161F30
    public static let surfaceElevated = Color(red: 30/255, green: 42/255, blue: 66/255) // #1E2A42
    public static let gold = Color(red: 245/255, green: 158/255, blue: 11/255) // #F59E0B
    public static let goldMuted = Color(red: 217/255, green: 119/255, blue: 6/255) // #D97706
    public static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255) // #10B981
    public static let ruby = Color(red: 239/255, green: 68/255, blue: 68/255) // #EF4444
    public static let textMuted = Color(red: 148/255, green: 163/255, blue: 184/255) // #94A3B8
    public static let textLight = Color.white.opacity(0.85)
    
    /// Calculate responsive button height for any Apple Watch model (40mm to 49mm Ultra)
    public static func buttonHeight(screenHeight: CGFloat) -> CGFloat {
        if screenHeight < 210 { // 40mm / 41mm
            return 25
        } else if screenHeight > 250 { // 49mm Ultra
            return 34
        } else { // 44mm / 45mm
            return 29
        }
    }
    
    /// Calculate responsive key font size
    public static func keyFontSize(screenWidth: CGFloat) -> CGFloat {
        if screenWidth < 175 {
            return 12
        } else if screenWidth > 210 {
            return 16
        } else {
            return 14
        }
    }
}
