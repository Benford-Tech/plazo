# flutter_stripe (README, Android step 7). The stripe_android plugin's own consumer rules already keep
# com.stripe.** whole (3D Secure crashes otherwise): an app cannot remove a library's keep rule, and this is what the
# Play Console's low R8 optimization score (15/10/2026) comes from. Kept on purpose, see mobile/publier-sur-les-stores.md.
-dontwarn com.stripe.android.pushProvisioning.**
-dontwarn com.google.android.gms.tapandpay.**
-keep class com.stripe.android.** { *; }
-keep class com.reactnativestripesdk.** { *; }
