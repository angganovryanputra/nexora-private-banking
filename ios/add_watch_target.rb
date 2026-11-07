#!/usr/bin/env ruby
# frozen_string_literal: true
#
# Adds the NexoraWatch watchOS app target to VulnerableBankApp.xcodeproj and
# wires it into the iOS app (companion), so the project builds & installs on
# iOS + watchOS from Xcode.
#
# WHY A SCRIPT: the watchOS Swift files exist on disk but were never added to the
# Xcode project (no target). Hand-editing project.pbxproj is error-prone; the
# `xcodeproj` gem (the same library CocoaPods uses) produces a valid project.
#
# USAGE (on a Mac, from the ios/ directory):
#   sudo gem install xcodeproj      # once
#   ruby add_watch_target.rb
#   pod install                     # re-integrate pods (RN app)
#   open VulnerableBankApp.xcworkspace
#
# Idempotent: re-running detects the existing target and exits without changes.

require 'xcodeproj'

PROJECT_PATH    = 'VulnerableBankApp.xcodeproj'
APP_TARGET_NAME = 'VulnerableBankApp'
WATCH_NAME      = 'NexoraWatch'
WATCH_DIR       = 'NexoraWatch'
IOS_BUNDLE_ID   = 'com.nexorabank.omniwear'              # must equal watch's WKCompanionAppBundleIdentifier
WATCH_BUNDLE_ID = 'com.nexorabank.omniwear.watchkitapp'  # must equal watch Info.plist CFBundleIdentifier
WATCH_DEPLOY    = '9.0'

abort("❌ #{PROJECT_PATH} not found. Run this from the ios/ directory.") unless Dir.exist?(PROJECT_PATH)
project = Xcodeproj::Project.open(PROJECT_PATH)

app_target = project.targets.find { |t| t.name == APP_TARGET_NAME }
abort("❌ iOS app target '#{APP_TARGET_NAME}' not found.") unless app_target

if project.targets.any? { |t| t.name == WATCH_NAME }
  puts "ℹ️  Target '#{WATCH_NAME}' already exists — nothing to do."
  exit 0
end

# --- 1. Align the iOS app bundle id with the watch companion id --------------
app_target.build_configurations.each do |c|
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = IOS_BUNDLE_ID
end
puts "✓ iOS app bundle id set to #{IOS_BUNDLE_ID}"

# --- 2. Create the watchOS app target ---------------------------------------
watch_target = project.new_target(:application, WATCH_NAME, :watchos, WATCH_DEPLOY, nil, :swift)

watch_target.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER']            = WATCH_BUNDLE_ID
  s['PRODUCT_NAME']                         = '$(TARGET_NAME)'
  s['INFOPLIST_FILE']                       = "#{WATCH_DIR}/Info.plist"
  s['GENERATE_INFOPLIST_FILE']              = 'NO'
  s['WATCHOS_DEPLOYMENT_TARGET']            = WATCH_DEPLOY
  s['SDKROOT']                              = 'watchos'
  s['TARGETED_DEVICE_FAMILY']               = '4'
  s['SWIFT_VERSION']                        = '5.0'
  s['SWIFT_EMIT_LOC_STRINGS']               = 'YES'
  s['ASSETCATALOG_COMPILER_APPICON_NAME']   = 'AppIcon'
  s['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  s['CODE_SIGN_STYLE']                      = 'Automatic'
  s['CURRENT_PROJECT_VERSION']              = '1'
  s['MARKETING_VERSION']                    = '1.0'
  s['GCC_C_LANGUAGE_STANDARD']              = 'gnu11'
  s['CLANG_ENABLE_MODULES']                 = 'YES'
  s['ENABLE_PREVIEWS']                      = 'YES'
end
puts "✓ watchOS target '#{WATCH_NAME}' created (bundle #{WATCH_BUNDLE_ID})"

# --- 3. Add the Swift sources + resources to the watch target ---------------
watch_group = project.main_group.new_group(WATCH_NAME, WATCH_DIR)

swift_files = Dir.glob("#{WATCH_DIR}/*.swift").sort
abort("❌ No Swift files found in #{WATCH_DIR}/") if swift_files.empty?
swift_files.each do |path|
  ref = watch_group.new_reference(File.basename(path))
  watch_target.add_file_references([ref])
end
puts "✓ Added #{swift_files.length} Swift files to the target"

# Asset catalog (app icon) — add if present so device installs carry an icon.
assets = "#{WATCH_DIR}/Assets.xcassets"
if Dir.exist?(assets)
  ref = watch_group.new_reference('Assets.xcassets')
  watch_target.add_resources([ref])
  puts "✓ Added Assets.xcassets"
else
  puts "⚠️  No #{assets} — add a watch AppIcon in Xcode before a DEVICE install (simulator is fine without)."
end

# --- 4. Embed the watch app into the iOS app + add a dependency -------------
app_target.add_dependency(watch_target)

embed = app_target.new_copy_files_build_phase('Embed Watch Content')
embed.dst_subfolder_spec = '16' # products directory
embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
bf = embed.add_file_reference(watch_target.product_reference)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
puts "✓ Embedded watch app into #{APP_TARGET_NAME} (Embed Watch Content)"

project.save
puts "\n✅ Done. Next:\n   pod install\n   open #{File.basename(PROJECT_PATH, '.xcodeproj')}.xcworkspace\n   (set your Team for signing, then select the NexoraWatch scheme to run on a watch)"
