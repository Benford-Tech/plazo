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

 String get reservationId; String get reference; String get customerName; int get passengers; String get plate; String get status; DateTime get returnAt; FlightViewModel get flight; String? get terminal; DateTime? get atMeetingPointAt;/// The running trip this traveller is on, if any.
 String? get tripId;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PickupRowModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.flight, _this.flight) || other.flight == _this.flight)&&(identical(other.terminal, _this.terminal) || other.terminal == _this.terminal)&&(identical(other.atMeetingPointAt, _this.atMeetingPointAt) || other.atMeetingPointAt == _this.atMeetingPointAt)&&(identical(other.tripId, _this.tripId) || other.tripId == _this.tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PickupRowModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.status,_this.returnAt,_this.flight,_this.terminal,_this.atMeetingPointAt,_this.tripId);
}

@override
String toString() {
  final _this = this as PickupRowModel;
  return 'PickupRowModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, status: ${_this.status}, returnAt: ${_this.returnAt}, flight: ${_this.flight}, terminal: ${_this.terminal}, atMeetingPointAt: ${_this.atMeetingPointAt}, tripId: ${_this.tripId})';
}


}

/// @nodoc
abstract mixin class $PickupRowModelCopyWith<$Res>  {
  factory $PickupRowModelCopyWith(PickupRowModel value, $Res Function(PickupRowModel) _then) = _$PickupRowModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime returnAt, FlightViewModel flight, String? terminal, DateTime? atMeetingPointAt, String? tripId
});


$FlightViewModelCopyWith<$Res> get flight;

}
/// @nodoc
class _$PickupRowModelCopyWithImpl<$Res>
    implements $PickupRowModelCopyWith<$Res> {
  _$PickupRowModelCopyWithImpl(this._self, this._then);

  final PickupRowModel _self;
  final $Res Function(PickupRowModel) _then;

/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? returnAt = null,Object? flight = null,Object? terminal = freezed,Object? atMeetingPointAt = freezed,Object? tripId = freezed,}) {
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
as String?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime returnAt,  FlightViewModel flight,  String? terminal,  DateTime? atMeetingPointAt,  String? tripId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PickupRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.returnAt,_that.flight,_that.terminal,_that.atMeetingPointAt,_that.tripId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime returnAt,  FlightViewModel flight,  String? terminal,  DateTime? atMeetingPointAt,  String? tripId)  $default,) {final _that = this;
switch (_that) {
case _PickupRowModel():
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.returnAt,_that.flight,_that.terminal,_that.atMeetingPointAt,_that.tripId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime returnAt,  FlightViewModel flight,  String? terminal,  DateTime? atMeetingPointAt,  String? tripId)?  $default,) {final _that = this;
switch (_that) {
case _PickupRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.returnAt,_that.flight,_that.terminal,_that.atMeetingPointAt,_that.tripId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PickupRowModel extends PickupRowModel {
  const _PickupRowModel({required this.reservationId, required this.reference, required this.customerName, required this.passengers, required this.plate, required this.status, required this.returnAt, this.flight = const FlightViewModel(), this.terminal, this.atMeetingPointAt, this.tripId}): super._();
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
@override final  DateTime? atMeetingPointAt;
/// The running trip this traveller is on, if any.
@override final  String? tripId;

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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PickupRowModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.flight, flight) || other.flight == flight)&&(identical(other.terminal, terminal) || other.terminal == terminal)&&(identical(other.atMeetingPointAt, atMeetingPointAt) || other.atMeetingPointAt == atMeetingPointAt)&&(identical(other.tripId, tripId) || other.tripId == tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,customerName,passengers,plate,status,returnAt,flight,terminal,atMeetingPointAt,tripId);
}

@override
String toString() {
    return 'PickupRowModel(reservationId: $reservationId, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, status: $status, returnAt: $returnAt, flight: $flight, terminal: $terminal, atMeetingPointAt: $atMeetingPointAt, tripId: $tripId)';
}


}

/// @nodoc
abstract mixin class _$PickupRowModelCopyWith<$Res> implements $PickupRowModelCopyWith<$Res> {
  factory _$PickupRowModelCopyWith(_PickupRowModel value, $Res Function(_PickupRowModel) _then) = __$PickupRowModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime returnAt, FlightViewModel flight, String? terminal, DateTime? atMeetingPointAt, String? tripId
});


