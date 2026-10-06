// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'public_booking_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PublicBookingModel {

 String get reference; String get status;/// "online": paid by card in the app or on the site; "on_site": paid at the parking.
 String get paymentMode; BookingPaymentModel? get payment; BookingParkingModel get parking; String get arrivalAt; String get returnAt; String get customerName; String? get customerEmail; String get customerPhone; String get plate; String? get returnFlight;/// E (06/10/2026): the traveller's message for the parking, and their vehicle.
 String? get customerNote; BookingVehicleModel? get vehicle;/// Outbound flight (V-A) and, when tracked, when the shuttle to the terminal leaves (local).
 String? get departureFlight; OutboundFlightModel? get outbound;/// Where the car is parked (06/10/2026), recorded by the traveller or the valet; null until then.
 CarLocationModel? get car; int get passengers; int? get days; int? get priceCents; String get cancellationPolicy;/// Local datetime until which the traveller may cancel online; null when non-refundable.
 String? get cancellableUntil; bool get canCancel; bool get canEditFlight;
/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<PublicBookingModel> get copyWith => _$PublicBookingModelCopyWithImpl<PublicBookingModel>(this as PublicBookingModel, _$identity);

  /// Serializes this PublicBookingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PublicBookingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PublicBookingModel&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.paymentMode, _this.paymentMode) || other.paymentMode == _this.paymentMode)&&(identical(other.payment, _this.payment) || other.payment == _this.payment)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.customerEmail, _this.customerEmail) || other.customerEmail == _this.customerEmail)&&(identical(other.customerPhone, _this.customerPhone) || other.customerPhone == _this.customerPhone)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.customerNote, _this.customerNote) || other.customerNote == _this.customerNote)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.departureFlight, _this.departureFlight) || other.departureFlight == _this.departureFlight)&&(identical(other.outbound, _this.outbound) || other.outbound == _this.outbound)&&(identical(other.car, _this.car) || other.car == _this.car)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.cancellationPolicy, _this.cancellationPolicy) || other.cancellationPolicy == _this.cancellationPolicy)&&(identical(other.cancellableUntil, _this.cancellableUntil) || other.cancellableUntil == _this.cancellableUntil)&&(identical(other.canCancel, _this.canCancel) || other.canCancel == _this.canCancel)&&(identical(other.canEditFlight, _this.canEditFlight) || other.canEditFlight == _this.canEditFlight));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PublicBookingModel;
  return Object.hashAll([runtimeType,_this.reference,_this.status,_this.paymentMode,_this.payment,_this.parking,_this.arrivalAt,_this.returnAt,_this.customerName,_this.customerEmail,_this.customerPhone,_this.plate,_this.returnFlight,_this.customerNote,_this.vehicle,_this.departureFlight,_this.outbound,_this.car,_this.passengers,_this.days,_this.priceCents,_this.cancellationPolicy,_this.cancellableUntil,_this.canCancel,_this.canEditFlight]);
}

@override
String toString() {
  final _this = this as PublicBookingModel;
  return 'PublicBookingModel(reference: ${_this.reference}, status: ${_this.status}, paymentMode: ${_this.paymentMode}, payment: ${_this.payment}, parking: ${_this.parking}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, customerName: ${_this.customerName}, customerEmail: ${_this.customerEmail}, customerPhone: ${_this.customerPhone}, plate: ${_this.plate}, returnFlight: ${_this.returnFlight}, customerNote: ${_this.customerNote}, vehicle: ${_this.vehicle}, departureFlight: ${_this.departureFlight}, outbound: ${_this.outbound}, car: ${_this.car}, passengers: ${_this.passengers}, days: ${_this.days}, priceCents: ${_this.priceCents}, cancellationPolicy: ${_this.cancellationPolicy}, cancellableUntil: ${_this.cancellableUntil}, canCancel: ${_this.canCancel}, canEditFlight: ${_this.canEditFlight})';
}


}

