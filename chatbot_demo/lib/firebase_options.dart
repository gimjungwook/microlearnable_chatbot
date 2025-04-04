// File generated by FlutterFire CLI.
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Example:
/// ```dart
/// import 'firebase_options.dart';
/// // ...
/// await Firebase.initializeApp(
///   options: DefaultFirebaseOptions.currentPlatform,
/// );
/// ```
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDtm6m4TlnQaJL4f61VOPV90Xa36vGH90E',
    appId: '1:183833683792:web:3cdfcc16a278f6d1006e55',
    messagingSenderId: '183833683792',
    projectId: 'chatbot-flow-e7cc4',
    authDomain: 'chatbot-flow-e7cc4.firebaseapp.com',
    storageBucket: 'chatbot-flow-e7cc4.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyD6SPRsnAl_B41MVOCPSiMlRXjgyuYRzGw',
    appId: '1:183833683792:android:3886b2518d2e0140006e55',
    messagingSenderId: '183833683792',
    projectId: 'chatbot-flow-e7cc4',
    storageBucket: 'chatbot-flow-e7cc4.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAudVQm5kMC32jZ60xEwu0SKVa7eXgJw-Q',
    appId: '1:183833683792:ios:77cbeacfb79751e6006e55',
    messagingSenderId: '183833683792',
    projectId: 'chatbot-flow-e7cc4',
    storageBucket: 'chatbot-flow-e7cc4.firebasestorage.app',
    iosBundleId: 'com.example.chatbotDemo',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyAudVQm5kMC32jZ60xEwu0SKVa7eXgJw-Q',
    appId: '1:183833683792:ios:77cbeacfb79751e6006e55',
    messagingSenderId: '183833683792',
    projectId: 'chatbot-flow-e7cc4',
    storageBucket: 'chatbot-flow-e7cc4.firebasestorage.app',
    iosBundleId: 'com.example.chatbotDemo',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyDtm6m4TlnQaJL4f61VOPV90Xa36vGH90E',
    appId: '1:183833683792:web:9c2ef693a6e91c48006e55',
    messagingSenderId: '183833683792',
    projectId: 'chatbot-flow-e7cc4',
    authDomain: 'chatbot-flow-e7cc4.firebaseapp.com',
    storageBucket: 'chatbot-flow-e7cc4.firebasestorage.app',
  );
}
