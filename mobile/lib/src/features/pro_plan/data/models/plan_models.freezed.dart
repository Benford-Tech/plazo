// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'plan_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ParkingSummaryModel {

 String get id; String get name; int get totalCapacity;
/// Create a copy of ParkingSummaryModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingSummaryModelCopyWith<ParkingSummaryModel> get copyWith => _$ParkingSummaryModelCopyWithImpl<ParkingSummaryModel>(this as ParkingSummaryModel, _$identity);

  /// Serializes this ParkingSummaryModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ParkingSummaryModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingSummaryModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.totalCapacity, _this.totalCapacity) || other.totalCapacity == _this.totalCapacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ParkingSummaryModel;
  return Object.hash(runtimeType,_this.id,_this.name,_this.totalCapacity);
}

@override
String toString() {
  final _this = this as ParkingSummaryModel;
  return 'ParkingSummaryModel(id: ${_this.id}, name: ${_this.name}, totalCapacity: ${_this.totalCapacity})';
}


}

/// @nodoc
abstract mixin class $ParkingSummaryModelCopyWith<$Res>  {
  factory $ParkingSummaryModelCopyWith(ParkingSummaryModel value, $Res Function(ParkingSummaryModel) _then) = _$ParkingSummaryModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, int totalCapacity
});




}
/// @nodoc
class _$ParkingSummaryModelCopyWithImpl<$Res>
    implements $ParkingSummaryModelCopyWith<$Res> {
  _$ParkingSummaryModelCopyWithImpl(this._self, this._then);

  final ParkingSummaryModel _self;
  final $Res Function(ParkingSummaryModel) _then;

/// Create a copy of ParkingSummaryModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? totalCapacity = null,}) {
  return _then(ParkingSummaryModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,totalCapacity: null == totalCapacity ? _self.totalCapacity : totalCapacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [ParkingSummaryModel].
extension ParkingSummaryModelPatterns on ParkingSummaryModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingSummaryModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingSummaryModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingSummaryModel value)  $default,){
final _that = this;
switch (_that) {
case _ParkingSummaryModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingSummaryModel value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingSummaryModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  int totalCapacity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingSummaryModel() when $default != null:
return $default(_that.id,_that.name,_that.totalCapacity);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  int totalCapacity)  $default,) {final _that = this;
switch (_that) {
case _ParkingSummaryModel():
return $default(_that.id,_that.name,_that.totalCapacity);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  int totalCapacity)?  $default,) {final _that = this;
switch (_that) {
case _ParkingSummaryModel() when $default != null:
return $default(_that.id,_that.name,_that.totalCapacity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ParkingSummaryModel implements ParkingSummaryModel {
  const _ParkingSummaryModel({required this.id, required this.name, required this.totalCapacity});
  factory _ParkingSummaryModel.fromJson(Map<String, dynamic> json) => _$ParkingSummaryModelFromJson(json);

@override final  String id;
@override final  String name;
@override final  int totalCapacity;

/// Create a copy of ParkingSummaryModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingSummaryModelCopyWith<_ParkingSummaryModel> get copyWith => __$ParkingSummaryModelCopyWithImpl<_ParkingSummaryModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ParkingSummaryModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingSummaryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.totalCapacity, totalCapacity) || other.totalCapacity == totalCapacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name,totalCapacity);
}

@override
String toString() {
    return 'ParkingSummaryModel(id: $id, name: $name, totalCapacity: $totalCapacity)';
}


}

/// @nodoc
abstract mixin class _$ParkingSummaryModelCopyWith<$Res> implements $ParkingSummaryModelCopyWith<$Res> {
  factory _$ParkingSummaryModelCopyWith(_ParkingSummaryModel value, $Res Function(_ParkingSummaryModel) _then) = __$ParkingSummaryModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, int totalCapacity
});




}
/// @nodoc
class __$ParkingSummaryModelCopyWithImpl<$Res>
    implements _$ParkingSummaryModelCopyWith<$Res> {
  __$ParkingSummaryModelCopyWithImpl(this._self, this._then);

  final _ParkingSummaryModel _self;
  final $Res Function(_ParkingSummaryModel) _then;

/// Create a copy of ParkingSummaryModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? totalCapacity = null,}) {
  return _then(_ParkingSummaryModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,totalCapacity: null == totalCapacity ? _self.totalCapacity : totalCapacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$ParkingPlanModel {

 String get id; String get parkingId; Map<String, dynamic>? get outline; List<Map<String, dynamic>> get zones; List<Map<String, dynamic>> get landmarks; String? get layout; String? get generatedAt;
/// Create a copy of ParkingPlanModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingPlanModelCopyWith<ParkingPlanModel> get copyWith => _$ParkingPlanModelCopyWithImpl<ParkingPlanModel>(this as ParkingPlanModel, _$identity);

  /// Serializes this ParkingPlanModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ParkingPlanModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingPlanModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.parkingId, _this.parkingId) || other.parkingId == _this.parkingId)&&const DeepCollectionEquality().equals(other.outline, _this.outline)&&const DeepCollectionEquality().equals(other.zones, _this.zones)&&const DeepCollectionEquality().equals(other.landmarks, _this.landmarks)&&(identical(other.layout, _this.layout) || other.layout == _this.layout)&&(identical(other.generatedAt, _this.generatedAt) || other.generatedAt == _this.generatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ParkingPlanModel;
  return Object.hash(runtimeType,_this.id,_this.parkingId,const DeepCollectionEquality().hash(_this.outline),const DeepCollectionEquality().hash(_this.zones),const DeepCollectionEquality().hash(_this.landmarks),_this.layout,_this.generatedAt);
}

@override
String toString() {
  final _this = this as ParkingPlanModel;
  return 'ParkingPlanModel(id: ${_this.id}, parkingId: ${_this.parkingId}, outline: ${_this.outline}, zones: ${_this.zones}, landmarks: ${_this.landmarks}, layout: ${_this.layout}, generatedAt: ${_this.generatedAt})';
}


}

/// @nodoc
abstract mixin class $ParkingPlanModelCopyWith<$Res>  {
  factory $ParkingPlanModelCopyWith(ParkingPlanModel value, $Res Function(ParkingPlanModel) _then) = _$ParkingPlanModelCopyWithImpl;
@useResult
$Res call({
 String id, String parkingId, Map<String, dynamic>? outline, List<Map<String, dynamic>> zones, List<Map<String, dynamic>> landmarks, String? layout, String? generatedAt
});




}
/// @nodoc
class _$ParkingPlanModelCopyWithImpl<$Res>
    implements $ParkingPlanModelCopyWith<$Res> {
  _$ParkingPlanModelCopyWithImpl(this._self, this._then);

  final ParkingPlanModel _self;
  final $Res Function(ParkingPlanModel) _then;

/// Create a copy of ParkingPlanModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? parkingId = null,Object? outline = freezed,Object? zones = null,Object? landmarks = null,Object? layout = freezed,Object? generatedAt = freezed,}) {
  return _then(ParkingPlanModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,parkingId: null == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String,outline: freezed == outline ? _self.outline : outline // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,zones: null == zones ? _self.zones : zones // ignore: cast_nullable_to_non_nullable
as List<Map<String, dynamic>>,landmarks: null == landmarks ? _self.landmarks : landmarks // ignore: cast_nullable_to_non_nullable
as List<Map<String, dynamic>>,layout: freezed == layout ? _self.layout : layout // ignore: cast_nullable_to_non_nullable
as String?,generatedAt: freezed == generatedAt ? _self.generatedAt : generatedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ParkingPlanModel].
extension ParkingPlanModelPatterns on ParkingPlanModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingPlanModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingPlanModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingPlanModel value)  $default,){
final _that = this;
switch (_that) {
case _ParkingPlanModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingPlanModel value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingPlanModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String parkingId,  Map<String, dynamic>? outline,  List<Map<String, dynamic>> zones,  List<Map<String, dynamic>> landmarks,  String? layout,  String? generatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingPlanModel() when $default != null:
return $default(_that.id,_that.parkingId,_that.outline,_that.zones,_that.landmarks,_that.layout,_that.generatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String parkingId,  Map<String, dynamic>? outline,  List<Map<String, dynamic>> zones,  List<Map<String, dynamic>> landmarks,  String? layout,  String? generatedAt)  $default,) {final _that = this;
switch (_that) {
case _ParkingPlanModel():
return $default(_that.id,_that.parkingId,_that.outline,_that.zones,_that.landmarks,_that.layout,_that.generatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String parkingId,  Map<String, dynamic>? outline,  List<Map<String, dynamic>> zones,  List<Map<String, dynamic>> landmarks,  String? layout,  String? generatedAt)?  $default,) {final _that = this;
switch (_that) {
case _ParkingPlanModel() when $default != null:
return $default(_that.id,_that.parkingId,_that.outline,_that.zones,_that.landmarks,_that.layout,_that.generatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ParkingPlanModel implements ParkingPlanModel {
  const _ParkingPlanModel({required this.id, required this.parkingId,  Map<String, dynamic>? outline,  List<Map<String, dynamic>> zones = const [],  List<Map<String, dynamic>> landmarks = const [], this.layout, this.generatedAt}): _outline = outline,_zones = zones,_landmarks = landmarks;
  factory _ParkingPlanModel.fromJson(Map<String, dynamic> json) => _$ParkingPlanModelFromJson(json);

@override final  String id;
@override final  String parkingId;
 final  Map<String, dynamic>? _outline;
@override Map<String, dynamic>? get outline {
  final value = _outline;
  if (value == null) return null;
  if (_outline is EqualUnmodifiableMapView) return _outline;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

 final  List<Map<String, dynamic>> _zones;
@override@JsonKey() List<Map<String, dynamic>> get zones {
  if (_zones is EqualUnmodifiableListView) return _zones;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_zones);
}

 final  List<Map<String, dynamic>> _landmarks;
@override@JsonKey() List<Map<String, dynamic>> get landmarks {
  if (_landmarks is EqualUnmodifiableListView) return _landmarks;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_landmarks);
}

@override final  String? layout;
@override final  String? generatedAt;

/// Create a copy of ParkingPlanModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingPlanModelCopyWith<_ParkingPlanModel> get copyWith => __$ParkingPlanModelCopyWithImpl<_ParkingPlanModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ParkingPlanModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingPlanModel&&(identical(other.id, id) || other.id == id)&&(identical(other.parkingId, parkingId) || other.parkingId == parkingId)&&const DeepCollectionEquality().equals(other.outline, _outline)&&const DeepCollectionEquality().equals(other.zones, _zones)&&const DeepCollectionEquality().equals(other.landmarks, _landmarks)&&(identical(other.layout, layout) || other.layout == layout)&&(identical(other.generatedAt, generatedAt) || other.generatedAt == generatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,parkingId,const DeepCollectionEquality().hash(_outline),const DeepCollectionEquality().hash(_zones),const DeepCollectionEquality().hash(_landmarks),layout,generatedAt);
}

@override
String toString() {
    return 'ParkingPlanModel(id: $id, parkingId: $parkingId, outline: $outline, zones: $zones, landmarks: $landmarks, layout: $layout, generatedAt: $generatedAt)';
}


}

/// @nodoc
abstract mixin class _$ParkingPlanModelCopyWith<$Res> implements $ParkingPlanModelCopyWith<$Res> {
  factory _$ParkingPlanModelCopyWith(_ParkingPlanModel value, $Res Function(_ParkingPlanModel) _then) = __$ParkingPlanModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String parkingId, Map<String, dynamic>? outline, List<Map<String, dynamic>> zones, List<Map<String, dynamic>> landmarks, String? layout, String? generatedAt
});




}
/// @nodoc
class __$ParkingPlanModelCopyWithImpl<$Res>
    implements _$ParkingPlanModelCopyWith<$Res> {
  __$ParkingPlanModelCopyWithImpl(this._self, this._then);

  final _ParkingPlanModel _self;
  final $Res Function(_ParkingPlanModel) _then;

/// Create a copy of ParkingPlanModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? parkingId = null,Object? outline = freezed,Object? zones = null,Object? landmarks = null,Object? layout = freezed,Object? generatedAt = freezed,}) {
  return _then(_ParkingPlanModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,parkingId: null == parkingId ? _self.parkingId : parkingId // ignore: cast_nullable_to_non_nullable
as String,outline: freezed == outline ? _self._outline : outline // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,zones: null == zones ? _self._zones : zones // ignore: cast_nullable_to_non_nullable
as List<Map<String, dynamic>>,landmarks: null == landmarks ? _self._landmarks : landmarks // ignore: cast_nullable_to_non_nullable
as List<Map<String, dynamic>>,layout: freezed == layout ? _self.layout : layout // ignore: cast_nullable_to_non_nullable
as String?,generatedAt: freezed == generatedAt ? _self.generatedAt : generatedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$SpotModel {

 String get id; String get code; int get row; int get index; String get kind; bool get active; String? get stayClass;/// Closed ring, [lon, lat] × 5.
 List<List<double>> get geometry;
/// Create a copy of SpotModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SpotModelCopyWith<SpotModel> get copyWith => _$SpotModelCopyWithImpl<SpotModel>(this as SpotModel, _$identity);

  /// Serializes this SpotModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SpotModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SpotModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.row, _this.row) || other.row == _this.row)&&(identical(other.index, _this.index) || other.index == _this.index)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.active, _this.active) || other.active == _this.active)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass)&&const DeepCollectionEquality().equals(other.geometry, _this.geometry));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SpotModel;
  return Object.hash(runtimeType,_this.id,_this.code,_this.row,_this.index,_this.kind,_this.active,_this.stayClass,const DeepCollectionEquality().hash(_this.geometry));
}

@override
String toString() {
  final _this = this as SpotModel;
  return 'SpotModel(id: ${_this.id}, code: ${_this.code}, row: ${_this.row}, index: ${_this.index}, kind: ${_this.kind}, active: ${_this.active}, stayClass: ${_this.stayClass}, geometry: ${_this.geometry})';
}


}

/// @nodoc
abstract mixin class $SpotModelCopyWith<$Res>  {
  factory $SpotModelCopyWith(SpotModel value, $Res Function(SpotModel) _then) = _$SpotModelCopyWithImpl;
@useResult
$Res call({
 String id, String code, int row, int index, String kind, bool active, String? stayClass, List<List<double>> geometry
});




}
/// @nodoc
class _$SpotModelCopyWithImpl<$Res>
    implements $SpotModelCopyWith<$Res> {
  _$SpotModelCopyWithImpl(this._self, this._then);

  final SpotModel _self;
  final $Res Function(SpotModel) _then;

/// Create a copy of SpotModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? stayClass = freezed,Object? geometry = null,}) {
  return _then(SpotModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,geometry: null == geometry ? _self.geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,
  ));
}

}


