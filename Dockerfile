# WATTx Wallet Build Environment
# Provides Java 17 + Android SDK for building the APK

FROM node:18-bullseye

# Set environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Install Java 17 and required packages
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    wget \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Download and install Android SDK command line tools
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip && \
    mv cmdline-tools latest && \
    rm cmdline-tools.zip

# Accept licenses and install required SDK components
RUN yes | sdkmanager --licenses && \
    sdkmanager "platforms;android-34" \
               "platform-tools" \
               "build-tools;34.0.0" \
               "ndk;25.1.8937393"

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build the Android APK
CMD ["sh", "-c", "cd android && ./gradlew assembleRelease && cp app/build/outputs/apk/release/app-release.apk /output/WATTxWallet.apk"]
