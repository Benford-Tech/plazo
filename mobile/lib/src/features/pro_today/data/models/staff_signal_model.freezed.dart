// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'staff_signal_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SignalPositionModel {

 double get lat; double get lng; double? get accuracyM;
/// Create a copy of SignalPositionModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SignalPositionModelCopyWith<SignalPositionModel> get copyWith => _$SignalPositionModelCopyWithImpl<SignalPositionModel>(this as SignalPositionModel, _$identity);

  /// Serializes this SignalPositionModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SignalPositionModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SignalPositionModel&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng)&&(identical(other.accuracyM, _this.accuracyM) || other.accuracyM == _this.accuracyM));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SignalPositionModel;
  return Object.hash(runtimeType,_this.lat,_this.lng,_this.accuracyM);
}

@override
String toString() {
  final _this = this as SignalPositionModel;
  return 'SignalPositionModel(lat: ${_this.lat}, lng: ${_this.lng}, accuracyM: ${_this.accuracyM})';
}


}

/// @nodoc
abstract mixin class $SignalPositionModelCopyWith<$Res>  {
  factory $SignalPositionModelCopyWith(SignalPositionModel value, $Res Function(SignalPositionModel) _then) = _$SignalPositionModelCopyWithImpl;
@useResult
$Res call({
 double lat, double lng, double? accuracyM
});




}
/// @nodoc
class _$SignalPositionModelCopyWithImpl<$Res>
    implements $SignalPositionModelCopyWith<$Res> {
  _$SignalPositionModelCopyWithImpl(this._self, this._then);

  final SignalPositionModel _self;
  final $Res Function(SignalPositionModel) _then;

/// Create a copy of SignalPositionModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? lat = null,Object? lng = null,Object? accuracyM = freezed,}) {
  return _then(SignalPositionModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,accuracyM: freezed == accuracyM ? _self.accuracyM : accuracyM // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [SignalPositionModel].
extension SignalPositionModelPatterns on SignalPositionModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SignalPositionModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SignalPositionModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SignalPositionModel value)  $default,){
final _that = this;
switch (_that) {
case _SignalPositionModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SignalPositionModel value)?  $default,){
final _that = this;
switch (_that) {
case _SignalPositionModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double lat,  double lng,  double? accuracyM)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SignalPositionModel() when $default != null:
return $default(_that.lat,_that.lng,_that.accuracyM);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double lat,  double lng,  double? accuracyM)  $default,) {final _that = this;
switch (_that) {
case _SignalPositionModel():
return $default(_that.lat,_that.lng,_that.accuracyM);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double lat,  double lng,  double? accuracyM)?  $default,) {final _that = this;
switch (_that) {
case _SignalPositionModel() when $default != null:
return $default(_that.lat,_that.lng,_that.accuracyM);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SignalPositionModel implements SignalPositionModel {
  const _SignalPositionModel({required this.lat, required this.lng, this.accuracyM});
  factory _SignalPositionModel.fromJson(Map<String, dynamic> json) => _$SignalPositionModelFromJson(json);

@override final  double lat;
@override final  double lng;
@override final  double? accuracyM;

/// Create a copy of SignalPositionModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SignalPositionModelCopyWith<_SignalPositionModel> get copyWith => __$SignalPositionModelCopyWithImpl<_SignalPositionModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SignalPositionModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SignalPositionModel&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&(identical(other.accuracyM, accuracyM) || other.accuracyM == accuracyM));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,lat,lng,accuracyM);
}

@override
String toString() {
    return 'SignalPositionModel(lat: $lat, lng: $lng, accuracyM: $accuracyM)';
}


}

/// @nodoc
abstract mixin class _$SignalPositionModelCopyWith<$Res> implements $SignalPositionModelCopyWith<$Res> {
  factory _$SignalPositionModelCopyWith(_SignalPositionModel value, $Res Function(_SignalPositionModel) _then) = __$SignalPositionModelCopyWithImpl;
@override @useResult
$Res call({
 double lat, double lng, double? accuracyM
});




}
/// @nodoc
class __$SignalPositionModelCopyWithImpl<$Res>
    implements _$SignalPositionModelCopyWith<$Res> {
  __$SignalPositionModelCopyWithImpl(this._self, this._then);

  final _SignalPositionModel _self;
  final $Res Function(_SignalPositionModel) _then;

/// Create a copy of SignalPositionModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? lat = null,Object? lng = null,Object? accuracyM = freezed,}) {
  return _then(_SignalPositionModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,accuracyM: freezed == accuracyM ? _self.accuracyM : accuracyM // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}


/// @nodoc
mixin _$StaffSignalModel {

 String get id; String get reservationId; String get reference; ArrivalKind get kind;@JsonKey(unknownEnumValue: ArrivalSignalState.ended) ArrivalSignalState get state; String get customerName; String get plate; int get passengers; String? get returnFlight; DateTime get scheduledAt; DateTime get startedAt; DateTime get expiresAt; int? get distanceM; int? get etaMinutes; DateTime? get etaAt; int? get announcedMinutes; DateTime? get atMeetingPointAt; SignalPositionModel? get position; DateTime? get positionUpdatedAt; int? get positionAgeSeconds; MeetingPointModel? get meetingPoint;
/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StaffSignalModelCopyWith<StaffSignalModel> get copyWith => _$StaffSignalModelCopyWithImpl<StaffSignalModel>(this as StaffSignalModel, _$identity);

  /// Serializes this StaffSignalModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as StaffSignalModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffSignalModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.state, _this.state) || other.state == _this.state)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.scheduledAt, _this.scheduledAt) || other.scheduledAt == _this.scheduledAt)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt)&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.etaMinutes, _this.etaMinutes) || other.etaMinutes == _this.etaMinutes)&&(identical(other.etaAt, _this.etaAt) || other.etaAt == _this.etaAt)&&(identical(other.announcedMinutes, _this.announcedMinutes) || other.announcedMinutes == _this.announcedMinutes)&&(identical(other.atMeetingPointAt, _this.atMeetingPointAt) || other.atMeetingPointAt == _this.atMeetingPointAt)&&(identical(other.position, _this.position) || other.position == _this.position)&&(identical(other.positionUpdatedAt, _this.positionUpdatedAt) || other.positionUpdatedAt == _this.positionUpdatedAt)&&(identical(other.positionAgeSeconds, _this.positionAgeSeconds) || other.positionAgeSeconds == _this.positionAgeSeconds)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StaffSignalModel;
  return Object.hashAll([runtimeType,_this.id,_this.reservationId,_this.reference,_this.kind,_this.state,_this.customerName,_this.plate,_this.passengers,_this.returnFlight,_this.scheduledAt,_this.startedAt,_this.expiresAt,_this.distanceM,_this.etaMinutes,_this.etaAt,_this.announcedMinutes,_this.atMeetingPointAt,_this.position,_this.positionUpdatedAt,_this.positionAgeSeconds,_this.meetingPoint]);
}

@override
String toString() {
  final _this = this as StaffSignalModel;
  return 'StaffSignalModel(id: ${_this.id}, reservationId: ${_this.reservationId}, reference: ${_this.reference}, kind: ${_this.kind}, state: ${_this.state}, customerName: ${_this.customerName}, plate: ${_this.plate}, passengers: ${_this.passengers}, returnFlight: ${_this.returnFlight}, scheduledAt: ${_this.scheduledAt}, startedAt: ${_this.startedAt}, expiresAt: ${_this.expiresAt}, distanceM: ${_this.distanceM}, etaMinutes: ${_this.etaMinutes}, etaAt: ${_this.etaAt}, announcedMinutes: ${_this.announcedMinutes}, atMeetingPointAt: ${_this.atMeetingPointAt}, position: ${_this.position}, positionUpdatedAt: ${_this.positionUpdatedAt}, positionAgeSeconds: ${_this.positionAgeSeconds}, meetingPoint: ${_this.meetingPoint})';
}


}

/// @nodoc
abstract mixin class $StaffSignalModelCopyWith<$Res>  {
  factory $StaffSignalModelCopyWith(StaffSignalModel value, $Res Function(StaffSignalModel) _then) = _$StaffSignalModelCopyWithImpl;
@useResult
$Res call({
 String id, String reservationId, String reference, ArrivalKind kind,@JsonKey(unknownEnumValue: ArrivalSignalState.ended) ArrivalSignalState state, String customerName, String plate, int passengers, String? returnFlight, DateTime scheduledAt, DateTime startedAt, DateTime expiresAt, int? distanceM, int? etaMinutes, DateTime? etaAt, int? announcedMinutes, DateTime? atMeetingPointAt, SignalPositionModel? position, DateTime? positionUpdatedAt, int? positionAgeSeconds, MeetingPointModel? meetingPoint
});


$SignalPositionModelCopyWith<$Res>? get position;$MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class _$StaffSignalModelCopyWithImpl<$Res>
    implements $StaffSignalModelCopyWith<$Res> {
  _$StaffSignalModelCopyWithImpl(this._self, this._then);

  final StaffSignalModel _self;
  final $Res Function(StaffSignalModel) _then;

/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reservationId = null,Object? reference = null,Object? kind = null,Object? state = null,Object? customerName = null,Object? plate = null,Object? passengers = null,Object? returnFlight = freezed,Object? scheduledAt = null,Object? startedAt = null,Object? expiresAt = null,Object? distanceM = freezed,Object? etaMinutes = freezed,Object? etaAt = freezed,Object? announcedMinutes = freezed,Object? atMeetingPointAt = freezed,Object? position = freezed,Object? positionUpdatedAt = freezed,Object? positionAgeSeconds = freezed,Object? meetingPoint = freezed,}) {
  return _then(StaffSignalModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ArrivalKind,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as ArrivalSignalState,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: null == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,etaMinutes: freezed == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int?,etaAt: freezed == etaAt ? _self.etaAt : etaAt // ignore: cast_nullable_to_non_nullable
as DateTime?,announcedMinutes: freezed == announcedMinutes ? _self.announcedMinutes : announcedMinutes // ignore: cast_nullable_to_non_nullable
as int?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as SignalPositionModel?,positionUpdatedAt: freezed == positionUpdatedAt ? _self.positionUpdatedAt : positionUpdatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,positionAgeSeconds: freezed == positionAgeSeconds ? _self.positionAgeSeconds : positionAgeSeconds // ignore: cast_nullable_to_non_nullable
as int?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,
  ));
}
/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SignalPositionModelCopyWith<$Res>? get position {
    if (_self.position == null) {
    return null;
  }

  return $SignalPositionModelCopyWith<$Res>(_self.position!, (value) {
    return _then(_self.copyWith(position: value));
  });
}/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MeetingPointModelCopyWith<$Res>? get meetingPoint {
    if (_self.meetingPoint == null) {
    return null;
  }

  return $MeetingPointModelCopyWith<$Res>(_self.meetingPoint!, (value) {
    return _then(_self.copyWith(meetingPoint: value));
  });
}
}


