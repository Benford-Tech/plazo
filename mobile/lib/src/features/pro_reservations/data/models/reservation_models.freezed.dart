// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'reservation_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ReservationModel {

 String get id; String get reference; String get channel; String? get channelDetail; String get status; DateTime get arrivalAt; DateTime get returnAt; int get passengers; String get customerName; String get customerPhone; String? get customerEmail; String get plate; String? get returnFlight;/// Outbound flight (V-A) and its tracking (take-off).
 String? get departureFlight; String? get departureStatus; DateTime? get departureScheduledAt; DateTime? get departureEstimatedAt; String? get notes; String? get externalReference; int? get priceCents; bool get overbooked; String? get spotId; String? get keyHook; double? get carLat; double? get carLng; int? get carAccuracyM; DateTime? get carLocatedAt; String? get carLocatedBy; String? get carNote; String? get paymentStatus; DateTime? get createdAt;/// The statuses this staff member may set next, served by the API (06/10/2026).
 List<String> get nextStatuses;/// The sheet route carries the spot's code (bloc 2).
 ReservationSpotModel? get spot;
/// Create a copy of ReservationModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReservationModelCopyWith<ReservationModel> get copyWith => _$ReservationModelCopyWithImpl<ReservationModel>(this as ReservationModel, _$identity);

  /// Serializes this ReservationModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ReservationModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReservationModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.channel, _this.channel) || other.channel == _this.channel)&&(identical(other.channelDetail, _this.channelDetail) || other.channelDetail == _this.channelDetail)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.customerPhone, _this.customerPhone) || other.customerPhone == _this.customerPhone)&&(identical(other.customerEmail, _this.customerEmail) || other.customerEmail == _this.customerEmail)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.departureFlight, _this.departureFlight) || other.departureFlight == _this.departureFlight)&&(identical(other.departureStatus, _this.departureStatus) || other.departureStatus == _this.departureStatus)&&(identical(other.departureScheduledAt, _this.departureScheduledAt) || other.departureScheduledAt == _this.departureScheduledAt)&&(identical(other.departureEstimatedAt, _this.departureEstimatedAt) || other.departureEstimatedAt == _this.departureEstimatedAt)&&(identical(other.notes, _this.notes) || other.notes == _this.notes)&&(identical(other.externalReference, _this.externalReference) || other.externalReference == _this.externalReference)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.overbooked, _this.overbooked) || other.overbooked == _this.overbooked)&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.keyHook, _this.keyHook) || other.keyHook == _this.keyHook)&&(identical(other.carLat, _this.carLat) || other.carLat == _this.carLat)&&(identical(other.carLng, _this.carLng) || other.carLng == _this.carLng)&&(identical(other.carAccuracyM, _this.carAccuracyM) || other.carAccuracyM == _this.carAccuracyM)&&(identical(other.carLocatedAt, _this.carLocatedAt) || other.carLocatedAt == _this.carLocatedAt)&&(identical(other.carLocatedBy, _this.carLocatedBy) || other.carLocatedBy == _this.carLocatedBy)&&(identical(other.carNote, _this.carNote) || other.carNote == _this.carNote)&&(identical(other.paymentStatus, _this.paymentStatus) || other.paymentStatus == _this.paymentStatus)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&const DeepCollectionEquality().equals(other.nextStatuses, _this.nextStatuses)&&(identical(other.spot, _this.spot) || other.spot == _this.spot));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ReservationModel;
  return Object.hashAll([runtimeType,_this.id,_this.reference,_this.channel,_this.channelDetail,_this.status,_this.arrivalAt,_this.returnAt,_this.passengers,_this.customerName,_this.customerPhone,_this.customerEmail,_this.plate,_this.returnFlight,_this.departureFlight,_this.departureStatus,_this.departureScheduledAt,_this.departureEstimatedAt,_this.notes,_this.externalReference,_this.priceCents,_this.overbooked,_this.spotId,_this.keyHook,_this.carLat,_this.carLng,_this.carAccuracyM,_this.carLocatedAt,_this.carLocatedBy,_this.carNote,_this.paymentStatus,_this.createdAt,const DeepCollectionEquality().hash(_this.nextStatuses),_this.spot]);
}

@override
String toString() {
  final _this = this as ReservationModel;
  return 'ReservationModel(id: ${_this.id}, reference: ${_this.reference}, channel: ${_this.channel}, channelDetail: ${_this.channelDetail}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, passengers: ${_this.passengers}, customerName: ${_this.customerName}, customerPhone: ${_this.customerPhone}, customerEmail: ${_this.customerEmail}, plate: ${_this.plate}, returnFlight: ${_this.returnFlight}, departureFlight: ${_this.departureFlight}, departureStatus: ${_this.departureStatus}, departureScheduledAt: ${_this.departureScheduledAt}, departureEstimatedAt: ${_this.departureEstimatedAt}, notes: ${_this.notes}, externalReference: ${_this.externalReference}, priceCents: ${_this.priceCents}, overbooked: ${_this.overbooked}, spotId: ${_this.spotId}, keyHook: ${_this.keyHook}, carLat: ${_this.carLat}, carLng: ${_this.carLng}, carAccuracyM: ${_this.carAccuracyM}, carLocatedAt: ${_this.carLocatedAt}, carLocatedBy: ${_this.carLocatedBy}, carNote: ${_this.carNote}, paymentStatus: ${_this.paymentStatus}, createdAt: ${_this.createdAt}, nextStatuses: ${_this.nextStatuses}, spot: ${_this.spot})';
}


}

/// @nodoc
abstract mixin class $ReservationModelCopyWith<$Res>  {
  factory $ReservationModelCopyWith(ReservationModel value, $Res Function(ReservationModel) _then) = _$ReservationModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String channel, String? channelDetail, String status, DateTime arrivalAt, DateTime returnAt, int passengers, String customerName, String customerPhone, String? customerEmail, String plate, String? returnFlight, String? departureFlight, String? departureStatus, DateTime? departureScheduledAt, DateTime? departureEstimatedAt, String? notes, String? externalReference, int? priceCents, bool overbooked, String? spotId, String? keyHook, double? carLat, double? carLng, int? carAccuracyM, DateTime? carLocatedAt, String? carLocatedBy, String? carNote, String? paymentStatus, DateTime? createdAt, List<String> nextStatuses, ReservationSpotModel? spot
});


