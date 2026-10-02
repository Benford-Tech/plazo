/// The current time, injectable so that tests can move it (2-hour limit, "il y a 20 s").
typedef Clock = DateTime Function();

DateTime systemClock() => DateTime.now();