@override $FlightViewModelCopyWith<$Res> get flight;

}
/// @nodoc
class __$PickupRowModelCopyWithImpl<$Res>
    implements _$PickupRowModelCopyWith<$Res> {
  __$PickupRowModelCopyWithImpl(this._self, this._then);

  final _PickupRowModel _self;
  final $Res Function(_PickupRowModel) _then;

/// Create a copy of PickupRowModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? returnAt = null,Object? flight = null,Object? terminal = freezed,Object? atMeetingPointAt = freezed,Object? tripId = freezed,}) {
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
as String?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,tripId: freezed == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String?,
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
 String? get driverId; String? get driverName;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleVehicleModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.model, _this.model) || other.model == _this.model)&&(identical(other.colour, _this.colour) || other.colour == _this.colour)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.seats, _this.seats) || other.seats == _this.seats)&&(identical(other.inService, _this.inService) || other.inService == _this.inService)&&(identical(other.driverId, _this.driverId) || other.driverId == _this.driverId)&&(identical(other.driverName, _this.driverName) || other.driverName == _this.driverName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleVehicleModel;
  return Object.hash(runtimeType,_this.id,_this.model,_this.colour,_this.plate,_this.seats,_this.inService,_this.driverId,_this.driverName);
}

@override
String toString() {
  final _this = this as ShuttleVehicleModel;
  return 'ShuttleVehicleModel(id: ${_this.id}, model: ${_this.model}, colour: ${_this.colour}, plate: ${_this.plate}, seats: ${_this.seats}, inService: ${_this.inService}, driverId: ${_this.driverId}, driverName: ${_this.driverName})';
}


}

/// @nodoc
abstract mixin class $ShuttleVehicleModelCopyWith<$Res>  {
  factory $ShuttleVehicleModelCopyWith(ShuttleVehicleModel value, $Res Function(ShuttleVehicleModel) _then) = _$ShuttleVehicleModelCopyWithImpl;
@useResult
$Res call({
 String id, String model, String? colour, String? plate, int? seats, bool inService, String? driverId, String? driverName
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
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? model = null,Object? colour = freezed,Object? plate = freezed,Object? seats = freezed,Object? inService = null,Object? driverId = freezed,Object? driverName = freezed,}) {
  return _then(ShuttleVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,model: null == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,inService: null == inService ? _self.inService : inService // ignore: cast_nullable_to_non_nullable
as bool,driverId: freezed == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String?,driverName: freezed == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String model,  String? colour,  String? plate,  int? seats,  bool inService,  String? driverId,  String? driverName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleVehicleModel() when $default != null:
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats,_that.inService,_that.driverId,_that.driverName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String model,  String? colour,  String? plate,  int? seats,  bool inService,  String? driverId,  String? driverName)  $default,) {final _that = this;
switch (_that) {
case _ShuttleVehicleModel():
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats,_that.inService,_that.driverId,_that.driverName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String model,  String? colour,  String? plate,  int? seats,  bool inService,  String? driverId,  String? driverName)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleVehicleModel() when $default != null:
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats,_that.inService,_that.driverId,_that.driverName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleVehicleModel extends ShuttleVehicleModel {
  const _ShuttleVehicleModel({required this.id, required this.model, this.colour, this.plate, this.seats, this.inService = true, this.driverId, this.driverName}): super._();
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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleVehicleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.model, model) || other.model == model)&&(identical(other.colour, colour) || other.colour == colour)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.seats, seats) || other.seats == seats)&&(identical(other.inService, inService) || other.inService == inService)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,model,colour,plate,seats,inService,driverId,driverName);
}

@override
String toString() {
    return 'ShuttleVehicleModel(id: $id, model: $model, colour: $colour, plate: $plate, seats: $seats, inService: $inService, driverId: $driverId, driverName: $driverName)';
}


}

