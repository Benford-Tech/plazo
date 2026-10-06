// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'settings_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TeamMemberModel {

 String get id; String get email; String get name; String get firstName; String get lastName; String? get phone; String get role; bool get isActive; DateTime? get lastLoginAt;/// The post held today (R-C), when it differs from the role.
 String? get post; DateTime? get postSetAt;
/// Create a copy of TeamMemberModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TeamMemberModelCopyWith<TeamMemberModel> get copyWith => _$TeamMemberModelCopyWithImpl<TeamMemberModel>(this as TeamMemberModel, _$identity);

  /// Serializes this TeamMemberModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TeamMemberModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TeamMemberModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.email, _this.email) || other.email == _this.email)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.firstName, _this.firstName) || other.firstName == _this.firstName)&&(identical(other.lastName, _this.lastName) || other.lastName == _this.lastName)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.role, _this.role) || other.role == _this.role)&&(identical(other.isActive, _this.isActive) || other.isActive == _this.isActive)&&(identical(other.lastLoginAt, _this.lastLoginAt) || other.lastLoginAt == _this.lastLoginAt)&&(identical(other.post, _this.post) || other.post == _this.post)&&(identical(other.postSetAt, _this.postSetAt) || other.postSetAt == _this.postSetAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TeamMemberModel;
  return Object.hash(runtimeType,_this.id,_this.email,_this.name,_this.firstName,_this.lastName,_this.phone,_this.role,_this.isActive,_this.lastLoginAt,_this.post,_this.postSetAt);
}

@override
String toString() {
  final _this = this as TeamMemberModel;
  return 'TeamMemberModel(id: ${_this.id}, email: ${_this.email}, name: ${_this.name}, firstName: ${_this.firstName}, lastName: ${_this.lastName}, phone: ${_this.phone}, role: ${_this.role}, isActive: ${_this.isActive}, lastLoginAt: ${_this.lastLoginAt}, post: ${_this.post}, postSetAt: ${_this.postSetAt})';
}


}

