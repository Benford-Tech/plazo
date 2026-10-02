// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_today_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProTodayState {

 ViewState get viewState; PlanningModel? get planning; List<StaffSignalModel> get signals; StaffSignalModel? get banner; DateTime? get fetchedAt; DateTime get now; String? get errorMessage;
/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProTodayStateCopyWith<ProTodayState> get copyWith => _$ProTodayStateCopyWithImpl<ProTodayState>(this as ProTodayState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProTodayState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProTodayState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.planning, _this.planning) || other.planning == _this.planning)&&const DeepCollectionEquality().equals(other.signals, _this.signals)&&(identical(other.banner, _this.banner) || other.banner == _this.banner)&&(identical(other.fetchedAt, _this.fetchedAt) || other.fetchedAt == _this.fetchedAt)&&(identical(other.now, _this.now) || other.now == _this.now)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage));
}


@override
int get hashCode {
  final _this = this as ProTodayState;
  return Object.hash(runtimeType,_this.viewState,_this.planning,const DeepCollectionEquality().hash(_this.signals),_this.banner,_this.fetchedAt,_this.now,_this.errorMessage);
}

@override
String toString() {
  final _this = this as ProTodayState;
  return 'ProTodayState(viewState: ${_this.viewState}, planning: ${_this.planning}, signals: ${_this.signals}, banner: ${_this.banner}, fetchedAt: ${_this.fetchedAt}, now: ${_this.now}, errorMessage: ${_this.errorMessage})';
}


}

/// @nodoc
abstract mixin class $ProTodayStateCopyWith<$Res>  {
  factory $ProTodayStateCopyWith(ProTodayState value, $Res Function(ProTodayState) _then) = _$ProTodayStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, PlanningModel? planning, List<StaffSignalModel> signals, StaffSignalModel? banner, DateTime? fetchedAt, DateTime now, String? errorMessage
});


$PlanningModelCopyWith<$Res>? get planning;$StaffSignalModelCopyWith<$Res>? get banner;

}
/// @nodoc
class _$ProTodayStateCopyWithImpl<$Res>
    implements $ProTodayStateCopyWith<$Res> {
  _$ProTodayStateCopyWithImpl(this._self, this._then);

  final ProTodayState _self;
  final $Res Function(ProTodayState) _then;

/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? planning = freezed,Object? signals = null,Object? banner = freezed,Object? fetchedAt = freezed,Object? now = null,Object? errorMessage = freezed,}) {
  return _then(ProTodayState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,planning: freezed == planning ? _self.planning : planning // ignore: cast_nullable_to_non_nullable
as PlanningModel?,signals: null == signals ? _self.signals : signals // ignore: cast_nullable_to_non_nullable
as List<StaffSignalModel>,banner: freezed == banner ? _self.banner : banner // ignore: cast_nullable_to_non_nullable
as StaffSignalModel?,fetchedAt: freezed == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PlanningModelCopyWith<$Res>? get planning {
    if (_self.planning == null) {
    return null;
  }

  return $PlanningModelCopyWith<$Res>(_self.planning!, (value) {
    return _then(_self.copyWith(planning: value));
  });
}/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffSignalModelCopyWith<$Res>? get banner {
    if (_self.banner == null) {
    return null;
  }

  return $StaffSignalModelCopyWith<$Res>(_self.banner!, (value) {
    return _then(_self.copyWith(banner: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProTodayState].
extension ProTodayStatePatterns on ProTodayState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProTodayState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProTodayState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProTodayState value)  $default,){
final _that = this;
switch (_that) {
case _ProTodayState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProTodayState value)?  $default,){
final _that = this;
switch (_that) {
case _ProTodayState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  PlanningModel? planning,  List<StaffSignalModel> signals,  StaffSignalModel? banner,  DateTime? fetchedAt,  DateTime now,  String? errorMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProTodayState() when $default != null:
return $default(_that.viewState,_that.planning,_that.signals,_that.banner,_that.fetchedAt,_that.now,_that.errorMessage);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  PlanningModel? planning,  List<StaffSignalModel> signals,  StaffSignalModel? banner,  DateTime? fetchedAt,  DateTime now,  String? errorMessage)  $default,) {final _that = this;
switch (_that) {
case _ProTodayState():
return $default(_that.viewState,_that.planning,_that.signals,_that.banner,_that.fetchedAt,_that.now,_that.errorMessage);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  PlanningModel? planning,  List<StaffSignalModel> signals,  StaffSignalModel? banner,  DateTime? fetchedAt,  DateTime now,  String? errorMessage)?  $default,) {final _that = this;
switch (_that) {
case _ProTodayState() when $default != null:
return $default(_that.viewState,_that.planning,_that.signals,_that.banner,_that.fetchedAt,_that.now,_that.errorMessage);case _:
  return null;

}
}

}

/// @nodoc


class _ProTodayState extends ProTodayState {
  const _ProTodayState({this.viewState = ViewState.idle, this.planning,  List<StaffSignalModel> signals = const [], this.banner, this.fetchedAt, required this.now, this.errorMessage}): _signals = signals,super._();
  

@override@JsonKey() final  ViewState viewState;
@override final  PlanningModel? planning;
 final  List<StaffSignalModel> _signals;
@override@JsonKey() List<StaffSignalModel> get signals {
  if (_signals is EqualUnmodifiableListView) return _signals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_signals);
}

@override final  StaffSignalModel? banner;
@override final  DateTime? fetchedAt;
@override final  DateTime now;
@override final  String? errorMessage;

/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProTodayStateCopyWith<_ProTodayState> get copyWith => __$ProTodayStateCopyWithImpl<_ProTodayState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProTodayState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.planning, planning) || other.planning == planning)&&const DeepCollectionEquality().equals(other.signals, _signals)&&(identical(other.banner, banner) || other.banner == banner)&&(identical(other.fetchedAt, fetchedAt) || other.fetchedAt == fetchedAt)&&(identical(other.now, now) || other.now == now)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,planning,const DeepCollectionEquality().hash(_signals),banner,fetchedAt,now,errorMessage);
}