/// @nodoc
abstract mixin class _$ShuttleVehicleModelCopyWith<$Res> implements $ShuttleVehicleModelCopyWith<$Res> {
  factory _$ShuttleVehicleModelCopyWith(_ShuttleVehicleModel value, $Res Function(_ShuttleVehicleModel) _then) = __$ShuttleVehicleModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String model, String? colour, String? plate, int? seats, bool inService, String? driverId, String? driverName
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
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? model = null,Object? colour = freezed,Object? plate = freezed,Object? seats = freezed,Object? inService = null,Object? driverId = freezed,Object? driverName = freezed,}) {
  return _then(_ShuttleVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,model: null == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,inService: null == inService ? _self.inService : inService // ignore: cast_nullable_to_non_nullable
as bool,driverId: freezed == driverId ? _self.driverId : driverId // ignore: cast_nullable_to_non_nullable
as String?,driverName: freezed == driverName ? _self.driverName : driverName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$DepartureRowModel {

 String get reservationId; String get reference; String get customerName; int get passengers; String get plate; String get status; DateTime get arrivalAt; DateTime? get arrivedAt;/// Spot code, when the vehicle was placed.
 String? get spot; String? get tripId;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DepartureRowModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.arrivedAt, _this.arrivedAt) || other.arrivedAt == _this.arrivedAt)&&(identical(other.spot, _this.spot) || other.spot == _this.spot)&&(identical(other.tripId, _this.tripId) || other.tripId == _this.tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DepartureRowModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.status,_this.arrivalAt,_this.arrivedAt,_this.spot,_this.tripId);
}

@override
String toString() {
  final _this = this as DepartureRowModel;
  return 'DepartureRowModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, arrivedAt: ${_this.arrivedAt}, spot: ${_this.spot}, tripId: ${_this.tripId})';
}


}

/// @nodoc
abstract mixin class $DepartureRowModelCopyWith<$Res>  {
  factory $DepartureRowModelCopyWith(DepartureRowModel value, $Res Function(DepartureRowModel) _then) = _$DepartureRowModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime arrivalAt, DateTime? arrivedAt, String? spot, String? tripId
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
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? arrivedAt = freezed,Object? spot = freezed,Object? tripId = freezed,}) {
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime arrivalAt,  DateTime? arrivedAt,  String? spot,  String? tripId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DepartureRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.arrivedAt,_that.spot,_that.tripId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime arrivalAt,  DateTime? arrivedAt,  String? spot,  String? tripId)  $default,) {final _that = this;
switch (_that) {
case _DepartureRowModel():
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.arrivedAt,_that.spot,_that.tripId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String customerName,  int passengers,  String plate,  String status,  DateTime arrivalAt,  DateTime? arrivedAt,  String? spot,  String? tripId)?  $default,) {final _that = this;
switch (_that) {
case _DepartureRowModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.arrivedAt,_that.spot,_that.tripId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DepartureRowModel implements DepartureRowModel {
  const _DepartureRowModel({required this.reservationId, required this.reference, required this.customerName, required this.passengers, required this.plate, required this.status, required this.arrivalAt, this.arrivedAt, this.spot, this.tripId});
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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DepartureRowModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.arrivedAt, arrivedAt) || other.arrivedAt == arrivedAt)&&(identical(other.spot, spot) || other.spot == spot)&&(identical(other.tripId, tripId) || other.tripId == tripId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,customerName,passengers,plate,status,arrivalAt,arrivedAt,spot,tripId);
}

@override
String toString() {
    return 'DepartureRowModel(reservationId: $reservationId, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, status: $status, arrivalAt: $arrivalAt, arrivedAt: $arrivedAt, spot: $spot, tripId: $tripId)';
}


}