/// Adds pattern-matching-related methods to [SpotModel].
extension SpotModelPatterns on SpotModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SpotModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SpotModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SpotModel value)  $default,){
final _that = this;
switch (_that) {
case _SpotModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SpotModel value)?  $default,){
final _that = this;
switch (_that) {
case _SpotModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  int row,  int index,  String kind,  bool active,  String? stayClass,  List<List<double>> geometry)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SpotModel() when $default != null:
return $default(_that.id,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.stayClass,_that.geometry);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  int row,  int index,  String kind,  bool active,  String? stayClass,  List<List<double>> geometry)  $default,) {final _that = this;
switch (_that) {
case _SpotModel():
return $default(_that.id,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.stayClass,_that.geometry);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  int row,  int index,  String kind,  bool active,  String? stayClass,  List<List<double>> geometry)?  $default,) {final _that = this;
switch (_that) {
case _SpotModel() when $default != null:
return $default(_that.id,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.stayClass,_that.geometry);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SpotModel implements SpotModel {
  const _SpotModel({required this.id, required this.code, required this.row, required this.index, required this.kind, required this.active, this.stayClass, required  List<List<double>> geometry}): _geometry = geometry;
  factory _SpotModel.fromJson(Map<String, dynamic> json) => _$SpotModelFromJson(json);

@override final  String id;
@override final  String code;
@override final  int row;
@override final  int index;
@override final  String kind;
@override final  bool active;
@override final  String? stayClass;
/// Closed ring, [lon, lat] × 5.
 final  List<List<double>> _geometry;
/// Closed ring, [lon, lat] × 5.
@override List<List<double>> get geometry {
  if (_geometry is EqualUnmodifiableListView) return _geometry;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_geometry);
}


/// Create a copy of SpotModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SpotModelCopyWith<_SpotModel> get copyWith => __$SpotModelCopyWithImpl<_SpotModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SpotModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SpotModel&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.row, row) || other.row == row)&&(identical(other.index, index) || other.index == index)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.active, active) || other.active == active)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass)&&const DeepCollectionEquality().equals(other.geometry, _geometry));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,code,row,index,kind,active,stayClass,const DeepCollectionEquality().hash(_geometry));
}

@override
String toString() {
    return 'SpotModel(id: $id, code: $code, row: $row, index: $index, kind: $kind, active: $active, stayClass: $stayClass, geometry: $geometry)';
}


}