@override
String toString() {
    return 'ProTodayState(viewState: $viewState, planning: $planning, signals: $signals, banner: $banner, fetchedAt: $fetchedAt, now: $now, errorMessage: $errorMessage)';
}


}

/// @nodoc
abstract mixin class _$ProTodayStateCopyWith<$Res> implements $ProTodayStateCopyWith<$Res> {
  factory _$ProTodayStateCopyWith(_ProTodayState value, $Res Function(_ProTodayState) _then) = __$ProTodayStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, PlanningModel? planning, List<StaffSignalModel> signals, StaffSignalModel? banner, DateTime? fetchedAt, DateTime now, String? errorMessage
});


@override $PlanningModelCopyWith<$Res>? get planning;@override $StaffSignalModelCopyWith<$Res>? get banner;

}
/// @nodoc
class __$ProTodayStateCopyWithImpl<$Res>
    implements _$ProTodayStateCopyWith<$Res> {
  __$ProTodayStateCopyWithImpl(this._self, this._then);

  final _ProTodayState _self;
  final $Res Function(_ProTodayState) _then;

/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? planning = freezed,Object? signals = null,Object? banner = freezed,Object? fetchedAt = freezed,Object? now = null,Object? errorMessage = freezed,}) {
  return _then(_ProTodayState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,planning: freezed == planning ? _self.planning : planning // ignore: cast_nullable_to_non_nullable
as PlanningModel?,signals: null == signals ? _self._signals : signals // ignore: cast_nullable_to_non_nullable
as List<StaffSignalModel>,banner: freezed == banner ? _self.banner : banner // ignore: cast_nullable_to_non_nullable
as StaffSignalModel?,fetchedAt: freezed == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,now: null == now ? _self.now : now // ignore: cast_nullable_to_non_nullable
as DateTime,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PlanningModelCopyWith<$Res>? get planning {
    if (_self.planning == null) {
    return null;
  }

  return $PlanningModelCopyWith<$Res>(_self.planning!, (value) {
    return _then(_self.copyWith(planning: value));
  });
}/// Create a copy of ProTodayState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffSignalModelCopyWith<$Res>? get banner {
    if (_self.banner == null) {
    return null;
  }

  return $StaffSignalModelCopyWith<$Res>(_self.banner!, (value) {
    return _then(_self.copyWith(banner: value));
  });
}
}

// dart format on
