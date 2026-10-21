// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'staff_extras_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$StaffExtrasState {

 String? get reservationId; StaffExtrasModel? get data; String? get busyId;/// done | refused, or an API code in [errorCode].
 String? get notice; String? get errorCode;
/// Create a copy of StaffExtrasState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StaffExtrasStateCopyWith<StaffExtrasState> get copyWith => _$StaffExtrasStateCopyWithImpl<StaffExtrasState>(this as StaffExtrasState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as StaffExtrasState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffExtrasState&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.busyId, _this.busyId) || other.busyId == _this.busyId)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as StaffExtrasState;
  return Object.hash(runtimeType,_this.reservationId,_this.data,_this.busyId,_this.notice,_this.errorCode);
}

@override
String toString() {
  final _this = this as StaffExtrasState;
  return 'StaffExtrasState(reservationId: ${_this.reservationId}, data: ${_this.data}, busyId: ${_this.busyId}, notice: ${_this.notice}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $StaffExtrasStateCopyWith<$Res>  {
  factory $StaffExtrasStateCopyWith(StaffExtrasState value, $Res Function(StaffExtrasState) _then) = _$StaffExtrasStateCopyWithImpl;
@useResult
$Res call({
 String? reservationId, StaffExtrasModel? data, String? busyId, String? notice, String? errorCode
});


$StaffExtrasModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$StaffExtrasStateCopyWithImpl<$Res>
    implements $StaffExtrasStateCopyWith<$Res> {
  _$StaffExtrasStateCopyWithImpl(this._self, this._then);

  final StaffExtrasState _self;
  final $Res Function(StaffExtrasState) _then;

/// Create a copy of StaffExtrasState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = freezed,Object? data = freezed,Object? busyId = freezed,Object? notice = freezed,Object? errorCode = freezed,}) {
  return _then(StaffExtrasState(
reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as StaffExtrasModel?,busyId: freezed == busyId ? _self.busyId : busyId // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of StaffExtrasState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffExtrasModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $StaffExtrasModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [StaffExtrasState].
extension StaffExtrasStatePatterns on StaffExtrasState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StaffExtrasState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StaffExtrasState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StaffExtrasState value)  $default,){
final _that = this;
switch (_that) {
case _StaffExtrasState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StaffExtrasState value)?  $default,){
final _that = this;
switch (_that) {
case _StaffExtrasState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reservationId,  StaffExtrasModel? data,  String? busyId,  String? notice,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffExtrasState() when $default != null:
return $default(_that.reservationId,_that.data,_that.busyId,_that.notice,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reservationId,  StaffExtrasModel? data,  String? busyId,  String? notice,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _StaffExtrasState():
return $default(_that.reservationId,_that.data,_that.busyId,_that.notice,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reservationId,  StaffExtrasModel? data,  String? busyId,  String? notice,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _StaffExtrasState() when $default != null:
return $default(_that.reservationId,_that.data,_that.busyId,_that.notice,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _StaffExtrasState extends StaffExtrasState {
  const _StaffExtrasState({this.reservationId, this.data, this.busyId, this.notice, this.errorCode}): super._();
  

@override final  String? reservationId;
@override final  StaffExtrasModel? data;
@override final  String? busyId;
/// done | refused, or an API code in [errorCode].
@override final  String? notice;
@override final  String? errorCode;

/// Create a copy of StaffExtrasState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StaffExtrasStateCopyWith<_StaffExtrasState> get copyWith => __$StaffExtrasStateCopyWithImpl<_StaffExtrasState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffExtrasState&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.data, data) || other.data == data)&&(identical(other.busyId, busyId) || other.busyId == busyId)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,data,busyId,notice,errorCode);
}

@override
String toString() {
    return 'StaffExtrasState(reservationId: $reservationId, data: $data, busyId: $busyId, notice: $notice, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$StaffExtrasStateCopyWith<$Res> implements $StaffExtrasStateCopyWith<$Res> {
  factory _$StaffExtrasStateCopyWith(_StaffExtrasState value, $Res Function(_StaffExtrasState) _then) = __$StaffExtrasStateCopyWithImpl;
@override @useResult
$Res call({
 String? reservationId, StaffExtrasModel? data, String? busyId, String? notice, String? errorCode
});


@override $StaffExtrasModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$StaffExtrasStateCopyWithImpl<$Res>
    implements _$StaffExtrasStateCopyWith<$Res> {
  __$StaffExtrasStateCopyWithImpl(this._self, this._then);

  final _StaffExtrasState _self;
  final $Res Function(_StaffExtrasState) _then;

/// Create a copy of StaffExtrasState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = freezed,Object? data = freezed,Object? busyId = freezed,Object? notice = freezed,Object? errorCode = freezed,}) {
  return _then(_StaffExtrasState(
reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as StaffExtrasModel?,busyId: freezed == busyId ? _self.busyId : busyId // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of StaffExtrasState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffExtrasModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $StaffExtrasModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
