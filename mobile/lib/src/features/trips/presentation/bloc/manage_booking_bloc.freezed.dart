// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'manage_booking_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ManageBookingState {

 ViewState get viewState;/// API code of the failure (field code first: "invalid_flight"), translated by the sheet.
 String? get errorCode; String? get errorMessage; PublicBookingModel? get booking;
/// Create a copy of ManageBookingState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ManageBookingStateCopyWith<ManageBookingState> get copyWith => _$ManageBookingStateCopyWithImpl<ManageBookingState>(this as ManageBookingState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ManageBookingState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ManageBookingState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.booking, _this.booking) || other.booking == _this.booking));
}


@override
int get hashCode {
  final _this = this as ManageBookingState;
  return Object.hash(runtimeType,_this.viewState,_this.errorCode,_this.errorMessage,_this.booking);
}

@override
String toString() {
  final _this = this as ManageBookingState;
  return 'ManageBookingState(viewState: ${_this.viewState}, errorCode: ${_this.errorCode}, errorMessage: ${_this.errorMessage}, booking: ${_this.booking})';
}


}

/// @nodoc
abstract mixin class $ManageBookingStateCopyWith<$Res>  {
  factory $ManageBookingStateCopyWith(ManageBookingState value, $Res Function(ManageBookingState) _then) = _$ManageBookingStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, String? errorCode, String? errorMessage, PublicBookingModel? booking
});


$PublicBookingModelCopyWith<$Res>? get booking;

}
/// @nodoc
class _$ManageBookingStateCopyWithImpl<$Res>
    implements $ManageBookingStateCopyWith<$Res> {
  _$ManageBookingStateCopyWithImpl(this._self, this._then);

  final ManageBookingState _self;
  final $Res Function(ManageBookingState) _then;

/// Create a copy of ManageBookingState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? errorCode = freezed,Object? errorMessage = freezed,Object? booking = freezed,}) {
  return _then(ManageBookingState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,
  ));
}
/// Create a copy of ManageBookingState
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


/// Adds pattern-matching-related methods to [ManageBookingState].
extension ManageBookingStatePatterns on ManageBookingState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ManageBookingState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ManageBookingState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ManageBookingState value)  $default,){
final _that = this;
switch (_that) {
case _ManageBookingState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ManageBookingState value)?  $default,){
final _that = this;
switch (_that) {
case _ManageBookingState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  String? errorCode,  String? errorMessage,  PublicBookingModel? booking)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ManageBookingState() when $default != null:
return $default(_that.viewState,_that.errorCode,_that.errorMessage,_that.booking);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  String? errorCode,  String? errorMessage,  PublicBookingModel? booking)  $default,) {final _that = this;
switch (_that) {
case _ManageBookingState():
return $default(_that.viewState,_that.errorCode,_that.errorMessage,_that.booking);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  String? errorCode,  String? errorMessage,  PublicBookingModel? booking)?  $default,) {final _that = this;
switch (_that) {
case _ManageBookingState() when $default != null:
return $default(_that.viewState,_that.errorCode,_that.errorMessage,_that.booking);case _:
  return null;

}
}

}

/// @nodoc


class _ManageBookingState implements ManageBookingState {
  const _ManageBookingState({this.viewState = ViewState.idle, this.errorCode, this.errorMessage, this.booking});
  

@override@JsonKey() final  ViewState viewState;
/// API code of the failure (field code first: "invalid_flight"), translated by the sheet.
@override final  String? errorCode;
@override final  String? errorMessage;
@override final  PublicBookingModel? booking;

/// Create a copy of ManageBookingState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ManageBookingStateCopyWith<_ManageBookingState> get copyWith => __$ManageBookingStateCopyWithImpl<_ManageBookingState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ManageBookingState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.booking, booking) || other.booking == booking));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,errorCode,errorMessage,booking);
}

@override
String toString() {
    return 'ManageBookingState(viewState: $viewState, errorCode: $errorCode, errorMessage: $errorMessage, booking: $booking)';
}


}

/// @nodoc
abstract mixin class _$ManageBookingStateCopyWith<$Res> implements $ManageBookingStateCopyWith<$Res> {
  factory _$ManageBookingStateCopyWith(_ManageBookingState value, $Res Function(_ManageBookingState) _then) = __$ManageBookingStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, String? errorCode, String? errorMessage, PublicBookingModel? booking
});


@override $PublicBookingModelCopyWith<$Res>? get booking;

}
/// @nodoc
class __$ManageBookingStateCopyWithImpl<$Res>
    implements _$ManageBookingStateCopyWith<$Res> {
  __$ManageBookingStateCopyWithImpl(this._self, this._then);

  final _ManageBookingState _self;
  final $Res Function(_ManageBookingState) _then;

/// Create a copy of ManageBookingState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? errorCode = freezed,Object? errorMessage = freezed,Object? booking = freezed,}) {
  return _then(_ManageBookingState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,
  ));
}

/// Create a copy of ManageBookingState
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