/// @nodoc
abstract mixin class _$SpotModelCopyWith<$Res> implements $SpotModelCopyWith<$Res> {
  factory _$SpotModelCopyWith(_SpotModel value, $Res Function(_SpotModel) _then) = __$SpotModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, int row, int index, String kind, bool active, String? stayClass, List<List<double>> geometry
});




}
/// @nodoc
class __$SpotModelCopyWithImpl<$Res>
    implements _$SpotModelCopyWith<$Res> {
  __$SpotModelCopyWithImpl(this._self, this._then);

  final _SpotModel _self;
  final $Res Function(_SpotModel) _then;

/// Create a copy of SpotModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? stayClass = freezed,Object? geometry = null,}) {
  return _then(_SpotModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,geometry: null == geometry ? _self._geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,
  ));
}


}


/// @nodoc
mixin _$ParkingPlanViewModel {

 ParkingPlanModel get plan; List<SpotModel> get spots; int get activeSpots; int get totalCapacity;
/// Create a copy of ParkingPlanViewModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingPlanViewModelCopyWith<ParkingPlanViewModel> get copyWith => _$ParkingPlanViewModelCopyWithImpl<ParkingPlanViewModel>(this as ParkingPlanViewModel, _$identity);

  /// Serializes this ParkingPlanViewModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ParkingPlanViewModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingPlanViewModel&&(identical(other.plan, _this.plan) || other.plan == _this.plan)&&const DeepCollectionEquality().equals(other.spots, _this.spots)&&(identical(other.activeSpots, _this.activeSpots) || other.activeSpots == _this.activeSpots)&&(identical(other.totalCapacity, _this.totalCapacity) || other.totalCapacity == _this.totalCapacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ParkingPlanViewModel;
  return Object.hash(runtimeType,_this.plan,const DeepCollectionEquality().hash(_this.spots),_this.activeSpots,_this.totalCapacity);
}

