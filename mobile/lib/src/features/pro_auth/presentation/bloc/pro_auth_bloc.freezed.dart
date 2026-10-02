// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_auth_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProAuthState {

 ProAuthStatus get status; ViewState get viewState; StaffModel? get staff; String? get errorCode; String? get errorMessage;
/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProAuthStateCopyWith<ProAuthState> get copyWith => _$ProAuthStateCopyWithImpl<ProAuthState>(this as ProAuthState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProAuthState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProAuthState&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.staff, _this.staff) || other.staff == _this.staff)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage));
}


@override
int get hashCode {
  final _this = this as ProAuthState;
  return Object.hash(runtimeType,_this.status,_this.viewState,_this.staff,_this.errorCode,_this.errorMessage);
}

@override
String toString() {
  final _this = this as ProAuthState;
  return 'ProAuthState(status: ${_this.status}, viewState: ${_this.viewState}, staff: ${_this.staff}, errorCode: ${_this.errorCode}, errorMessage: ${_this.errorMessage})';
}


}

/// @nodoc
abstract mixin class $ProAuthStateCopyWith<$Res>  {
  factory $ProAuthStateCopyWith(ProAuthState value, $Res Function(ProAuthState) _then) = _$ProAuthStateCopyWithImpl;
@useResult
$Res call({
 ProAuthStatus status, ViewState viewState, StaffModel? staff, String? errorCode, String? errorMessage
});


$StaffModelCopyWith<$Res>? get staff;

}
/// @nodoc
class _$ProAuthStateCopyWithImpl<$Res>
    implements $ProAuthStateCopyWith<$Res> {
  _$ProAuthStateCopyWithImpl(this._self, this._then);

  final ProAuthState _self;
  final $Res Function(ProAuthState) _then;

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = null,Object? viewState = null,Object? staff = freezed,Object? errorCode = freezed,Object? errorMessage = freezed,}) {
  return _then(ProAuthState(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ProAuthStatus,viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,staff: freezed == staff ? _self.staff : staff // ignore: cast_nullable_to_non_nullable
as StaffModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffModelCopyWith<$Res>? get staff {
    if (_self.staff == null) {
    return null;
  }

  return $StaffModelCopyWith<$Res>(_self.staff!, (value) {
    return _then(_self.copyWith(staff: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProAuthState].
extension ProAuthStatePatterns on ProAuthState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProAuthState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProAuthState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProAuthState value)  $default,){
final _that = this;
switch (_that) {
case _ProAuthState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProAuthState value)?  $default,){
final _that = this;
switch (_that) {
case _ProAuthState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ProAuthStatus status,  ViewState viewState,  StaffModel? staff,  String? errorCode,  String? errorMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProAuthState() when $default != null:
return $default(_that.status,_that.viewState,_that.staff,_that.errorCode,_that.errorMessage);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ProAuthStatus status,  ViewState viewState,  StaffModel? staff,  String? errorCode,  String? errorMessage)  $default,) {final _that = this;
switch (_that) {
case _ProAuthState():
return $default(_that.status,_that.viewState,_that.staff,_that.errorCode,_that.errorMessage);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ProAuthStatus status,  ViewState viewState,  StaffModel? staff,  String? errorCode,  String? errorMessage)?  $default,) {final _that = this;
switch (_that) {
case _ProAuthState() when $default != null:
return $default(_that.status,_that.viewState,_that.staff,_that.errorCode,_that.errorMessage);case _:
  return null;

}
}

}

/// @nodoc


class _ProAuthState implements ProAuthState {
  const _ProAuthState({this.status = ProAuthStatus.unknown, this.viewState = ViewState.idle, this.staff, this.errorCode, this.errorMessage});
  

@override@JsonKey() final  ProAuthStatus status;
@override@JsonKey() final  ViewState viewState;
@override final  StaffModel? staff;
@override final  String? errorCode;
@override final  String? errorMessage;

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProAuthStateCopyWith<_ProAuthState> get copyWith => __$ProAuthStateCopyWithImpl<_ProAuthState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProAuthState&&(identical(other.status, status) || other.status == status)&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.staff, staff) || other.staff == staff)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode {
    return Object.hash(runtimeType,status,viewState,staff,errorCode,errorMessage);
}

@override
String toString() {
    return 'ProAuthState(status: $status, viewState: $viewState, staff: $staff, errorCode: $errorCode, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class _$ProAuthStateCopyWith<$Res> implements $ProAuthStateCopyWith<$Res> {
  factory _$ProAuthStateCopyWith(_ProAuthState value, $Res Function(_ProAuthState) _then) = __$ProAuthStateCopyWithImpl;
@override @useResult
$Res call({
 ProAuthStatus status, ViewState viewState, StaffModel? staff, String? errorCode, String? errorMessage
});


@override $StaffModelCopyWith<$Res>? get staff;

}
/// @nodoc
class __$ProAuthStateCopyWithImpl<$Res>
    implements _$ProAuthStateCopyWith<$Res> {
  __$ProAuthStateCopyWithImpl(this._self, this._then);

  final _ProAuthState _self;
  final $Res Function(_ProAuthState) _then;

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = null,Object? viewState = null,Object? staff = freezed,Object? errorCode = freezed,Object? errorMessage = freezed,}) {
  return _then(_ProAuthState(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ProAuthStatus,viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,staff: freezed == staff ? _self.staff : staff // ignore: cast_nullable_to_non_nullable
as StaffModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffModelCopyWith<$Res>? get staff {
    if (_self.staff == null) {
    return null;
  }

  return $StaffModelCopyWith<$Res>(_self.staff!, (value) {
    return _then(_self.copyWith(staff: value));
  });
}
}

// dart format on
