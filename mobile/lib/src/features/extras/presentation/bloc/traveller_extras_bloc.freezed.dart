// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'traveller_extras_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$TravellerExtrasState {

 String? get reference; TravellerExtrasModel? get data;/// The service being ordered (its button spins).
 String? get busyKind;/// What just happened, for a snackbar: ordered, canceled, failed; or an API code in [errorCode].
 String? get notice; String? get errorCode; String? get message;
/// Create a copy of TravellerExtrasState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TravellerExtrasStateCopyWith<TravellerExtrasState> get copyWith => _$TravellerExtrasStateCopyWithImpl<TravellerExtrasState>(this as TravellerExtrasState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as TravellerExtrasState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TravellerExtrasState&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.busyKind, _this.busyKind) || other.busyKind == _this.busyKind)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.message, _this.message) || other.message == _this.message));
}


@override
int get hashCode {
  final _this = this as TravellerExtrasState;
  return Object.hash(runtimeType,_this.reference,_this.data,_this.busyKind,_this.notice,_this.errorCode,_this.message);
}

@override
String toString() {
  final _this = this as TravellerExtrasState;
  return 'TravellerExtrasState(reference: ${_this.reference}, data: ${_this.data}, busyKind: ${_this.busyKind}, notice: ${_this.notice}, errorCode: ${_this.errorCode}, message: ${_this.message})';
}


}

/// @nodoc
abstract mixin class $TravellerExtrasStateCopyWith<$Res>  {
  factory $TravellerExtrasStateCopyWith(TravellerExtrasState value, $Res Function(TravellerExtrasState) _then) = _$TravellerExtrasStateCopyWithImpl;
@useResult
$Res call({
 String? reference, TravellerExtrasModel? data, String? busyKind, String? notice, String? errorCode, String? message
});


$TravellerExtrasModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$TravellerExtrasStateCopyWithImpl<$Res>
    implements $TravellerExtrasStateCopyWith<$Res> {
  _$TravellerExtrasStateCopyWithImpl(this._self, this._then);

  final TravellerExtrasState _self;
  final $Res Function(TravellerExtrasState) _then;

/// Create a copy of TravellerExtrasState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = freezed,Object? data = freezed,Object? busyKind = freezed,Object? notice = freezed,Object? errorCode = freezed,Object? message = freezed,}) {
  return _then(TravellerExtrasState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as TravellerExtrasModel?,busyKind: freezed == busyKind ? _self.busyKind : busyKind // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,message: freezed == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of TravellerExtrasState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerExtrasModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $TravellerExtrasModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [TravellerExtrasState].
extension TravellerExtrasStatePatterns on TravellerExtrasState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TravellerExtrasState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TravellerExtrasState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TravellerExtrasState value)  $default,){
final _that = this;
switch (_that) {
case _TravellerExtrasState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TravellerExtrasState value)?  $default,){
final _that = this;
switch (_that) {
case _TravellerExtrasState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reference,  TravellerExtrasModel? data,  String? busyKind,  String? notice,  String? errorCode,  String? message)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TravellerExtrasState() when $default != null:
return $default(_that.reference,_that.data,_that.busyKind,_that.notice,_that.errorCode,_that.message);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reference,  TravellerExtrasModel? data,  String? busyKind,  String? notice,  String? errorCode,  String? message)  $default,) {final _that = this;
switch (_that) {
case _TravellerExtrasState():
return $default(_that.reference,_that.data,_that.busyKind,_that.notice,_that.errorCode,_that.message);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reference,  TravellerExtrasModel? data,  String? busyKind,  String? notice,  String? errorCode,  String? message)?  $default,) {final _that = this;
switch (_that) {
case _TravellerExtrasState() when $default != null:
return $default(_that.reference,_that.data,_that.busyKind,_that.notice,_that.errorCode,_that.message);case _:
  return null;

}
}

}

/// @nodoc


class _TravellerExtrasState extends TravellerExtrasState {
  const _TravellerExtrasState({this.reference, this.data, this.busyKind, this.notice, this.errorCode, this.message}): super._();
  

@override final  String? reference;
@override final  TravellerExtrasModel? data;
/// The service being ordered (its button spins).
@override final  String? busyKind;
/// What just happened, for a snackbar: ordered, canceled, failed; or an API code in [errorCode].
@override final  String? notice;
@override final  String? errorCode;
@override final  String? message;

/// Create a copy of TravellerExtrasState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TravellerExtrasStateCopyWith<_TravellerExtrasState> get copyWith => __$TravellerExtrasStateCopyWithImpl<_TravellerExtrasState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TravellerExtrasState&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.data, data) || other.data == data)&&(identical(other.busyKind, busyKind) || other.busyKind == busyKind)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.message, message) || other.message == message));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reference,data,busyKind,notice,errorCode,message);
}

@override
String toString() {
    return 'TravellerExtrasState(reference: $reference, data: $data, busyKind: $busyKind, notice: $notice, errorCode: $errorCode, message: $message)';
}


}

/// @nodoc
abstract mixin class _$TravellerExtrasStateCopyWith<$Res> implements $TravellerExtrasStateCopyWith<$Res> {
  factory _$TravellerExtrasStateCopyWith(_TravellerExtrasState value, $Res Function(_TravellerExtrasState) _then) = __$TravellerExtrasStateCopyWithImpl;
@override @useResult
$Res call({
 String? reference, TravellerExtrasModel? data, String? busyKind, String? notice, String? errorCode, String? message
});


@override $TravellerExtrasModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$TravellerExtrasStateCopyWithImpl<$Res>
    implements _$TravellerExtrasStateCopyWith<$Res> {
  __$TravellerExtrasStateCopyWithImpl(this._self, this._then);

  final _TravellerExtrasState _self;
  final $Res Function(_TravellerExtrasState) _then;

/// Create a copy of TravellerExtrasState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = freezed,Object? data = freezed,Object? busyKind = freezed,Object? notice = freezed,Object? errorCode = freezed,Object? message = freezed,}) {
  return _then(_TravellerExtrasState(
reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as TravellerExtrasModel?,busyKind: freezed == busyKind ? _self.busyKind : busyKind // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,message: freezed == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of TravellerExtrasState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerExtrasModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $TravellerExtrasModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
