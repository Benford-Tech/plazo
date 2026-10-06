// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'car_location_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$CarLocationState {

 ViewState get viewState;/// The booking as the API returned it after the last action (the page refreshes from it).
 PublicBookingModel? get booking; String? get errorCode; LocationAccess? get locationProblem; bool get noFix;
/// Create a copy of CarLocationState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CarLocationStateCopyWith<CarLocationState> get copyWith => _$CarLocationStateCopyWithImpl<CarLocationState>(this as CarLocationState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as CarLocationState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CarLocationState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.booking, _this.booking) || other.booking == _this.booking)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.locationProblem, _this.locationProblem) || other.locationProblem == _this.locationProblem)&&(identical(other.noFix, _this.noFix) || other.noFix == _this.noFix));
}


@override
int get hashCode {
  final _this = this as CarLocationState;
  return Object.hash(runtimeType,_this.viewState,_this.booking,_this.errorCode,_this.locationProblem,_this.noFix);
}

@override
String toString() {
  final _this = this as CarLocationState;
  return 'CarLocationState(viewState: ${_this.viewState}, booking: ${_this.booking}, errorCode: ${_this.errorCode}, locationProblem: ${_this.locationProblem}, noFix: ${_this.noFix})';
}


}

/// @nodoc
abstract mixin class $CarLocationStateCopyWith<$Res>  {
  factory $CarLocationStateCopyWith(CarLocationState value, $Res Function(CarLocationState) _then) = _$CarLocationStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, PublicBookingModel? booking, String? errorCode, LocationAccess? locationProblem, bool noFix
});


$PublicBookingModelCopyWith<$Res>? get booking;

}
/// @nodoc
class _$CarLocationStateCopyWithImpl<$Res>
    implements $CarLocationStateCopyWith<$Res> {
  _$CarLocationStateCopyWithImpl(this._self, this._then);

  final CarLocationState _self;
  final $Res Function(CarLocationState) _then;

/// Create a copy of CarLocationState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? booking = freezed,Object? errorCode = freezed,Object? locationProblem = freezed,Object? noFix = null,}) {
  return _then(CarLocationState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,noFix: null == noFix ? _self.noFix : noFix // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of CarLocationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<$Res>? get booking {
    if (_self.booking == null) {
    return null;
  }

  return $PublicBookingModelCopyWith<$Res>(_self.booking!, (value) {
    return _then(_self.copyWith(booking: value));
  });
}
}


/// Adds pattern-matching-related methods to [CarLocationState].
extension CarLocationStatePatterns on CarLocationState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CarLocationState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CarLocationState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CarLocationState value)  $default,){
final _that = this;
switch (_that) {
case _CarLocationState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CarLocationState value)?  $default,){
final _that = this;
switch (_that) {
case _CarLocationState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  PublicBookingModel? booking,  String? errorCode,  LocationAccess? locationProblem,  bool noFix)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CarLocationState() when $default != null:
return $default(_that.viewState,_that.booking,_that.errorCode,_that.locationProblem,_that.noFix);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  PublicBookingModel? booking,  String? errorCode,  LocationAccess? locationProblem,  bool noFix)  $default,) {final _that = this;
switch (_that) {
case _CarLocationState():
return $default(_that.viewState,_that.booking,_that.errorCode,_that.locationProblem,_that.noFix);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  PublicBookingModel? booking,  String? errorCode,  LocationAccess? locationProblem,  bool noFix)?  $default,) {final _that = this;
switch (_that) {
case _CarLocationState() when $default != null:
return $default(_that.viewState,_that.booking,_that.errorCode,_that.locationProblem,_that.noFix);case _:
  return null;

}
}

}

/// @nodoc


class _CarLocationState extends CarLocationState {
  const _CarLocationState({this.viewState = ViewState.idle, this.booking, this.errorCode, this.locationProblem, this.noFix = false}): super._();
  

@override@JsonKey() final  ViewState viewState;
/// The booking as the API returned it after the last action (the page refreshes from it).
@override final  PublicBookingModel? booking;
@override final  String? errorCode;
@override final  LocationAccess? locationProblem;
@override@JsonKey() final  bool noFix;

/// Create a copy of CarLocationState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CarLocationStateCopyWith<_CarLocationState> get copyWith => __$CarLocationStateCopyWithImpl<_CarLocationState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CarLocationState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.booking, booking) || other.booking == booking)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.locationProblem, locationProblem) || other.locationProblem == locationProblem)&&(identical(other.noFix, noFix) || other.noFix == noFix));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,booking,errorCode,locationProblem,noFix);
}

@override
String toString() {
    return 'CarLocationState(viewState: $viewState, booking: $booking, errorCode: $errorCode, locationProblem: $locationProblem, noFix: $noFix)';
}


}

/// @nodoc
abstract mixin class _$CarLocationStateCopyWith<$Res> implements $CarLocationStateCopyWith<$Res> {
  factory _$CarLocationStateCopyWith(_CarLocationState value, $Res Function(_CarLocationState) _then) = __$CarLocationStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, PublicBookingModel? booking, String? errorCode, LocationAccess? locationProblem, bool noFix
});


@override $PublicBookingModelCopyWith<$Res>? get booking;

}
/// @nodoc
class __$CarLocationStateCopyWithImpl<$Res>
    implements _$CarLocationStateCopyWith<$Res> {
  __$CarLocationStateCopyWithImpl(this._self, this._then);

  final _CarLocationState _self;
  final $Res Function(_CarLocationState) _then;

/// Create a copy of CarLocationState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? booking = freezed,Object? errorCode = freezed,Object? locationProblem = freezed,Object? noFix = null,}) {
  return _then(_CarLocationState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,noFix: null == noFix ? _self.noFix : noFix // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of CarLocationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<$Res>? get booking {
    if (_self.booking == null) {
    return null;
  }

  return $PublicBookingModelCopyWith<$Res>(_self.booking!, (value) {
    return _then(_self.copyWith(booking: value));
  });
}
}

// dart format on
