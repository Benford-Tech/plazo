// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'arrival_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ArrivalState {

 String? get reference; ViewState get loadState; ViewState get actionState; ArrivalModel? get arrival;/// Positions are being watched and sent.
 bool get tracking; bool get showAnnounceOptions;/// E (06/10/2026): the word typed for the parking (sent with the next signal, empty: none).
 String get note; LocationAccess? get locationProblem;/// API code (or consent_required, network): translated by the page.
 String? get errorCode;/// The latest local position, for the map only (memory, never stored).
 GeoPosition? get lastPosition; DateTime get now;
/// Create a copy of ArrivalState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArrivalStateCopyWith<ArrivalState> get copyWith => _$ArrivalStateCopyWithImpl<ArrivalState>(this as ArrivalState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ArrivalState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArrivalState&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.arrival, _this.arrival) || other.arrival == _this.arrival)&&(identical(other.tracking, _this.tracking) || other.tracking == _this.tracking)&&(identical(other.showAnnounceOptions, _this.showAnnounceOptions) || other.showAnnounceOptions == _this.showAnnounceOptions)&&(identical(other.note, _this.note) || other.note == _this.note)&&(identical(other.locationProblem, _this.locationProblem) || other.locationProblem == _this.locationProblem)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.lastPosition, _this.lastPosition) || other.lastPosition == _this.lastPosition)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as ArrivalState;
  return Object.hash(runtimeType,_this.reference,_this.loadState,_this.actionState,_this.arrival,_this.tracking,_this.showAnnounceOptions,_this.note,_this.locationProblem,_this.errorCode,_this.lastPosition,_this.now);
}

