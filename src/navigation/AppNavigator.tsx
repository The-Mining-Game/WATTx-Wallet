import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { checkWalletExists } from '../store/walletSlice';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import CreateWalletScreen from '../screens/CreateWalletScreen';
import ImportWalletScreen from '../screens/ImportWalletScreen';
import UnlockScreen from '../screens/UnlockScreen';
import WalletScreen from '../screens/WalletScreen';
import SendScreen from '../screens/SendScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import StakingScreen from '../screens/StakingScreen';
import MiningScreen from '../screens/MiningScreen';
import DAppBrowserScreen from '../screens/DAppBrowserScreen';
import InscriptionsScreen from '../screens/InscriptionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NetworksScreen from '../screens/NetworksScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icons (using emoji for simplicity, replace with proper icons)
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Wallet: focused ? '💰' : '💳',
    Staking: focused ? '🔒' : '🔐',
    Mining: focused ? '⛏️' : '⚒️',
    Browser: focused ? '🌐' : '🔗',
    Settings: focused ? '⚙️' : '🔧',
  };
  return <Text style={{ fontSize: 24 }}>{icons[name] || '📱'}</Text>;
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#f8fafc',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: 'WATTx Wallet' }}
      />
      <Tab.Screen
        name="Staking"
        component={StakingScreen}
        options={{ title: 'Staking' }}
      />
      <Tab.Screen
        name="Mining"
        component={MiningScreen}
        options={{ title: 'Mining' }}
      />
      <Tab.Screen
        name="Browser"
        component={DAppBrowserScreen}
        options={{ title: 'DeFi Hub', headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Main Navigator
export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { hasWallet, isLocked, isLoading } = useSelector(
    (state: RootState) => state.wallet
  );

  useEffect(() => {
    dispatch(checkWalletExists());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#f8fafc',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {!hasWallet ? (
        // Onboarding Stack
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateWallet"
            component={CreateWalletScreen}
            options={{ title: 'Create Wallet' }}
          />
          <Stack.Screen
            name="ImportWallet"
            component={ImportWalletScreen}
            options={{ title: 'Import Wallet' }}
          />
        </>
      ) : isLocked ? (
        // Unlock Screen
        <Stack.Screen
          name="Unlock"
          component={UnlockScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Main App Stack
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Send"
            component={SendScreen}
            options={{ title: 'Send' }}
          />
          <Stack.Screen
            name="Receive"
            component={ReceiveScreen}
            options={{ title: 'Receive' }}
          />
          <Stack.Screen
            name="Networks"
            component={NetworksScreen}
            options={{ title: 'Networks' }}
          />
          <Stack.Screen
            name="Inscriptions"
            component={InscriptionsScreen}
            options={{ title: 'Inscriptions' }}
          />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ title: 'Transaction Details' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
  },
});
