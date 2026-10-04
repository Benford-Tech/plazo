// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shuttle_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ShuttleState {

 ViewState get viewState; ViewState get actionState; PickupsModel? get pickups;/// Arrived travellers waiting for the terminal (drop-off direction).
 DeparturesModel? get departures;/// `pickup` (to the airport, default) or `dropoff` (to the terminal).
 String get direction; List<ShuttleVehicleModel> get vehicles;/// The driver's running trip (null: none).
 StaffTripModel? get trip; Set<String> get selected; TripVehicleChoice? get vehicle;/// Positions are being watched and sent.
 bool get tracking; LocationAccess? get locationProblem;/// The trip just ended (by the driver, the 90 minutes, or elsewhere).
 bool get endedNotice;/// The latest local position (memory only, never shown on a map here).
 GeoPosition? get lastPosition; String? get errorCode; DateTime get now;
/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleStateCopyWith<ShuttleState> get copyWith => _$ShuttleStateCopyWithImpl<ShuttleState>(this as ShuttleState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ShuttleState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.pickups, _this.pickups) || other.pickups == _this.pickups)&&(identical(other.departures, _this.departures) || other.departures == _this.departures)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&const DeepCollectionEquality().equals(other.vehicles, _this.vehicles)&&(identical(other.trip, _this.trip) || other.trip == _this.trip)&&const DeepCollectionEquality().equals(other.selected, _this.selected)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.tracking, _this.tracking) || other.tracking == _this.tracking)&&(identical(other.locationProblem, _this.locationProblem) || other.locationProblem == _this.locationProblem)&&(identical(other.endedNotice, _this.endedNotice) || other.endedNotice == _this.endedNotice)&&(identical(other.lastPosition, _this.lastPosition) || other.lastPosition == _this.lastPosition)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as ShuttleState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.pickups,_this.departures,_this.direction,const DeepCollectionEquality().hash(_this.vehicles),_this.trip,const DeepCollectionEquality().hash(_this.selected),_this.vehicle,_this.tracking,_this.locationProblem,_this.endedNotice,_this.lastPosition,_this.errorCode,_this.now);
}

@override
String toString() {
  final _this = this as ShuttleState;
  return 'ShuttleState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, pickups: ${_this.pickups}, departures: ${_this.departures}, direction: ${_this.direction}, vehicles: ${_this.vehicles}, trip: ${_this.trip}, selected: ${_this.selected}, vehicle: ${_this.vehicle}, tracking: ${_this.tracking}, locationProblem: ${_this.locationProblem}, endedNotice: ${_this.endedNotice}, lastPosition: ${_this.lastPosition}, errorCode: ${_this.errorCode}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $ShuttleStateCopyWith<$Res>  {
  factory $ShuttleStateCopyWith(ShuttleState value, $Res Function(ShuttleState) _then) = _$ShuttleStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, PickupsModel? pickups, DeparturesModel? departures, String direction, List<ShuttleVehicleModel> vehicles, StaffTripModel? trip, Set<String> selected, TripVehicleChoice? vehicle, bool tracking, LocationAccess? locationProblem, bool endedNotice, GeoPosition? lastPosition, String? errorCode, DateTime now
});