/// @nodoc
abstract mixin class _$DepartureRowModelCopyWith<$Res> implements $DepartureRowModelCopyWith<$Res> {
  factory _$DepartureRowModelCopyWith(_DepartureRowModel value, $Res Function(_DepartureRowModel) _then) = __$DepartureRowModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String customerName, int passengers, String plate, String status, DateTime arrivalAt, DateTime? arrivedAt, String? spot, String? tripId
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
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? arrivedAt = freezed,Object? spot = freezed,Object? tripId = freezed,}) {
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
 String get direction; String get driverId; String get driverName; TripVehicleModel get vehicle; DateTime get startedAt; DateTime get expiresAt; DateTime? get endedAt; String? get endReason; int get secondsLeft; List<TripPassengerModel> get passengers; DateTime? get positionUpdatedAt; MeetingPointModel? get meetingPoint;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffTripModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&(identical(other.driverId, _this.driverId) || other.driverId == _this.driverId)&&(identical(other.driverName, _this.driverName) || other.driverName == _this.driverName)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt)&&(identical(other.endedAt, _this.endedAt) || other.endedAt == _this.endedAt)&&(identical(other.endReason, _this.endReason) || other.endReason == _this.endReason)&&(identical(other.secondsLeft, _this.secondsLeft) || other.secondsLeft == _this.secondsLeft)&&const DeepCollectionEquality().equals(other.passengers, _this.passengers)&&(identical(other.positionUpdatedAt, _this.positionUpdatedAt) || other.positionUpdatedAt == _this.positionUpdatedAt)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StaffTripModel;
  return Object.hash(runtimeType,_this.id,_this.status,_this.direction,_this.driverId,_this.driverName,_this.vehicle,_this.startedAt,_this.expiresAt,_this.endedAt,_this.endReason,_this.secondsLeft,const DeepCollectionEquality().hash(_this.passengers),_this.positionUpdatedAt,_this.meetingPoint);
}

@override
String toString() {
  final _this = this as StaffTripModel;
  return 'StaffTripModel(id: ${_this.id}, status: ${_this.status}, direction: ${_this.direction}, driverId: ${_this.driverId}, driverName: ${_this.driverName}, vehicle: ${_this.vehicle}, startedAt: ${_this.startedAt}, expiresAt: ${_this.expiresAt}, endedAt: ${_this.endedAt}, endReason: ${_this.endReason}, secondsLeft: ${_this.secondsLeft}, passengers: ${_this.passengers}, positionUpdatedAt: ${_this.positionUpdatedAt}, meetingPoint: ${_this.meetingPoint})';
}


}

