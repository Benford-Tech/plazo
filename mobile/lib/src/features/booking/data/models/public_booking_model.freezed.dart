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

 String get reference; String get status; BookingParkingModel get parking; String get arrivalAt; String get returnAt; String get customerName; String get plate; String? get returnFlight; int get passengers; int? get days;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PublicBookingModel&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.days, _this.days) || other.days == _this.days));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PublicBookingModel;
  return Object.hash(runtimeType,_this.reference,_this.status,_this.parking,_this.arrivalAt,_this.returnAt,_this.customerName,_this.plate,_this.returnFlight,_this.passengers,_this.days);
}

@override
String toString() {
  final _this = this as PublicBookingModel;
  return 'PublicBookingModel(reference: ${_this.reference}, status: ${_this.status}, parking: ${_this.parking}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, customerName: ${_this.customerName}, plate: ${_this.plate}, returnFlight: ${_this.returnFlight}, passengers: ${_this.passengers}, days: ${_this.days})';
}


}

/// @nodoc
abstract mixin class $PublicBookingModelCopyWith<$Res>  {
  factory $PublicBookingModelCopyWith(PublicBookingModel value, $Res Function(PublicBookingModel) _then) = _$PublicBookingModelCopyWithImpl;
@useResult
$Res call({
 String reference, String status, BookingParkingModel parking, String arrivalAt, String returnAt, String customerName, String plate, String? returnFlight, int passengers, int? days
});


$BookingParkingModelCopyWith<$Res> get parking;

}
/// @nodoc
class _$PublicBookingModelCopyWithImpl<$Res>
    implements $PublicBookingModelCopyWith<$Res> {
  _$PublicBookingModelCopyWithImpl(this._self, this._then);

  final PublicBookingModel _self;
  final $Res Function(PublicBookingModel) _then;

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? status = null,Object? parking = null,Object? arrivalAt = null,Object? returnAt = null,Object? customerName = null,Object? plate = null,Object? returnFlight = freezed,Object? passengers = null,Object? days = freezed,}) {
  return _then(PublicBookingModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as BookingParkingModel,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,days: freezed == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}
/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingParkingModelCopyWith<$Res> get parking {
  
  return $BookingParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  String status,  BookingParkingModel parking,  String arrivalAt,  String returnAt,  String customerName,  String plate,  String? returnFlight,  int passengers,  int? days)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PublicBookingModel() when $default != null:
return $default(_that.reference,_that.status,_that.parking,_that.arrivalAt,_that.returnAt,_that.customerName,_that.plate,_that.returnFlight,_that.passengers,_that.days);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  String status,  BookingParkingModel parking,  String arrivalAt,  String returnAt,  String customerName,  String plate,  String? returnFlight,  int passengers,  int? days)  $default,) {final _that = this;
switch (_that) {
case _PublicBookingModel():
return $default(_that.reference,_that.status,_that.parking,_that.arrivalAt,_that.returnAt,_that.customerName,_that.plate,_that.returnFlight,_that.passengers,_that.days);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  String status,  BookingParkingModel parking,  String arrivalAt,  String returnAt,  String customerName,  String plate,  String? returnFlight,  int passengers,  int? days)?  $default,) {final _that = this;
switch (_that) {
case _PublicBookingModel() when $default != null:
return $default(_that.reference,_that.status,_that.parking,_that.arrivalAt,_that.returnAt,_that.customerName,_that.plate,_that.returnFlight,_that.passengers,_that.days);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PublicBookingModel implements PublicBookingModel {
  const _PublicBookingModel({required this.reference, required this.status, required this.parking, required this.arrivalAt, required this.returnAt, required this.customerName, required this.plate, this.returnFlight, required this.passengers, this.days});
  factory _PublicBookingModel.fromJson(Map<String, dynamic> json) => _$PublicBookingModelFromJson(json);

@override final  String reference;
@override final  String status;
@override final  BookingParkingModel parking;
@override final  String arrivalAt;
@override final  String returnAt;
@override final  String customerName;
@override final  String plate;
@override final  String? returnFlight;
@override final  int passengers;
@override final  int? days;

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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PublicBookingModel&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.status, status) || other.status == status)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.days, days) || other.days == days));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reference,status,parking,arrivalAt,returnAt,customerName,plate,returnFlight,passengers,days);
}

@override
String toString() {
    return 'PublicBookingModel(reference: $reference, status: $status, parking: $parking, arrivalAt: $arrivalAt, returnAt: $returnAt, customerName: $customerName, plate: $plate, returnFlight: $returnFlight, passengers: $passengers, days: $days)';
}


}

