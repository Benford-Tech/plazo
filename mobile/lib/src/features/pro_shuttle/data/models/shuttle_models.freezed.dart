// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shuttle_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PickupRowModel {

 String get reservationId; String get reference; String get customerName; int get passengers; String get plate; String get status; DateTime get returnAt; FlightViewModel get flight; String? get terminal;/// The stop serving this traveller (D-A); null: the airport.
 String? get stopId; String? get stopName; DateTime? get atMeetingPointAt;/// The running trip this traveller is on, if any.
 String? get tripId;/// E (06/10/2026): what the traveller signalled today ("mon vol a du retard", "bagage perdu").
 PickupNoticeModel? get notice;
/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PickupRowModelCopyWith<PickupRowModel> get copyWith => _$PickupRowModelCopyWithImpl<PickupRowModel>(this as PickupRowModel, _$identity);

  /// Serializes this PickupRowModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PickupRowModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PickupRowModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.flight, _this.flight) || other.flight == _this.flight)&&(identical(other.terminal, _this.terminal) || other.terminal == _this.terminal)&&(identical(other.stopId, _this.stopId) || other.stopId == _this.stopId)&&(identical(other.stopName, _this.stopName) || other.stopName == _this.stopName)&&(identical(other.atMeetingPointAt, _this.atMeetingPointAt) || other.atMeetingPointAt == _this.atMeetingPointAt)&&(identical(other.tripId, _this.tripId) || other.tripId == _this.tripId)&&(identical(other.notice, _this.notice) || other.notice == _this.notice));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PickupRowModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.status,_this.returnAt,_this.flight,_this.terminal,_this.stopId,_this.stopName,_this.atMeetingPointAt,_this.tripId,_this.notice);
}

@override
String toString() {
  final _this = this as PickupRowModel;
  return 'PickupRowModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, status: ${_this.status}, returnAt: ${_this.returnAt}, flight: ${_this.flight}, terminal: ${_this.terminal}, stopId: ${_this.stopId}, stopName: ${_this.stopName}, atMeetingPointAt: ${_this.atMeetingPointAt}, tripId: ${_this.tripId}, notice: ${_this.notice})';
}


}

/// @nodoc
abstract mixin class $PickupRowModelCopyWith<$Res>  {
  factory $PickupRowModelCopyWith(PickupRowModel value, $Res Function(PickupRowModel) _then) = _$PickupRowModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime returnAt, FlightViewModel flight, String? terminal, String? stopId, String? stopName, DateTime? atMeetingPointAt, String? tripId, PickupNoticeModel? notice
});


$FlightViewModelCopyWith<$Res> get flight;$PickupNoticeModelCopyWith<$Res>? get notice;

}
/// @nodoc
class _$PickupRowModelCopyWithImpl<$Res>
    implements $PickupRowModelCopyWith<$Res> {
  _$PickupRowModelCopyWithImpl(this._self, this._then);

  final PickupRowModel _self;
  final $Res Function(PickupRowModel) _then;

/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? returnAt = null,Object? flight = null,Object? terminal = freezed,Object? stopId = freezed,Object? stopName = freezed,Object? atMeetingPointAt = freezed,Object? tripId = freezed,Object? notice = freezed,}) {
  return _then(PickupRowModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,flight: null == flight ? _self.flight : flight // ignore: cast_nullable_to_non_nullable
as FlightViewModel,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as PickupNoticeModel?,
  ));
}
/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FlightViewModelCopyWith<$Res> get flight {
  
  return $FlightViewModelCopyWith<$Res>(_self.flight, (value) {
    return _then(_self.copyWith(flight: value));
  });
}/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PickupNoticeModelCopyWith<$Res>? get notice {
    if (_self.notice == null) {
    return null;
  }

  return $PickupNoticeModelCopyWith<$Res>(_self.notice!, (value) {
    return _then(_self.copyWith(notice: value));
  });
}
}


/// Adds pattern-matching-related methods to [PickupRowModel].
extension PickupRowModelPatterns on PickupRowModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PickupRowModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PickupRowModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PickupRowModel value)  $default,){
final _that = this;
switch (_that) {
case _PickupRowModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PickupRowModel value)?  $default,){
final _that = this;
switch (_that) {
case _PickupRowModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime returnAt,  FlightViewModel flight,  String? terminal,  String? stopId,  String? stopName,  DateTime? atMeetingPointAt,  String? tripId,  PickupNoticeModel? notice)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PickupRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.returnAt,_that.flight,_that.terminal,_that.stopId,_that.stopName,_that.atMeetingPointAt,_that.tripId,_that.notice);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime returnAt,  FlightViewModel flight,  String? terminal,  String? stopId,  String? stopName,  DateTime? atMeetingPointAt,  String? tripId,  PickupNoticeModel? notice)  $default,) {final _that = this;
switch (_that) {
case _PickupRowModel():
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.returnAt,_that.flight,_that.terminal,_that.stopId,_that.stopName,_that.atMeetingPointAt,_that.tripId,_that.notice);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime returnAt,  FlightViewModel flight,  String? terminal,  String? stopId,  String? stopName,  DateTime? atMeetingPointAt,  String? tripId,  PickupNoticeModel? notice)?  $default,) {final _that = this;
switch (_that) {
case _PickupRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.returnAt,_that.flight,_that.terminal,_that.stopId,_that.stopName,_that.atMeetingPointAt,_that.tripId,_that.notice);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PickupRowModel extends PickupRowModel {
  const _PickupRowModel({required this.reservationId, required this.reference, required this.customerName, required this.passengers, required this.plate, required this.status, required this.returnAt, this.flight = const FlightViewModel(), this.terminal, this.stopId, this.stopName, this.atMeetingPointAt, this.tripId, this.notice}): super._();
  factory _PickupRowModel.fromJson(Map<String, dynamic> json) => _$PickupRowModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String customerName;
@override final  int passengers;
@override final  String plate;
@override final  String status;
@override final  DateTime returnAt;
@override@JsonKey() final  FlightViewModel flight;
@override final  String? terminal;
/// The stop serving this traveller (D-A); null: the airport.
@override final  String? stopId;
@override final  String? stopName;
@override final  DateTime? atMeetingPointAt;
/// The running trip this traveller is on, if any.
@override final  String? tripId;
/// E (06/10/2026): what the traveller signalled today ("mon vol a du retard", "bagage perdu").
@override final  PickupNoticeModel? notice;

/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PickupRowModelCopyWith<_PickupRowModel> get copyWith => __$PickupRowModelCopyWithImpl<_PickupRowModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PickupRowModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PickupRowModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.flight, flight) || other.flight == flight)&&(identical(other.terminal, terminal) || other.terminal == terminal)&&(identical(other.stopId, stopId) || other.stopId == stopId)&&(identical(other.stopName, stopName) || other.stopName == stopName)&&(identical(other.atMeetingPointAt, atMeetingPointAt) || other.atMeetingPointAt == atMeetingPointAt)&&(identical(other.tripId, tripId) || other.tripId == tripId)&&(identical(other.notice, notice) || other.notice == notice));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,customerName,passengers,plate,status,returnAt,flight,terminal,stopId,stopName,atMeetingPointAt,tripId,notice);
}

@override
String toString() {
    return 'PickupRowModel(reservationId: $reservationId, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, status: $status, returnAt: $returnAt, flight: $flight, terminal: $terminal, stopId: $stopId, stopName: $stopName, atMeetingPointAt: $atMeetingPointAt, tripId: $tripId, notice: $notice)';
}


}

/// @nodoc
abstract mixin class _$PickupRowModelCopyWith<$Res> implements $PickupRowModelCopyWith<$Res> {
  factory _$PickupRowModelCopyWith(_PickupRowModel value, $Res Function(_PickupRowModel) _then) = __$PickupRowModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime returnAt, FlightViewModel flight, String? terminal, String? stopId, String? stopName, DateTime? atMeetingPointAt, String? tripId, PickupNoticeModel? notice
});


@override $FlightViewModelCopyWith<$Res> get flight;@override $PickupNoticeModelCopyWith<$Res>? get notice;

}
/// @nodoc
class __$PickupRowModelCopyWithImpl<$Res>
    implements _$PickupRowModelCopyWith<$Res> {
  __$PickupRowModelCopyWithImpl(this._self, this._then);

  final _PickupRowModel _self;
  final $Res Function(_PickupRowModel) _then;

/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? returnAt = null,Object? flight = null,Object? terminal = freezed,Object? stopId = freezed,Object? stopName = freezed,Object? atMeetingPointAt = freezed,Object? tripId = freezed,Object? notice = freezed,}) {
  return _then(_PickupRowModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,flight: null == flight ? _self.flight : flight // ignore: cast_nullable_to_non_nullable
as FlightViewModel,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as PickupNoticeModel?,
  ));
}

/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FlightViewModelCopyWith<$Res> get flight {
  
  return $FlightViewModelCopyWith<$Res>(_self.flight, (value) {
    return _then(_self.copyWith(flight: value));
  });
}/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PickupNoticeModelCopyWith<$Res>? get notice {
    if (_self.notice == null) {
    return null;
  }

  return $PickupNoticeModelCopyWith<$Res>(_self.notice!, (value) {
    return _then(_self.copyWith(notice: value));
  });
}
}


/// @nodoc
mixin _$PickupsModel {

 DateTime get serverTime; MeetingPointModel? get meetingPoint; List<PickupRowModel> get rows;
/// Create a copy of PickupsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PickupsModelCopyWith<PickupsModel> get copyWith => _$PickupsModelCopyWithImpl<PickupsModel>(this as PickupsModel, _$identity);

  /// Serializes this PickupsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PickupsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PickupsModel&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint)&&const DeepCollectionEquality().equals(other.rows, _this.rows));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PickupsModel;
  return Object.hash(runtimeType,_this.serverTime,_this.meetingPoint,const DeepCollectionEquality().hash(_this.rows));
}

@override
String toString() {
  final _this = this as PickupsModel;
  return 'PickupsModel(serverTime: ${_this.serverTime}, meetingPoint: ${_this.meetingPoint}, rows: ${_this.rows})';
}


}

/// @nodoc
abstract mixin class $PickupsModelCopyWith<$Res>  {
  factory $PickupsModelCopyWith(PickupsModel value, $Res Function(PickupsModel) _then) = _$PickupsModelCopyWithImpl;
@useResult
$Res call({
 DateTime serverTime, MeetingPointModel? meetingPoint, List<PickupRowModel> rows
});


$MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class _$PickupsModelCopyWithImpl<$Res>
    implements $PickupsModelCopyWith<$Res> {
  _$PickupsModelCopyWithImpl(this._self, this._then);

  final PickupsModel _self;
  final $Res Function(PickupsModel) _then;

/// Create a copy of PickupsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? serverTime = null,Object? meetingPoint = freezed,Object? rows = null,}) {
  return _then(PickupsModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,rows: null == rows ? _self.rows : rows // ignore: cast_nullable_to_non_nullable
as List<PickupRowModel>,
  ));
}
/// Create a copy of PickupsModel
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


/// Adds pattern-matching-related methods to [PickupsModel].
extension PickupsModelPatterns on PickupsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PickupsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PickupsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PickupsModel value)  $default,){
final _that = this;
switch (_that) {
case _PickupsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PickupsModel value)?  $default,){
final _that = this;
switch (_that) {
case _PickupsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime serverTime,  MeetingPointModel? meetingPoint,  List<PickupRowModel> rows)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PickupsModel() when $default != null:
return $default(_that.serverTime,_that.meetingPoint,_that.rows);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime serverTime,  MeetingPointModel? meetingPoint,  List<PickupRowModel> rows)  $default,) {final _that = this;
switch (_that) {
case _PickupsModel():
return $default(_that.serverTime,_that.meetingPoint,_that.rows);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime serverTime,  MeetingPointModel? meetingPoint,  List<PickupRowModel> rows)?  $default,) {final _that = this;
switch (_that) {
case _PickupsModel() when $default != null:
return $default(_that.serverTime,_that.meetingPoint,_that.rows);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PickupsModel implements PickupsModel {
  const _PickupsModel({required this.serverTime, this.meetingPoint,  List<PickupRowModel> rows = const []}): _rows = rows;
  factory _PickupsModel.fromJson(Map<String, dynamic> json) => _$PickupsModelFromJson(json);

@override final  DateTime serverTime;
@override final  MeetingPointModel? meetingPoint;
 final  List<PickupRowModel> _rows;
@override@JsonKey() List<PickupRowModel> get rows {
  if (_rows is EqualUnmodifiableListView) return _rows;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_rows);
}


/// Create a copy of PickupsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PickupsModelCopyWith<_PickupsModel> get copyWith => __$PickupsModelCopyWithImpl<_PickupsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PickupsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PickupsModel&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint)&&const DeepCollectionEquality().equals(other.rows, _rows));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,serverTime,meetingPoint,const DeepCollectionEquality().hash(_rows));
}

@override
String toString() {
    return 'PickupsModel(serverTime: $serverTime, meetingPoint: $meetingPoint, rows: $rows)';
}


}

/// @nodoc
abstract mixin class _$PickupsModelCopyWith<$Res> implements $PickupsModelCopyWith<$Res> {
  factory _$PickupsModelCopyWith(_PickupsModel value, $Res Function(_PickupsModel) _then) = __$PickupsModelCopyWithImpl;
@override @useResult
$Res call({
 DateTime serverTime, MeetingPointModel? meetingPoint, List<PickupRowModel> rows
});


@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class __$PickupsModelCopyWithImpl<$Res>
    implements _$PickupsModelCopyWith<$Res> {
  __$PickupsModelCopyWithImpl(this._self, this._then);

  final _PickupsModel _self;
  final $Res Function(_PickupsModel) _then;

/// Create a copy of PickupsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? serverTime = null,Object? meetingPoint = freezed,Object? rows = null,}) {
  return _then(_PickupsModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,rows: null == rows ? _self._rows : rows // ignore: cast_nullable_to_non_nullable
as List<PickupRowModel>,
  ));
}

/// Create a copy of PickupsModel
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
mixin _$ShuttleVehicleModel {

 String get id; String get model; String? get colour; String? get plate;/// Passenger seats, the driver's excluded (null: unknown).
 int? get seats; bool get inService;/// The usual driver, preselected in their app.
 String? get driverId; String? get driverName;/// Who took it today (V-A), null when free.
 String? get holderId; String? get holderName;
/// Create a copy of ShuttleVehicleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleVehicleModelCopyWith<ShuttleVehicleModel> get copyWith => _$ShuttleVehicleModelCopyWithImpl<ShuttleVehicleModel>(this as ShuttleVehicleModel, _$identity);

  /// Serializes this ShuttleVehicleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttleVehicleModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleVehicleModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.model, _this.model) || other.model == _this.model)&&(identical(other.colour, _this.colour) || other.colour == _this.colour)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.seats, _this.seats) || other.seats == _this.seats)&&(identical(other.inService, _this.inService) || other.inService == _this.inService)&&(identical(other.driverId, _this.driverId) || other.driverId == _this.driverId)&&(identical(other.driverName, _this.driverName) || other.driverName == _this.driverName)&&(identical(other.holderId, _this.holderId) || other.holderId == _this.holderId)&&(identical(other.holderName, _this.holderName) || other.holderName == _this.holderName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleVehicleModel;
  return Object.hash(runtimeType,_this.id,_this.model,_this.colour,_this.plate,_this.seats,_this.inService,_this.driverId,_this.driverName,_this.holderId,_this.holderName);
}

@override
String toString() {
  final _this = this as ShuttleVehicleModel;
  return 'ShuttleVehicleModel(id: ${_this.id}, model: ${_this.model}, colour: ${_this.colour}, plate: ${_this.plate}, seats: ${_this.seats}, inService: ${_this.inService}, driverId: ${_this.driverId}, driverName: ${_this.driverName}, holderId: ${_this.holderId}, holderName: ${_this.holderName})';
}


}

