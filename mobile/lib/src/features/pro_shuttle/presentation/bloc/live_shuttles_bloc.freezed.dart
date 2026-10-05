// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'live_shuttles_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$LiveShuttlesState {

 ViewState get viewState; LiveShuttlesModel? get data; String? get errorCode; DateTime get now;
/// Create a copy of LiveShuttlesState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LiveShuttlesStateCopyWith<LiveShuttlesState> get copyWith => _$LiveShuttlesStateCopyWithImpl<LiveShuttlesState>(this as LiveShuttlesState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as LiveShuttlesState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LiveShuttlesState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as LiveShuttlesState;
  return Object.hash(runtimeType,_this.viewState,_this.data,_this.errorCode,_this.now);
}

@override
String toString() {
  final _this = this as LiveShuttlesState;
  return 'LiveShuttlesState(viewState: ${_this.viewState}, data: ${_this.data}, errorCode: ${_this.errorCode}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $LiveShuttlesStateCopyWith<$Res>  {
  factory $LiveShuttlesStateCopyWith(LiveShuttlesState value, $Res Function(LiveShuttlesState) _then) = _$LiveShuttlesStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, LiveShuttlesModel? data, String? errorCode, DateTime now
});


$LiveShuttlesModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$LiveShuttlesStateCopyWithImpl<$Res>
    implements $LiveShuttlesStateCopyWith<$Res> {
  _$LiveShuttlesStateCopyWithImpl(this._self, this._then);

  final LiveShuttlesState _self;
  final $Res Function(LiveShuttlesState) _then;

/// Create a copy of LiveShuttlesState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? data = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(LiveShuttlesState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as LiveShuttlesModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of LiveShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveShuttlesModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $LiveShuttlesModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [LiveShuttlesState].
extension LiveShuttlesStatePatterns on LiveShuttlesState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LiveShuttlesState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LiveShuttlesState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LiveShuttlesState value)  $default,){
final _that = this;
switch (_that) {
case _LiveShuttlesState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LiveShuttlesState value)?  $default,){
final _that = this;
switch (_that) {
case _LiveShuttlesState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  LiveShuttlesModel? data,  String? errorCode,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LiveShuttlesState() when $default != null:
return $default(_that.viewState,_that.data,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  LiveShuttlesModel? data,  String? errorCode,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _LiveShuttlesState():
return $default(_that.viewState,_that.data,_that.errorCode,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  LiveShuttlesModel? data,  String? errorCode,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _LiveShuttlesState() when $default != null:
return $default(_that.viewState,_that.data,_that.errorCode,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _LiveShuttlesState extends LiveShuttlesState {
  const _LiveShuttlesState({this.viewState = ViewState.idle, this.data, this.errorCode, required this.now}): super._();
  

@override@JsonKey() final  ViewState viewState;
@override final  LiveShuttlesModel? data;
@override final  String? errorCode;
@override final  DateTime now;

/// Create a copy of LiveShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LiveShuttlesStateCopyWith<_LiveShuttlesState> get copyWith => __$LiveShuttlesStateCopyWithImpl<_LiveShuttlesState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LiveShuttlesState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.data, data) || other.data == data)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,data,errorCode,now);
}

@override
String toString() {
    return 'LiveShuttlesState(viewState: $viewState, data: $data, errorCode: $errorCode, now: $now)';
}


}

/// @nodoc
abstract mixin class _$LiveShuttlesStateCopyWith<$Res> implements $LiveShuttlesStateCopyWith<$Res> {
  factory _$LiveShuttlesStateCopyWith(_LiveShuttlesState value, $Res Function(_LiveShuttlesState) _then) = __$LiveShuttlesStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, LiveShuttlesModel? data, String? errorCode, DateTime now
});


@override $LiveShuttlesModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$LiveShuttlesStateCopyWithImpl<$Res>
    implements _$LiveShuttlesStateCopyWith<$Res> {
  __$LiveShuttlesStateCopyWithImpl(this._self, this._then);

  final _LiveShuttlesState _self;
  final $Res Function(_LiveShuttlesState) _then;

/// Create a copy of LiveShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? data = freezed,Object? errorCode = freezed,Object? now = null,}) {
  return _then(_LiveShuttlesState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as LiveShuttlesModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of LiveShuttlesState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LiveShuttlesModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $LiveShuttlesModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
