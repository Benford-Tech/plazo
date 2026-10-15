package com.benfordtech.parking_app

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import io.flutter.embedding.android.FlutterFragmentActivity

// flutter_stripe's payment sheet needs a FragmentActivity (and an AppCompat theme, see styles.xml).
class MainActivity : FlutterFragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Edge-to-edge on every Android version, the way Android 15+ imposes it on apps targeting SDK 35+ (Play
        // Console, 15/10/2026), so that Android 7-14 look and lay out like Android 15. After super.onCreate:
        // FlutterFragmentActivity.onCreate sets its own status bar colour and layout flags, which would undo it.
        // The Dart side keeps it on resume (SystemUiMode.edgeToEdge in bootstrap.dart) and pads the system bars.
        enableEdgeToEdge()
    }
}
