// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_spot_planning_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProSpotPlanningState {

 ViewState get viewState; ViewState get actionState; ParkingSummaryModel? get parking; String get from; int get days; SpotPlanningModel? get planning;/// "planning.preassigned:3:1", "planning.moved:AB-123-CD:A-01-02", "planning.released:AB-123-CD".
 String? get notice; String? get errorCode;
/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProSpotPlanningStateCopyWith<ProSpotPlanningState> get copyWith => _$ProSpotPlanningStateCopyWithImpl<ProSpotPlanningState>(this as ProSpotPlanningState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProSpotPlanningState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProSpotPlanningState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.from, _this.from) || other.from == _this.from)&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.planning, _this.planning) || other.planning == _this.planning)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ProSpotPlanningState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.parking,_this.from,_this.days,_this.planning,_this.notice,_this.errorCode);
}

@override
String toString() {
  final _this = this as ProSpotPlanningState;
  return 'ProSpotPlanningState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, parking: ${_this.parking}, from: ${_this.from}, days: ${_this.days}, planning: ${_this.planning}, notice: ${_this.notice}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ProSpotPlanningStateCopyWith<$Res>  {
  factory $ProSpotPlanningStateCopyWith(ProSpotPlanningState value, $Res Function(ProSpotPlanningState) _then) = _$ProSpotPlanningStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, ParkingSummaryModel? parking, String from, int days, SpotPlanningModel? planning, String? notice, String? errorCode
});


$ParkingSummaryModelCopyWith<$Res>? get parking;$SpotPlanningModelCopyWith<$Res>? get planning;

}
/// @nodoc
class _$ProSpotPlanningStateCopyWithImpl<$Res>
    implements $ProSpotPlanningStateCopyWith<$Res> {
  _$ProSpotPlanningStateCopyWithImpl(this._self, this._then);

  final ProSpotPlanningState _self;
  final $Res Function(ProSpotPlanningState) _then;

/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? parking = freezed,Object? from = null,Object? days = null,Object? planning = freezed,Object? notice = freezed,Object? errorCode = freezed,}) {
  return _then(ProSpotPlanningState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSummaryModel?,from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,planning: freezed == planning ? _self.planning : planning // ignore: cast_nullable_to_non_nullable
as SpotPlanningModel?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingSummaryModelCopyWith<$Res>? get parking {
    if (_self.parking == null) {
    return null;
  }

  return $ParkingSummaryModelCopyWith<$Res>(_self.parking!, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SpotPlanningModelCopyWith<$Res>? get planning {
    if (_self.planning == null) {
    return null;
  }

  return $SpotPlanningModelCopyWith<$Res>(_self.planning!, (value) {
    return _then(_self.copyWith(planning: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProSpotPlanningState].
extension ProSpotPlanningStatePatterns on ProSpotPlanningState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProSpotPlanningState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProSpotPlanningState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProSpotPlanningState value)  $default,){
final _that = this;
switch (_that) {
case _ProSpotPlanningState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProSpotPlanningState value)?  $default,){
final _that = this;
switch (_that) {
case _ProSpotPlanningState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ParkingSummaryModel? parking,  String from,  int days,  SpotPlanningModel? planning,  String? notice,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProSpotPlanningState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.parking,_that.from,_that.days,_that.planning,_that.notice,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ParkingSummaryModel? parking,  String from,  int days,  SpotPlanningModel? planning,  String? notice,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ProSpotPlanningState():
return $default(_that.viewState,_that.actionState,_that.parking,_that.from,_that.days,_that.planning,_that.notice,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  ParkingSummaryModel? parking,  String from,  int days,  SpotPlanningModel? planning,  String? notice,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ProSpotPlanningState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.parking,_that.from,_that.days,_that.planning,_that.notice,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ProSpotPlanningState extends ProSpotPlanningState {
  const _ProSpotPlanningState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.parking, required this.from, this.days = 7, this.planning, this.notice, this.errorCode}): super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override final  ParkingSummaryModel? parking;
@override final  String from;
@override@JsonKey() final  int days;
@override final  SpotPlanningModel? planning;
/// "planning.preassigned:3:1", "planning.moved:AB-123-CD:A-01-02", "planning.released:AB-123-CD".
@override final  String? notice;
@override final  String? errorCode;

/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProSpotPlanningStateCopyWith<_ProSpotPlanningState> get copyWith => __$ProSpotPlanningStateCopyWithImpl<_ProSpotPlanningState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProSpotPlanningState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.from, from) || other.from == from)&&(identical(other.days, days) || other.days == days)&&(identical(other.planning, planning) || other.planning == planning)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,parking,from,days,planning,notice,errorCode);
}

@override
String toString() {
    return 'ProSpotPlanningState(viewState: $viewState, actionState: $actionState, parking: $parking, from: $from, days: $days, planning: $planning, notice: $notice, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ProSpotPlanningStateCopyWith<$Res> implements $ProSpotPlanningStateCopyWith<$Res> {
  factory _$ProSpotPlanningStateCopyWith(_ProSpotPlanningState value, $Res Function(_ProSpotPlanningState) _then) = __$ProSpotPlanningStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, ParkingSummaryModel? parking, String from, int days, SpotPlanningModel? planning, String? notice, String? errorCode
});


@override $ParkingSummaryModelCopyWith<$Res>? get parking;@override $SpotPlanningModelCopyWith<$Res>? get planning;

}
/// @nodoc
class __$ProSpotPlanningStateCopyWithImpl<$Res>
    implements _$ProSpotPlanningStateCopyWith<$Res> {
  __$ProSpotPlanningStateCopyWithImpl(this._self, this._then);

  final _ProSpotPlanningState _self;
  final $Res Function(_ProSpotPlanningState) _then;

/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? parking = freezed,Object? from = null,Object? days = null,Object? planning = freezed,Object? notice = freezed,Object? errorCode = freezed,}) {
  return _then(_ProSpotPlanningState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSummaryModel?,from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,planning: freezed == planning ? _self.planning : planning // ignore: cast_nullable_to_non_nullable
as SpotPlanningModel?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingSummaryModelCopyWith<$Res>? get parking {
    if (_self.parking == null) {
    return null;
  }

  return $ParkingSummaryModelCopyWith<$Res>(_self.parking!, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ProSpotPlanningState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SpotPlanningModelCopyWith<$Res>? get planning {
    if (_self.planning == null) {
    return null;
  }

  return $SpotPlanningModelCopyWith<$Res>(_self.planning!, (value) {
    return _then(_self.copyWith(planning: value));
  });
}
}

// dart format on