$PickupsModelCopyWith<$Res>? get pickups;$DeparturesModelCopyWith<$Res>? get departures;$StaffTripModelCopyWith<$Res>? get trip;

}
/// @nodoc
class _$ShuttleStateCopyWithImpl<$Res>
    implements $ShuttleStateCopyWith<$Res> {
  _$ShuttleStateCopyWithImpl(this._self, this._then);

  final ShuttleState _self;
  final $Res Function(ShuttleState) _then;

/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? pickups = freezed,Object? departures = freezed,Object? direction = null,Object? vehicles = null,Object? trip = freezed,Object? selected = null,Object? vehicle = freezed,Object? tracking = null,Object? locationProblem = freezed,Object? endedNotice = null,Object? lastPosition = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(ShuttleState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,pickups: freezed == pickups ? _self.pickups : pickups // ignore: cast_nullable_to_non_nullable
as PickupsModel?,departures: freezed == departures ? _self.departures : departures // ignore: cast_nullable_to_non_nullable
as DeparturesModel?,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,vehicles: null == vehicles ? _self.vehicles : vehicles // ignore: cast_nullable_to_non_nullable
as List<ShuttleVehicleModel>,trip: freezed == trip ? _self.trip : trip // ignore: cast_nullable_to_non_nullable
as StaffTripModel?,selected: null == selected ? _self.selected : selected // ignore: cast_nullable_to_non_nullable
as Set<String>,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleChoice?,tracking: null == tracking ? _self.tracking : tracking // ignore: cast_nullable_to_non_nullable
as bool,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,endedNotice: null == endedNotice ? _self.endedNotice : endedNotice // ignore: cast_nullable_to_non_nullable
as bool,lastPosition: freezed == lastPosition ? _self.lastPosition : lastPosition // ignore: cast_nullable_to_non_nullable
as GeoPosition?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PickupsModelCopyWith<$Res>? get pickups {
    if (_self.pickups == null) {
    return null;
  }

  return $PickupsModelCopyWith<$Res>(_self.pickups!, (value) {
    return _then(_self.copyWith(pickups: value));
  });
}/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DeparturesModelCopyWith<$Res>? get departures {
    if (_self.departures == null) {
    return null;
  }

  return $DeparturesModelCopyWith<$Res>(_self.departures!, (value) {
    return _then(_self.copyWith(departures: value));
  });
}/// Create a copy of ShuttleState
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


/// Adds pattern-matching-related methods to [ShuttleState].
extension ShuttleStatePatterns on ShuttleState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleState value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleState value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  PickupsModel? pickups,  DeparturesModel? departures,  String direction,  List<ShuttleVehicleModel> vehicles,  StaffTripModel? trip,  Set<String> selected,  TripVehicleChoice? vehicle,  bool tracking,  LocationAccess? locationProblem,  bool endedNotice,  GeoPosition? lastPosition,  String? errorCode,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.pickups,_that.departures,_that.direction,_that.vehicles,_that.trip,_that.selected,_that.vehicle,_that.tracking,_that.locationProblem,_that.endedNotice,_that.lastPosition,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  PickupsModel? pickups,  DeparturesModel? departures,  String direction,  List<ShuttleVehicleModel> vehicles,  StaffTripModel? trip,  Set<String> selected,  TripVehicleChoice? vehicle,  bool tracking,  LocationAccess? locationProblem,  bool endedNotice,  GeoPosition? lastPosition,  String? errorCode,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _ShuttleState():
return $default(_that.viewState,_that.actionState,_that.pickups,_that.departures,_that.direction,_that.vehicles,_that.trip,_that.selected,_that.vehicle,_that.tracking,_that.locationProblem,_that.endedNotice,_that.lastPosition,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  PickupsModel? pickups,  DeparturesModel? departures,  String direction,  List<ShuttleVehicleModel> vehicles,  StaffTripModel? trip,  Set<String> selected,  TripVehicleChoice? vehicle,  bool tracking,  LocationAccess? locationProblem,  bool endedNotice,  GeoPosition? lastPosition,  String? errorCode,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.pickups,_that.departures,_that.direction,_that.vehicles,_that.trip,_that.selected,_that.vehicle,_that.tracking,_that.locationProblem,_that.endedNotice,_that.lastPosition,_that.errorCode,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _ShuttleState extends ShuttleState {
  const _ShuttleState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.pickups, this.departures, this.direction = 'pickup',  List<ShuttleVehicleModel> vehicles = const [], this.trip,  Set<String> selected = const {}, this.vehicle, this.tracking = false, this.locationProblem, this.endedNotice = false, this.lastPosition, this.errorCode, required this.now}): _vehicles = vehicles,_selected = selected,super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override final  PickupsModel? pickups;
/// Arrived travellers waiting for the terminal (drop-off direction).
@override final  DeparturesModel? departures;
/// `pickup` (to the airport, default) or `dropoff` (to the terminal).
@override@JsonKey() final  String direction;
 final  List<ShuttleVehicleModel> _vehicles;
@override@JsonKey() List<ShuttleVehicleModel> get vehicles {
  if (_vehicles is EqualUnmodifiableListView) return _vehicles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_vehicles);
}

/// The driver's running trip (null: none).
@override final  StaffTripModel? trip;
 final  Set<String> _selected;
@override@JsonKey() Set<String> get selected {
  if (_selected is EqualUnmodifiableSetView) return _selected;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableSetView(_selected);
}

@override final  TripVehicleChoice? vehicle;
/// Positions are being watched and sent.
@override@JsonKey() final  bool tracking;
@override final  LocationAccess? locationProblem;
/// The trip just ended (by the driver, the 90 minutes, or elsewhere).
@override@JsonKey() final  bool endedNotice;
/// The latest local position (memory only, never shown on a map here).
@override final  GeoPosition? lastPosition;
@override final  String? errorCode;
@override final  DateTime now;

/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleStateCopyWith<_ShuttleState> get copyWith => __$ShuttleStateCopyWithImpl<_ShuttleState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.pickups, pickups) || other.pickups == pickups)&&(identical(other.departures, departures) || other.departures == departures)&&(identical(other.direction, direction) || other.direction == direction)&&const DeepCollectionEquality().equals(other.vehicles, _vehicles)&&(identical(other.trip, trip) || other.trip == trip)&&const DeepCollectionEquality().equals(other.selected, _selected)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.tracking, tracking) || other.tracking == tracking)&&(identical(other.locationProblem, locationProblem) || other.locationProblem == locationProblem)&&(identical(other.endedNotice, endedNotice) || other.endedNotice == endedNotice)&&(identical(other.lastPosition, lastPosition) || other.lastPosition == lastPosition)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,pickups,departures,direction,const DeepCollectionEquality().hash(_vehicles),trip,const DeepCollectionEquality().hash(_selected),vehicle,tracking,locationProblem,endedNotice,lastPosition,errorCode,now);
}

