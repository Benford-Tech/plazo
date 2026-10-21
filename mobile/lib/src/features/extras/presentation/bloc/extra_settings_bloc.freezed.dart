// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'extra_settings_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ExtraSettingsState {

 String? get parkingId; ExtraSettingsModel? get data; bool get saving;/// Field codes of the last save ("offers.ev_charge.priceCents": "range", "leadHours": "invalid").
 Map<String, String> get fieldErrors; String? get errorCode; String? get notice;
/// Create a copy of ExtraSettingsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraSettingsStateCopyWith<ExtraSettingsState> get copyWith => _$ExtraSettingsStateCopyWithImpl<ExtraSettingsState>(this as ExtraSettingsState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ExtraSettingsState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraSettingsState&&(identical(other.parkingId, _this.parkingId) || other.parkingId == _this.parkingId)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.saving, _this.saving) || other.saving == _this.saving)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.notice, _this.notice) || other.notice == _this.notice));
}


@override
int get hashCode {
  final _this = this as ExtraSettingsState;
  return Object.hash(runtimeType,_this.parkingId,_this.data,_this.saving,const DeepCollectionEquality().hash(_this.fieldErrors),_this.errorCode,_this.notice);
}

@override
String toString() {
  final _this = this as ExtraSettingsState;
  return 'ExtraSettingsState(parkingId: ${_this.parkingId}, data: ${_this.data}, saving: ${_this.saving}, fieldErrors: ${_this.fieldErrors}, errorCode: ${_this.errorCode}, notice: ${_this.notice})';
}


}

/// @nodoc
abstract mixin class $ExtraSettingsStateCopyWith<$Res>  {
  factory $ExtraSettingsStateCopyWith(ExtraSettingsState value, $Res Function(ExtraSettingsState) _then) = _$ExtraSettingsStateCopyWithImpl;
@useResult
$Res call({
 String? parkingId, ExtraSettingsModel? data, bool saving, Map<String, String> fieldErrors, String? errorCode, String? notice
});


$ExtraSettingsModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$ExtraSettingsStateCopyWithImpl<$Res>
    implements $ExtraSettingsStateCopyWith<$Res> {
  _$ExtraSettingsStateCopyWithImpl(this._self, this._then);

  final ExtraSettingsState _self;
  final $Res Function(ExtraSettingsState) _then;

/// Create a copy of ExtraSettingsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? parkingId = freezed,Object? data = freezed,Object? saving = null,Object? fieldErrors = null,Object? errorCode = freezed,Object? notice = freezed,}) {
  return _then(ExtraSettingsState(
parkingId: freezed == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as ExtraSettingsModel?,saving: null == saving ? _self.saving : saving // ignore: cast_nullable_to_non_nullable
as bool,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ExtraSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExtraSettingsModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $ExtraSettingsModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [ExtraSettingsState].
extension ExtraSettingsStatePatterns on ExtraSettingsState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraSettingsState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraSettingsState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraSettingsState value)  $default,){
final _that = this;
switch (_that) {
case _ExtraSettingsState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraSettingsState value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraSettingsState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? parkingId,  ExtraSettingsModel? data,  bool saving,  Map<String, String> fieldErrors,  String? errorCode,  String? notice)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraSettingsState() when $default != null:
return $default(_that.parkingId,_that.data,_that.saving,_that.fieldErrors,_that.errorCode,_that.notice);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? parkingId,  ExtraSettingsModel? data,  bool saving,  Map<String, String> fieldErrors,  String? errorCode,  String? notice)  $default,) {final _that = this;
switch (_that) {
case _ExtraSettingsState():
return $default(_that.parkingId,_that.data,_that.saving,_that.fieldErrors,_that.errorCode,_that.notice);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? parkingId,  ExtraSettingsModel? data,  bool saving,  Map<String, String> fieldErrors,  String? errorCode,  String? notice)?  $default,) {final _that = this;
switch (_that) {
case _ExtraSettingsState() when $default != null:
return $default(_that.parkingId,_that.data,_that.saving,_that.fieldErrors,_that.errorCode,_that.notice);case _:
  return null;

}
}

}

/// @nodoc


class _ExtraSettingsState implements ExtraSettingsState {
  const _ExtraSettingsState({this.parkingId, this.data, this.saving = false,  Map<String, String> fieldErrors = const <String, String>{}, this.errorCode, this.notice}): _fieldErrors = fieldErrors;
  

@override final  String? parkingId;
@override final  ExtraSettingsModel? data;
@override@JsonKey() final  bool saving;
/// Field codes of the last save ("offers.ev_charge.priceCents": "range", "leadHours": "invalid").
 final  Map<String, String> _fieldErrors;
/// Field codes of the last save ("offers.ev_charge.priceCents": "range", "leadHours": "invalid").
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}

@override final  String? errorCode;
@override final  String? notice;

/// Create a copy of ExtraSettingsState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraSettingsStateCopyWith<_ExtraSettingsState> get copyWith => __$ExtraSettingsStateCopyWithImpl<_ExtraSettingsState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraSettingsState&&(identical(other.parkingId, parkingId) || other.parkingId == parkingId)&&(identical(other.data, data) || other.data == data)&&(identical(other.saving, saving) || other.saving == saving)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.notice, notice) || other.notice == notice));
}


@override
int get hashCode {
    return Object.hash(runtimeType,parkingId,data,saving,const DeepCollectionEquality().hash(_fieldErrors),errorCode,notice);
}

@override
String toString() {
    return 'ExtraSettingsState(parkingId: $parkingId, data: $data, saving: $saving, fieldErrors: $fieldErrors, errorCode: $errorCode, notice: $notice)';
}


}

/// @nodoc
abstract mixin class _$ExtraSettingsStateCopyWith<$Res> implements $ExtraSettingsStateCopyWith<$Res> {
  factory _$ExtraSettingsStateCopyWith(_ExtraSettingsState value, $Res Function(_ExtraSettingsState) _then) = __$ExtraSettingsStateCopyWithImpl;
@override @useResult
$Res call({
 String? parkingId, ExtraSettingsModel? data, bool saving, Map<String, String> fieldErrors, String? errorCode, String? notice
});


@override $ExtraSettingsModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$ExtraSettingsStateCopyWithImpl<$Res>
    implements _$ExtraSettingsStateCopyWith<$Res> {
  __$ExtraSettingsStateCopyWithImpl(this._self, this._then);

  final _ExtraSettingsState _self;
  final $Res Function(_ExtraSettingsState) _then;

/// Create a copy of ExtraSettingsState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? parkingId = freezed,Object? data = freezed,Object? saving = null,Object? fieldErrors = null,Object? errorCode = freezed,Object? notice = freezed,}) {
  return _then(_ExtraSettingsState(
parkingId: freezed == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as ExtraSettingsModel?,saving: null == saving ? _self.saving : saving // ignore: cast_nullable_to_non_nullable
as bool,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ExtraSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExtraSettingsModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $ExtraSettingsModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
