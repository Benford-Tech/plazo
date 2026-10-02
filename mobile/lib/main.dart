import 'dart:async';

import 'package:flutter/material.dart';

import 'src/app/app.dart';
import 'src/bootstrap.dart';

void main() {
  var appStarted = false;

  runZonedGuarded(
    () async {
      await bootstrap(App.new);
      appStarted = true;
    },
    (error, stackTrace) {
      // Never the error's content in production logs: it may hold a traveller's data.
      debugPrint('Uncaught zone error: ${error.runtimeType}');
      if (appStarted) return;
      runApp(
        const MaterialApp(
          home: Scaffold(
            backgroundColor: Color(0xFF4B164C),
            body: Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text("Erreur de démarrage. Fermez puis rouvrez l'application.", style: TextStyle(color: Colors.white), textAlign: TextAlign.center),
              ),
            ),
          ),
        ),
      );
    },
  );
}
