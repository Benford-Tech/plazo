// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'parking_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ParkingState {

 String get airport; String get slug; String? get arrivalAt; String? get returnAt; ViewState get loadState; ParkingResponseModel? get response; String? get errorMessage;
/// Create a copy of ParkingState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingStateCopyWith<ParkingState> get copyWith => _$ParkingStateCopyWithImpl<ParkingState>(this as ParkingState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ParkingState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingState&&(identical(other.airport, _this.airport) || other.airport == _this.airport)&&(identical(other.slug, _this.slug) || other.slug == _this.slug)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.response, _this.response) || other.response == _this.response)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage));
}


@override
int get hashCode {
  final _this = this as ParkingState;
  return Object.hash(runtimeType,_this.airport,_this.slug,_this.arrivalAt,_this.returnAt,_this.loadState,_this.response,_this.errorMessage);
}

@override
String toString() {
  final _this = this as ParkingState;
  return 'ParkingState(airport: ${_this.airport}, slug: ${_this.slug}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, loadState: ${_this.loadState}, response: ${_this.response}, errorMessage: ${_this.errorMessage})';
}


}

/// @nodoc
abstract mixin class $ParkingStateCopyWith<$Res>  {
  factory $ParkingStateCopyWith(ParkingState value, $Res Function(ParkingState) _then) = _$ParkingStateCopyWithImpl;
@useResult
$Res call({
 String airport, String slug, String? arrivalAt, String? returnAt, ViewState loadState, ParkingResponseModel? response, String? errorMessage
});


$ParkingResponseModelCopyWith<$Res>? get response;

}
/// @nodoc
class _$ParkingStateCopyWithImpl<$Res>
    implements $ParkingStateCopyWith<$Res> {
  _$ParkingStateCopyWithImpl(this._self, this._then);

  final ParkingState _self;
  final $Res Function(ParkingState) _then;

/// Create a copy of ParkingState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? airport = null,Object? slug = null,Object? arrivalAt = freezed,Object? returnAt = freezed,Object? loadState = null,Object? response = freezed,Object? errorMessage = freezed,}) {
  return _then(ParkingState(
airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as String,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: freezed == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String?,returnAt: freezed == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,response: freezed == response ? _self.response : response // ignore: cast_nullable_to_non_nullable
as ParkingResponseModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ParkingState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingResponseModelCopyWith<$Res>? get response {
    if (_self.response == null) {
    return null;
  }

  return $ParkingResponseModelCopyWith<$Res>(_self.response!, (value) {
    return _then(_self.copyWith(response: value));
  });
}
}


/// Adds pattern-matching-related methods to [ParkingState].
extension ParkingStatePatterns on ParkingState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingState value)  $default,){
final _that = this;
switch (_that) {
case _ParkingState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingState value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String airport,  String slug,  String? arrivalAt,  String? returnAt,  ViewState loadState,  ParkingResponseModel? response,  String? errorMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingState() when $default != null:
return $default(_that.airport,_that.slug,_that.arrivalAt,_that.returnAt,_that.loadState,_that.response,_that.errorMessage);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String airport,  String slug,  String? arrivalAt,  String? returnAt,  ViewState loadState,  ParkingResponseModel? response,  String? errorMessage)  $default,) {final _that = this;
switch (_that) {
case _ParkingState():
return $default(_that.airport,_that.slug,_that.arrivalAt,_that.returnAt,_that.loadState,_that.response,_that.errorMessage);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String airport,  String slug,  String? arrivalAt,  String? returnAt,  ViewState loadState,  ParkingResponseModel? response,  String? errorMessage)?  $default,) {final _that = this;
switch (_that) {
case _ParkingState() when $default != null:
return $default(_that.airport,_that.slug,_that.arrivalAt,_that.returnAt,_that.loadState,_that.response,_that.errorMessage);case _:
  return null;

}
}

}

/// @nodoc


class _ParkingState extends ParkingState {
  const _ParkingState({required this.airport, required this.slug, this.arrivalAt, this.returnAt, this.loadState = ViewState.idle, this.response, this.errorMessage}): super._();
  

@override final  String airport;
@override final  String slug;
@override final  String? arrivalAt;
@override final  String? returnAt;
@override@JsonKey() final  ViewState loadState;
@override final  ParkingResponseModel? response;
@override final  String? errorMessage;

/// Create a copy of ParkingState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingStateCopyWith<_ParkingState> get copyWith => __$ParkingStateCopyWithImpl<_ParkingState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingState&&(identical(other.airport, airport) || other.airport == airport)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.response, response) || other.response == response)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode {
    return Object.hash(runtimeType,airport,slug,arrivalAt,returnAt,loadState,response,errorMessage);
}

@override
String toString() {
    return 'ParkingState(airport: $airport, slug: $slug, arrivalAt: $arrivalAt, returnAt: $returnAt, loadState: $loadState, response: $response, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class _$ParkingStateCopyWith<$Res> implements $ParkingStateCopyWith<$Res> {
  factory _$ParkingStateCopyWith(_ParkingState value, $Res Function(_ParkingState) _then) = __$ParkingStateCopyWithImpl;
@override @useResult
$Res call({
 String airport, String slug, String? arrivalAt, String? returnAt, ViewState loadState, ParkingResponseModel? response, String? errorMessage
});


@override $ParkingResponseModelCopyWith<$Res>? get response;

}
/// @nodoc
class __$ParkingStateCopyWithImpl<$Res>
    implements _$ParkingStateCopyWith<$Res> {
  __$ParkingStateCopyWithImpl(this._self, this._then);

  final _ParkingState _self;
  final $Res Function(_ParkingState) _then;

/// Create a copy of ParkingState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? airport = null,Object? slug = null,Object? arrivalAt = freezed,Object? returnAt = freezed,Object? loadState = null,Object? response = freezed,Object? errorMessage = freezed,}) {
  return _then(_ParkingState(
airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as String,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: freezed == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String?,returnAt: freezed == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,response: freezed == response ? _self.response : response // ignore: cast_nullable_to_non_nullable
as ParkingResponseModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ParkingState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingResponseModelCopyWith<$Res>? get response {
    if (_self.response == null) {
    return null;
  }

  return $ParkingResponseModelCopyWith<$Res>(_self.response!, (value) {
    return _then(_self.copyWith(response: value));
  });
}
}

// dart format on