$ReservationSpotModelCopyWith<$Res>? get spot;

}
/// @nodoc
class _$ReservationModelCopyWithImpl<$Res>
    implements $ReservationModelCopyWith<$Res> {
  _$ReservationModelCopyWithImpl(this._self, this._then);

  final ReservationModel _self;
  final $Res Function(ReservationModel) _then;

/// Create a copy of ReservationModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? channel = null,Object? channelDetail = freezed,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? passengers = null,Object? customerName = null,Object? customerPhone = null,Object? customerEmail = freezed,Object? plate = null,Object? returnFlight = freezed,Object? departureFlight = freezed,Object? departureStatus = freezed,Object? departureScheduledAt = freezed,Object? departureEstimatedAt = freezed,Object? notes = freezed,Object? externalReference = freezed,Object? priceCents = freezed,Object? overbooked = null,Object? spotId = freezed,Object? keyHook = freezed,Object? carLat = freezed,Object? carLng = freezed,Object? carAccuracyM = freezed,Object? carLocatedAt = freezed,Object? carLocatedBy = freezed,Object? carNote = freezed,Object? paymentStatus = freezed,Object? createdAt = freezed,Object? nextStatuses = null,Object? spot = freezed,}) {
  return _then(ReservationModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,channelDetail: freezed == channelDetail ? _self.channelDetail : channelDetail // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,customerPhone: null == customerPhone ? _self.customerPhone : customerPhone // ignore: cast_nullable_to_non_nullable
as String,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,departureFlight: freezed == departureFlight ? _self.departureFlight : departureFlight // ignore: cast_nullable_to_non_nullable
as String?,departureStatus: freezed == departureStatus ? _self.departureStatus : departureStatus // ignore: cast_nullable_to_non_nullable
as String?,departureScheduledAt: freezed == departureScheduledAt ? _self.departureScheduledAt : departureScheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,departureEstimatedAt: freezed == departureEstimatedAt ? _self.departureEstimatedAt : departureEstimatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,externalReference: freezed == externalReference ? _self.externalReference : externalReference // ignore: cast_nullable_to_non_nullable
as String?,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,overbooked: null == overbooked ? _self.overbooked : overbooked // ignore: cast_nullable_to_non_nullable
as bool,spotId: freezed == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,carLat: freezed == carLat ? _self.carLat : carLat // ignore: cast_nullable_to_non_nullable
as double?,carLng: freezed == carLng ? _self.carLng : carLng // ignore: cast_nullable_to_non_nullable
as double?,carAccuracyM: freezed == carAccuracyM ? _self.carAccuracyM : carAccuracyM // ignore: cast_nullable_to_non_nullable
as int?,carLocatedAt: freezed == carLocatedAt ? _self.carLocatedAt : carLocatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,carLocatedBy: freezed == carLocatedBy ? _self.carLocatedBy : carLocatedBy // ignore: cast_nullable_to_non_nullable
as String?,carNote: freezed == carNote ? _self.carNote : carNote // ignore: cast_nullable_to_non_nullable
as String?,paymentStatus: freezed == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,nextStatuses: null == nextStatuses ? _self.nextStatuses : nextStatuses // ignore: cast_nullable_to_non_nullable
as List<String>,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as ReservationSpotModel?,
  ));
}
/// Create a copy of ReservationModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationSpotModelCopyWith<$Res>? get spot {
    if (_self.spot == null) {
    return null;
  }

  return $ReservationSpotModelCopyWith<$Res>(_self.spot!, (value) {
    return _then(_self.copyWith(spot: value));
  });
}
}


