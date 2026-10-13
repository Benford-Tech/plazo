// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'onboarding_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ProvidersModel {

 bool get apple; bool get google;
/// Create a copy of ProvidersModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProvidersModelCopyWith<ProvidersModel> get copyWith => _$ProvidersModelCopyWithImpl<ProvidersModel>(this as ProvidersModel, _$identity);

  /// Serializes this ProvidersModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ProvidersModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProvidersModel&&(identical(other.apple, _this.apple) || other.apple == _this.apple)&&(identical(other.google, _this.google) || other.google == _this.google));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ProvidersModel;
  return Object.hash(runtimeType,_this.apple,_this.google);
}

@override
String toString() {
  final _this = this as ProvidersModel;
  return 'ProvidersModel(apple: ${_this.apple}, google: ${_this.google})';
}


}

/// @nodoc
abstract mixin class $ProvidersModelCopyWith<$Res>  {
  factory $ProvidersModelCopyWith(ProvidersModel value, $Res Function(ProvidersModel) _then) = _$ProvidersModelCopyWithImpl;
@useResult
$Res call({
 bool apple, bool google
});




}
/// @nodoc
class _$ProvidersModelCopyWithImpl<$Res>
    implements $ProvidersModelCopyWith<$Res> {
  _$ProvidersModelCopyWithImpl(this._self, this._then);

  final ProvidersModel _self;
  final $Res Function(ProvidersModel) _then;

/// Create a copy of ProvidersModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? apple = null,Object? google = null,}) {
  return _then(ProvidersModel(
apple: null == apple ? _self.apple : apple // ignore: cast_nullable_to_non_nullable
as bool,google: null == google ? _self.google : google // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ProvidersModel].
extension ProvidersModelPatterns on ProvidersModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProvidersModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProvidersModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProvidersModel value)  $default,){
final _that = this;
switch (_that) {
case _ProvidersModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProvidersModel value)?  $default,){
final _that = this;
switch (_that) {
case _ProvidersModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool apple,  bool google)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProvidersModel() when $default != null:
return $default(_that.apple,_that.google);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool apple,  bool google)  $default,) {final _that = this;
switch (_that) {
case _ProvidersModel():
return $default(_that.apple,_that.google);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool apple,  bool google)?  $default,) {final _that = this;
switch (_that) {
case _ProvidersModel() when $default != null:
return $default(_that.apple,_that.google);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProvidersModel implements ProvidersModel {
  const _ProvidersModel({this.apple = false, this.google = false});
  factory _ProvidersModel.fromJson(Map<String, dynamic> json) => _$ProvidersModelFromJson(json);

@override@JsonKey() final  bool apple;
@override@JsonKey() final  bool google;

/// Create a copy of ProvidersModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProvidersModelCopyWith<_ProvidersModel> get copyWith => __$ProvidersModelCopyWithImpl<_ProvidersModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProvidersModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProvidersModel&&(identical(other.apple, apple) || other.apple == apple)&&(identical(other.google, google) || other.google == google));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,apple,google);
}

@override
String toString() {
    return 'ProvidersModel(apple: $apple, google: $google)';
}


}

/// @nodoc
abstract mixin class _$ProvidersModelCopyWith<$Res> implements $ProvidersModelCopyWith<$Res> {
  factory _$ProvidersModelCopyWith(_ProvidersModel value, $Res Function(_ProvidersModel) _then) = __$ProvidersModelCopyWithImpl;
@override @useResult
$Res call({
 bool apple, bool google
});




}
/// @nodoc
class __$ProvidersModelCopyWithImpl<$Res>
    implements _$ProvidersModelCopyWith<$Res> {
  __$ProvidersModelCopyWithImpl(this._self, this._then);

  final _ProvidersModel _self;
  final $Res Function(_ProvidersModel) _then;

/// Create a copy of ProvidersModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? apple = null,Object? google = null,}) {
  return _then(_ProvidersModel(
apple: null == apple ? _self.apple : apple // ignore: cast_nullable_to_non_nullable
as bool,google: null == google ? _self.google : google // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$IdentityModel {

/// apple, google
 String get provider; String? get email;/// An Apple « Masquer mon adresse e-mail » relay address.
 bool get isPrivateEmail; String get firstName; String get lastName;
/// Create a copy of IdentityModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$IdentityModelCopyWith<IdentityModel> get copyWith => _$IdentityModelCopyWithImpl<IdentityModel>(this as IdentityModel, _$identity);

  /// Serializes this IdentityModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as IdentityModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is IdentityModel&&(identical(other.provider, _this.provider) || other.provider == _this.provider)&&(identical(other.email, _this.email) || other.email == _this.email)&&(identical(other.isPrivateEmail, _this.isPrivateEmail) || other.isPrivateEmail == _this.isPrivateEmail)&&(identical(other.firstName, _this.firstName) || other.firstName == _this.firstName)&&(identical(other.lastName, _this.lastName) || other.lastName == _this.lastName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as IdentityModel;
  return Object.hash(runtimeType,_this.provider,_this.email,_this.isPrivateEmail,_this.firstName,_this.lastName);
}

@override
String toString() {
  final _this = this as IdentityModel;
  return 'IdentityModel(provider: ${_this.provider}, email: ${_this.email}, isPrivateEmail: ${_this.isPrivateEmail}, firstName: ${_this.firstName}, lastName: ${_this.lastName})';
}


}

/// @nodoc
abstract mixin class $IdentityModelCopyWith<$Res>  {
  factory $IdentityModelCopyWith(IdentityModel value, $Res Function(IdentityModel) _then) = _$IdentityModelCopyWithImpl;
@useResult
$Res call({
 String provider, String? email, bool isPrivateEmail, String firstName, String lastName
});




}
/// @nodoc
class _$IdentityModelCopyWithImpl<$Res>
    implements $IdentityModelCopyWith<$Res> {
  _$IdentityModelCopyWithImpl(this._self, this._then);

  final IdentityModel _self;
  final $Res Function(IdentityModel) _then;

/// Create a copy of IdentityModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? provider = null,Object? email = freezed,Object? isPrivateEmail = null,Object? firstName = null,Object? lastName = null,}) {
  return _then(IdentityModel(
provider: null == provider ? _self.provider : provider // ignore: cast_nullable_to_non_nullable
as String,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String?,isPrivateEmail: null == isPrivateEmail ? _self.isPrivateEmail : isPrivateEmail // ignore: cast_nullable_to_non_nullable
as bool,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [IdentityModel].
extension IdentityModelPatterns on IdentityModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _IdentityModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _IdentityModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _IdentityModel value)  $default,){
final _that = this;
switch (_that) {
case _IdentityModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _IdentityModel value)?  $default,){
final _that = this;
switch (_that) {
case _IdentityModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String provider,  String? email,  bool isPrivateEmail,  String firstName,  String lastName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _IdentityModel() when $default != null:
return $default(_that.provider,_that.email,_that.isPrivateEmail,_that.firstName,_that.lastName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String provider,  String? email,  bool isPrivateEmail,  String firstName,  String lastName)  $default,) {final _that = this;
switch (_that) {
case _IdentityModel():
return $default(_that.provider,_that.email,_that.isPrivateEmail,_that.firstName,_that.lastName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String provider,  String? email,  bool isPrivateEmail,  String firstName,  String lastName)?  $default,) {final _that = this;
switch (_that) {
case _IdentityModel() when $default != null:
return $default(_that.provider,_that.email,_that.isPrivateEmail,_that.firstName,_that.lastName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _IdentityModel extends IdentityModel {
  const _IdentityModel({required this.provider, this.email, this.isPrivateEmail = false, this.firstName = '', this.lastName = ''}): super._();
  factory _IdentityModel.fromJson(Map<String, dynamic> json) => _$IdentityModelFromJson(json);

/// apple, google
@override final  String provider;
@override final  String? email;
/// An Apple « Masquer mon adresse e-mail » relay address.
@override@JsonKey() final  bool isPrivateEmail;
@override@JsonKey() final  String firstName;
@override@JsonKey() final  String lastName;

/// Create a copy of IdentityModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$IdentityModelCopyWith<_IdentityModel> get copyWith => __$IdentityModelCopyWithImpl<_IdentityModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$IdentityModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _IdentityModel&&(identical(other.provider, provider) || other.provider == provider)&&(identical(other.email, email) || other.email == email)&&(identical(other.isPrivateEmail, isPrivateEmail) || other.isPrivateEmail == isPrivateEmail)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,provider,email,isPrivateEmail,firstName,lastName);
}

@override
String toString() {
    return 'IdentityModel(provider: $provider, email: $email, isPrivateEmail: $isPrivateEmail, firstName: $firstName, lastName: $lastName)';
}


}

/// @nodoc
abstract mixin class _$IdentityModelCopyWith<$Res> implements $IdentityModelCopyWith<$Res> {
  factory _$IdentityModelCopyWith(_IdentityModel value, $Res Function(_IdentityModel) _then) = __$IdentityModelCopyWithImpl;
@override @useResult
$Res call({
 String provider, String? email, bool isPrivateEmail, String firstName, String lastName
});




}
/// @nodoc
class __$IdentityModelCopyWithImpl<$Res>
    implements _$IdentityModelCopyWith<$Res> {
  __$IdentityModelCopyWithImpl(this._self, this._then);

  final _IdentityModel _self;
  final $Res Function(_IdentityModel) _then;

/// Create a copy of IdentityModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? provider = null,Object? email = freezed,Object? isPrivateEmail = null,Object? firstName = null,Object? lastName = null,}) {
  return _then(_IdentityModel(
provider: null == provider ? _self.provider : provider // ignore: cast_nullable_to_non_nullable
as String,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String?,isPrivateEmail: null == isPrivateEmail ? _self.isPrivateEmail : isPrivateEmail // ignore: cast_nullable_to_non_nullable
as bool,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$JoinRequestModel {

 String get id;/// pending, accepted, refused, cancelled, expired
 String get status; String get operatorName; String get firstName; String get lastName;/// agent, driver, valet (« Je suis »)
 String get wishedRole;/// The role the manager gave, once accepted.
 String? get role; DateTime get createdAt; DateTime? get decidedAt; DateTime get expiresAt;
/// Create a copy of JoinRequestModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$JoinRequestModelCopyWith<JoinRequestModel> get copyWith => _$JoinRequestModelCopyWithImpl<JoinRequestModel>(this as JoinRequestModel, _$identity);

  /// Serializes this JoinRequestModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as JoinRequestModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is JoinRequestModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.operatorName, _this.operatorName) || other.operatorName == _this.operatorName)&&(identical(other.firstName, _this.firstName) || other.firstName == _this.firstName)&&(identical(other.lastName, _this.lastName) || other.lastName == _this.lastName)&&(identical(other.wishedRole, _this.wishedRole) || other.wishedRole == _this.wishedRole)&&(identical(other.role, _this.role) || other.role == _this.role)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&(identical(other.decidedAt, _this.decidedAt) || other.decidedAt == _this.decidedAt)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as JoinRequestModel;
  return Object.hash(runtimeType,_this.id,_this.status,_this.operatorName,_this.firstName,_this.lastName,_this.wishedRole,_this.role,_this.createdAt,_this.decidedAt,_this.expiresAt);
}

@override
String toString() {
  final _this = this as JoinRequestModel;
  return 'JoinRequestModel(id: ${_this.id}, status: ${_this.status}, operatorName: ${_this.operatorName}, firstName: ${_this.firstName}, lastName: ${_this.lastName}, wishedRole: ${_this.wishedRole}, role: ${_this.role}, createdAt: ${_this.createdAt}, decidedAt: ${_this.decidedAt}, expiresAt: ${_this.expiresAt})';
}


}

/// @nodoc
abstract mixin class $JoinRequestModelCopyWith<$Res>  {
  factory $JoinRequestModelCopyWith(JoinRequestModel value, $Res Function(JoinRequestModel) _then) = _$JoinRequestModelCopyWithImpl;
@useResult
$Res call({
 String id, String status, String operatorName, String firstName, String lastName, String wishedRole, String? role, DateTime createdAt, DateTime? decidedAt, DateTime expiresAt
});




}
/// @nodoc
class _$JoinRequestModelCopyWithImpl<$Res>
    implements $JoinRequestModelCopyWith<$Res> {
  _$JoinRequestModelCopyWithImpl(this._self, this._then);

  final JoinRequestModel _self;
  final $Res Function(JoinRequestModel) _then;

/// Create a copy of JoinRequestModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? status = null,Object? operatorName = null,Object? firstName = null,Object? lastName = null,Object? wishedRole = null,Object? role = freezed,Object? createdAt = null,Object? decidedAt = freezed,Object? expiresAt = null,}) {
  return _then(JoinRequestModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,operatorName: null == operatorName ? _self.operatorName : operatorName // ignore: cast_nullable_to_non_nullable
as String,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,wishedRole: null == wishedRole ? _self.wishedRole : wishedRole // ignore: cast_nullable_to_non_nullable
as String,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,decidedAt: freezed == decidedAt ? _self.decidedAt : decidedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [JoinRequestModel].
extension JoinRequestModelPatterns on JoinRequestModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _JoinRequestModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _JoinRequestModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _JoinRequestModel value)  $default,){
final _that = this;
switch (_that) {
case _JoinRequestModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _JoinRequestModel value)?  $default,){
final _that = this;
switch (_that) {
case _JoinRequestModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String status,  String operatorName,  String firstName,  String lastName,  String wishedRole,  String? role,  DateTime createdAt,  DateTime? decidedAt,  DateTime expiresAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _JoinRequestModel() when $default != null:
return $default(_that.id,_that.status,_that.operatorName,_that.firstName,_that.lastName,_that.wishedRole,_that.role,_that.createdAt,_that.decidedAt,_that.expiresAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String status,  String operatorName,  String firstName,  String lastName,  String wishedRole,  String? role,  DateTime createdAt,  DateTime? decidedAt,  DateTime expiresAt)  $default,) {final _that = this;
switch (_that) {
case _JoinRequestModel():
return $default(_that.id,_that.status,_that.operatorName,_that.firstName,_that.lastName,_that.wishedRole,_that.role,_that.createdAt,_that.decidedAt,_that.expiresAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String status,  String operatorName,  String firstName,  String lastName,  String wishedRole,  String? role,  DateTime createdAt,  DateTime? decidedAt,  DateTime expiresAt)?  $default,) {final _that = this;
switch (_that) {
case _JoinRequestModel() when $default != null:
return $default(_that.id,_that.status,_that.operatorName,_that.firstName,_that.lastName,_that.wishedRole,_that.role,_that.createdAt,_that.decidedAt,_that.expiresAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _JoinRequestModel extends JoinRequestModel {
  const _JoinRequestModel({required this.id, required this.status, this.operatorName = '', this.firstName = '', this.lastName = '', this.wishedRole = 'agent', this.role, required this.createdAt, this.decidedAt, required this.expiresAt}): super._();
  factory _JoinRequestModel.fromJson(Map<String, dynamic> json) => _$JoinRequestModelFromJson(json);

@override final  String id;
/// pending, accepted, refused, cancelled, expired
@override final  String status;
@override@JsonKey() final  String operatorName;
@override@JsonKey() final  String firstName;
@override@JsonKey() final  String lastName;
/// agent, driver, valet (« Je suis »)
@override@JsonKey() final  String wishedRole;
/// The role the manager gave, once accepted.
@override final  String? role;
@override final  DateTime createdAt;
@override final  DateTime? decidedAt;
@override final  DateTime expiresAt;

/// Create a copy of JoinRequestModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$JoinRequestModelCopyWith<_JoinRequestModel> get copyWith => __$JoinRequestModelCopyWithImpl<_JoinRequestModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$JoinRequestModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _JoinRequestModel&&(identical(other.id, id) || other.id == id)&&(identical(other.status, status) || other.status == status)&&(identical(other.operatorName, operatorName) || other.operatorName == operatorName)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.wishedRole, wishedRole) || other.wishedRole == wishedRole)&&(identical(other.role, role) || other.role == role)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.decidedAt, decidedAt) || other.decidedAt == decidedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,status,operatorName,firstName,lastName,wishedRole,role,createdAt,decidedAt,expiresAt);
}

@override
String toString() {
    return 'JoinRequestModel(id: $id, status: $status, operatorName: $operatorName, firstName: $firstName, lastName: $lastName, wishedRole: $wishedRole, role: $role, createdAt: $createdAt, decidedAt: $decidedAt, expiresAt: $expiresAt)';
}


}

/// @nodoc
abstract mixin class _$JoinRequestModelCopyWith<$Res> implements $JoinRequestModelCopyWith<$Res> {
  factory _$JoinRequestModelCopyWith(_JoinRequestModel value, $Res Function(_JoinRequestModel) _then) = __$JoinRequestModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String status, String operatorName, String firstName, String lastName, String wishedRole, String? role, DateTime createdAt, DateTime? decidedAt, DateTime expiresAt
});




}
/// @nodoc
class __$JoinRequestModelCopyWithImpl<$Res>
    implements _$JoinRequestModelCopyWith<$Res> {
  __$JoinRequestModelCopyWithImpl(this._self, this._then);

  final _JoinRequestModel _self;
  final $Res Function(_JoinRequestModel) _then;

/// Create a copy of JoinRequestModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? status = null,Object? operatorName = null,Object? firstName = null,Object? lastName = null,Object? wishedRole = null,Object? role = freezed,Object? createdAt = null,Object? decidedAt = freezed,Object? expiresAt = null,}) {
  return _then(_JoinRequestModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,operatorName: null == operatorName ? _self.operatorName : operatorName // ignore: cast_nullable_to_non_nullable
as String,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,wishedRole: null == wishedRole ? _self.wishedRole : wishedRole // ignore: cast_nullable_to_non_nullable
as String,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,decidedAt: freezed == decidedAt ? _self.decidedAt : decidedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$OnboardingModel {

 IdentityModel get identity; JoinRequestModel? get request;
/// Create a copy of OnboardingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OnboardingModelCopyWith<OnboardingModel> get copyWith => _$OnboardingModelCopyWithImpl<OnboardingModel>(this as OnboardingModel, _$identity);

  /// Serializes this OnboardingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OnboardingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OnboardingModel&&(identical(other.identity, _this.identity) || other.identity == _this.identity)&&(identical(other.request, _this.request) || other.request == _this.request));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OnboardingModel;
  return Object.hash(runtimeType,_this.identity,_this.request);
}

@override
String toString() {
  final _this = this as OnboardingModel;
  return 'OnboardingModel(identity: ${_this.identity}, request: ${_this.request})';
}


}

/// @nodoc
abstract mixin class $OnboardingModelCopyWith<$Res>  {
  factory $OnboardingModelCopyWith(OnboardingModel value, $Res Function(OnboardingModel) _then) = _$OnboardingModelCopyWithImpl;
@useResult
$Res call({
 IdentityModel identity, JoinRequestModel? request
});


$IdentityModelCopyWith<$Res> get identity;$JoinRequestModelCopyWith<$Res>? get request;

}
/// @nodoc
class _$OnboardingModelCopyWithImpl<$Res>
    implements $OnboardingModelCopyWith<$Res> {
  _$OnboardingModelCopyWithImpl(this._self, this._then);

  final OnboardingModel _self;
  final $Res Function(OnboardingModel) _then;

/// Create a copy of OnboardingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? identity = null,Object? request = freezed,}) {
  return _then(OnboardingModel(
identity: null == identity ? _self.identity : identity // ignore: cast_nullable_to_non_nullable
as IdentityModel,request: freezed == request ? _self.request : request // ignore: cast_nullable_to_non_nullable
as JoinRequestModel?,
  ));
}
/// Create a copy of OnboardingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$IdentityModelCopyWith<$Res> get identity {
  
  return $IdentityModelCopyWith<$Res>(_self.identity, (value) {
    return _then(_self.copyWith(identity: value));
  });
}/// Create a copy of OnboardingModel
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
}
}


/// Adds pattern-matching-related methods to [OnboardingModel].
extension OnboardingModelPatterns on OnboardingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OnboardingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OnboardingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OnboardingModel value)  $default,){
final _that = this;
switch (_that) {
case _OnboardingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OnboardingModel value)?  $default,){
final _that = this;
switch (_that) {
case _OnboardingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( IdentityModel identity,  JoinRequestModel? request)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OnboardingModel() when $default != null:
return $default(_that.identity,_that.request);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( IdentityModel identity,  JoinRequestModel? request)  $default,) {final _that = this;
switch (_that) {
case _OnboardingModel():
return $default(_that.identity,_that.request);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( IdentityModel identity,  JoinRequestModel? request)?  $default,) {final _that = this;
switch (_that) {
case _OnboardingModel() when $default != null:
return $default(_that.identity,_that.request);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OnboardingModel implements OnboardingModel {
  const _OnboardingModel({required this.identity, this.request});
  factory _OnboardingModel.fromJson(Map<String, dynamic> json) => _$OnboardingModelFromJson(json);

@override final  IdentityModel identity;
@override final  JoinRequestModel? request;

/// Create a copy of OnboardingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OnboardingModelCopyWith<_OnboardingModel> get copyWith => __$OnboardingModelCopyWithImpl<_OnboardingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OnboardingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OnboardingModel&&(identical(other.identity, identity) || other.identity == identity)&&(identical(other.request, request) || other.request == request));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,identity,request);
}

@override
String toString() {
    return 'OnboardingModel(identity: $identity, request: $request)';
}


}

/// @nodoc
abstract mixin class _$OnboardingModelCopyWith<$Res> implements $OnboardingModelCopyWith<$Res> {
  factory _$OnboardingModelCopyWith(_OnboardingModel value, $Res Function(_OnboardingModel) _then) = __$OnboardingModelCopyWithImpl;
@override @useResult
$Res call({
 IdentityModel identity, JoinRequestModel? request
});


@override $IdentityModelCopyWith<$Res> get identity;@override $JoinRequestModelCopyWith<$Res>? get request;

}
/// @nodoc
class __$OnboardingModelCopyWithImpl<$Res>
    implements _$OnboardingModelCopyWith<$Res> {
  __$OnboardingModelCopyWithImpl(this._self, this._then);

  final _OnboardingModel _self;
  final $Res Function(_OnboardingModel) _then;

/// Create a copy of OnboardingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? identity = null,Object? request = freezed,}) {
  return _then(_OnboardingModel(
identity: null == identity ? _self.identity : identity // ignore: cast_nullable_to_non_nullable
as IdentityModel,request: freezed == request ? _self.request : request // ignore: cast_nullable_to_non_nullable
as JoinRequestModel?,
  ));
}

/// Create a copy of OnboardingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$IdentityModelCopyWith<$Res> get identity {
  
  return $IdentityModelCopyWith<$Res>(_self.identity, (value) {
    return _then(_self.copyWith(identity: value));
  });
}/// Create a copy of OnboardingModel
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
}
}


/// @nodoc
mixin _$JoinRequestEnvelope {

 JoinRequestModel get request;
/// Create a copy of JoinRequestEnvelope
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$JoinRequestEnvelopeCopyWith<JoinRequestEnvelope> get copyWith => _$JoinRequestEnvelopeCopyWithImpl<JoinRequestEnvelope>(this as JoinRequestEnvelope, _$identity);

  /// Serializes this JoinRequestEnvelope to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as JoinRequestEnvelope;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is JoinRequestEnvelope&&(identical(other.request, _this.request) || other.request == _this.request));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as JoinRequestEnvelope;
  return Object.hash(runtimeType,_this.request);
}

@override
String toString() {
  final _this = this as JoinRequestEnvelope;
  return 'JoinRequestEnvelope(request: ${_this.request})';
}


}

/// @nodoc
abstract mixin class $JoinRequestEnvelopeCopyWith<$Res>  {
  factory $JoinRequestEnvelopeCopyWith(JoinRequestEnvelope value, $Res Function(JoinRequestEnvelope) _then) = _$JoinRequestEnvelopeCopyWithImpl;
@useResult
$Res call({
 JoinRequestModel request
});


$JoinRequestModelCopyWith<$Res> get request;

}
/// @nodoc
class _$JoinRequestEnvelopeCopyWithImpl<$Res>
    implements $JoinRequestEnvelopeCopyWith<$Res> {
  _$JoinRequestEnvelopeCopyWithImpl(this._self, this._then);

  final JoinRequestEnvelope _self;
  final $Res Function(JoinRequestEnvelope) _then;

/// Create a copy of JoinRequestEnvelope
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? request = null,}) {
  return _then(JoinRequestEnvelope(
request: null == request ? _self.request : request // ignore: cast_nullable_to_non_nullable
as JoinRequestModel,
  ));
}
/// Create a copy of JoinRequestEnvelope
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$JoinRequestModelCopyWith<$Res> get request {
  
  return $JoinRequestModelCopyWith<$Res>(_self.request, (value) {
    return _then(_self.copyWith(request: value));
  });
}
}


/// Adds pattern-matching-related methods to [JoinRequestEnvelope].
extension JoinRequestEnvelopePatterns on JoinRequestEnvelope {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _JoinRequestEnvelope value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _JoinRequestEnvelope() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _JoinRequestEnvelope value)  $default,){
final _that = this;
switch (_that) {
case _JoinRequestEnvelope():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _JoinRequestEnvelope value)?  $default,){
final _that = this;
switch (_that) {
case _JoinRequestEnvelope() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( JoinRequestModel request)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _JoinRequestEnvelope() when $default != null:
return $default(_that.request);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( JoinRequestModel request)  $default,) {final _that = this;
switch (_that) {
case _JoinRequestEnvelope():
return $default(_that.request);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( JoinRequestModel request)?  $default,) {final _that = this;
switch (_that) {
case _JoinRequestEnvelope() when $default != null:
return $default(_that.request);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _JoinRequestEnvelope implements JoinRequestEnvelope {
  const _JoinRequestEnvelope({required this.request});
  factory _JoinRequestEnvelope.fromJson(Map<String, dynamic> json) => _$JoinRequestEnvelopeFromJson(json);

@override final  JoinRequestModel request;

/// Create a copy of JoinRequestEnvelope
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$JoinRequestEnvelopeCopyWith<_JoinRequestEnvelope> get copyWith => __$JoinRequestEnvelopeCopyWithImpl<_JoinRequestEnvelope>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$JoinRequestEnvelopeToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _JoinRequestEnvelope&&(identical(other.request, request) || other.request == request));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,request);
}

@override
String toString() {
    return 'JoinRequestEnvelope(request: $request)';
}


}

/// @nodoc
abstract mixin class _$JoinRequestEnvelopeCopyWith<$Res> implements $JoinRequestEnvelopeCopyWith<$Res> {
  factory _$JoinRequestEnvelopeCopyWith(_JoinRequestEnvelope value, $Res Function(_JoinRequestEnvelope) _then) = __$JoinRequestEnvelopeCopyWithImpl;
@override @useResult
$Res call({
 JoinRequestModel request
});


@override $JoinRequestModelCopyWith<$Res> get request;

}
/// @nodoc
class __$JoinRequestEnvelopeCopyWithImpl<$Res>
    implements _$JoinRequestEnvelopeCopyWith<$Res> {
  __$JoinRequestEnvelopeCopyWithImpl(this._self, this._then);

  final _JoinRequestEnvelope _self;
  final $Res Function(_JoinRequestEnvelope) _then;

/// Create a copy of JoinRequestEnvelope
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? request = null,}) {
  return _then(_JoinRequestEnvelope(
request: null == request ? _self.request : request // ignore: cast_nullable_to_non_nullable
as JoinRequestModel,
  ));
}

/// Create a copy of JoinRequestEnvelope
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$JoinRequestModelCopyWith<$Res> get request {
  
  return $JoinRequestModelCopyWith<$Res>(_self.request, (value) {
    return _then(_self.copyWith(request: value));
  });
}
}

// dart format on
