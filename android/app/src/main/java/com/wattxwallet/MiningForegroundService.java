package com.wattxwallet;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service for CPU mining operations.
 * Keeps mining running even when the app is in the background.
 */
public class MiningForegroundService extends Service {

    private static final String CHANNEL_ID = "wattx_mining_channel";
    private static final int NOTIFICATION_ID = 1001;

    private boolean isMining = false;
    private double currentHashrate = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if ("START_MINING".equals(action)) {
                startMining();
            } else if ("STOP_MINING".equals(action)) {
                stopMining();
            } else if ("UPDATE_HASHRATE".equals(action)) {
                currentHashrate = intent.getDoubleExtra("hashrate", 0);
                updateNotification();
            }
        }
        return START_STICKY;
    }

    private void startMining() {
        isMining = true;
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);
    }

    private void stopMining() {
        isMining = false;
        stopForeground(true);
        stopSelf();
    }

    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        String contentText = isMining
            ? String.format("Mining at %.2f H/s", currentHashrate)
            : "Mining paused";

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("WATTx Mining")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Mining Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows mining status and hashrate");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isMining = false;
    }
}