/// @nodoc
abstract mixin class $ShuttleVehicleModelCopyWith<$Res>  {
  factory $ShuttleVehicleModelCopyWith(ShuttleVehicleModel value, $Res Function(ShuttleVehicleModel) _then) = _$ShuttleVehicleModelCopyWithImpl;
@useResult
$Res call({
 String id, String model, String? colour, String? plate, int? seats, bool inService, String? driverId, String? driverName, String? holderId, String? holderName
});




}
/// @nodoc
class _$ShuttleVehicleModelCopyWithImpl<$Res>
    implements $ShuttleVehicleModelCopyWith<$Res> {
  _$ShuttleVehicleModelCopyWithImpl(this._self, this._then);

  final ShuttleVehicleModel _self;
  final $Res Function(ShuttleVehicleModel) _then;

/// Create a copy of ShuttleVehicleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? model = null,Object? colour = freezed,Object? plate = freezed,Object? seats = freezed,Object? inService = null,Object? driverId = freezed,Object? driverName = freezed,Object? holderId = freezed,Object? holderName = freezed,}) {
  return _then(ShuttleVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,model: null == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,inService: null == inService ? _self.inService : inService // ignore: cast_nullable_to_non_nullable
as bool,driverId: freezed == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String?,driverName: freezed == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String?,holderId: freezed == holderId ? _self.holderId : holderId // ignore: cast_nullable_to_non_nullable
as String?,holderName: freezed == holderName ? _self.holderName : holderName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ShuttleVehicleModel].
extension ShuttleVehicleModelPatterns on ShuttleVehicleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleVehicleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleVehicleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleVehicleModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleVehicleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleVehicleModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleVehicleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String model,  String? colour,  String? plate,  int? seats,  bool inService,  String? driverId,  String? driverName,  String? holderId,  String? holderName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleVehicleModel() when $default != null:
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats,_that.inService,_that.driverId,_that.driverName,_that.holderId,_that.holderName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String model,  String? colour,  String? plate,  int? seats,  bool inService,  String? driverId,  String? driverName,  String? holderId,  String? holderName)  $default,) {final _that = this;
switch (_that) {
case _ShuttleVehicleModel():
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats,_that.inService,_that.driverId,_that.driverName,_that.holderId,_that.holderName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String model,  String? colour,  String? plate,  int? seats,  bool inService,  String? driverId,  String? driverName,  String? holderId,  String? holderName)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleVehicleModel() when $default != null:
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats,_that.inService,_that.driverId,_that.driverName,_that.holderId,_that.holderName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleVehicleModel extends ShuttleVehicleModel {
  const _ShuttleVehicleModel({required this.id, required this.model, this.colour, this.plate, this.seats, this.inService = true, this.driverId, this.driverName, this.holderId, this.holderName}): super._();
  factory _ShuttleVehicleModel.fromJson(Map<String, dynamic> json) => _$ShuttleVehicleModelFromJson(json);

@override final  String id;
@override final  String model;
@override final  String? colour;
@override final  String? plate;
/// Passenger seats, the driver's excluded (null: unknown).
@override final  int? seats;
@override@JsonKey() final  bool inService;
/// The usual driver, preselected in their app.
@override final  String? driverId;
@override final  String? driverName;
/// Who took it today (V-A), null when free.
@override final  String? holderId;
@override final  String? holderName;

/// Create a copy of ShuttleVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleVehicleModelCopyWith<_ShuttleVehicleModel> get copyWith => __$ShuttleVehicleModelCopyWithImpl<_ShuttleVehicleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttleVehicleModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleVehicleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.model, model) || other.model == model)&&(identical(other.colour, colour) || other.colour == colour)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.seats, seats) || other.seats == seats)&&(identical(other.inService, inService) || other.inService == inService)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName)&&(identical(other.holderId, holderId) || other.holderId == holderId)&&(identical(other.holderName, holderName) || other.holderName == holderName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,model,colour,plate,seats,inService,driverId,driverName,holderId,holderName);
}

@override
String toString() {
    return 'ShuttleVehicleModel(id: $id, model: $model, colour: $colour, plate: $plate, seats: $seats, inService: $inService, driverId: $driverId, driverName: $driverName, holderId: $holderId, holderName: $holderName)';
}


}

/// @nodoc
abstract mixin class _$ShuttleVehicleModelCopyWith<$Res> implements $ShuttleVehicleModelCopyWith<$Res> {
  factory _$ShuttleVehicleModelCopyWith(_ShuttleVehicleModel value, $Res Function(_ShuttleVehicleModel) _then) = __$ShuttleVehicleModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String model, String? colour, String? plate, int? seats, bool inService, String? driverId, String? driverName, String? holderId, String? holderName
});




}
/// @nodoc
class __$ShuttleVehicleModelCopyWithImpl<$Res>
    implements _$ShuttleVehicleModelCopyWith<$Res> {
  __$ShuttleVehicleModelCopyWithImpl(this._self, this._then);

  final _ShuttleVehicleModel _self;
  final $Res Function(_ShuttleVehicleModel) _then;

/// Create a copy of ShuttleVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? model = null,Object? colour = freezed,Object? plate = freezed,Object? seats = freezed,Object? inService = null,Object? driverId = freezed,Object? driverName = freezed,Object? holderId = freezed,Object? holderName = freezed,}) {
  return _then(_ShuttleVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,model: null == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,inService: null == inService ? _self.inService : inService // ignore: cast_nullable_to_non_nullable
as bool,driverId: freezed == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String?,driverName: freezed == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String?,holderId: freezed == holderId ? _self.holderId : holderId // ignore: cast_nullable_to_non_nullable
as String?,holderName: freezed == holderName ? _self.holderName : holderName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$DepartureRowModel {

 String get reservationId; String get reference; String get customerName; int get passengers; String get plate; String get status; DateTime get arrivalAt; DateTime? get arrivedAt;/// Spot code, when the vehicle was placed.
 String? get spot; String? get stopId; String? get stopName; String? get tripId;
/// Create a copy of DepartureRowModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DepartureRowModelCopyWith<DepartureRowModel> get copyWith => _$DepartureRowModelCopyWithImpl<DepartureRowModel>(this as DepartureRowModel, _$identity);

  /// Serializes this DepartureRowModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DepartureRowModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DepartureRowModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.arrivedAt, _this.arrivedAt) || other.arrivedAt == _this.arrivedAt)&&(identical(other.spot, _this.spot) || other.spot == _this.spot)&&(identical(other.stopId, _this.stopId) || other.stopId == _this.stopId)&&(identical(other.stopName, _this.stopName) || other.stopName == _this.stopName)&&(identical(other.tripId, _this.tripId) || other.tripId == _this.tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DepartureRowModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.status,_this.arrivalAt,_this.arrivedAt,_this.spot,_this.stopId,_this.stopName,_this.tripId);
}

@override
String toString() {
  final _this = this as DepartureRowModel;
  return 'DepartureRowModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, arrivedAt: ${_this.arrivedAt}, spot: ${_this.spot}, stopId: ${_this.stopId}, stopName: ${_this.stopName}, tripId: ${_this.tripId})';
}


}

/// @nodoc
abstract mixin class $DepartureRowModelCopyWith<$Res>  {
  factory $DepartureRowModelCopyWith(DepartureRowModel value, $Res Function(DepartureRowModel) _then) = _$DepartureRowModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime arrivalAt, DateTime? arrivedAt, String? spot, String? stopId, String? stopName, String? tripId
});




}
/// @nodoc
class _$DepartureRowModelCopyWithImpl<$Res>
    implements $DepartureRowModelCopyWith<$Res> {
  _$DepartureRowModelCopyWithImpl(this._self, this._then);

  final DepartureRowModel _self;
  final $Res Function(DepartureRowModel) _then;

/// Create a copy of DepartureRowModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? arrivedAt = freezed,Object? spot = freezed,Object? stopId = freezed,Object? stopName = freezed,Object? tripId = freezed,}) {
  return _then(DepartureRowModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,arrivedAt: freezed == arrivedAt ? _self.arrivedAt : arrivedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as String?,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [DepartureRowModel].
extension DepartureRowModelPatterns on DepartureRowModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DepartureRowModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DepartureRowModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DepartureRowModel value)  $default,){
final _that = this;
switch (_that) {
case _DepartureRowModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DepartureRowModel value)?  $default,){
final _that = this;
switch (_that) {
case _DepartureRowModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime arrivalAt,  DateTime? arrivedAt,  String? spot,  String? stopId,  String? stopName,  String? tripId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DepartureRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.arrivedAt,_that.spot,_that.stopId,_that.stopName,_that.tripId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime arrivalAt,  DateTime? arrivedAt,  String? spot,  String? stopId,  String? stopName,  String? tripId)  $default,) {final _that = this;
switch (_that) {
case _DepartureRowModel():
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.arrivedAt,_that.spot,_that.stopId,_that.stopName,_that.tripId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime arrivalAt,  DateTime? arrivedAt,  String? spot,  String? stopId,  String? stopName,  String? tripId)?  $default,) {final _that = this;
switch (_that) {
case _DepartureRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.arrivedAt,_that.spot,_that.stopId,_that.stopName,_that.tripId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DepartureRowModel implements DepartureRowModel {
  const _DepartureRowModel({required this.reservationId, required this.reference, required this.customerName, required this.passengers, required this.plate, required this.status, required this.arrivalAt, this.arrivedAt, this.spot, this.stopId, this.stopName, this.tripId});
  factory _DepartureRowModel.fromJson(Map<String, dynamic> json) => _$DepartureRowModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String customerName;
@override final  int passengers;
@override final  String plate;
@override final  String status;
@override final  DateTime arrivalAt;
@override final  DateTime? arrivedAt;
/// Spot code, when the vehicle was placed.
@override final  String? spot;
@override final  String? stopId;
@override final  String? stopName;
@override final  String? tripId;

/// Create a copy of DepartureRowModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DepartureRowModelCopyWith<_DepartureRowModel> get copyWith => __$DepartureRowModelCopyWithImpl<_DepartureRowModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DepartureRowModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DepartureRowModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.arrivedAt, arrivedAt) || other.arrivedAt == arrivedAt)&&(identical(other.spot, spot) || other.spot == spot)&&(identical(other.stopId, stopId) || other.stopId == stopId)&&(identical(other.stopName, stopName) || other.stopName == stopName)&&(identical(other.tripId, tripId) || other.tripId == tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,customerName,passengers,plate,status,arrivalAt,arrivedAt,spot,stopId,stopName,tripId);
}

@override
String toString() {
    return 'DepartureRowModel(reservationId: $reservationId, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, status: $status, arrivalAt: $arrivalAt, arrivedAt: $arrivedAt, spot: $spot, stopId: $stopId, stopName: $stopName, tripId: $tripId)';
}


}

/// @nodoc
abstract mixin class _$DepartureRowModelCopyWith<$Res> implements $DepartureRowModelCopyWith<$Res> {
  factory _$DepartureRowModelCopyWith(_DepartureRowModel value, $Res Function(_DepartureRowModel) _then) = __$DepartureRowModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime arrivalAt, DateTime? arrivedAt, String? spot, String? stopId, String? stopName, String? tripId
});




}
/// @nodoc
class __$DepartureRowModelCopyWithImpl<$Res>
    implements _$DepartureRowModelCopyWith<$Res> {
  __$DepartureRowModelCopyWithImpl(this._self, this._then);

  final _DepartureRowModel _self;
  final $Res Function(_DepartureRowModel) _then;

/// Create a copy of DepartureRowModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? arrivedAt = freezed,Object? spot = freezed,Object? stopId = freezed,Object? stopName = freezed,Object? tripId = freezed,}) {
  return _then(_DepartureRowModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,arrivedAt: freezed == arrivedAt ? _self.arrivedAt : arrivedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as String?,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$DeparturesModel {

 DateTime get serverTime; List<DepartureRowModel> get rows;
/// Create a copy of DeparturesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DeparturesModelCopyWith<DeparturesModel> get copyWith => _$DeparturesModelCopyWithImpl<DeparturesModel>(this as DeparturesModel, _$identity);

  /// Serializes this DeparturesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DeparturesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DeparturesModel&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&const DeepCollectionEquality().equals(other.rows, _this.rows));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DeparturesModel;
  return Object.hash(runtimeType,_this.serverTime,const DeepCollectionEquality().hash(_this.rows));
}

@override
String toString() {
  final _this = this as DeparturesModel;
  return 'DeparturesModel(serverTime: ${_this.serverTime}, rows: ${_this.rows})';
}


}

/// @nodoc
abstract mixin class $DeparturesModelCopyWith<$Res>  {
  factory $DeparturesModelCopyWith(DeparturesModel value, $Res Function(DeparturesModel) _then) = _$DeparturesModelCopyWithImpl;
@useResult
$Res call({
 DateTime serverTime, List<DepartureRowModel> rows
});




}
/// @nodoc
class _$DeparturesModelCopyWithImpl<$Res>
    implements $DeparturesModelCopyWith<$Res> {
  _$DeparturesModelCopyWithImpl(this._self, this._then);

  final DeparturesModel _self;
  final $Res Function(DeparturesModel) _then;

/// Create a copy of DeparturesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? serverTime = null,Object? rows = null,}) {
  return _then(DeparturesModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,rows: null == rows ? _self.rows : rows // ignore: cast_nullable_to_non_nullable
as List<DepartureRowModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [DeparturesModel].
extension DeparturesModelPatterns on DeparturesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DeparturesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DeparturesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DeparturesModel value)  $default,){
final _that = this;
switch (_that) {
case _DeparturesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DeparturesModel value)?  $default,){
final _that = this;
switch (_that) {
case _DeparturesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime serverTime,  List<DepartureRowModel> rows)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DeparturesModel() when $default != null:
return $default(_that.serverTime,_that.rows);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime serverTime,  List<DepartureRowModel> rows)  $default,) {final _that = this;
switch (_that) {
case _DeparturesModel():
return $default(_that.serverTime,_that.rows);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime serverTime,  List<DepartureRowModel> rows)?  $default,) {final _that = this;
switch (_that) {
case _DeparturesModel() when $default != null:
return $default(_that.serverTime,_that.rows);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DeparturesModel implements DeparturesModel {
  const _DeparturesModel({required this.serverTime,  List<DepartureRowModel> rows = const []}): _rows = rows;
  factory _DeparturesModel.fromJson(Map<String, dynamic> json) => _$DeparturesModelFromJson(json);

@override final  DateTime serverTime;
 final  List<DepartureRowModel> _rows;
@override@JsonKey() List<DepartureRowModel> get rows {
  if (_rows is EqualUnmodifiableListView) return _rows;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_rows);
}


/// Create a copy of DeparturesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DeparturesModelCopyWith<_DeparturesModel> get copyWith => __$DeparturesModelCopyWithImpl<_DeparturesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DeparturesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DeparturesModel&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&const DeepCollectionEquality().equals(other.rows, _rows));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,serverTime,const DeepCollectionEquality().hash(_rows));
}

@override
String toString() {
    return 'DeparturesModel(serverTime: $serverTime, rows: $rows)';
}


}

/// @nodoc
abstract mixin class _$DeparturesModelCopyWith<$Res> implements $DeparturesModelCopyWith<$Res> {
  factory _$DeparturesModelCopyWith(_DeparturesModel value, $Res Function(_DeparturesModel) _then) = __$DeparturesModelCopyWithImpl;
@override @useResult
$Res call({
 DateTime serverTime, List<DepartureRowModel> rows
});




}
/// @nodoc
class __$DeparturesModelCopyWithImpl<$Res>
    implements _$DeparturesModelCopyWith<$Res> {
  __$DeparturesModelCopyWithImpl(this._self, this._then);

  final _DeparturesModel _self;
  final $Res Function(_DeparturesModel) _then;

/// Create a copy of DeparturesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? serverTime = null,Object? rows = null,}) {
  return _then(_DeparturesModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,rows: null == rows ? _self._rows : rows // ignore: cast_nullable_to_non_nullable
as List<DepartureRowModel>,
  ));
}


}


/// @nodoc
mixin _$TripPassengerModel {

 String get reservationId; String get reference; String get customerName; int get passengers; String get plate; String? get terminal;
/// Create a copy of TripPassengerModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TripPassengerModelCopyWith<TripPassengerModel> get copyWith => _$TripPassengerModelCopyWithImpl<TripPassengerModel>(this as TripPassengerModel, _$identity);

  /// Serializes this TripPassengerModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TripPassengerModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TripPassengerModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.terminal, _this.terminal) || other.terminal == _this.terminal));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TripPassengerModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.terminal);
}

@override
String toString() {
  final _this = this as TripPassengerModel;
  return 'TripPassengerModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, terminal: ${_this.terminal})';
}


}

