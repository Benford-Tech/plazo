// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'stay_shuttles_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$StayShuttlesState {

 String? get reference; ViewState get loadState; StayShuttlesModel? get data; String? get errorCode; DateTime get now;
/// Create a copy of StayShuttlesState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StayShuttlesStateCopyWith<StayShuttlesState> get copyWith => _$StayShuttlesStateCopyWithImpl<StayShuttlesState>(this as StayShuttlesState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as StayShuttlesState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StayShuttlesState&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as StayShuttlesState;
  return Object.hash(runtimeType,_this.reference,_this.loadState,_this.data,_this.errorCode,_this.now);
}

@override
String toString() {
  final _this = this as StayShuttlesState;
  return 'StayShuttlesState(reference: ${_this.reference}, loadState: ${_this.loadState}, data: ${_this.data}, errorCode: ${_this.errorCode}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $StayShuttlesStateCopyWith<$Res>  {
  factory $StayShuttlesStateCopyWith(StayShuttlesState value, $Res Function(StayShuttlesState) _then) = _$StayShuttlesStateCopyWithImpl;
@useResult
$Res call({
 String? reference, ViewState loadState, StayShuttlesModel? data, String? errorCode, DateTime now
});


$StayShuttlesModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$StayShuttlesStateCopyWithImpl<$Res>
    implements $StayShuttlesStateCopyWith<$Res> {
  _$StayShuttlesStateCopyWithImpl(this._self, this._then);

  final StayShuttlesState _self;
  final $Res Function(StayShuttlesState) _then;

/// Create a copy of StayShuttlesState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = freezed,Object? loadState = null,Object? data = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(StayShuttlesState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as StayShuttlesModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of StayShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StayShuttlesModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $StayShuttlesModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [StayShuttlesState].
extension StayShuttlesStatePatterns on StayShuttlesState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StayShuttlesState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StayShuttlesState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StayShuttlesState value)  $default,){
final _that = this;
switch (_that) {
case _StayShuttlesState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StayShuttlesState value)?  $default,){
final _that = this;
switch (_that) {
case _StayShuttlesState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  StayShuttlesModel? data,  String? errorCode,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StayShuttlesState() when $default != null:
return $default(_that.reference,_that.loadState,_that.data,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  StayShuttlesModel? data,  String? errorCode,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _StayShuttlesState():
return $default(_that.reference,_that.loadState,_that.data,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reference,  ViewState loadState,  StayShuttlesModel? data,  String? errorCode,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _StayShuttlesState() when $default != null:
return $default(_that.reference,_that.loadState,_that.data,_that.errorCode,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _StayShuttlesState extends StayShuttlesState {
  const _StayShuttlesState({this.reference, this.loadState = ViewState.idle, this.data, this.errorCode, required this.now}): super._();
  

@override final  String? reference;
@override@JsonKey() final  ViewState loadState;
@override final  StayShuttlesModel? data;
@override final  String? errorCode;
@override final  DateTime now;

/// Create a copy of StayShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StayShuttlesStateCopyWith<_StayShuttlesState> get copyWith => __$StayShuttlesStateCopyWithImpl<_StayShuttlesState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StayShuttlesState&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.data, data) || other.data == data)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reference,loadState,data,errorCode,now);
}

@override
String toString() {
    return 'StayShuttlesState(reference: $reference, loadState: $loadState, data: $data, errorCode: $errorCode, now: $now)';
}


}

/// @nodoc
abstract mixin class _$StayShuttlesStateCopyWith<$Res> implements $StayShuttlesStateCopyWith<$Res> {
  factory _$StayShuttlesStateCopyWith(_StayShuttlesState value, $Res Function(_StayShuttlesState) _then) = __$StayShuttlesStateCopyWithImpl;
@override @useResult
$Res call({
 String? reference, ViewState loadState, StayShuttlesModel? data, String? errorCode, DateTime now
});


@override $StayShuttlesModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$StayShuttlesStateCopyWithImpl<$Res>
    implements _$StayShuttlesStateCopyWith<$Res> {
  __$StayShuttlesStateCopyWithImpl(this._self, this._then);

  final _StayShuttlesState _self;
  final $Res Function(_StayShuttlesState) _then;

/// Create a copy of StayShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = freezed,Object? loadState = null,Object? data = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(_StayShuttlesState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as StayShuttlesModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of StayShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StayShuttlesModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $StayShuttlesModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
