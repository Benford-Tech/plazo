// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_team_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProTeamState {

 ViewState get viewState; ViewState get actionState; List<TeamMemberModel> get members;/// "team.created", "team.updated", "team.password_reset".
 String? get notice; String? get errorCode; Map<String, String> get fieldErrors;
/// Create a copy of ProTeamState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProTeamStateCopyWith<ProTeamState> get copyWith => _$ProTeamStateCopyWithImpl<ProTeamState>(this as ProTeamState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProTeamState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProTeamState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&const DeepCollectionEquality().equals(other.members, _this.members)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors));
}


@override
int get hashCode {
  final _this = this as ProTeamState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,const DeepCollectionEquality().hash(_this.members),_this.notice,_this.errorCode,const DeepCollectionEquality().hash(_this.fieldErrors));
}

@override
String toString() {
  final _this = this as ProTeamState;
  return 'ProTeamState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, members: ${_this.members}, notice: ${_this.notice}, errorCode: ${_this.errorCode}, fieldErrors: ${_this.fieldErrors})';
}


}

/// @nodoc
abstract mixin class $ProTeamStateCopyWith<$Res>  {
  factory $ProTeamStateCopyWith(ProTeamState value, $Res Function(ProTeamState) _then) = _$ProTeamStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, List<TeamMemberModel> members, String? notice, String? errorCode, Map<String, String> fieldErrors
});




}
/// @nodoc
class _$ProTeamStateCopyWithImpl<$Res>
    implements $ProTeamStateCopyWith<$Res> {
  _$ProTeamStateCopyWithImpl(this._self, this._then);

  final ProTeamState _self;
  final $Res Function(ProTeamState) _then;

/// Create a copy of ProTeamState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? members = null,Object? notice = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(ProTeamState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,members: null == members ? _self.members : members // ignore: cast_nullable_to_non_nullable
as List<TeamMemberModel>,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ProTeamState].
extension ProTeamStatePatterns on ProTeamState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProTeamState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProTeamState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProTeamState value)  $default,){
final _that = this;
switch (_that) {
case _ProTeamState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProTeamState value)?  $default,){
final _that = this;
switch (_that) {
case _ProTeamState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  List<TeamMemberModel> members,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProTeamState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.members,_that.notice,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  List<TeamMemberModel> members,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)  $default,) {final _that = this;
switch (_that) {
case _ProTeamState():
return $default(_that.viewState,_that.actionState,_that.members,_that.notice,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  List<TeamMemberModel> members,  String? notice,  String? errorCode,  Map<String, String> fieldErrors)?  $default,) {final _that = this;
switch (_that) {
case _ProTeamState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.members,_that.notice,_that.errorCode,_that.fieldErrors);case _:
  return null;

}
}

}

/// @nodoc


class _ProTeamState implements ProTeamState {
  const _ProTeamState({this.viewState = ViewState.idle, this.actionState = ViewState.idle,  List<TeamMemberModel> members = const [], this.notice, this.errorCode,  Map<String, String> fieldErrors = const {}}): _members = members,_fieldErrors = fieldErrors;
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
 final  List<TeamMemberModel> _members;
@override@JsonKey() List<TeamMemberModel> get members {
  if (_members is EqualUnmodifiableListView) return _members;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_members);
}

/// "team.created", "team.updated", "team.password_reset".
@override final  String? notice;
@override final  String? errorCode;
 final  Map<String, String> _fieldErrors;
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}


/// Create a copy of ProTeamState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProTeamStateCopyWith<_ProTeamState> get copyWith => __$ProTeamStateCopyWithImpl<_ProTeamState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProTeamState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&const DeepCollectionEquality().equals(other.members, _members)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,const DeepCollectionEquality().hash(_members),notice,errorCode,const DeepCollectionEquality().hash(_fieldErrors));
}

@override
String toString() {
    return 'ProTeamState(viewState: $viewState, actionState: $actionState, members: $members, notice: $notice, errorCode: $errorCode, fieldErrors: $fieldErrors)';
}


}

/// @nodoc
abstract mixin class _$ProTeamStateCopyWith<$Res> implements $ProTeamStateCopyWith<$Res> {
  factory _$ProTeamStateCopyWith(_ProTeamState value, $Res Function(_ProTeamState) _then) = __$ProTeamStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, List<TeamMemberModel> members, String? notice, String? errorCode, Map<String, String> fieldErrors
});




}
/// @nodoc
class __$ProTeamStateCopyWithImpl<$Res>
    implements _$ProTeamStateCopyWith<$Res> {
  __$ProTeamStateCopyWithImpl(this._self, this._then);

  final _ProTeamState _self;
  final $Res Function(_ProTeamState) _then;

/// Create a copy of ProTeamState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? members = null,Object? notice = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(_ProTeamState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,members: null == members ? _self._members : members // ignore: cast_nullable_to_non_nullable
as List<TeamMemberModel>,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}


}

// dart format on
