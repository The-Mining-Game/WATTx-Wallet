package com.wattxwallet;

import android.content.Intent;
import android.os.BatteryManager;
import android.os.Build;
import android.content.Context;
import android.content.IntentFilter;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class MiningModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "MiningModule";

    private final ReactApplicationContext reactContext;
    private ExecutorService executorService;
    private final AtomicBoolean isMining = new AtomicBoolean(false);
    private final AtomicLong hashCount = new AtomicLong(0);
    private final AtomicInteger sharesAccepted = new AtomicInteger(0);
    private final AtomicInteger sharesRejected = new AtomicInteger(0);
    private long startTime = 0;

    private int threadCount = 2;
    private int intensity = 50;
    private int thermalLimit = 70;
    private int batteryLimit = 20;

    private String poolUrl;
    private int poolPort;
    private String username;
    private String password;
    private String algorithm;

    public MiningModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startMining(
            String url,
            int port,
            String user,
            String pass,
            String algo,
            int threads,
            int intense,
            Promise promise
    ) {
        if (isMining.get()) {
            promise.reject("ALREADY_MINING", "Mining is already in progress");
            return;
        }

        this.poolUrl = url;
        this.poolPort = port;
        this.username = user;
        this.password = pass;
        this.algorithm = algo;
        this.threadCount = threads;
        this.intensity = intense;

        isMining.set(true);
        hashCount.set(0);
        sharesAccepted.set(0);
        sharesRejected.set(0);
        startTime = System.currentTimeMillis();

        executorService = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            executorService.submit(() -> miningThread(threadId));
        }

        // Start monitoring thread
        new Thread(this::monitoringThread).start();

        promise.resolve(true);
    }

    @ReactMethod
    public void stopMining(Promise promise) {
        isMining.set(false);

        if (executorService != null) {
            executorService.shutdownNow();
            executorService = null;
        }

        promise.resolve(true);
    }

    @ReactMethod
    public void updateConfig(int threads, int intense, int thermal, int battery, Promise promise) {
        this.threadCount = threads;
        this.intensity = intense;
        this.thermalLimit = thermal;
        this.batteryLimit = battery;
        promise.resolve(true);
    }

    @ReactMethod
    public void getStats(Promise promise) {
        WritableMap stats = Arguments.createMap();

        long elapsed = System.currentTimeMillis() - startTime;
        double hashrate = elapsed > 0 ? (hashCount.get() * 1000.0) / elapsed : 0;

        stats.putDouble("hashrate", hashrate);
        stats.putString("hashrateUnit", getHashrateUnit(hashrate));
        stats.putInt("sharesAccepted", sharesAccepted.get());
        stats.putInt("sharesRejected", sharesRejected.get());
        stats.putString("earnings", "0"); // Would need pool API
        stats.putDouble("uptime", elapsed / 1000.0);
        stats.putDouble("temperature", getCPUTemperature());

        promise.resolve(stats);
    }

    private void miningThread(int threadId) {
        // Simulated mining - in production, implement actual mining algorithm
        // This would use JNI to call native mining code (RandomX, Ethash, etc.)

        while (isMining.get()) {
            try {
                // Simulate hash computation based on intensity
                int delay = (100 - intensity) * 10;
                Thread.sleep(Math.max(1, delay));

                // Simulate hash count increase
                hashCount.incrementAndGet();

                // Simulate occasional share found
                if (Math.random() < 0.0001) {
                    if (Math.random() < 0.95) {
                        sharesAccepted.incrementAndGet();
                        sendEvent("onShareAccepted", Arguments.createMap());
                    } else {
                        sharesRejected.incrementAndGet();
                        sendEvent("onShareRejected", Arguments.createMap());
                    }
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    private void monitoringThread() {
        while (isMining.get()) {
            try {
                Thread.sleep(5000);

                // Check temperature
                double temp = getCPUTemperature();
                if (temp > thermalLimit) {
                    WritableMap event = Arguments.createMap();
                    event.putDouble("temperature", temp);
                    sendEvent("onTemperatureWarning", event);
                }

                // Check battery
                int battery = getBatteryLevel();
                if (battery <= batteryLimit && !isCharging()) {
                    WritableMap event = Arguments.createMap();
                    event.putInt("level", battery);
                    sendEvent("onBatteryLow", event);
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    private double getCPUTemperature() {
        // Try to read CPU temperature from thermal zone
        try {
            BufferedReader reader = new BufferedReader(
                new FileReader("/sys/class/thermal/thermal_zone0/temp")
            );
            String line = reader.readLine();
            reader.close();

            if (line != null) {
                return Integer.parseInt(line.trim()) / 1000.0;
            }
        } catch (IOException | NumberFormatException e) {
            // Temperature not available
        }
        return 0;
    }

    private int getBatteryLevel() {
        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = reactContext.registerReceiver(null, filter);

        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            return (int) ((level / (float) scale) * 100);
        }
        return 100;
    }

    private boolean isCharging() {
        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = reactContext.registerReceiver(null, filter);

        if (batteryStatus != null) {
            int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            return status == BatteryManager.BATTERY_STATUS_CHARGING ||
                   status == BatteryManager.BATTERY_STATUS_FULL;
        }
        return false;
    }

    private String getHashrateUnit(double hashrate) {
        if (hashrate >= 1e12) return "TH/s";
        if (hashrate >= 1e9) return "GH/s";
        if (hashrate >= 1e6) return "MH/s";
        if (hashrate >= 1e3) return "KH/s";
        return "H/s";
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN event emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN event emitter
    }
}