/// Adds pattern-matching-related methods to [ReservationModel].
extension ReservationModelPatterns on ReservationModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReservationModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReservationModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReservationModel value)  $default,){
final _that = this;
switch (_that) {
case _ReservationModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReservationModel value)?  $default,){
final _that = this;
switch (_that) {
case _ReservationModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String channel,  String? channelDetail,  String status,  DateTime arrivalAt,  DateTime returnAt,  int passengers,  String customerName,  String customerPhone,  String? customerEmail,  String plate,  String? returnFlight,  String? departureFlight,  String? departureStatus,  DateTime? departureScheduledAt,  DateTime? departureEstimatedAt,  String? notes,  String? externalReference,  int? priceCents,  bool overbooked,  String? spotId,  String? keyHook,  double? carLat,  double? carLng,  int? carAccuracyM,  DateTime? carLocatedAt,  String? carLocatedBy,  String? carNote,  String? paymentStatus,  DateTime? createdAt,  List<String> nextStatuses,  ReservationSpotModel? spot)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReservationModel() when $default != null:
return $default(_that.id,_that.reference,_that.channel,_that.channelDetail,_that.status,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.customerPhone,_that.customerEmail,_that.plate,_that.returnFlight,_that.departureFlight,_that.departureStatus,_that.departureScheduledAt,_that.departureEstimatedAt,_that.notes,_that.externalReference,_that.priceCents,_that.overbooked,_that.spotId,_that.keyHook,_that.carLat,_that.carLng,_that.carAccuracyM,_that.carLocatedAt,_that.carLocatedBy,_that.carNote,_that.paymentStatus,_that.createdAt,_that.nextStatuses,_that.spot);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String channel,  String? channelDetail,  String status,  DateTime arrivalAt,  DateTime returnAt,  int passengers,  String customerName,  String customerPhone,  String? customerEmail,  String plate,  String? returnFlight,  String? departureFlight,  String? departureStatus,  DateTime? departureScheduledAt,  DateTime? departureEstimatedAt,  String? notes,  String? externalReference,  int? priceCents,  bool overbooked,  String? spotId,  String? keyHook,  double? carLat,  double? carLng,  int? carAccuracyM,  DateTime? carLocatedAt,  String? carLocatedBy,  String? carNote,  String? paymentStatus,  DateTime? createdAt,  List<String> nextStatuses,  ReservationSpotModel? spot)  $default,) {final _that = this;
switch (_that) {
case _ReservationModel():
return $default(_that.id,_that.reference,_that.channel,_that.channelDetail,_that.status,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.customerPhone,_that.customerEmail,_that.plate,_that.returnFlight,_that.departureFlight,_that.departureStatus,_that.departureScheduledAt,_that.departureEstimatedAt,_that.notes,_that.externalReference,_that.priceCents,_that.overbooked,_that.spotId,_that.keyHook,_that.carLat,_that.carLng,_that.carAccuracyM,_that.carLocatedAt,_that.carLocatedBy,_that.carNote,_that.paymentStatus,_that.createdAt,_that.nextStatuses,_that.spot);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String channel,  String? channelDetail,  String status,  DateTime arrivalAt,  DateTime returnAt,  int passengers,  String customerName,  String customerPhone,  String? customerEmail,  String plate,  String? returnFlight,  String? departureFlight,  String? departureStatus,  DateTime? departureScheduledAt,  DateTime? departureEstimatedAt,  String? notes,  String? externalReference,  int? priceCents,  bool overbooked,  String? spotId,  String? keyHook,  double? carLat,  double? carLng,  int? carAccuracyM,  DateTime? carLocatedAt,  String? carLocatedBy,  String? carNote,  String? paymentStatus,  DateTime? createdAt,  List<String> nextStatuses,  ReservationSpotModel? spot)?  $default,) {final _that = this;
switch (_that) {
case _ReservationModel() when $default != null:
return $default(_that.id,_that.reference,_that.channel,_that.channelDetail,_that.status,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.customerPhone,_that.customerEmail,_that.plate,_that.returnFlight,_that.departureFlight,_that.departureStatus,_that.departureScheduledAt,_that.departureEstimatedAt,_that.notes,_that.externalReference,_that.priceCents,_that.overbooked,_that.spotId,_that.keyHook,_that.carLat,_that.carLng,_that.carAccuracyM,_that.carLocatedAt,_that.carLocatedBy,_that.carNote,_that.paymentStatus,_that.createdAt,_that.nextStatuses,_that.spot);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReservationModel extends ReservationModel {
  const _ReservationModel({required this.id, required this.reference, required this.channel, this.channelDetail, required this.status, required this.arrivalAt, required this.returnAt, required this.passengers, required this.customerName, required this.customerPhone, this.customerEmail, required this.plate, this.returnFlight, this.departureFlight, this.departureStatus, this.departureScheduledAt, this.departureEstimatedAt, this.notes, this.externalReference, this.priceCents, this.overbooked = false, this.spotId, this.keyHook, this.carLat, this.carLng, this.carAccuracyM, this.carLocatedAt, this.carLocatedBy, this.carNote, this.paymentStatus, this.createdAt,  List<String> nextStatuses = const [], this.spot}): _nextStatuses = nextStatuses,super._();
  factory _ReservationModel.fromJson(Map<String, dynamic> json) => _$ReservationModelFromJson(json);

@override final  String id;
@override final  String reference;
@override final  String channel;
@override final  String? channelDetail;
@override final  String status;
@override final  DateTime arrivalAt;
@override final  DateTime returnAt;
@override final  int passengers;
@override final  String customerName;
@override final  String customerPhone;
@override final  String? customerEmail;
@override final  String plate;
@override final  String? returnFlight;
/// Outbound flight (V-A) and its tracking (take-off).
@override final  String? departureFlight;
@override final  String? departureStatus;
@override final  DateTime? departureScheduledAt;
@override final  DateTime? departureEstimatedAt;
@override final  String? notes;
@override final  String? externalReference;
@override final  int? priceCents;
@override@JsonKey() final  bool overbooked;
@override final  String? spotId;
@override final  String? keyHook;
@override final  double? carLat;
@override final  double? carLng;
@override final  int? carAccuracyM;
@override final  DateTime? carLocatedAt;
@override final  String? carLocatedBy;
@override final  String? carNote;
@override final  String? paymentStatus;
@override final  DateTime? createdAt;
/// The statuses this staff member may set next, served by the API (06/10/2026).
 final  List<String> _nextStatuses;
/// The statuses this staff member may set next, served by the API (06/10/2026).
@override@JsonKey() List<String> get nextStatuses {
  if (_nextStatuses is EqualUnmodifiableListView) return _nextStatuses;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_nextStatuses);
}

/// The sheet route carries the spot's code (bloc 2).
@override final  ReservationSpotModel? spot;

/// Create a copy of ReservationModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReservationModelCopyWith<_ReservationModel> get copyWith => __$ReservationModelCopyWithImpl<_ReservationModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReservationModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReservationModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.channel, channel) || other.channel == channel)&&(identical(other.channelDetail, channelDetail) || other.channelDetail == channelDetail)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.customerPhone, customerPhone) || other.customerPhone == customerPhone)&&(identical(other.customerEmail, customerEmail) || other.customerEmail == customerEmail)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.departureFlight, departureFlight) || other.departureFlight == departureFlight)&&(identical(other.departureStatus, departureStatus) || other.departureStatus == departureStatus)&&(identical(other.departureScheduledAt, departureScheduledAt) || other.departureScheduledAt == departureScheduledAt)&&(identical(other.departureEstimatedAt, departureEstimatedAt) || other.departureEstimatedAt == departureEstimatedAt)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.externalReference, externalReference) || other.externalReference == externalReference)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.overbooked, overbooked) || other.overbooked == overbooked)&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.keyHook, keyHook) || other.keyHook == keyHook)&&(identical(other.carLat, carLat) || other.carLat == carLat)&&(identical(other.carLng, carLng) || other.carLng == carLng)&&(identical(other.carAccuracyM, carAccuracyM) || other.carAccuracyM == carAccuracyM)&&(identical(other.carLocatedAt, carLocatedAt) || other.carLocatedAt == carLocatedAt)&&(identical(other.carLocatedBy, carLocatedBy) || other.carLocatedBy == carLocatedBy)&&(identical(other.carNote, carNote) || other.carNote == carNote)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&const DeepCollectionEquality().equals(other.nextStatuses, _nextStatuses)&&(identical(other.spot, spot) || other.spot == spot));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,id,reference,channel,channelDetail,status,arrivalAt,returnAt,passengers,customerName,customerPhone,customerEmail,plate,returnFlight,departureFlight,departureStatus,departureScheduledAt,departureEstimatedAt,notes,externalReference,priceCents,overbooked,spotId,keyHook,carLat,carLng,carAccuracyM,carLocatedAt,carLocatedBy,carNote,paymentStatus,createdAt,const DeepCollectionEquality().hash(_nextStatuses),spot]);
}

@override
String toString() {
    return 'ReservationModel(id: $id, reference: $reference, channel: $channel, channelDetail: $channelDetail, status: $status, arrivalAt: $arrivalAt, returnAt: $returnAt, passengers: $passengers, customerName: $customerName, customerPhone: $customerPhone, customerEmail: $customerEmail, plate: $plate, returnFlight: $returnFlight, departureFlight: $departureFlight, departureStatus: $departureStatus, departureScheduledAt: $departureScheduledAt, departureEstimatedAt: $departureEstimatedAt, notes: $notes, externalReference: $externalReference, priceCents: $priceCents, overbooked: $overbooked, spotId: $spotId, keyHook: $keyHook, carLat: $carLat, carLng: $carLng, carAccuracyM: $carAccuracyM, carLocatedAt: $carLocatedAt, carLocatedBy: $carLocatedBy, carNote: $carNote, paymentStatus: $paymentStatus, createdAt: $createdAt, nextStatuses: $nextStatuses, spot: $spot)';
}


}