/// @nodoc
abstract mixin class $TeamMemberModelCopyWith<$Res>  {
  factory $TeamMemberModelCopyWith(TeamMemberModel value, $Res Function(TeamMemberModel) _then) = _$TeamMemberModelCopyWithImpl;
@useResult
$Res call({
 String id, String email, String name, String firstName, String lastName, String? phone, String role, bool isActive, DateTime? lastLoginAt, String? post, DateTime? postSetAt
});




}
/// @nodoc
class _$TeamMemberModelCopyWithImpl<$Res>
    implements $TeamMemberModelCopyWith<$Res> {
  _$TeamMemberModelCopyWithImpl(this._self, this._then);

  final TeamMemberModel _self;
  final $Res Function(TeamMemberModel) _then;

/// Create a copy of TeamMemberModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? email = null,Object? name = null,Object? firstName = null,Object? lastName = null,Object? phone = freezed,Object? role = null,Object? isActive = null,Object? lastLoginAt = freezed,Object? post = freezed,Object? postSetAt = freezed,}) {
  return _then(TeamMemberModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,lastLoginAt: freezed == lastLoginAt ? _self.lastLoginAt : lastLoginAt // ignore: cast_nullable_to_non_nullable
as DateTime?,post: freezed == post ? _self.post : post // ignore: cast_nullable_to_non_nullable
as String?,postSetAt: freezed == postSetAt ? _self.postSetAt : postSetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [TeamMemberModel].
extension TeamMemberModelPatterns on TeamMemberModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TeamMemberModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TeamMemberModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TeamMemberModel value)  $default,){
final _that = this;
switch (_that) {
case _TeamMemberModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TeamMemberModel value)?  $default,){
final _that = this;
switch (_that) {
case _TeamMemberModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String email,  String name,  String firstName,  String lastName,  String? phone,  String role,  bool isActive,  DateTime? lastLoginAt,  String? post,  DateTime? postSetAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TeamMemberModel() when $default != null:
return $default(_that.id,_that.email,_that.name,_that.firstName,_that.lastName,_that.phone,_that.role,_that.isActive,_that.lastLoginAt,_that.post,_that.postSetAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String email,  String name,  String firstName,  String lastName,  String? phone,  String role,  bool isActive,  DateTime? lastLoginAt,  String? post,  DateTime? postSetAt)  $default,) {final _that = this;
switch (_that) {
case _TeamMemberModel():
return $default(_that.id,_that.email,_that.name,_that.firstName,_that.lastName,_that.phone,_that.role,_that.isActive,_that.lastLoginAt,_that.post,_that.postSetAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String email,  String name,  String firstName,  String lastName,  String? phone,  String role,  bool isActive,  DateTime? lastLoginAt,  String? post,  DateTime? postSetAt)?  $default,) {final _that = this;
switch (_that) {
case _TeamMemberModel() when $default != null:
return $default(_that.id,_that.email,_that.name,_that.firstName,_that.lastName,_that.phone,_that.role,_that.isActive,_that.lastLoginAt,_that.post,_that.postSetAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TeamMemberModel implements TeamMemberModel {
  const _TeamMemberModel({required this.id, required this.email, required this.name, this.firstName = '', this.lastName = '', this.phone, required this.role, this.isActive = true, this.lastLoginAt, this.post, this.postSetAt});
  factory _TeamMemberModel.fromJson(Map<String, dynamic> json) => _$TeamMemberModelFromJson(json);

@override final  String id;
@override final  String email;
@override final  String name;
@override@JsonKey() final  String firstName;
@override@JsonKey() final  String lastName;
@override final  String? phone;
@override final  String role;
@override@JsonKey() final  bool isActive;
@override final  DateTime? lastLoginAt;
/// The post held today (R-C), when it differs from the role.
@override final  String? post;
@override final  DateTime? postSetAt;

/// Create a copy of TeamMemberModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TeamMemberModelCopyWith<_TeamMemberModel> get copyWith => __$TeamMemberModelCopyWithImpl<_TeamMemberModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TeamMemberModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TeamMemberModel&&(identical(other.id, id) || other.id == id)&&(identical(other.email, email) || other.email == email)&&(identical(other.name, name) || other.name == name)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.role, role) || other.role == role)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.lastLoginAt, lastLoginAt) || other.lastLoginAt == lastLoginAt)&&(identical(other.post, post) || other.post == post)&&(identical(other.postSetAt, postSetAt) || other.postSetAt == postSetAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,email,name,firstName,lastName,phone,role,isActive,lastLoginAt,post,postSetAt);
}

@override
String toString() {
    return 'TeamMemberModel(id: $id, email: $email, name: $name, firstName: $firstName, lastName: $lastName, phone: $phone, role: $role, isActive: $isActive, lastLoginAt: $lastLoginAt, post: $post, postSetAt: $postSetAt)';
}


}

/// @nodoc
abstract mixin class _$TeamMemberModelCopyWith<$Res> implements $TeamMemberModelCopyWith<$Res> {
  factory _$TeamMemberModelCopyWith(_TeamMemberModel value, $Res Function(_TeamMemberModel) _then) = __$TeamMemberModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String email, String name, String firstName, String lastName, String? phone, String role, bool isActive, DateTime? lastLoginAt, String? post, DateTime? postSetAt
});




}
/// @nodoc
class __$TeamMemberModelCopyWithImpl<$Res>
    implements _$TeamMemberModelCopyWith<$Res> {
  __$TeamMemberModelCopyWithImpl(this._self, this._then);

  final _TeamMemberModel _self;
  final $Res Function(_TeamMemberModel) _then;

/// Create a copy of TeamMemberModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? email = null,Object? name = null,Object? firstName = null,Object? lastName = null,Object? phone = freezed,Object? role = null,Object? isActive = null,Object? lastLoginAt = freezed,Object? post = freezed,Object? postSetAt = freezed,}) {
  return _then(_TeamMemberModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,lastLoginAt: freezed == lastLoginAt ? _self.lastLoginAt : lastLoginAt // ignore: cast_nullable_to_non_nullable
as DateTime?,post: freezed == post ? _self.post : post // ignore: cast_nullable_to_non_nullable
as String?,postSetAt: freezed == postSetAt ? _self.postSetAt : postSetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$ParkingSettingsModel {

 String get id; String get name; String? get address; String get timezone; int get totalCapacity; int get safetyMarginPct; int get shuttleTravelMinutes; int get terminalLeadMinutes; int get landingDelayMinutes; int get bookableCapacity;
/// Create a copy of ParkingSettingsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingSettingsModelCopyWith<ParkingSettingsModel> get copyWith => _$ParkingSettingsModelCopyWithImpl<ParkingSettingsModel>(this as ParkingSettingsModel, _$identity);

  /// Serializes this ParkingSettingsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ParkingSettingsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingSettingsModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.address, _this.address) || other.address == _this.address)&&(identical(other.timezone, _this.timezone) || other.timezone == _this.timezone)&&(identical(other.totalCapacity, _this.totalCapacity) || other.totalCapacity == _this.totalCapacity)&&(identical(other.safetyMarginPct, _this.safetyMarginPct) || other.safetyMarginPct == _this.safetyMarginPct)&&(identical(other.shuttleTravelMinutes, _this.shuttleTravelMinutes) || other.shuttleTravelMinutes == _this.shuttleTravelMinutes)&&(identical(other.terminalLeadMinutes, _this.terminalLeadMinutes) || other.terminalLeadMinutes == _this.terminalLeadMinutes)&&(identical(other.landingDelayMinutes, _this.landingDelayMinutes) || other.landingDelayMinutes == _this.landingDelayMinutes)&&(identical(other.bookableCapacity, _this.bookableCapacity) || other.bookableCapacity == _this.bookableCapacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ParkingSettingsModel;
  return Object.hash(runtimeType,_this.id,_this.name,_this.address,_this.timezone,_this.totalCapacity,_this.safetyMarginPct,_this.shuttleTravelMinutes,_this.terminalLeadMinutes,_this.landingDelayMinutes,_this.bookableCapacity);
}

@override
String toString() {
  final _this = this as ParkingSettingsModel;
  return 'ParkingSettingsModel(id: ${_this.id}, name: ${_this.name}, address: ${_this.address}, timezone: ${_this.timezone}, totalCapacity: ${_this.totalCapacity}, safetyMarginPct: ${_this.safetyMarginPct}, shuttleTravelMinutes: ${_this.shuttleTravelMinutes}, terminalLeadMinutes: ${_this.terminalLeadMinutes}, landingDelayMinutes: ${_this.landingDelayMinutes}, bookableCapacity: ${_this.bookableCapacity})';
}


}

/// @nodoc
abstract mixin class $ParkingSettingsModelCopyWith<$Res>  {
  factory $ParkingSettingsModelCopyWith(ParkingSettingsModel value, $Res Function(ParkingSettingsModel) _then) = _$ParkingSettingsModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, String? address, String timezone, int totalCapacity, int safetyMarginPct, int shuttleTravelMinutes, int terminalLeadMinutes, int landingDelayMinutes, int bookableCapacity
});




}
/// @nodoc
class _$ParkingSettingsModelCopyWithImpl<$Res>
    implements $ParkingSettingsModelCopyWith<$Res> {
  _$ParkingSettingsModelCopyWithImpl(this._self, this._then);

  final ParkingSettingsModel _self;
  final $Res Function(ParkingSettingsModel) _then;

/// Create a copy of ParkingSettingsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? address = freezed,Object? timezone = null,Object? totalCapacity = null,Object? safetyMarginPct = null,Object? shuttleTravelMinutes = null,Object? terminalLeadMinutes = null,Object? landingDelayMinutes = null,Object? bookableCapacity = null,}) {
  return _then(ParkingSettingsModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,totalCapacity: null == totalCapacity ? _self.totalCapacity : totalCapacity // ignore: cast_nullable_to_non_nullable
as int,safetyMarginPct: null == safetyMarginPct ? _self.safetyMarginPct : safetyMarginPct // ignore: cast_nullable_to_non_nullable
as int,shuttleTravelMinutes: null == shuttleTravelMinutes ? _self.shuttleTravelMinutes : shuttleTravelMinutes // ignore: cast_nullable_to_non_nullable
as int,terminalLeadMinutes: null == terminalLeadMinutes ? _self.terminalLeadMinutes : terminalLeadMinutes // ignore: cast_nullable_to_non_nullable
as int,landingDelayMinutes: null == landingDelayMinutes ? _self.landingDelayMinutes : landingDelayMinutes // ignore: cast_nullable_to_non_nullable
as int,bookableCapacity: null == bookableCapacity ? _self.bookableCapacity : bookableCapacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [ParkingSettingsModel].
extension ParkingSettingsModelPatterns on ParkingSettingsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingSettingsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingSettingsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingSettingsModel value)  $default,){
final _that = this;
switch (_that) {
case _ParkingSettingsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingSettingsModel value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingSettingsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String? address,  String timezone,  int totalCapacity,  int safetyMarginPct,  int shuttleTravelMinutes,  int terminalLeadMinutes,  int landingDelayMinutes,  int bookableCapacity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingSettingsModel() when $default != null:
return $default(_that.id,_that.name,_that.address,_that.timezone,_that.totalCapacity,_that.safetyMarginPct,_that.shuttleTravelMinutes,_that.terminalLeadMinutes,_that.landingDelayMinutes,_that.bookableCapacity);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String? address,  String timezone,  int totalCapacity,  int safetyMarginPct,  int shuttleTravelMinutes,  int terminalLeadMinutes,  int landingDelayMinutes,  int bookableCapacity)  $default,) {final _that = this;
switch (_that) {
case _ParkingSettingsModel():
return $default(_that.id,_that.name,_that.address,_that.timezone,_that.totalCapacity,_that.safetyMarginPct,_that.shuttleTravelMinutes,_that.terminalLeadMinutes,_that.landingDelayMinutes,_that.bookableCapacity);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String? address,  String timezone,  int totalCapacity,  int safetyMarginPct,  int shuttleTravelMinutes,  int terminalLeadMinutes,  int landingDelayMinutes,  int bookableCapacity)?  $default,) {final _that = this;
switch (_that) {
case _ParkingSettingsModel() when $default != null:
return $default(_that.id,_that.name,_that.address,_that.timezone,_that.totalCapacity,_that.safetyMarginPct,_that.shuttleTravelMinutes,_that.terminalLeadMinutes,_that.landingDelayMinutes,_that.bookableCapacity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ParkingSettingsModel implements ParkingSettingsModel {
  const _ParkingSettingsModel({required this.id, required this.name, this.address, this.timezone = 'Europe/Paris', required this.totalCapacity, this.safetyMarginPct = 0, this.shuttleTravelMinutes = 8, this.terminalLeadMinutes = 120, this.landingDelayMinutes = 30, this.bookableCapacity = 0});
  factory _ParkingSettingsModel.fromJson(Map<String, dynamic> json) => _$ParkingSettingsModelFromJson(json);

@override final  String id;
@override final  String name;
@override final  String? address;
@override@JsonKey() final  String timezone;
@override final  int totalCapacity;
@override@JsonKey() final  int safetyMarginPct;
@override@JsonKey() final  int shuttleTravelMinutes;
@override@JsonKey() final  int terminalLeadMinutes;
@override@JsonKey() final  int landingDelayMinutes;
@override@JsonKey() final  int bookableCapacity;

/// Create a copy of ParkingSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingSettingsModelCopyWith<_ParkingSettingsModel> get copyWith => __$ParkingSettingsModelCopyWithImpl<_ParkingSettingsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ParkingSettingsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingSettingsModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.totalCapacity, totalCapacity) || other.totalCapacity == totalCapacity)&&(identical(other.safetyMarginPct, safetyMarginPct) || other.safetyMarginPct == safetyMarginPct)&&(identical(other.shuttleTravelMinutes, shuttleTravelMinutes) || other.shuttleTravelMinutes == shuttleTravelMinutes)&&(identical(other.terminalLeadMinutes, terminalLeadMinutes) || other.terminalLeadMinutes == terminalLeadMinutes)&&(identical(other.landingDelayMinutes, landingDelayMinutes) || other.landingDelayMinutes == landingDelayMinutes)&&(identical(other.bookableCapacity, bookableCapacity) || other.bookableCapacity == bookableCapacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name,address,timezone,totalCapacity,safetyMarginPct,shuttleTravelMinutes,terminalLeadMinutes,landingDelayMinutes,bookableCapacity);
}

@override
String toString() {
    return 'ParkingSettingsModel(id: $id, name: $name, address: $address, timezone: $timezone, totalCapacity: $totalCapacity, safetyMarginPct: $safetyMarginPct, shuttleTravelMinutes: $shuttleTravelMinutes, terminalLeadMinutes: $terminalLeadMinutes, landingDelayMinutes: $landingDelayMinutes, bookableCapacity: $bookableCapacity)';
}


}

/// @nodoc
abstract mixin class _$ParkingSettingsModelCopyWith<$Res> implements $ParkingSettingsModelCopyWith<$Res> {
  factory _$ParkingSettingsModelCopyWith(_ParkingSettingsModel value, $Res Function(_ParkingSettingsModel) _then) = __$ParkingSettingsModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String? address, String timezone, int totalCapacity, int safetyMarginPct, int shuttleTravelMinutes, int terminalLeadMinutes, int landingDelayMinutes, int bookableCapacity
});




}
/// @nodoc
class __$ParkingSettingsModelCopyWithImpl<$Res>
    implements _$ParkingSettingsModelCopyWith<$Res> {
  __$ParkingSettingsModelCopyWithImpl(this._self, this._then);

  final _ParkingSettingsModel _self;
  final $Res Function(_ParkingSettingsModel) _then;

/// Create a copy of ParkingSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? address = freezed,Object? timezone = null,Object? totalCapacity = null,Object? safetyMarginPct = null,Object? shuttleTravelMinutes = null,Object? terminalLeadMinutes = null,Object? landingDelayMinutes = null,Object? bookableCapacity = null,}) {
  return _then(_ParkingSettingsModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,totalCapacity: null == totalCapacity ? _self.totalCapacity : totalCapacity // ignore: cast_nullable_to_non_nullable
as int,safetyMarginPct: null == safetyMarginPct ? _self.safetyMarginPct : safetyMarginPct // ignore: cast_nullable_to_non_nullable
as int,shuttleTravelMinutes: null == shuttleTravelMinutes ? _self.shuttleTravelMinutes : shuttleTravelMinutes // ignore: cast_nullable_to_non_nullable
as int,terminalLeadMinutes: null == terminalLeadMinutes ? _self.terminalLeadMinutes : terminalLeadMinutes // ignore: cast_nullable_to_non_nullable
as int,landingDelayMinutes: null == landingDelayMinutes ? _self.landingDelayMinutes : landingDelayMinutes // ignore: cast_nullable_to_non_nullable
as int,bookableCapacity: null == bookableCapacity ? _self.bookableCapacity : bookableCapacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$SmsGatewayModel {

 String? get baseUrl; String get login; String? get senderPhone; String? get linkedAt;
/// Create a copy of SmsGatewayModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SmsGatewayModelCopyWith<SmsGatewayModel> get copyWith => _$SmsGatewayModelCopyWithImpl<SmsGatewayModel>(this as SmsGatewayModel, _$identity);

  /// Serializes this SmsGatewayModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SmsGatewayModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SmsGatewayModel&&(identical(other.baseUrl, _this.baseUrl) || other.baseUrl == _this.baseUrl)&&(identical(other.login, _this.login) || other.login == _this.login)&&(identical(other.senderPhone, _this.senderPhone) || other.senderPhone == _this.senderPhone)&&(identical(other.linkedAt, _this.linkedAt) || other.linkedAt == _this.linkedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SmsGatewayModel;
  return Object.hash(runtimeType,_this.baseUrl,_this.login,_this.senderPhone,_this.linkedAt);
}

@override
String toString() {
  final _this = this as SmsGatewayModel;
  return 'SmsGatewayModel(baseUrl: ${_this.baseUrl}, login: ${_this.login}, senderPhone: ${_this.senderPhone}, linkedAt: ${_this.linkedAt})';
}


}

/// @nodoc
abstract mixin class $SmsGatewayModelCopyWith<$Res>  {
  factory $SmsGatewayModelCopyWith(SmsGatewayModel value, $Res Function(SmsGatewayModel) _then) = _$SmsGatewayModelCopyWithImpl;
@useResult
$Res call({
 String? baseUrl, String login, String? senderPhone, String? linkedAt
});




}
/// @nodoc
class _$SmsGatewayModelCopyWithImpl<$Res>
    implements $SmsGatewayModelCopyWith<$Res> {
  _$SmsGatewayModelCopyWithImpl(this._self, this._then);

  final SmsGatewayModel _self;
  final $Res Function(SmsGatewayModel) _then;

/// Create a copy of SmsGatewayModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? baseUrl = freezed,Object? login = null,Object? senderPhone = freezed,Object? linkedAt = freezed,}) {
  return _then(SmsGatewayModel(
baseUrl: freezed == baseUrl ? _self.baseUrl : baseUrl // ignore: cast_nullable_to_non_nullable
as String?,login: null == login ? _self.login : login // ignore: cast_nullable_to_non_nullable
as String,senderPhone: freezed == senderPhone ? _self.senderPhone : senderPhone // ignore: cast_nullable_to_non_nullable
as String?,linkedAt: freezed == linkedAt ? _self.linkedAt : linkedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [SmsGatewayModel].
extension SmsGatewayModelPatterns on SmsGatewayModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SmsGatewayModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SmsGatewayModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SmsGatewayModel value)  $default,){
final _that = this;
switch (_that) {
case _SmsGatewayModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SmsGatewayModel value)?  $default,){
final _that = this;
switch (_that) {
case _SmsGatewayModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? baseUrl,  String login,  String? senderPhone,  String? linkedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SmsGatewayModel() when $default != null:
return $default(_that.baseUrl,_that.login,_that.senderPhone,_that.linkedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? baseUrl,  String login,  String? senderPhone,  String? linkedAt)  $default,) {final _that = this;
switch (_that) {
case _SmsGatewayModel():
return $default(_that.baseUrl,_that.login,_that.senderPhone,_that.linkedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? baseUrl,  String login,  String? senderPhone,  String? linkedAt)?  $default,) {final _that = this;
switch (_that) {
case _SmsGatewayModel() when $default != null:
return $default(_that.baseUrl,_that.login,_that.senderPhone,_that.linkedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SmsGatewayModel implements SmsGatewayModel {
  const _SmsGatewayModel({this.baseUrl, required this.login, this.senderPhone, this.linkedAt});
  factory _SmsGatewayModel.fromJson(Map<String, dynamic> json) => _$SmsGatewayModelFromJson(json);

@override final  String? baseUrl;
@override final  String login;
@override final  String? senderPhone;
@override final  String? linkedAt;

/// Create a copy of SmsGatewayModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SmsGatewayModelCopyWith<_SmsGatewayModel> get copyWith => __$SmsGatewayModelCopyWithImpl<_SmsGatewayModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SmsGatewayModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SmsGatewayModel&&(identical(other.baseUrl, baseUrl) || other.baseUrl == baseUrl)&&(identical(other.login, login) || other.login == login)&&(identical(other.senderPhone, senderPhone) || other.senderPhone == senderPhone)&&(identical(other.linkedAt, linkedAt) || other.linkedAt == linkedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,baseUrl,login,senderPhone,linkedAt);
}

@override
String toString() {
    return 'SmsGatewayModel(baseUrl: $baseUrl, login: $login, senderPhone: $senderPhone, linkedAt: $linkedAt)';
}


}

/// @nodoc
abstract mixin class _$SmsGatewayModelCopyWith<$Res> implements $SmsGatewayModelCopyWith<$Res> {
  factory _$SmsGatewayModelCopyWith(_SmsGatewayModel value, $Res Function(_SmsGatewayModel) _then) = __$SmsGatewayModelCopyWithImpl;
@override @useResult
$Res call({
 String? baseUrl, String login, String? senderPhone, String? linkedAt
});




}
/// @nodoc
class __$SmsGatewayModelCopyWithImpl<$Res>
    implements _$SmsGatewayModelCopyWith<$Res> {
  __$SmsGatewayModelCopyWithImpl(this._self, this._then);

  final _SmsGatewayModel _self;
  final $Res Function(_SmsGatewayModel) _then;

/// Create a copy of SmsGatewayModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? baseUrl = freezed,Object? login = null,Object? senderPhone = freezed,Object? linkedAt = freezed,}) {
  return _then(_SmsGatewayModel(
baseUrl: freezed == baseUrl ? _self.baseUrl : baseUrl // ignore: cast_nullable_to_non_nullable
as String?,login: null == login ? _self.login : login // ignore: cast_nullable_to_non_nullable
as String,senderPhone: freezed == senderPhone ? _self.senderPhone : senderPhone // ignore: cast_nullable_to_non_nullable
as String?,linkedAt: freezed == linkedAt ? _self.linkedAt : linkedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$SmsSettingsModel {

 String get mode; bool get brevoAvailable; SmsGatewayModel? get gateway;
/// Create a copy of SmsSettingsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SmsSettingsModelCopyWith<SmsSettingsModel> get copyWith => _$SmsSettingsModelCopyWithImpl<SmsSettingsModel>(this as SmsSettingsModel, _$identity);

  /// Serializes this SmsSettingsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SmsSettingsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SmsSettingsModel&&(identical(other.mode, _this.mode) || other.mode == _this.mode)&&(identical(other.brevoAvailable, _this.brevoAvailable) || other.brevoAvailable == _this.brevoAvailable)&&(identical(other.gateway, _this.gateway) || other.gateway == _this.gateway));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SmsSettingsModel;
  return Object.hash(runtimeType,_this.mode,_this.brevoAvailable,_this.gateway);
}

@override
String toString() {
  final _this = this as SmsSettingsModel;
  return 'SmsSettingsModel(mode: ${_this.mode}, brevoAvailable: ${_this.brevoAvailable}, gateway: ${_this.gateway})';
}


}

/// @nodoc
abstract mixin class $SmsSettingsModelCopyWith<$Res>  {
  factory $SmsSettingsModelCopyWith(SmsSettingsModel value, $Res Function(SmsSettingsModel) _then) = _$SmsSettingsModelCopyWithImpl;
@useResult
$Res call({
 String mode, bool brevoAvailable, SmsGatewayModel? gateway
});


$SmsGatewayModelCopyWith<$Res>? get gateway;

}
/// @nodoc
class _$SmsSettingsModelCopyWithImpl<$Res>
    implements $SmsSettingsModelCopyWith<$Res> {
  _$SmsSettingsModelCopyWithImpl(this._self, this._then);

  final SmsSettingsModel _self;
  final $Res Function(SmsSettingsModel) _then;

/// Create a copy of SmsSettingsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? mode = null,Object? brevoAvailable = null,Object? gateway = freezed,}) {
  return _then(SmsSettingsModel(
mode: null == mode ? _self.mode : mode // ignore: cast_nullable_to_non_nullable
as String,brevoAvailable: null == brevoAvailable ? _self.brevoAvailable : brevoAvailable // ignore: cast_nullable_to_non_nullable
as bool,gateway: freezed == gateway ? _self.gateway : gateway // ignore: cast_nullable_to_non_nullable
as SmsGatewayModel?,
  ));
}
/// Create a copy of SmsSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsGatewayModelCopyWith<$Res>? get gateway {
    if (_self.gateway == null) {
    return null;
  }

  return $SmsGatewayModelCopyWith<$Res>(_self.gateway!, (value) {
    return _then(_self.copyWith(gateway: value));
  });
}
}


/// Adds pattern-matching-related methods to [SmsSettingsModel].
extension SmsSettingsModelPatterns on SmsSettingsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SmsSettingsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SmsSettingsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SmsSettingsModel value)  $default,){
final _that = this;
switch (_that) {
case _SmsSettingsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SmsSettingsModel value)?  $default,){
final _that = this;
switch (_that) {
case _SmsSettingsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String mode,  bool brevoAvailable,  SmsGatewayModel? gateway)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SmsSettingsModel() when $default != null:
return $default(_that.mode,_that.brevoAvailable,_that.gateway);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String mode,  bool brevoAvailable,  SmsGatewayModel? gateway)  $default,) {final _that = this;
switch (_that) {
case _SmsSettingsModel():
return $default(_that.mode,_that.brevoAvailable,_that.gateway);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String mode,  bool brevoAvailable,  SmsGatewayModel? gateway)?  $default,) {final _that = this;
switch (_that) {
case _SmsSettingsModel() when $default != null:
return $default(_that.mode,_that.brevoAvailable,_that.gateway);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SmsSettingsModel implements SmsSettingsModel {
  const _SmsSettingsModel({this.mode = 'none', this.brevoAvailable = false, this.gateway});
  factory _SmsSettingsModel.fromJson(Map<String, dynamic> json) => _$SmsSettingsModelFromJson(json);

@override@JsonKey() final  String mode;
@override@JsonKey() final  bool brevoAvailable;
@override final  SmsGatewayModel? gateway;

/// Create a copy of SmsSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SmsSettingsModelCopyWith<_SmsSettingsModel> get copyWith => __$SmsSettingsModelCopyWithImpl<_SmsSettingsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SmsSettingsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SmsSettingsModel&&(identical(other.mode, mode) || other.mode == mode)&&(identical(other.brevoAvailable, brevoAvailable) || other.brevoAvailable == brevoAvailable)&&(identical(other.gateway, gateway) || other.gateway == gateway));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,mode,brevoAvailable,gateway);
}

@override
String toString() {
    return 'SmsSettingsModel(mode: $mode, brevoAvailable: $brevoAvailable, gateway: $gateway)';
}


}

/// @nodoc
abstract mixin class _$SmsSettingsModelCopyWith<$Res> implements $SmsSettingsModelCopyWith<$Res> {
  factory _$SmsSettingsModelCopyWith(_SmsSettingsModel value, $Res Function(_SmsSettingsModel) _then) = __$SmsSettingsModelCopyWithImpl;
@override @useResult
$Res call({
 String mode, bool brevoAvailable, SmsGatewayModel? gateway
});


@override $SmsGatewayModelCopyWith<$Res>? get gateway;

}
/// @nodoc
class __$SmsSettingsModelCopyWithImpl<$Res>
    implements _$SmsSettingsModelCopyWith<$Res> {
  __$SmsSettingsModelCopyWithImpl(this._self, this._then);

  final _SmsSettingsModel _self;
  final $Res Function(_SmsSettingsModel) _then;

/// Create a copy of SmsSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? mode = null,Object? brevoAvailable = null,Object? gateway = freezed,}) {
  return _then(_SmsSettingsModel(
mode: null == mode ? _self.mode : mode // ignore: cast_nullable_to_non_nullable
as String,brevoAvailable: null == brevoAvailable ? _self.brevoAvailable : brevoAvailable // ignore: cast_nullable_to_non_nullable
as bool,gateway: freezed == gateway ? _self.gateway : gateway // ignore: cast_nullable_to_non_nullable
as SmsGatewayModel?,
  ));
}

/// Create a copy of SmsSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsGatewayModelCopyWith<$Res>? get gateway {
    if (_self.gateway == null) {
    return null;
  }

  return $SmsGatewayModelCopyWith<$Res>(_self.gateway!, (value) {
    return _then(_self.copyWith(gateway: value));
  });
}
}


/// @nodoc
mixin _$SmsMonthModel {

 int get sent; int get failed;
/// Create a copy of SmsMonthModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SmsMonthModelCopyWith<SmsMonthModel> get copyWith => _$SmsMonthModelCopyWithImpl<SmsMonthModel>(this as SmsMonthModel, _$identity);

  /// Serializes this SmsMonthModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SmsMonthModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SmsMonthModel&&(identical(other.sent, _this.sent) || other.sent == _this.sent)&&(identical(other.failed, _this.failed) || other.failed == _this.failed));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SmsMonthModel;
  return Object.hash(runtimeType,_this.sent,_this.failed);
}

@override
String toString() {
  final _this = this as SmsMonthModel;
  return 'SmsMonthModel(sent: ${_this.sent}, failed: ${_this.failed})';
}


}

/// @nodoc
abstract mixin class $SmsMonthModelCopyWith<$Res>  {
  factory $SmsMonthModelCopyWith(SmsMonthModel value, $Res Function(SmsMonthModel) _then) = _$SmsMonthModelCopyWithImpl;
@useResult
$Res call({
 int sent, int failed
});




}
/// @nodoc
class _$SmsMonthModelCopyWithImpl<$Res>
    implements $SmsMonthModelCopyWith<$Res> {
  _$SmsMonthModelCopyWithImpl(this._self, this._then);

  final SmsMonthModel _self;
  final $Res Function(SmsMonthModel) _then;

/// Create a copy of SmsMonthModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? sent = null,Object? failed = null,}) {
  return _then(SmsMonthModel(
sent: null == sent ? _self.sent : sent // ignore: cast_nullable_to_non_nullable
as int,failed: null == failed ? _self.failed : failed // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [SmsMonthModel].
extension SmsMonthModelPatterns on SmsMonthModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SmsMonthModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SmsMonthModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SmsMonthModel value)  $default,){
final _that = this;
switch (_that) {
case _SmsMonthModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SmsMonthModel value)?  $default,){
final _that = this;
switch (_that) {
case _SmsMonthModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int sent,  int failed)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SmsMonthModel() when $default != null:
return $default(_that.sent,_that.failed);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int sent,  int failed)  $default,) {final _that = this;
switch (_that) {
case _SmsMonthModel():
return $default(_that.sent,_that.failed);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int sent,  int failed)?  $default,) {final _that = this;
switch (_that) {
case _SmsMonthModel() when $default != null:
return $default(_that.sent,_that.failed);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SmsMonthModel implements SmsMonthModel {
  const _SmsMonthModel({this.sent = 0, this.failed = 0});
  factory _SmsMonthModel.fromJson(Map<String, dynamic> json) => _$SmsMonthModelFromJson(json);

@override@JsonKey() final  int sent;
@override@JsonKey() final  int failed;

/// Create a copy of SmsMonthModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SmsMonthModelCopyWith<_SmsMonthModel> get copyWith => __$SmsMonthModelCopyWithImpl<_SmsMonthModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SmsMonthModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SmsMonthModel&&(identical(other.sent, sent) || other.sent == sent)&&(identical(other.failed, failed) || other.failed == failed));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,sent,failed);
}

@override
String toString() {
    return 'SmsMonthModel(sent: $sent, failed: $failed)';
}


}

/// @nodoc
abstract mixin class _$SmsMonthModelCopyWith<$Res> implements $SmsMonthModelCopyWith<$Res> {
  factory _$SmsMonthModelCopyWith(_SmsMonthModel value, $Res Function(_SmsMonthModel) _then) = __$SmsMonthModelCopyWithImpl;
@override @useResult
$Res call({
 int sent, int failed
});




}
/// @nodoc
class __$SmsMonthModelCopyWithImpl<$Res>
    implements _$SmsMonthModelCopyWith<$Res> {
  __$SmsMonthModelCopyWithImpl(this._self, this._then);

  final _SmsMonthModel _self;
  final $Res Function(_SmsMonthModel) _then;

/// Create a copy of SmsMonthModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? sent = null,Object? failed = null,}) {
  return _then(_SmsMonthModel(
sent: null == sent ? _self.sent : sent // ignore: cast_nullable_to_non_nullable
as int,failed: null == failed ? _self.failed : failed // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$SmsStatusModel {

 String get mode; String? get linkedAt; String? get lastSentAt; String? get senderPhone; SmsMonthModel get month; int get pending; bool get pendingStale; String? get lastError;
/// Create a copy of SmsStatusModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SmsStatusModelCopyWith<SmsStatusModel> get copyWith => _$SmsStatusModelCopyWithImpl<SmsStatusModel>(this as SmsStatusModel, _$identity);

  /// Serializes this SmsStatusModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SmsStatusModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SmsStatusModel&&(identical(other.mode, _this.mode) || other.mode == _this.mode)&&(identical(other.linkedAt, _this.linkedAt) || other.linkedAt == _this.linkedAt)&&(identical(other.lastSentAt, _this.lastSentAt) || other.lastSentAt == _this.lastSentAt)&&(identical(other.senderPhone, _this.senderPhone) || other.senderPhone == _this.senderPhone)&&(identical(other.month, _this.month) || other.month == _this.month)&&(identical(other.pending, _this.pending) || other.pending == _this.pending)&&(identical(other.pendingStale, _this.pendingStale) || other.pendingStale == _this.pendingStale)&&(identical(other.lastError, _this.lastError) || other.lastError == _this.lastError));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SmsStatusModel;
  return Object.hash(runtimeType,_this.mode,_this.linkedAt,_this.lastSentAt,_this.senderPhone,_this.month,_this.pending,_this.pendingStale,_this.lastError);
}

@override
String toString() {
  final _this = this as SmsStatusModel;
  return 'SmsStatusModel(mode: ${_this.mode}, linkedAt: ${_this.linkedAt}, lastSentAt: ${_this.lastSentAt}, senderPhone: ${_this.senderPhone}, month: ${_this.month}, pending: ${_this.pending}, pendingStale: ${_this.pendingStale}, lastError: ${_this.lastError})';
}


}

/// @nodoc
abstract mixin class $SmsStatusModelCopyWith<$Res>  {
  factory $SmsStatusModelCopyWith(SmsStatusModel value, $Res Function(SmsStatusModel) _then) = _$SmsStatusModelCopyWithImpl;
@useResult
$Res call({
 String mode, String? linkedAt, String? lastSentAt, String? senderPhone, SmsMonthModel month, int pending, bool pendingStale, String? lastError
});


$SmsMonthModelCopyWith<$Res> get month;

}
/// @nodoc
class _$SmsStatusModelCopyWithImpl<$Res>
    implements $SmsStatusModelCopyWith<$Res> {
  _$SmsStatusModelCopyWithImpl(this._self, this._then);

  final SmsStatusModel _self;
  final $Res Function(SmsStatusModel) _then;

/// Create a copy of SmsStatusModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? mode = null,Object? linkedAt = freezed,Object? lastSentAt = freezed,Object? senderPhone = freezed,Object? month = null,Object? pending = null,Object? pendingStale = null,Object? lastError = freezed,}) {
  return _then(SmsStatusModel(
mode: null == mode ? _self.mode : mode // ignore: cast_nullable_to_non_nullable
as String,linkedAt: freezed == linkedAt ? _self.linkedAt : linkedAt // ignore: cast_nullable_to_non_nullable
as String?,lastSentAt: freezed == lastSentAt ? _self.lastSentAt : lastSentAt // ignore: cast_nullable_to_non_nullable
as String?,senderPhone: freezed == senderPhone ? _self.senderPhone : senderPhone // ignore: cast_nullable_to_non_nullable
as String?,month: null == month ? _self.month : month // ignore: cast_nullable_to_non_nullable
as SmsMonthModel,pending: null == pending ? _self.pending : pending // ignore: cast_nullable_to_non_nullable
as int,pendingStale: null == pendingStale ? _self.pendingStale : pendingStale // ignore: cast_nullable_to_non_nullable
as bool,lastError: freezed == lastError ? _self.lastError : lastError // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of SmsStatusModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsMonthModelCopyWith<$Res> get month {
  
  return $SmsMonthModelCopyWith<$Res>(_self.month, (value) {
    return _then(_self.copyWith(month: value));
  });
}
}


/// Adds pattern-matching-related methods to [SmsStatusModel].
extension SmsStatusModelPatterns on SmsStatusModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SmsStatusModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SmsStatusModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SmsStatusModel value)  $default,){
final _that = this;
switch (_that) {
case _SmsStatusModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SmsStatusModel value)?  $default,){
final _that = this;
switch (_that) {
case _SmsStatusModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String mode,  String? linkedAt,  String? lastSentAt,  String? senderPhone,  SmsMonthModel month,  int pending,  bool pendingStale,  String? lastError)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SmsStatusModel() when $default != null:
return $default(_that.mode,_that.linkedAt,_that.lastSentAt,_that.senderPhone,_that.month,_that.pending,_that.pendingStale,_that.lastError);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String mode,  String? linkedAt,  String? lastSentAt,  String? senderPhone,  SmsMonthModel month,  int pending,  bool pendingStale,  String? lastError)  $default,) {final _that = this;
switch (_that) {
case _SmsStatusModel():
return $default(_that.mode,_that.linkedAt,_that.lastSentAt,_that.senderPhone,_that.month,_that.pending,_that.pendingStale,_that.lastError);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String mode,  String? linkedAt,  String? lastSentAt,  String? senderPhone,  SmsMonthModel month,  int pending,  bool pendingStale,  String? lastError)?  $default,) {final _that = this;
switch (_that) {
case _SmsStatusModel() when $default != null:
return $default(_that.mode,_that.linkedAt,_that.lastSentAt,_that.senderPhone,_that.month,_that.pending,_that.pendingStale,_that.lastError);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SmsStatusModel implements SmsStatusModel {
  const _SmsStatusModel({this.mode = 'none', this.linkedAt, this.lastSentAt, this.senderPhone, this.month = const SmsMonthModel(), this.pending = 0, this.pendingStale = false, this.lastError});
  factory _SmsStatusModel.fromJson(Map<String, dynamic> json) => _$SmsStatusModelFromJson(json);

@override@JsonKey() final  String mode;
@override final  String? linkedAt;
@override final  String? lastSentAt;
@override final  String? senderPhone;
@override@JsonKey() final  SmsMonthModel month;
@override@JsonKey() final  int pending;
@override@JsonKey() final  bool pendingStale;
@override final  String? lastError;

/// Create a copy of SmsStatusModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SmsStatusModelCopyWith<_SmsStatusModel> get copyWith => __$SmsStatusModelCopyWithImpl<_SmsStatusModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SmsStatusModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SmsStatusModel&&(identical(other.mode, mode) || other.mode == mode)&&(identical(other.linkedAt, linkedAt) || other.linkedAt == linkedAt)&&(identical(other.lastSentAt, lastSentAt) || other.lastSentAt == lastSentAt)&&(identical(other.senderPhone, senderPhone) || other.senderPhone == senderPhone)&&(identical(other.month, month) || other.month == month)&&(identical(other.pending, pending) || other.pending == pending)&&(identical(other.pendingStale, pendingStale) || other.pendingStale == pendingStale)&&(identical(other.lastError, lastError) || other.lastError == lastError));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,mode,linkedAt,lastSentAt,senderPhone,month,pending,pendingStale,lastError);
}

@override
String toString() {
    return 'SmsStatusModel(mode: $mode, linkedAt: $linkedAt, lastSentAt: $lastSentAt, senderPhone: $senderPhone, month: $month, pending: $pending, pendingStale: $pendingStale, lastError: $lastError)';
}


}

/// @nodoc
abstract mixin class _$SmsStatusModelCopyWith<$Res> implements $SmsStatusModelCopyWith<$Res> {
  factory _$SmsStatusModelCopyWith(_SmsStatusModel value, $Res Function(_SmsStatusModel) _then) = __$SmsStatusModelCopyWithImpl;
@override @useResult
$Res call({
 String mode, String? linkedAt, String? lastSentAt, String? senderPhone, SmsMonthModel month, int pending, bool pendingStale, String? lastError
});


@override $SmsMonthModelCopyWith<$Res> get month;

}
/// @nodoc
class __$SmsStatusModelCopyWithImpl<$Res>
    implements _$SmsStatusModelCopyWith<$Res> {
  __$SmsStatusModelCopyWithImpl(this._self, this._then);

  final _SmsStatusModel _self;
  final $Res Function(_SmsStatusModel) _then;

/// Create a copy of SmsStatusModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? mode = null,Object? linkedAt = freezed,Object? lastSentAt = freezed,Object? senderPhone = freezed,Object? month = null,Object? pending = null,Object? pendingStale = null,Object? lastError = freezed,}) {
  return _then(_SmsStatusModel(
mode: null == mode ? _self.mode : mode // ignore: cast_nullable_to_non_nullable
as String,linkedAt: freezed == linkedAt ? _self.linkedAt : linkedAt // ignore: cast_nullable_to_non_nullable
as String?,lastSentAt: freezed == lastSentAt ? _self.lastSentAt : lastSentAt // ignore: cast_nullable_to_non_nullable
as String?,senderPhone: freezed == senderPhone ? _self.senderPhone : senderPhone // ignore: cast_nullable_to_non_nullable
as String?,month: null == month ? _self.month : month // ignore: cast_nullable_to_non_nullable
as SmsMonthModel,pending: null == pending ? _self.pending : pending // ignore: cast_nullable_to_non_nullable
as int,pendingStale: null == pendingStale ? _self.pendingStale : pendingStale // ignore: cast_nullable_to_non_nullable
as bool,lastError: freezed == lastError ? _self.lastError : lastError // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of SmsStatusModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SmsMonthModelCopyWith<$Res> get month {
  
  return $SmsMonthModelCopyWith<$Res>(_self.month, (value) {
    return _then(_self.copyWith(month: value));
  });
}
}


/// @nodoc
mixin _$SmsTestModel {

 String get outcome;
/// Create a copy of SmsTestModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SmsTestModelCopyWith<SmsTestModel> get copyWith => _$SmsTestModelCopyWithImpl<SmsTestModel>(this as SmsTestModel, _$identity);

  /// Serializes this SmsTestModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SmsTestModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SmsTestModel&&(identical(other.outcome, _this.outcome) || other.outcome == _this.outcome));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SmsTestModel;
  return Object.hash(runtimeType,_this.outcome);
}

@override
String toString() {
  final _this = this as SmsTestModel;
  return 'SmsTestModel(outcome: ${_this.outcome})';
}


}

/// @nodoc
abstract mixin class $SmsTestModelCopyWith<$Res>  {
  factory $SmsTestModelCopyWith(SmsTestModel value, $Res Function(SmsTestModel) _then) = _$SmsTestModelCopyWithImpl;
@useResult
$Res call({
 String outcome
});




}
/// @nodoc
class _$SmsTestModelCopyWithImpl<$Res>
    implements $SmsTestModelCopyWith<$Res> {
  _$SmsTestModelCopyWithImpl(this._self, this._then);

  final SmsTestModel _self;
  final $Res Function(SmsTestModel) _then;

/// Create a copy of SmsTestModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? outcome = null,}) {
  return _then(SmsTestModel(
outcome: null == outcome ? _self.outcome : outcome // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SmsTestModel].
extension SmsTestModelPatterns on SmsTestModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SmsTestModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SmsTestModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SmsTestModel value)  $default,){
final _that = this;
switch (_that) {
case _SmsTestModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SmsTestModel value)?  $default,){
final _that = this;
switch (_that) {
case _SmsTestModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String outcome)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SmsTestModel() when $default != null:
return $default(_that.outcome);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String outcome)  $default,) {final _that = this;
switch (_that) {
case _SmsTestModel():
return $default(_that.outcome);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String outcome)?  $default,) {final _that = this;
switch (_that) {
case _SmsTestModel() when $default != null:
return $default(_that.outcome);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SmsTestModel implements SmsTestModel {
  const _SmsTestModel({required this.outcome});
  factory _SmsTestModel.fromJson(Map<String, dynamic> json) => _$SmsTestModelFromJson(json);

@override final  String outcome;

/// Create a copy of SmsTestModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SmsTestModelCopyWith<_SmsTestModel> get copyWith => __$SmsTestModelCopyWithImpl<_SmsTestModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SmsTestModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SmsTestModel&&(identical(other.outcome, outcome) || other.outcome == outcome));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,outcome);
}

@override
String toString() {
    return 'SmsTestModel(outcome: $outcome)';
}


}

/// @nodoc
abstract mixin class _$SmsTestModelCopyWith<$Res> implements $SmsTestModelCopyWith<$Res> {
  factory _$SmsTestModelCopyWith(_SmsTestModel value, $Res Function(_SmsTestModel) _then) = __$SmsTestModelCopyWithImpl;
@override @useResult
$Res call({
 String outcome
});




}
/// @nodoc
class __$SmsTestModelCopyWithImpl<$Res>
    implements _$SmsTestModelCopyWith<$Res> {
  __$SmsTestModelCopyWithImpl(this._self, this._then);

  final _SmsTestModel _self;
  final $Res Function(_SmsTestModel) _then;

/// Create a copy of SmsTestModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? outcome = null,}) {
  return _then(_SmsTestModel(
outcome: null == outcome ? _self.outcome : outcome // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
