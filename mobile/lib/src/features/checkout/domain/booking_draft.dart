/// What the traveller typed in the booking form, kept in memory (never on disk: personal data)
/// so that "Modifier" or "Recommencer" on the payment step reopens the form filled in, as the
/// site does.
class BookingDraft {
  const BookingDraft({
    this.customerName = '',
    this.customerPhone = '',
    this.customerEmail = '',
    this.plate = '',
    this.returnFlight = '',
    this.passengers = 1,
    this.acceptTerms = false,
  });

  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String plate;
  final String returnFlight;
  final int passengers;
  final bool acceptTerms;
}

class BookingDraftStore {
  BookingDraft? _draft;

  BookingDraft? get draft => _draft;

  void save(BookingDraft draft) => _draft = draft;

  void clear() => _draft = null;
}