/// @nodoc
abstract mixin class $TripPassengerModelCopyWith<$Res>  {
  factory $TripPassengerModelCopyWith(TripPassengerModel value, $Res Function(TripPassengerModel) _then) = _$TripPassengerModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String? terminal
});




}
/// @nodoc
class _$TripPassengerModelCopyWithImpl<$Res>
    implements $TripPassengerModelCopyWith<$Res> {
  _$TripPassengerModelCopyWithImpl(this._self, this._then);

  final TripPassengerModel _self;
  final $Res Function(TripPassengerModel) _then;

/// Create a copy of TripPassengerModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? terminal = freezed,}) {
  return _then(TripPassengerModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [TripPassengerModel].
extension TripPassengerModelPatterns on TripPassengerModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TripPassengerModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TripPassengerModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TripPassengerModel value)  $default,){
final _that = this;
switch (_that) {
case _TripPassengerModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TripPassengerModel value)?  $default,){
final _that = this;
switch (_that) {
case _TripPassengerModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String? terminal)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TripPassengerModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.terminal);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String? terminal)  $default,) {final _that = this;
switch (_that) {
case _TripPassengerModel():
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.terminal);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String? terminal)?  $default,) {final _that = this;
switch (_that) {
case _TripPassengerModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.terminal);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TripPassengerModel implements TripPassengerModel {
  const _TripPassengerModel({required this.reservationId, required this.reference, required this.customerName, required this.passengers, required this.plate, this.terminal});
  factory _TripPassengerModel.fromJson(Map<String, dynamic> json) => _$TripPassengerModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String customerName;
@override final  int passengers;
@override final  String plate;
@override final  String? terminal;

/// Create a copy of TripPassengerModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TripPassengerModelCopyWith<_TripPassengerModel> get copyWith => __$TripPassengerModelCopyWithImpl<_TripPassengerModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TripPassengerModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TripPassengerModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.terminal, terminal) || other.terminal == terminal));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,customerName,passengers,plate,terminal);
}

@override
String toString() {
    return 'TripPassengerModel(reservationId: $reservationId, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, terminal: $terminal)';
}


}

/// @nodoc
abstract mixin class _$TripPassengerModelCopyWith<$Res> implements $TripPassengerModelCopyWith<$Res> {
  factory _$TripPassengerModelCopyWith(_TripPassengerModel value, $Res Function(_TripPassengerModel) _then) = __$TripPassengerModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String? terminal
});




}
/// @nodoc
class __$TripPassengerModelCopyWithImpl<$Res>
    implements _$TripPassengerModelCopyWith<$Res> {
  __$TripPassengerModelCopyWithImpl(this._self, this._then);

  final _TripPassengerModel _self;
  final $Res Function(_TripPassengerModel) _then;

/// Create a copy of TripPassengerModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? terminal = freezed,}) {
  return _then(_TripPassengerModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$StaffTripModel {

 String get id; String get status;/// `pickup`: to the airport for returning travellers; `dropoff`: to the terminal with arrived ones.
 String get direction; String get driverId; String get driverName; TripVehicleModel get vehicle; DateTime get startedAt; DateTime get expiresAt; DateTime? get endedAt; String? get endReason; int get secondsLeft; List<TripPassengerModel> get passengers; DateTime? get positionUpdatedAt; MeetingPointModel? get meetingPoint;/// Where the trip goes (D-A): the chosen stop, else the airport's meeting point.
 ShuttleStopModel? get stop;
/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StaffTripModelCopyWith<StaffTripModel> get copyWith => _$StaffTripModelCopyWithImpl<StaffTripModel>(this as StaffTripModel, _$identity);

  /// Serializes this StaffTripModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as StaffTripModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffTripModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&(identical(other.driverId, _this.driverId) || other.driverId == _this.driverId)&&(identical(other.driverName, _this.driverName) || other.driverName == _this.driverName)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt)&&(identical(other.endedAt, _this.endedAt) || other.endedAt == _this.endedAt)&&(identical(other.endReason, _this.endReason) || other.endReason == _this.endReason)&&(identical(other.secondsLeft, _this.secondsLeft) || other.secondsLeft == _this.secondsLeft)&&const DeepCollectionEquality().equals(other.passengers, _this.passengers)&&(identical(other.positionUpdatedAt, _this.positionUpdatedAt) || other.positionUpdatedAt == _this.positionUpdatedAt)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint)&&(identical(other.stop, _this.stop) || other.stop == _this.stop));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StaffTripModel;
  return Object.hash(runtimeType,_this.id,_this.status,_this.direction,_this.driverId,_this.driverName,_this.vehicle,_this.startedAt,_this.expiresAt,_this.endedAt,_this.endReason,_this.secondsLeft,const DeepCollectionEquality().hash(_this.passengers),_this.positionUpdatedAt,_this.meetingPoint,_this.stop);
}

@override
String toString() {
  final _this = this as StaffTripModel;
  return 'StaffTripModel(id: ${_this.id}, status: ${_this.status}, direction: ${_this.direction}, driverId: ${_this.driverId}, driverName: ${_this.driverName}, vehicle: ${_this.vehicle}, startedAt: ${_this.startedAt}, expiresAt: ${_this.expiresAt}, endedAt: ${_this.endedAt}, endReason: ${_this.endReason}, secondsLeft: ${_this.secondsLeft}, passengers: ${_this.passengers}, positionUpdatedAt: ${_this.positionUpdatedAt}, meetingPoint: ${_this.meetingPoint}, stop: ${_this.stop})';
}


}

/// @nodoc
abstract mixin class $StaffTripModelCopyWith<$Res>  {
  factory $StaffTripModelCopyWith(StaffTripModel value, $Res Function(StaffTripModel) _then) = _$StaffTripModelCopyWithImpl;
@useResult
$Res call({
 String id, String status, String direction, String driverId, String driverName, TripVehicleModel vehicle, DateTime startedAt, DateTime expiresAt, DateTime? endedAt, String? endReason, int secondsLeft, List<TripPassengerModel> passengers, DateTime? positionUpdatedAt, MeetingPointModel? meetingPoint, ShuttleStopModel? stop
});


$TripVehicleModelCopyWith<$Res> get vehicle;$MeetingPointModelCopyWith<$Res>? get meetingPoint;$ShuttleStopModelCopyWith<$Res>? get stop;

}
/// @nodoc
class _$StaffTripModelCopyWithImpl<$Res>
    implements $StaffTripModelCopyWith<$Res> {
  _$StaffTripModelCopyWithImpl(this._self, this._then);

  final StaffTripModel _self;
  final $Res Function(StaffTripModel) _then;

/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? status = null,Object? direction = null,Object? driverId = null,Object? driverName = null,Object? vehicle = null,Object? startedAt = null,Object? expiresAt = null,Object? endedAt = freezed,Object? endReason = freezed,Object? secondsLeft = null,Object? passengers = null,Object? positionUpdatedAt = freezed,Object? meetingPoint = freezed,Object? stop = freezed,}) {
  return _then(StaffTripModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,driverId: null == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String,driverName: null == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String,vehicle: null == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleModel,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,endedAt: freezed == endedAt ? _self.endedAt : endedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,endReason: freezed == endReason ? _self.endReason : endReason // ignore: cast_nullable_to_non_nullable
as String?,secondsLeft: null == secondsLeft ? _self.secondsLeft : secondsLeft // ignore: cast_nullable_to_non_nullable
as int,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as List<TripPassengerModel>,positionUpdatedAt: freezed == positionUpdatedAt ? _self.positionUpdatedAt : positionUpdatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,stop: freezed == stop ? _self.stop : stop // ignore: cast_nullable_to_non_nullable
as ShuttleStopModel?,
  ));
}
/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<$Res> get vehicle {
  
  return $TripVehicleModelCopyWith<$Res>(_self.vehicle, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of StaffTripModel
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
}/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleStopModelCopyWith<$Res>? get stop {
    if (_self.stop == null) {
    return null;
  }

  return $ShuttleStopModelCopyWith<$Res>(_self.stop!, (value) {
    return _then(_self.copyWith(stop: value));
  });
}
}


/// Adds pattern-matching-related methods to [StaffTripModel].
extension StaffTripModelPatterns on StaffTripModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StaffTripModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StaffTripModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StaffTripModel value)  $default,){
final _that = this;
switch (_that) {
case _StaffTripModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StaffTripModel value)?  $default,){
final _that = this;
switch (_that) {
case _StaffTripModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String status,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  DateTime startedAt,  DateTime expiresAt,  DateTime? endedAt,  String? endReason,  int secondsLeft,  List<TripPassengerModel> passengers,  DateTime? positionUpdatedAt,  MeetingPointModel? meetingPoint,  ShuttleStopModel? stop)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffTripModel() when $default != null:
return $default(_that.id,_that.status,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.startedAt,_that.expiresAt,_that.endedAt,_that.endReason,_that.secondsLeft,_that.passengers,_that.positionUpdatedAt,_that.meetingPoint,_that.stop);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String status,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  DateTime startedAt,  DateTime expiresAt,  DateTime? endedAt,  String? endReason,  int secondsLeft,  List<TripPassengerModel> passengers,  DateTime? positionUpdatedAt,  MeetingPointModel? meetingPoint,  ShuttleStopModel? stop)  $default,) {final _that = this;
switch (_that) {
case _StaffTripModel():
return $default(_that.id,_that.status,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.startedAt,_that.expiresAt,_that.endedAt,_that.endReason,_that.secondsLeft,_that.passengers,_that.positionUpdatedAt,_that.meetingPoint,_that.stop);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String status,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  DateTime startedAt,  DateTime expiresAt,  DateTime? endedAt,  String? endReason,  int secondsLeft,  List<TripPassengerModel> passengers,  DateTime? positionUpdatedAt,  MeetingPointModel? meetingPoint,  ShuttleStopModel? stop)?  $default,) {final _that = this;
switch (_that) {
case _StaffTripModel() when $default != null:
return $default(_that.id,_that.status,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.startedAt,_that.expiresAt,_that.endedAt,_that.endReason,_that.secondsLeft,_that.passengers,_that.positionUpdatedAt,_that.meetingPoint,_that.stop);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StaffTripModel extends StaffTripModel {
  const _StaffTripModel({required this.id, required this.status, this.direction = 'pickup', required this.driverId, required this.driverName, this.vehicle = const TripVehicleModel(), required this.startedAt, required this.expiresAt, this.endedAt, this.endReason, this.secondsLeft = 0,  List<TripPassengerModel> passengers = const [], this.positionUpdatedAt, this.meetingPoint, this.stop}): _passengers = passengers,super._();
  factory _StaffTripModel.fromJson(Map<String, dynamic> json) => _$StaffTripModelFromJson(json);

@override final  String id;
@override final  String status;
/// `pickup`: to the airport for returning travellers; `dropoff`: to the terminal with arrived ones.
@override@JsonKey() final  String direction;
@override final  String driverId;
@override final  String driverName;
@override@JsonKey() final  TripVehicleModel vehicle;
@override final  DateTime startedAt;
@override final  DateTime expiresAt;
@override final  DateTime? endedAt;
@override final  String? endReason;
@override@JsonKey() final  int secondsLeft;
 final  List<TripPassengerModel> _passengers;
@override@JsonKey() List<TripPassengerModel> get passengers {
  if (_passengers is EqualUnmodifiableListView) return _passengers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_passengers);
}

@override final  DateTime? positionUpdatedAt;
@override final  MeetingPointModel? meetingPoint;
/// Where the trip goes (D-A): the chosen stop, else the airport's meeting point.
@override final  ShuttleStopModel? stop;

/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StaffTripModelCopyWith<_StaffTripModel> get copyWith => __$StaffTripModelCopyWithImpl<_StaffTripModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StaffTripModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffTripModel&&(identical(other.id, id) || other.id == id)&&(identical(other.status, status) || other.status == status)&&(identical(other.direction, direction) || other.direction == direction)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.endedAt, endedAt) || other.endedAt == endedAt)&&(identical(other.endReason, endReason) || other.endReason == endReason)&&(identical(other.secondsLeft, secondsLeft) || other.secondsLeft == secondsLeft)&&const DeepCollectionEquality().equals(other.passengers, _passengers)&&(identical(other.positionUpdatedAt, positionUpdatedAt) || other.positionUpdatedAt == positionUpdatedAt)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint)&&(identical(other.stop, stop) || other.stop == stop));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,status,direction,driverId,driverName,vehicle,startedAt,expiresAt,endedAt,endReason,secondsLeft,const DeepCollectionEquality().hash(_passengers),positionUpdatedAt,meetingPoint,stop);
}

@override
String toString() {
    return 'StaffTripModel(id: $id, status: $status, direction: $direction, driverId: $driverId, driverName: $driverName, vehicle: $vehicle, startedAt: $startedAt, expiresAt: $expiresAt, endedAt: $endedAt, endReason: $endReason, secondsLeft: $secondsLeft, passengers: $passengers, positionUpdatedAt: $positionUpdatedAt, meetingPoint: $meetingPoint, stop: $stop)';
}


}

/// @nodoc
abstract mixin class _$StaffTripModelCopyWith<$Res> implements $StaffTripModelCopyWith<$Res> {
  factory _$StaffTripModelCopyWith(_StaffTripModel value, $Res Function(_StaffTripModel) _then) = __$StaffTripModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String status, String direction, String driverId, String driverName, TripVehicleModel vehicle, DateTime startedAt, DateTime expiresAt, DateTime? endedAt, String? endReason, int secondsLeft, List<TripPassengerModel> passengers, DateTime? positionUpdatedAt, MeetingPointModel? meetingPoint, ShuttleStopModel? stop
});


@override $TripVehicleModelCopyWith<$Res> get vehicle;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;@override $ShuttleStopModelCopyWith<$Res>? get stop;

}
/// @nodoc
class __$StaffTripModelCopyWithImpl<$Res>
    implements _$StaffTripModelCopyWith<$Res> {
  __$StaffTripModelCopyWithImpl(this._self, this._then);

  final _StaffTripModel _self;
  final $Res Function(_StaffTripModel) _then;

/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? status = null,Object? direction = null,Object? driverId = null,Object? driverName = null,Object? vehicle = null,Object? startedAt = null,Object? expiresAt = null,Object? endedAt = freezed,Object? endReason = freezed,Object? secondsLeft = null,Object? passengers = null,Object? positionUpdatedAt = freezed,Object? meetingPoint = freezed,Object? stop = freezed,}) {
  return _then(_StaffTripModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,driverId: null == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String,driverName: null == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String,vehicle: null == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleModel,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,endedAt: freezed == endedAt ? _self.endedAt : endedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,endReason: freezed == endReason ? _self.endReason : endReason // ignore: cast_nullable_to_non_nullable
as String?,secondsLeft: null == secondsLeft ? _self.secondsLeft : secondsLeft // ignore: cast_nullable_to_non_nullable
as int,passengers: null == passengers ? _self._passengers : passengers // ignore: cast_nullable_to_non_nullable
as List<TripPassengerModel>,positionUpdatedAt: freezed == positionUpdatedAt ? _self.positionUpdatedAt : positionUpdatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,stop: freezed == stop ? _self.stop : stop // ignore: cast_nullable_to_non_nullable
as ShuttleStopModel?,
  ));
}

/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<$Res> get vehicle {
  
  return $TripVehicleModelCopyWith<$Res>(_self.vehicle, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of StaffTripModel
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
}/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleStopModelCopyWith<$Res>? get stop {
    if (_self.stop == null) {
    return null;
  }

  return $ShuttleStopModelCopyWith<$Res>(_self.stop!, (value) {
    return _then(_self.copyWith(stop: value));
  });
}
}


/// @nodoc
mixin _$ShuttleStopModel {

 String? get id; String get kind; String get name; double get lat; double get lng; String? get instructions; bool get builtIn;
/// Create a copy of ShuttleStopModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleStopModelCopyWith<ShuttleStopModel> get copyWith => _$ShuttleStopModelCopyWithImpl<ShuttleStopModel>(this as ShuttleStopModel, _$identity);

  /// Serializes this ShuttleStopModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttleStopModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleStopModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng)&&(identical(other.instructions, _this.instructions) || other.instructions == _this.instructions)&&(identical(other.builtIn, _this.builtIn) || other.builtIn == _this.builtIn));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleStopModel;
  return Object.hash(runtimeType,_this.id,_this.kind,_this.name,_this.lat,_this.lng,_this.instructions,_this.builtIn);
}