@override
String toString() {
  final _this = this as ParkingPlanViewModel;
  return 'ParkingPlanViewModel(plan: ${_this.plan}, spots: ${_this.spots}, activeSpots: ${_this.activeSpots}, totalCapacity: ${_this.totalCapacity})';
}


}

/// @nodoc
abstract mixin class $ParkingPlanViewModelCopyWith<$Res>  {
  factory $ParkingPlanViewModelCopyWith(ParkingPlanViewModel value, $Res Function(ParkingPlanViewModel) _then) = _$ParkingPlanViewModelCopyWithImpl;
@useResult
$Res call({
 ParkingPlanModel plan, List<SpotModel> spots, int activeSpots, int totalCapacity
});


$ParkingPlanModelCopyWith<$Res> get plan;

}
/// @nodoc
class _$ParkingPlanViewModelCopyWithImpl<$Res>
    implements $ParkingPlanViewModelCopyWith<$Res> {
  _$ParkingPlanViewModelCopyWithImpl(this._self, this._then);

  final ParkingPlanViewModel _self;
  final $Res Function(ParkingPlanViewModel) _then;

/// Create a copy of ParkingPlanViewModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? plan = null,Object? spots = null,Object? activeSpots = null,Object? totalCapacity = null,}) {
  return _then(ParkingPlanViewModel(
plan: null == plan ? _self.plan : plan // ignore: cast_nullable_to_non_nullable
as ParkingPlanModel,spots: null == spots ? _self.spots : spots // ignore: cast_nullable_to_non_nullable
as List<SpotModel>,activeSpots: null == activeSpots ? _self.activeSpots : activeSpots // ignore: cast_nullable_to_non_nullable
as int,totalCapacity: null == totalCapacity ? _self.totalCapacity : totalCapacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}
/// Create a copy of ParkingPlanViewModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingPlanModelCopyWith<$Res> get plan {
  
  return $ParkingPlanModelCopyWith<$Res>(_self.plan, (value) {
    return _then(_self.copyWith(plan: value));
  });
}
}