/// @nodoc
abstract mixin class $StaffTripModelCopyWith<$Res>  {
  factory $StaffTripModelCopyWith(StaffTripModel value, $Res Function(StaffTripModel) _then) = _$StaffTripModelCopyWithImpl;
@useResult
$Res call({
 String id, String status, String direction, String driverId, String driverName, TripVehicleModel vehicle, DateTime startedAt, DateTime expiresAt, DateTime? endedAt, String? endReason, int secondsLeft, List<TripPassengerModel> passengers, DateTime? positionUpdatedAt, MeetingPointModel? meetingPoint
});


$TripVehicleModelCopyWith<$Res> get vehicle;$MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class _$StaffTripModelCopyWithImpl<$Res>
    implements $StaffTripModelCopyWith<$Res> {
  _$StaffTripModelCopyWithImpl(this._self, this._then);

  final StaffTripModel _self;
  final $Res Function(StaffTripModel) _then;

/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? status = null,Object? direction = null,Object? driverId = null,Object? driverName = null,Object? vehicle = null,Object? startedAt = null,Object? expiresAt = null,Object? endedAt = freezed,Object? endReason = freezed,Object? secondsLeft = null,Object? passengers = null,Object? positionUpdatedAt = freezed,Object? meetingPoint = freezed,}) {
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
as MeetingPointModel?,
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String status,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  DateTime startedAt,  DateTime expiresAt,  DateTime? endedAt,  String? endReason,  int secondsLeft,  List<TripPassengerModel> passengers,  DateTime? positionUpdatedAt,  MeetingPointModel? meetingPoint)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffTripModel() when $default != null:
return $default(_that.id,_that.status,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.startedAt,_that.expiresAt,_that.endedAt,_that.endReason,_that.secondsLeft,_that.passengers,_that.positionUpdatedAt,_that.meetingPoint);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String status,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  DateTime startedAt,  DateTime expiresAt,  DateTime? endedAt,  String? endReason,  int secondsLeft,  List<TripPassengerModel> passengers,  DateTime? positionUpdatedAt,  MeetingPointModel? meetingPoint)  $default,) {final _that = this;
switch (_that) {
case _StaffTripModel():
return $default(_that.id,_that.status,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.startedAt,_that.expiresAt,_that.endedAt,_that.endReason,_that.secondsLeft,_that.passengers,_that.positionUpdatedAt,_that.meetingPoint);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String status,  String direction,  String driverId,  String driverName,  TripVehicleModel vehicle,  DateTime startedAt,  DateTime expiresAt,  DateTime? endedAt,  String? endReason,  int secondsLeft,  List<TripPassengerModel> passengers,  DateTime? positionUpdatedAt,  MeetingPointModel? meetingPoint)?  $default,) {final _that = this;
switch (_that) {
case _StaffTripModel() when $default != null:
return $default(_that.id,_that.status,_that.direction,_that.driverId,_that.driverName,_that.vehicle,_that.startedAt,_that.expiresAt,_that.endedAt,_that.endReason,_that.secondsLeft,_that.passengers,_that.positionUpdatedAt,_that.meetingPoint);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StaffTripModel extends StaffTripModel {
  const _StaffTripModel({required this.id, required this.status, this.direction = 'pickup', required this.driverId, required this.driverName, this.vehicle = const TripVehicleModel(), required this.startedAt, required this.expiresAt, this.endedAt, this.endReason, this.secondsLeft = 0,  List<TripPassengerModel> passengers = const [], this.positionUpdatedAt, this.meetingPoint}): _passengers = passengers,super._();
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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffTripModel&&(identical(other.id, id) || other.id == id)&&(identical(other.status, status) || other.status == status)&&(identical(other.direction, direction) || other.direction == direction)&&(identical(other.driverId, driverId) || other.driverId == driverId)&&(identical(other.driverName, driverName) || other.driverName == driverName)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.endedAt, endedAt) || other.endedAt == endedAt)&&(identical(other.endReason, endReason) || other.endReason == endReason)&&(identical(other.secondsLeft, secondsLeft) || other.secondsLeft == secondsLeft)&&const DeepCollectionEquality().equals(other.passengers, _passengers)&&(identical(other.positionUpdatedAt, positionUpdatedAt) || other.positionUpdatedAt == positionUpdatedAt)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,status,direction,driverId,driverName,vehicle,startedAt,expiresAt,endedAt,endReason,secondsLeft,const DeepCollectionEquality().hash(_passengers),positionUpdatedAt,meetingPoint);
}

@override
String toString() {
    return 'StaffTripModel(id: $id, status: $status, direction: $direction, driverId: $driverId, driverName: $driverName, vehicle: $vehicle, startedAt: $startedAt, expiresAt: $expiresAt, endedAt: $endedAt, endReason: $endReason, secondsLeft: $secondsLeft, passengers: $passengers, positionUpdatedAt: $positionUpdatedAt, meetingPoint: $meetingPoint)';
}


}

/// @nodoc
abstract mixin class _$StaffTripModelCopyWith<$Res> implements $StaffTripModelCopyWith<$Res> {
  factory _$StaffTripModelCopyWith(_StaffTripModel value, $Res Function(_StaffTripModel) _then) = __$StaffTripModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String status, String direction, String driverId, String driverName, TripVehicleModel vehicle, DateTime startedAt, DateTime expiresAt, DateTime? endedAt, String? endReason, int secondsLeft, List<TripPassengerModel> passengers, DateTime? positionUpdatedAt, MeetingPointModel? meetingPoint
});


@override $TripVehicleModelCopyWith<$Res> get vehicle;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class __$StaffTripModelCopyWithImpl<$Res>
    implements _$StaffTripModelCopyWith<$Res> {
  __$StaffTripModelCopyWithImpl(this._self, this._then);

  final _StaffTripModel _self;
  final $Res Function(_StaffTripModel) _then;

/// Create a copy of StaffTripModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? status = null,Object? direction = null,Object? driverId = null,Object? driverName = null,Object? vehicle = null,Object? startedAt = null,Object? expiresAt = null,Object? endedAt = freezed,Object? endReason = freezed,Object? secondsLeft = null,Object? passengers = null,Object? positionUpdatedAt = freezed,Object? meetingPoint = freezed,}) {
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
as MeetingPointModel?,
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

// dart format on
