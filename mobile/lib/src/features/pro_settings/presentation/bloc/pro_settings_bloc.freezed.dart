// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_settings_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProSettingsState {

 ViewState get viewState; ViewState get actionState; ParkingSettingsModel? get parking; SmsSettingsModel? get sms; SmsStatusModel? get smsStatus;/// "settings.saved", "sms.saved", "sms.test_sent:`to`", "sms.test_queued:`to`", "sms.disabled", "account.password_changed".
 String? get notice; String? get errorCode; Map<String, String> get fieldErrors;
/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProSettingsStateCopyWith<ProSettingsState> get copyWith => _$ProSettingsStateCopyWithImpl<ProSettingsState>(this as ProSettingsState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProSettingsState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProSettingsState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.sms, _this.sms) || other.sms == _this.sms)&&(identical(other.smsStatus, _this.smsStatus) || other.smsStatus == _this.smsStatus)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors));
}


@override
int get hashCode {
  final _this = this as ProSettingsState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.parking,_this.sms,_this.smsStatus,_this.notice,_this.errorCode,const DeepCollectionEquality().hash(_this.fieldErrors));
}

@override
String toString() {
  final _this = this as ProSettingsState;
  return 'ProSettingsState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, parking: ${_this.parking}, sms: ${_this.sms}, smsStatus: ${_this.smsStatus}, notice: ${_this.notice}, errorCode: ${_this.errorCode}, fieldErrors: ${_this.fieldErrors})';
}


}

/// @nodoc
abstract mixin class $ProSettingsStateCopyWith<$Res>  {
  factory $ProSettingsStateCopyWith(ProSettingsState value, $Res Function(ProSettingsState) _then) = _$ProSettingsStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, ParkingSettingsModel? parking, SmsSettingsModel? sms, SmsStatusModel? smsStatus, String? notice, String? errorCode, Map<String, String> fieldErrors
});


$ParkingSettingsModelCopyWith<$Res>? get parking;$SmsSettingsModelCopyWith<$Res>? get sms;$SmsStatusModelCopyWith<$Res>? get smsStatus;

}
/// @nodoc
class _$ProSettingsStateCopyWithImpl<$Res>
    implements $ProSettingsStateCopyWith<$Res> {
  _$ProSettingsStateCopyWithImpl(this._self, this._then);

  final ProSettingsState _self;
  final $Res Function(ProSettingsState) _then;

/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? parking = freezed,Object? sms = freezed,Object? smsStatus = freezed,Object? notice = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(ProSettingsState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSettingsModel?,sms: freezed == sms ? _self.sms : sms // ignore: cast_nullable_to_non_nullable
as SmsSettingsModel?,smsStatus: freezed == smsStatus ? _self.smsStatus : smsStatus // ignore: cast_nullable_to_non_nullable
as SmsStatusModel?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}
/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingSettingsModelCopyWith<$Res>? get parking {
    if (_self.parking == null) {
    return null;
  }

  return $ParkingSettingsModelCopyWith<$Res>(_self.parking!, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsSettingsModelCopyWith<$Res>? get sms {
    if (_self.sms == null) {
    return null;
  }

  return $SmsSettingsModelCopyWith<$Res>(_self.sms!, (value) {
    return _then(_self.copyWith(sms: value));
  });
}/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsStatusModelCopyWith<$Res>? get smsStatus {
    if (_self.smsStatus == null) {
    return null;
  }

  return $SmsStatusModelCopyWith<$Res>(_self.smsStatus!, (value) {
    return _then(_self.copyWith(smsStatus: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProSettingsState].
extension ProSettingsStatePatterns on ProSettingsState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProSettingsState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProSettingsState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProSettingsState value)  $default,){
final _that = this;
switch (_that) {
case _ProSettingsState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProSettingsState value)?  $default,){
final _that = this;
switch (_that) {
case _ProSettingsState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ParkingSettingsModel? parking,  SmsSettingsModel? sms,  SmsStatusModel? smsStatus,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProSettingsState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.parking,_that.sms,_that.smsStatus,_that.notice,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ParkingSettingsModel? parking,  SmsSettingsModel? sms,  SmsStatusModel? smsStatus,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)  $default,) {final _that = this;
switch (_that) {
case _ProSettingsState():
return $default(_that.viewState,_that.actionState,_that.parking,_that.sms,_that.smsStatus,_that.notice,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  ParkingSettingsModel? parking,  SmsSettingsModel? sms,  SmsStatusModel? smsStatus,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)?  $default,) {final _that = this;
switch (_that) {
case _ProSettingsState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.parking,_that.sms,_that.smsStatus,_that.notice,_that.errorCode,_that.fieldErrors);case _:
  return null;

}
}

}

/// @nodoc


class _ProSettingsState implements ProSettingsState {
  const _ProSettingsState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.parking, this.sms, this.smsStatus, this.notice, this.errorCode,  Map<String, String> fieldErrors = const {}}): _fieldErrors = fieldErrors;
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override final  ParkingSettingsModel? parking;
@override final  SmsSettingsModel? sms;
@override final  SmsStatusModel? smsStatus;
/// "settings.saved", "sms.saved", "sms.test_sent:`to`", "sms.test_queued:`to`", "sms.disabled", "account.password_changed".
@override final  String? notice;
@override final  String? errorCode;
 final  Map<String, String> _fieldErrors;
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}


/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProSettingsStateCopyWith<_ProSettingsState> get copyWith => __$ProSettingsStateCopyWithImpl<_ProSettingsState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProSettingsState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.sms, sms) || other.sms == sms)&&(identical(other.smsStatus, smsStatus) || other.smsStatus == smsStatus)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,parking,sms,smsStatus,notice,errorCode,const DeepCollectionEquality().hash(_fieldErrors));
}