/// Adds pattern-matching-related methods to [ParkingPlanViewModel].
extension ParkingPlanViewModelPatterns on ParkingPlanViewModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingPlanViewModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingPlanViewModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingPlanViewModel value)  $default,){
final _that = this;
switch (_that) {
case _ParkingPlanViewModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingPlanViewModel value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingPlanViewModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ParkingPlanModel plan,  List<SpotModel> spots,  int activeSpots,  int totalCapacity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingPlanViewModel() when $default != null:
return $default(_that.plan,_that.spots,_that.activeSpots,_that.totalCapacity);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ParkingPlanModel plan,  List<SpotModel> spots,  int activeSpots,  int totalCapacity)  $default,) {final _that = this;
switch (_that) {
case _ParkingPlanViewModel():
return $default(_that.plan,_that.spots,_that.activeSpots,_that.totalCapacity);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ParkingPlanModel plan,  List<SpotModel> spots,  int activeSpots,  int totalCapacity)?  $default,) {final _that = this;
switch (_that) {
case _ParkingPlanViewModel() when $default != null:
return $default(_that.plan,_that.spots,_that.activeSpots,_that.totalCapacity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ParkingPlanViewModel implements ParkingPlanViewModel {
  const _ParkingPlanViewModel({required this.plan,  List<SpotModel> spots = const [], required this.activeSpots, required this.totalCapacity}): _spots = spots;
  factory _ParkingPlanViewModel.fromJson(Map<String, dynamic> json) => _$ParkingPlanViewModelFromJson(json);

@override final  ParkingPlanModel plan;
 final  List<SpotModel> _spots;
@override@JsonKey() List<SpotModel> get spots {
  if (_spots is EqualUnmodifiableListView) return _spots;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_spots);
}

@override final  int activeSpots;
@override final  int totalCapacity;

/// Create a copy of ParkingPlanViewModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingPlanViewModelCopyWith<_ParkingPlanViewModel> get copyWith => __$ParkingPlanViewModelCopyWithImpl<_ParkingPlanViewModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ParkingPlanViewModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingPlanViewModel&&(identical(other.plan, plan) || other.plan == plan)&&const DeepCollectionEquality().equals(other.spots, _spots)&&(identical(other.activeSpots, activeSpots) || other.activeSpots == activeSpots)&&(identical(other.totalCapacity, totalCapacity) || other.totalCapacity == totalCapacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,plan,const DeepCollectionEquality().hash(_spots),activeSpots,totalCapacity);
}

@override
String toString() {
    return 'ParkingPlanViewModel(plan: $plan, spots: $spots, activeSpots: $activeSpots, totalCapacity: $totalCapacity)';
}


}

/// @nodoc
abstract mixin class _$ParkingPlanViewModelCopyWith<$Res> implements $ParkingPlanViewModelCopyWith<$Res> {
  factory _$ParkingPlanViewModelCopyWith(_ParkingPlanViewModel value, $Res Function(_ParkingPlanViewModel) _then) = __$ParkingPlanViewModelCopyWithImpl;
@override @useResult
$Res call({
 ParkingPlanModel plan, List<SpotModel> spots, int activeSpots, int totalCapacity
});


@override $ParkingPlanModelCopyWith<$Res> get plan;

}
/// @nodoc
class __$ParkingPlanViewModelCopyWithImpl<$Res>
    implements _$ParkingPlanViewModelCopyWith<$Res> {
  __$ParkingPlanViewModelCopyWithImpl(this._self, this._then);

  final _ParkingPlanViewModel _self;
  final $Res Function(_ParkingPlanViewModel) _then;

/// Create a copy of ParkingPlanViewModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? plan = null,Object? spots = null,Object? activeSpots = null,Object? totalCapacity = null,}) {
  return _then(_ParkingPlanViewModel(
plan: null == plan ? _self.plan : plan // ignore: cast_nullable_to_non_nullable
as ParkingPlanModel,spots: null == spots ? _self._spots : spots // ignore: cast_nullable_to_non_nullable
as List<SpotModel>,activeSpots: null == activeSpots ? _self.activeSpots : activeSpots // ignore: cast_nullable_to_non_nullable
as int,totalCapacity: null == totalCapacity ? _self.totalCapacity : totalCapacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

/// Create a copy of ParkingPlanViewModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingPlanModelCopyWith<$Res> get plan {
  
  return $ParkingPlanModelCopyWith<$Res>(_self.plan, (value) {
    return _then(_self.copyWith(plan: value));
  });
}
}


/// @nodoc
mixin _$PlanEstimateModel {

 int get usableArea; Map<String, int> get totals;
/// Create a copy of PlanEstimateModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlanEstimateModelCopyWith<PlanEstimateModel> get copyWith => _$PlanEstimateModelCopyWithImpl<PlanEstimateModel>(this as PlanEstimateModel, _$identity);

  /// Serializes this PlanEstimateModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlanEstimateModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlanEstimateModel&&(identical(other.usableArea, _this.usableArea) || other.usableArea == _this.usableArea)&&const DeepCollectionEquality().equals(other.totals, _this.totals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlanEstimateModel;
  return Object.hash(runtimeType,_this.usableArea,const DeepCollectionEquality().hash(_this.totals));
}

@override
String toString() {
  final _this = this as PlanEstimateModel;
  return 'PlanEstimateModel(usableArea: ${_this.usableArea}, totals: ${_this.totals})';
}


}

/// @nodoc
abstract mixin class $PlanEstimateModelCopyWith<$Res>  {
  factory $PlanEstimateModelCopyWith(PlanEstimateModel value, $Res Function(PlanEstimateModel) _then) = _$PlanEstimateModelCopyWithImpl;
@useResult
$Res call({
 int usableArea, Map<String, int> totals
});




}
/// @nodoc
class _$PlanEstimateModelCopyWithImpl<$Res>
    implements $PlanEstimateModelCopyWith<$Res> {
  _$PlanEstimateModelCopyWithImpl(this._self, this._then);

  final PlanEstimateModel _self;
  final $Res Function(PlanEstimateModel) _then;

/// Create a copy of PlanEstimateModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? usableArea = null,Object? totals = null,}) {
  return _then(PlanEstimateModel(
usableArea: null == usableArea ? _self.usableArea : usableArea // ignore: cast_nullable_to_non_nullable
as int,totals: null == totals ? _self.totals : totals // ignore: cast_nullable_to_non_nullable
as Map<String, int>,
  ));
}

}