/// Adds pattern-matching-related methods to [StaffSignalModel].
extension StaffSignalModelPatterns on StaffSignalModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StaffSignalModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StaffSignalModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StaffSignalModel value)  $default,){
final _that = this;
switch (_that) {
case _StaffSignalModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StaffSignalModel value)?  $default,){
final _that = this;
switch (_that) {
case _StaffSignalModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reservationId,  String reference,  ArrivalKind kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended)  ArrivalSignalState state,  String customerName,  String plate,  int passengers,  String? returnFlight,  DateTime scheduledAt,  DateTime startedAt,  DateTime expiresAt,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  int? announcedMinutes,  DateTime? atMeetingPointAt,  SignalPositionModel? position,  DateTime? positionUpdatedAt,  int? positionAgeSeconds,  MeetingPointModel? meetingPoint)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffSignalModel() when $default != null:
return $default(_that.id,_that.reservationId,_that.reference,_that.kind,_that.state,_that.customerName,_that.plate,_that.passengers,_that.returnFlight,_that.scheduledAt,_that.startedAt,_that.expiresAt,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.announcedMinutes,_that.atMeetingPointAt,_that.position,_that.positionUpdatedAt,_that.positionAgeSeconds,_that.meetingPoint);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reservationId,  String reference,  ArrivalKind kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended)  ArrivalSignalState state,  String customerName,  String plate,  int passengers,  String? returnFlight,  DateTime scheduledAt,  DateTime startedAt,  DateTime expiresAt,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  int? announcedMinutes,  DateTime? atMeetingPointAt,  SignalPositionModel? position,  DateTime? positionUpdatedAt,  int? positionAgeSeconds,  MeetingPointModel? meetingPoint)  $default,) {final _that = this;
switch (_that) {
case _StaffSignalModel():
return $default(_that.id,_that.reservationId,_that.reference,_that.kind,_that.state,_that.customerName,_that.plate,_that.passengers,_that.returnFlight,_that.scheduledAt,_that.startedAt,_that.expiresAt,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.announcedMinutes,_that.atMeetingPointAt,_that.position,_that.positionUpdatedAt,_that.positionAgeSeconds,_that.meetingPoint);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reservationId,  String reference,  ArrivalKind kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended)  ArrivalSignalState state,  String customerName,  String plate,  int passengers,  String? returnFlight,  DateTime scheduledAt,  DateTime startedAt,  DateTime expiresAt,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  int? announcedMinutes,  DateTime? atMeetingPointAt,  SignalPositionModel? position,  DateTime? positionUpdatedAt,  int? positionAgeSeconds,  MeetingPointModel? meetingPoint)?  $default,) {final _that = this;
switch (_that) {
case _StaffSignalModel() when $default != null:
return $default(_that.id,_that.reservationId,_that.reference,_that.kind,_that.state,_that.customerName,_that.plate,_that.passengers,_that.returnFlight,_that.scheduledAt,_that.startedAt,_that.expiresAt,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.announcedMinutes,_that.atMeetingPointAt,_that.position,_that.positionUpdatedAt,_that.positionAgeSeconds,_that.meetingPoint);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StaffSignalModel extends StaffSignalModel {
  const _StaffSignalModel({required this.id, required this.reservationId, required this.reference, required this.kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended) required this.state, required this.customerName, required this.plate, required this.passengers, this.returnFlight, required this.scheduledAt, required this.startedAt, required this.expiresAt, this.distanceM, this.etaMinutes, this.etaAt, this.announcedMinutes, this.atMeetingPointAt, this.position, this.positionUpdatedAt, this.positionAgeSeconds, this.meetingPoint}): super._();
  factory _StaffSignalModel.fromJson(Map<String, dynamic> json) => _$StaffSignalModelFromJson(json);

@override final  String id;
@override final  String reservationId;
@override final  String reference;
@override final  ArrivalKind kind;
@override@JsonKey(unknownEnumValue: ArrivalSignalState.ended) final  ArrivalSignalState state;
@override final  String customerName;
@override final  String plate;
@override final  int passengers;
@override final  String? returnFlight;
@override final  DateTime scheduledAt;
@override final  DateTime startedAt;
@override final  DateTime expiresAt;
@override final  int? distanceM;
@override final  int? etaMinutes;
@override final  DateTime? etaAt;
@override final  int? announcedMinutes;
@override final  DateTime? atMeetingPointAt;
@override final  SignalPositionModel? position;
@override final  DateTime? positionUpdatedAt;
@override final  int? positionAgeSeconds;
@override final  MeetingPointModel? meetingPoint;

/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StaffSignalModelCopyWith<_StaffSignalModel> get copyWith => __$StaffSignalModelCopyWithImpl<_StaffSignalModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StaffSignalModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffSignalModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.state, state) || other.state == state)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.etaMinutes, etaMinutes) || other.etaMinutes == etaMinutes)&&(identical(other.etaAt, etaAt) || other.etaAt == etaAt)&&(identical(other.announcedMinutes, announcedMinutes) || other.announcedMinutes == announcedMinutes)&&(identical(other.atMeetingPointAt, atMeetingPointAt) || other.atMeetingPointAt == atMeetingPointAt)&&(identical(other.position, position) || other.position == position)&&(identical(other.positionUpdatedAt, positionUpdatedAt) || other.positionUpdatedAt == positionUpdatedAt)&&(identical(other.positionAgeSeconds, positionAgeSeconds) || other.positionAgeSeconds == positionAgeSeconds)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,id,reservationId,reference,kind,state,customerName,plate,passengers,returnFlight,scheduledAt,startedAt,expiresAt,distanceM,etaMinutes,etaAt,announcedMinutes,atMeetingPointAt,position,positionUpdatedAt,positionAgeSeconds,meetingPoint]);
}