@override
String toString() {
  final _this = this as ShuttleStopModel;
  return 'ShuttleStopModel(id: ${_this.id}, kind: ${_this.kind}, name: ${_this.name}, lat: ${_this.lat}, lng: ${_this.lng}, instructions: ${_this.instructions}, builtIn: ${_this.builtIn})';
}


}

/// @nodoc
abstract mixin class $ShuttleStopModelCopyWith<$Res>  {
  factory $ShuttleStopModelCopyWith(ShuttleStopModel value, $Res Function(ShuttleStopModel) _then) = _$ShuttleStopModelCopyWithImpl;
@useResult
$Res call({
 String? id, String kind, String name, double lat, double lng, String? instructions, bool builtIn
});




}
/// @nodoc
class _$ShuttleStopModelCopyWithImpl<$Res>
    implements $ShuttleStopModelCopyWith<$Res> {
  _$ShuttleStopModelCopyWithImpl(this._self, this._then);

  final ShuttleStopModel _self;
  final $Res Function(ShuttleStopModel) _then;

/// Create a copy of ShuttleStopModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? kind = null,Object? name = null,Object? lat = null,Object? lng = null,Object? instructions = freezed,Object? builtIn = null,}) {
  return _then(ShuttleStopModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,instructions: freezed == instructions ? _self.instructions : instructions // ignore: cast_nullable_to_non_nullable
as String?,builtIn: null == builtIn ? _self.builtIn : builtIn // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ShuttleStopModel].
extension ShuttleStopModelPatterns on ShuttleStopModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleStopModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleStopModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleStopModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleStopModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleStopModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleStopModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? id,  String kind,  String name,  double lat,  double lng,  String? instructions,  bool builtIn)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleStopModel() when $default != null:
return $default(_that.id,_that.kind,_that.name,_that.lat,_that.lng,_that.instructions,_that.builtIn);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? id,  String kind,  String name,  double lat,  double lng,  String? instructions,  bool builtIn)  $default,) {final _that = this;
switch (_that) {
case _ShuttleStopModel():
return $default(_that.id,_that.kind,_that.name,_that.lat,_that.lng,_that.instructions,_that.builtIn);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? id,  String kind,  String name,  double lat,  double lng,  String? instructions,  bool builtIn)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleStopModel() when $default != null:
return $default(_that.id,_that.kind,_that.name,_that.lat,_that.lng,_that.instructions,_that.builtIn);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleStopModel extends ShuttleStopModel {
  const _ShuttleStopModel({this.id, this.kind = 'other', required this.name, required this.lat, required this.lng, this.instructions, this.builtIn = false}): super._();
  factory _ShuttleStopModel.fromJson(Map<String, dynamic> json) => _$ShuttleStopModelFromJson(json);

@override final  String? id;
@override@JsonKey() final  String kind;
@override final  String name;
@override final  double lat;
@override final  double lng;
@override final  String? instructions;
@override@JsonKey() final  bool builtIn;

/// Create a copy of ShuttleStopModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleStopModelCopyWith<_ShuttleStopModel> get copyWith => __$ShuttleStopModelCopyWithImpl<_ShuttleStopModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttleStopModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleStopModel&&(identical(other.id, id) || other.id == id)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.name, name) || other.name == name)&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&(identical(other.instructions, instructions) || other.instructions == instructions)&&(identical(other.builtIn, builtIn) || other.builtIn == builtIn));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,kind,name,lat,lng,instructions,builtIn);
}

@override
String toString() {
    return 'ShuttleStopModel(id: $id, kind: $kind, name: $name, lat: $lat, lng: $lng, instructions: $instructions, builtIn: $builtIn)';
}


}

/// @nodoc
abstract mixin class _$ShuttleStopModelCopyWith<$Res> implements $ShuttleStopModelCopyWith<$Res> {
  factory _$ShuttleStopModelCopyWith(_ShuttleStopModel value, $Res Function(_ShuttleStopModel) _then) = __$ShuttleStopModelCopyWithImpl;
@override @useResult
$Res call({
 String? id, String kind, String name, double lat, double lng, String? instructions, bool builtIn
});




}
/// @nodoc
class __$ShuttleStopModelCopyWithImpl<$Res>
    implements _$ShuttleStopModelCopyWith<$Res> {
  __$ShuttleStopModelCopyWithImpl(this._self, this._then);

  final _ShuttleStopModel _self;
  final $Res Function(_ShuttleStopModel) _then;

/// Create a copy of ShuttleStopModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? kind = null,Object? name = null,Object? lat = null,Object? lng = null,Object? instructions = freezed,Object? builtIn = null,}) {
  return _then(_ShuttleStopModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,instructions: freezed == instructions ? _self.instructions : instructions // ignore: cast_nullable_to_non_nullable
as String?,builtIn: null == builtIn ? _self.builtIn : builtIn // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$LiveEstimateModel {

 int get distanceM; int get etaMinutes;
/// Create a copy of LiveEstimateModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LiveEstimateModelCopyWith<LiveEstimateModel> get copyWith => _$LiveEstimateModelCopyWithImpl<LiveEstimateModel>(this as LiveEstimateModel, _$identity);

  /// Serializes this LiveEstimateModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LiveEstimateModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LiveEstimateModel&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.etaMinutes, _this.etaMinutes) || other.etaMinutes == _this.etaMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LiveEstimateModel;
  return Object.hash(runtimeType,_this.distanceM,_this.etaMinutes);
}

@override
String toString() {
  final _this = this as LiveEstimateModel;
  return 'LiveEstimateModel(distanceM: ${_this.distanceM}, etaMinutes: ${_this.etaMinutes})';
}


}

