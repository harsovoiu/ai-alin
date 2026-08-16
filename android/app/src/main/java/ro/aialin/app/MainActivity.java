package ro.aialin.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.Toast;

import java.util.ArrayList;

public class MainActivity extends Activity {

    private static final String HOME_URL = "https://harsovoiu.github.io/ai-alin/";
    private static final int REQ_MIC = 1001;

    private WebView webView;
    private ProgressBar progressBar;

    private SpeechRecognizer recognizer;
    private boolean pendingMicStart = false;
    private boolean micAsked = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);

        RelativeLayout root = new RelativeLayout(this);
        RelativeLayout.LayoutParams webParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT);
        root.addView(webView, webParams);
        RelativeLayout.LayoutParams barParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                (int) (3 * getResources().getDisplayMetrics().density));
        barParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        root.addView(progressBar, barParams);

        setContentView(root);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(0);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("tel".equals(scheme) || "mailto".equals(scheme) || "sms".equals(scheme)) {
                    openExternal(uri);
                    return true;
                }
                if ("https".equals(scheme) || "http".equals(scheme)) {
                    String host = uri.getHost();
                    if (host != null && host.endsWith("aialin.workers.dev")) {
                        return false;
                    }
                    if (host != null && (host.equals("wa.me") || host.endsWith(".whatsapp.com"))) {
                        openExternal(uri);
                        return true;
                    }
                    if (host != null && host.endsWith("github.io")) {
                        return false;
                    }
                    openExternal(uri);
                    return true;
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                boolean hasMic = false;
                String[] resources = request.getResources();
                for (String r : resources) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) hasMic = true;
                }
                if (hasMic && hasMicPermission()) {
                    request.grant(resources);
                } else if (hasMic) {
                    pendingMicStart = true;
                    requestMicPermission();
                    request.deny();
                } else {
                    request.deny();
                }
            }
        });

        webView.addJavascriptInterface(new AndroidVoice(), "AndroidVoice");

        webView.loadUrl(HOME_URL);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_MIC) {
            micAsked = true;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingMicStart) {
                    pendingMicStart = false;
                    startNativeListening();
                }
            } else {
                js("window.onAndroidVoiceError(" + jstr("Accesul la microfon a fost refuzat. Permite microfonul aplicației din Setări > Aplicații > Ai Alin.") + ");");
            }
        }
    }

    private boolean hasMicPermission() {
        return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestMicPermission() {
        if (Build.VERSION.SDK_INT >= 23) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
        }
    }

    private void startNativeListening() {
        if (!hasMicPermission()) {
            pendingMicStart = true;
            requestMicPermission();
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            js("window.onAndroidVoiceError(" + jstr("Lipsă serviciu de recunoaștere vocală pe acest telefon.") + ");");
            return;
        }
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(this);
                recognizer.setRecognitionListener(listener);
            }
            Intent ii = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            ii.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            ii.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ro-RO");
            ii.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            recognizer.startListening(ii);
        } catch (Exception e) {
            js("window.onAndroidVoiceError(" + jstr("Microfon indisponibil.") + ");");
        }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}

        @Override
        public void onResults(Bundle results) {
            ArrayList<String> r = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            String text = (r != null && !r.isEmpty()) ? r.get(0) : "";
            js("window.onAndroidVoiceResult(" + jstr(text) + ");");
        }

        @Override
        public void onError(int code) {
            String msg;
            switch (code) {
                case SpeechRecognizer.ERROR_NO_MATCH:
                    msg = "Nu te-am auzit — vorbește aproape de microfon și încearcă din nou.";
                    break;
                case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                    msg = "Permisiunea pentru microfon nu este acordată.";
                    break;
                case SpeechRecognizer.ERROR_AUDIO:
                    msg = "Microfonul pare blocat sau ocupat.";
                    break;
                case SpeechRecognizer.ERROR_NETWORK:
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                    msg = "Recunoașterea vocală are nevoie de conexiune la internet.";
                    break;
                case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                    msg = "Serviciul vocal e ocupat — încearcă din nou.";
                    break;
                default:
                    msg = "Eroare voce (cod " + code + ").";
            }
            js("window.onAndroidVoiceError(" + jstr(msg) + ");");
        }

        @Override public void onEndOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onPartialResults(Bundle partialResults) {}
        @Override public void onEvent(int eventType, Bundle params) {}
    };

    private class AndroidVoice {
        @JavascriptInterface
        public void startListening() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    startNativeListening();
                }
            });
        }

        @JavascriptInterface
        public void cancel() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    if (recognizer != null) {
                        try { recognizer.cancel(); } catch (Exception ignored) {}
                    }
                }
            });
        }
    }

    private void js(final String script) {
        runOnUiThread(new Runnable() {
            @Override public void run() {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private static String jstr(String s) {
        if (s == null) s = "";
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') { b.append('\\'); b.append(c); }
            else if (c == '\n') b.append("\\n");
            else b.append(c);
        }
        b.append('"');
        return b.toString();
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Nu există o aplicație pentru această acțiune", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (recognizer != null) {
            recognizer.destroy();
            recognizer = null;
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}