@override
String toString() {
    return 'StaffSignalModel(id: $id, reservationId: $reservationId, reference: $reference, kind: $kind, state: $state, customerName: $customerName, plate: $plate, passengers: $passengers, returnFlight: $returnFlight, scheduledAt: $scheduledAt, startedAt: $startedAt, expiresAt: $expiresAt, distanceM: $distanceM, etaMinutes: $etaMinutes, etaAt: $etaAt, announcedMinutes: $announcedMinutes, atMeetingPointAt: $atMeetingPointAt, position: $position, positionUpdatedAt: $positionUpdatedAt, positionAgeSeconds: $positionAgeSeconds, meetingPoint: $meetingPoint)';
}


}

/// @nodoc
abstract mixin class _$StaffSignalModelCopyWith<$Res> implements $StaffSignalModelCopyWith<$Res> {
  factory _$StaffSignalModelCopyWith(_StaffSignalModel value, $Res Function(_StaffSignalModel) _then) = __$StaffSignalModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reservationId, String reference, ArrivalKind kind,@JsonKey(unknownEnumValue: ArrivalSignalState.ended) ArrivalSignalState state, String customerName, String plate, int passengers, String? returnFlight, DateTime scheduledAt, DateTime startedAt, DateTime expiresAt, int? distanceM, int? etaMinutes, DateTime? etaAt, int? announcedMinutes, DateTime? atMeetingPointAt, SignalPositionModel? position, DateTime? positionUpdatedAt, int? positionAgeSeconds, MeetingPointModel? meetingPoint
});