@override
String toString() {
  final _this = this as ArrivalState;
  return 'ArrivalState(reference: ${_this.reference}, loadState: ${_this.loadState}, actionState: ${_this.actionState}, arrival: ${_this.arrival}, tracking: ${_this.tracking}, showAnnounceOptions: ${_this.showAnnounceOptions}, note: ${_this.note}, locationProblem: ${_this.locationProblem}, errorCode: ${_this.errorCode}, lastPosition: ${_this.lastPosition}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $ArrivalStateCopyWith<$Res>  {
  factory $ArrivalStateCopyWith(ArrivalState value, $Res Function(ArrivalState) _then) = _$ArrivalStateCopyWithImpl;
@useResult
$Res call({
 String? reference, ViewState loadState, ViewState actionState, ArrivalModel? arrival, bool tracking, bool showAnnounceOptions, String note, LocationAccess? locationProblem, String? errorCode, GeoPosition? lastPosition, DateTime now
});


$ArrivalModelCopyWith<$Res>? get arrival;

}
/// @nodoc
class _$ArrivalStateCopyWithImpl<$Res>
    implements $ArrivalStateCopyWith<$Res> {
  _$ArrivalStateCopyWithImpl(this._self, this._then);

  final ArrivalState _self;
  final $Res Function(ArrivalState) _then;

/// Create a copy of ArrivalState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = freezed,Object? loadState = null,Object? actionState = null,Object? arrival = freezed,Object? tracking = null,Object? showAnnounceOptions = null,Object? note = null,Object? locationProblem = freezed,Object? errorCode = freezed,Object? lastPosition = freezed,Object? now = null,}) {
  return _then(ArrivalState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,arrival: freezed == arrival ? _self.arrival : arrival // ignore: cast_nullable_to_non_nullable
as ArrivalModel?,tracking: null == tracking ? _self.tracking : tracking // ignore: cast_nullable_to_non_nullable
as bool,showAnnounceOptions: null == showAnnounceOptions ? _self.showAnnounceOptions : showAnnounceOptions // ignore: cast_nullable_to_non_nullable
as bool,note: null == note ? _self.note : note // ignore: cast_nullable_to_non_nullable
as String,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,lastPosition: freezed == lastPosition ? _self.lastPosition : lastPosition // ignore: cast_nullable_to_non_nullable
as GeoPosition?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of ArrivalState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalModelCopyWith<$Res>? get arrival {
    if (_self.arrival == null) {
    return null;
  }

  return $ArrivalModelCopyWith<$Res>(_self.arrival!, (value) {
    return _then(_self.copyWith(arrival: value));
  });
}
}


/// Adds pattern-matching-related methods to [ArrivalState].
extension ArrivalStatePatterns on ArrivalState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArrivalState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArrivalState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArrivalState value)  $default,){
final _that = this;
switch (_that) {
case _ArrivalState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArrivalState value)?  $default,){
final _that = this;
switch (_that) {
case _ArrivalState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  ViewState actionState,  ArrivalModel? arrival,  bool tracking,  bool showAnnounceOptions,  String note,  LocationAccess? locationProblem,  String? errorCode,  GeoPosition? lastPosition,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArrivalState() when $default != null:
return $default(_that.reference,_that.loadState,_that.actionState,_that.arrival,_that.tracking,_that.showAnnounceOptions,_that.note,_that.locationProblem,_that.errorCode,_that.lastPosition,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  ViewState actionState,  ArrivalModel? arrival,  bool tracking,  bool showAnnounceOptions,  String note,  LocationAccess? locationProblem,  String? errorCode,  GeoPosition? lastPosition,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _ArrivalState():
return $default(_that.reference,_that.loadState,_that.actionState,_that.arrival,_that.tracking,_that.showAnnounceOptions,_that.note,_that.locationProblem,_that.errorCode,_that.lastPosition,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reference,  ViewState loadState,  ViewState actionState,  ArrivalModel? arrival,  bool tracking,  bool showAnnounceOptions,  String note,  LocationAccess? locationProblem,  String? errorCode,  GeoPosition? lastPosition,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _ArrivalState() when $default != null:
return $default(_that.reference,_that.loadState,_that.actionState,_that.arrival,_that.tracking,_that.showAnnounceOptions,_that.note,_that.locationProblem,_that.errorCode,_that.lastPosition,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _ArrivalState extends ArrivalState {
  const _ArrivalState({this.reference, this.loadState = ViewState.idle, this.actionState = ViewState.idle, this.arrival, this.tracking = false, this.showAnnounceOptions = false, this.note = '', this.locationProblem, this.errorCode, this.lastPosition, required this.now}): super._();
  

@override final  String? reference;
@override@JsonKey() final  ViewState loadState;
@override@JsonKey() final  ViewState actionState;
@override final  ArrivalModel? arrival;
/// Positions are being watched and sent.
@override@JsonKey() final  bool tracking;
@override@JsonKey() final  bool showAnnounceOptions;
/// E (06/10/2026): the word typed for the parking (sent with the next signal, empty: none).
@override@JsonKey() final  String note;
@override final  LocationAccess? locationProblem;
/// API code (or consent_required, network): translated by the page.
@override final  String? errorCode;
/// The latest local position, for the map only (memory, never stored).
@override final  GeoPosition? lastPosition;
@override final  DateTime now;

/// Create a copy of ArrivalState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArrivalStateCopyWith<_ArrivalState> get copyWith => __$ArrivalStateCopyWithImpl<_ArrivalState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArrivalState&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.arrival, arrival) || other.arrival == arrival)&&(identical(other.tracking, tracking) || other.tracking == tracking)&&(identical(other.showAnnounceOptions, showAnnounceOptions) || other.showAnnounceOptions == showAnnounceOptions)&&(identical(other.note, note) || other.note == note)&&(identical(other.locationProblem, locationProblem) || other.locationProblem == locationProblem)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.lastPosition, lastPosition) || other.lastPosition == lastPosition)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reference,loadState,actionState,arrival,tracking,showAnnounceOptions,note,locationProblem,errorCode,lastPosition,now);
}

@override
String toString() {
    return 'ArrivalState(reference: $reference, loadState: $loadState, actionState: $actionState, arrival: $arrival, tracking: $tracking, showAnnounceOptions: $showAnnounceOptions, note: $note, locationProblem: $locationProblem, errorCode: $errorCode, lastPosition: $lastPosition, now: $now)';
}


}

/// @nodoc
abstract mixin class _$ArrivalStateCopyWith<$Res> implements $ArrivalStateCopyWith<$Res> {
  factory _$ArrivalStateCopyWith(_ArrivalState value, $Res Function(_ArrivalState) _then) = __$ArrivalStateCopyWithImpl;
@override @useResult
$Res call({
 String? reference, ViewState loadState, ViewState actionState, ArrivalModel? arrival, bool tracking, bool showAnnounceOptions, String note, LocationAccess? locationProblem, String? errorCode, GeoPosition? lastPosition, DateTime now
});


@override $ArrivalModelCopyWith<$Res>? get arrival;

}
/// @nodoc
class __$ArrivalStateCopyWithImpl<$Res>
    implements _$ArrivalStateCopyWith<$Res> {
  __$ArrivalStateCopyWithImpl(this._self, this._then);

  final _ArrivalState _self;
  final $Res Function(_ArrivalState) _then;

/// Create a copy of ArrivalState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = freezed,Object? loadState = null,Object? actionState = null,Object? arrival = freezed,Object? tracking = null,Object? showAnnounceOptions = null,Object? note = null,Object? locationProblem = freezed,Object? errorCode = freezed,Object? lastPosition = freezed,Object? now = null,}) {
  return _then(_ArrivalState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,arrival: freezed == arrival ? _self.arrival : arrival // ignore: cast_nullable_to_non_nullable
as ArrivalModel?,tracking: null == tracking ? _self.tracking : tracking // ignore: cast_nullable_to_non_nullable
as bool,showAnnounceOptions: null == showAnnounceOptions ? _self.showAnnounceOptions : showAnnounceOptions // ignore: cast_nullable_to_non_nullable
as bool,note: null == note ? _self.note : note // ignore: cast_nullable_to_non_nullable
as String,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,lastPosition: freezed == lastPosition ? _self.lastPosition : lastPosition // ignore: cast_nullable_to_non_nullable
as GeoPosition?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of ArrivalState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalModelCopyWith<$Res>? get arrival {
    if (_self.arrival == null) {
    return null;
  }

  return $ArrivalModelCopyWith<$Res>(_self.arrival!, (value) {
    return _then(_self.copyWith(arrival: value));
  });
}
}

// dart format on
