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

 String get id; String get name;/// First and last name (06/10/2026); `name` is the display form.
 String get firstName; String get lastName; String get email;/// manager, agent, driver, valet
 String get role; String? get operatorName;/// The post held today (R-C, 04/10/2026), null until chosen; among [allowedPosts].
 String? get post; DateTime? get postSetAt; String? get effectivePost; List<String> get allowedPosts;/// The shuttle taken for the day (V-A, 05/10/2026), null when none.
 TodayVehicleModel? get vehicle;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.firstName, _this.firstName) || other.firstName == _this.firstName)&&(identical(other.lastName, _this.lastName) || other.lastName == _this.lastName)&&(identical(other.email, _this.email) || other.email == _this.email)&&(identical(other.role, _this.role) || other.role == _this.role)&&(identical(other.operatorName, _this.operatorName) || other.operatorName == _this.operatorName)&&(identical(other.post, _this.post) || other.post == _this.post)&&(identical(other.postSetAt, _this.postSetAt) || other.postSetAt == _this.postSetAt)&&(identical(other.effectivePost, _this.effectivePost) || other.effectivePost == _this.effectivePost)&&const DeepCollectionEquality().equals(other.allowedPosts, _this.allowedPosts)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StaffModel;
  return Object.hash(runtimeType,_this.id,_this.name,_this.firstName,_this.lastName,_this.email,_this.role,_this.operatorName,_this.post,_this.postSetAt,_this.effectivePost,const DeepCollectionEquality().hash(_this.allowedPosts),_this.vehicle);
}

@override
String toString() {
  final _this = this as StaffModel;
  return 'StaffModel(id: ${_this.id}, name: ${_this.name}, firstName: ${_this.firstName}, lastName: ${_this.lastName}, email: ${_this.email}, role: ${_this.role}, operatorName: ${_this.operatorName}, post: ${_this.post}, postSetAt: ${_this.postSetAt}, effectivePost: ${_this.effectivePost}, allowedPosts: ${_this.allowedPosts}, vehicle: ${_this.vehicle})';
}


}

/// @nodoc
abstract mixin class $StaffModelCopyWith<$Res>  {
  factory $StaffModelCopyWith(StaffModel value, $Res Function(StaffModel) _then) = _$StaffModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, String firstName, String lastName, String email, String role, String? operatorName, String? post, DateTime? postSetAt, String? effectivePost, List<String> allowedPosts, TodayVehicleModel? vehicle
});