/// @nodoc
abstract mixin class $LiveEstimateModelCopyWith<$Res>  {
  factory $LiveEstimateModelCopyWith(LiveEstimateModel value, $Res Function(LiveEstimateModel) _then) = _$LiveEstimateModelCopyWithImpl;
@useResult
$Res call({
 int distanceM, int etaMinutes
});




}
/// @nodoc
class _$LiveEstimateModelCopyWithImpl<$Res>
    implements $LiveEstimateModelCopyWith<$Res> {
  _$LiveEstimateModelCopyWithImpl(this._self, this._then);

  final LiveEstimateModel _self;
  final $Res Function(LiveEstimateModel) _then;

/// Create a copy of LiveEstimateModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? distanceM = null,Object? etaMinutes = null,}) {
  return _then(LiveEstimateModel(
distanceM: null == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int,etaMinutes: null == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [LiveEstimateModel].
extension LiveEstimateModelPatterns on LiveEstimateModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LiveEstimateModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LiveEstimateModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LiveEstimateModel value)  $default,){
final _that = this;
switch (_that) {
case _LiveEstimateModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LiveEstimateModel value)?  $default,){
final _that = this;
switch (_that) {
case _LiveEstimateModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int distanceM,  int etaMinutes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LiveEstimateModel() when $default != null:
return $default(_that.distanceM,_that.etaMinutes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int distanceM,  int etaMinutes)  $default,) {final _that = this;
switch (_that) {
case _LiveEstimateModel():
return $default(_that.distanceM,_that.etaMinutes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int distanceM,  int etaMinutes)?  $default,) {final _that = this;
switch (_that) {
case _LiveEstimateModel() when $default != null:
return $default(_that.distanceM,_that.etaMinutes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LiveEstimateModel implements LiveEstimateModel {
  const _LiveEstimateModel({required this.distanceM, required this.etaMinutes});
  factory _LiveEstimateModel.fromJson(Map<String, dynamic> json) => _$LiveEstimateModelFromJson(json);

@override final  int distanceM;
@override final  int etaMinutes;

/// Create a copy of LiveEstimateModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LiveEstimateModelCopyWith<_LiveEstimateModel> get copyWith => __$LiveEstimateModelCopyWithImpl<_LiveEstimateModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LiveEstimateModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LiveEstimateModel&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.etaMinutes, etaMinutes) || other.etaMinutes == etaMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,distanceM,etaMinutes);
}

@override
String toString() {
    return 'LiveEstimateModel(distanceM: $distanceM, etaMinutes: $etaMinutes)';
}


}

/// @nodoc
abstract mixin class _$LiveEstimateModelCopyWith<$Res> implements $LiveEstimateModelCopyWith<$Res> {
  factory _$LiveEstimateModelCopyWith(_LiveEstimateModel value, $Res Function(_LiveEstimateModel) _then) = __$LiveEstimateModelCopyWithImpl;
@override @useResult
$Res call({
 int distanceM, int etaMinutes
});




}
/// @nodoc
class __$LiveEstimateModelCopyWithImpl<$Res>
    implements _$LiveEstimateModelCopyWith<$Res> {
  __$LiveEstimateModelCopyWithImpl(this._self, this._then);

  final _LiveEstimateModel _self;
  final $Res Function(_LiveEstimateModel) _then;

/// Create a copy of LiveEstimateModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? distanceM = null,Object? etaMinutes = null,}) {
  return _then(_LiveEstimateModel(
distanceM: null == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int,etaMinutes: null == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$LiveTripModel {

 String get id; String get direction; String get driverId; String get driverName; TripVehicleModel get vehicle; ShuttleStopModel? get stop; int get passengers; DateTime get startedAt; DateTime get expiresAt; ShuttlePositionModel? get position; int? get positionAgeSeconds; LiveEstimateModel? get toStop; LiveEstimateModel? get toParking;
/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LiveTripModelCopyWith<LiveTripModel> get copyWith => _$LiveTripModelCopyWithImpl<LiveTripModel>(this as LiveTripModel, _$identity);

  /// Serializes this LiveTripModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LiveTripModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LiveTripModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&(identical(other.driverId, _this.driverId) || other.driverId == _this.driverId)&&(identical(other.driverName, _this.driverName) || other.driverName == _this.driverName)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.stop, _this.stop) || other.stop == _this.stop)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt)&&(identical(other.position, _this.position) || other.position == _this.position)&&(identical(other.positionAgeSeconds, _this.positionAgeSeconds) || other.positionAgeSeconds == _this.positionAgeSeconds)&&(identical(other.toStop, _this.toStop) || other.toStop == _this.toStop)&&(identical(other.toParking, _this.toParking) || other.toParking == _this.toParking));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LiveTripModel;
  return Object.hash(runtimeType,_this.id,_this.direction,_this.driverId,_this.driverName,_this.vehicle,_this.stop,_this.passengers,_this.startedAt,_this.expiresAt,_this.position,_this.positionAgeSeconds,_this.toStop,_this.toParking);
}

@override
String toString() {
  final _this = this as LiveTripModel;
  return 'LiveTripModel(id: ${_this.id}, direction: ${_this.direction}, driverId: ${_this.driverId}, driverName: ${_this.driverName}, vehicle: ${_this.vehicle}, stop: ${_this.stop}, passengers: ${_this.passengers}, startedAt: ${_this.startedAt}, expiresAt: ${_this.expiresAt}, position: ${_this.position}, positionAgeSeconds: ${_this.positionAgeSeconds}, toStop: ${_this.toStop}, toParking: ${_this.toParking})';
}


}

/// @nodoc
abstract mixin class $LiveTripModelCopyWith<$Res>  {
  factory $LiveTripModelCopyWith(LiveTripModel value, $Res Function(LiveTripModel) _then) = _$LiveTripModelCopyWithImpl;
@useResult
$Res call({
 String id, String direction, String driverId, String driverName, TripVehicleModel vehicle, ShuttleStopModel? stop, int passengers, DateTime startedAt, DateTime expiresAt, ShuttlePositionModel? position, int? positionAgeSeconds, LiveEstimateModel? toStop, LiveEstimateModel? toParking
});


$TripVehicleModelCopyWith<$Res> get vehicle;$ShuttleStopModelCopyWith<$Res>? get stop;$ShuttlePositionModelCopyWith<$Res>? get position;$LiveEstimateModelCopyWith<$Res>? get toStop;$LiveEstimateModelCopyWith<$Res>? get toParking;

}
/// @nodoc
class _$LiveTripModelCopyWithImpl<$Res>
    implements $LiveTripModelCopyWith<$Res> {
  _$LiveTripModelCopyWithImpl(this._self, this._then);

  final LiveTripModel _self;
  final $Res Function(LiveTripModel) _then;

/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? direction = null,Object? driverId = null,Object? driverName = null,Object? vehicle = null,Object? stop = freezed,Object? passengers = null,Object? startedAt = null,Object? expiresAt = null,Object? position = freezed,Object? positionAgeSeconds = freezed,Object? toStop = freezed,Object? toParking = freezed,}) {
  return _then(LiveTripModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,driverId: null == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String,driverName: null == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String,vehicle: null == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleModel,stop: freezed == stop ? _self.stop : stop // ignore: cast_nullable_to_non_nullable
as ShuttleStopModel?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as ShuttlePositionModel?,positionAgeSeconds: freezed == positionAgeSeconds ? _self.positionAgeSeconds : positionAgeSeconds // ignore: cast_nullable_to_non_nullable
as int?,toStop: freezed == toStop ? _self.toStop : toStop // ignore: cast_nullable_to_non_nullable
as LiveEstimateModel?,toParking: freezed == toParking ? _self.toParking : toParking // ignore: cast_nullable_to_non_nullable
as LiveEstimateModel?,
  ));
}
/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<$Res> get vehicle {
  
  return $TripVehicleModelCopyWith<$Res>(_self.vehicle, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleStopModelCopyWith<$Res>? get stop {
    if (_self.stop == null) {
    return null;
  }

  return $ShuttleStopModelCopyWith<$Res>(_self.stop!, (value) {
    return _then(_self.copyWith(stop: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<$Res>? get position {
    if (_self.position == null) {
    return null;
  }

  return $ShuttlePositionModelCopyWith<$Res>(_self.position!, (value) {
    return _then(_self.copyWith(position: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveEstimateModelCopyWith<$Res>? get toStop {
    if (_self.toStop == null) {
    return null;
  }

  return $LiveEstimateModelCopyWith<$Res>(_self.toStop!, (value) {
    return _then(_self.copyWith(toStop: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveEstimateModelCopyWith<$Res>? get toParking {
    if (_self.toParking == null) {
    return null;
  }

  return $LiveEstimateModelCopyWith<$Res>(_self.toParking!, (value) {
    return _then(_self.copyWith(toParking: value));
  });
}
}


/// Adds pattern-matching-related methods to [LiveTripModel].
extension LiveTripModelPatterns on LiveTripModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LiveTripModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LiveTripModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LiveTripModel value)  $default,){
final _that = this;
switch (_that) {
case _LiveTripModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LiveTripModel value)?  $default,){
final _that = this;
switch (_that) {
case _LiveTripModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  ShuttleStopModel? stop,  int passengers,  DateTime startedAt,  DateTime expiresAt,  ShuttlePositionModel? position,  int? positionAgeSeconds,  LiveEstimateModel? toStop,  LiveEstimateModel? toParking)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LiveTripModel() when $default != null:
return $default(_that.id,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.stop,_that.passengers,_that.startedAt,_that.expiresAt,_that.position,_that.positionAgeSeconds,_that.toStop,_that.toParking);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  ShuttleStopModel? stop,  int passengers,  DateTime startedAt,  DateTime expiresAt,  ShuttlePositionModel? position,  int? positionAgeSeconds,  LiveEstimateModel? toStop,  LiveEstimateModel? toParking)  $default,) {final _that = this;
switch (_that) {
case _LiveTripModel():
return $default(_that.id,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.stop,_that.passengers,_that.startedAt,_that.expiresAt,_that.position,_that.positionAgeSeconds,_that.toStop,_that.toParking);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  ShuttleStopModel? stop,  int passengers,  DateTime startedAt,  DateTime expiresAt,  ShuttlePositionModel? position,  int? positionAgeSeconds,  LiveEstimateModel? toStop,  LiveEstimateModel? toParking)?  $default,) {final _that = this;
switch (_that) {
case _LiveTripModel() when $default != null:
return $default(_that.id,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.stop,_that.passengers,_that.startedAt,_that.expiresAt,_that.position,_that.positionAgeSeconds,_that.toStop,_that.toParking);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LiveTripModel extends LiveTripModel {
  const _LiveTripModel({required this.id, this.direction = 'pickup', required this.driverId, required this.driverName, this.vehicle = const TripVehicleModel(), this.stop, this.passengers = 0, required this.startedAt, required this.expiresAt, this.position, this.positionAgeSeconds, this.toStop, this.toParking}): super._();
  factory _LiveTripModel.fromJson(Map<String, dynamic> json) => _$LiveTripModelFromJson(json);

@override final  String id;
@override@JsonKey() final  String direction;
@override final  String driverId;
@override final  String driverName;
@override@JsonKey() final  TripVehicleModel vehicle;
@override final  ShuttleStopModel? stop;
@override@JsonKey() final  int passengers;
@override final  DateTime startedAt;
@override final  DateTime expiresAt;
@override final  ShuttlePositionModel? position;
@override final  int? positionAgeSeconds;
@override final  LiveEstimateModel? toStop;
@override final  LiveEstimateModel? toParking;

/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LiveTripModelCopyWith<_LiveTripModel> get copyWith => __$LiveTripModelCopyWithImpl<_LiveTripModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LiveTripModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LiveTripModel&&(identical(other.id, id) || other.id == id)&&(identical(other.direction, direction) || other.direction == direction)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.stop, stop) || other.stop == stop)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.position, position) || other.position == position)&&(identical(other.positionAgeSeconds, positionAgeSeconds) || other.positionAgeSeconds == positionAgeSeconds)&&(identical(other.toStop, toStop) || other.toStop == toStop)&&(identical(other.toParking, toParking) || other.toParking == toParking));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,direction,driverId,driverName,vehicle,stop,passengers,startedAt,expiresAt,position,positionAgeSeconds,toStop,toParking);
}

@override
String toString() {
    return 'LiveTripModel(id: $id, direction: $direction, driverId: $driverId, driverName: $driverName, vehicle: $vehicle, stop: $stop, passengers: $passengers, startedAt: $startedAt, expiresAt: $expiresAt, position: $position, positionAgeSeconds: $positionAgeSeconds, toStop: $toStop, toParking: $toParking)';
}


}

/// @nodoc
abstract mixin class _$LiveTripModelCopyWith<$Res> implements $LiveTripModelCopyWith<$Res> {
  factory _$LiveTripModelCopyWith(_LiveTripModel value, $Res Function(_LiveTripModel) _then) = __$LiveTripModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String direction, String driverId, String driverName, TripVehicleModel vehicle, ShuttleStopModel? stop, int passengers, DateTime startedAt, DateTime expiresAt, ShuttlePositionModel? position, int? positionAgeSeconds, LiveEstimateModel? toStop, LiveEstimateModel? toParking
});


@override $TripVehicleModelCopyWith<$Res> get vehicle;@override $ShuttleStopModelCopyWith<$Res>? get stop;@override $ShuttlePositionModelCopyWith<$Res>? get position;@override $LiveEstimateModelCopyWith<$Res>? get toStop;@override $LiveEstimateModelCopyWith<$Res>? get toParking;

}
/// @nodoc
class __$LiveTripModelCopyWithImpl<$Res>
    implements _$LiveTripModelCopyWith<$Res> {
  __$LiveTripModelCopyWithImpl(this._self, this._then);

  final _LiveTripModel _self;
  final $Res Function(_LiveTripModel) _then;

/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? direction = null,Object? driverId = null,Object? driverName = null,Object? vehicle = null,Object? stop = freezed,Object? passengers = null,Object? startedAt = null,Object? expiresAt = null,Object? position = freezed,Object? positionAgeSeconds = freezed,Object? toStop = freezed,Object? toParking = freezed,}) {
  return _then(_LiveTripModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,driverId: null == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String,driverName: null == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String,vehicle: null == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleModel,stop: freezed == stop ? _self.stop : stop // ignore: cast_nullable_to_non_nullable
as ShuttleStopModel?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as ShuttlePositionModel?,positionAgeSeconds: freezed == positionAgeSeconds ? _self.positionAgeSeconds : positionAgeSeconds // ignore: cast_nullable_to_non_nullable
as int?,toStop: freezed == toStop ? _self.toStop : toStop // ignore: cast_nullable_to_non_nullable
as LiveEstimateModel?,toParking: freezed == toParking ? _self.toParking : toParking // ignore: cast_nullable_to_non_nullable
as LiveEstimateModel?,
  ));
}

/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<$Res> get vehicle {
  
  return $TripVehicleModelCopyWith<$Res>(_self.vehicle, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleStopModelCopyWith<$Res>? get stop {
    if (_self.stop == null) {
    return null;
  }

  return $ShuttleStopModelCopyWith<$Res>(_self.stop!, (value) {
    return _then(_self.copyWith(stop: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<$Res>? get position {
    if (_self.position == null) {
    return null;
  }

  return $ShuttlePositionModelCopyWith<$Res>(_self.position!, (value) {
    return _then(_self.copyWith(position: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveEstimateModelCopyWith<$Res>? get toStop {
    if (_self.toStop == null) {
    return null;
  }

  return $LiveEstimateModelCopyWith<$Res>(_self.toStop!, (value) {
    return _then(_self.copyWith(toStop: value));
  });
}/// Create a copy of LiveTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveEstimateModelCopyWith<$Res>? get toParking {
    if (_self.toParking == null) {
    return null;
  }

  return $LiveEstimateModelCopyWith<$Res>(_self.toParking!, (value) {
    return _then(_self.copyWith(toParking: value));
  });
}
}


/// @nodoc
mixin _$LiveParkingModel {

 String get id; String get name; double? get lat; double? get lng;
/// Create a copy of LiveParkingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LiveParkingModelCopyWith<LiveParkingModel> get copyWith => _$LiveParkingModelCopyWithImpl<LiveParkingModel>(this as LiveParkingModel, _$identity);

  /// Serializes this LiveParkingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LiveParkingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LiveParkingModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LiveParkingModel;
  return Object.hash(runtimeType,_this.id,_this.name,_this.lat,_this.lng);
}

@override
String toString() {
  final _this = this as LiveParkingModel;
  return 'LiveParkingModel(id: ${_this.id}, name: ${_this.name}, lat: ${_this.lat}, lng: ${_this.lng})';
}


}

/// @nodoc
abstract mixin class $LiveParkingModelCopyWith<$Res>  {
  factory $LiveParkingModelCopyWith(LiveParkingModel value, $Res Function(LiveParkingModel) _then) = _$LiveParkingModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, double? lat, double? lng
});




}
/// @nodoc
class _$LiveParkingModelCopyWithImpl<$Res>
    implements $LiveParkingModelCopyWith<$Res> {
  _$LiveParkingModelCopyWithImpl(this._self, this._then);

  final LiveParkingModel _self;
  final $Res Function(LiveParkingModel) _then;

/// Create a copy of LiveParkingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? lat = freezed,Object? lng = freezed,}) {
  return _then(LiveParkingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,lat: freezed == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double?,lng: freezed == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [LiveParkingModel].
extension LiveParkingModelPatterns on LiveParkingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LiveParkingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LiveParkingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LiveParkingModel value)  $default,){
final _that = this;
switch (_that) {
case _LiveParkingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LiveParkingModel value)?  $default,){
final _that = this;
switch (_that) {
case _LiveParkingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  double? lat,  double? lng)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LiveParkingModel() when $default != null:
return $default(_that.id,_that.name,_that.lat,_that.lng);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  double? lat,  double? lng)  $default,) {final _that = this;
switch (_that) {
case _LiveParkingModel():
return $default(_that.id,_that.name,_that.lat,_that.lng);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  double? lat,  double? lng)?  $default,) {final _that = this;
switch (_that) {
case _LiveParkingModel() when $default != null:
return $default(_that.id,_that.name,_that.lat,_that.lng);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LiveParkingModel implements LiveParkingModel {
  const _LiveParkingModel({required this.id, required this.name, this.lat, this.lng});
  factory _LiveParkingModel.fromJson(Map<String, dynamic> json) => _$LiveParkingModelFromJson(json);

@override final  String id;
@override final  String name;
@override final  double? lat;
@override final  double? lng;

/// Create a copy of LiveParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LiveParkingModelCopyWith<_LiveParkingModel> get copyWith => __$LiveParkingModelCopyWithImpl<_LiveParkingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LiveParkingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LiveParkingModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name,lat,lng);
}

@override
String toString() {
    return 'LiveParkingModel(id: $id, name: $name, lat: $lat, lng: $lng)';
}


}

/// @nodoc
abstract mixin class _$LiveParkingModelCopyWith<$Res> implements $LiveParkingModelCopyWith<$Res> {
  factory _$LiveParkingModelCopyWith(_LiveParkingModel value, $Res Function(_LiveParkingModel) _then) = __$LiveParkingModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, double? lat, double? lng
});




}
/// @nodoc
class __$LiveParkingModelCopyWithImpl<$Res>
    implements _$LiveParkingModelCopyWith<$Res> {
  __$LiveParkingModelCopyWithImpl(this._self, this._then);

  final _LiveParkingModel _self;
  final $Res Function(_LiveParkingModel) _then;

/// Create a copy of LiveParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? lat = freezed,Object? lng = freezed,}) {
  return _then(_LiveParkingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,lat: freezed == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double?,lng: freezed == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}


/// @nodoc
mixin _$LiveShuttlesModel {

 DateTime get serverTime; LiveParkingModel get parking; List<ShuttleStopModel> get stops; List<LiveTripModel> get trips;
/// Create a copy of LiveShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LiveShuttlesModelCopyWith<LiveShuttlesModel> get copyWith => _$LiveShuttlesModelCopyWithImpl<LiveShuttlesModel>(this as LiveShuttlesModel, _$identity);

  /// Serializes this LiveShuttlesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LiveShuttlesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LiveShuttlesModel&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&const DeepCollectionEquality().equals(other.stops, _this.stops)&&const DeepCollectionEquality().equals(other.trips, _this.trips));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LiveShuttlesModel;
  return Object.hash(runtimeType,_this.serverTime,_this.parking,const DeepCollectionEquality().hash(_this.stops),const DeepCollectionEquality().hash(_this.trips));
}

@override
String toString() {
  final _this = this as LiveShuttlesModel;
  return 'LiveShuttlesModel(serverTime: ${_this.serverTime}, parking: ${_this.parking}, stops: ${_this.stops}, trips: ${_this.trips})';
}


}

/// @nodoc
abstract mixin class $LiveShuttlesModelCopyWith<$Res>  {
  factory $LiveShuttlesModelCopyWith(LiveShuttlesModel value, $Res Function(LiveShuttlesModel) _then) = _$LiveShuttlesModelCopyWithImpl;
@useResult
$Res call({
 DateTime serverTime, LiveParkingModel parking, List<ShuttleStopModel> stops, List<LiveTripModel> trips
});


$LiveParkingModelCopyWith<$Res> get parking;

}
/// @nodoc
class _$LiveShuttlesModelCopyWithImpl<$Res>
    implements $LiveShuttlesModelCopyWith<$Res> {
  _$LiveShuttlesModelCopyWithImpl(this._self, this._then);

  final LiveShuttlesModel _self;
  final $Res Function(LiveShuttlesModel) _then;

/// Create a copy of LiveShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? serverTime = null,Object? parking = null,Object? stops = null,Object? trips = null,}) {
  return _then(LiveShuttlesModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as LiveParkingModel,stops: null == stops ? _self.stops : stops // ignore: cast_nullable_to_non_nullable
as List<ShuttleStopModel>,trips: null == trips ? _self.trips : trips // ignore: cast_nullable_to_non_nullable
as List<LiveTripModel>,
  ));
}
/// Create a copy of LiveShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveParkingModelCopyWith<$Res> get parking {
  
  return $LiveParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}
}


/// Adds pattern-matching-related methods to [LiveShuttlesModel].
extension LiveShuttlesModelPatterns on LiveShuttlesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LiveShuttlesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LiveShuttlesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LiveShuttlesModel value)  $default,){
final _that = this;
switch (_that) {
case _LiveShuttlesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LiveShuttlesModel value)?  $default,){
final _that = this;
switch (_that) {
case _LiveShuttlesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime serverTime,  LiveParkingModel parking,  List<ShuttleStopModel> stops,  List<LiveTripModel> trips)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LiveShuttlesModel() when $default != null:
return $default(_that.serverTime,_that.parking,_that.stops,_that.trips);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime serverTime,  LiveParkingModel parking,  List<ShuttleStopModel> stops,  List<LiveTripModel> trips)  $default,) {final _that = this;
switch (_that) {
case _LiveShuttlesModel():
return $default(_that.serverTime,_that.parking,_that.stops,_that.trips);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime serverTime,  LiveParkingModel parking,  List<ShuttleStopModel> stops,  List<LiveTripModel> trips)?  $default,) {final _that = this;
switch (_that) {
case _LiveShuttlesModel() when $default != null:
return $default(_that.serverTime,_that.parking,_that.stops,_that.trips);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LiveShuttlesModel implements LiveShuttlesModel {
  const _LiveShuttlesModel({required this.serverTime, required this.parking,  List<ShuttleStopModel> stops = const [],  List<LiveTripModel> trips = const []}): _stops = stops,_trips = trips;
  factory _LiveShuttlesModel.fromJson(Map<String, dynamic> json) => _$LiveShuttlesModelFromJson(json);

@override final  DateTime serverTime;
@override final  LiveParkingModel parking;
 final  List<ShuttleStopModel> _stops;
@override@JsonKey() List<ShuttleStopModel> get stops {
  if (_stops is EqualUnmodifiableListView) return _stops;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_stops);
}

 final  List<LiveTripModel> _trips;
@override@JsonKey() List<LiveTripModel> get trips {
  if (_trips is EqualUnmodifiableListView) return _trips;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_trips);
}


/// Create a copy of LiveShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LiveShuttlesModelCopyWith<_LiveShuttlesModel> get copyWith => __$LiveShuttlesModelCopyWithImpl<_LiveShuttlesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LiveShuttlesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LiveShuttlesModel&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&(identical(other.parking, parking) || other.parking == parking)&&const DeepCollectionEquality().equals(other.stops, _stops)&&const DeepCollectionEquality().equals(other.trips, _trips));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,serverTime,parking,const DeepCollectionEquality().hash(_stops),const DeepCollectionEquality().hash(_trips));
}

@override
String toString() {
    return 'LiveShuttlesModel(serverTime: $serverTime, parking: $parking, stops: $stops, trips: $trips)';
}


}

/// @nodoc
abstract mixin class _$LiveShuttlesModelCopyWith<$Res> implements $LiveShuttlesModelCopyWith<$Res> {
  factory _$LiveShuttlesModelCopyWith(_LiveShuttlesModel value, $Res Function(_LiveShuttlesModel) _then) = __$LiveShuttlesModelCopyWithImpl;
@override @useResult
$Res call({
 DateTime serverTime, LiveParkingModel parking, List<ShuttleStopModel> stops, List<LiveTripModel> trips
});


@override $LiveParkingModelCopyWith<$Res> get parking;

}
/// @nodoc
class __$LiveShuttlesModelCopyWithImpl<$Res>
    implements _$LiveShuttlesModelCopyWith<$Res> {
  __$LiveShuttlesModelCopyWithImpl(this._self, this._then);

  final _LiveShuttlesModel _self;
  final $Res Function(_LiveShuttlesModel) _then;

/// Create a copy of LiveShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? serverTime = null,Object? parking = null,Object? stops = null,Object? trips = null,}) {
  return _then(_LiveShuttlesModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as LiveParkingModel,stops: null == stops ? _self._stops : stops // ignore: cast_nullable_to_non_nullable
as List<ShuttleStopModel>,trips: null == trips ? _self._trips : trips // ignore: cast_nullable_to_non_nullable
as List<LiveTripModel>,
  ));
}

/// Create a copy of LiveShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveParkingModelCopyWith<$Res> get parking {
  
  return $LiveParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}
}


/// @nodoc
mixin _$CurrentTripModel {

 StaffTripModel? get trip;
/// Create a copy of CurrentTripModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CurrentTripModelCopyWith<CurrentTripModel> get copyWith => _$CurrentTripModelCopyWithImpl<CurrentTripModel>(this as CurrentTripModel, _$identity);

  /// Serializes this CurrentTripModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as CurrentTripModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CurrentTripModel&&(identical(other.trip, _this.trip) || other.trip == _this.trip));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as CurrentTripModel;
  return Object.hash(runtimeType,_this.trip);
}

@override
String toString() {
  final _this = this as CurrentTripModel;
  return 'CurrentTripModel(trip: ${_this.trip})';
}


}

/// @nodoc
abstract mixin class $CurrentTripModelCopyWith<$Res>  {
  factory $CurrentTripModelCopyWith(CurrentTripModel value, $Res Function(CurrentTripModel) _then) = _$CurrentTripModelCopyWithImpl;
@useResult
$Res call({
 StaffTripModel? trip
});


$StaffTripModelCopyWith<$Res>? get trip;

}
/// @nodoc
class _$CurrentTripModelCopyWithImpl<$Res>
    implements $CurrentTripModelCopyWith<$Res> {
  _$CurrentTripModelCopyWithImpl(this._self, this._then);

  final CurrentTripModel _self;
  final $Res Function(CurrentTripModel) _then;

/// Create a copy of CurrentTripModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? trip = freezed,}) {
  return _then(CurrentTripModel(
trip: freezed == trip ? _self.trip : trip // ignore: cast_nullable_to_non_nullable
as StaffTripModel?,
  ));
}
/// Create a copy of CurrentTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffTripModelCopyWith<$Res>? get trip {
    if (_self.trip == null) {
    return null;
  }

  return $StaffTripModelCopyWith<$Res>(_self.trip!, (value) {
    return _then(_self.copyWith(trip: value));
  });
}
}


/// Adds pattern-matching-related methods to [CurrentTripModel].
extension CurrentTripModelPatterns on CurrentTripModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CurrentTripModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CurrentTripModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CurrentTripModel value)  $default,){
final _that = this;
switch (_that) {
case _CurrentTripModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CurrentTripModel value)?  $default,){
final _that = this;
switch (_that) {
case _CurrentTripModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( StaffTripModel? trip)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CurrentTripModel() when $default != null:
return $default(_that.trip);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( StaffTripModel? trip)  $default,) {final _that = this;
switch (_that) {
case _CurrentTripModel():
return $default(_that.trip);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( StaffTripModel? trip)?  $default,) {final _that = this;
switch (_that) {
case _CurrentTripModel() when $default != null:
return $default(_that.trip);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CurrentTripModel implements CurrentTripModel {
  const _CurrentTripModel({this.trip});
  factory _CurrentTripModel.fromJson(Map<String, dynamic> json) => _$CurrentTripModelFromJson(json);

@override final  StaffTripModel? trip;

/// Create a copy of CurrentTripModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CurrentTripModelCopyWith<_CurrentTripModel> get copyWith => __$CurrentTripModelCopyWithImpl<_CurrentTripModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CurrentTripModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CurrentTripModel&&(identical(other.trip, trip) || other.trip == trip));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,trip);
}

@override
String toString() {
    return 'CurrentTripModel(trip: $trip)';
}


}

/// @nodoc
abstract mixin class _$CurrentTripModelCopyWith<$Res> implements $CurrentTripModelCopyWith<$Res> {
  factory _$CurrentTripModelCopyWith(_CurrentTripModel value, $Res Function(_CurrentTripModel) _then) = __$CurrentTripModelCopyWithImpl;
@override @useResult
$Res call({
 StaffTripModel? trip
});


@override $StaffTripModelCopyWith<$Res>? get trip;

}
/// @nodoc
class __$CurrentTripModelCopyWithImpl<$Res>
    implements _$CurrentTripModelCopyWith<$Res> {
  __$CurrentTripModelCopyWithImpl(this._self, this._then);

  final _CurrentTripModel _self;
  final $Res Function(_CurrentTripModel) _then;

/// Create a copy of CurrentTripModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? trip = freezed,}) {
  return _then(_CurrentTripModel(
trip: freezed == trip ? _self.trip : trip // ignore: cast_nullable_to_non_nullable
as StaffTripModel?,
  ));
}

/// Create a copy of CurrentTripModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffTripModelCopyWith<$Res>? get trip {
    if (_self.trip == null) {
    return null;
  }

  return $StaffTripModelCopyWith<$Res>(_self.trip!, (value) {
    return _then(_self.copyWith(trip: value));
  });
}
}


/// @nodoc
mixin _$WaveFlightModel {

 String get number; String? get status; DateTime? get scheduledAt; DateTime? get estimatedAt; DateTime? get actualAt; String? get terminal;
/// Create a copy of WaveFlightModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WaveFlightModelCopyWith<WaveFlightModel> get copyWith => _$WaveFlightModelCopyWithImpl<WaveFlightModel>(this as WaveFlightModel, _$identity);

  /// Serializes this WaveFlightModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as WaveFlightModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WaveFlightModel&&(identical(other.number, _this.number) || other.number == _this.number)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.scheduledAt, _this.scheduledAt) || other.scheduledAt == _this.scheduledAt)&&(identical(other.estimatedAt, _this.estimatedAt) || other.estimatedAt == _this.estimatedAt)&&(identical(other.actualAt, _this.actualAt) || other.actualAt == _this.actualAt)&&(identical(other.terminal, _this.terminal) || other.terminal == _this.terminal));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as WaveFlightModel;
  return Object.hash(runtimeType,_this.number,_this.status,_this.scheduledAt,_this.estimatedAt,_this.actualAt,_this.terminal);
}

@override
String toString() {
  final _this = this as WaveFlightModel;
  return 'WaveFlightModel(number: ${_this.number}, status: ${_this.status}, scheduledAt: ${_this.scheduledAt}, estimatedAt: ${_this.estimatedAt}, actualAt: ${_this.actualAt}, terminal: ${_this.terminal})';
}


}

