import '../../../shared/child_seats/child_seats.dart';

/// What the traveller typed in the booking form, kept in memory (never on disk: personal data)
/// so that "Modifier" or "Recommencer" on the payment step reopens the form filled in, as the
/// site does.
class BookingDraft {
  const BookingDraft({
    this.customerFirstName = '',
    this.customerLastName = '',
    this.customerPhone = '',
    this.customerEmail = '',
    this.plate = '',
    this.returnFlight = '',
    this.departureFlight = '',
    this.passengers = 1,
    this.acceptTerms = false,
    this.vehicleModel = '',
    this.vehicleColour = '',
    this.customerNote = '',
    this.extras = const [],
    this.childSeats = ChildSeats.none,
  });

  /// 09/10/2026: first and last name apart (the server stores "Prénom Nom" for display).
  final String customerFirstName;
  final String customerLastName;
  final String customerPhone;
  final String customerEmail;
  final String plate;
  final String returnFlight;
  final String departureFlight;
  final int passengers;
  final bool acceptTerms;

  /// E (06/10/2026): the vehicle (so the valet spots it) and a word for the parking.
  final String vehicleModel;
  final String vehicleColour;
  final String customerNote;

  /// Services for the car ticked in the recap (21/10/2026): their kinds.
  final List<String> extras;

  /// Child car seats for the shuttle (24/10/2026, « Des enfants à bord ? »).
  final ChildSeats childSeats;

  BookingDraft copyWith({
    String? customerFirstName,
    String? customerLastName,
    String? customerPhone,
    String? customerEmail,
    String? plate,
    String? returnFlight,
    String? departureFlight,
    int? passengers,
    bool? acceptTerms,
    String? vehicleModel,
    String? vehicleColour,
    String? customerNote,
    List<String>? extras,
    ChildSeats? childSeats,
  }) => BookingDraft(
    customerFirstName: customerFirstName ?? this.customerFirstName,
    customerLastName: customerLastName ?? this.customerLastName,
    customerPhone: customerPhone ?? this.customerPhone,
    customerEmail: customerEmail ?? this.customerEmail,
    plate: plate ?? this.plate,
    returnFlight: returnFlight ?? this.returnFlight,
    departureFlight: departureFlight ?? this.departureFlight,
    passengers: passengers ?? this.passengers,
    acceptTerms: acceptTerms ?? this.acceptTerms,
    vehicleModel: vehicleModel ?? this.vehicleModel,
    vehicleColour: vehicleColour ?? this.vehicleColour,
    customerNote: customerNote ?? this.customerNote,
    extras: extras ?? this.extras,
    childSeats: childSeats ?? this.childSeats,
  );
}

class BookingDraftStore {
  BookingDraft? _draft;

  BookingDraft? get draft => _draft;

  void save(BookingDraft draft) => _draft = draft;

  void clear() => _draft = null;
}
