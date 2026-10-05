// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'return_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ReturnState {

 String? get reference; ViewState get loadState; ViewState get actionState; TravellerReturnModel? get data;/// The trip that was on its way just ended (a short notice).
 DateTime? get shuttleEndedAt; String? get errorCode; DateTime get now;/// When the return state was last read from the API (the "En direct" pills count from it).
 DateTime? get fetchedAt;
/// Create a copy of ReturnState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReturnStateCopyWith<ReturnState> get copyWith => _$ReturnStateCopyWithImpl<ReturnState>(this as ReturnState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ReturnState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReturnState&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.shuttleEndedAt, _this.shuttleEndedAt) || other.shuttleEndedAt == _this.shuttleEndedAt)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.now, _this.now) || other.now == _this.now)&&(identical(other.fetchedAt, _this.fetchedAt) || other.fetchedAt == _this.fetchedAt));
}


@override
int get hashCode {
  final _this = this as ReturnState;
  return Object.hash(runtimeType,_this.reference,_this.loadState,_this.actionState,_this.data,_this.shuttleEndedAt,_this.errorCode,_this.now,_this.fetchedAt);
}

@override
String toString() {
  final _this = this as ReturnState;
  return 'ReturnState(reference: ${_this.reference}, loadState: ${_this.loadState}, actionState: ${_this.actionState}, data: ${_this.data}, shuttleEndedAt: ${_this.shuttleEndedAt}, errorCode: ${_this.errorCode}, now: ${_this.now}, fetchedAt: ${_this.fetchedAt})';
}


}

/// @nodoc
abstract mixin class $ReturnStateCopyWith<$Res>  {
  factory $ReturnStateCopyWith(ReturnState value, $Res Function(ReturnState) _then) = _$ReturnStateCopyWithImpl;
@useResult
$Res call({
 String? reference, ViewState loadState, ViewState actionState, TravellerReturnModel? data, DateTime? shuttleEndedAt, String? errorCode, DateTime now, DateTime? fetchedAt
});


$TravellerReturnModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$ReturnStateCopyWithImpl<$Res>
    implements $ReturnStateCopyWith<$Res> {
  _$ReturnStateCopyWithImpl(this._self, this._then);

  final ReturnState _self;
  final $Res Function(ReturnState) _then;

/// Create a copy of ReturnState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = freezed,Object? loadState = null,Object? actionState = null,Object? data = freezed,Object? shuttleEndedAt = freezed,Object? errorCode = freezed,Object? now = null,Object? fetchedAt = freezed,}) {
  return _then(ReturnState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as TravellerReturnModel?,shuttleEndedAt: freezed == shuttleEndedAt ? _self.shuttleEndedAt : shuttleEndedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,fetchedAt: freezed == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}
/// Create a copy of ReturnState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerReturnModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $TravellerReturnModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [ReturnState].
extension ReturnStatePatterns on ReturnState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReturnState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReturnState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReturnState value)  $default,){
final _that = this;
switch (_that) {
case _ReturnState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReturnState value)?  $default,){
final _that = this;
switch (_that) {
case _ReturnState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  ViewState actionState,  TravellerReturnModel? data,  DateTime? shuttleEndedAt,  String? errorCode,  DateTime now,  DateTime? fetchedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReturnState() when $default != null:
return $default(_that.reference,_that.loadState,_that.actionState,_that.data,_that.shuttleEndedAt,_that.errorCode,_that.now,_that.fetchedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reference,  ViewState loadState,  ViewState actionState,  TravellerReturnModel? data,  DateTime? shuttleEndedAt,  String? errorCode,  DateTime now,  DateTime? fetchedAt)  $default,) {final _that = this;
switch (_that) {
case _ReturnState():
return $default(_that.reference,_that.loadState,_that.actionState,_that.data,_that.shuttleEndedAt,_that.errorCode,_that.now,_that.fetchedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reference,  ViewState loadState,  ViewState actionState,  TravellerReturnModel? data,  DateTime? shuttleEndedAt,  String? errorCode,  DateTime now,  DateTime? fetchedAt)?  $default,) {final _that = this;
switch (_that) {
case _ReturnState() when $default != null:
return $default(_that.reference,_that.loadState,_that.actionState,_that.data,_that.shuttleEndedAt,_that.errorCode,_that.now,_that.fetchedAt);case _:
  return null;

}
}

}

/// @nodoc


class _ReturnState extends ReturnState {
  const _ReturnState({this.reference, this.loadState = ViewState.idle, this.actionState = ViewState.idle, this.data, this.shuttleEndedAt, this.errorCode, required this.now, this.fetchedAt}): super._();
  

@override final  String? reference;
@override@JsonKey() final  ViewState loadState;
@override@JsonKey() final  ViewState actionState;
@override final  TravellerReturnModel? data;
/// The trip that was on its way just ended (a short notice).
@override final  DateTime? shuttleEndedAt;
@override final  String? errorCode;
@override final  DateTime now;
/// When the return state was last read from the API (the "En direct" pills count from it).
@override final  DateTime? fetchedAt;

/// Create a copy of ReturnState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReturnStateCopyWith<_ReturnState> get copyWith => __$ReturnStateCopyWithImpl<_ReturnState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReturnState&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.data, data) || other.data == data)&&(identical(other.shuttleEndedAt, shuttleEndedAt) || other.shuttleEndedAt == shuttleEndedAt)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.now, now) || other.now == now)&&(identical(other.fetchedAt, fetchedAt) || other.fetchedAt == fetchedAt));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reference,loadState,actionState,data,shuttleEndedAt,errorCode,now,fetchedAt);
}

@override
String toString() {
    return 'ReturnState(reference: $reference, loadState: $loadState, actionState: $actionState, data: $data, shuttleEndedAt: $shuttleEndedAt, errorCode: $errorCode, now: $now, fetchedAt: $fetchedAt)';
}


}

/// @nodoc
abstract mixin class _$ReturnStateCopyWith<$Res> implements $ReturnStateCopyWith<$Res> {
  factory _$ReturnStateCopyWith(_ReturnState value, $Res Function(_ReturnState) _then) = __$ReturnStateCopyWithImpl;
@override @useResult
$Res call({
 String? reference, ViewState loadState, ViewState actionState, TravellerReturnModel? data, DateTime? shuttleEndedAt, String? errorCode, DateTime now, DateTime? fetchedAt
});


@override $TravellerReturnModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$ReturnStateCopyWithImpl<$Res>
    implements _$ReturnStateCopyWith<$Res> {
  __$ReturnStateCopyWithImpl(this._self, this._then);

  final _ReturnState _self;
  final $Res Function(_ReturnState) _then;

/// Create a copy of ReturnState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = freezed,Object? loadState = null,Object? actionState = null,Object? data = freezed,Object? shuttleEndedAt = freezed,Object? errorCode = freezed,Object? now = null,Object? fetchedAt = freezed,}) {
  return _then(_ReturnState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as TravellerReturnModel?,shuttleEndedAt: freezed == shuttleEndedAt ? _self.shuttleEndedAt : shuttleEndedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,fetchedAt: freezed == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

/// Create a copy of ReturnState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerReturnModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $TravellerReturnModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
