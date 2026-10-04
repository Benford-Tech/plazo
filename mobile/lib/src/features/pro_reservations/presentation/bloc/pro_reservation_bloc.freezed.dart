// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_reservation_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProReservationState {

 ViewState get viewState; ViewState get actionState; ReservationModel? get reservation; String? get errorCode;/// The status just applied, to confirm it.
 String? get notice;
/// Create a copy of ProReservationState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProReservationStateCopyWith<ProReservationState> get copyWith => _$ProReservationStateCopyWithImpl<ProReservationState>(this as ProReservationState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProReservationState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProReservationState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.reservation, _this.reservation) || other.reservation == _this.reservation)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.notice, _this.notice) || other.notice == _this.notice));
}


@override
int get hashCode {
  final _this = this as ProReservationState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.reservation,_this.errorCode,_this.notice);
}

@override
String toString() {
  final _this = this as ProReservationState;
  return 'ProReservationState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, reservation: ${_this.reservation}, errorCode: ${_this.errorCode}, notice: ${_this.notice})';
}


}

/// @nodoc
abstract mixin class $ProReservationStateCopyWith<$Res>  {
  factory $ProReservationStateCopyWith(ProReservationState value, $Res Function(ProReservationState) _then) = _$ProReservationStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, ReservationModel? reservation, String? errorCode, String? notice
});


$ReservationModelCopyWith<$Res>? get reservation;

}
/// @nodoc
class _$ProReservationStateCopyWithImpl<$Res>
    implements $ProReservationStateCopyWith<$Res> {
  _$ProReservationStateCopyWithImpl(this._self, this._then);

  final ProReservationState _self;
  final $Res Function(ProReservationState) _then;

/// Create a copy of ProReservationState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? reservation = freezed,Object? errorCode = freezed,Object? notice = freezed,}) {
  return _then(ProReservationState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,reservation: freezed == reservation ? _self.reservation : reservation // ignore: cast_nullable_to_non_nullable
as ReservationModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProReservationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationModelCopyWith<$Res>? get reservation {
    if (_self.reservation == null) {
    return null;
  }

  return $ReservationModelCopyWith<$Res>(_self.reservation!, (value) {
    return _then(_self.copyWith(reservation: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProReservationState].
extension ProReservationStatePatterns on ProReservationState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProReservationState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProReservationState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProReservationState value)  $default,){
final _that = this;
switch (_that) {
case _ProReservationState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProReservationState value)?  $default,){
final _that = this;
switch (_that) {
case _ProReservationState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ReservationModel? reservation,  String? errorCode,  String? notice)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProReservationState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.reservation,_that.errorCode,_that.notice);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ReservationModel? reservation,  String? errorCode,  String? notice)  $default,) {final _that = this;
switch (_that) {
case _ProReservationState():
return $default(_that.viewState,_that.actionState,_that.reservation,_that.errorCode,_that.notice);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  ReservationModel? reservation,  String? errorCode,  String? notice)?  $default,) {final _that = this;
switch (_that) {
case _ProReservationState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.reservation,_that.errorCode,_that.notice);case _:
  return null;

}
}

}

/// @nodoc


class _ProReservationState implements ProReservationState {
  const _ProReservationState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.reservation, this.errorCode, this.notice});
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override final  ReservationModel? reservation;
@override final  String? errorCode;
/// The status just applied, to confirm it.
@override final  String? notice;

/// Create a copy of ProReservationState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProReservationStateCopyWith<_ProReservationState> get copyWith => __$ProReservationStateCopyWithImpl<_ProReservationState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProReservationState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.reservation, reservation) || other.reservation == reservation)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.notice, notice) || other.notice == notice));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,reservation,errorCode,notice);
}

@override
String toString() {
    return 'ProReservationState(viewState: $viewState, actionState: $actionState, reservation: $reservation, errorCode: $errorCode, notice: $notice)';
}


}

/// @nodoc
abstract mixin class _$ProReservationStateCopyWith<$Res> implements $ProReservationStateCopyWith<$Res> {
  factory _$ProReservationStateCopyWith(_ProReservationState value, $Res Function(_ProReservationState) _then) = __$ProReservationStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, ReservationModel? reservation, String? errorCode, String? notice
});


@override $ReservationModelCopyWith<$Res>? get reservation;

}
/// @nodoc
class __$ProReservationStateCopyWithImpl<$Res>
    implements _$ProReservationStateCopyWith<$Res> {
  __$ProReservationStateCopyWithImpl(this._self, this._then);

  final _ProReservationState _self;
  final $Res Function(_ProReservationState) _then;

/// Create a copy of ProReservationState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? reservation = freezed,Object? errorCode = freezed,Object? notice = freezed,}) {
  return _then(_ProReservationState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,reservation: freezed == reservation ? _self.reservation : reservation // ignore: cast_nullable_to_non_nullable
as ReservationModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProReservationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationModelCopyWith<$Res>? get reservation {
    if (_self.reservation == null) {
    return null;
  }

  return $ReservationModelCopyWith<$Res>(_self.reservation!, (value) {
    return _then(_self.copyWith(reservation: value));
  });
}
}

// dart format on
