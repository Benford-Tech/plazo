// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'staff_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$StaffModel {

 String get id; String get name; String get email;/// manager, agent, driver, valet
 String get role; String? get operatorName;
/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StaffModelCopyWith<StaffModel> get copyWith => _$StaffModelCopyWithImpl<StaffModel>(this as StaffModel, _$identity);

  /// Serializes this StaffModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as StaffModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.email, _this.email) || other.email == _this.email)&&(identical(other.role, _this.role) || other.role == _this.role)&&(identical(other.operatorName, _this.operatorName) || other.operatorName == _this.operatorName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StaffModel;
  return Object.hash(runtimeType,_this.id,_this.name,_this.email,_this.role,_this.operatorName);
}

@override
String toString() {
  final _this = this as StaffModel;
  return 'StaffModel(id: ${_this.id}, name: ${_this.name}, email: ${_this.email}, role: ${_this.role}, operatorName: ${_this.operatorName})';
}


}

/// @nodoc
abstract mixin class $StaffModelCopyWith<$Res>  {
  factory $StaffModelCopyWith(StaffModel value, $Res Function(StaffModel) _then) = _$StaffModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, String email, String role, String? operatorName
});




}
/// @nodoc
class _$StaffModelCopyWithImpl<$Res>
    implements $StaffModelCopyWith<$Res> {
  _$StaffModelCopyWithImpl(this._self, this._then);

  final StaffModel _self;
  final $Res Function(StaffModel) _then;

/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? email = null,Object? role = null,Object? operatorName = freezed,}) {
  return _then(StaffModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,operatorName: freezed == operatorName ? _self.operatorName : operatorName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [StaffModel].
extension StaffModelPatterns on StaffModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StaffModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StaffModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StaffModel value)  $default,){
final _that = this;
switch (_that) {
case _StaffModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StaffModel value)?  $default,){
final _that = this;
switch (_that) {
case _StaffModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String email,  String role,  String? operatorName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffModel() when $default != null:
return $default(_that.id,_that.name,_that.email,_that.role,_that.operatorName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String email,  String role,  String? operatorName)  $default,) {final _that = this;
switch (_that) {
case _StaffModel():
return $default(_that.id,_that.name,_that.email,_that.role,_that.operatorName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String email,  String role,  String? operatorName)?  $default,) {final _that = this;
switch (_that) {
case _StaffModel() when $default != null:
return $default(_that.id,_that.name,_that.email,_that.role,_that.operatorName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StaffModel implements StaffModel {
  const _StaffModel({required this.id, required this.name, required this.email, required this.role, this.operatorName});
  factory _StaffModel.fromJson(Map<String, dynamic> json) => _$StaffModelFromJson(json);

@override final  String id;
@override final  String name;
@override final  String email;
/// manager, agent, driver, valet
@override final  String role;
@override final  String? operatorName;

/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StaffModelCopyWith<_StaffModel> get copyWith => __$StaffModelCopyWithImpl<_StaffModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StaffModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.email, email) || other.email == email)&&(identical(other.role, role) || other.role == role)&&(identical(other.operatorName, operatorName) || other.operatorName == operatorName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name,email,role,operatorName);
}

@override
String toString() {
    return 'StaffModel(id: $id, name: $name, email: $email, role: $role, operatorName: $operatorName)';
}


}

/// @nodoc
abstract mixin class _$StaffModelCopyWith<$Res> implements $StaffModelCopyWith<$Res> {
  factory _$StaffModelCopyWith(_StaffModel value, $Res Function(_StaffModel) _then) = __$StaffModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String email, String role, String? operatorName
});




}
/// @nodoc
class __$StaffModelCopyWithImpl<$Res>
    implements _$StaffModelCopyWith<$Res> {
  __$StaffModelCopyWithImpl(this._self, this._then);

  final _StaffModel _self;
  final $Res Function(_StaffModel) _then;

/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? email = null,Object? role = null,Object? operatorName = freezed,}) {
  return _then(_StaffModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,operatorName: freezed == operatorName ? _self.operatorName : operatorName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