/// @nodoc
abstract mixin class $PublicBookingModelCopyWith<$Res>  {
  factory $PublicBookingModelCopyWith(PublicBookingModel value, $Res Function(PublicBookingModel) _then) = _$PublicBookingModelCopyWithImpl;
@useResult
$Res call({
 String reference, String status, String paymentMode, BookingPaymentModel? payment, BookingParkingModel parking, String arrivalAt, String returnAt, String customerName, String? customerEmail, String customerPhone, String plate, String? returnFlight, String? customerNote, BookingVehicleModel? vehicle, String? departureFlight, OutboundFlightModel? outbound, CarLocationModel? car, int passengers, int? days, int? priceCents, String cancellationPolicy, String? cancellableUntil, bool canCancel, bool canEditFlight
});


$BookingPaymentModelCopyWith<$Res>? get payment;$BookingParkingModelCopyWith<$Res> get parking;$BookingVehicleModelCopyWith<$Res>? get vehicle;$OutboundFlightModelCopyWith<$Res>? get outbound;$CarLocationModelCopyWith<$Res>? get car;

}
/// @nodoc
class _$PublicBookingModelCopyWithImpl<$Res>
    implements $PublicBookingModelCopyWith<$Res> {
  _$PublicBookingModelCopyWithImpl(this._self, this._then);

  final PublicBookingModel _self;
  final $Res Function(PublicBookingModel) _then;

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? status = null,Object? paymentMode = null,Object? payment = freezed,Object? parking = null,Object? arrivalAt = null,Object? returnAt = null,Object? customerName = null,Object? customerEmail = freezed,Object? customerPhone = null,Object? plate = null,Object? returnFlight = freezed,Object? customerNote = freezed,Object? vehicle = freezed,Object? departureFlight = freezed,Object? outbound = freezed,Object? car = freezed,Object? passengers = null,Object? days = freezed,Object? priceCents = freezed,Object? cancellationPolicy = null,Object? cancellableUntil = freezed,Object? canCancel = null,Object? canEditFlight = null,}) {
  return _then(PublicBookingModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,paymentMode: null == paymentMode ? _self.paymentMode : paymentMode // ignore: cast_nullable_to_non_nullable
as String,payment: freezed == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as BookingPaymentModel?,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as BookingParkingModel,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,customerPhone: null == customerPhone ? _self.customerPhone : customerPhone // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,customerNote: freezed == customerNote ? _self.customerNote : customerNote // ignore: cast_nullable_to_non_nullable
as String?,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as BookingVehicleModel?,departureFlight: freezed == departureFlight ? _self.departureFlight : departureFlight // ignore: cast_nullable_to_non_nullable
as String?,outbound: freezed == outbound ? _self.outbound : outbound // ignore: cast_nullable_to_non_nullable
as OutboundFlightModel?,car: freezed == car ? _self.car : car // ignore: cast_nullable_to_non_nullable
as CarLocationModel?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,days: freezed == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int?,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,cancellationPolicy: null == cancellationPolicy ? _self.cancellationPolicy : cancellationPolicy // ignore: cast_nullable_to_non_nullable
as String,cancellableUntil: freezed == cancellableUntil ? _self.cancellableUntil : cancellableUntil // ignore: cast_nullable_to_non_nullable
as String?,canCancel: null == canCancel ? _self.canCancel : canCancel // ignore: cast_nullable_to_non_nullable
as bool,canEditFlight: null == canEditFlight ? _self.canEditFlight : canEditFlight // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingPaymentModelCopyWith<$Res>? get payment {
    if (_self.payment == null) {
    return null;
  }

  return $BookingPaymentModelCopyWith<$Res>(_self.payment!, (value) {
    return _then(_self.copyWith(payment: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingParkingModelCopyWith<$Res> get parking {
  
  return $BookingParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingVehicleModelCopyWith<$Res>? get vehicle {
    if (_self.vehicle == null) {
    return null;
  }

  return $BookingVehicleModelCopyWith<$Res>(_self.vehicle!, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OutboundFlightModelCopyWith<$Res>? get outbound {
    if (_self.outbound == null) {
    return null;
  }

  return $OutboundFlightModelCopyWith<$Res>(_self.outbound!, (value) {
    return _then(_self.copyWith(outbound: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CarLocationModelCopyWith<$Res>? get car {
    if (_self.car == null) {
    return null;
  }

  return $CarLocationModelCopyWith<$Res>(_self.car!, (value) {
    return _then(_self.copyWith(car: value));
  });
}
}


/// Adds pattern-matching-related methods to [PublicBookingModel].
extension PublicBookingModelPatterns on PublicBookingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PublicBookingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PublicBookingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PublicBookingModel value)  $default,){
final _that = this;
switch (_that) {
case _PublicBookingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PublicBookingModel value)?  $default,){
final _that = this;
switch (_that) {
case _PublicBookingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  String status,  String paymentMode,  BookingPaymentModel? payment,  BookingParkingModel parking,  String arrivalAt,  String returnAt,  String customerName,  String? customerEmail,  String customerPhone,  String plate,  String? returnFlight,  String? customerNote,  BookingVehicleModel? vehicle,  String? departureFlight,  OutboundFlightModel? outbound,  CarLocationModel? car,  int passengers,  int? days,  int? priceCents,  String cancellationPolicy,  String? cancellableUntil,  bool canCancel,  bool canEditFlight)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PublicBookingModel() when $default != null:
return $default(_that.reference,_that.status,_that.paymentMode,_that.payment,_that.parking,_that.arrivalAt,_that.returnAt,_that.customerName,_that.customerEmail,_that.customerPhone,_that.plate,_that.returnFlight,_that.customerNote,_that.vehicle,_that.departureFlight,_that.outbound,_that.car,_that.passengers,_that.days,_that.priceCents,_that.cancellationPolicy,_that.cancellableUntil,_that.canCancel,_that.canEditFlight);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  String status,  String paymentMode,  BookingPaymentModel? payment,  BookingParkingModel parking,  String arrivalAt,  String returnAt,  String customerName,  String? customerEmail,  String customerPhone,  String plate,  String? returnFlight,  String? customerNote,  BookingVehicleModel? vehicle,  String? departureFlight,  OutboundFlightModel? outbound,  CarLocationModel? car,  int passengers,  int? days,  int? priceCents,  String cancellationPolicy,  String? cancellableUntil,  bool canCancel,  bool canEditFlight)  $default,) {final _that = this;
switch (_that) {
case _PublicBookingModel():
return $default(_that.reference,_that.status,_that.paymentMode,_that.payment,_that.parking,_that.arrivalAt,_that.returnAt,_that.customerName,_that.customerEmail,_that.customerPhone,_that.plate,_that.returnFlight,_that.customerNote,_that.vehicle,_that.departureFlight,_that.outbound,_that.car,_that.passengers,_that.days,_that.priceCents,_that.cancellationPolicy,_that.cancellableUntil,_that.canCancel,_that.canEditFlight);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  String status,  String paymentMode,  BookingPaymentModel? payment,  BookingParkingModel parking,  String arrivalAt,  String returnAt,  String customerName,  String? customerEmail,  String customerPhone,  String plate,  String? returnFlight,  String? customerNote,  BookingVehicleModel? vehicle,  String? departureFlight,  OutboundFlightModel? outbound,  CarLocationModel? car,  int passengers,  int? days,  int? priceCents,  String cancellationPolicy,  String? cancellableUntil,  bool canCancel,  bool canEditFlight)?  $default,) {final _that = this;
switch (_that) {
case _PublicBookingModel() when $default != null:
return $default(_that.reference,_that.status,_that.paymentMode,_that.payment,_that.parking,_that.arrivalAt,_that.returnAt,_that.customerName,_that.customerEmail,_that.customerPhone,_that.plate,_that.returnFlight,_that.customerNote,_that.vehicle,_that.departureFlight,_that.outbound,_that.car,_that.passengers,_that.days,_that.priceCents,_that.cancellationPolicy,_that.cancellableUntil,_that.canCancel,_that.canEditFlight);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PublicBookingModel extends PublicBookingModel {
  const _PublicBookingModel({required this.reference, required this.status, this.paymentMode = 'online', this.payment, required this.parking, required this.arrivalAt, required this.returnAt, required this.customerName, this.customerEmail, this.customerPhone = '', required this.plate, this.returnFlight, this.customerNote, this.vehicle, this.departureFlight, this.outbound, this.car, required this.passengers, this.days, this.priceCents, this.cancellationPolicy = 'non_refundable', this.cancellableUntil, this.canCancel = false, this.canEditFlight = false}): super._();
  factory _PublicBookingModel.fromJson(Map<String, dynamic> json) => _$PublicBookingModelFromJson(json);

@override final  String reference;
@override final  String status;
/// "online": paid by card in the app or on the site; "on_site": paid at the parking.
@override@JsonKey() final  String paymentMode;
@override final  BookingPaymentModel? payment;
@override final  BookingParkingModel parking;
@override final  String arrivalAt;
@override final  String returnAt;
@override final  String customerName;
@override final  String? customerEmail;
@override@JsonKey() final  String customerPhone;
@override final  String plate;
@override final  String? returnFlight;
/// E (06/10/2026): the traveller's message for the parking, and their vehicle.
@override final  String? customerNote;
@override final  BookingVehicleModel? vehicle;
/// Outbound flight (V-A) and, when tracked, when the shuttle to the terminal leaves (local).
@override final  String? departureFlight;
@override final  OutboundFlightModel? outbound;
/// Where the car is parked (06/10/2026), recorded by the traveller or the valet; null until then.
@override final  CarLocationModel? car;
@override final  int passengers;
@override final  int? days;
@override final  int? priceCents;
@override@JsonKey() final  String cancellationPolicy;
/// Local datetime until which the traveller may cancel online; null when non-refundable.
@override final  String? cancellableUntil;
@override@JsonKey() final  bool canCancel;
@override@JsonKey() final  bool canEditFlight;

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PublicBookingModelCopyWith<_PublicBookingModel> get copyWith => __$PublicBookingModelCopyWithImpl<_PublicBookingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PublicBookingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PublicBookingModel&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentMode, paymentMode) || other.paymentMode == paymentMode)&&(identical(other.payment, payment) || other.payment == payment)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.customerEmail, customerEmail) || other.customerEmail == customerEmail)&&(identical(other.customerPhone, customerPhone) || other.customerPhone == customerPhone)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.customerNote, customerNote) || other.customerNote == customerNote)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.departureFlight, departureFlight) || other.departureFlight == departureFlight)&&(identical(other.outbound, outbound) || other.outbound == outbound)&&(identical(other.car, car) || other.car == car)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.days, days) || other.days == days)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.cancellationPolicy, cancellationPolicy) || other.cancellationPolicy == cancellationPolicy)&&(identical(other.cancellableUntil, cancellableUntil) || other.cancellableUntil == cancellableUntil)&&(identical(other.canCancel, canCancel) || other.canCancel == canCancel)&&(identical(other.canEditFlight, canEditFlight) || other.canEditFlight == canEditFlight));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,reference,status,paymentMode,payment,parking,arrivalAt,returnAt,customerName,customerEmail,customerPhone,plate,returnFlight,customerNote,vehicle,departureFlight,outbound,car,passengers,days,priceCents,cancellationPolicy,cancellableUntil,canCancel,canEditFlight]);
}

@override
String toString() {
    return 'PublicBookingModel(reference: $reference, status: $status, paymentMode: $paymentMode, payment: $payment, parking: $parking, arrivalAt: $arrivalAt, returnAt: $returnAt, customerName: $customerName, customerEmail: $customerEmail, customerPhone: $customerPhone, plate: $plate, returnFlight: $returnFlight, customerNote: $customerNote, vehicle: $vehicle, departureFlight: $departureFlight, outbound: $outbound, car: $car, passengers: $passengers, days: $days, priceCents: $priceCents, cancellationPolicy: $cancellationPolicy, cancellableUntil: $cancellableUntil, canCancel: $canCancel, canEditFlight: $canEditFlight)';
}


}