@override $SignalPositionModelCopyWith<$Res>? get position;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class __$StaffSignalModelCopyWithImpl<$Res>
    implements _$StaffSignalModelCopyWith<$Res> {
  __$StaffSignalModelCopyWithImpl(this._self, this._then);

  final _StaffSignalModel _self;
  final $Res Function(_StaffSignalModel) _then;

/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reservationId = null,Object? reference = null,Object? kind = null,Object? state = null,Object? customerName = null,Object? plate = null,Object? passengers = null,Object? returnFlight = freezed,Object? scheduledAt = null,Object? startedAt = null,Object? expiresAt = null,Object? distanceM = freezed,Object? etaMinutes = freezed,Object? etaAt = freezed,Object? announcedMinutes = freezed,Object? atMeetingPointAt = freezed,Object? position = freezed,Object? positionUpdatedAt = freezed,Object? positionAgeSeconds = freezed,Object? meetingPoint = freezed,}) {
  return _then(_StaffSignalModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ArrivalKind,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as ArrivalSignalState,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: null == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,etaMinutes: freezed == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int?,etaAt: freezed == etaAt ? _self.etaAt : etaAt // ignore: cast_nullable_to_non_nullable
as DateTime?,announcedMinutes: freezed == announcedMinutes ? _self.announcedMinutes : announcedMinutes // ignore: cast_nullable_to_non_nullable
as int?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as SignalPositionModel?,positionUpdatedAt: freezed == positionUpdatedAt ? _self.positionUpdatedAt : positionUpdatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,positionAgeSeconds: freezed == positionAgeSeconds ? _self.positionAgeSeconds : positionAgeSeconds // ignore: cast_nullable_to_non_nullable
as int?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,
  ));
}