/// @nodoc
abstract mixin class $WaveFlightModelCopyWith<$Res>  {
  factory $WaveFlightModelCopyWith(WaveFlightModel value, $Res Function(WaveFlightModel) _then) = _$WaveFlightModelCopyWithImpl;
@useResult
$Res call({
 String number, String? status, DateTime? scheduledAt, DateTime? estimatedAt, DateTime? actualAt, String? terminal
});




}
/// @nodoc
class _$WaveFlightModelCopyWithImpl<$Res>
    implements $WaveFlightModelCopyWith<$Res> {
  _$WaveFlightModelCopyWithImpl(this._self, this._then);

  final WaveFlightModel _self;
  final $Res Function(WaveFlightModel) _then;

/// Create a copy of WaveFlightModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? number = null,Object? status = freezed,Object? scheduledAt = freezed,Object? estimatedAt = freezed,Object? actualAt = freezed,Object? terminal = freezed,}) {
  return _then(WaveFlightModel(
number: null == number ? _self.number : number // ignore: cast_nullable_to_non_nullable
as String,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: freezed == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,estimatedAt: freezed == estimatedAt ? _self.estimatedAt : estimatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,actualAt: freezed == actualAt ? _self.actualAt : actualAt // ignore: cast_nullable_to_non_nullable
as DateTime?,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [WaveFlightModel].
extension WaveFlightModelPatterns on WaveFlightModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WaveFlightModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WaveFlightModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WaveFlightModel value)  $default,){
final _that = this;
switch (_that) {
case _WaveFlightModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WaveFlightModel value)?  $default,){
final _that = this;
switch (_that) {
case _WaveFlightModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String number,  String? status,  DateTime? scheduledAt,  DateTime? estimatedAt,  DateTime? actualAt,  String? terminal)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WaveFlightModel() when $default != null:
return $default(_that.number,_that.status,_that.scheduledAt,_that.estimatedAt,_that.actualAt,_that.terminal);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String number,  String? status,  DateTime? scheduledAt,  DateTime? estimatedAt,  DateTime? actualAt,  String? terminal)  $default,) {final _that = this;
switch (_that) {
case _WaveFlightModel():
return $default(_that.number,_that.status,_that.scheduledAt,_that.estimatedAt,_that.actualAt,_that.terminal);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String number,  String? status,  DateTime? scheduledAt,  DateTime? estimatedAt,  DateTime? actualAt,  String? terminal)?  $default,) {final _that = this;
switch (_that) {
case _WaveFlightModel() when $default != null:
return $default(_that.number,_that.status,_that.scheduledAt,_that.estimatedAt,_that.actualAt,_that.terminal);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WaveFlightModel extends WaveFlightModel {
  const _WaveFlightModel({required this.number, this.status, this.scheduledAt, this.estimatedAt, this.actualAt, this.terminal}): super._();
  factory _WaveFlightModel.fromJson(Map<String, dynamic> json) => _$WaveFlightModelFromJson(json);

@override final  String number;
@override final  String? status;
@override final  DateTime? scheduledAt;
@override final  DateTime? estimatedAt;
@override final  DateTime? actualAt;
@override final  String? terminal;

/// Create a copy of WaveFlightModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WaveFlightModelCopyWith<_WaveFlightModel> get copyWith => __$WaveFlightModelCopyWithImpl<_WaveFlightModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WaveFlightModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _WaveFlightModel&&(identical(other.number, number) || other.number == number)&&(identical(other.status, status) || other.status == status)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.estimatedAt, estimatedAt) || other.estimatedAt == estimatedAt)&&(identical(other.actualAt, actualAt) || other.actualAt == actualAt)&&(identical(other.terminal, terminal) || other.terminal == terminal));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,number,status,scheduledAt,estimatedAt,actualAt,terminal);
}

@override
String toString() {
    return 'WaveFlightModel(number: $number, status: $status, scheduledAt: $scheduledAt, estimatedAt: $estimatedAt, actualAt: $actualAt, terminal: $terminal)';
}


}

/// @nodoc
abstract mixin class _$WaveFlightModelCopyWith<$Res> implements $WaveFlightModelCopyWith<$Res> {
  factory _$WaveFlightModelCopyWith(_WaveFlightModel value, $Res Function(_WaveFlightModel) _then) = __$WaveFlightModelCopyWithImpl;
@override @useResult
$Res call({
 String number, String? status, DateTime? scheduledAt, DateTime? estimatedAt, DateTime? actualAt, String? terminal
});




}
/// @nodoc
class __$WaveFlightModelCopyWithImpl<$Res>
    implements _$WaveFlightModelCopyWith<$Res> {
  __$WaveFlightModelCopyWithImpl(this._self, this._then);

  final _WaveFlightModel _self;
  final $Res Function(_WaveFlightModel) _then;

/// Create a copy of WaveFlightModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? number = null,Object? status = freezed,Object? scheduledAt = freezed,Object? estimatedAt = freezed,Object? actualAt = freezed,Object? terminal = freezed,}) {
  return _then(_WaveFlightModel(
number: null == number ? _self.number : number // ignore: cast_nullable_to_non_nullable
as String,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: freezed == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,estimatedAt: freezed == estimatedAt ? _self.estimatedAt : estimatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,actualAt: freezed == actualAt ? _self.actualAt : actualAt // ignore: cast_nullable_to_non_nullable
as DateTime?,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$WaveMemberModel {

 String get reservationId; String get reference; String get customerName; int get passengers; String get plate; String get status; String get direction; String? get stopId; String? get stopName; DateTime get leaveAt; DateTime? get meetAt; WaveFlightModel? get flight; bool get noFlight; String get state; String? get tripId;
/// Create a copy of WaveMemberModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WaveMemberModelCopyWith<WaveMemberModel> get copyWith => _$WaveMemberModelCopyWithImpl<WaveMemberModel>(this as WaveMemberModel, _$identity);

  /// Serializes this WaveMemberModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as WaveMemberModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WaveMemberModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&(identical(other.stopId, _this.stopId) || other.stopId == _this.stopId)&&(identical(other.stopName, _this.stopName) || other.stopName == _this.stopName)&&(identical(other.leaveAt, _this.leaveAt) || other.leaveAt == _this.leaveAt)&&(identical(other.meetAt, _this.meetAt) || other.meetAt == _this.meetAt)&&(identical(other.flight, _this.flight) || other.flight == _this.flight)&&(identical(other.noFlight, _this.noFlight) || other.noFlight == _this.noFlight)&&(identical(other.state, _this.state) || other.state == _this.state)&&(identical(other.tripId, _this.tripId) || other.tripId == _this.tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as WaveMemberModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.status,_this.direction,_this.stopId,_this.stopName,_this.leaveAt,_this.meetAt,_this.flight,_this.noFlight,_this.state,_this.tripId);
}

@override
String toString() {
  final _this = this as WaveMemberModel;
  return 'WaveMemberModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, status: ${_this.status}, direction: ${_this.direction}, stopId: ${_this.stopId}, stopName: ${_this.stopName}, leaveAt: ${_this.leaveAt}, meetAt: ${_this.meetAt}, flight: ${_this.flight}, noFlight: ${_this.noFlight}, state: ${_this.state}, tripId: ${_this.tripId})';
}


}

/// @nodoc
abstract mixin class $WaveMemberModelCopyWith<$Res>  {
  factory $WaveMemberModelCopyWith(WaveMemberModel value, $Res Function(WaveMemberModel) _then) = _$WaveMemberModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, String direction, String? stopId, String? stopName, DateTime leaveAt, DateTime? meetAt, WaveFlightModel? flight, bool noFlight, String state, String? tripId
});


$WaveFlightModelCopyWith<$Res>? get flight;

}
/// @nodoc
class _$WaveMemberModelCopyWithImpl<$Res>
    implements $WaveMemberModelCopyWith<$Res> {
  _$WaveMemberModelCopyWithImpl(this._self, this._then);

  final WaveMemberModel _self;
  final $Res Function(WaveMemberModel) _then;

/// Create a copy of WaveMemberModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? direction = null,Object? stopId = freezed,Object? stopName = freezed,Object? leaveAt = null,Object? meetAt = freezed,Object? flight = freezed,Object? noFlight = null,Object? state = null,Object? tripId = freezed,}) {
  return _then(WaveMemberModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,leaveAt: null == leaveAt ? _self.leaveAt : leaveAt // ignore: cast_nullable_to_non_nullable
as DateTime,meetAt: freezed == meetAt ? _self.meetAt : meetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,flight: freezed == flight ? _self.flight : flight // ignore: cast_nullable_to_non_nullable
as WaveFlightModel?,noFlight: null == noFlight ? _self.noFlight : noFlight // ignore: cast_nullable_to_non_nullable
as bool,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of WaveMemberModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WaveFlightModelCopyWith<$Res>? get flight {
    if (_self.flight == null) {
    return null;
  }

  return $WaveFlightModelCopyWith<$Res>(_self.flight!, (value) {
    return _then(_self.copyWith(flight: value));
  });
}
}


/// Adds pattern-matching-related methods to [WaveMemberModel].
extension WaveMemberModelPatterns on WaveMemberModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WaveMemberModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WaveMemberModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WaveMemberModel value)  $default,){
final _that = this;
switch (_that) {
case _WaveMemberModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WaveMemberModel value)?  $default,){
final _that = this;
switch (_that) {
case _WaveMemberModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  String direction,  String? stopId,  String? stopName,  DateTime leaveAt,  DateTime? meetAt,  WaveFlightModel? flight,  bool noFlight,  String state,  String? tripId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WaveMemberModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.direction,_that.stopId,_that.stopName,_that.leaveAt,_that.meetAt,_that.flight,_that.noFlight,_that.state,_that.tripId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  String direction,  String? stopId,  String? stopName,  DateTime leaveAt,  DateTime? meetAt,  WaveFlightModel? flight,  bool noFlight,  String state,  String? tripId)  $default,) {final _that = this;
switch (_that) {
case _WaveMemberModel():
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.direction,_that.stopId,_that.stopName,_that.leaveAt,_that.meetAt,_that.flight,_that.noFlight,_that.state,_that.tripId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  String direction,  String? stopId,  String? stopName,  DateTime leaveAt,  DateTime? meetAt,  WaveFlightModel? flight,  bool noFlight,  String state,  String? tripId)?  $default,) {final _that = this;
switch (_that) {
case _WaveMemberModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.direction,_that.stopId,_that.stopName,_that.leaveAt,_that.meetAt,_that.flight,_that.noFlight,_that.state,_that.tripId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WaveMemberModel implements WaveMemberModel {
  const _WaveMemberModel({required this.reservationId, required this.reference, required this.customerName, this.passengers = 1, required this.plate, this.status = 'upcoming', this.direction = 'dropoff', this.stopId, this.stopName, required this.leaveAt, this.meetAt, this.flight, this.noFlight = false, this.state = 'planned', this.tripId});
  factory _WaveMemberModel.fromJson(Map<String, dynamic> json) => _$WaveMemberModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String customerName;
@override@JsonKey() final  int passengers;
@override final  String plate;
@override@JsonKey() final  String status;
@override@JsonKey() final  String direction;
@override final  String? stopId;
@override final  String? stopName;
@override final  DateTime leaveAt;
@override final  DateTime? meetAt;
@override final  WaveFlightModel? flight;
@override@JsonKey() final  bool noFlight;
@override@JsonKey() final  String state;
@override final  String? tripId;

/// Create a copy of WaveMemberModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WaveMemberModelCopyWith<_WaveMemberModel> get copyWith => __$WaveMemberModelCopyWithImpl<_WaveMemberModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WaveMemberModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _WaveMemberModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.direction, direction) || other.direction == direction)&&(identical(other.stopId, stopId) || other.stopId == stopId)&&(identical(other.stopName, stopName) || other.stopName == stopName)&&(identical(other.leaveAt, leaveAt) || other.leaveAt == leaveAt)&&(identical(other.meetAt, meetAt) || other.meetAt == meetAt)&&(identical(other.flight, flight) || other.flight == flight)&&(identical(other.noFlight, noFlight) || other.noFlight == noFlight)&&(identical(other.state, state) || other.state == state)&&(identical(other.tripId, tripId) || other.tripId == tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,customerName,passengers,plate,status,direction,stopId,stopName,leaveAt,meetAt,flight,noFlight,state,tripId);
}

@override
String toString() {
    return 'WaveMemberModel(reservationId: $reservationId, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, status: $status, direction: $direction, stopId: $stopId, stopName: $stopName, leaveAt: $leaveAt, meetAt: $meetAt, flight: $flight, noFlight: $noFlight, state: $state, tripId: $tripId)';
}


}

/// @nodoc
abstract mixin class _$WaveMemberModelCopyWith<$Res> implements $WaveMemberModelCopyWith<$Res> {
  factory _$WaveMemberModelCopyWith(_WaveMemberModel value, $Res Function(_WaveMemberModel) _then) = __$WaveMemberModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, String direction, String? stopId, String? stopName, DateTime leaveAt, DateTime? meetAt, WaveFlightModel? flight, bool noFlight, String state, String? tripId
});


