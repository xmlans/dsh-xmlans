// swift-tools-version: 5.9
import PackageDescription

/// Repeatable tests for the pure Swift core of the native macOS Helper.
/// The UI layer (PetController/PetView/main) stays out of this package so the
/// state machine and persistence logic can be tested without AppKit.
let package = Package(
    name: "dsh-xmlans-core",
    products: [
        .library(name: "LanjiangCore", targets: ["LanjiangCore"]),
    ],
    targets: [
        .target(
            name: "LanjiangCore",
            path: "native/macos/Sources",
            exclude: [
                "Permissions.swift",
                "PetController.swift",
                "PetView.swift",
                "main.swift",
            ],
            sources: ["AnimationModel.swift", "LayoutStore.swift", "PetGeometry.swift"]
        ),
        .testTarget(
            name: "LanjiangCoreTests",
            dependencies: ["LanjiangCore"],
            path: "native/macos/Tests"
        ),
    ]
)
