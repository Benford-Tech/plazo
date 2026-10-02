// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_notifications_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProNotificationsState {

 ViewState get viewState; ViewState get pushState; bool get pushSupported; NotificationPreferencesModel? get preferences; String? get errorMessage;
/// Create a copy of ProNotificationsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProNotificationsStateCopyWith<ProNotificationsState> get copyWith => _$ProNotificationsStateCopyWithImpl<ProNotificationsState>(this as ProNotificationsState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProNotificationsState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProNotificationsState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.pushState, _this.pushState) || other.pushState == _this.pushState)&&(identical(other.pushSupported, _this.pushSupported) || other.pushSupported == _this.pushSupported)&&(identical(other.preferences, _this.preferences) || other.preferences == _this.preferences)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage));
}


@override
int get hashCode {
  final _this = this as ProNotificationsState;
  return Object.hash(runtimeType,_this.viewState,_this.pushState,_this.pushSupported,_this.preferences,_this.errorMessage);
}

@override
String toString() {
  final _this = this as ProNotificationsState;
  return 'ProNotificationsState(viewState: ${_this.viewState}, pushState: ${_this.pushState}, pushSupported: ${_this.pushSupported}, preferences: ${_this.preferences}, errorMessage: ${_this.errorMessage})';
}


}

/// @nodoc
abstract mixin class $ProNotificationsStateCopyWith<$Res>  {
  factory $ProNotificationsStateCopyWith(ProNotificationsState value, $Res Function(ProNotificationsState) _then) = _$ProNotificationsStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState pushState, bool pushSupported, NotificationPreferencesModel? preferences, String? errorMessage
});


$NotificationPreferencesModelCopyWith<$Res>? get preferences;

}
/// @nodoc
class _$ProNotificationsStateCopyWithImpl<$Res>
    implements $ProNotificationsStateCopyWith<$Res> {
  _$ProNotificationsStateCopyWithImpl(this._self, this._then);

  final ProNotificationsState _self;
  final $Res Function(ProNotificationsState) _then;

/// Create a copy of ProNotificationsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? pushState = null,Object? pushSupported = null,Object? preferences = freezed,Object? errorMessage = freezed,}) {
  return _then(ProNotificationsState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,pushState: null == pushState ? _self.pushState : pushState // ignore: cast_nullable_to_non_nullable
as ViewState,pushSupported: null == pushSupported ? _self.pushSupported : pushSupported // ignore: cast_nullable_to_non_nullable
as bool,preferences: freezed == preferences ? _self.preferences : preferences // ignore: cast_nullable_to_non_nullable
as NotificationPreferencesModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProNotificationsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$NotificationPreferencesModelCopyWith<$Res>? get preferences {
    if (_self.preferences == null) {
    return null;
  }

  return $NotificationPreferencesModelCopyWith<$Res>(_self.preferences!, (value) {
    return _then(_self.copyWith(preferences: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProNotificationsState].
extension ProNotificationsStatePatterns on ProNotificationsState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProNotificationsState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProNotificationsState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProNotificationsState value)  $default,){
final _that = this;
switch (_that) {
case _ProNotificationsState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProNotificationsState value)?  $default,){
final _that = this;
switch (_that) {
case _ProNotificationsState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState pushState,  bool pushSupported,  NotificationPreferencesModel? preferences,  String? errorMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProNotificationsState() when $default != null:
return $default(_that.viewState,_that.pushState,_that.pushSupported,_that.preferences,_that.errorMessage);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState pushState,  bool pushSupported,  NotificationPreferencesModel? preferences,  String? errorMessage)  $default,) {final _that = this;
switch (_that) {
case _ProNotificationsState():
return $default(_that.viewState,_that.pushState,_that.pushSupported,_that.preferences,_that.errorMessage);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState pushState,  bool pushSupported,  NotificationPreferencesModel? preferences,  String? errorMessage)?  $default,) {final _that = this;
switch (_that) {
case _ProNotificationsState() when $default != null:
return $default(_that.viewState,_that.pushState,_that.pushSupported,_that.preferences,_that.errorMessage);case _:
  return null;

}
}

}

/// @nodoc


class _ProNotificationsState implements ProNotificationsState {
  const _ProNotificationsState({this.viewState = ViewState.idle, this.pushState = ViewState.idle, this.pushSupported = false, this.preferences, this.errorMessage});
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState pushState;
@override@JsonKey() final  bool pushSupported;
@override final  NotificationPreferencesModel? preferences;
@override final  String? errorMessage;

/// Create a copy of ProNotificationsState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProNotificationsStateCopyWith<_ProNotificationsState> get copyWith => __$ProNotificationsStateCopyWithImpl<_ProNotificationsState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProNotificationsState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.pushState, pushState) || other.pushState == pushState)&&(identical(other.pushSupported, pushSupported) || other.pushSupported == pushSupported)&&(identical(other.preferences, preferences) || other.preferences == preferences)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,pushState,pushSupported,preferences,errorMessage);
}

@override
String toString() {
    return 'ProNotificationsState(viewState: $viewState, pushState: $pushState, pushSupported: $pushSupported, preferences: $preferences, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class _$ProNotificationsStateCopyWith<$Res> implements $ProNotificationsStateCopyWith<$Res> {
  factory _$ProNotificationsStateCopyWith(_ProNotificationsState value, $Res Function(_ProNotificationsState) _then) = __$ProNotificationsStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState pushState, bool pushSupported, NotificationPreferencesModel? preferences, String? errorMessage
});


@override $NotificationPreferencesModelCopyWith<$Res>? get preferences;

}
/// @nodoc
class __$ProNotificationsStateCopyWithImpl<$Res>
    implements _$ProNotificationsStateCopyWith<$Res> {
  __$ProNotificationsStateCopyWithImpl(this._self, this._then);

  final _ProNotificationsState _self;
  final $Res Function(_ProNotificationsState) _then;

/// Create a copy of ProNotificationsState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? pushState = null,Object? pushSupported = null,Object? preferences = freezed,Object? errorMessage = freezed,}) {
  return _then(_ProNotificationsState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,pushState: null == pushState ? _self.pushState : pushState // ignore: cast_nullable_to_non_nullable
as ViewState,pushSupported: null == pushSupported ? _self.pushSupported : pushSupported // ignore: cast_nullable_to_non_nullable
as bool,preferences: freezed == preferences ? _self.preferences : preferences // ignore: cast_nullable_to_non_nullable
as NotificationPreferencesModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProNotificationsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$NotificationPreferencesModelCopyWith<$Res>? get preferences {
    if (_self.preferences == null) {
    return null;
  }

  return $NotificationPreferencesModelCopyWith<$Res>(_self.preferences!, (value) {
    return _then(_self.copyWith(preferences: value));
  });
}
}

// dart format on