@override
String toString() {
    return 'ShuttleState(viewState: $viewState, actionState: $actionState, pickups: $pickups, departures: $departures, direction: $direction, vehicles: $vehicles, trip: $trip, selected: $selected, vehicle: $vehicle, tracking: $tracking, locationProblem: $locationProblem, endedNotice: $endedNotice, lastPosition: $lastPosition, errorCode: $errorCode, now: $now)';
}


}

/// @nodoc
abstract mixin class _$ShuttleStateCopyWith<$Res> implements $ShuttleStateCopyWith<$Res> {
  factory _$ShuttleStateCopyWith(_ShuttleState value, $Res Function(_ShuttleState) _then) = __$ShuttleStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, PickupsModel? pickups, DeparturesModel? departures, String direction, List<ShuttleVehicleModel> vehicles, StaffTripModel? trip, Set<String> selected, TripVehicleChoice? vehicle, bool tracking, LocationAccess? locationProblem, bool endedNotice, GeoPosition? lastPosition, String? errorCode, DateTime now
});


@override $PickupsModelCopyWith<$Res>? get pickups;@override $DeparturesModelCopyWith<$Res>? get departures;@override $StaffTripModelCopyWith<$Res>? get trip;

}
/// @nodoc
class __$ShuttleStateCopyWithImpl<$Res>
    implements _$ShuttleStateCopyWith<$Res> {
  __$ShuttleStateCopyWithImpl(this._self, this._then);

  final _ShuttleState _self;
  final $Res Function(_ShuttleState) _then;

/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? pickups = freezed,Object? departures = freezed,Object? direction = null,Object? vehicles = null,Object? trip = freezed,Object? selected = null,Object? vehicle = freezed,Object? tracking = null,Object? locationProblem = freezed,Object? endedNotice = null,Object? lastPosition = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(_ShuttleState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,pickups: freezed == pickups ? _self.pickups : pickups // ignore: cast_nullable_to_non_nullable
as PickupsModel?,departures: freezed == departures ? _self.departures : departures // ignore: cast_nullable_to_non_nullable
as DeparturesModel?,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,vehicles: null == vehicles ? _self._vehicles : vehicles // ignore: cast_nullable_to_non_nullable
as List<ShuttleVehicleModel>,trip: freezed == trip ? _self.trip : trip // ignore: cast_nullable_to_non_nullable
as StaffTripModel?,selected: null == selected ? _self._selected : selected // ignore: cast_nullable_to_non_nullable
as Set<String>,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleChoice?,tracking: null == tracking ? _self.tracking : tracking // ignore: cast_nullable_to_non_nullable
as bool,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,endedNotice: null == endedNotice ? _self.endedNotice : endedNotice // ignore: cast_nullable_to_non_nullable
as bool,lastPosition: freezed == lastPosition ? _self.lastPosition : lastPosition // ignore: cast_nullable_to_non_nullable
as GeoPosition?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PickupsModelCopyWith<$Res>? get pickups {
    if (_self.pickups == null) {
    return null;
  }

  return $PickupsModelCopyWith<$Res>(_self.pickups!, (value) {
    return _then(_self.copyWith(pickups: value));
  });
}/// Create a copy of ShuttleState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DeparturesModelCopyWith<$Res>? get departures {
    if (_self.departures == null) {
    return null;
  }

  return $DeparturesModelCopyWith<$Res>(_self.departures!, (value) {
    return _then(_self.copyWith(departures: value));
  });
}/// Create a copy of ShuttleState
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