$TodayVehicleModelCopyWith<$Res>? get vehicle;

}
/// @nodoc
class _$StaffModelCopyWithImpl<$Res>
    implements $StaffModelCopyWith<$Res> {
  _$StaffModelCopyWithImpl(this._self, this._then);

  final StaffModel _self;
  final $Res Function(StaffModel) _then;

/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? firstName = null,Object? lastName = null,Object? email = null,Object? role = null,Object? operatorName = freezed,Object? post = freezed,Object? postSetAt = freezed,Object? effectivePost = freezed,Object? allowedPosts = null,Object? vehicle = freezed,}) {
  return _then(StaffModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,operatorName: freezed == operatorName ? _self.operatorName : operatorName // ignore: cast_nullable_to_non_nullable
as String?,post: freezed == post ? _self.post : post // ignore: cast_nullable_to_non_nullable
as String?,postSetAt: freezed == postSetAt ? _self.postSetAt : postSetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,effectivePost: freezed == effectivePost ? _self.effectivePost : effectivePost // ignore: cast_nullable_to_non_nullable
as String?,allowedPosts: null == allowedPosts ? _self.allowedPosts : allowedPosts // ignore: cast_nullable_to_non_nullable
as List<String>,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TodayVehicleModel?,
  ));
}
/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TodayVehicleModelCopyWith<$Res>? get vehicle {
    if (_self.vehicle == null) {
    return null;
  }

  return $TodayVehicleModelCopyWith<$Res>(_self.vehicle!, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String firstName,  String lastName,  String email,  String role,  String? operatorName,  String? post,  DateTime? postSetAt,  String? effectivePost,  List<String> allowedPosts,  TodayVehicleModel? vehicle)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffModel() when $default != null:
return $default(_that.id,_that.name,_that.firstName,_that.lastName,_that.email,_that.role,_that.operatorName,_that.post,_that.postSetAt,_that.effectivePost,_that.allowedPosts,_that.vehicle);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String firstName,  String lastName,  String email,  String role,  String? operatorName,  String? post,  DateTime? postSetAt,  String? effectivePost,  List<String> allowedPosts,  TodayVehicleModel? vehicle)  $default,) {final _that = this;
switch (_that) {
case _StaffModel():
return $default(_that.id,_that.name,_that.firstName,_that.lastName,_that.email,_that.role,_that.operatorName,_that.post,_that.postSetAt,_that.effectivePost,_that.allowedPosts,_that.vehicle);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String firstName,  String lastName,  String email,  String role,  String? operatorName,  String? post,  DateTime? postSetAt,  String? effectivePost,  List<String> allowedPosts,  TodayVehicleModel? vehicle)?  $default,) {final _that = this;
switch (_that) {
case _StaffModel() when $default != null:
return $default(_that.id,_that.name,_that.firstName,_that.lastName,_that.email,_that.role,_that.operatorName,_that.post,_that.postSetAt,_that.effectivePost,_that.allowedPosts,_that.vehicle);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StaffModel extends StaffModel {
  const _StaffModel({required this.id, required this.name, this.firstName = '', this.lastName = '', required this.email, required this.role, this.operatorName, this.post, this.postSetAt, this.effectivePost,  List<String> allowedPosts = const [], this.vehicle}): _allowedPosts = allowedPosts,super._();
  factory _StaffModel.fromJson(Map<String, dynamic> json) => _$StaffModelFromJson(json);

@override final  String id;
@override final  String name;
/// First and last name (06/10/2026); `name` is the display form.
@override@JsonKey() final  String firstName;
@override@JsonKey() final  String lastName;
@override final  String email;
/// manager, agent, driver, valet
@override final  String role;
@override final  String? operatorName;
/// The post held today (R-C, 04/10/2026), null until chosen; among [allowedPosts].
@override final  String? post;
@override final  DateTime? postSetAt;
@override final  String? effectivePost;
 final  List<String> _allowedPosts;
@override@JsonKey() List<String> get allowedPosts {
  if (_allowedPosts is EqualUnmodifiableListView) return _allowedPosts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_allowedPosts);
}

/// The shuttle taken for the day (V-A, 05/10/2026), null when none.
@override final  TodayVehicleModel? vehicle;

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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.email, email) || other.email == email)&&(identical(other.role, role) || other.role == role)&&(identical(other.operatorName, operatorName) || other.operatorName == operatorName)&&(identical(other.post, post) || other.post == post)&&(identical(other.postSetAt, postSetAt) || other.postSetAt == postSetAt)&&(identical(other.effectivePost, effectivePost) || other.effectivePost == effectivePost)&&const DeepCollectionEquality().equals(other.allowedPosts, _allowedPosts)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name,firstName,lastName,email,role,operatorName,post,postSetAt,effectivePost,const DeepCollectionEquality().hash(_allowedPosts),vehicle);
}

@override
String toString() {
    return 'StaffModel(id: $id, name: $name, firstName: $firstName, lastName: $lastName, email: $email, role: $role, operatorName: $operatorName, post: $post, postSetAt: $postSetAt, effectivePost: $effectivePost, allowedPosts: $allowedPosts, vehicle: $vehicle)';
}


}

/// @nodoc
abstract mixin class _$StaffModelCopyWith<$Res> implements $StaffModelCopyWith<$Res> {
  factory _$StaffModelCopyWith(_StaffModel value, $Res Function(_StaffModel) _then) = __$StaffModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String firstName, String lastName, String email, String role, String? operatorName, String? post, DateTime? postSetAt, String? effectivePost, List<String> allowedPosts, TodayVehicleModel? vehicle
});


@override $TodayVehicleModelCopyWith<$Res>? get vehicle;

}
/// @nodoc
class __$StaffModelCopyWithImpl<$Res>
    implements _$StaffModelCopyWith<$Res> {
  __$StaffModelCopyWithImpl(this._self, this._then);

  final _StaffModel _self;
  final $Res Function(_StaffModel) _then;

/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? firstName = null,Object? lastName = null,Object? email = null,Object? role = null,Object? operatorName = freezed,Object? post = freezed,Object? postSetAt = freezed,Object? effectivePost = freezed,Object? allowedPosts = null,Object? vehicle = freezed,}) {
  return _then(_StaffModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,operatorName: freezed == operatorName ? _self.operatorName : operatorName // ignore: cast_nullable_to_non_nullable
as String?,post: freezed == post ? _self.post : post // ignore: cast_nullable_to_non_nullable
as String?,postSetAt: freezed == postSetAt ? _self.postSetAt : postSetAt // ignore: cast_nullable_to_non_nullable
as DateTime?,effectivePost: freezed == effectivePost ? _self.effectivePost : effectivePost // ignore: cast_nullable_to_non_nullable
as String?,allowedPosts: null == allowedPosts ? _self._allowedPosts : allowedPosts // ignore: cast_nullable_to_non_nullable
as List<String>,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TodayVehicleModel?,
  ));
}