/// @nodoc
abstract mixin class _$PublicBookingModelCopyWith<$Res> implements $PublicBookingModelCopyWith<$Res> {
  factory _$PublicBookingModelCopyWith(_PublicBookingModel value, $Res Function(_PublicBookingModel) _then) = __$PublicBookingModelCopyWithImpl;
@override @useResult
$Res call({
 String reference, String status, String paymentMode, BookingPaymentModel? payment, BookingParkingModel parking, String arrivalAt, String returnAt, String customerName, String? customerEmail, String customerPhone, String plate, String? returnFlight, String? customerNote, BookingVehicleModel? vehicle, String? departureFlight, OutboundFlightModel? outbound, CarLocationModel? car, int passengers, int? days, int? priceCents, String cancellationPolicy, String? cancellableUntil, bool canCancel, bool canEditFlight
});


@override $BookingPaymentModelCopyWith<$Res>? get payment;@override $BookingParkingModelCopyWith<$Res> get parking;@override $BookingVehicleModelCopyWith<$Res>? get vehicle;@override $OutboundFlightModelCopyWith<$Res>? get outbound;@override $CarLocationModelCopyWith<$Res>? get car;

}
/// @nodoc
class __$PublicBookingModelCopyWithImpl<$Res>
    implements _$PublicBookingModelCopyWith<$Res> {
  __$PublicBookingModelCopyWithImpl(this._self, this._then);

  final _PublicBookingModel _self;
  final $Res Function(_PublicBookingModel) _then;

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? status = null,Object? paymentMode = null,Object? payment = freezed,Object? parking = null,Object? arrivalAt = null,Object? returnAt = null,Object? customerName = null,Object? customerEmail = freezed,Object? customerPhone = null,Object? plate = null,Object? returnFlight = freezed,Object? customerNote = freezed,Object? vehicle = freezed,Object? departureFlight = freezed,Object? outbound = freezed,Object? car = freezed,Object? passengers = null,Object? days = freezed,Object? priceCents = freezed,Object? cancellationPolicy = null,Object? cancellableUntil = freezed,Object? canCancel = null,Object? canEditFlight = null,}) {
  return _then(_PublicBookingModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,paymentMode: null == paymentMode ? _self.paymentMode : paymentMode // ignore: cast_nullable_to_non_nullable
as String,payment: freezed == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as BookingPaymentModel?,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as BookingParkingModel,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,customerEmail: freezed == customerEmail ? _self.customerEmail : customerEmail // ignore: cast_nullable_to_non_nullable
as String?,customerPhone: null == customerPhone ? _self.customerPhone : customerPhone // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,customerNote: freezed == customerNote ? _self.customerNote : customerNote // ignore: cast_nullable_to_non_nullable
as String?,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as BookingVehicleModel?,departureFlight: freezed == departureFlight ? _self.departureFlight : departureFlight // ignore: cast_nullable_to_non_nullable
as String?,outbound: freezed == outbound ? _self.outbound : outbound // ignore: cast_nullable_to_non_nullable
as OutboundFlightModel?,car: freezed == car ? _self.car : car // ignore: cast_nullable_to_non_nullable
as CarLocationModel?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,days: freezed == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int?,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,cancellationPolicy: null == cancellationPolicy ? _self.cancellationPolicy : cancellationPolicy // ignore: cast_nullable_to_non_nullable
as String,cancellableUntil: freezed == cancellableUntil ? _self.cancellableUntil : cancellableUntil // ignore: cast_nullable_to_non_nullable
as String?,canCancel: null == canCancel ? _self.canCancel : canCancel // ignore: cast_nullable_to_non_nullable
as bool,canEditFlight: null == canEditFlight ? _self.canEditFlight : canEditFlight // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingPaymentModelCopyWith<$Res>? get payment {
    if (_self.payment == null) {
    return null;
  }

  return $BookingPaymentModelCopyWith<$Res>(_self.payment!, (value) {
    return _then(_self.copyWith(payment: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingParkingModelCopyWith<$Res> get parking {
  
  return $BookingParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingVehicleModelCopyWith<$Res>? get vehicle {
    if (_self.vehicle == null) {
    return null;
  }

  return $BookingVehicleModelCopyWith<$Res>(_self.vehicle!, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OutboundFlightModelCopyWith<$Res>? get outbound {
    if (_self.outbound == null) {
    return null;
  }

  return $OutboundFlightModelCopyWith<$Res>(_self.outbound!, (value) {
    return _then(_self.copyWith(outbound: value));
  });
}/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CarLocationModelCopyWith<$Res>? get car {
    if (_self.car == null) {
    return null;
  }

  return $CarLocationModelCopyWith<$Res>(_self.car!, (value) {
    return _then(_self.copyWith(car: value));
  });
}
}


/// @nodoc
mixin _$BookingPaymentModel {

/// pending, paid, expired, refunded.
 String get status; String? get holdExpiresAt; int? get holdSecondsLeft;
/// Create a copy of BookingPaymentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingPaymentModelCopyWith<BookingPaymentModel> get copyWith => _$BookingPaymentModelCopyWithImpl<BookingPaymentModel>(this as BookingPaymentModel, _$identity);

  /// Serializes this BookingPaymentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as BookingPaymentModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingPaymentModel&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.holdExpiresAt, _this.holdExpiresAt) || other.holdExpiresAt == _this.holdExpiresAt)&&(identical(other.holdSecondsLeft, _this.holdSecondsLeft) || other.holdSecondsLeft == _this.holdSecondsLeft));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BookingPaymentModel;
  return Object.hash(runtimeType,_this.status,_this.holdExpiresAt,_this.holdSecondsLeft);
}

@override
String toString() {
  final _this = this as BookingPaymentModel;
  return 'BookingPaymentModel(status: ${_this.status}, holdExpiresAt: ${_this.holdExpiresAt}, holdSecondsLeft: ${_this.holdSecondsLeft})';
}


}

/// @nodoc
abstract mixin class $BookingPaymentModelCopyWith<$Res>  {
  factory $BookingPaymentModelCopyWith(BookingPaymentModel value, $Res Function(BookingPaymentModel) _then) = _$BookingPaymentModelCopyWithImpl;
@useResult
$Res call({
 String status, String? holdExpiresAt, int? holdSecondsLeft
});




}
/// @nodoc
class _$BookingPaymentModelCopyWithImpl<$Res>
    implements $BookingPaymentModelCopyWith<$Res> {
  _$BookingPaymentModelCopyWithImpl(this._self, this._then);

  final BookingPaymentModel _self;
  final $Res Function(BookingPaymentModel) _then;

/// Create a copy of BookingPaymentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = null,Object? holdExpiresAt = freezed,Object? holdSecondsLeft = freezed,}) {
  return _then(BookingPaymentModel(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,holdExpiresAt: freezed == holdExpiresAt ? _self.holdExpiresAt : holdExpiresAt // ignore: cast_nullable_to_non_nullable
as String?,holdSecondsLeft: freezed == holdSecondsLeft ? _self.holdSecondsLeft : holdSecondsLeft // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [BookingPaymentModel].
extension BookingPaymentModelPatterns on BookingPaymentModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingPaymentModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingPaymentModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingPaymentModel value)  $default,){
final _that = this;
switch (_that) {
case _BookingPaymentModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingPaymentModel value)?  $default,){
final _that = this;
switch (_that) {
case _BookingPaymentModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String status,  String? holdExpiresAt,  int? holdSecondsLeft)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingPaymentModel() when $default != null:
return $default(_that.status,_that.holdExpiresAt,_that.holdSecondsLeft);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String status,  String? holdExpiresAt,  int? holdSecondsLeft)  $default,) {final _that = this;
switch (_that) {
case _BookingPaymentModel():
return $default(_that.status,_that.holdExpiresAt,_that.holdSecondsLeft);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String status,  String? holdExpiresAt,  int? holdSecondsLeft)?  $default,) {final _that = this;
switch (_that) {
case _BookingPaymentModel() when $default != null:
return $default(_that.status,_that.holdExpiresAt,_that.holdSecondsLeft);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingPaymentModel implements BookingPaymentModel {
  const _BookingPaymentModel({required this.status, this.holdExpiresAt, this.holdSecondsLeft});
  factory _BookingPaymentModel.fromJson(Map<String, dynamic> json) => _$BookingPaymentModelFromJson(json);

/// pending, paid, expired, refunded.
@override final  String status;
@override final  String? holdExpiresAt;
@override final  int? holdSecondsLeft;

/// Create a copy of BookingPaymentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingPaymentModelCopyWith<_BookingPaymentModel> get copyWith => __$BookingPaymentModelCopyWithImpl<_BookingPaymentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BookingPaymentModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingPaymentModel&&(identical(other.status, status) || other.status == status)&&(identical(other.holdExpiresAt, holdExpiresAt) || other.holdExpiresAt == holdExpiresAt)&&(identical(other.holdSecondsLeft, holdSecondsLeft) || other.holdSecondsLeft == holdSecondsLeft));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,status,holdExpiresAt,holdSecondsLeft);
}

@override
String toString() {
    return 'BookingPaymentModel(status: $status, holdExpiresAt: $holdExpiresAt, holdSecondsLeft: $holdSecondsLeft)';
}


}

/// @nodoc
abstract mixin class _$BookingPaymentModelCopyWith<$Res> implements $BookingPaymentModelCopyWith<$Res> {
  factory _$BookingPaymentModelCopyWith(_BookingPaymentModel value, $Res Function(_BookingPaymentModel) _then) = __$BookingPaymentModelCopyWithImpl;
@override @useResult
$Res call({
 String status, String? holdExpiresAt, int? holdSecondsLeft
});




}
/// @nodoc
class __$BookingPaymentModelCopyWithImpl<$Res>
    implements _$BookingPaymentModelCopyWith<$Res> {
  __$BookingPaymentModelCopyWithImpl(this._self, this._then);

  final _BookingPaymentModel _self;
  final $Res Function(_BookingPaymentModel) _then;

/// Create a copy of BookingPaymentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = null,Object? holdExpiresAt = freezed,Object? holdSecondsLeft = freezed,}) {
  return _then(_BookingPaymentModel(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,holdExpiresAt: freezed == holdExpiresAt ? _self.holdExpiresAt : holdExpiresAt // ignore: cast_nullable_to_non_nullable
as String?,holdSecondsLeft: freezed == holdSecondsLeft ? _self.holdSecondsLeft : holdSecondsLeft // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$BookingParkingModel {

 String get title; String? get slug; String? get address; int? get shuttleMinutes; String? get openingHours; String? get phone; BookingAirportModel? get airport;
/// Create a copy of BookingParkingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingParkingModelCopyWith<BookingParkingModel> get copyWith => _$BookingParkingModelCopyWithImpl<BookingParkingModel>(this as BookingParkingModel, _$identity);

  /// Serializes this BookingParkingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as BookingParkingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingParkingModel&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.slug, _this.slug) || other.slug == _this.slug)&&(identical(other.address, _this.address) || other.address == _this.address)&&(identical(other.shuttleMinutes, _this.shuttleMinutes) || other.shuttleMinutes == _this.shuttleMinutes)&&(identical(other.openingHours, _this.openingHours) || other.openingHours == _this.openingHours)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.airport, _this.airport) || other.airport == _this.airport));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BookingParkingModel;
  return Object.hash(runtimeType,_this.title,_this.slug,_this.address,_this.shuttleMinutes,_this.openingHours,_this.phone,_this.airport);
}

@override
String toString() {
  final _this = this as BookingParkingModel;
  return 'BookingParkingModel(title: ${_this.title}, slug: ${_this.slug}, address: ${_this.address}, shuttleMinutes: ${_this.shuttleMinutes}, openingHours: ${_this.openingHours}, phone: ${_this.phone}, airport: ${_this.airport})';
}


}

/// @nodoc
abstract mixin class $BookingParkingModelCopyWith<$Res>  {
  factory $BookingParkingModelCopyWith(BookingParkingModel value, $Res Function(BookingParkingModel) _then) = _$BookingParkingModelCopyWithImpl;
@useResult
$Res call({
 String title, String? slug, String? address, int? shuttleMinutes, String? openingHours, String? phone, BookingAirportModel? airport
});


$BookingAirportModelCopyWith<$Res>? get airport;

}
/// @nodoc
class _$BookingParkingModelCopyWithImpl<$Res>
    implements $BookingParkingModelCopyWith<$Res> {
  _$BookingParkingModelCopyWithImpl(this._self, this._then);

  final BookingParkingModel _self;
  final $Res Function(BookingParkingModel) _then;

/// Create a copy of BookingParkingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? slug = freezed,Object? address = freezed,Object? shuttleMinutes = freezed,Object? openingHours = freezed,Object? phone = freezed,Object? airport = freezed,}) {
  return _then(BookingParkingModel(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,slug: freezed == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,airport: freezed == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as BookingAirportModel?,
  ));
}
/// Create a copy of BookingParkingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingAirportModelCopyWith<$Res>? get airport {
    if (_self.airport == null) {
    return null;
  }

  return $BookingAirportModelCopyWith<$Res>(_self.airport!, (value) {
    return _then(_self.copyWith(airport: value));
  });
}
}


/// Adds pattern-matching-related methods to [BookingParkingModel].
extension BookingParkingModelPatterns on BookingParkingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingParkingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingParkingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingParkingModel value)  $default,){
final _that = this;
switch (_that) {
case _BookingParkingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingParkingModel value)?  $default,){
final _that = this;
switch (_that) {
case _BookingParkingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  String? slug,  String? address,  int? shuttleMinutes,  String? openingHours,  String? phone,  BookingAirportModel? airport)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingParkingModel() when $default != null:
return $default(_that.title,_that.slug,_that.address,_that.shuttleMinutes,_that.openingHours,_that.phone,_that.airport);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  String? slug,  String? address,  int? shuttleMinutes,  String? openingHours,  String? phone,  BookingAirportModel? airport)  $default,) {final _that = this;
switch (_that) {
case _BookingParkingModel():
return $default(_that.title,_that.slug,_that.address,_that.shuttleMinutes,_that.openingHours,_that.phone,_that.airport);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  String? slug,  String? address,  int? shuttleMinutes,  String? openingHours,  String? phone,  BookingAirportModel? airport)?  $default,) {final _that = this;
switch (_that) {
case _BookingParkingModel() when $default != null:
return $default(_that.title,_that.slug,_that.address,_that.shuttleMinutes,_that.openingHours,_that.phone,_that.airport);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingParkingModel implements BookingParkingModel {
  const _BookingParkingModel({required this.title, this.slug, this.address, this.shuttleMinutes, this.openingHours, this.phone, this.airport});
  factory _BookingParkingModel.fromJson(Map<String, dynamic> json) => _$BookingParkingModelFromJson(json);

@override final  String title;
@override final  String? slug;
@override final  String? address;
@override final  int? shuttleMinutes;
@override final  String? openingHours;
@override final  String? phone;
@override final  BookingAirportModel? airport;

/// Create a copy of BookingParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingParkingModelCopyWith<_BookingParkingModel> get copyWith => __$BookingParkingModelCopyWithImpl<_BookingParkingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BookingParkingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingParkingModel&&(identical(other.title, title) || other.title == title)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.address, address) || other.address == address)&&(identical(other.shuttleMinutes, shuttleMinutes) || other.shuttleMinutes == shuttleMinutes)&&(identical(other.openingHours, openingHours) || other.openingHours == openingHours)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.airport, airport) || other.airport == airport));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,title,slug,address,shuttleMinutes,openingHours,phone,airport);
}

@override
String toString() {
    return 'BookingParkingModel(title: $title, slug: $slug, address: $address, shuttleMinutes: $shuttleMinutes, openingHours: $openingHours, phone: $phone, airport: $airport)';
}


}

/// @nodoc
abstract mixin class _$BookingParkingModelCopyWith<$Res> implements $BookingParkingModelCopyWith<$Res> {
  factory _$BookingParkingModelCopyWith(_BookingParkingModel value, $Res Function(_BookingParkingModel) _then) = __$BookingParkingModelCopyWithImpl;
@override @useResult
$Res call({
 String title, String? slug, String? address, int? shuttleMinutes, String? openingHours, String? phone, BookingAirportModel? airport
});


@override $BookingAirportModelCopyWith<$Res>? get airport;

}
/// @nodoc
class __$BookingParkingModelCopyWithImpl<$Res>
    implements _$BookingParkingModelCopyWith<$Res> {
  __$BookingParkingModelCopyWithImpl(this._self, this._then);

  final _BookingParkingModel _self;
  final $Res Function(_BookingParkingModel) _then;

/// Create a copy of BookingParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? slug = freezed,Object? address = freezed,Object? shuttleMinutes = freezed,Object? openingHours = freezed,Object? phone = freezed,Object? airport = freezed,}) {
  return _then(_BookingParkingModel(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,slug: freezed == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,airport: freezed == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as BookingAirportModel?,
  ));
}

/// Create a copy of BookingParkingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingAirportModelCopyWith<$Res>? get airport {
    if (_self.airport == null) {
    return null;
  }

  return $BookingAirportModelCopyWith<$Res>(_self.airport!, (value) {
    return _then(_self.copyWith(airport: value));
  });
}
}


/// @nodoc
mixin _$BookingAirportModel {

 String get slug; String get name;
/// Create a copy of BookingAirportModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingAirportModelCopyWith<BookingAirportModel> get copyWith => _$BookingAirportModelCopyWithImpl<BookingAirportModel>(this as BookingAirportModel, _$identity);

  /// Serializes this BookingAirportModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as BookingAirportModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingAirportModel&&(identical(other.slug, _this.slug) || other.slug == _this.slug)&&(identical(other.name, _this.name) || other.name == _this.name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BookingAirportModel;
  return Object.hash(runtimeType,_this.slug,_this.name);
}

@override
String toString() {
  final _this = this as BookingAirportModel;
  return 'BookingAirportModel(slug: ${_this.slug}, name: ${_this.name})';
}


}

/// @nodoc
abstract mixin class $BookingAirportModelCopyWith<$Res>  {
  factory $BookingAirportModelCopyWith(BookingAirportModel value, $Res Function(BookingAirportModel) _then) = _$BookingAirportModelCopyWithImpl;
@useResult
$Res call({
 String slug, String name
});




}
/// @nodoc
class _$BookingAirportModelCopyWithImpl<$Res>
    implements $BookingAirportModelCopyWith<$Res> {
  _$BookingAirportModelCopyWithImpl(this._self, this._then);

  final BookingAirportModel _self;
  final $Res Function(BookingAirportModel) _then;

/// Create a copy of BookingAirportModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? slug = null,Object? name = null,}) {
  return _then(BookingAirportModel(
slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [BookingAirportModel].
extension BookingAirportModelPatterns on BookingAirportModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingAirportModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingAirportModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingAirportModel value)  $default,){
final _that = this;
switch (_that) {
case _BookingAirportModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingAirportModel value)?  $default,){
final _that = this;
switch (_that) {
case _BookingAirportModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String slug,  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingAirportModel() when $default != null:
return $default(_that.slug,_that.name);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String slug,  String name)  $default,) {final _that = this;
switch (_that) {
case _BookingAirportModel():
return $default(_that.slug,_that.name);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String slug,  String name)?  $default,) {final _that = this;
switch (_that) {
case _BookingAirportModel() when $default != null:
return $default(_that.slug,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingAirportModel implements BookingAirportModel {
  const _BookingAirportModel({required this.slug, required this.name});
  factory _BookingAirportModel.fromJson(Map<String, dynamic> json) => _$BookingAirportModelFromJson(json);

@override final  String slug;
@override final  String name;

/// Create a copy of BookingAirportModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingAirportModelCopyWith<_BookingAirportModel> get copyWith => __$BookingAirportModelCopyWithImpl<_BookingAirportModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BookingAirportModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingAirportModel&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,slug,name);
}

@override
String toString() {
    return 'BookingAirportModel(slug: $slug, name: $name)';
}


}

/// @nodoc
abstract mixin class _$BookingAirportModelCopyWith<$Res> implements $BookingAirportModelCopyWith<$Res> {
  factory _$BookingAirportModelCopyWith(_BookingAirportModel value, $Res Function(_BookingAirportModel) _then) = __$BookingAirportModelCopyWithImpl;
@override @useResult
$Res call({
 String slug, String name
});




}
/// @nodoc
class __$BookingAirportModelCopyWithImpl<$Res>
    implements _$BookingAirportModelCopyWith<$Res> {
  __$BookingAirportModelCopyWithImpl(this._self, this._then);

  final _BookingAirportModel _self;
  final $Res Function(_BookingAirportModel) _then;

/// Create a copy of BookingAirportModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? slug = null,Object? name = null,}) {
  return _then(_BookingAirportModel(
slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$BookingAccessModel {

 String get reference; String get manageToken;
/// Create a copy of BookingAccessModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingAccessModelCopyWith<BookingAccessModel> get copyWith => _$BookingAccessModelCopyWithImpl<BookingAccessModel>(this as BookingAccessModel, _$identity);

  /// Serializes this BookingAccessModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as BookingAccessModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingAccessModel&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.manageToken, _this.manageToken) || other.manageToken == _this.manageToken));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BookingAccessModel;
  return Object.hash(runtimeType,_this.reference,_this.manageToken);
}

@override
String toString() {
  final _this = this as BookingAccessModel;
  return 'BookingAccessModel(reference: ${_this.reference}, manageToken: ${_this.manageToken})';
}


}

/// @nodoc
abstract mixin class $BookingAccessModelCopyWith<$Res>  {
  factory $BookingAccessModelCopyWith(BookingAccessModel value, $Res Function(BookingAccessModel) _then) = _$BookingAccessModelCopyWithImpl;
@useResult
$Res call({
 String reference, String manageToken
});




}
/// @nodoc
class _$BookingAccessModelCopyWithImpl<$Res>
    implements $BookingAccessModelCopyWith<$Res> {
  _$BookingAccessModelCopyWithImpl(this._self, this._then);

  final BookingAccessModel _self;
  final $Res Function(BookingAccessModel) _then;

/// Create a copy of BookingAccessModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? manageToken = null,}) {
  return _then(BookingAccessModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,manageToken: null == manageToken ? _self.manageToken : manageToken // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [BookingAccessModel].
extension BookingAccessModelPatterns on BookingAccessModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingAccessModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingAccessModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingAccessModel value)  $default,){
final _that = this;
switch (_that) {
case _BookingAccessModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingAccessModel value)?  $default,){
final _that = this;
switch (_that) {
case _BookingAccessModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  String manageToken)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingAccessModel() when $default != null:
return $default(_that.reference,_that.manageToken);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  String manageToken)  $default,) {final _that = this;
switch (_that) {
case _BookingAccessModel():
return $default(_that.reference,_that.manageToken);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  String manageToken)?  $default,) {final _that = this;
switch (_that) {
case _BookingAccessModel() when $default != null:
return $default(_that.reference,_that.manageToken);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingAccessModel implements BookingAccessModel {
  const _BookingAccessModel({required this.reference, required this.manageToken});
  factory _BookingAccessModel.fromJson(Map<String, dynamic> json) => _$BookingAccessModelFromJson(json);

@override final  String reference;
@override final  String manageToken;

/// Create a copy of BookingAccessModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingAccessModelCopyWith<_BookingAccessModel> get copyWith => __$BookingAccessModelCopyWithImpl<_BookingAccessModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BookingAccessModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingAccessModel&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.manageToken, manageToken) || other.manageToken == manageToken));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reference,manageToken);
}

@override
String toString() {
    return 'BookingAccessModel(reference: $reference, manageToken: $manageToken)';
}


}

/// @nodoc
abstract mixin class _$BookingAccessModelCopyWith<$Res> implements $BookingAccessModelCopyWith<$Res> {
  factory _$BookingAccessModelCopyWith(_BookingAccessModel value, $Res Function(_BookingAccessModel) _then) = __$BookingAccessModelCopyWithImpl;
@override @useResult
$Res call({
 String reference, String manageToken
});




}
/// @nodoc
class __$BookingAccessModelCopyWithImpl<$Res>
    implements _$BookingAccessModelCopyWith<$Res> {
  __$BookingAccessModelCopyWithImpl(this._self, this._then);

  final _BookingAccessModel _self;
  final $Res Function(_BookingAccessModel) _then;

/// Create a copy of BookingAccessModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? manageToken = null,}) {
  return _then(_BookingAccessModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,manageToken: null == manageToken ? _self.manageToken : manageToken // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$CreatedBookingModel {

 String get reference; String get manageToken; PublicBookingModel get booking;
/// Create a copy of CreatedBookingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CreatedBookingModelCopyWith<CreatedBookingModel> get copyWith => _$CreatedBookingModelCopyWithImpl<CreatedBookingModel>(this as CreatedBookingModel, _$identity);

  /// Serializes this CreatedBookingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as CreatedBookingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CreatedBookingModel&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.manageToken, _this.manageToken) || other.manageToken == _this.manageToken)&&(identical(other.booking, _this.booking) || other.booking == _this.booking));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as CreatedBookingModel;
  return Object.hash(runtimeType,_this.reference,_this.manageToken,_this.booking);
}

@override
String toString() {
  final _this = this as CreatedBookingModel;
  return 'CreatedBookingModel(reference: ${_this.reference}, manageToken: ${_this.manageToken}, booking: ${_this.booking})';
}


}

/// @nodoc
abstract mixin class $CreatedBookingModelCopyWith<$Res>  {
  factory $CreatedBookingModelCopyWith(CreatedBookingModel value, $Res Function(CreatedBookingModel) _then) = _$CreatedBookingModelCopyWithImpl;
@useResult
$Res call({
 String reference, String manageToken, PublicBookingModel booking
});


$PublicBookingModelCopyWith<$Res> get booking;

}
/// @nodoc
class _$CreatedBookingModelCopyWithImpl<$Res>
    implements $CreatedBookingModelCopyWith<$Res> {
  _$CreatedBookingModelCopyWithImpl(this._self, this._then);

  final CreatedBookingModel _self;
  final $Res Function(CreatedBookingModel) _then;

/// Create a copy of CreatedBookingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? manageToken = null,Object? booking = null,}) {
  return _then(CreatedBookingModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,manageToken: null == manageToken ? _self.manageToken : manageToken // ignore: cast_nullable_to_non_nullable
as String,booking: null == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel,
  ));
}
/// Create a copy of CreatedBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<$Res> get booking {
  
  return $PublicBookingModelCopyWith<$Res>(_self.booking, (value) {
    return _then(_self.copyWith(booking: value));
  });
}
}


/// Adds pattern-matching-related methods to [CreatedBookingModel].
extension CreatedBookingModelPatterns on CreatedBookingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CreatedBookingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CreatedBookingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CreatedBookingModel value)  $default,){
final _that = this;
switch (_that) {
case _CreatedBookingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CreatedBookingModel value)?  $default,){
final _that = this;
switch (_that) {
case _CreatedBookingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  String manageToken,  PublicBookingModel booking)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CreatedBookingModel() when $default != null:
return $default(_that.reference,_that.manageToken,_that.booking);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  String manageToken,  PublicBookingModel booking)  $default,) {final _that = this;
switch (_that) {
case _CreatedBookingModel():
return $default(_that.reference,_that.manageToken,_that.booking);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  String manageToken,  PublicBookingModel booking)?  $default,) {final _that = this;
switch (_that) {
case _CreatedBookingModel() when $default != null:
return $default(_that.reference,_that.manageToken,_that.booking);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CreatedBookingModel implements CreatedBookingModel {
  const _CreatedBookingModel({required this.reference, required this.manageToken, required this.booking});
  factory _CreatedBookingModel.fromJson(Map<String, dynamic> json) => _$CreatedBookingModelFromJson(json);

@override final  String reference;
@override final  String manageToken;
@override final  PublicBookingModel booking;

/// Create a copy of CreatedBookingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CreatedBookingModelCopyWith<_CreatedBookingModel> get copyWith => __$CreatedBookingModelCopyWithImpl<_CreatedBookingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CreatedBookingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CreatedBookingModel&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.manageToken, manageToken) || other.manageToken == manageToken)&&(identical(other.booking, booking) || other.booking == booking));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reference,manageToken,booking);
}

@override
String toString() {
    return 'CreatedBookingModel(reference: $reference, manageToken: $manageToken, booking: $booking)';
}


}

/// @nodoc
abstract mixin class _$CreatedBookingModelCopyWith<$Res> implements $CreatedBookingModelCopyWith<$Res> {
  factory _$CreatedBookingModelCopyWith(_CreatedBookingModel value, $Res Function(_CreatedBookingModel) _then) = __$CreatedBookingModelCopyWithImpl;
@override @useResult
$Res call({
 String reference, String manageToken, PublicBookingModel booking
});


@override $PublicBookingModelCopyWith<$Res> get booking;

}
/// @nodoc
class __$CreatedBookingModelCopyWithImpl<$Res>
    implements _$CreatedBookingModelCopyWith<$Res> {
  __$CreatedBookingModelCopyWithImpl(this._self, this._then);

  final _CreatedBookingModel _self;
  final $Res Function(_CreatedBookingModel) _then;

/// Create a copy of CreatedBookingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? manageToken = null,Object? booking = null,}) {
  return _then(_CreatedBookingModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,manageToken: null == manageToken ? _self.manageToken : manageToken // ignore: cast_nullable_to_non_nullable
as String,booking: null == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel,
  ));
}

/// Create a copy of CreatedBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<$Res> get booking {
  
  return $PublicBookingModelCopyWith<$Res>(_self.booking, (value) {
    return _then(_self.copyWith(booking: value));
  });
}
}


