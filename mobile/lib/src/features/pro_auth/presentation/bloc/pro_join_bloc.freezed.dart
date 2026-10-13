// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_join_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProJoinState {

 IdentityModel? get identity; JoinRequestModel? get request;/// The form is shown again (« Taper un nouveau code », or the request just cancelled).
 bool get editing; ViewState get submitState; ViewState get cancelState;/// Opening the staff session once accepted; [session] is then the member.
 ViewState get sessionState; StaffModel? get session;/// The code's error (join_code_incomplete, join_code_invalid), the other fields' (firstName, lastName, wishedRole).
 String? get codeError; Map<String, String> get fieldErrors;/// Any other error (too_many_attempts, email_taken, already_member, network…).
 String? get errorCode;
/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProJoinStateCopyWith<ProJoinState> get copyWith => _$ProJoinStateCopyWithImpl<ProJoinState>(this as ProJoinState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProJoinState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProJoinState&&(identical(other.identity, _this.identity) || other.identity == _this.identity)&&(identical(other.request, _this.request) || other.request == _this.request)&&(identical(other.editing, _this.editing) || other.editing == _this.editing)&&(identical(other.submitState, _this.submitState) || other.submitState == _this.submitState)&&(identical(other.cancelState, _this.cancelState) || other.cancelState == _this.cancelState)&&(identical(other.sessionState, _this.sessionState) || other.sessionState == _this.sessionState)&&(identical(other.session, _this.session) || other.session == _this.session)&&(identical(other.codeError, _this.codeError) || other.codeError == _this.codeError)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ProJoinState;
  return Object.hash(runtimeType,_this.identity,_this.request,_this.editing,_this.submitState,_this.cancelState,_this.sessionState,_this.session,_this.codeError,const DeepCollectionEquality().hash(_this.fieldErrors),_this.errorCode);
}