/// @nodoc
abstract mixin class _$ReservationModelCopyWith<$Res> implements $ReservationModelCopyWith<$Res> {
  factory _$ReservationModelCopyWith(_ReservationModel value, $Res Function(_ReservationModel) _then) = __$ReservationModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String channel, String? channelDetail, String status, DateTime arrivalAt, DateTime returnAt, int passengers, String customerName, String customerPhone, String? customerEmail, String plate, String? returnFlight, String? departureFlight, String? departureStatus, DateTime? departureScheduledAt, DateTime? departureEstimatedAt, String? notes, String? externalReference, int? priceCents, bool overbooked, String? spotId, String? keyHook, double? carLat, double? carLng, int? carAccuracyM, DateTime? carLocatedAt, String? carLocatedBy, String? carNote, String? paymentStatus, DateTime? createdAt, List<String> nextStatuses, ReservationSpotModel? spot
});


@override $ReservationSpotModelCopyWith<$Res>? get spot;

}
/// @nodoc
class __$ReservationModelCopyWithImpl<$Res>
    implements _$ReservationModelCopyWith<$Res> {
  __$ReservationModelCopyWithImpl(this._self, this._then);

  final _ReservationModel _self;
  final $Res Function(_ReservationModel) _then;

/// Create a copy of ReservationModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? channel = null,Object? channelDetail = freezed,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? passengers = null,Object? customerName = null,Object? customerPhone = null,Object? customerEmail = freezed,Object? plate = null,Object? returnFlight = freezed,Object? departureFlight = freezed,Object? departureStatus = freezed,Object? departureScheduledAt = freezed,Object? departureEstimatedAt = freezed,Object? notes = freezed,Object? externalReference = freezed,Object? priceCents = freezed,Object? overbooked = null,Object? spotId = freezed,Object? keyHook = freezed,Object? carLat = freezed,Object? carLng = freezed,Object? carAccuracyM = freezed,Object? carLocatedAt = freezed,Object? carLocatedBy = freezed,Object? carNote = freezed,Object? paymentStatus = freezed,Object? createdAt = freezed,Object? nextStatuses = null,Object? spot = freezed,}) {
  return _then(_ReservationModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,channelDetail: freezed == channelDetail ? _self.channelDetail : channelDetail // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,customerPhone: null == customerPhone ? _self.customerPhone : customerPhone // ignore: cast_nullable_to_non_nullable
as String,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,departureFlight: freezed == departureFlight ? _self.departureFlight : departureFlight // ignore: cast_nullable_to_non_nullable
as String?,departureStatus: freezed == departureStatus ? _self.departureStatus : departureStatus // ignore: cast_nullable_to_non_nullable
as String?,departureScheduledAt: freezed == departureScheduledAt ? _self.departureScheduledAt : departureScheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,departureEstimatedAt: freezed == departureEstimatedAt ? _self.departureEstimatedAt : departureEstimatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,externalReference: freezed == externalReference ? _self.externalReference : externalReference // ignore: cast_nullable_to_non_nullable
as String?,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,overbooked: null == overbooked ? _self.overbooked : overbooked // ignore: cast_nullable_to_non_nullable
as bool,spotId: freezed == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,carLat: freezed == carLat ? _self.carLat : carLat // ignore: cast_nullable_to_non_nullable
as double?,carLng: freezed == carLng ? _self.carLng : carLng // ignore: cast_nullable_to_non_nullable
as double?,carAccuracyM: freezed == carAccuracyM ? _self.carAccuracyM : carAccuracyM // ignore: cast_nullable_to_non_nullable
as int?,carLocatedAt: freezed == carLocatedAt ? _self.carLocatedAt : carLocatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,carLocatedBy: freezed == carLocatedBy ? _self.carLocatedBy : carLocatedBy // ignore: cast_nullable_to_non_nullable
as String?,carNote: freezed == carNote ? _self.carNote : carNote // ignore: cast_nullable_to_non_nullable
as String?,paymentStatus: freezed == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,nextStatuses: null == nextStatuses ? _self._nextStatuses : nextStatuses // ignore: cast_nullable_to_non_nullable
as List<String>,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as ReservationSpotModel?,
  ));
}

/// Create a copy of ReservationModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationSpotModelCopyWith<$Res>? get spot {
    if (_self.spot == null) {
    return null;
  }

  return $ReservationSpotModelCopyWith<$Res>(_self.spot!, (value) {
    return _then(_self.copyWith(spot: value));
  });
}
}


/// @nodoc
mixin _$ReservationSpotModel {

 String get code;
/// Create a copy of ReservationSpotModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReservationSpotModelCopyWith<ReservationSpotModel> get copyWith => _$ReservationSpotModelCopyWithImpl<ReservationSpotModel>(this as ReservationSpotModel, _$identity);

  /// Serializes this ReservationSpotModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ReservationSpotModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReservationSpotModel&&(identical(other.code, _this.code) || other.code == _this.code));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ReservationSpotModel;
  return Object.hash(runtimeType,_this.code);
}

@override
String toString() {
  final _this = this as ReservationSpotModel;
  return 'ReservationSpotModel(code: ${_this.code})';
}


}

