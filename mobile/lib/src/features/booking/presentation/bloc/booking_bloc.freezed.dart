// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'booking_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$BookingState {

 ViewState get viewState; ViewState get lookupState; String? get reference; PublicBookingModel? get booking; String? get errorMessage; List<String> get savedReferences;
/// Create a copy of BookingState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingStateCopyWith<BookingState> get copyWith => _$BookingStateCopyWithImpl<BookingState>(this as BookingState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as BookingState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.lookupState, _this.lookupState) || other.lookupState == _this.lookupState)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.booking, _this.booking) || other.booking == _this.booking)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&const DeepCollectionEquality().equals(other.savedReferences, _this.savedReferences));
}


@override
int get hashCode {
  final _this = this as BookingState;
  return Object.hash(runtimeType,_this.viewState,_this.lookupState,_this.reference,_this.booking,_this.errorMessage,const DeepCollectionEquality().hash(_this.savedReferences));
}

@override
String toString() {
  final _this = this as BookingState;
  return 'BookingState(viewState: ${_this.viewState}, lookupState: ${_this.lookupState}, reference: ${_this.reference}, booking: ${_this.booking}, errorMessage: ${_this.errorMessage}, savedReferences: ${_this.savedReferences})';
}


}

/// @nodoc
abstract mixin class $BookingStateCopyWith<$Res>  {
  factory $BookingStateCopyWith(BookingState value, $Res Function(BookingState) _then) = _$BookingStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState lookupState, String? reference, PublicBookingModel? booking, String? errorMessage, List<String> savedReferences
});


$PublicBookingModelCopyWith<$Res>? get booking;

}
/// @nodoc
class _$BookingStateCopyWithImpl<$Res>
    implements $BookingStateCopyWith<$Res> {
  _$BookingStateCopyWithImpl(this._self, this._then);

  final BookingState _self;
  final $Res Function(BookingState) _then;

/// Create a copy of BookingState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? lookupState = null,Object? reference = freezed,Object? booking = freezed,Object? errorMessage = freezed,Object? savedReferences = null,}) {
  return _then(BookingState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,lookupState: null == lookupState ? _self.lookupState : lookupState // ignore: cast_nullable_to_non_nullable
as ViewState,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,savedReferences: null == savedReferences ? _self.savedReferences : savedReferences // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}
/// Create a copy of BookingState
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


/// Adds pattern-matching-related methods to [BookingState].
extension BookingStatePatterns on BookingState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingState value)  $default,){
final _that = this;
switch (_that) {
case _BookingState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingState value)?  $default,){
final _that = this;
switch (_that) {
case _BookingState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState lookupState,  String? reference,  PublicBookingModel? booking,  String? errorMessage,  List<String> savedReferences)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingState() when $default != null:
return $default(_that.viewState,_that.lookupState,_that.reference,_that.booking,_that.errorMessage,_that.savedReferences);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState lookupState,  String? reference,  PublicBookingModel? booking,  String? errorMessage,  List<String> savedReferences)  $default,) {final _that = this;
switch (_that) {
case _BookingState():
return $default(_that.viewState,_that.lookupState,_that.reference,_that.booking,_that.errorMessage,_that.savedReferences);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState lookupState,  String? reference,  PublicBookingModel? booking,  String? errorMessage,  List<String> savedReferences)?  $default,) {final _that = this;
switch (_that) {
case _BookingState() when $default != null:
return $default(_that.viewState,_that.lookupState,_that.reference,_that.booking,_that.errorMessage,_that.savedReferences);case _:
  return null;

}
}

}

/// @nodoc


class _BookingState implements BookingState {
  const _BookingState({this.viewState = ViewState.idle, this.lookupState = ViewState.idle, this.reference, this.booking, this.errorMessage,  List<String> savedReferences = const []}): _savedReferences = savedReferences;
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState lookupState;
@override final  String? reference;
@override final  PublicBookingModel? booking;
@override final  String? errorMessage;
 final  List<String> _savedReferences;
@override@JsonKey() List<String> get savedReferences {
  if (_savedReferences is EqualUnmodifiableListView) return _savedReferences;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_savedReferences);
}


/// Create a copy of BookingState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingStateCopyWith<_BookingState> get copyWith => __$BookingStateCopyWithImpl<_BookingState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.lookupState, lookupState) || other.lookupState == lookupState)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.booking, booking) || other.booking == booking)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&const DeepCollectionEquality().equals(other.savedReferences, _savedReferences));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,lookupState,reference,booking,errorMessage,const DeepCollectionEquality().hash(_savedReferences));
}

@override
String toString() {
    return 'BookingState(viewState: $viewState, lookupState: $lookupState, reference: $reference, booking: $booking, errorMessage: $errorMessage, savedReferences: $savedReferences)';
}


}

/// @nodoc
abstract mixin class _$BookingStateCopyWith<$Res> implements $BookingStateCopyWith<$Res> {
  factory _$BookingStateCopyWith(_BookingState value, $Res Function(_BookingState) _then) = __$BookingStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState lookupState, String? reference, PublicBookingModel? booking, String? errorMessage, List<String> savedReferences
});


@override $PublicBookingModelCopyWith<$Res>? get booking;

}
/// @nodoc
class __$BookingStateCopyWithImpl<$Res>
    implements _$BookingStateCopyWith<$Res> {
  __$BookingStateCopyWithImpl(this._self, this._then);

  final _BookingState _self;
  final $Res Function(_BookingState) _then;

/// Create a copy of BookingState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? lookupState = null,Object? reference = freezed,Object? booking = freezed,Object? errorMessage = freezed,Object? savedReferences = null,}) {
  return _then(_BookingState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,lookupState: null == lookupState ? _self.lookupState : lookupState // ignore: cast_nullable_to_non_nullable
as ViewState,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,savedReferences: null == savedReferences ? _self._savedReferences : savedReferences // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

/// Create a copy of BookingState
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