/// Adds pattern-matching-related methods to [PlanEstimateModel].
extension PlanEstimateModelPatterns on PlanEstimateModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlanEstimateModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlanEstimateModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlanEstimateModel value)  $default,){
final _that = this;
switch (_that) {
case _PlanEstimateModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlanEstimateModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlanEstimateModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int usableArea,  Map<String, int> totals)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlanEstimateModel() when $default != null:
return $default(_that.usableArea,_that.totals);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int usableArea,  Map<String, int> totals)  $default,) {final _that = this;
switch (_that) {
case _PlanEstimateModel():
return $default(_that.usableArea,_that.totals);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int usableArea,  Map<String, int> totals)?  $default,) {final _that = this;
switch (_that) {
case _PlanEstimateModel() when $default != null:
return $default(_that.usableArea,_that.totals);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlanEstimateModel implements PlanEstimateModel {
  const _PlanEstimateModel({required this.usableArea, required  Map<String, int> totals}): _totals = totals;
  factory _PlanEstimateModel.fromJson(Map<String, dynamic> json) => _$PlanEstimateModelFromJson(json);

@override final  int usableArea;
 final  Map<String, int> _totals;
@override Map<String, int> get totals {
  if (_totals is EqualUnmodifiableMapView) return _totals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_totals);
}


/// Create a copy of PlanEstimateModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlanEstimateModelCopyWith<_PlanEstimateModel> get copyWith => __$PlanEstimateModelCopyWithImpl<_PlanEstimateModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlanEstimateModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlanEstimateModel&&(identical(other.usableArea, usableArea) || other.usableArea == usableArea)&&const DeepCollectionEquality().equals(other.totals, _totals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,usableArea,const DeepCollectionEquality().hash(_totals));
}

@override
String toString() {
    return 'PlanEstimateModel(usableArea: $usableArea, totals: $totals)';
}


}

/// @nodoc
abstract mixin class _$PlanEstimateModelCopyWith<$Res> implements $PlanEstimateModelCopyWith<$Res> {
  factory _$PlanEstimateModelCopyWith(_PlanEstimateModel value, $Res Function(_PlanEstimateModel) _then) = __$PlanEstimateModelCopyWithImpl;
@override @useResult
$Res call({
 int usableArea, Map<String, int> totals
});




}
/// @nodoc
class __$PlanEstimateModelCopyWithImpl<$Res>
    implements _$PlanEstimateModelCopyWith<$Res> {
  __$PlanEstimateModelCopyWithImpl(this._self, this._then);

  final _PlanEstimateModel _self;
  final $Res Function(_PlanEstimateModel) _then;

/// Create a copy of PlanEstimateModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? usableArea = null,Object? totals = null,}) {
  return _then(_PlanEstimateModel(
usableArea: null == usableArea ? _self.usableArea : usableArea // ignore: cast_nullable_to_non_nullable
as int,totals: null == totals ? _self._totals : totals // ignore: cast_nullable_to_non_nullable
as Map<String, int>,
  ));
}


}


/// @nodoc
mixin _$GeocodeResultModel {

 String get label; String get type; double get lon; double get lat;
/// Create a copy of GeocodeResultModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GeocodeResultModelCopyWith<GeocodeResultModel> get copyWith => _$GeocodeResultModelCopyWithImpl<GeocodeResultModel>(this as GeocodeResultModel, _$identity);

  /// Serializes this GeocodeResultModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as GeocodeResultModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GeocodeResultModel&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.type, _this.type) || other.type == _this.type)&&(identical(other.lon, _this.lon) || other.lon == _this.lon)&&(identical(other.lat, _this.lat) || other.lat == _this.lat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as GeocodeResultModel;
  return Object.hash(runtimeType,_this.label,_this.type,_this.lon,_this.lat);
}

@override
String toString() {
  final _this = this as GeocodeResultModel;
  return 'GeocodeResultModel(label: ${_this.label}, type: ${_this.type}, lon: ${_this.lon}, lat: ${_this.lat})';
}


}