/// @nodoc
mixin _$PaymentIntentModel {

 String? get clientSecret; String? get paymentIntentId; int? get amountCents; String? get currency; String? get holdExpiresAt; bool get paid;
/// Create a copy of PaymentIntentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentIntentModelCopyWith<PaymentIntentModel> get copyWith => _$PaymentIntentModelCopyWithImpl<PaymentIntentModel>(this as PaymentIntentModel, _$identity);

  /// Serializes this PaymentIntentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PaymentIntentModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentIntentModel&&(identical(other.clientSecret, _this.clientSecret) || other.clientSecret == _this.clientSecret)&&(identical(other.paymentIntentId, _this.paymentIntentId) || other.paymentIntentId == _this.paymentIntentId)&&(identical(other.amountCents, _this.amountCents) || other.amountCents == _this.amountCents)&&(identical(other.currency, _this.currency) || other.currency == _this.currency)&&(identical(other.holdExpiresAt, _this.holdExpiresAt) || other.holdExpiresAt == _this.holdExpiresAt)&&(identical(other.paid, _this.paid) || other.paid == _this.paid));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PaymentIntentModel;
  return Object.hash(runtimeType,_this.clientSecret,_this.paymentIntentId,_this.amountCents,_this.currency,_this.holdExpiresAt,_this.paid);
}