/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SignalPositionModelCopyWith<$Res>? get position {
    if (_self.position == null) {
    return null;
  }

  return $SignalPositionModelCopyWith<$Res>(_self.position!, (value) {
    return _then(_self.copyWith(position: value));
  });
}/// Create a copy of StaffSignalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MeetingPointModelCopyWith<$Res>? get meetingPoint {
    if (_self.meetingPoint == null) {
    return null;
  }

  return $MeetingPointModelCopyWith<$Res>(_self.meetingPoint!, (value) {
    return _then(_self.copyWith(meetingPoint: value));
  });
}
}


/// @nodoc
mixin _$LiveArrivalsModel {

 DateTime get serverTime; List<StaffSignalModel> get signals;
/// Create a copy of LiveArrivalsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LiveArrivalsModelCopyWith<LiveArrivalsModel> get copyWith => _$LiveArrivalsModelCopyWithImpl<LiveArrivalsModel>(this as LiveArrivalsModel, _$identity);

  /// Serializes this LiveArrivalsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LiveArrivalsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LiveArrivalsModel&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&const DeepCollectionEquality().equals(other.signals, _this.signals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LiveArrivalsModel;
  return Object.hash(runtimeType,_this.serverTime,const DeepCollectionEquality().hash(_this.signals));
}

@override
String toString() {
  final _this = this as LiveArrivalsModel;
  return 'LiveArrivalsModel(serverTime: ${_this.serverTime}, signals: ${_this.signals})';
}


}

