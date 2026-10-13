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

 ProAuthStatus get status; ViewState get viewState; StaffModel? get staff;/// Saving the post of the day.
 ViewState get postState;/// Saving the vehicle of the day (V-A).
 ViewState get vehicleState;/// Saving one's own first and last name (« Votre nom », 09/10/2026), and the API's codes per field.
 ViewState get nameState; Map<String, String> get nameErrors; String? get errorCode; String? get errorMessage;/// The Apple / Google identity and its latest join request, while [status] is onboarding.
 OnboardingModel? get onboarding;/// The sign-ins this phone offers (its build and the API's keys): « Continuer avec Apple / Google », the links
/// of Mon compte, the confirmations of « Supprimer mon compte ».
 ProvidersModel get providers;/// What this phone and build offer, known at start without the API: « Supprimer mon compte » confirms with Apple
/// or Google even while [providers] has not been read (a restored session never shows the login page).
 ProvidersModel get deviceProviders;/// « Continuer avec … » running, and with which provider (apple, google).
 ViewState get signInState; String? get signingInWith;/// Mon compte (13/10/2026): linking / unlinking Apple or Google, « Quitter ce parking », « Supprimer mon compte »
/// (also from the waiting screen of « Rejoindre un parking »).
 ViewState get linkState; ViewState get leaveState; ViewState get deleteState;/// What Mon compte last did: "account.linked", "account.unlinked".
 String? get accountNotice;
/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProAuthStateCopyWith<ProAuthState> get copyWith => _$ProAuthStateCopyWithImpl<ProAuthState>(this as ProAuthState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProAuthState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProAuthState&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.staff, _this.staff) || other.staff == _this.staff)&&(identical(other.postState, _this.postState) || other.postState == _this.postState)&&(identical(other.vehicleState, _this.vehicleState) || other.vehicleState == _this.vehicleState)&&(identical(other.nameState, _this.nameState) || other.nameState == _this.nameState)&&const DeepCollectionEquality().equals(other.nameErrors, _this.nameErrors)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.onboarding, _this.onboarding) || other.onboarding == _this.onboarding)&&(identical(other.providers, _this.providers) || other.providers == _this.providers)&&(identical(other.deviceProviders, _this.deviceProviders) || other.deviceProviders == _this.deviceProviders)&&(identical(other.signInState, _this.signInState) || other.signInState == _this.signInState)&&(identical(other.signingInWith, _this.signingInWith) || other.signingInWith == _this.signingInWith)&&(identical(other.linkState, _this.linkState) || other.linkState == _this.linkState)&&(identical(other.leaveState, _this.leaveState) || other.leaveState == _this.leaveState)&&(identical(other.deleteState, _this.deleteState) || other.deleteState == _this.deleteState)&&(identical(other.accountNotice, _this.accountNotice) || other.accountNotice == _this.accountNotice));
}


@override
int get hashCode {
  final _this = this as ProAuthState;
  return Object.hash(runtimeType,_this.status,_this.viewState,_this.staff,_this.postState,_this.vehicleState,_this.nameState,const DeepCollectionEquality().hash(_this.nameErrors),_this.errorCode,_this.errorMessage,_this.onboarding,_this.providers,_this.deviceProviders,_this.signInState,_this.signingInWith,_this.linkState,_this.leaveState,_this.deleteState,_this.accountNotice);
}

@override
String toString() {
  final _this = this as ProAuthState;
  return 'ProAuthState(status: ${_this.status}, viewState: ${_this.viewState}, staff: ${_this.staff}, postState: ${_this.postState}, vehicleState: ${_this.vehicleState}, nameState: ${_this.nameState}, nameErrors: ${_this.nameErrors}, errorCode: ${_this.errorCode}, errorMessage: ${_this.errorMessage}, onboarding: ${_this.onboarding}, providers: ${_this.providers}, deviceProviders: ${_this.deviceProviders}, signInState: ${_this.signInState}, signingInWith: ${_this.signingInWith}, linkState: ${_this.linkState}, leaveState: ${_this.leaveState}, deleteState: ${_this.deleteState}, accountNotice: ${_this.accountNotice})';
}


}

