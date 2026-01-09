# WATTx Wallet

A multi-chain cryptocurrency wallet for Android with mining, staking, dApp browser, and inscription support.

## Features

- **Multi-Chain Support**: 19+ networks including WATTx, QTUM, Bitnet, Sonic, OctaSpace, Ethereum, BSC, Polygon, Arbitrum, and more
- **HD Wallet**: BIP39/BIP44 compliant with secure mnemonic generation
- **Staking**: Native WATTx delegation with validator selection and trust tier rewards
- **Mining**: Pool mining interface and on-device CPU mining with native Android module
- **dApp Browser**: Web3 injection for seamless dApp interactions
- **WATTxchange Hub**: Built-in access to WATTxchange.app DeFi hub
- **Inscriptions**: View Ordinals and BRC-20 tokens
- **Secure Storage**: Biometric authentication and encrypted keychain

## Supported Networks

| Network | Chain ID | Type |
|---------|----------|------|
| WATTx Mainnet | 81 | Custom |
| WATTx Testnet | 8889 | Custom |
| QTUM | 81 | EVM |
| Bitnet | 210 | EVM |
| Sonic | 146 | EVM |
| OctaSpace | 800001 | EVM |
| Etho Protocol | 1313114 | EVM |
| Altcoinchain | 2330 | EVM |
| Ethereum | 1 | EVM |
| BSC | 56 | EVM |
| Polygon | 137 | EVM |
| Arbitrum | 42161 | EVM |
| Optimism | 10 | EVM |
| Avalanche | 43114 | EVM |
| Base | 8453 | EVM |
| Fantom | 250 | EVM |
| Cronos | 25 | EVM |
| zkSync Era | 324 | EVM |

## Requirements

- Node.js 18+
- Java 17 (JDK)
- Android SDK 34
- Android NDK 25.1.8937393

## Installation

```bash
# Clone the repository
git clone https://github.com/The-Mining-Game/WATTx.git
cd WATTx

# Install dependencies
npm install

# Start Metro bundler
npm start
```

## Building APK

### Option 1: Using Android Studio (Recommended)

1. Open the `android` folder in Android Studio
2. Wait for Gradle sync to complete
3. Build > Build Bundle(s) / APK(s) > Build APK(s)

### Option 2: Command Line

```bash
# Debug build
cd android && ./gradlew assembleDebug

# Release build (requires signing configuration)
cd android && ./gradlew assembleRelease
```

### Option 3: Docker

```bash
# Build using Docker
./build-apk.sh
```

## Project Structure

```
src/
├── App.tsx                 # Main app entry
├── navigation/             # React Navigation setup
├── screens/                # UI screens
│   ├── WalletScreen.tsx
│   ├── StakingScreen.tsx
│   ├── MiningScreen.tsx
│   ├── DAppBrowserScreen.tsx
│   └── ...
├── services/               # Core services
│   ├── wallet/             # HD wallet, keychain
│   ├── blockchain/         # Network providers
│   ├── staking/            # WATTx staking
│   ├── mining/             # Mining service
│   ├── dapp/               # Web3 provider
│   └── inscriptions/       # Ordinals/BRC-20
├── store/                  # Redux state
├── types/                  # TypeScript types
└── utils/                  # Utilities
```

## Native Modules

The app includes native Android modules for:

- **MiningModule**: CPU mining with temperature/battery monitoring
- **MiningForegroundService**: Background mining service

## Security

- Private keys stored in Android Keystore via react-native-keychain
- Biometric authentication for transactions
- Secure WebView configuration
- Transaction simulation before signing

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first.
