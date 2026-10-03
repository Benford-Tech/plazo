// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'meeting_route_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$MeetingRouteState {

 String? get reference; ViewState get loadState; ViewState get actionState; TravellerReturnModel? get data; WalkingRouteModel? get route;/// The route starts at the phone's position (else at the terminal).
 bool get fromMe; LocationAccess? get locationProblem; bool get arrived; String? get errorCode;
/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MeetingRouteStateCopyWith<MeetingRouteState> get copyWith => _$MeetingRouteStateCopyWithImpl<MeetingRouteState>(this as MeetingRouteState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as MeetingRouteState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MeetingRouteState&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.route, _this.route) || other.route == _this.route)&&(identical(other.fromMe, _this.fromMe) || other.fromMe == _this.fromMe)&&(identical(other.locationProblem, _this.locationProblem) || other.locationProblem == _this.locationProblem)&&(identical(other.arrived, _this.arrived) || other.arrived == _this.arrived)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as MeetingRouteState;
  return Object.hash(runtimeType,_this.reference,_this.loadState,_this.actionState,_this.data,_this.route,_this.fromMe,_this.locationProblem,_this.arrived,_this.errorCode);
}

@override
String toString() {
  final _this = this as MeetingRouteState;
  return 'MeetingRouteState(reference: ${_this.reference}, loadState: ${_this.loadState}, actionState: ${_this.actionState}, data: ${_this.data}, route: ${_this.route}, fromMe: ${_this.fromMe}, locationProblem: ${_this.locationProblem}, arrived: ${_this.arrived}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $MeetingRouteStateCopyWith<$Res>  {
  factory $MeetingRouteStateCopyWith(MeetingRouteState value, $Res Function(MeetingRouteState) _then) = _$MeetingRouteStateCopyWithImpl;
@useResult
$Res call({
 String? reference, ViewState loadState, ViewState actionState, TravellerReturnModel? data, WalkingRouteModel? route, bool fromMe, LocationAccess? locationProblem, bool arrived, String? errorCode
});


$TravellerReturnModelCopyWith<$Res>? get data;$WalkingRouteModelCopyWith<$Res>? get route;

}
/// @nodoc
class _$MeetingRouteStateCopyWithImpl<$Res>
    implements $MeetingRouteStateCopyWith<$Res> {
  _$MeetingRouteStateCopyWithImpl(this._self, this._then);

  final MeetingRouteState _self;
  final $Res Function(MeetingRouteState) _then;

/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = freezed,Object? loadState = null,Object? actionState = null,Object? data = freezed,Object? route = freezed,Object? fromMe = null,Object? locationProblem = freezed,Object? arrived = null,Object? errorCode = freezed,}) {
  return _then(MeetingRouteState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as TravellerReturnModel?,route: freezed == route ? _self.route : route // ignore: cast_nullable_to_non_nullable
as WalkingRouteModel?,fromMe: null == fromMe ? _self.fromMe : fromMe // ignore: cast_nullable_to_non_nullable
as bool,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,arrived: null == arrived ? _self.arrived : arrived // ignore: cast_nullable_to_non_nullable
as bool,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerReturnModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $TravellerReturnModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WalkingRouteModelCopyWith<$Res>? get route {
    if (_self.route == null) {
    return null;
  }

  return $WalkingRouteModelCopyWith<$Res>(_self.route!, (value) {
    return _then(_self.copyWith(route: value));
  });
}
}


/// Adds pattern-matching-related methods to [MeetingRouteState].
extension MeetingRouteStatePatterns on MeetingRouteState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MeetingRouteState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MeetingRouteState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MeetingRouteState value)  $default,){
final _that = this;
switch (_that) {
case _MeetingRouteState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MeetingRouteState value)?  $default,){
final _that = this;
switch (_that) {
case _MeetingRouteState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  ViewState actionState,  TravellerReturnModel? data,  WalkingRouteModel? route,  bool fromMe,  LocationAccess? locationProblem,  bool arrived,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MeetingRouteState() when $default != null:
return $default(_that.reference,_that.loadState,_that.actionState,_that.data,_that.route,_that.fromMe,_that.locationProblem,_that.arrived,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  ViewState actionState,  TravellerReturnModel? data,  WalkingRouteModel? route,  bool fromMe,  LocationAccess? locationProblem,  bool arrived,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _MeetingRouteState():
return $default(_that.reference,_that.loadState,_that.actionState,_that.data,_that.route,_that.fromMe,_that.locationProblem,_that.arrived,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reference,  ViewState loadState,  ViewState actionState,  TravellerReturnModel? data,  WalkingRouteModel? route,  bool fromMe,  LocationAccess? locationProblem,  bool arrived,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _MeetingRouteState() when $default != null:
return $default(_that.reference,_that.loadState,_that.actionState,_that.data,_that.route,_that.fromMe,_that.locationProblem,_that.arrived,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _MeetingRouteState implements MeetingRouteState {
  const _MeetingRouteState({this.reference, this.loadState = ViewState.idle, this.actionState = ViewState.idle, this.data, this.route, this.fromMe = false, this.locationProblem, this.arrived = false, this.errorCode});
  

@override final  String? reference;
@override@JsonKey() final  ViewState loadState;
@override@JsonKey() final  ViewState actionState;
@override final  TravellerReturnModel? data;
@override final  WalkingRouteModel? route;
/// The route starts at the phone's position (else at the terminal).
@override@JsonKey() final  bool fromMe;
@override final  LocationAccess? locationProblem;
@override@JsonKey() final  bool arrived;
@override final  String? errorCode;

/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MeetingRouteStateCopyWith<_MeetingRouteState> get copyWith => __$MeetingRouteStateCopyWithImpl<_MeetingRouteState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _MeetingRouteState&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.data, data) || other.data == data)&&(identical(other.route, route) || other.route == route)&&(identical(other.fromMe, fromMe) || other.fromMe == fromMe)&&(identical(other.locationProblem, locationProblem) || other.locationProblem == locationProblem)&&(identical(other.arrived, arrived) || other.arrived == arrived)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reference,loadState,actionState,data,route,fromMe,locationProblem,arrived,errorCode);
}

@override
String toString() {
    return 'MeetingRouteState(reference: $reference, loadState: $loadState, actionState: $actionState, data: $data, route: $route, fromMe: $fromMe, locationProblem: $locationProblem, arrived: $arrived, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$MeetingRouteStateCopyWith<$Res> implements $MeetingRouteStateCopyWith<$Res> {
  factory _$MeetingRouteStateCopyWith(_MeetingRouteState value, $Res Function(_MeetingRouteState) _then) = __$MeetingRouteStateCopyWithImpl;
@override @useResult
$Res call({
 String? reference, ViewState loadState, ViewState actionState, TravellerReturnModel? data, WalkingRouteModel? route, bool fromMe, LocationAccess? locationProblem, bool arrived, String? errorCode
});


@override $TravellerReturnModelCopyWith<$Res>? get data;@override $WalkingRouteModelCopyWith<$Res>? get route;

}
/// @nodoc
class __$MeetingRouteStateCopyWithImpl<$Res>
    implements _$MeetingRouteStateCopyWith<$Res> {
  __$MeetingRouteStateCopyWithImpl(this._self, this._then);

  final _MeetingRouteState _self;
  final $Res Function(_MeetingRouteState) _then;

/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = freezed,Object? loadState = null,Object? actionState = null,Object? data = freezed,Object? route = freezed,Object? fromMe = null,Object? locationProblem = freezed,Object? arrived = null,Object? errorCode = freezed,}) {
  return _then(_MeetingRouteState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as TravellerReturnModel?,route: freezed == route ? _self.route : route // ignore: cast_nullable_to_non_nullable
as WalkingRouteModel?,fromMe: null == fromMe ? _self.fromMe : fromMe // ignore: cast_nullable_to_non_nullable
as bool,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,arrived: null == arrived ? _self.arrived : arrived // ignore: cast_nullable_to_non_nullable
as bool,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerReturnModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $TravellerReturnModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}/// Create a copy of MeetingRouteState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WalkingRouteModelCopyWith<$Res>? get route {
    if (_self.route == null) {
    return null;
  }

  return $WalkingRouteModelCopyWith<$Res>(_self.route!, (value) {
    return _then(_self.copyWith(route: value));
  });
}
}

// dart format on