/// Create a copy of StaffModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TodayVehicleModelCopyWith<$Res>? get vehicle {
    if (_self.vehicle == null) {
    return null;
  }

  return $TodayVehicleModelCopyWith<$Res>(_self.vehicle!, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}
}


/// @nodoc
mixin _$TodayVehicleModel {

 String get id; String get model; String? get colour; String? get plate; int? get seats;
/// Create a copy of TodayVehicleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TodayVehicleModelCopyWith<TodayVehicleModel> get copyWith => _$TodayVehicleModelCopyWithImpl<TodayVehicleModel>(this as TodayVehicleModel, _$identity);

  /// Serializes this TodayVehicleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TodayVehicleModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TodayVehicleModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.model, _this.model) || other.model == _this.model)&&(identical(other.colour, _this.colour) || other.colour == _this.colour)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.seats, _this.seats) || other.seats == _this.seats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TodayVehicleModel;
  return Object.hash(runtimeType,_this.id,_this.model,_this.colour,_this.plate,_this.seats);
}

@override
String toString() {
  final _this = this as TodayVehicleModel;
  return 'TodayVehicleModel(id: ${_this.id}, model: ${_this.model}, colour: ${_this.colour}, plate: ${_this.plate}, seats: ${_this.seats})';
}


}

/// @nodoc
abstract mixin class $TodayVehicleModelCopyWith<$Res>  {
  factory $TodayVehicleModelCopyWith(TodayVehicleModel value, $Res Function(TodayVehicleModel) _then) = _$TodayVehicleModelCopyWithImpl;
@useResult
$Res call({
 String id, String model, String? colour, String? plate, int? seats
});




}
/// @nodoc
class _$TodayVehicleModelCopyWithImpl<$Res>
    implements $TodayVehicleModelCopyWith<$Res> {
  _$TodayVehicleModelCopyWithImpl(this._self, this._then);

  final TodayVehicleModel _self;
  final $Res Function(TodayVehicleModel) _then;

/// Create a copy of TodayVehicleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? model = null,Object? colour = freezed,Object? plate = freezed,Object? seats = freezed,}) {
  return _then(TodayVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,model: null == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [TodayVehicleModel].
extension TodayVehicleModelPatterns on TodayVehicleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TodayVehicleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TodayVehicleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TodayVehicleModel value)  $default,){
final _that = this;
switch (_that) {
case _TodayVehicleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TodayVehicleModel value)?  $default,){
final _that = this;
switch (_that) {
case _TodayVehicleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String model,  String? colour,  String? plate,  int? seats)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TodayVehicleModel() when $default != null:
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String model,  String? colour,  String? plate,  int? seats)  $default,) {final _that = this;
switch (_that) {
case _TodayVehicleModel():
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String model,  String? colour,  String? plate,  int? seats)?  $default,) {final _that = this;
switch (_that) {
case _TodayVehicleModel() when $default != null:
return $default(_that.id,_that.model,_that.colour,_that.plate,_that.seats);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TodayVehicleModel extends TodayVehicleModel {
  const _TodayVehicleModel({required this.id, required this.model, this.colour, this.plate, this.seats}): super._();
  factory _TodayVehicleModel.fromJson(Map<String, dynamic> json) => _$TodayVehicleModelFromJson(json);

@override final  String id;
@override final  String model;
@override final  String? colour;
@override final  String? plate;
@override final  int? seats;

/// Create a copy of TodayVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TodayVehicleModelCopyWith<_TodayVehicleModel> get copyWith => __$TodayVehicleModelCopyWithImpl<_TodayVehicleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TodayVehicleModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TodayVehicleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.model, model) || other.model == model)&&(identical(other.colour, colour) || other.colour == colour)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.seats, seats) || other.seats == seats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,model,colour,plate,seats);
}

@override
String toString() {
    return 'TodayVehicleModel(id: $id, model: $model, colour: $colour, plate: $plate, seats: $seats)';
}


}

/// @nodoc
abstract mixin class _$TodayVehicleModelCopyWith<$Res> implements $TodayVehicleModelCopyWith<$Res> {
  factory _$TodayVehicleModelCopyWith(_TodayVehicleModel value, $Res Function(_TodayVehicleModel) _then) = __$TodayVehicleModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String model, String? colour, String? plate, int? seats
});




}
/// @nodoc
class __$TodayVehicleModelCopyWithImpl<$Res>
    implements _$TodayVehicleModelCopyWith<$Res> {
  __$TodayVehicleModelCopyWithImpl(this._self, this._then);

  final _TodayVehicleModel _self;
  final $Res Function(_TodayVehicleModel) _then;

/// Create a copy of TodayVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? model = null,Object? colour = freezed,Object? plate = freezed,Object? seats = freezed,}) {
  return _then(_TodayVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,model: null == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,seats: freezed == seats ? _self.seats : seats // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}

// dart format on