/// @nodoc
abstract mixin class $GeocodeResultModelCopyWith<$Res>  {
  factory $GeocodeResultModelCopyWith(GeocodeResultModel value, $Res Function(GeocodeResultModel) _then) = _$GeocodeResultModelCopyWithImpl;
@useResult
$Res call({
 String label, String type, double lon, double lat
});




}
/// @nodoc
class _$GeocodeResultModelCopyWithImpl<$Res>
    implements $GeocodeResultModelCopyWith<$Res> {
  _$GeocodeResultModelCopyWithImpl(this._self, this._then);

  final GeocodeResultModel _self;
  final $Res Function(GeocodeResultModel) _then;

/// Create a copy of GeocodeResultModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? label = null,Object? type = null,Object? lon = null,Object? lat = null,}) {
  return _then(GeocodeResultModel(
label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,lon: null == lon ? _self.lon : lon // ignore: cast_nullable_to_non_nullable
as double,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [GeocodeResultModel].
extension GeocodeResultModelPatterns on GeocodeResultModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _GeocodeResultModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _GeocodeResultModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _GeocodeResultModel value)  $default,){
final _that = this;
switch (_that) {
case _GeocodeResultModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _GeocodeResultModel value)?  $default,){
final _that = this;
switch (_that) {
case _GeocodeResultModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String label,  String type,  double lon,  double lat)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _GeocodeResultModel() when $default != null:
return $default(_that.label,_that.type,_that.lon,_that.lat);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String label,  String type,  double lon,  double lat)  $default,) {final _that = this;
switch (_that) {
case _GeocodeResultModel():
return $default(_that.label,_that.type,_that.lon,_that.lat);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String label,  String type,  double lon,  double lat)?  $default,) {final _that = this;
switch (_that) {
case _GeocodeResultModel() when $default != null:
return $default(_that.label,_that.type,_that.lon,_that.lat);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _GeocodeResultModel implements GeocodeResultModel {
  const _GeocodeResultModel({required this.label, required this.type, required this.lon, required this.lat});
  factory _GeocodeResultModel.fromJson(Map<String, dynamic> json) => _$GeocodeResultModelFromJson(json);

@override final  String label;
@override final  String type;
@override final  double lon;
@override final  double lat;

/// Create a copy of GeocodeResultModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GeocodeResultModelCopyWith<_GeocodeResultModel> get copyWith => __$GeocodeResultModelCopyWithImpl<_GeocodeResultModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GeocodeResultModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _GeocodeResultModel&&(identical(other.label, label) || other.label == label)&&(identical(other.type, type) || other.type == type)&&(identical(other.lon, lon) || other.lon == lon)&&(identical(other.lat, lat) || other.lat == lat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,label,type,lon,lat);
}

@override
String toString() {
    return 'GeocodeResultModel(label: $label, type: $type, lon: $lon, lat: $lat)';
}


}

/// @nodoc
abstract mixin class _$GeocodeResultModelCopyWith<$Res> implements $GeocodeResultModelCopyWith<$Res> {
  factory _$GeocodeResultModelCopyWith(_GeocodeResultModel value, $Res Function(_GeocodeResultModel) _then) = __$GeocodeResultModelCopyWithImpl;
@override @useResult
$Res call({
 String label, String type, double lon, double lat
});




}
/// @nodoc
class __$GeocodeResultModelCopyWithImpl<$Res>
    implements _$GeocodeResultModelCopyWith<$Res> {
  __$GeocodeResultModelCopyWithImpl(this._self, this._then);

  final _GeocodeResultModel _self;
  final $Res Function(_GeocodeResultModel) _then;

/// Create a copy of GeocodeResultModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? label = null,Object? type = null,Object? lon = null,Object? lat = null,}) {
  return _then(_GeocodeResultModel(
label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,lon: null == lon ? _self.lon : lon // ignore: cast_nullable_to_non_nullable
as double,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$GeocodeResponseModel {

 List<GeocodeResultModel> get results;
/// Create a copy of GeocodeResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GeocodeResponseModelCopyWith<GeocodeResponseModel> get copyWith => _$GeocodeResponseModelCopyWithImpl<GeocodeResponseModel>(this as GeocodeResponseModel, _$identity);

  /// Serializes this GeocodeResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as GeocodeResponseModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GeocodeResponseModel&&const DeepCollectionEquality().equals(other.results, _this.results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as GeocodeResponseModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.results));
}

@override
String toString() {
  final _this = this as GeocodeResponseModel;
  return 'GeocodeResponseModel(results: ${_this.results})';
}


}

/// @nodoc
abstract mixin class $GeocodeResponseModelCopyWith<$Res>  {
  factory $GeocodeResponseModelCopyWith(GeocodeResponseModel value, $Res Function(GeocodeResponseModel) _then) = _$GeocodeResponseModelCopyWithImpl;
@useResult
$Res call({
 List<GeocodeResultModel> results
});




}
/// @nodoc
class _$GeocodeResponseModelCopyWithImpl<$Res>
    implements $GeocodeResponseModelCopyWith<$Res> {
  _$GeocodeResponseModelCopyWithImpl(this._self, this._then);

  final GeocodeResponseModel _self;
  final $Res Function(GeocodeResponseModel) _then;

/// Create a copy of GeocodeResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? results = null,}) {
  return _then(GeocodeResponseModel(
results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<GeocodeResultModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [GeocodeResponseModel].
extension GeocodeResponseModelPatterns on GeocodeResponseModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _GeocodeResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _GeocodeResponseModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _GeocodeResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _GeocodeResponseModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _GeocodeResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _GeocodeResponseModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<GeocodeResultModel> results)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _GeocodeResponseModel() when $default != null:
return $default(_that.results);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<GeocodeResultModel> results)  $default,) {final _that = this;
switch (_that) {
case _GeocodeResponseModel():
return $default(_that.results);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<GeocodeResultModel> results)?  $default,) {final _that = this;
switch (_that) {
case _GeocodeResponseModel() when $default != null:
return $default(_that.results);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _GeocodeResponseModel implements GeocodeResponseModel {
  const _GeocodeResponseModel({ List<GeocodeResultModel> results = const []}): _results = results;
  factory _GeocodeResponseModel.fromJson(Map<String, dynamic> json) => _$GeocodeResponseModelFromJson(json);

 final  List<GeocodeResultModel> _results;
@override@JsonKey() List<GeocodeResultModel> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}


/// Create a copy of GeocodeResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GeocodeResponseModelCopyWith<_GeocodeResponseModel> get copyWith => __$GeocodeResponseModelCopyWithImpl<_GeocodeResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GeocodeResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _GeocodeResponseModel&&const DeepCollectionEquality().equals(other.results, _results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_results));
}

@override
String toString() {
    return 'GeocodeResponseModel(results: $results)';
}


}

/// @nodoc
abstract mixin class _$GeocodeResponseModelCopyWith<$Res> implements $GeocodeResponseModelCopyWith<$Res> {
  factory _$GeocodeResponseModelCopyWith(_GeocodeResponseModel value, $Res Function(_GeocodeResponseModel) _then) = __$GeocodeResponseModelCopyWithImpl;
@override @useResult
$Res call({
 List<GeocodeResultModel> results
});




}
/// @nodoc
class __$GeocodeResponseModelCopyWithImpl<$Res>
    implements _$GeocodeResponseModelCopyWith<$Res> {
  __$GeocodeResponseModelCopyWithImpl(this._self, this._then);

  final _GeocodeResponseModel _self;
  final $Res Function(_GeocodeResponseModel) _then;

/// Create a copy of GeocodeResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? results = null,}) {
  return _then(_GeocodeResponseModel(
results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<GeocodeResultModel>,
  ));
}


}


/// @nodoc
mixin _$PlanViewEnvelope {

 ParkingPlanViewModel get data;
/// Create a copy of PlanViewEnvelope
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlanViewEnvelopeCopyWith<PlanViewEnvelope> get copyWith => _$PlanViewEnvelopeCopyWithImpl<PlanViewEnvelope>(this as PlanViewEnvelope, _$identity);

  /// Serializes this PlanViewEnvelope to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlanViewEnvelope;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlanViewEnvelope&&(identical(other.data, _this.data) || other.data == _this.data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlanViewEnvelope;
  return Object.hash(runtimeType,_this.data);
}

@override
String toString() {
  final _this = this as PlanViewEnvelope;
  return 'PlanViewEnvelope(data: ${_this.data})';
}


}

/// @nodoc
abstract mixin class $PlanViewEnvelopeCopyWith<$Res>  {
  factory $PlanViewEnvelopeCopyWith(PlanViewEnvelope value, $Res Function(PlanViewEnvelope) _then) = _$PlanViewEnvelopeCopyWithImpl;
@useResult
$Res call({
 ParkingPlanViewModel data
});


$ParkingPlanViewModelCopyWith<$Res> get data;

}
/// @nodoc
class _$PlanViewEnvelopeCopyWithImpl<$Res>
    implements $PlanViewEnvelopeCopyWith<$Res> {
  _$PlanViewEnvelopeCopyWithImpl(this._self, this._then);

  final PlanViewEnvelope _self;
  final $Res Function(PlanViewEnvelope) _then;

/// Create a copy of PlanViewEnvelope
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? data = null,}) {
  return _then(PlanViewEnvelope(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as ParkingPlanViewModel,
  ));
}
/// Create a copy of PlanViewEnvelope
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingPlanViewModelCopyWith<$Res> get data {
  
  return $ParkingPlanViewModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [PlanViewEnvelope].
extension PlanViewEnvelopePatterns on PlanViewEnvelope {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlanViewEnvelope value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlanViewEnvelope() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlanViewEnvelope value)  $default,){
final _that = this;
switch (_that) {
case _PlanViewEnvelope():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlanViewEnvelope value)?  $default,){
final _that = this;
switch (_that) {
case _PlanViewEnvelope() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ParkingPlanViewModel data)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlanViewEnvelope() when $default != null:
return $default(_that.data);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ParkingPlanViewModel data)  $default,) {final _that = this;
switch (_that) {
case _PlanViewEnvelope():
return $default(_that.data);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ParkingPlanViewModel data)?  $default,) {final _that = this;
switch (_that) {
case _PlanViewEnvelope() when $default != null:
return $default(_that.data);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlanViewEnvelope implements PlanViewEnvelope {
  const _PlanViewEnvelope({required this.data});
  factory _PlanViewEnvelope.fromJson(Map<String, dynamic> json) => _$PlanViewEnvelopeFromJson(json);

@override final  ParkingPlanViewModel data;

/// Create a copy of PlanViewEnvelope
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlanViewEnvelopeCopyWith<_PlanViewEnvelope> get copyWith => __$PlanViewEnvelopeCopyWithImpl<_PlanViewEnvelope>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlanViewEnvelopeToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlanViewEnvelope&&(identical(other.data, data) || other.data == data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,data);
}

@override
String toString() {
    return 'PlanViewEnvelope(data: $data)';
}


}

/// @nodoc
abstract mixin class _$PlanViewEnvelopeCopyWith<$Res> implements $PlanViewEnvelopeCopyWith<$Res> {
  factory _$PlanViewEnvelopeCopyWith(_PlanViewEnvelope value, $Res Function(_PlanViewEnvelope) _then) = __$PlanViewEnvelopeCopyWithImpl;
@override @useResult
$Res call({
 ParkingPlanViewModel data
});


@override $ParkingPlanViewModelCopyWith<$Res> get data;

}
/// @nodoc
class __$PlanViewEnvelopeCopyWithImpl<$Res>
    implements _$PlanViewEnvelopeCopyWith<$Res> {
  __$PlanViewEnvelopeCopyWithImpl(this._self, this._then);

  final _PlanViewEnvelope _self;
  final $Res Function(_PlanViewEnvelope) _then;

/// Create a copy of PlanViewEnvelope
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? data = null,}) {
  return _then(_PlanViewEnvelope(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as ParkingPlanViewModel,
  ));
}

/// Create a copy of PlanViewEnvelope
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingPlanViewModelCopyWith<$Res> get data {
  
  return $ParkingPlanViewModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
