#!/usr/bin/env python3
import os
import hashlib

def sync_sources():
    pbx_path = os.path.join(os.path.dirname(__file__), "VulnerableBankApp.xcodeproj", "project.pbxproj")
    with open(pbx_path, "r", encoding="utf-8") as f:
        pbx = f.read()

    sources = [
        ("WatchBridge.swift", "sourcecode.swift"),
        ("WatchBridge.m", "sourcecode.c.objc"),
        ("SecurityCheck.swift", "sourcecode.swift"),
        ("SecurityCheck.m", "sourcecode.c.objc"),
        ("HeartRate.swift", "sourcecode.swift"),
        ("HeartRate.m", "sourcecode.c.objc"),
        ("PinnedNetwork.swift", "sourcecode.swift"),
        ("PinnedNetwork.m", "sourcecode.c.objc"),
        ("BluetoothSync.swift", "sourcecode.swift"),
        ("BluetoothSync.m", "sourcecode.c.objc"),
    ]

    build_files = []
    file_refs = []
    group_children = []
    sources_entries = []

    for fname, ftype in sources:
        if f"/* {fname} */" in pbx:
            print(f"Skipping {fname} (already present)")
            continue

        h = hashlib.md5(fname.encode("utf-8")).hexdigest().upper()
        file_id = f"NX{h[:22]}"
        build_id = f"BL{h[:22]}"

        build_files.append(f"\t\t{build_id} /* {fname} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_id} /* {fname} */; }};")
        file_refs.append(f'\t\t{file_id} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = {ftype}; name = {fname}; path = VulnerableBankApp/{fname}; sourceTree = "<group>"; }};')
        group_children.append(f"\t\t\t\t{file_id} /* {fname} */,")
        sources_entries.append(f"\t\t\t\t{build_id} /* {fname} in Sources */,")

    if not build_files:
        print("All sources are already up to date in project.pbxproj.")
        return

    # Insert into PBXBuildFile section
    target_bf = "/* End PBXBuildFile section */"
    pbx = pbx.replace(target_bf, "\n".join(build_files) + "\n" + target_bf)

    # Insert into PBXFileReference section
    target_fr = "/* End PBXFileReference section */"
    pbx = pbx.replace(target_fr, "\n".join(file_refs) + "\n" + target_fr)

    # Insert into Group
    target_grp = "761780EC2CA45674006654EE /* AppDelegate.swift */,"
    pbx = pbx.replace(target_grp, target_grp + "\n" + "\n".join(group_children))

    # Insert into SourcesBuildPhase
    target_src = "761780ED2CA45674006654EE /* AppDelegate.swift in Sources */,"
    pbx = pbx.replace(target_src, target_src + "\n" + "\n".join(sources_entries))

    with open(pbx_path, "w", encoding="utf-8") as f:
        f.write(pbx)

    print(f"Successfully wired {len(build_files)} source files into project.pbxproj!")

if __name__ == "__main__":
    sync_sources()