/// @nodoc
abstract mixin class $ProAuthStateCopyWith<$Res>  {
  factory $ProAuthStateCopyWith(ProAuthState value, $Res Function(ProAuthState) _then) = _$ProAuthStateCopyWithImpl;
@useResult
$Res call({
 ProAuthStatus status, ViewState viewState, StaffModel? staff, ViewState postState, ViewState vehicleState, ViewState nameState, Map<String, String> nameErrors, String? errorCode, String? errorMessage, OnboardingModel? onboarding, ProvidersModel providers, ProvidersModel deviceProviders, ViewState signInState, String? signingInWith, ViewState linkState, ViewState leaveState, ViewState deleteState, String? accountNotice
});


$StaffModelCopyWith<$Res>? get staff;$OnboardingModelCopyWith<$Res>? get onboarding;$ProvidersModelCopyWith<$Res> get providers;$ProvidersModelCopyWith<$Res> get deviceProviders;

}
/// @nodoc
class _$ProAuthStateCopyWithImpl<$Res>
    implements $ProAuthStateCopyWith<$Res> {
  _$ProAuthStateCopyWithImpl(this._self, this._then);

  final ProAuthState _self;
  final $Res Function(ProAuthState) _then;

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = null,Object? viewState = null,Object? staff = freezed,Object? postState = null,Object? vehicleState = null,Object? nameState = null,Object? nameErrors = null,Object? errorCode = freezed,Object? errorMessage = freezed,Object? onboarding = freezed,Object? providers = null,Object? deviceProviders = null,Object? signInState = null,Object? signingInWith = freezed,Object? linkState = null,Object? leaveState = null,Object? deleteState = null,Object? accountNotice = freezed,}) {
  return _then(ProAuthState(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ProAuthStatus,viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,staff: freezed == staff ? _self.staff : staff // ignore: cast_nullable_to_non_nullable
as StaffModel?,postState: null == postState ? _self.postState : postState // ignore: cast_nullable_to_non_nullable
as ViewState,vehicleState: null == vehicleState ? _self.vehicleState : vehicleState // ignore: cast_nullable_to_non_nullable
as ViewState,nameState: null == nameState ? _self.nameState : nameState // ignore: cast_nullable_to_non_nullable
as ViewState,nameErrors: null == nameErrors ? _self.nameErrors : nameErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,onboarding: freezed == onboarding ? _self.onboarding : onboarding // ignore: cast_nullable_to_non_nullable
as OnboardingModel?,providers: null == providers ? _self.providers : providers // ignore: cast_nullable_to_non_nullable
as ProvidersModel,deviceProviders: null == deviceProviders ? _self.deviceProviders : deviceProviders // ignore: cast_nullable_to_non_nullable
as ProvidersModel,signInState: null == signInState ? _self.signInState : signInState // ignore: cast_nullable_to_non_nullable
as ViewState,signingInWith: freezed == signingInWith ? _self.signingInWith : signingInWith // ignore: cast_nullable_to_non_nullable
as String?,linkState: null == linkState ? _self.linkState : linkState // ignore: cast_nullable_to_non_nullable
as ViewState,leaveState: null == leaveState ? _self.leaveState : leaveState // ignore: cast_nullable_to_non_nullable
as ViewState,deleteState: null == deleteState ? _self.deleteState : deleteState // ignore: cast_nullable_to_non_nullable
as ViewState,accountNotice: freezed == accountNotice ? _self.accountNotice : accountNotice // ignore: cast_nullable_to_non_nullable
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
}/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OnboardingModelCopyWith<$Res>? get onboarding {
    if (_self.onboarding == null) {
    return null;
  }

  return $OnboardingModelCopyWith<$Res>(_self.onboarding!, (value) {
    return _then(_self.copyWith(onboarding: value));
  });
}/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProvidersModelCopyWith<$Res> get providers {
  
  return $ProvidersModelCopyWith<$Res>(_self.providers, (value) {
    return _then(_self.copyWith(providers: value));
  });
}/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProvidersModelCopyWith<$Res> get deviceProviders {
  
  return $ProvidersModelCopyWith<$Res>(_self.deviceProviders, (value) {
    return _then(_self.copyWith(deviceProviders: value));
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ProAuthStatus status,  ViewState viewState,  StaffModel? staff,  ViewState postState,  ViewState vehicleState,  ViewState nameState,  Map<String, String> nameErrors,  String? errorCode,  String? errorMessage,  OnboardingModel? onboarding,  ProvidersModel providers,  ProvidersModel deviceProviders,  ViewState signInState,  String? signingInWith,  ViewState linkState,  ViewState leaveState,  ViewState deleteState,  String? accountNotice)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProAuthState() when $default != null:
return $default(_that.status,_that.viewState,_that.staff,_that.postState,_that.vehicleState,_that.nameState,_that.nameErrors,_that.errorCode,_that.errorMessage,_that.onboarding,_that.providers,_that.deviceProviders,_that.signInState,_that.signingInWith,_that.linkState,_that.leaveState,_that.deleteState,_that.accountNotice);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ProAuthStatus status,  ViewState viewState,  StaffModel? staff,  ViewState postState,  ViewState vehicleState,  ViewState nameState,  Map<String, String> nameErrors,  String? errorCode,  String? errorMessage,  OnboardingModel? onboarding,  ProvidersModel providers,  ProvidersModel deviceProviders,  ViewState signInState,  String? signingInWith,  ViewState linkState,  ViewState leaveState,  ViewState deleteState,  String? accountNotice)  $default,) {final _that = this;
switch (_that) {
case _ProAuthState():
return $default(_that.status,_that.viewState,_that.staff,_that.postState,_that.vehicleState,_that.nameState,_that.nameErrors,_that.errorCode,_that.errorMessage,_that.onboarding,_that.providers,_that.deviceProviders,_that.signInState,_that.signingInWith,_that.linkState,_that.leaveState,_that.deleteState,_that.accountNotice);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ProAuthStatus status,  ViewState viewState,  StaffModel? staff,  ViewState postState,  ViewState vehicleState,  ViewState nameState,  Map<String, String> nameErrors,  String? errorCode,  String? errorMessage,  OnboardingModel? onboarding,  ProvidersModel providers,  ProvidersModel deviceProviders,  ViewState signInState,  String? signingInWith,  ViewState linkState,  ViewState leaveState,  ViewState deleteState,  String? accountNotice)?  $default,) {final _that = this;
switch (_that) {
case _ProAuthState() when $default != null:
return $default(_that.status,_that.viewState,_that.staff,_that.postState,_that.vehicleState,_that.nameState,_that.nameErrors,_that.errorCode,_that.errorMessage,_that.onboarding,_that.providers,_that.deviceProviders,_that.signInState,_that.signingInWith,_that.linkState,_that.leaveState,_that.deleteState,_that.accountNotice);case _:
  return null;

}
}

}

/// @nodoc


class _ProAuthState implements ProAuthState {
  const _ProAuthState({this.status = ProAuthStatus.unknown, this.viewState = ViewState.idle, this.staff, this.postState = ViewState.idle, this.vehicleState = ViewState.idle, this.nameState = ViewState.idle,  Map<String, String> nameErrors = const <String, String>{}, this.errorCode, this.errorMessage, this.onboarding, this.providers = const ProvidersModel(), this.deviceProviders = const ProvidersModel(), this.signInState = ViewState.idle, this.signingInWith, this.linkState = ViewState.idle, this.leaveState = ViewState.idle, this.deleteState = ViewState.idle, this.accountNotice}): _nameErrors = nameErrors;
  

@override@JsonKey() final  ProAuthStatus status;
@override@JsonKey() final  ViewState viewState;
@override final  StaffModel? staff;
/// Saving the post of the day.
@override@JsonKey() final  ViewState postState;
/// Saving the vehicle of the day (V-A).
@override@JsonKey() final  ViewState vehicleState;
/// Saving one's own first and last name (« Votre nom », 09/10/2026), and the API's codes per field.
@override@JsonKey() final  ViewState nameState;
 final  Map<String, String> _nameErrors;
@override@JsonKey() Map<String, String> get nameErrors {
  if (_nameErrors is EqualUnmodifiableMapView) return _nameErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_nameErrors);
}

@override final  String? errorCode;
@override final  String? errorMessage;
/// The Apple / Google identity and its latest join request, while [status] is onboarding.
@override final  OnboardingModel? onboarding;
/// The sign-ins this phone offers (its build and the API's keys): « Continuer avec Apple / Google », the links
/// of Mon compte, the confirmations of « Supprimer mon compte ».
@override@JsonKey() final  ProvidersModel providers;
/// What this phone and build offer, known at start without the API: « Supprimer mon compte » confirms with Apple
/// or Google even while [providers] has not been read (a restored session never shows the login page).
@override@JsonKey() final  ProvidersModel deviceProviders;
/// « Continuer avec … » running, and with which provider (apple, google).
@override@JsonKey() final  ViewState signInState;
@override final  String? signingInWith;
/// Mon compte (13/10/2026): linking / unlinking Apple or Google, « Quitter ce parking », « Supprimer mon compte »
/// (also from the waiting screen of « Rejoindre un parking »).
@override@JsonKey() final  ViewState linkState;
@override@JsonKey() final  ViewState leaveState;
@override@JsonKey() final  ViewState deleteState;
/// What Mon compte last did: "account.linked", "account.unlinked".
@override final  String? accountNotice;

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProAuthStateCopyWith<_ProAuthState> get copyWith => __$ProAuthStateCopyWithImpl<_ProAuthState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProAuthState&&(identical(other.status, status) || other.status == status)&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.staff, staff) || other.staff == staff)&&(identical(other.postState, postState) || other.postState == postState)&&(identical(other.vehicleState, vehicleState) || other.vehicleState == vehicleState)&&(identical(other.nameState, nameState) || other.nameState == nameState)&&const DeepCollectionEquality().equals(other.nameErrors, _nameErrors)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.onboarding, onboarding) || other.onboarding == onboarding)&&(identical(other.providers, providers) || other.providers == providers)&&(identical(other.deviceProviders, deviceProviders) || other.deviceProviders == deviceProviders)&&(identical(other.signInState, signInState) || other.signInState == signInState)&&(identical(other.signingInWith, signingInWith) || other.signingInWith == signingInWith)&&(identical(other.linkState, linkState) || other.linkState == linkState)&&(identical(other.leaveState, leaveState) || other.leaveState == leaveState)&&(identical(other.deleteState, deleteState) || other.deleteState == deleteState)&&(identical(other.accountNotice, accountNotice) || other.accountNotice == accountNotice));
}