/// @nodoc
abstract mixin class $LiveArrivalsModelCopyWith<$Res>  {
  factory $LiveArrivalsModelCopyWith(LiveArrivalsModel value, $Res Function(LiveArrivalsModel) _then) = _$LiveArrivalsModelCopyWithImpl;
@useResult
$Res call({
 DateTime serverTime, List<StaffSignalModel> signals
});




}
/// @nodoc
class _$LiveArrivalsModelCopyWithImpl<$Res>
    implements $LiveArrivalsModelCopyWith<$Res> {
  _$LiveArrivalsModelCopyWithImpl(this._self, this._then);

  final LiveArrivalsModel _self;
  final $Res Function(LiveArrivalsModel) _then;

/// Create a copy of LiveArrivalsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? serverTime = null,Object? signals = null,}) {
  return _then(LiveArrivalsModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,signals: null == signals ? _self.signals : signals // ignore: cast_nullable_to_non_nullable
as List<StaffSignalModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [LiveArrivalsModel].
extension LiveArrivalsModelPatterns on LiveArrivalsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LiveArrivalsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LiveArrivalsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LiveArrivalsModel value)  $default,){
final _that = this;
switch (_that) {
case _LiveArrivalsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LiveArrivalsModel value)?  $default,){
final _that = this;
switch (_that) {
case _LiveArrivalsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime serverTime,  List<StaffSignalModel> signals)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LiveArrivalsModel() when $default != null:
return $default(_that.serverTime,_that.signals);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime serverTime,  List<StaffSignalModel> signals)  $default,) {final _that = this;
switch (_that) {
case _LiveArrivalsModel():
return $default(_that.serverTime,_that.signals);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime serverTime,  List<StaffSignalModel> signals)?  $default,) {final _that = this;
switch (_that) {
case _LiveArrivalsModel() when $default != null:
return $default(_that.serverTime,_that.signals);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LiveArrivalsModel implements LiveArrivalsModel {
  const _LiveArrivalsModel({required this.serverTime,  List<StaffSignalModel> signals = const []}): _signals = signals;
  factory _LiveArrivalsModel.fromJson(Map<String, dynamic> json) => _$LiveArrivalsModelFromJson(json);

@override final  DateTime serverTime;
 final  List<StaffSignalModel> _signals;
@override@JsonKey() List<StaffSignalModel> get signals {
  if (_signals is EqualUnmodifiableListView) return _signals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_signals);
}


/// Create a copy of LiveArrivalsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LiveArrivalsModelCopyWith<_LiveArrivalsModel> get copyWith => __$LiveArrivalsModelCopyWithImpl<_LiveArrivalsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LiveArrivalsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LiveArrivalsModel&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&const DeepCollectionEquality().equals(other.signals, _signals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,serverTime,const DeepCollectionEquality().hash(_signals));
}

@override
String toString() {
    return 'LiveArrivalsModel(serverTime: $serverTime, signals: $signals)';
}


}

/// @nodoc
abstract mixin class _$LiveArrivalsModelCopyWith<$Res> implements $LiveArrivalsModelCopyWith<$Res> {
  factory _$LiveArrivalsModelCopyWith(_LiveArrivalsModel value, $Res Function(_LiveArrivalsModel) _then) = __$LiveArrivalsModelCopyWithImpl;
@override @useResult
$Res call({
 DateTime serverTime, List<StaffSignalModel> signals
});




}
/// @nodoc
class __$LiveArrivalsModelCopyWithImpl<$Res>
    implements _$LiveArrivalsModelCopyWith<$Res> {
  __$LiveArrivalsModelCopyWithImpl(this._self, this._then);

  final _LiveArrivalsModel _self;
  final $Res Function(_LiveArrivalsModel) _then;

/// Create a copy of LiveArrivalsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? serverTime = null,Object? signals = null,}) {
  return _then(_LiveArrivalsModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,signals: null == signals ? _self._signals : signals // ignore: cast_nullable_to_non_nullable
as List<StaffSignalModel>,
  ));
}


}

// dart format on