@override
String toString() {
  final _this = this as PaymentIntentModel;
  return 'PaymentIntentModel(clientSecret: ${_this.clientSecret}, paymentIntentId: ${_this.paymentIntentId}, amountCents: ${_this.amountCents}, currency: ${_this.currency}, holdExpiresAt: ${_this.holdExpiresAt}, paid: ${_this.paid})';
}


}

/// @nodoc
abstract mixin class $PaymentIntentModelCopyWith<$Res>  {
  factory $PaymentIntentModelCopyWith(PaymentIntentModel value, $Res Function(PaymentIntentModel) _then) = _$PaymentIntentModelCopyWithImpl;
@useResult
$Res call({
 String? clientSecret, String? paymentIntentId, int? amountCents, String? currency, String? holdExpiresAt, bool paid
});




}
/// @nodoc
class _$PaymentIntentModelCopyWithImpl<$Res>
    implements $PaymentIntentModelCopyWith<$Res> {
  _$PaymentIntentModelCopyWithImpl(this._self, this._then);

  final PaymentIntentModel _self;
  final $Res Function(PaymentIntentModel) _then;

/// Create a copy of PaymentIntentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? clientSecret = freezed,Object? paymentIntentId = freezed,Object? amountCents = freezed,Object? currency = freezed,Object? holdExpiresAt = freezed,Object? paid = null,}) {
  return _then(PaymentIntentModel(
clientSecret: freezed == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String?,paymentIntentId: freezed == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String?,amountCents: freezed == amountCents ? _self.amountCents : amountCents // ignore: cast_nullable_to_non_nullable
as int?,currency: freezed == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String?,holdExpiresAt: freezed == holdExpiresAt ? _self.holdExpiresAt : holdExpiresAt // ignore: cast_nullable_to_non_nullable
as String?,paid: null == paid ? _self.paid : paid // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentIntentModel].
extension PaymentIntentModelPatterns on PaymentIntentModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentIntentModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentIntentModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentIntentModel value)  $default,){
final _that = this;
switch (_that) {
case _PaymentIntentModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentIntentModel value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentIntentModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? clientSecret,  String? paymentIntentId,  int? amountCents,  String? currency,  String? holdExpiresAt,  bool paid)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentIntentModel() when $default != null:
return $default(_that.clientSecret,_that.paymentIntentId,_that.amountCents,_that.currency,_that.holdExpiresAt,_that.paid);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? clientSecret,  String? paymentIntentId,  int? amountCents,  String? currency,  String? holdExpiresAt,  bool paid)  $default,) {final _that = this;
switch (_that) {
case _PaymentIntentModel():
return $default(_that.clientSecret,_that.paymentIntentId,_that.amountCents,_that.currency,_that.holdExpiresAt,_that.paid);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? clientSecret,  String? paymentIntentId,  int? amountCents,  String? currency,  String? holdExpiresAt,  bool paid)?  $default,) {final _that = this;
switch (_that) {
case _PaymentIntentModel() when $default != null:
return $default(_that.clientSecret,_that.paymentIntentId,_that.amountCents,_that.currency,_that.holdExpiresAt,_that.paid);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentIntentModel implements PaymentIntentModel {
  const _PaymentIntentModel({this.clientSecret, this.paymentIntentId, this.amountCents, this.currency, this.holdExpiresAt, this.paid = false});
  factory _PaymentIntentModel.fromJson(Map<String, dynamic> json) => _$PaymentIntentModelFromJson(json);

@override final  String? clientSecret;
@override final  String? paymentIntentId;
@override final  int? amountCents;
@override final  String? currency;
@override final  String? holdExpiresAt;
@override@JsonKey() final  bool paid;

/// Create a copy of PaymentIntentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentIntentModelCopyWith<_PaymentIntentModel> get copyWith => __$PaymentIntentModelCopyWithImpl<_PaymentIntentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentIntentModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentIntentModel&&(identical(other.clientSecret, clientSecret) || other.clientSecret == clientSecret)&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.amountCents, amountCents) || other.amountCents == amountCents)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.holdExpiresAt, holdExpiresAt) || other.holdExpiresAt == holdExpiresAt)&&(identical(other.paid, paid) || other.paid == paid));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,clientSecret,paymentIntentId,amountCents,currency,holdExpiresAt,paid);
}

@override
String toString() {
    return 'PaymentIntentModel(clientSecret: $clientSecret, paymentIntentId: $paymentIntentId, amountCents: $amountCents, currency: $currency, holdExpiresAt: $holdExpiresAt, paid: $paid)';
}


}

/// @nodoc
abstract mixin class _$PaymentIntentModelCopyWith<$Res> implements $PaymentIntentModelCopyWith<$Res> {
  factory _$PaymentIntentModelCopyWith(_PaymentIntentModel value, $Res Function(_PaymentIntentModel) _then) = __$PaymentIntentModelCopyWithImpl;
@override @useResult
$Res call({
 String? clientSecret, String? paymentIntentId, int? amountCents, String? currency, String? holdExpiresAt, bool paid
});




}
/// @nodoc
class __$PaymentIntentModelCopyWithImpl<$Res>
    implements _$PaymentIntentModelCopyWith<$Res> {
  __$PaymentIntentModelCopyWithImpl(this._self, this._then);

  final _PaymentIntentModel _self;
  final $Res Function(_PaymentIntentModel) _then;

/// Create a copy of PaymentIntentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? clientSecret = freezed,Object? paymentIntentId = freezed,Object? amountCents = freezed,Object? currency = freezed,Object? holdExpiresAt = freezed,Object? paid = null,}) {
  return _then(_PaymentIntentModel(
clientSecret: freezed == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String?,paymentIntentId: freezed == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String?,amountCents: freezed == amountCents ? _self.amountCents : amountCents // ignore: cast_nullable_to_non_nullable
as int?,currency: freezed == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String?,holdExpiresAt: freezed == holdExpiresAt ? _self.holdExpiresAt : holdExpiresAt // ignore: cast_nullable_to_non_nullable
as String?,paid: null == paid ? _self.paid : paid // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$CheckoutModel {

 String? get url; bool get paid;
/// Create a copy of CheckoutModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CheckoutModelCopyWith<CheckoutModel> get copyWith => _$CheckoutModelCopyWithImpl<CheckoutModel>(this as CheckoutModel, _$identity);

  /// Serializes this CheckoutModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as CheckoutModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CheckoutModel&&(identical(other.url, _this.url) || other.url == _this.url)&&(identical(other.paid, _this.paid) || other.paid == _this.paid));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as CheckoutModel;
  return Object.hash(runtimeType,_this.url,_this.paid);
}

@override
String toString() {
  final _this = this as CheckoutModel;
  return 'CheckoutModel(url: ${_this.url}, paid: ${_this.paid})';
}


}

/// @nodoc
abstract mixin class $CheckoutModelCopyWith<$Res>  {
  factory $CheckoutModelCopyWith(CheckoutModel value, $Res Function(CheckoutModel) _then) = _$CheckoutModelCopyWithImpl;
@useResult
$Res call({
 String? url, bool paid
});




}
/// @nodoc
class _$CheckoutModelCopyWithImpl<$Res>
    implements $CheckoutModelCopyWith<$Res> {
  _$CheckoutModelCopyWithImpl(this._self, this._then);

  final CheckoutModel _self;
  final $Res Function(CheckoutModel) _then;

/// Create a copy of CheckoutModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? url = freezed,Object? paid = null,}) {
  return _then(CheckoutModel(
url: freezed == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String?,paid: null == paid ? _self.paid : paid // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [CheckoutModel].
extension CheckoutModelPatterns on CheckoutModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CheckoutModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CheckoutModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CheckoutModel value)  $default,){
final _that = this;
switch (_that) {
case _CheckoutModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CheckoutModel value)?  $default,){
final _that = this;
switch (_that) {
case _CheckoutModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? url,  bool paid)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CheckoutModel() when $default != null:
return $default(_that.url,_that.paid);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? url,  bool paid)  $default,) {final _that = this;
switch (_that) {
case _CheckoutModel():
return $default(_that.url,_that.paid);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? url,  bool paid)?  $default,) {final _that = this;
switch (_that) {
case _CheckoutModel() when $default != null:
return $default(_that.url,_that.paid);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CheckoutModel implements CheckoutModel {
  const _CheckoutModel({this.url, this.paid = false});
  factory _CheckoutModel.fromJson(Map<String, dynamic> json) => _$CheckoutModelFromJson(json);

@override final  String? url;
@override@JsonKey() final  bool paid;

/// Create a copy of CheckoutModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CheckoutModelCopyWith<_CheckoutModel> get copyWith => __$CheckoutModelCopyWithImpl<_CheckoutModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CheckoutModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CheckoutModel&&(identical(other.url, url) || other.url == url)&&(identical(other.paid, paid) || other.paid == paid));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,url,paid);
}

@override
String toString() {
    return 'CheckoutModel(url: $url, paid: $paid)';
}


}

/// @nodoc
abstract mixin class _$CheckoutModelCopyWith<$Res> implements $CheckoutModelCopyWith<$Res> {
  factory _$CheckoutModelCopyWith(_CheckoutModel value, $Res Function(_CheckoutModel) _then) = __$CheckoutModelCopyWithImpl;
@override @useResult
$Res call({
 String? url, bool paid
});




}
/// @nodoc
class __$CheckoutModelCopyWithImpl<$Res>
    implements _$CheckoutModelCopyWith<$Res> {
  __$CheckoutModelCopyWithImpl(this._self, this._then);

  final _CheckoutModel _self;
  final $Res Function(_CheckoutModel) _then;

/// Create a copy of CheckoutModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? url = freezed,Object? paid = null,}) {
  return _then(_CheckoutModel(
url: freezed == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String?,paid: null == paid ? _self.paid : paid // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$BookingVehicleModel {

 String? get model; String? get colour;
/// Create a copy of BookingVehicleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingVehicleModelCopyWith<BookingVehicleModel> get copyWith => _$BookingVehicleModelCopyWithImpl<BookingVehicleModel>(this as BookingVehicleModel, _$identity);

  /// Serializes this BookingVehicleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as BookingVehicleModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingVehicleModel&&(identical(other.model, _this.model) || other.model == _this.model)&&(identical(other.colour, _this.colour) || other.colour == _this.colour));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BookingVehicleModel;
  return Object.hash(runtimeType,_this.model,_this.colour);
}

@override
String toString() {
  final _this = this as BookingVehicleModel;
  return 'BookingVehicleModel(model: ${_this.model}, colour: ${_this.colour})';
}


}

/// @nodoc
abstract mixin class $BookingVehicleModelCopyWith<$Res>  {
  factory $BookingVehicleModelCopyWith(BookingVehicleModel value, $Res Function(BookingVehicleModel) _then) = _$BookingVehicleModelCopyWithImpl;
@useResult
$Res call({
 String? model, String? colour
});




}
/// @nodoc
class _$BookingVehicleModelCopyWithImpl<$Res>
    implements $BookingVehicleModelCopyWith<$Res> {
  _$BookingVehicleModelCopyWithImpl(this._self, this._then);

  final BookingVehicleModel _self;
  final $Res Function(BookingVehicleModel) _then;

/// Create a copy of BookingVehicleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? model = freezed,Object? colour = freezed,}) {
  return _then(BookingVehicleModel(
model: freezed == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String?,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [BookingVehicleModel].
extension BookingVehicleModelPatterns on BookingVehicleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingVehicleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingVehicleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingVehicleModel value)  $default,){
final _that = this;
switch (_that) {
case _BookingVehicleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingVehicleModel value)?  $default,){
final _that = this;
switch (_that) {
case _BookingVehicleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? model,  String? colour)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingVehicleModel() when $default != null:
return $default(_that.model,_that.colour);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? model,  String? colour)  $default,) {final _that = this;
switch (_that) {
case _BookingVehicleModel():
return $default(_that.model,_that.colour);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? model,  String? colour)?  $default,) {final _that = this;
switch (_that) {
case _BookingVehicleModel() when $default != null:
return $default(_that.model,_that.colour);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingVehicleModel implements BookingVehicleModel {
  const _BookingVehicleModel({this.model, this.colour});
  factory _BookingVehicleModel.fromJson(Map<String, dynamic> json) => _$BookingVehicleModelFromJson(json);

@override final  String? model;
@override final  String? colour;

/// Create a copy of BookingVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingVehicleModelCopyWith<_BookingVehicleModel> get copyWith => __$BookingVehicleModelCopyWithImpl<_BookingVehicleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BookingVehicleModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingVehicleModel&&(identical(other.model, model) || other.model == model)&&(identical(other.colour, colour) || other.colour == colour));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,model,colour);
}

@override
String toString() {
    return 'BookingVehicleModel(model: $model, colour: $colour)';
}


}

/// @nodoc
abstract mixin class _$BookingVehicleModelCopyWith<$Res> implements $BookingVehicleModelCopyWith<$Res> {
  factory _$BookingVehicleModelCopyWith(_BookingVehicleModel value, $Res Function(_BookingVehicleModel) _then) = __$BookingVehicleModelCopyWithImpl;
@override @useResult
$Res call({
 String? model, String? colour
});




}
/// @nodoc
class __$BookingVehicleModelCopyWithImpl<$Res>
    implements _$BookingVehicleModelCopyWith<$Res> {
  __$BookingVehicleModelCopyWithImpl(this._self, this._then);

  final _BookingVehicleModel _self;
  final $Res Function(_BookingVehicleModel) _then;

/// Create a copy of BookingVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? model = freezed,Object? colour = freezed,}) {
  return _then(_BookingVehicleModel(
model: freezed == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String?,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$OutboundFlightModel {

 String? get status; String? get scheduledAt; String? get estimatedAt; String? get terminal; String? get shuttleAt;
/// Create a copy of OutboundFlightModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OutboundFlightModelCopyWith<OutboundFlightModel> get copyWith => _$OutboundFlightModelCopyWithImpl<OutboundFlightModel>(this as OutboundFlightModel, _$identity);

  /// Serializes this OutboundFlightModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OutboundFlightModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OutboundFlightModel&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.scheduledAt, _this.scheduledAt) || other.scheduledAt == _this.scheduledAt)&&(identical(other.estimatedAt, _this.estimatedAt) || other.estimatedAt == _this.estimatedAt)&&(identical(other.terminal, _this.terminal) || other.terminal == _this.terminal)&&(identical(other.shuttleAt, _this.shuttleAt) || other.shuttleAt == _this.shuttleAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OutboundFlightModel;
  return Object.hash(runtimeType,_this.status,_this.scheduledAt,_this.estimatedAt,_this.terminal,_this.shuttleAt);
}

@override
String toString() {
  final _this = this as OutboundFlightModel;
  return 'OutboundFlightModel(status: ${_this.status}, scheduledAt: ${_this.scheduledAt}, estimatedAt: ${_this.estimatedAt}, terminal: ${_this.terminal}, shuttleAt: ${_this.shuttleAt})';
}


}

/// @nodoc
abstract mixin class $OutboundFlightModelCopyWith<$Res>  {
  factory $OutboundFlightModelCopyWith(OutboundFlightModel value, $Res Function(OutboundFlightModel) _then) = _$OutboundFlightModelCopyWithImpl;
@useResult
$Res call({
 String? status, String? scheduledAt, String? estimatedAt, String? terminal, String? shuttleAt
});




}
/// @nodoc
class _$OutboundFlightModelCopyWithImpl<$Res>
    implements $OutboundFlightModelCopyWith<$Res> {
  _$OutboundFlightModelCopyWithImpl(this._self, this._then);

  final OutboundFlightModel _self;
  final $Res Function(OutboundFlightModel) _then;

/// Create a copy of OutboundFlightModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = freezed,Object? scheduledAt = freezed,Object? estimatedAt = freezed,Object? terminal = freezed,Object? shuttleAt = freezed,}) {
  return _then(OutboundFlightModel(
status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: freezed == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as String?,estimatedAt: freezed == estimatedAt ? _self.estimatedAt : estimatedAt // ignore: cast_nullable_to_non_nullable
as String?,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,shuttleAt: freezed == shuttleAt ? _self.shuttleAt : shuttleAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [OutboundFlightModel].
extension OutboundFlightModelPatterns on OutboundFlightModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OutboundFlightModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OutboundFlightModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OutboundFlightModel value)  $default,){
final _that = this;
switch (_that) {
case _OutboundFlightModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OutboundFlightModel value)?  $default,){
final _that = this;
switch (_that) {
case _OutboundFlightModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? status,  String? scheduledAt,  String? estimatedAt,  String? terminal,  String? shuttleAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OutboundFlightModel() when $default != null:
return $default(_that.status,_that.scheduledAt,_that.estimatedAt,_that.terminal,_that.shuttleAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? status,  String? scheduledAt,  String? estimatedAt,  String? terminal,  String? shuttleAt)  $default,) {final _that = this;
switch (_that) {
case _OutboundFlightModel():
return $default(_that.status,_that.scheduledAt,_that.estimatedAt,_that.terminal,_that.shuttleAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? status,  String? scheduledAt,  String? estimatedAt,  String? terminal,  String? shuttleAt)?  $default,) {final _that = this;
switch (_that) {
case _OutboundFlightModel() when $default != null:
return $default(_that.status,_that.scheduledAt,_that.estimatedAt,_that.terminal,_that.shuttleAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OutboundFlightModel implements OutboundFlightModel {
  const _OutboundFlightModel({this.status, this.scheduledAt, this.estimatedAt, this.terminal, this.shuttleAt});
  factory _OutboundFlightModel.fromJson(Map<String, dynamic> json) => _$OutboundFlightModelFromJson(json);

@override final  String? status;
@override final  String? scheduledAt;
@override final  String? estimatedAt;
@override final  String? terminal;
@override final  String? shuttleAt;

/// Create a copy of OutboundFlightModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OutboundFlightModelCopyWith<_OutboundFlightModel> get copyWith => __$OutboundFlightModelCopyWithImpl<_OutboundFlightModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OutboundFlightModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OutboundFlightModel&&(identical(other.status, status) || other.status == status)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.estimatedAt, estimatedAt) || other.estimatedAt == estimatedAt)&&(identical(other.terminal, terminal) || other.terminal == terminal)&&(identical(other.shuttleAt, shuttleAt) || other.shuttleAt == shuttleAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,status,scheduledAt,estimatedAt,terminal,shuttleAt);
}

@override
String toString() {
    return 'OutboundFlightModel(status: $status, scheduledAt: $scheduledAt, estimatedAt: $estimatedAt, terminal: $terminal, shuttleAt: $shuttleAt)';
}


}

/// @nodoc
abstract mixin class _$OutboundFlightModelCopyWith<$Res> implements $OutboundFlightModelCopyWith<$Res> {
  factory _$OutboundFlightModelCopyWith(_OutboundFlightModel value, $Res Function(_OutboundFlightModel) _then) = __$OutboundFlightModelCopyWithImpl;
@override @useResult
$Res call({
 String? status, String? scheduledAt, String? estimatedAt, String? terminal, String? shuttleAt
});




}
/// @nodoc
class __$OutboundFlightModelCopyWithImpl<$Res>
    implements _$OutboundFlightModelCopyWith<$Res> {
  __$OutboundFlightModelCopyWithImpl(this._self, this._then);

  final _OutboundFlightModel _self;
  final $Res Function(_OutboundFlightModel) _then;

/// Create a copy of OutboundFlightModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = freezed,Object? scheduledAt = freezed,Object? estimatedAt = freezed,Object? terminal = freezed,Object? shuttleAt = freezed,}) {
  return _then(_OutboundFlightModel(
status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: freezed == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as String?,estimatedAt: freezed == estimatedAt ? _self.estimatedAt : estimatedAt // ignore: cast_nullable_to_non_nullable
as String?,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,shuttleAt: freezed == shuttleAt ? _self.shuttleAt : shuttleAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$CarLocationModel {

 double get lat; double get lng; int? get accuracyM; DateTime get at; String get by; String? get note;
/// Create a copy of CarLocationModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CarLocationModelCopyWith<CarLocationModel> get copyWith => _$CarLocationModelCopyWithImpl<CarLocationModel>(this as CarLocationModel, _$identity);

  /// Serializes this CarLocationModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as CarLocationModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CarLocationModel&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng)&&(identical(other.accuracyM, _this.accuracyM) || other.accuracyM == _this.accuracyM)&&(identical(other.at, _this.at) || other.at == _this.at)&&(identical(other.by, _this.by) || other.by == _this.by)&&(identical(other.note, _this.note) || other.note == _this.note));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as CarLocationModel;
  return Object.hash(runtimeType,_this.lat,_this.lng,_this.accuracyM,_this.at,_this.by,_this.note);
}

@override
String toString() {
  final _this = this as CarLocationModel;
  return 'CarLocationModel(lat: ${_this.lat}, lng: ${_this.lng}, accuracyM: ${_this.accuracyM}, at: ${_this.at}, by: ${_this.by}, note: ${_this.note})';
}


}

/// @nodoc
abstract mixin class $CarLocationModelCopyWith<$Res>  {
  factory $CarLocationModelCopyWith(CarLocationModel value, $Res Function(CarLocationModel) _then) = _$CarLocationModelCopyWithImpl;
@useResult
$Res call({
 double lat, double lng, int? accuracyM, DateTime at, String by, String? note
});




}
/// @nodoc
class _$CarLocationModelCopyWithImpl<$Res>
    implements $CarLocationModelCopyWith<$Res> {
  _$CarLocationModelCopyWithImpl(this._self, this._then);

  final CarLocationModel _self;
  final $Res Function(CarLocationModel) _then;

/// Create a copy of CarLocationModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? lat = null,Object? lng = null,Object? accuracyM = freezed,Object? at = null,Object? by = null,Object? note = freezed,}) {
  return _then(CarLocationModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,accuracyM: freezed == accuracyM ? _self.accuracyM : accuracyM // ignore: cast_nullable_to_non_nullable
as int?,at: null == at ? _self.at : at // ignore: cast_nullable_to_non_nullable
as DateTime,by: null == by ? _self.by : by // ignore: cast_nullable_to_non_nullable
as String,note: freezed == note ? _self.note : note // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [CarLocationModel].
extension CarLocationModelPatterns on CarLocationModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CarLocationModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CarLocationModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CarLocationModel value)  $default,){
final _that = this;
switch (_that) {
case _CarLocationModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CarLocationModel value)?  $default,){
final _that = this;
switch (_that) {
case _CarLocationModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double lat,  double lng,  int? accuracyM,  DateTime at,  String by,  String? note)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CarLocationModel() when $default != null:
return $default(_that.lat,_that.lng,_that.accuracyM,_that.at,_that.by,_that.note);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double lat,  double lng,  int? accuracyM,  DateTime at,  String by,  String? note)  $default,) {final _that = this;
switch (_that) {
case _CarLocationModel():
return $default(_that.lat,_that.lng,_that.accuracyM,_that.at,_that.by,_that.note);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double lat,  double lng,  int? accuracyM,  DateTime at,  String by,  String? note)?  $default,) {final _that = this;
switch (_that) {
case _CarLocationModel() when $default != null:
return $default(_that.lat,_that.lng,_that.accuracyM,_that.at,_that.by,_that.note);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CarLocationModel extends CarLocationModel {
  const _CarLocationModel({required this.lat, required this.lng, this.accuracyM, required this.at, this.by = 'traveller', this.note}): super._();
  factory _CarLocationModel.fromJson(Map<String, dynamic> json) => _$CarLocationModelFromJson(json);

@override final  double lat;
@override final  double lng;
@override final  int? accuracyM;
@override final  DateTime at;
@override@JsonKey() final  String by;
@override final  String? note;

/// Create a copy of CarLocationModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CarLocationModelCopyWith<_CarLocationModel> get copyWith => __$CarLocationModelCopyWithImpl<_CarLocationModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CarLocationModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CarLocationModel&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&(identical(other.accuracyM, accuracyM) || other.accuracyM == accuracyM)&&(identical(other.at, at) || other.at == at)&&(identical(other.by, by) || other.by == by)&&(identical(other.note, note) || other.note == note));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,lat,lng,accuracyM,at,by,note);
}

@override
String toString() {
    return 'CarLocationModel(lat: $lat, lng: $lng, accuracyM: $accuracyM, at: $at, by: $by, note: $note)';
}


}

/// @nodoc
abstract mixin class _$CarLocationModelCopyWith<$Res> implements $CarLocationModelCopyWith<$Res> {
  factory _$CarLocationModelCopyWith(_CarLocationModel value, $Res Function(_CarLocationModel) _then) = __$CarLocationModelCopyWithImpl;
@override @useResult
$Res call({
 double lat, double lng, int? accuracyM, DateTime at, String by, String? note
});




}
/// @nodoc
class __$CarLocationModelCopyWithImpl<$Res>
    implements _$CarLocationModelCopyWith<$Res> {
  __$CarLocationModelCopyWithImpl(this._self, this._then);

  final _CarLocationModel _self;
  final $Res Function(_CarLocationModel) _then;

/// Create a copy of CarLocationModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? lat = null,Object? lng = null,Object? accuracyM = freezed,Object? at = null,Object? by = null,Object? note = freezed,}) {
  return _then(_CarLocationModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,accuracyM: freezed == accuracyM ? _self.accuracyM : accuracyM // ignore: cast_nullable_to_non_nullable
as int?,at: null == at ? _self.at : at // ignore: cast_nullable_to_non_nullable
as DateTime,by: null == by ? _self.by : by // ignore: cast_nullable_to_non_nullable
as String,note: freezed == note ? _self.note : note // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
