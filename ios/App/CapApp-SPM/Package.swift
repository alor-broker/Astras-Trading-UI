// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.1.0"),
        .package(name: "CapacitorFirebaseMessaging", path: "..\..\..\node_modules\.pnpm\@capacitor-firebase+messagi_07472c66970fea92e09c526affdb285d\node_modules\@capacitor-firebase\messaging"),
        .package(name: "CapacitorNetwork", path: "..\..\..\node_modules\.pnpm\@capacitor+network@8.0.1_@capacitor+core@8.1.0\node_modules\@capacitor\network")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorFirebaseMessaging", package: "CapacitorFirebaseMessaging"),
                .product(name: "CapacitorNetwork", package: "CapacitorNetwork")
            ]
        )
    ]
)
