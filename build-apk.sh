#!/bin/bash
#
# WATTx Wallet APK Build Script
# This script builds the Android APK using Docker (no local Java 17 required)
#

set -e

echo "=========================================="
echo "  WATTx Wallet APK Builder"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker or use one of these alternative methods:"
    echo ""
    echo "Option 1: Install Java 17 and Android SDK locally"
    echo "  sudo apt install openjdk-17-jdk"
    echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
    echo "  cd android && ./gradlew assembleRelease"
    echo ""
    echo "Option 2: Use Android Studio"
    echo "  Open the 'android' folder in Android Studio and build from there"
    exit 1
fi

# Create output directory
mkdir -p output

echo "Building Docker image..."
docker build -t wattx-wallet-builder .

echo "Building APK inside container..."
docker run --rm -v "$(pwd)/output:/output" wattx-wallet-builder

if [ -f "output/WATTxWallet.apk" ]; then
    echo ""
    echo "=========================================="
    echo "  Build successful!"
    echo "  APK location: output/WATTxWallet.apk"
    echo "=========================================="
else
    echo ""
    echo "Build may have completed with warnings."
    echo "Check output directory for APK file."
fi
