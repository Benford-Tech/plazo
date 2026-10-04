// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_vehicles_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProVehiclesState {

 ViewState get viewState; ViewState get actionState; List<ShuttleVehicleModel> get vehicles;/// The team, to pick a usual driver (active members only).
 List<TeamMemberModel> get team;/// "vehicles.added", "vehicles.updated", "vehicles.removed".
 String? get notice; String? get errorCode; Map<String, String> get fieldErrors;
/// Create a copy of ProVehiclesState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProVehiclesStateCopyWith<ProVehiclesState> get copyWith => _$ProVehiclesStateCopyWithImpl<ProVehiclesState>(this as ProVehiclesState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProVehiclesState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProVehiclesState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&const DeepCollectionEquality().equals(other.vehicles, _this.vehicles)&&const DeepCollectionEquality().equals(other.team, _this.team)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors));
}


@override
int get hashCode {
  final _this = this as ProVehiclesState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,const DeepCollectionEquality().hash(_this.vehicles),const DeepCollectionEquality().hash(_this.team),_this.notice,_this.errorCode,const DeepCollectionEquality().hash(_this.fieldErrors));
}

@override
String toString() {
  final _this = this as ProVehiclesState;
  return 'ProVehiclesState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, vehicles: ${_this.vehicles}, team: ${_this.team}, notice: ${_this.notice}, errorCode: ${_this.errorCode}, fieldErrors: ${_this.fieldErrors})';
}


}

/// @nodoc
abstract mixin class $ProVehiclesStateCopyWith<$Res>  {
  factory $ProVehiclesStateCopyWith(ProVehiclesState value, $Res Function(ProVehiclesState) _then) = _$ProVehiclesStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, List<ShuttleVehicleModel> vehicles, List<TeamMemberModel> team, String? notice, String? errorCode, Map<String, String> fieldErrors
});




}
/// @nodoc
class _$ProVehiclesStateCopyWithImpl<$Res>
    implements $ProVehiclesStateCopyWith<$Res> {
  _$ProVehiclesStateCopyWithImpl(this._self, this._then);

  final ProVehiclesState _self;
  final $Res Function(ProVehiclesState) _then;

/// Create a copy of ProVehiclesState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? vehicles = null,Object? team = null,Object? notice = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(ProVehiclesState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,vehicles: null == vehicles ? _self.vehicles : vehicles // ignore: cast_nullable_to_non_nullable
as List<ShuttleVehicleModel>,team: null == team ? _self.team : team // ignore: cast_nullable_to_non_nullable
as List<TeamMemberModel>,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ProVehiclesState].
extension ProVehiclesStatePatterns on ProVehiclesState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProVehiclesState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProVehiclesState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProVehiclesState value)  $default,){
final _that = this;
switch (_that) {
case _ProVehiclesState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProVehiclesState value)?  $default,){
final _that = this;
switch (_that) {
case _ProVehiclesState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  List<ShuttleVehicleModel> vehicles,  List<TeamMemberModel> team,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProVehiclesState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.vehicles,_that.team,_that.notice,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  List<ShuttleVehicleModel> vehicles,  List<TeamMemberModel> team,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)  $default,) {final _that = this;
switch (_that) {
case _ProVehiclesState():
return $default(_that.viewState,_that.actionState,_that.vehicles,_that.team,_that.notice,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  List<ShuttleVehicleModel> vehicles,  List<TeamMemberModel> team,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)?  $default,) {final _that = this;
switch (_that) {
case _ProVehiclesState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.vehicles,_that.team,_that.notice,_that.errorCode,_that.fieldErrors);case _:
  return null;

}
}

}

/// @nodoc


class _ProVehiclesState implements ProVehiclesState {
  const _ProVehiclesState({this.viewState = ViewState.idle, this.actionState = ViewState.idle,  List<ShuttleVehicleModel> vehicles = const [],  List<TeamMemberModel> team = const [], this.notice, this.errorCode,  Map<String, String> fieldErrors = const {}}): _vehicles = vehicles,_team = team,_fieldErrors = fieldErrors;
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
 final  List<ShuttleVehicleModel> _vehicles;
@override@JsonKey() List<ShuttleVehicleModel> get vehicles {
  if (_vehicles is EqualUnmodifiableListView) return _vehicles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_vehicles);
}

/// The team, to pick a usual driver (active members only).
 final  List<TeamMemberModel> _team;
/// The team, to pick a usual driver (active members only).
@override@JsonKey() List<TeamMemberModel> get team {
  if (_team is EqualUnmodifiableListView) return _team;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_team);
}

/// "vehicles.added", "vehicles.updated", "vehicles.removed".
@override final  String? notice;
@override final  String? errorCode;
 final  Map<String, String> _fieldErrors;
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}


/// Create a copy of ProVehiclesState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProVehiclesStateCopyWith<_ProVehiclesState> get copyWith => __$ProVehiclesStateCopyWithImpl<_ProVehiclesState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProVehiclesState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&const DeepCollectionEquality().equals(other.vehicles, _vehicles)&&const DeepCollectionEquality().equals(other.team, _team)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,const DeepCollectionEquality().hash(_vehicles),const DeepCollectionEquality().hash(_team),notice,errorCode,const DeepCollectionEquality().hash(_fieldErrors));
}

@override
String toString() {
    return 'ProVehiclesState(viewState: $viewState, actionState: $actionState, vehicles: $vehicles, team: $team, notice: $notice, errorCode: $errorCode, fieldErrors: $fieldErrors)';
}


}

/// @nodoc
abstract mixin class _$ProVehiclesStateCopyWith<$Res> implements $ProVehiclesStateCopyWith<$Res> {
  factory _$ProVehiclesStateCopyWith(_ProVehiclesState value, $Res Function(_ProVehiclesState) _then) = __$ProVehiclesStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, List<ShuttleVehicleModel> vehicles, List<TeamMemberModel> team, String? notice, String? errorCode, Map<String, String> fieldErrors
});




}
/// @nodoc
class __$ProVehiclesStateCopyWithImpl<$Res>
    implements _$ProVehiclesStateCopyWith<$Res> {
  __$ProVehiclesStateCopyWithImpl(this._self, this._then);

  final _ProVehiclesState _self;
  final $Res Function(_ProVehiclesState) _then;

/// Create a copy of ProVehiclesState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? vehicles = null,Object? team = null,Object? notice = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(_ProVehiclesState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,vehicles: null == vehicles ? _self._vehicles : vehicles // ignore: cast_nullable_to_non_nullable
as List<ShuttleVehicleModel>,team: null == team ? _self._team : team // ignore: cast_nullable_to_non_nullable
as List<TeamMemberModel>,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}


}

// dart format on
