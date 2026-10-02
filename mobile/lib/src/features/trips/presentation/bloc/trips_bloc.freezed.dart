// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'trips_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$TripsState {

 ViewState get loadState; List<PublicBookingModel> get bookings; String? get errorMessage; DateTime get now;
/// Create a copy of TripsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TripsStateCopyWith<TripsState> get copyWith => _$TripsStateCopyWithImpl<TripsState>(this as TripsState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as TripsState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TripsState&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&const DeepCollectionEquality().equals(other.bookings, _this.bookings)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as TripsState;
  return Object.hash(runtimeType,_this.loadState,const DeepCollectionEquality().hash(_this.bookings),_this.errorMessage,_this.now);
}

@override
String toString() {
  final _this = this as TripsState;
  return 'TripsState(loadState: ${_this.loadState}, bookings: ${_this.bookings}, errorMessage: ${_this.errorMessage}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $TripsStateCopyWith<$Res>  {
  factory $TripsStateCopyWith(TripsState value, $Res Function(TripsState) _then) = _$TripsStateCopyWithImpl;
@useResult
$Res call({
 ViewState loadState, List<PublicBookingModel> bookings, String? errorMessage, DateTime now
});




}
/// @nodoc
class _$TripsStateCopyWithImpl<$Res>
    implements $TripsStateCopyWith<$Res> {
  _$TripsStateCopyWithImpl(this._self, this._then);

  final TripsState _self;
  final $Res Function(TripsState) _then;

/// Create a copy of TripsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? loadState = null,Object? bookings = null,Object? errorMessage = freezed,Object? now = null,}) {
  return _then(TripsState(
loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,bookings: null == bookings ? _self.bookings : bookings // ignore: cast_nullable_to_non_nullable
as List<PublicBookingModel>,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [TripsState].
extension TripsStatePatterns on TripsState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TripsState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TripsState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TripsState value)  $default,){
final _that = this;
switch (_that) {
case _TripsState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TripsState value)?  $default,){
final _that = this;
switch (_that) {
case _TripsState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState loadState,  List<PublicBookingModel> bookings,  String? errorMessage,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TripsState() when $default != null:
return $default(_that.loadState,_that.bookings,_that.errorMessage,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState loadState,  List<PublicBookingModel> bookings,  String? errorMessage,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _TripsState():
return $default(_that.loadState,_that.bookings,_that.errorMessage,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState loadState,  List<PublicBookingModel> bookings,  String? errorMessage,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _TripsState() when $default != null:
return $default(_that.loadState,_that.bookings,_that.errorMessage,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _TripsState extends TripsState {
  const _TripsState({this.loadState = ViewState.idle,  List<PublicBookingModel> bookings = const <PublicBookingModel>[], this.errorMessage, required this.now}): _bookings = bookings,super._();
  

@override@JsonKey() final  ViewState loadState;
 final  List<PublicBookingModel> _bookings;
@override@JsonKey() List<PublicBookingModel> get bookings {
  if (_bookings is EqualUnmodifiableListView) return _bookings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_bookings);
}

@override final  String? errorMessage;
@override final  DateTime now;

/// Create a copy of TripsState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TripsStateCopyWith<_TripsState> get copyWith => __$TripsStateCopyWithImpl<_TripsState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TripsState&&(identical(other.loadState, loadState) || other.loadState == loadState)&&const DeepCollectionEquality().equals(other.bookings, _bookings)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,loadState,const DeepCollectionEquality().hash(_bookings),errorMessage,now);
}

@override
String toString() {
    return 'TripsState(loadState: $loadState, bookings: $bookings, errorMessage: $errorMessage, now: $now)';
}


}

/// @nodoc
abstract mixin class _$TripsStateCopyWith<$Res> implements $TripsStateCopyWith<$Res> {
  factory _$TripsStateCopyWith(_TripsState value, $Res Function(_TripsState) _then) = __$TripsStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState loadState, List<PublicBookingModel> bookings, String? errorMessage, DateTime now
});




}
/// @nodoc
class __$TripsStateCopyWithImpl<$Res>
    implements _$TripsStateCopyWith<$Res> {
  __$TripsStateCopyWithImpl(this._self, this._then);

  final _TripsState _self;
  final $Res Function(_TripsState) _then;

/// Create a copy of TripsState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? loadState = null,Object? bookings = null,Object? errorMessage = freezed,Object? now = null,}) {
  return _then(_TripsState(
loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,bookings: null == bookings ? _self._bookings : bookings // ignore: cast_nullable_to_non_nullable
as List<PublicBookingModel>,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
