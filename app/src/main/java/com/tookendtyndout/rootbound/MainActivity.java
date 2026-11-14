package com.tookendtyndout.rootbound;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView gameView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        goImmersive();
        gameView = new WebView(this);
        gameView.setBackgroundColor(0xFF0D0818);
        WebSettings settings = gameView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setTextZoom(100);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        gameView.setWebViewClient(new WebViewClient());
        gameView.setWebChromeClient(new WebChromeClient());
        gameView.setKeepScreenOn(true);
        setContentView(gameView);
        gameView.loadUrl("file:///android_asset/index.html");
    }

    private void goImmersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) goImmersive();
    }

    /** Back pauses a live match instead of throwing the player out of the app. */
    @Override public void onBackPressed() {
        if (gameView == null) { super.onBackPressed(); return; }
        gameView.evaluateJavascript(
            "(function(){try{return !!(window.TT && TT.UI && TT.UI.back && TT.UI.back());}catch(e){return false;}})()",
            new ValueCallback<String>() {
                @Override public void onReceiveValue(String handled) {
                    if (!"true".equals(handled)) MainActivity.super.onBackPressed();
                }
            });
    }

    @Override protected void onPause() {
        if (gameView != null) gameView.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (gameView != null) gameView.onResume();
        goImmersive();
    }

    @Override protected void onDestroy() {
        if (gameView != null) { gameView.destroy(); gameView = null; }
        super.onDestroy();
    }
}