@override
int get hashCode {
    return Object.hash(runtimeType,status,viewState,staff,postState,vehicleState,nameState,const DeepCollectionEquality().hash(_nameErrors),errorCode,errorMessage,onboarding,providers,deviceProviders,signInState,signingInWith,linkState,leaveState,deleteState,accountNotice);
}

@override
String toString() {
    return 'ProAuthState(status: $status, viewState: $viewState, staff: $staff, postState: $postState, vehicleState: $vehicleState, nameState: $nameState, nameErrors: $nameErrors, errorCode: $errorCode, errorMessage: $errorMessage, onboarding: $onboarding, providers: $providers, deviceProviders: $deviceProviders, signInState: $signInState, signingInWith: $signingInWith, linkState: $linkState, leaveState: $leaveState, deleteState: $deleteState, accountNotice: $accountNotice)';
}


}

/// @nodoc
abstract mixin class _$ProAuthStateCopyWith<$Res> implements $ProAuthStateCopyWith<$Res> {
  factory _$ProAuthStateCopyWith(_ProAuthState value, $Res Function(_ProAuthState) _then) = __$ProAuthStateCopyWithImpl;
@override @useResult
$Res call({
 ProAuthStatus status, ViewState viewState, StaffModel? staff, ViewState postState, ViewState vehicleState, ViewState nameState, Map<String, String> nameErrors, String? errorCode, String? errorMessage, OnboardingModel? onboarding, ProvidersModel providers, ProvidersModel deviceProviders, ViewState signInState, String? signingInWith, ViewState linkState, ViewState leaveState, ViewState deleteState, String? accountNotice
});


@override $StaffModelCopyWith<$Res>? get staff;@override $OnboardingModelCopyWith<$Res>? get onboarding;@override $ProvidersModelCopyWith<$Res> get providers;@override $ProvidersModelCopyWith<$Res> get deviceProviders;

}
/// @nodoc
class __$ProAuthStateCopyWithImpl<$Res>
    implements _$ProAuthStateCopyWith<$Res> {
  __$ProAuthStateCopyWithImpl(this._self, this._then);

  final _ProAuthState _self;
  final $Res Function(_ProAuthState) _then;

/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = null,Object? viewState = null,Object? staff = freezed,Object? postState = null,Object? vehicleState = null,Object? nameState = null,Object? nameErrors = null,Object? errorCode = freezed,Object? errorMessage = freezed,Object? onboarding = freezed,Object? providers = null,Object? deviceProviders = null,Object? signInState = null,Object? signingInWith = freezed,Object? linkState = null,Object? leaveState = null,Object? deleteState = null,Object? accountNotice = freezed,}) {
  return _then(_ProAuthState(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as ProAuthStatus,viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,staff: freezed == staff ? _self.staff : staff // ignore: cast_nullable_to_non_nullable
as StaffModel?,postState: null == postState ? _self.postState : postState // ignore: cast_nullable_to_non_nullable
as ViewState,vehicleState: null == vehicleState ? _self.vehicleState : vehicleState // ignore: cast_nullable_to_non_nullable
as ViewState,nameState: null == nameState ? _self.nameState : nameState // ignore: cast_nullable_to_non_nullable
as ViewState,nameErrors: null == nameErrors ? _self._nameErrors : nameErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,onboarding: freezed == onboarding ? _self.onboarding : onboarding // ignore: cast_nullable_to_non_nullable
as OnboardingModel?,providers: null == providers ? _self.providers : providers // ignore: cast_nullable_to_non_nullable
as ProvidersModel,deviceProviders: null == deviceProviders ? _self.deviceProviders : deviceProviders // ignore: cast_nullable_to_non_nullable
as ProvidersModel,signInState: null == signInState ? _self.signInState : signInState // ignore: cast_nullable_to_non_nullable
as ViewState,signingInWith: freezed == signingInWith ? _self.signingInWith : signingInWith // ignore: cast_nullable_to_non_nullable
as String?,linkState: null == linkState ? _self.linkState : linkState // ignore: cast_nullable_to_non_nullable
as ViewState,leaveState: null == leaveState ? _self.leaveState : leaveState // ignore: cast_nullable_to_non_nullable
as ViewState,deleteState: null == deleteState ? _self.deleteState : deleteState // ignore: cast_nullable_to_non_nullable
as ViewState,accountNotice: freezed == accountNotice ? _self.accountNotice : accountNotice // ignore: cast_nullable_to_non_nullable
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
}/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OnboardingModelCopyWith<$Res>? get onboarding {
    if (_self.onboarding == null) {
    return null;
  }

  return $OnboardingModelCopyWith<$Res>(_self.onboarding!, (value) {
    return _then(_self.copyWith(onboarding: value));
  });
}/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProvidersModelCopyWith<$Res> get providers {
  
  return $ProvidersModelCopyWith<$Res>(_self.providers, (value) {
    return _then(_self.copyWith(providers: value));
  });
}/// Create a copy of ProAuthState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProvidersModelCopyWith<$Res> get deviceProviders {
  
  return $ProvidersModelCopyWith<$Res>(_self.deviceProviders, (value) {
    return _then(_self.copyWith(deviceProviders: value));
  });
}
}

// dart format on