/// @nodoc
abstract mixin class $ReservationSpotModelCopyWith<$Res>  {
  factory $ReservationSpotModelCopyWith(ReservationSpotModel value, $Res Function(ReservationSpotModel) _then) = _$ReservationSpotModelCopyWithImpl;
@useResult
$Res call({
 String code
});




}
/// @nodoc
class _$ReservationSpotModelCopyWithImpl<$Res>
    implements $ReservationSpotModelCopyWith<$Res> {
  _$ReservationSpotModelCopyWithImpl(this._self, this._then);

  final ReservationSpotModel _self;
  final $Res Function(ReservationSpotModel) _then;

/// Create a copy of ReservationSpotModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? code = null,}) {
  return _then(ReservationSpotModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ReservationSpotModel].
extension ReservationSpotModelPatterns on ReservationSpotModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReservationSpotModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReservationSpotModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReservationSpotModel value)  $default,){
final _that = this;
switch (_that) {
case _ReservationSpotModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReservationSpotModel value)?  $default,){
final _that = this;
switch (_that) {
case _ReservationSpotModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String code)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReservationSpotModel() when $default != null:
return $default(_that.code);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String code)  $default,) {final _that = this;
switch (_that) {
case _ReservationSpotModel():
return $default(_that.code);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String code)?  $default,) {final _that = this;
switch (_that) {
case _ReservationSpotModel() when $default != null:
return $default(_that.code);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReservationSpotModel implements ReservationSpotModel {
  const _ReservationSpotModel({required this.code});
  factory _ReservationSpotModel.fromJson(Map<String, dynamic> json) => _$ReservationSpotModelFromJson(json);

@override final  String code;

/// Create a copy of ReservationSpotModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReservationSpotModelCopyWith<_ReservationSpotModel> get copyWith => __$ReservationSpotModelCopyWithImpl<_ReservationSpotModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReservationSpotModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReservationSpotModel&&(identical(other.code, code) || other.code == code));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,code);
}

@override
String toString() {
    return 'ReservationSpotModel(code: $code)';
}


}

/// @nodoc
abstract mixin class _$ReservationSpotModelCopyWith<$Res> implements $ReservationSpotModelCopyWith<$Res> {
  factory _$ReservationSpotModelCopyWith(_ReservationSpotModel value, $Res Function(_ReservationSpotModel) _then) = __$ReservationSpotModelCopyWithImpl;
@override @useResult
$Res call({
 String code
});




}
/// @nodoc
class __$ReservationSpotModelCopyWithImpl<$Res>
    implements _$ReservationSpotModelCopyWith<$Res> {
  __$ReservationSpotModelCopyWithImpl(this._self, this._then);

  final _ReservationSpotModel _self;
  final $Res Function(_ReservationSpotModel) _then;

/// Create a copy of ReservationSpotModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? code = null,}) {
  return _then(_ReservationSpotModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ReservationPageModel {

 List<ReservationModel> get docs; int get totalDocs; int get page; int get totalPages; bool get hasNextPage;
/// Create a copy of ReservationPageModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReservationPageModelCopyWith<ReservationPageModel> get copyWith => _$ReservationPageModelCopyWithImpl<ReservationPageModel>(this as ReservationPageModel, _$identity);

  /// Serializes this ReservationPageModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ReservationPageModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReservationPageModel&&const DeepCollectionEquality().equals(other.docs, _this.docs)&&(identical(other.totalDocs, _this.totalDocs) || other.totalDocs == _this.totalDocs)&&(identical(other.page, _this.page) || other.page == _this.page)&&(identical(other.totalPages, _this.totalPages) || other.totalPages == _this.totalPages)&&(identical(other.hasNextPage, _this.hasNextPage) || other.hasNextPage == _this.hasNextPage));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ReservationPageModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.docs),_this.totalDocs,_this.page,_this.totalPages,_this.hasNextPage);
}

@override
String toString() {
  final _this = this as ReservationPageModel;
  return 'ReservationPageModel(docs: ${_this.docs}, totalDocs: ${_this.totalDocs}, page: ${_this.page}, totalPages: ${_this.totalPages}, hasNextPage: ${_this.hasNextPage})';
}


}

/// @nodoc
abstract mixin class $ReservationPageModelCopyWith<$Res>  {
  factory $ReservationPageModelCopyWith(ReservationPageModel value, $Res Function(ReservationPageModel) _then) = _$ReservationPageModelCopyWithImpl;
@useResult
$Res call({
 List<ReservationModel> docs, int totalDocs, int page, int totalPages, bool hasNextPage
});




}
/// @nodoc
class _$ReservationPageModelCopyWithImpl<$Res>
    implements $ReservationPageModelCopyWith<$Res> {
  _$ReservationPageModelCopyWithImpl(this._self, this._then);

  final ReservationPageModel _self;
  final $Res Function(ReservationPageModel) _then;

/// Create a copy of ReservationPageModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? docs = null,Object? totalDocs = null,Object? page = null,Object? totalPages = null,Object? hasNextPage = null,}) {
  return _then(ReservationPageModel(
docs: null == docs ? _self.docs : docs // ignore: cast_nullable_to_non_nullable
as List<ReservationModel>,totalDocs: null == totalDocs ? _self.totalDocs : totalDocs // ignore: cast_nullable_to_non_nullable
as int,page: null == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int,totalPages: null == totalPages ? _self.totalPages : totalPages // ignore: cast_nullable_to_non_nullable
as int,hasNextPage: null == hasNextPage ? _self.hasNextPage : hasNextPage // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ReservationPageModel].
extension ReservationPageModelPatterns on ReservationPageModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReservationPageModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReservationPageModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReservationPageModel value)  $default,){
final _that = this;
switch (_that) {
case _ReservationPageModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReservationPageModel value)?  $default,){
final _that = this;
switch (_that) {
case _ReservationPageModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ReservationModel> docs,  int totalDocs,  int page,  int totalPages,  bool hasNextPage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReservationPageModel() when $default != null:
return $default(_that.docs,_that.totalDocs,_that.page,_that.totalPages,_that.hasNextPage);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ReservationModel> docs,  int totalDocs,  int page,  int totalPages,  bool hasNextPage)  $default,) {final _that = this;
switch (_that) {
case _ReservationPageModel():
return $default(_that.docs,_that.totalDocs,_that.page,_that.totalPages,_that.hasNextPage);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ReservationModel> docs,  int totalDocs,  int page,  int totalPages,  bool hasNextPage)?  $default,) {final _that = this;
switch (_that) {
case _ReservationPageModel() when $default != null:
return $default(_that.docs,_that.totalDocs,_that.page,_that.totalPages,_that.hasNextPage);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReservationPageModel implements ReservationPageModel {
  const _ReservationPageModel({ List<ReservationModel> docs = const [], this.totalDocs = 0, this.page = 1, this.totalPages = 1, this.hasNextPage = false}): _docs = docs;
  factory _ReservationPageModel.fromJson(Map<String, dynamic> json) => _$ReservationPageModelFromJson(json);

 final  List<ReservationModel> _docs;
@override@JsonKey() List<ReservationModel> get docs {
  if (_docs is EqualUnmodifiableListView) return _docs;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_docs);
}

@override@JsonKey() final  int totalDocs;
@override@JsonKey() final  int page;
@override@JsonKey() final  int totalPages;
@override@JsonKey() final  bool hasNextPage;

/// Create a copy of ReservationPageModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReservationPageModelCopyWith<_ReservationPageModel> get copyWith => __$ReservationPageModelCopyWithImpl<_ReservationPageModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReservationPageModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReservationPageModel&&const DeepCollectionEquality().equals(other.docs, _docs)&&(identical(other.totalDocs, totalDocs) || other.totalDocs == totalDocs)&&(identical(other.page, page) || other.page == page)&&(identical(other.totalPages, totalPages) || other.totalPages == totalPages)&&(identical(other.hasNextPage, hasNextPage) || other.hasNextPage == hasNextPage));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_docs),totalDocs,page,totalPages,hasNextPage);
}

@override
String toString() {
    return 'ReservationPageModel(docs: $docs, totalDocs: $totalDocs, page: $page, totalPages: $totalPages, hasNextPage: $hasNextPage)';
}


}

/// @nodoc
abstract mixin class _$ReservationPageModelCopyWith<$Res> implements $ReservationPageModelCopyWith<$Res> {
  factory _$ReservationPageModelCopyWith(_ReservationPageModel value, $Res Function(_ReservationPageModel) _then) = __$ReservationPageModelCopyWithImpl;
@override @useResult
$Res call({
 List<ReservationModel> docs, int totalDocs, int page, int totalPages, bool hasNextPage
});




}
/// @nodoc
class __$ReservationPageModelCopyWithImpl<$Res>
    implements _$ReservationPageModelCopyWith<$Res> {
  __$ReservationPageModelCopyWithImpl(this._self, this._then);

  final _ReservationPageModel _self;
  final $Res Function(_ReservationPageModel) _then;

/// Create a copy of ReservationPageModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? docs = null,Object? totalDocs = null,Object? page = null,Object? totalPages = null,Object? hasNextPage = null,}) {
  return _then(_ReservationPageModel(
docs: null == docs ? _self._docs : docs // ignore: cast_nullable_to_non_nullable
as List<ReservationModel>,totalDocs: null == totalDocs ? _self.totalDocs : totalDocs // ignore: cast_nullable_to_non_nullable
as int,page: null == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int,totalPages: null == totalPages ? _self.totalPages : totalPages // ignore: cast_nullable_to_non_nullable
as int,hasNextPage: null == hasNextPage ? _self.hasNextPage : hasNextPage // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$CapacityPreviewModel {

 int get nights; List<String> get fullNights; bool get canForce;
/// Create a copy of CapacityPreviewModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CapacityPreviewModelCopyWith<CapacityPreviewModel> get copyWith => _$CapacityPreviewModelCopyWithImpl<CapacityPreviewModel>(this as CapacityPreviewModel, _$identity);

  /// Serializes this CapacityPreviewModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as CapacityPreviewModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CapacityPreviewModel&&(identical(other.nights, _this.nights) || other.nights == _this.nights)&&const DeepCollectionEquality().equals(other.fullNights, _this.fullNights)&&(identical(other.canForce, _this.canForce) || other.canForce == _this.canForce));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as CapacityPreviewModel;
  return Object.hash(runtimeType,_this.nights,const DeepCollectionEquality().hash(_this.fullNights),_this.canForce);
}

@override
String toString() {
  final _this = this as CapacityPreviewModel;
  return 'CapacityPreviewModel(nights: ${_this.nights}, fullNights: ${_this.fullNights}, canForce: ${_this.canForce})';
}


}

/// @nodoc
abstract mixin class $CapacityPreviewModelCopyWith<$Res>  {
  factory $CapacityPreviewModelCopyWith(CapacityPreviewModel value, $Res Function(CapacityPreviewModel) _then) = _$CapacityPreviewModelCopyWithImpl;
@useResult
$Res call({
 int nights, List<String> fullNights, bool canForce
});




}
/// @nodoc
class _$CapacityPreviewModelCopyWithImpl<$Res>
    implements $CapacityPreviewModelCopyWith<$Res> {
  _$CapacityPreviewModelCopyWithImpl(this._self, this._then);

  final CapacityPreviewModel _self;
  final $Res Function(CapacityPreviewModel) _then;

/// Create a copy of CapacityPreviewModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? nights = null,Object? fullNights = null,Object? canForce = null,}) {
  return _then(CapacityPreviewModel(
nights: null == nights ? _self.nights : nights // ignore: cast_nullable_to_non_nullable
as int,fullNights: null == fullNights ? _self.fullNights : fullNights // ignore: cast_nullable_to_non_nullable
as List<String>,canForce: null == canForce ? _self.canForce : canForce // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [CapacityPreviewModel].
extension CapacityPreviewModelPatterns on CapacityPreviewModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CapacityPreviewModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CapacityPreviewModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CapacityPreviewModel value)  $default,){
final _that = this;
switch (_that) {
case _CapacityPreviewModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CapacityPreviewModel value)?  $default,){
final _that = this;
switch (_that) {
case _CapacityPreviewModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int nights,  List<String> fullNights,  bool canForce)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CapacityPreviewModel() when $default != null:
return $default(_that.nights,_that.fullNights,_that.canForce);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int nights,  List<String> fullNights,  bool canForce)  $default,) {final _that = this;
switch (_that) {
case _CapacityPreviewModel():
return $default(_that.nights,_that.fullNights,_that.canForce);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int nights,  List<String> fullNights,  bool canForce)?  $default,) {final _that = this;
switch (_that) {
case _CapacityPreviewModel() when $default != null:
return $default(_that.nights,_that.fullNights,_that.canForce);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CapacityPreviewModel implements CapacityPreviewModel {
  const _CapacityPreviewModel({this.nights = 0,  List<String> fullNights = const [], this.canForce = false}): _fullNights = fullNights;
  factory _CapacityPreviewModel.fromJson(Map<String, dynamic> json) => _$CapacityPreviewModelFromJson(json);

@override@JsonKey() final  int nights;
 final  List<String> _fullNights;
@override@JsonKey() List<String> get fullNights {
  if (_fullNights is EqualUnmodifiableListView) return _fullNights;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_fullNights);
}

@override@JsonKey() final  bool canForce;

/// Create a copy of CapacityPreviewModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CapacityPreviewModelCopyWith<_CapacityPreviewModel> get copyWith => __$CapacityPreviewModelCopyWithImpl<_CapacityPreviewModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CapacityPreviewModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CapacityPreviewModel&&(identical(other.nights, nights) || other.nights == nights)&&const DeepCollectionEquality().equals(other.fullNights, _fullNights)&&(identical(other.canForce, canForce) || other.canForce == canForce));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,nights,const DeepCollectionEquality().hash(_fullNights),canForce);
}

@override
String toString() {
    return 'CapacityPreviewModel(nights: $nights, fullNights: $fullNights, canForce: $canForce)';
}


}

/// @nodoc
abstract mixin class _$CapacityPreviewModelCopyWith<$Res> implements $CapacityPreviewModelCopyWith<$Res> {
  factory _$CapacityPreviewModelCopyWith(_CapacityPreviewModel value, $Res Function(_CapacityPreviewModel) _then) = __$CapacityPreviewModelCopyWithImpl;
@override @useResult
$Res call({
 int nights, List<String> fullNights, bool canForce
});




}
/// @nodoc
class __$CapacityPreviewModelCopyWithImpl<$Res>
    implements _$CapacityPreviewModelCopyWith<$Res> {
  __$CapacityPreviewModelCopyWithImpl(this._self, this._then);

  final _CapacityPreviewModel _self;
  final $Res Function(_CapacityPreviewModel) _then;

/// Create a copy of CapacityPreviewModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? nights = null,Object? fullNights = null,Object? canForce = null,}) {
  return _then(_CapacityPreviewModel(
nights: null == nights ? _self.nights : nights // ignore: cast_nullable_to_non_nullable
as int,fullNights: null == fullNights ? _self._fullNights : fullNights // ignore: cast_nullable_to_non_nullable
as List<String>,canForce: null == canForce ? _self.canForce : canForce // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$ReservationInput {

 String get channel; String? get channelDetail; String get arrivalAt; String get returnAt; int get passengers; String get customerName; String get customerPhone; String? get customerEmail; String get plate; String? get returnFlight; String? get departureFlight; String? get notes; String? get externalReference; int? get priceCents; bool get force;
/// Create a copy of ReservationInput
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReservationInputCopyWith<ReservationInput> get copyWith => _$ReservationInputCopyWithImpl<ReservationInput>(this as ReservationInput, _$identity);

  /// Serializes this ReservationInput to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ReservationInput;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReservationInput&&(identical(other.channel, _this.channel) || other.channel == _this.channel)&&(identical(other.channelDetail, _this.channelDetail) || other.channelDetail == _this.channelDetail)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.customerPhone, _this.customerPhone) || other.customerPhone == _this.customerPhone)&&(identical(other.customerEmail, _this.customerEmail) || other.customerEmail == _this.customerEmail)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.departureFlight, _this.departureFlight) || other.departureFlight == _this.departureFlight)&&(identical(other.notes, _this.notes) || other.notes == _this.notes)&&(identical(other.externalReference, _this.externalReference) || other.externalReference == _this.externalReference)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.force, _this.force) || other.force == _this.force));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ReservationInput;
  return Object.hash(runtimeType,_this.channel,_this.channelDetail,_this.arrivalAt,_this.returnAt,_this.passengers,_this.customerName,_this.customerPhone,_this.customerEmail,_this.plate,_this.returnFlight,_this.departureFlight,_this.notes,_this.externalReference,_this.priceCents,_this.force);
}

@override
String toString() {
  final _this = this as ReservationInput;
  return 'ReservationInput(channel: ${_this.channel}, channelDetail: ${_this.channelDetail}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, passengers: ${_this.passengers}, customerName: ${_this.customerName}, customerPhone: ${_this.customerPhone}, customerEmail: ${_this.customerEmail}, plate: ${_this.plate}, returnFlight: ${_this.returnFlight}, departureFlight: ${_this.departureFlight}, notes: ${_this.notes}, externalReference: ${_this.externalReference}, priceCents: ${_this.priceCents}, force: ${_this.force})';
}


}

/// @nodoc
abstract mixin class $ReservationInputCopyWith<$Res>  {
  factory $ReservationInputCopyWith(ReservationInput value, $Res Function(ReservationInput) _then) = _$ReservationInputCopyWithImpl;
@useResult
$Res call({
 String channel, String? channelDetail, String arrivalAt, String returnAt, int passengers, String customerName, String customerPhone, String? customerEmail, String plate, String? returnFlight, String? departureFlight, String? notes, String? externalReference, int? priceCents, bool force
});




}
/// @nodoc
class _$ReservationInputCopyWithImpl<$Res>
    implements $ReservationInputCopyWith<$Res> {
  _$ReservationInputCopyWithImpl(this._self, this._then);

  final ReservationInput _self;
  final $Res Function(ReservationInput) _then;

/// Create a copy of ReservationInput
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? channel = null,Object? channelDetail = freezed,Object? arrivalAt = null,Object? returnAt = null,Object? passengers = null,Object? customerName = null,Object? customerPhone = null,Object? customerEmail = freezed,Object? plate = null,Object? returnFlight = freezed,Object? departureFlight = freezed,Object? notes = freezed,Object? externalReference = freezed,Object? priceCents = freezed,Object? force = null,}) {
  return _then(ReservationInput(
channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,channelDetail: freezed == channelDetail ? _self.channelDetail : channelDetail // ignore: cast_nullable_to_non_nullable
as String?,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,customerPhone: null == customerPhone ? _self.customerPhone : customerPhone // ignore: cast_nullable_to_non_nullable
as String,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,departureFlight: freezed == departureFlight ? _self.departureFlight : departureFlight // ignore: cast_nullable_to_non_nullable
as String?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,externalReference: freezed == externalReference ? _self.externalReference : externalReference // ignore: cast_nullable_to_non_nullable
as String?,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,force: null == force ? _self.force : force // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ReservationInput].
extension ReservationInputPatterns on ReservationInput {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReservationInput value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReservationInput() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReservationInput value)  $default,){
final _that = this;
switch (_that) {
case _ReservationInput():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReservationInput value)?  $default,){
final _that = this;
switch (_that) {
case _ReservationInput() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String channel,  String? channelDetail,  String arrivalAt,  String returnAt,  int passengers,  String customerName,  String customerPhone,  String? customerEmail,  String plate,  String? returnFlight,  String? departureFlight,  String? notes,  String? externalReference,  int? priceCents,  bool force)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReservationInput() when $default != null:
return $default(_that.channel,_that.channelDetail,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.customerPhone,_that.customerEmail,_that.plate,_that.returnFlight,_that.departureFlight,_that.notes,_that.externalReference,_that.priceCents,_that.force);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String channel,  String? channelDetail,  String arrivalAt,  String returnAt,  int passengers,  String customerName,  String customerPhone,  String? customerEmail,  String plate,  String? returnFlight,  String? departureFlight,  String? notes,  String? externalReference,  int? priceCents,  bool force)  $default,) {final _that = this;
switch (_that) {
case _ReservationInput():
return $default(_that.channel,_that.channelDetail,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.customerPhone,_that.customerEmail,_that.plate,_that.returnFlight,_that.departureFlight,_that.notes,_that.externalReference,_that.priceCents,_that.force);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String channel,  String? channelDetail,  String arrivalAt,  String returnAt,  int passengers,  String customerName,  String customerPhone,  String? customerEmail,  String plate,  String? returnFlight,  String? departureFlight,  String? notes,  String? externalReference,  int? priceCents,  bool force)?  $default,) {final _that = this;
switch (_that) {
case _ReservationInput() when $default != null:
return $default(_that.channel,_that.channelDetail,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.customerPhone,_that.customerEmail,_that.plate,_that.returnFlight,_that.departureFlight,_that.notes,_that.externalReference,_that.priceCents,_that.force);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReservationInput extends ReservationInput {
  const _ReservationInput({this.channel = 'phone', this.channelDetail, required this.arrivalAt, required this.returnAt, this.passengers = 2, this.customerName = '', this.customerPhone = '', this.customerEmail, this.plate = '', this.returnFlight, this.departureFlight, this.notes, this.externalReference, this.priceCents, this.force = false}): super._();
  factory _ReservationInput.fromJson(Map<String, dynamic> json) => _$ReservationInputFromJson(json);

@override@JsonKey() final  String channel;
@override final  String? channelDetail;
@override final  String arrivalAt;
@override final  String returnAt;
@override@JsonKey() final  int passengers;
@override@JsonKey() final  String customerName;
@override@JsonKey() final  String customerPhone;
@override final  String? customerEmail;
@override@JsonKey() final  String plate;
@override final  String? returnFlight;
@override final  String? departureFlight;
@override final  String? notes;
@override final  String? externalReference;
@override final  int? priceCents;
@override@JsonKey() final  bool force;

/// Create a copy of ReservationInput
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReservationInputCopyWith<_ReservationInput> get copyWith => __$ReservationInputCopyWithImpl<_ReservationInput>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReservationInputToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReservationInput&&(identical(other.channel, channel) || other.channel == channel)&&(identical(other.channelDetail, channelDetail) || other.channelDetail == channelDetail)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.customerPhone, customerPhone) || other.customerPhone == customerPhone)&&(identical(other.customerEmail, customerEmail) || other.customerEmail == customerEmail)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.departureFlight, departureFlight) || other.departureFlight == departureFlight)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.externalReference, externalReference) || other.externalReference == externalReference)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.force, force) || other.force == force));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,channel,channelDetail,arrivalAt,returnAt,passengers,customerName,customerPhone,customerEmail,plate,returnFlight,departureFlight,notes,externalReference,priceCents,force);
}

