// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'shuttle_waves_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ShuttleWavesState {

 ViewState get viewState; int get dayOffset; ShuttleForecastModel? get data; String? get errorCode; DateTime get now;
/// Create a copy of ShuttleWavesState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleWavesStateCopyWith<ShuttleWavesState> get copyWith => _$ShuttleWavesStateCopyWithImpl<ShuttleWavesState>(this as ShuttleWavesState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ShuttleWavesState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleWavesState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.dayOffset, _this.dayOffset) || other.dayOffset == _this.dayOffset)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as ShuttleWavesState;
  return Object.hash(runtimeType,_this.viewState,_this.dayOffset,_this.data,_this.errorCode,_this.now);
}

@override
String toString() {
  final _this = this as ShuttleWavesState;
  return 'ShuttleWavesState(viewState: ${_this.viewState}, dayOffset: ${_this.dayOffset}, data: ${_this.data}, errorCode: ${_this.errorCode}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $ShuttleWavesStateCopyWith<$Res>  {
  factory $ShuttleWavesStateCopyWith(ShuttleWavesState value, $Res Function(ShuttleWavesState) _then) = _$ShuttleWavesStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, int dayOffset, ShuttleForecastModel? data, String? errorCode, DateTime now
});


$ShuttleForecastModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$ShuttleWavesStateCopyWithImpl<$Res>
    implements $ShuttleWavesStateCopyWith<$Res> {
  _$ShuttleWavesStateCopyWithImpl(this._self, this._then);

  final ShuttleWavesState _self;
  final $Res Function(ShuttleWavesState) _then;

/// Create a copy of ShuttleWavesState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? dayOffset = null,Object? data = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(ShuttleWavesState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,dayOffset: null == dayOffset ? _self.dayOffset : dayOffset // ignore: cast_nullable_to_non_nullable
as int,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as ShuttleForecastModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of ShuttleWavesState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleForecastModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $ShuttleForecastModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [ShuttleWavesState].
extension ShuttleWavesStatePatterns on ShuttleWavesState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleWavesState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleWavesState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleWavesState value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleWavesState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleWavesState value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleWavesState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  int dayOffset,  ShuttleForecastModel? data,  String? errorCode,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleWavesState() when $default != null:
return $default(_that.viewState,_that.dayOffset,_that.data,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  int dayOffset,  ShuttleForecastModel? data,  String? errorCode,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _ShuttleWavesState():
return $default(_that.viewState,_that.dayOffset,_that.data,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  int dayOffset,  ShuttleForecastModel? data,  String? errorCode,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleWavesState() when $default != null:
return $default(_that.viewState,_that.dayOffset,_that.data,_that.errorCode,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _ShuttleWavesState extends ShuttleWavesState {
  const _ShuttleWavesState({this.viewState = ViewState.idle, this.dayOffset = 0, this.data, this.errorCode, required this.now}): super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  int dayOffset;
@override final  ShuttleForecastModel? data;
@override final  String? errorCode;
@override final  DateTime now;

/// Create a copy of ShuttleWavesState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleWavesStateCopyWith<_ShuttleWavesState> get copyWith => __$ShuttleWavesStateCopyWithImpl<_ShuttleWavesState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleWavesState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.dayOffset, dayOffset) || other.dayOffset == dayOffset)&&(identical(other.data, data) || other.data == data)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,dayOffset,data,errorCode,now);
}

@override
String toString() {
    return 'ShuttleWavesState(viewState: $viewState, dayOffset: $dayOffset, data: $data, errorCode: $errorCode, now: $now)';
}


}

/// @nodoc
abstract mixin class _$ShuttleWavesStateCopyWith<$Res> implements $ShuttleWavesStateCopyWith<$Res> {
  factory _$ShuttleWavesStateCopyWith(_ShuttleWavesState value, $Res Function(_ShuttleWavesState) _then) = __$ShuttleWavesStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, int dayOffset, ShuttleForecastModel? data, String? errorCode, DateTime now
});


@override $ShuttleForecastModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$ShuttleWavesStateCopyWithImpl<$Res>
    implements _$ShuttleWavesStateCopyWith<$Res> {
  __$ShuttleWavesStateCopyWithImpl(this._self, this._then);

  final _ShuttleWavesState _self;
  final $Res Function(_ShuttleWavesState) _then;

/// Create a copy of ShuttleWavesState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? dayOffset = null,Object? data = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(_ShuttleWavesState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,dayOffset: null == dayOffset ? _self.dayOffset : dayOffset // ignore: cast_nullable_to_non_nullable
as int,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as ShuttleForecastModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of ShuttleWavesState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleForecastModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $ShuttleForecastModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