@override $WaveFlightModelCopyWith<$Res>? get flight;

}
/// @nodoc
class __$WaveMemberModelCopyWithImpl<$Res>
    implements _$WaveMemberModelCopyWith<$Res> {
  __$WaveMemberModelCopyWithImpl(this._self, this._then);

  final _WaveMemberModel _self;
  final $Res Function(_WaveMemberModel) _then;

/// Create a copy of WaveMemberModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? direction = null,Object? stopId = freezed,Object? stopName = freezed,Object? leaveAt = null,Object? meetAt = freezed,Object? flight = freezed,Object? noFlight = null,Object? state = null,Object? tripId = freezed,}) {
  return _then(_WaveMemberModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,leaveAt: null == leaveAt ? _self.leaveAt : leaveAt // ignore: cast_nullable_to_non_nullable
as DateTime,meetAt: freezed == meetAt ? _self.meetAt : meetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,flight: freezed == flight ? _self.flight : flight // ignore: cast_nullable_to_non_nullable
as WaveFlightModel?,noFlight: null == noFlight ? _self.noFlight : noFlight // ignore: cast_nullable_to_non_nullable
as bool,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of WaveMemberModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WaveFlightModelCopyWith<$Res>? get flight {
    if (_self.flight == null) {
    return null;
  }

  return $WaveFlightModelCopyWith<$Res>(_self.flight!, (value) {
    return _then(_self.copyWith(flight: value));
  });
}
}


/// @nodoc
mixin _$ShuttleWaveModel {

 String get id; String get direction; String? get stopId; String? get stopName; DateTime get leaveAt; DateTime? get meetAt; int get passengers; int? get seats; int? get vehiclesNeeded; int get noFlight; List<String> get flights; String get state; List<WaveMemberModel> get members;
/// Create a copy of ShuttleWaveModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleWaveModelCopyWith<ShuttleWaveModel> get copyWith => _$ShuttleWaveModelCopyWithImpl<ShuttleWaveModel>(this as ShuttleWaveModel, _$identity);

  /// Serializes this ShuttleWaveModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttleWaveModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleWaveModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&(identical(other.stopId, _this.stopId) || other.stopId == _this.stopId)&&(identical(other.stopName, _this.stopName) || other.stopName == _this.stopName)&&(identical(other.leaveAt, _this.leaveAt) || other.leaveAt == _this.leaveAt)&&(identical(other.meetAt, _this.meetAt) || other.meetAt == _this.meetAt)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.seats, _this.seats) || other.seats == _this.seats)&&(identical(other.vehiclesNeeded, _this.vehiclesNeeded) || other.vehiclesNeeded == _this.vehiclesNeeded)&&(identical(other.noFlight, _this.noFlight) || other.noFlight == _this.noFlight)&&const DeepCollectionEquality().equals(other.flights, _this.flights)&&(identical(other.state, _this.state) || other.state == _this.state)&&const DeepCollectionEquality().equals(other.members, _this.members));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleWaveModel;
  return Object.hash(runtimeType,_this.id,_this.direction,_this.stopId,_this.stopName,_this.leaveAt,_this.meetAt,_this.passengers,_this.seats,_this.vehiclesNeeded,_this.noFlight,const DeepCollectionEquality().hash(_this.flights),_this.state,const DeepCollectionEquality().hash(_this.members));
}

@override
String toString() {
  final _this = this as ShuttleWaveModel;
  return 'ShuttleWaveModel(id: ${_this.id}, direction: ${_this.direction}, stopId: ${_this.stopId}, stopName: ${_this.stopName}, leaveAt: ${_this.leaveAt}, meetAt: ${_this.meetAt}, passengers: ${_this.passengers}, seats: ${_this.seats}, vehiclesNeeded: ${_this.vehiclesNeeded}, noFlight: ${_this.noFlight}, flights: ${_this.flights}, state: ${_this.state}, members: ${_this.members})';
}


}

/// @nodoc
abstract mixin class $ShuttleWaveModelCopyWith<$Res>  {
  factory $ShuttleWaveModelCopyWith(ShuttleWaveModel value, $Res Function(ShuttleWaveModel) _then) = _$ShuttleWaveModelCopyWithImpl;
@useResult
$Res call({
 String id, String direction, String? stopId, String? stopName, DateTime leaveAt, DateTime? meetAt, int passengers, int? seats, int? vehiclesNeeded, int noFlight, List<String> flights, String state, List<WaveMemberModel> members
});




}
/// @nodoc
class _$ShuttleWaveModelCopyWithImpl<$Res>
    implements $ShuttleWaveModelCopyWith<$Res> {
  _$ShuttleWaveModelCopyWithImpl(this._self, this._then);

  final ShuttleWaveModel _self;
  final $Res Function(ShuttleWaveModel) _then;

/// Create a copy of ShuttleWaveModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? direction = null,Object? stopId = freezed,Object? stopName = freezed,Object? leaveAt = null,Object? meetAt = freezed,Object? passengers = null,Object? seats = freezed,Object? vehiclesNeeded = freezed,Object? noFlight = null,Object? flights = null,Object? state = null,Object? members = null,}) {
  return _then(ShuttleWaveModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,leaveAt: null == leaveAt ? _self.leaveAt : leaveAt // ignore: cast_nullable_to_non_nullable
as DateTime,meetAt: freezed == meetAt ? _self.meetAt : meetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,vehiclesNeeded: freezed == vehiclesNeeded ? _self.vehiclesNeeded : vehiclesNeeded // ignore: cast_nullable_to_non_nullable
as int?,noFlight: null == noFlight ? _self.noFlight : noFlight // ignore: cast_nullable_to_non_nullable
as int,flights: null == flights ? _self.flights : flights // ignore: cast_nullable_to_non_nullable
as List<String>,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String,members: null == members ? _self.members : members // ignore: cast_nullable_to_non_nullable
as List<WaveMemberModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [ShuttleWaveModel].
extension ShuttleWaveModelPatterns on ShuttleWaveModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleWaveModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleWaveModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleWaveModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleWaveModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleWaveModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleWaveModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String direction,  String? stopId,  String? stopName,  DateTime leaveAt,  DateTime? meetAt,  int passengers,  int? seats,  int? vehiclesNeeded,  int noFlight,  List<String> flights,  String state,  List<WaveMemberModel> members)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleWaveModel() when $default != null:
return $default(_that.id,_that.direction,_that.stopId,_that.stopName,_that.leaveAt,_that.meetAt,_that.passengers,_that.seats,_that.vehiclesNeeded,_that.noFlight,_that.flights,_that.state,_that.members);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String direction,  String? stopId,  String? stopName,  DateTime leaveAt,  DateTime? meetAt,  int passengers,  int? seats,  int? vehiclesNeeded,  int noFlight,  List<String> flights,  String state,  List<WaveMemberModel> members)  $default,) {final _that = this;
switch (_that) {
case _ShuttleWaveModel():
return $default(_that.id,_that.direction,_that.stopId,_that.stopName,_that.leaveAt,_that.meetAt,_that.passengers,_that.seats,_that.vehiclesNeeded,_that.noFlight,_that.flights,_that.state,_that.members);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String direction,  String? stopId,  String? stopName,  DateTime leaveAt,  DateTime? meetAt,  int passengers,  int? seats,  int? vehiclesNeeded,  int noFlight,  List<String> flights,  String state,  List<WaveMemberModel> members)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleWaveModel() when $default != null:
return $default(_that.id,_that.direction,_that.stopId,_that.stopName,_that.leaveAt,_that.meetAt,_that.passengers,_that.seats,_that.vehiclesNeeded,_that.noFlight,_that.flights,_that.state,_that.members);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleWaveModel extends ShuttleWaveModel {
  const _ShuttleWaveModel({required this.id, this.direction = 'dropoff', this.stopId, this.stopName, required this.leaveAt, this.meetAt, this.passengers = 0, this.seats, this.vehiclesNeeded, this.noFlight = 0,  List<String> flights = const [], this.state = 'planned',  List<WaveMemberModel> members = const []}): _flights = flights,_members = members,super._();
  factory _ShuttleWaveModel.fromJson(Map<String, dynamic> json) => _$ShuttleWaveModelFromJson(json);

@override final  String id;
@override@JsonKey() final  String direction;
@override final  String? stopId;
@override final  String? stopName;
@override final  DateTime leaveAt;
@override final  DateTime? meetAt;
@override@JsonKey() final  int passengers;
@override final  int? seats;
@override final  int? vehiclesNeeded;
@override@JsonKey() final  int noFlight;
 final  List<String> _flights;
@override@JsonKey() List<String> get flights {
  if (_flights is EqualUnmodifiableListView) return _flights;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_flights);
}

@override@JsonKey() final  String state;
 final  List<WaveMemberModel> _members;
@override@JsonKey() List<WaveMemberModel> get members {
  if (_members is EqualUnmodifiableListView) return _members;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_members);
}


/// Create a copy of ShuttleWaveModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleWaveModelCopyWith<_ShuttleWaveModel> get copyWith => __$ShuttleWaveModelCopyWithImpl<_ShuttleWaveModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttleWaveModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleWaveModel&&(identical(other.id, id) || other.id == id)&&(identical(other.direction, direction) || other.direction == direction)&&(identical(other.stopId, stopId) || other.stopId == stopId)&&(identical(other.stopName, stopName) || other.stopName == stopName)&&(identical(other.leaveAt, leaveAt) || other.leaveAt == leaveAt)&&(identical(other.meetAt, meetAt) || other.meetAt == meetAt)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.seats, seats) || other.seats == seats)&&(identical(other.vehiclesNeeded, vehiclesNeeded) || other.vehiclesNeeded == vehiclesNeeded)&&(identical(other.noFlight, noFlight) || other.noFlight == noFlight)&&const DeepCollectionEquality().equals(other.flights, _flights)&&(identical(other.state, state) || other.state == state)&&const DeepCollectionEquality().equals(other.members, _members));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,direction,stopId,stopName,leaveAt,meetAt,passengers,seats,vehiclesNeeded,noFlight,const DeepCollectionEquality().hash(_flights),state,const DeepCollectionEquality().hash(_members));
}

@override
String toString() {
    return 'ShuttleWaveModel(id: $id, direction: $direction, stopId: $stopId, stopName: $stopName, leaveAt: $leaveAt, meetAt: $meetAt, passengers: $passengers, seats: $seats, vehiclesNeeded: $vehiclesNeeded, noFlight: $noFlight, flights: $flights, state: $state, members: $members)';
}


}

/// @nodoc
abstract mixin class _$ShuttleWaveModelCopyWith<$Res> implements $ShuttleWaveModelCopyWith<$Res> {
  factory _$ShuttleWaveModelCopyWith(_ShuttleWaveModel value, $Res Function(_ShuttleWaveModel) _then) = __$ShuttleWaveModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String direction, String? stopId, String? stopName, DateTime leaveAt, DateTime? meetAt, int passengers, int? seats, int? vehiclesNeeded, int noFlight, List<String> flights, String state, List<WaveMemberModel> members
});




}
/// @nodoc
class __$ShuttleWaveModelCopyWithImpl<$Res>
    implements _$ShuttleWaveModelCopyWith<$Res> {
  __$ShuttleWaveModelCopyWithImpl(this._self, this._then);

  final _ShuttleWaveModel _self;
  final $Res Function(_ShuttleWaveModel) _then;

/// Create a copy of ShuttleWaveModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? direction = null,Object? stopId = freezed,Object? stopName = freezed,Object? leaveAt = null,Object? meetAt = freezed,Object? passengers = null,Object? seats = freezed,Object? vehiclesNeeded = freezed,Object? noFlight = null,Object? flights = null,Object? state = null,Object? members = null,}) {
  return _then(_ShuttleWaveModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,stopId: freezed == stopId ? _self.stopId : stopId // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,leaveAt: null == leaveAt ? _self.leaveAt : leaveAt // ignore: cast_nullable_to_non_nullable
as DateTime,meetAt: freezed == meetAt ? _self.meetAt : meetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,vehiclesNeeded: freezed == vehiclesNeeded ? _self.vehiclesNeeded : vehiclesNeeded // ignore: cast_nullable_to_non_nullable
as int?,noFlight: null == noFlight ? _self.noFlight : noFlight // ignore: cast_nullable_to_non_nullable
as int,flights: null == flights ? _self._flights : flights // ignore: cast_nullable_to_non_nullable
as List<String>,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String,members: null == members ? _self._members : members // ignore: cast_nullable_to_non_nullable
as List<WaveMemberModel>,
  ));
}


}


/// @nodoc
mixin _$WaveTimesModel {

 int get shuttleTravelMinutes; int get terminalLeadMinutes; int get landingDelayMinutes;
/// Create a copy of WaveTimesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WaveTimesModelCopyWith<WaveTimesModel> get copyWith => _$WaveTimesModelCopyWithImpl<WaveTimesModel>(this as WaveTimesModel, _$identity);

  /// Serializes this WaveTimesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as WaveTimesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WaveTimesModel&&(identical(other.shuttleTravelMinutes, _this.shuttleTravelMinutes) || other.shuttleTravelMinutes == _this.shuttleTravelMinutes)&&(identical(other.terminalLeadMinutes, _this.terminalLeadMinutes) || other.terminalLeadMinutes == _this.terminalLeadMinutes)&&(identical(other.landingDelayMinutes, _this.landingDelayMinutes) || other.landingDelayMinutes == _this.landingDelayMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as WaveTimesModel;
  return Object.hash(runtimeType,_this.shuttleTravelMinutes,_this.terminalLeadMinutes,_this.landingDelayMinutes);
}

@override
String toString() {
  final _this = this as WaveTimesModel;
  return 'WaveTimesModel(shuttleTravelMinutes: ${_this.shuttleTravelMinutes}, terminalLeadMinutes: ${_this.terminalLeadMinutes}, landingDelayMinutes: ${_this.landingDelayMinutes})';
}


}