@override
String toString() {
  final _this = this as ProJoinState;
  return 'ProJoinState(identity: ${_this.identity}, request: ${_this.request}, editing: ${_this.editing}, submitState: ${_this.submitState}, cancelState: ${_this.cancelState}, sessionState: ${_this.sessionState}, session: ${_this.session}, codeError: ${_this.codeError}, fieldErrors: ${_this.fieldErrors}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ProJoinStateCopyWith<$Res>  {
  factory $ProJoinStateCopyWith(ProJoinState value, $Res Function(ProJoinState) _then) = _$ProJoinStateCopyWithImpl;
@useResult
$Res call({
 IdentityModel? identity, JoinRequestModel? request, bool editing, ViewState submitState, ViewState cancelState, ViewState sessionState, StaffModel? session, String? codeError, Map<String, String> fieldErrors, String? errorCode
});


$IdentityModelCopyWith<$Res>? get identity;$JoinRequestModelCopyWith<$Res>? get request;$StaffModelCopyWith<$Res>? get session;

}
/// @nodoc
class _$ProJoinStateCopyWithImpl<$Res>
    implements $ProJoinStateCopyWith<$Res> {
  _$ProJoinStateCopyWithImpl(this._self, this._then);

  final ProJoinState _self;
  final $Res Function(ProJoinState) _then;

/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? identity = freezed,Object? request = freezed,Object? editing = null,Object? submitState = null,Object? cancelState = null,Object? sessionState = null,Object? session = freezed,Object? codeError = freezed,Object? fieldErrors = null,Object? errorCode = freezed,}) {
  return _then(ProJoinState(
identity: freezed == identity ? _self.identity : identity // ignore: cast_nullable_to_non_nullable
as IdentityModel?,request: freezed == request ? _self.request : request // ignore: cast_nullable_to_non_nullable
as JoinRequestModel?,editing: null == editing ? _self.editing : editing // ignore: cast_nullable_to_non_nullable
as bool,submitState: null == submitState ? _self.submitState : submitState // ignore: cast_nullable_to_non_nullable
as ViewState,cancelState: null == cancelState ? _self.cancelState : cancelState // ignore: cast_nullable_to_non_nullable
as ViewState,sessionState: null == sessionState ? _self.sessionState : sessionState // ignore: cast_nullable_to_non_nullable
as ViewState,session: freezed == session ? _self.session : session // ignore: cast_nullable_to_non_nullable
as StaffModel?,codeError: freezed == codeError ? _self.codeError : codeError // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$IdentityModelCopyWith<$Res>? get identity {
    if (_self.identity == null) {
    return null;
  }

  return $IdentityModelCopyWith<$Res>(_self.identity!, (value) {
    return _then(_self.copyWith(identity: value));
  });
}/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$JoinRequestModelCopyWith<$Res>? get request {
    if (_self.request == null) {
    return null;
  }

  return $JoinRequestModelCopyWith<$Res>(_self.request!, (value) {
    return _then(_self.copyWith(request: value));
  });
}/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffModelCopyWith<$Res>? get session {
    if (_self.session == null) {
    return null;
  }

  return $StaffModelCopyWith<$Res>(_self.session!, (value) {
    return _then(_self.copyWith(session: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProJoinState].
extension ProJoinStatePatterns on ProJoinState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProJoinState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProJoinState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProJoinState value)  $default,){
final _that = this;
switch (_that) {
case _ProJoinState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProJoinState value)?  $default,){
final _that = this;
switch (_that) {
case _ProJoinState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( IdentityModel? identity,  JoinRequestModel? request,  bool editing,  ViewState submitState,  ViewState cancelState,  ViewState sessionState,  StaffModel? session,  String? codeError,  Map<String, String> fieldErrors,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProJoinState() when $default != null:
return $default(_that.identity,_that.request,_that.editing,_that.submitState,_that.cancelState,_that.sessionState,_that.session,_that.codeError,_that.fieldErrors,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( IdentityModel? identity,  JoinRequestModel? request,  bool editing,  ViewState submitState,  ViewState cancelState,  ViewState sessionState,  StaffModel? session,  String? codeError,  Map<String, String> fieldErrors,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ProJoinState():
return $default(_that.identity,_that.request,_that.editing,_that.submitState,_that.cancelState,_that.sessionState,_that.session,_that.codeError,_that.fieldErrors,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( IdentityModel? identity,  JoinRequestModel? request,  bool editing,  ViewState submitState,  ViewState cancelState,  ViewState sessionState,  StaffModel? session,  String? codeError,  Map<String, String> fieldErrors,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ProJoinState() when $default != null:
return $default(_that.identity,_that.request,_that.editing,_that.submitState,_that.cancelState,_that.sessionState,_that.session,_that.codeError,_that.fieldErrors,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ProJoinState extends ProJoinState {
  const _ProJoinState({this.identity, this.request, this.editing = false, this.submitState = ViewState.idle, this.cancelState = ViewState.idle, this.sessionState = ViewState.idle, this.session, this.codeError,  Map<String, String> fieldErrors = const <String, String>{}, this.errorCode}): _fieldErrors = fieldErrors,super._();
  

@override final  IdentityModel? identity;
@override final  JoinRequestModel? request;
/// The form is shown again (« Taper un nouveau code », or the request just cancelled).
@override@JsonKey() final  bool editing;
@override@JsonKey() final  ViewState submitState;
@override@JsonKey() final  ViewState cancelState;
/// Opening the staff session once accepted; [session] is then the member.
@override@JsonKey() final  ViewState sessionState;
@override final  StaffModel? session;
/// The code's error (join_code_incomplete, join_code_invalid), the other fields' (firstName, lastName, wishedRole).
@override final  String? codeError;
 final  Map<String, String> _fieldErrors;
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}

/// Any other error (too_many_attempts, email_taken, already_member, network…).
@override final  String? errorCode;

/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProJoinStateCopyWith<_ProJoinState> get copyWith => __$ProJoinStateCopyWithImpl<_ProJoinState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProJoinState&&(identical(other.identity, identity) || other.identity == identity)&&(identical(other.request, request) || other.request == request)&&(identical(other.editing, editing) || other.editing == editing)&&(identical(other.submitState, submitState) || other.submitState == submitState)&&(identical(other.cancelState, cancelState) || other.cancelState == cancelState)&&(identical(other.sessionState, sessionState) || other.sessionState == sessionState)&&(identical(other.session, session) || other.session == session)&&(identical(other.codeError, codeError) || other.codeError == codeError)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,identity,request,editing,submitState,cancelState,sessionState,session,codeError,const DeepCollectionEquality().hash(_fieldErrors),errorCode);
}

@override
String toString() {
    return 'ProJoinState(identity: $identity, request: $request, editing: $editing, submitState: $submitState, cancelState: $cancelState, sessionState: $sessionState, session: $session, codeError: $codeError, fieldErrors: $fieldErrors, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ProJoinStateCopyWith<$Res> implements $ProJoinStateCopyWith<$Res> {
  factory _$ProJoinStateCopyWith(_ProJoinState value, $Res Function(_ProJoinState) _then) = __$ProJoinStateCopyWithImpl;
@override @useResult
$Res call({
 IdentityModel? identity, JoinRequestModel? request, bool editing, ViewState submitState, ViewState cancelState, ViewState sessionState, StaffModel? session, String? codeError, Map<String, String> fieldErrors, String? errorCode
});


@override $IdentityModelCopyWith<$Res>? get identity;@override $JoinRequestModelCopyWith<$Res>? get request;@override $StaffModelCopyWith<$Res>? get session;

}
/// @nodoc
class __$ProJoinStateCopyWithImpl<$Res>
    implements _$ProJoinStateCopyWith<$Res> {
  __$ProJoinStateCopyWithImpl(this._self, this._then);

  final _ProJoinState _self;
  final $Res Function(_ProJoinState) _then;

/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? identity = freezed,Object? request = freezed,Object? editing = null,Object? submitState = null,Object? cancelState = null,Object? sessionState = null,Object? session = freezed,Object? codeError = freezed,Object? fieldErrors = null,Object? errorCode = freezed,}) {
  return _then(_ProJoinState(
identity: freezed == identity ? _self.identity : identity // ignore: cast_nullable_to_non_nullable
as IdentityModel?,request: freezed == request ? _self.request : request // ignore: cast_nullable_to_non_nullable
as JoinRequestModel?,editing: null == editing ? _self.editing : editing // ignore: cast_nullable_to_non_nullable
as bool,submitState: null == submitState ? _self.submitState : submitState // ignore: cast_nullable_to_non_nullable
as ViewState,cancelState: null == cancelState ? _self.cancelState : cancelState // ignore: cast_nullable_to_non_nullable
as ViewState,sessionState: null == sessionState ? _self.sessionState : sessionState // ignore: cast_nullable_to_non_nullable
as ViewState,session: freezed == session ? _self.session : session // ignore: cast_nullable_to_non_nullable
as StaffModel?,codeError: freezed == codeError ? _self.codeError : codeError // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$IdentityModelCopyWith<$Res>? get identity {
    if (_self.identity == null) {
    return null;
  }

  return $IdentityModelCopyWith<$Res>(_self.identity!, (value) {
    return _then(_self.copyWith(identity: value));
  });
}/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$JoinRequestModelCopyWith<$Res>? get request {
    if (_self.request == null) {
    return null;
  }

  return $JoinRequestModelCopyWith<$Res>(_self.request!, (value) {
    return _then(_self.copyWith(request: value));
  });
}/// Create a copy of ProJoinState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffModelCopyWith<$Res>? get session {
    if (_self.session == null) {
    return null;
  }

  return $StaffModelCopyWith<$Res>(_self.session!, (value) {
    return _then(_self.copyWith(session: value));
  });
}
}

// dart format on
