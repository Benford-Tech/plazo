// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_dashboard_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProDashboardState {

 ViewState get viewState; DashboardModel? get data; String? get errorMessage; DateTime get now;
/// Create a copy of ProDashboardState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProDashboardStateCopyWith<ProDashboardState> get copyWith => _$ProDashboardStateCopyWithImpl<ProDashboardState>(this as ProDashboardState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProDashboardState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProDashboardState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.now, _this.now) || other.now == _this.now));
}


@override
int get hashCode {
  final _this = this as ProDashboardState;
  return Object.hash(runtimeType,_this.viewState,_this.data,_this.errorMessage,_this.now);
}

@override
String toString() {
  final _this = this as ProDashboardState;
  return 'ProDashboardState(viewState: ${_this.viewState}, data: ${_this.data}, errorMessage: ${_this.errorMessage}, now: ${_this.now})';
}


}

/// @nodoc
abstract mixin class $ProDashboardStateCopyWith<$Res>  {
  factory $ProDashboardStateCopyWith(ProDashboardState value, $Res Function(ProDashboardState) _then) = _$ProDashboardStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, DashboardModel? data, String? errorMessage, DateTime now
});


$DashboardModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$ProDashboardStateCopyWithImpl<$Res>
    implements $ProDashboardStateCopyWith<$Res> {
  _$ProDashboardStateCopyWithImpl(this._self, this._then);

  final ProDashboardState _self;
  final $Res Function(ProDashboardState) _then;

/// Create a copy of ProDashboardState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? data = freezed,Object? errorMessage = freezed,Object? now = null,}) {
  return _then(ProDashboardState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as DashboardModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of ProDashboardState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $DashboardModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProDashboardState].
extension ProDashboardStatePatterns on ProDashboardState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProDashboardState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProDashboardState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProDashboardState value)  $default,){
final _that = this;
switch (_that) {
case _ProDashboardState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProDashboardState value)?  $default,){
final _that = this;
switch (_that) {
case _ProDashboardState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  DashboardModel? data,  String? errorMessage,  DateTime now)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProDashboardState() when $default != null:
return $default(_that.viewState,_that.data,_that.errorMessage,_that.now);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  DashboardModel? data,  String? errorMessage,  DateTime now)  $default,) {final _that = this;
switch (_that) {
case _ProDashboardState():
return $default(_that.viewState,_that.data,_that.errorMessage,_that.now);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  DashboardModel? data,  String? errorMessage,  DateTime now)?  $default,) {final _that = this;
switch (_that) {
case _ProDashboardState() when $default != null:
return $default(_that.viewState,_that.data,_that.errorMessage,_that.now);case _:
  return null;

}
}

}

/// @nodoc


class _ProDashboardState implements ProDashboardState {
  const _ProDashboardState({this.viewState = ViewState.idle, this.data, this.errorMessage, required this.now});
  

@override@JsonKey() final  ViewState viewState;
@override final  DashboardModel? data;
@override final  String? errorMessage;
@override final  DateTime now;

/// Create a copy of ProDashboardState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProDashboardStateCopyWith<_ProDashboardState> get copyWith => __$ProDashboardStateCopyWithImpl<_ProDashboardState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProDashboardState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.data, data) || other.data == data)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.now, now) || other.now == now));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,data,errorMessage,now);
}

@override
String toString() {
    return 'ProDashboardState(viewState: $viewState, data: $data, errorMessage: $errorMessage, now: $now)';
}


}

/// @nodoc
abstract mixin class _$ProDashboardStateCopyWith<$Res> implements $ProDashboardStateCopyWith<$Res> {
  factory _$ProDashboardStateCopyWith(_ProDashboardState value, $Res Function(_ProDashboardState) _then) = __$ProDashboardStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, DashboardModel? data, String? errorMessage, DateTime now
});


@override $DashboardModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$ProDashboardStateCopyWithImpl<$Res>
    implements _$ProDashboardStateCopyWith<$Res> {
  __$ProDashboardStateCopyWithImpl(this._self, this._then);

  final _ProDashboardState _self;
  final $Res Function(_ProDashboardState) _then;

/// Create a copy of ProDashboardState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? data = freezed,Object? errorMessage = freezed,Object? now = null,}) {
  return _then(_ProDashboardState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as DashboardModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of ProDashboardState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $DashboardModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