/// @nodoc
abstract mixin class $WaveTimesModelCopyWith<$Res>  {
  factory $WaveTimesModelCopyWith(WaveTimesModel value, $Res Function(WaveTimesModel) _then) = _$WaveTimesModelCopyWithImpl;
@useResult
$Res call({
 int shuttleTravelMinutes, int terminalLeadMinutes, int landingDelayMinutes
});




}
/// @nodoc
class _$WaveTimesModelCopyWithImpl<$Res>
    implements $WaveTimesModelCopyWith<$Res> {
  _$WaveTimesModelCopyWithImpl(this._self, this._then);

  final WaveTimesModel _self;
  final $Res Function(WaveTimesModel) _then;

/// Create a copy of WaveTimesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? shuttleTravelMinutes = null,Object? terminalLeadMinutes = null,Object? landingDelayMinutes = null,}) {
  return _then(WaveTimesModel(
shuttleTravelMinutes: null == shuttleTravelMinutes ? _self.shuttleTravelMinutes : shuttleTravelMinutes // ignore: cast_nullable_to_non_nullable
as int,terminalLeadMinutes: null == terminalLeadMinutes ? _self.terminalLeadMinutes : terminalLeadMinutes // ignore: cast_nullable_to_non_nullable
as int,landingDelayMinutes: null == landingDelayMinutes ? _self.landingDelayMinutes : landingDelayMinutes // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [WaveTimesModel].
extension WaveTimesModelPatterns on WaveTimesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WaveTimesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WaveTimesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WaveTimesModel value)  $default,){
final _that = this;
switch (_that) {
case _WaveTimesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WaveTimesModel value)?  $default,){
final _that = this;
switch (_that) {
case _WaveTimesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int shuttleTravelMinutes,  int terminalLeadMinutes,  int landingDelayMinutes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WaveTimesModel() when $default != null:
return $default(_that.shuttleTravelMinutes,_that.terminalLeadMinutes,_that.landingDelayMinutes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int shuttleTravelMinutes,  int terminalLeadMinutes,  int landingDelayMinutes)  $default,) {final _that = this;
switch (_that) {
case _WaveTimesModel():
return $default(_that.shuttleTravelMinutes,_that.terminalLeadMinutes,_that.landingDelayMinutes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int shuttleTravelMinutes,  int terminalLeadMinutes,  int landingDelayMinutes)?  $default,) {final _that = this;
switch (_that) {
case _WaveTimesModel() when $default != null:
return $default(_that.shuttleTravelMinutes,_that.terminalLeadMinutes,_that.landingDelayMinutes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WaveTimesModel implements WaveTimesModel {
  const _WaveTimesModel({this.shuttleTravelMinutes = 8, this.terminalLeadMinutes = 120, this.landingDelayMinutes = 30});
  factory _WaveTimesModel.fromJson(Map<String, dynamic> json) => _$WaveTimesModelFromJson(json);

@override@JsonKey() final  int shuttleTravelMinutes;
@override@JsonKey() final  int terminalLeadMinutes;
@override@JsonKey() final  int landingDelayMinutes;

/// Create a copy of WaveTimesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WaveTimesModelCopyWith<_WaveTimesModel> get copyWith => __$WaveTimesModelCopyWithImpl<_WaveTimesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WaveTimesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _WaveTimesModel&&(identical(other.shuttleTravelMinutes, shuttleTravelMinutes) || other.shuttleTravelMinutes == shuttleTravelMinutes)&&(identical(other.terminalLeadMinutes, terminalLeadMinutes) || other.terminalLeadMinutes == terminalLeadMinutes)&&(identical(other.landingDelayMinutes, landingDelayMinutes) || other.landingDelayMinutes == landingDelayMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,shuttleTravelMinutes,terminalLeadMinutes,landingDelayMinutes);
}

@override
String toString() {
    return 'WaveTimesModel(shuttleTravelMinutes: $shuttleTravelMinutes, terminalLeadMinutes: $terminalLeadMinutes, landingDelayMinutes: $landingDelayMinutes)';
}


}

/// @nodoc
abstract mixin class _$WaveTimesModelCopyWith<$Res> implements $WaveTimesModelCopyWith<$Res> {
  factory _$WaveTimesModelCopyWith(_WaveTimesModel value, $Res Function(_WaveTimesModel) _then) = __$WaveTimesModelCopyWithImpl;
@override @useResult
$Res call({
 int shuttleTravelMinutes, int terminalLeadMinutes, int landingDelayMinutes
});




}
/// @nodoc
class __$WaveTimesModelCopyWithImpl<$Res>
    implements _$WaveTimesModelCopyWith<$Res> {
  __$WaveTimesModelCopyWithImpl(this._self, this._then);

  final _WaveTimesModel _self;
  final $Res Function(_WaveTimesModel) _then;

/// Create a copy of WaveTimesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? shuttleTravelMinutes = null,Object? terminalLeadMinutes = null,Object? landingDelayMinutes = null,}) {
  return _then(_WaveTimesModel(
shuttleTravelMinutes: null == shuttleTravelMinutes ? _self.shuttleTravelMinutes : shuttleTravelMinutes // ignore: cast_nullable_to_non_nullable
as int,terminalLeadMinutes: null == terminalLeadMinutes ? _self.terminalLeadMinutes : terminalLeadMinutes // ignore: cast_nullable_to_non_nullable
as int,landingDelayMinutes: null == landingDelayMinutes ? _self.landingDelayMinutes : landingDelayMinutes // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$ShuttleForecastModel {

 DateTime get serverTime; String get date; WaveTimesModel get times; int? get seats; int get vehiclesInService; List<ShuttleWaveModel> get waves;
/// Create a copy of ShuttleForecastModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleForecastModelCopyWith<ShuttleForecastModel> get copyWith => _$ShuttleForecastModelCopyWithImpl<ShuttleForecastModel>(this as ShuttleForecastModel, _$identity);

  /// Serializes this ShuttleForecastModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttleForecastModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleForecastModel&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.times, _this.times) || other.times == _this.times)&&(identical(other.seats, _this.seats) || other.seats == _this.seats)&&(identical(other.vehiclesInService, _this.vehiclesInService) || other.vehiclesInService == _this.vehiclesInService)&&const DeepCollectionEquality().equals(other.waves, _this.waves));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleForecastModel;
  return Object.hash(runtimeType,_this.serverTime,_this.date,_this.times,_this.seats,_this.vehiclesInService,const DeepCollectionEquality().hash(_this.waves));
}

@override
String toString() {
  final _this = this as ShuttleForecastModel;
  return 'ShuttleForecastModel(serverTime: ${_this.serverTime}, date: ${_this.date}, times: ${_this.times}, seats: ${_this.seats}, vehiclesInService: ${_this.vehiclesInService}, waves: ${_this.waves})';
}


}

/// @nodoc
abstract mixin class $ShuttleForecastModelCopyWith<$Res>  {
  factory $ShuttleForecastModelCopyWith(ShuttleForecastModel value, $Res Function(ShuttleForecastModel) _then) = _$ShuttleForecastModelCopyWithImpl;
@useResult
$Res call({
 DateTime serverTime, String date, WaveTimesModel times, int? seats, int vehiclesInService, List<ShuttleWaveModel> waves
});


$WaveTimesModelCopyWith<$Res> get times;

}
/// @nodoc
class _$ShuttleForecastModelCopyWithImpl<$Res>
    implements $ShuttleForecastModelCopyWith<$Res> {
  _$ShuttleForecastModelCopyWithImpl(this._self, this._then);

  final ShuttleForecastModel _self;
  final $Res Function(ShuttleForecastModel) _then;

/// Create a copy of ShuttleForecastModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? serverTime = null,Object? date = null,Object? times = null,Object? seats = freezed,Object? vehiclesInService = null,Object? waves = null,}) {
  return _then(ShuttleForecastModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,times: null == times ? _self.times : times // ignore: cast_nullable_to_non_nullable
as WaveTimesModel,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,vehiclesInService: null == vehiclesInService ? _self.vehiclesInService : vehiclesInService // ignore: cast_nullable_to_non_nullable
as int,waves: null == waves ? _self.waves : waves // ignore: cast_nullable_to_non_nullable
as List<ShuttleWaveModel>,
  ));
}
/// Create a copy of ShuttleForecastModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WaveTimesModelCopyWith<$Res> get times {
  
  return $WaveTimesModelCopyWith<$Res>(_self.times, (value) {
    return _then(_self.copyWith(times: value));
  });
}
}


/// Adds pattern-matching-related methods to [ShuttleForecastModel].
extension ShuttleForecastModelPatterns on ShuttleForecastModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleForecastModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleForecastModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleForecastModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleForecastModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleForecastModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleForecastModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime serverTime,  String date,  WaveTimesModel times,  int? seats,  int vehiclesInService,  List<ShuttleWaveModel> waves)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleForecastModel() when $default != null:
return $default(_that.serverTime,_that.date,_that.times,_that.seats,_that.vehiclesInService,_that.waves);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime serverTime,  String date,  WaveTimesModel times,  int? seats,  int vehiclesInService,  List<ShuttleWaveModel> waves)  $default,) {final _that = this;
switch (_that) {
case _ShuttleForecastModel():
return $default(_that.serverTime,_that.date,_that.times,_that.seats,_that.vehiclesInService,_that.waves);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime serverTime,  String date,  WaveTimesModel times,  int? seats,  int vehiclesInService,  List<ShuttleWaveModel> waves)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleForecastModel() when $default != null:
return $default(_that.serverTime,_that.date,_that.times,_that.seats,_that.vehiclesInService,_that.waves);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleForecastModel implements ShuttleForecastModel {
  const _ShuttleForecastModel({required this.serverTime, required this.date, this.times = const WaveTimesModel(), this.seats, this.vehiclesInService = 0,  List<ShuttleWaveModel> waves = const []}): _waves = waves;
  factory _ShuttleForecastModel.fromJson(Map<String, dynamic> json) => _$ShuttleForecastModelFromJson(json);

@override final  DateTime serverTime;
@override final  String date;
@override@JsonKey() final  WaveTimesModel times;
@override final  int? seats;
@override@JsonKey() final  int vehiclesInService;
 final  List<ShuttleWaveModel> _waves;
@override@JsonKey() List<ShuttleWaveModel> get waves {
  if (_waves is EqualUnmodifiableListView) return _waves;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_waves);
}


/// Create a copy of ShuttleForecastModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleForecastModelCopyWith<_ShuttleForecastModel> get copyWith => __$ShuttleForecastModelCopyWithImpl<_ShuttleForecastModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttleForecastModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleForecastModel&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&(identical(other.date, date) || other.date == date)&&(identical(other.times, times) || other.times == times)&&(identical(other.seats, seats) || other.seats == seats)&&(identical(other.vehiclesInService, vehiclesInService) || other.vehiclesInService == vehiclesInService)&&const DeepCollectionEquality().equals(other.waves, _waves));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,serverTime,date,times,seats,vehiclesInService,const DeepCollectionEquality().hash(_waves));
}

@override
String toString() {
    return 'ShuttleForecastModel(serverTime: $serverTime, date: $date, times: $times, seats: $seats, vehiclesInService: $vehiclesInService, waves: $waves)';
}


}

/// @nodoc
abstract mixin class _$ShuttleForecastModelCopyWith<$Res> implements $ShuttleForecastModelCopyWith<$Res> {
  factory _$ShuttleForecastModelCopyWith(_ShuttleForecastModel value, $Res Function(_ShuttleForecastModel) _then) = __$ShuttleForecastModelCopyWithImpl;
@override @useResult
$Res call({
 DateTime serverTime, String date, WaveTimesModel times, int? seats, int vehiclesInService, List<ShuttleWaveModel> waves
});


@override $WaveTimesModelCopyWith<$Res> get times;

}
/// @nodoc
class __$ShuttleForecastModelCopyWithImpl<$Res>
    implements _$ShuttleForecastModelCopyWith<$Res> {
  __$ShuttleForecastModelCopyWithImpl(this._self, this._then);

  final _ShuttleForecastModel _self;
  final $Res Function(_ShuttleForecastModel) _then;

/// Create a copy of ShuttleForecastModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? serverTime = null,Object? date = null,Object? times = null,Object? seats = freezed,Object? vehiclesInService = null,Object? waves = null,}) {
  return _then(_ShuttleForecastModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,times: null == times ? _self.times : times // ignore: cast_nullable_to_non_nullable
as WaveTimesModel,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,vehiclesInService: null == vehiclesInService ? _self.vehiclesInService : vehiclesInService // ignore: cast_nullable_to_non_nullable
as int,waves: null == waves ? _self._waves : waves // ignore: cast_nullable_to_non_nullable
as List<ShuttleWaveModel>,
  ));
}

/// Create a copy of ShuttleForecastModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WaveTimesModelCopyWith<$Res> get times {
  
  return $WaveTimesModelCopyWith<$Res>(_self.times, (value) {
    return _then(_self.copyWith(times: value));
  });
}
}


/// @nodoc
mixin _$PickupNoticeModel {

 String get kind; String? get text; DateTime get at;
/// Create a copy of PickupNoticeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PickupNoticeModelCopyWith<PickupNoticeModel> get copyWith => _$PickupNoticeModelCopyWithImpl<PickupNoticeModel>(this as PickupNoticeModel, _$identity);

  /// Serializes this PickupNoticeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PickupNoticeModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PickupNoticeModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.text, _this.text) || other.text == _this.text)&&(identical(other.at, _this.at) || other.at == _this.at));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PickupNoticeModel;
  return Object.hash(runtimeType,_this.kind,_this.text,_this.at);
}

@override
String toString() {
  final _this = this as PickupNoticeModel;
  return 'PickupNoticeModel(kind: ${_this.kind}, text: ${_this.text}, at: ${_this.at})';
}


}

/// @nodoc
abstract mixin class $PickupNoticeModelCopyWith<$Res>  {
  factory $PickupNoticeModelCopyWith(PickupNoticeModel value, $Res Function(PickupNoticeModel) _then) = _$PickupNoticeModelCopyWithImpl;
@useResult
$Res call({
 String kind, String? text, DateTime at
});




}
/// @nodoc
class _$PickupNoticeModelCopyWithImpl<$Res>
    implements $PickupNoticeModelCopyWith<$Res> {
  _$PickupNoticeModelCopyWithImpl(this._self, this._then);

  final PickupNoticeModel _self;
  final $Res Function(PickupNoticeModel) _then;

/// Create a copy of PickupNoticeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? text = freezed,Object? at = null,}) {
  return _then(PickupNoticeModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,text: freezed == text ? _self.text : text // ignore: cast_nullable_to_non_nullable
as String?,at: null == at ? _self.at : at // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [PickupNoticeModel].
extension PickupNoticeModelPatterns on PickupNoticeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PickupNoticeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PickupNoticeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PickupNoticeModel value)  $default,){
final _that = this;
switch (_that) {
case _PickupNoticeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PickupNoticeModel value)?  $default,){
final _that = this;
switch (_that) {
case _PickupNoticeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  String? text,  DateTime at)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PickupNoticeModel() when $default != null:
return $default(_that.kind,_that.text,_that.at);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  String? text,  DateTime at)  $default,) {final _that = this;
switch (_that) {
case _PickupNoticeModel():
return $default(_that.kind,_that.text,_that.at);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  String? text,  DateTime at)?  $default,) {final _that = this;
switch (_that) {
case _PickupNoticeModel() when $default != null:
return $default(_that.kind,_that.text,_that.at);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PickupNoticeModel implements PickupNoticeModel {
  const _PickupNoticeModel({required this.kind, this.text, required this.at});
  factory _PickupNoticeModel.fromJson(Map<String, dynamic> json) => _$PickupNoticeModelFromJson(json);

@override final  String kind;
@override final  String? text;
@override final  DateTime at;

/// Create a copy of PickupNoticeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PickupNoticeModelCopyWith<_PickupNoticeModel> get copyWith => __$PickupNoticeModelCopyWithImpl<_PickupNoticeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PickupNoticeModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PickupNoticeModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.text, text) || other.text == text)&&(identical(other.at, at) || other.at == at));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,text,at);
}

@override
String toString() {
    return 'PickupNoticeModel(kind: $kind, text: $text, at: $at)';
}


}

/// @nodoc
abstract mixin class _$PickupNoticeModelCopyWith<$Res> implements $PickupNoticeModelCopyWith<$Res> {
  factory _$PickupNoticeModelCopyWith(_PickupNoticeModel value, $Res Function(_PickupNoticeModel) _then) = __$PickupNoticeModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, String? text, DateTime at
});




}
/// @nodoc
class __$PickupNoticeModelCopyWithImpl<$Res>
    implements _$PickupNoticeModelCopyWith<$Res> {
  __$PickupNoticeModelCopyWithImpl(this._self, this._then);

  final _PickupNoticeModel _self;
  final $Res Function(_PickupNoticeModel) _then;

/// Create a copy of PickupNoticeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? text = freezed,Object? at = null,}) {
  return _then(_PickupNoticeModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,text: freezed == text ? _self.text : text // ignore: cast_nullable_to_non_nullable
as String?,at: null == at ? _self.at : at // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