/// @nodoc
abstract mixin class _$PublicBookingModelCopyWith<$Res> implements $PublicBookingModelCopyWith<$Res> {
  factory _$PublicBookingModelCopyWith(_PublicBookingModel value, $Res Function(_PublicBookingModel) _then) = __$PublicBookingModelCopyWithImpl;
@override @useResult
$Res call({
 String reference, String status, BookingParkingModel parking, String arrivalAt, String returnAt, String customerName, String plate, String? returnFlight, int passengers, int? days
});


@override $BookingParkingModelCopyWith<$Res> get parking;

}
/// @nodoc
class __$PublicBookingModelCopyWithImpl<$Res>
    implements _$PublicBookingModelCopyWith<$Res> {
  __$PublicBookingModelCopyWithImpl(this._self, this._then);

  final _PublicBookingModel _self;
  final $Res Function(_PublicBookingModel) _then;

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? status = null,Object? parking = null,Object? arrivalAt = null,Object? returnAt = null,Object? customerName = null,Object? plate = null,Object? returnFlight = freezed,Object? passengers = null,Object? days = freezed,}) {
  return _then(_PublicBookingModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as BookingParkingModel,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,days: freezed == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

/// Create a copy of PublicBookingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$BookingParkingModelCopyWith<$Res> get parking {
  
  return $BookingParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}
}


/// @nodoc
mixin _$BookingParkingModel {

 String get title; String? get address; int? get shuttleMinutes; String? get phone; BookingAirportModel? get airport;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingParkingModel&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.address, _this.address) || other.address == _this.address)&&(identical(other.shuttleMinutes, _this.shuttleMinutes) || other.shuttleMinutes == _this.shuttleMinutes)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.airport, _this.airport) || other.airport == _this.airport));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BookingParkingModel;
  return Object.hash(runtimeType,_this.title,_this.address,_this.shuttleMinutes,_this.phone,_this.airport);
}

@override
String toString() {
  final _this = this as BookingParkingModel;
  return 'BookingParkingModel(title: ${_this.title}, address: ${_this.address}, shuttleMinutes: ${_this.shuttleMinutes}, phone: ${_this.phone}, airport: ${_this.airport})';
}


}

/// @nodoc
abstract mixin class $BookingParkingModelCopyWith<$Res>  {
  factory $BookingParkingModelCopyWith(BookingParkingModel value, $Res Function(BookingParkingModel) _then) = _$BookingParkingModelCopyWithImpl;
@useResult
$Res call({
 String title, String? address, int? shuttleMinutes, String? phone, BookingAirportModel? airport
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
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? address = freezed,Object? shuttleMinutes = freezed,Object? phone = freezed,Object? airport = freezed,}) {
  return _then(BookingParkingModel(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  String? address,  int? shuttleMinutes,  String? phone,  BookingAirportModel? airport)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingParkingModel() when $default != null:
return $default(_that.title,_that.address,_that.shuttleMinutes,_that.phone,_that.airport);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  String? address,  int? shuttleMinutes,  String? phone,  BookingAirportModel? airport)  $default,) {final _that = this;
switch (_that) {
case _BookingParkingModel():
return $default(_that.title,_that.address,_that.shuttleMinutes,_that.phone,_that.airport);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  String? address,  int? shuttleMinutes,  String? phone,  BookingAirportModel? airport)?  $default,) {final _that = this;
switch (_that) {
case _BookingParkingModel() when $default != null:
return $default(_that.title,_that.address,_that.shuttleMinutes,_that.phone,_that.airport);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingParkingModel implements BookingParkingModel {
  const _BookingParkingModel({required this.title, this.address, this.shuttleMinutes, this.phone, this.airport});
  factory _BookingParkingModel.fromJson(Map<String, dynamic> json) => _$BookingParkingModelFromJson(json);

@override final  String title;
@override final  String? address;
@override final  int? shuttleMinutes;
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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingParkingModel&&(identical(other.title, title) || other.title == title)&&(identical(other.address, address) || other.address == address)&&(identical(other.shuttleMinutes, shuttleMinutes) || other.shuttleMinutes == shuttleMinutes)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.airport, airport) || other.airport == airport));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,title,address,shuttleMinutes,phone,airport);
}

@override
String toString() {
    return 'BookingParkingModel(title: $title, address: $address, shuttleMinutes: $shuttleMinutes, phone: $phone, airport: $airport)';
}


}

/// @nodoc
abstract mixin class _$BookingParkingModelCopyWith<$Res> implements $BookingParkingModelCopyWith<$Res> {
  factory _$BookingParkingModelCopyWith(_BookingParkingModel value, $Res Function(_BookingParkingModel) _then) = __$BookingParkingModelCopyWithImpl;
@override @useResult
$Res call({
 String title, String? address, int? shuttleMinutes, String? phone, BookingAirportModel? airport
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
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? address = freezed,Object? shuttleMinutes = freezed,Object? phone = freezed,Object? airport = freezed,}) {
  return _then(_BookingParkingModel(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
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

// dart format on