@override
String toString() {
    return 'ReservationInput(channel: $channel, channelDetail: $channelDetail, arrivalAt: $arrivalAt, returnAt: $returnAt, passengers: $passengers, customerName: $customerName, customerPhone: $customerPhone, customerEmail: $customerEmail, plate: $plate, returnFlight: $returnFlight, departureFlight: $departureFlight, notes: $notes, externalReference: $externalReference, priceCents: $priceCents, force: $force)';
}


}

/// @nodoc
abstract mixin class _$ReservationInputCopyWith<$Res> implements $ReservationInputCopyWith<$Res> {
  factory _$ReservationInputCopyWith(_ReservationInput value, $Res Function(_ReservationInput) _then) = __$ReservationInputCopyWithImpl;
@override @useResult
$Res call({
 String channel, String? channelDetail, String arrivalAt, String returnAt, int passengers, String customerName, String customerPhone, String? customerEmail, String plate, String? returnFlight, String? departureFlight, String? notes, String? externalReference, int? priceCents, bool force
});




}
/// @nodoc
class __$ReservationInputCopyWithImpl<$Res>
    implements _$ReservationInputCopyWith<$Res> {
  __$ReservationInputCopyWithImpl(this._self, this._then);

  final _ReservationInput _self;
  final $Res Function(_ReservationInput) _then;

/// Create a copy of ReservationInput
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? channel = null,Object? channelDetail = freezed,Object? arrivalAt = null,Object? returnAt = null,Object? passengers = null,Object? customerName = null,Object? customerPhone = null,Object? customerEmail = freezed,Object? plate = null,Object? returnFlight = freezed,Object? departureFlight = freezed,Object? notes = freezed,Object? externalReference = freezed,Object? priceCents = freezed,Object? force = null,}) {
  return _then(_ReservationInput(
channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,channelDetail: freezed == channelDetail ? _self.channelDetail : channelDetail // ignore: cast_nullable_to_non_nullable
as String?,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,customerPhone: null == customerPhone ? _self.customerPhone : customerPhone // ignore: cast_nullable_to_non_nullable
as String,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,departureFlight: freezed == departureFlight ? _self.departureFlight : departureFlight // ignore: cast_nullable_to_non_nullable
as String?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,externalReference: freezed == externalReference ? _self.externalReference : externalReference // ignore: cast_nullable_to_non_nullable
as String?,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,force: null == force ? _self.force : force // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
