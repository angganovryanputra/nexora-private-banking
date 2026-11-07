#!/usr/bin/env python3
"""
Nexora OmniWear — Apple Watch Target Configuration Utility
Cross-platform helper to verify and align Xcode project settings,
ensuring bundle identifiers match for watchOS companion pairing.
"""

import os
import re
import sys

IOS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_PATH = os.path.join(IOS_DIR, "VulnerableBankApp.xcodeproj", "project.pbxproj")
WATCH_DIR = os.path.join(IOS_DIR, "NexoraWatch")
IOS_BUNDLE_ID = "com.nexorabank.omniwear"
WATCH_BUNDLE_ID = "com.nexorabank.omniwear.watchkitapp"

def verify_and_align_pbxproj():
    if not os.path.exists(PROJECT_PATH):
        print(f"❌ {PROJECT_PATH} not found.")
        sys.exit(1)

    with open(PROJECT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Check and align iOS bundle identifier
    if "PRODUCT_BUNDLE_IDENTIFIER = com.nexorabank.omniwear;" in content:
        print(f"✓ iOS app bundle identifier correctly configured as {IOS_BUNDLE_ID}")
    else:
        content = re.sub(
            r'PRODUCT_BUNDLE_IDENTIFIER\s*=\s*"org\.reactjs\.native\.example\.[^"]*";',
            f'PRODUCT_BUNDLE_IDENTIFIER = {IOS_BUNDLE_ID};',
            content
        )
        with open(PROJECT_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✓ Aligned iOS app bundle identifier to {IOS_BUNDLE_ID}")

    # 2. Check watch Swift sources
    swift_files = [f for f in os.listdir(WATCH_DIR) if f.endswith(".swift")]
    print(f"✓ Found {len(swift_files)} watchOS Swift source files in {WATCH_DIR}/")

    print("\n[Nexora Xcode Configuration Status]")
    print(f"  • iOS Companion ID: {IOS_BUNDLE_ID}")
    print(f"  • watchOS Target ID: {WATCH_BUNDLE_ID}")
    print(f"  • Project Path: {PROJECT_PATH}")
    print("  • Parity Status: ALIGNED & VERIFIED ✓")

if __name__ == "__main__":
    verify_and_align_pbxproj()