@override
String toString() {
    return 'ProSettingsState(viewState: $viewState, actionState: $actionState, parking: $parking, sms: $sms, smsStatus: $smsStatus, notice: $notice, errorCode: $errorCode, fieldErrors: $fieldErrors)';
}


}

/// @nodoc
abstract mixin class _$ProSettingsStateCopyWith<$Res> implements $ProSettingsStateCopyWith<$Res> {
  factory _$ProSettingsStateCopyWith(_ProSettingsState value, $Res Function(_ProSettingsState) _then) = __$ProSettingsStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, ParkingSettingsModel? parking, SmsSettingsModel? sms, SmsStatusModel? smsStatus, String? notice, String? errorCode, Map<String, String> fieldErrors
});


@override $ParkingSettingsModelCopyWith<$Res>? get parking;@override $SmsSettingsModelCopyWith<$Res>? get sms;@override $SmsStatusModelCopyWith<$Res>? get smsStatus;

}
/// @nodoc
class __$ProSettingsStateCopyWithImpl<$Res>
    implements _$ProSettingsStateCopyWith<$Res> {
  __$ProSettingsStateCopyWithImpl(this._self, this._then);

  final _ProSettingsState _self;
  final $Res Function(_ProSettingsState) _then;

/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? parking = freezed,Object? sms = freezed,Object? smsStatus = freezed,Object? notice = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(_ProSettingsState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSettingsModel?,sms: freezed == sms ? _self.sms : sms // ignore: cast_nullable_to_non_nullable
as SmsSettingsModel?,smsStatus: freezed == smsStatus ? _self.smsStatus : smsStatus // ignore: cast_nullable_to_non_nullable
as SmsStatusModel?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}

/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingSettingsModelCopyWith<$Res>? get parking {
    if (_self.parking == null) {
    return null;
  }

  return $ParkingSettingsModelCopyWith<$Res>(_self.parking!, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsSettingsModelCopyWith<$Res>? get sms {
    if (_self.sms == null) {
    return null;
  }

  return $SmsSettingsModelCopyWith<$Res>(_self.sms!, (value) {
    return _then(_self.copyWith(sms: value));
  });
}/// Create a copy of ProSettingsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsStatusModelCopyWith<$Res>? get smsStatus {
    if (_self.smsStatus == null) {
    return null;
  }

  return $SmsStatusModelCopyWith<$Res>(_self.smsStatus!, (value) {
    return _then(_self.copyWith(smsStatus: value));
  });
}
}

// dart format on
