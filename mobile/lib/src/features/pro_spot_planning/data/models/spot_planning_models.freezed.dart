// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'spot_planning_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PlannedStayModel {

 String get id; String get reference; String get customerName; String get plate; String get status; DateTime get arrivalAt; DateTime get returnAt; String? get returnFlight; String? get spotId; String? get keyHook; bool get onSite;
/// Create a copy of PlannedStayModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlannedStayModelCopyWith<PlannedStayModel> get copyWith => _$PlannedStayModelCopyWithImpl<PlannedStayModel>(this as PlannedStayModel, _$identity);

  /// Serializes this PlannedStayModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlannedStayModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlannedStayModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.keyHook, _this.keyHook) || other.keyHook == _this.keyHook)&&(identical(other.onSite, _this.onSite) || other.onSite == _this.onSite));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlannedStayModel;
  return Object.hash(runtimeType,_this.id,_this.reference,_this.customerName,_this.plate,_this.status,_this.arrivalAt,_this.returnAt,_this.returnFlight,_this.spotId,_this.keyHook,_this.onSite);
}

@override
String toString() {
  final _this = this as PlannedStayModel;
  return 'PlannedStayModel(id: ${_this.id}, reference: ${_this.reference}, customerName: ${_this.customerName}, plate: ${_this.plate}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, returnFlight: ${_this.returnFlight}, spotId: ${_this.spotId}, keyHook: ${_this.keyHook}, onSite: ${_this.onSite})';
}


}

/// @nodoc
abstract mixin class $PlannedStayModelCopyWith<$Res>  {
  factory $PlannedStayModelCopyWith(PlannedStayModel value, $Res Function(PlannedStayModel) _then) = _$PlannedStayModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String customerName, String plate, String status, DateTime arrivalAt, DateTime returnAt, String? returnFlight, String? spotId, String? keyHook, bool onSite
});




}
/// @nodoc
class _$PlannedStayModelCopyWithImpl<$Res>
    implements $PlannedStayModelCopyWith<$Res> {
  _$PlannedStayModelCopyWithImpl(this._self, this._then);

  final PlannedStayModel _self;
  final $Res Function(PlannedStayModel) _then;

/// Create a copy of PlannedStayModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? returnFlight = freezed,Object? spotId = freezed,Object? keyHook = freezed,Object? onSite = null,}) {
  return _then(PlannedStayModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,spotId: freezed == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [PlannedStayModel].
extension PlannedStayModelPatterns on PlannedStayModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlannedStayModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlannedStayModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlannedStayModel value)  $default,){
final _that = this;
switch (_that) {
case _PlannedStayModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlannedStayModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlannedStayModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String plate,  String status,  DateTime arrivalAt,  DateTime returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  bool onSite)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlannedStayModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.onSite);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String plate,  String status,  DateTime arrivalAt,  DateTime returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  bool onSite)  $default,) {final _that = this;
switch (_that) {
case _PlannedStayModel():
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.onSite);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String customerName,  String plate,  String status,  DateTime arrivalAt,  DateTime returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  bool onSite)?  $default,) {final _that = this;
switch (_that) {
case _PlannedStayModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.onSite);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlannedStayModel implements PlannedStayModel {
  const _PlannedStayModel({required this.id, required this.reference, required this.customerName, required this.plate, required this.status, required this.arrivalAt, required this.returnAt, this.returnFlight, this.spotId, this.keyHook, this.onSite = false});
  factory _PlannedStayModel.fromJson(Map<String, dynamic> json) => _$PlannedStayModelFromJson(json);

@override final  String id;
@override final  String reference;
@override final  String customerName;
@override final  String plate;
@override final  String status;
@override final  DateTime arrivalAt;
@override final  DateTime returnAt;
@override final  String? returnFlight;
@override final  String? spotId;
@override final  String? keyHook;
@override@JsonKey() final  bool onSite;

/// Create a copy of PlannedStayModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlannedStayModelCopyWith<_PlannedStayModel> get copyWith => __$PlannedStayModelCopyWithImpl<_PlannedStayModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlannedStayModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlannedStayModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.keyHook, keyHook) || other.keyHook == keyHook)&&(identical(other.onSite, onSite) || other.onSite == onSite));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,reference,customerName,plate,status,arrivalAt,returnAt,returnFlight,spotId,keyHook,onSite);
}

@override
String toString() {
    return 'PlannedStayModel(id: $id, reference: $reference, customerName: $customerName, plate: $plate, status: $status, arrivalAt: $arrivalAt, returnAt: $returnAt, returnFlight: $returnFlight, spotId: $spotId, keyHook: $keyHook, onSite: $onSite)';
}


}

/// @nodoc
abstract mixin class _$PlannedStayModelCopyWith<$Res> implements $PlannedStayModelCopyWith<$Res> {
  factory _$PlannedStayModelCopyWith(_PlannedStayModel value, $Res Function(_PlannedStayModel) _then) = __$PlannedStayModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String customerName, String plate, String status, DateTime arrivalAt, DateTime returnAt, String? returnFlight, String? spotId, String? keyHook, bool onSite
});




}
/// @nodoc
class __$PlannedStayModelCopyWithImpl<$Res>
    implements _$PlannedStayModelCopyWith<$Res> {
  __$PlannedStayModelCopyWithImpl(this._self, this._then);

  final _PlannedStayModel _self;
  final $Res Function(_PlannedStayModel) _then;

/// Create a copy of PlannedStayModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? returnFlight = freezed,Object? spotId = freezed,Object? keyHook = freezed,Object? onSite = null,}) {
  return _then(_PlannedStayModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,spotId: freezed == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$PlannedSpotModel {

 String get id; String get zoneId; String get code; int get row; int get index; String get kind; bool get active; String? get stayClass; List<PlannedStayModel> get stays;
/// Create a copy of PlannedSpotModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlannedSpotModelCopyWith<PlannedSpotModel> get copyWith => _$PlannedSpotModelCopyWithImpl<PlannedSpotModel>(this as PlannedSpotModel, _$identity);

  /// Serializes this PlannedSpotModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlannedSpotModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlannedSpotModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.zoneId, _this.zoneId) || other.zoneId == _this.zoneId)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.row, _this.row) || other.row == _this.row)&&(identical(other.index, _this.index) || other.index == _this.index)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.active, _this.active) || other.active == _this.active)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass)&&const DeepCollectionEquality().equals(other.stays, _this.stays));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlannedSpotModel;
  return Object.hash(runtimeType,_this.id,_this.zoneId,_this.code,_this.row,_this.index,_this.kind,_this.active,_this.stayClass,const DeepCollectionEquality().hash(_this.stays));
}

@override
String toString() {
  final _this = this as PlannedSpotModel;
  return 'PlannedSpotModel(id: ${_this.id}, zoneId: ${_this.zoneId}, code: ${_this.code}, row: ${_this.row}, index: ${_this.index}, kind: ${_this.kind}, active: ${_this.active}, stayClass: ${_this.stayClass}, stays: ${_this.stays})';
}


}

/// @nodoc
abstract mixin class $PlannedSpotModelCopyWith<$Res>  {
  factory $PlannedSpotModelCopyWith(PlannedSpotModel value, $Res Function(PlannedSpotModel) _then) = _$PlannedSpotModelCopyWithImpl;
@useResult
$Res call({
 String id, String zoneId, String code, int row, int index, String kind, bool active, String? stayClass, List<PlannedStayModel> stays
});




}
/// @nodoc
class _$PlannedSpotModelCopyWithImpl<$Res>
    implements $PlannedSpotModelCopyWith<$Res> {
  _$PlannedSpotModelCopyWithImpl(this._self, this._then);

  final PlannedSpotModel _self;
  final $Res Function(PlannedSpotModel) _then;

/// Create a copy of PlannedSpotModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? zoneId = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? stayClass = freezed,Object? stays = null,}) {
  return _then(PlannedSpotModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,zoneId: null == zoneId ? _self.zoneId : zoneId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,stays: null == stays ? _self.stays : stays // ignore: cast_nullable_to_non_nullable
as List<PlannedStayModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [PlannedSpotModel].
extension PlannedSpotModelPatterns on PlannedSpotModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlannedSpotModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlannedSpotModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlannedSpotModel value)  $default,){
final _that = this;
switch (_that) {
case _PlannedSpotModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlannedSpotModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlannedSpotModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  String? stayClass,  List<PlannedStayModel> stays)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlannedSpotModel() when $default != null:
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.stayClass,_that.stays);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  String? stayClass,  List<PlannedStayModel> stays)  $default,) {final _that = this;
switch (_that) {
case _PlannedSpotModel():
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.stayClass,_that.stays);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  String? stayClass,  List<PlannedStayModel> stays)?  $default,) {final _that = this;
switch (_that) {
case _PlannedSpotModel() when $default != null:
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.stayClass,_that.stays);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlannedSpotModel implements PlannedSpotModel {
  const _PlannedSpotModel({required this.id, required this.zoneId, required this.code, required this.row, required this.index, required this.kind, required this.active, this.stayClass,  List<PlannedStayModel> stays = const []}): _stays = stays;
  factory _PlannedSpotModel.fromJson(Map<String, dynamic> json) => _$PlannedSpotModelFromJson(json);

@override final  String id;
@override final  String zoneId;
@override final  String code;
@override final  int row;
@override final  int index;
@override final  String kind;
@override final  bool active;
@override final  String? stayClass;
 final  List<PlannedStayModel> _stays;
@override@JsonKey() List<PlannedStayModel> get stays {
  if (_stays is EqualUnmodifiableListView) return _stays;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_stays);
}


/// Create a copy of PlannedSpotModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlannedSpotModelCopyWith<_PlannedSpotModel> get copyWith => __$PlannedSpotModelCopyWithImpl<_PlannedSpotModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlannedSpotModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlannedSpotModel&&(identical(other.id, id) || other.id == id)&&(identical(other.zoneId, zoneId) || other.zoneId == zoneId)&&(identical(other.code, code) || other.code == code)&&(identical(other.row, row) || other.row == row)&&(identical(other.index, index) || other.index == index)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.active, active) || other.active == active)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass)&&const DeepCollectionEquality().equals(other.stays, _stays));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,zoneId,code,row,index,kind,active,stayClass,const DeepCollectionEquality().hash(_stays));
}

@override
String toString() {
    return 'PlannedSpotModel(id: $id, zoneId: $zoneId, code: $code, row: $row, index: $index, kind: $kind, active: $active, stayClass: $stayClass, stays: $stays)';
}


}

/// @nodoc
abstract mixin class _$PlannedSpotModelCopyWith<$Res> implements $PlannedSpotModelCopyWith<$Res> {
  factory _$PlannedSpotModelCopyWith(_PlannedSpotModel value, $Res Function(_PlannedSpotModel) _then) = __$PlannedSpotModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String zoneId, String code, int row, int index, String kind, bool active, String? stayClass, List<PlannedStayModel> stays
});




}
/// @nodoc
class __$PlannedSpotModelCopyWithImpl<$Res>
    implements _$PlannedSpotModelCopyWith<$Res> {
  __$PlannedSpotModelCopyWithImpl(this._self, this._then);

  final _PlannedSpotModel _self;
  final $Res Function(_PlannedSpotModel) _then;

/// Create a copy of PlannedSpotModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? zoneId = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? stayClass = freezed,Object? stays = null,}) {
  return _then(_PlannedSpotModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,zoneId: null == zoneId ? _self.zoneId : zoneId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,stays: null == stays ? _self._stays : stays // ignore: cast_nullable_to_non_nullable
as List<PlannedStayModel>,
  ));
}


}


/// @nodoc
mixin _$DayLoadModel {

 String get date; int get placed; int get unplaced; int get capacity;
/// Create a copy of DayLoadModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DayLoadModelCopyWith<DayLoadModel> get copyWith => _$DayLoadModelCopyWithImpl<DayLoadModel>(this as DayLoadModel, _$identity);

  /// Serializes this DayLoadModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DayLoadModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DayLoadModel&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.placed, _this.placed) || other.placed == _this.placed)&&(identical(other.unplaced, _this.unplaced) || other.unplaced == _this.unplaced)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DayLoadModel;
  return Object.hash(runtimeType,_this.date,_this.placed,_this.unplaced,_this.capacity);
}

@override
String toString() {
  final _this = this as DayLoadModel;
  return 'DayLoadModel(date: ${_this.date}, placed: ${_this.placed}, unplaced: ${_this.unplaced}, capacity: ${_this.capacity})';
}


}

/// @nodoc
abstract mixin class $DayLoadModelCopyWith<$Res>  {
  factory $DayLoadModelCopyWith(DayLoadModel value, $Res Function(DayLoadModel) _then) = _$DayLoadModelCopyWithImpl;
@useResult
$Res call({
 String date, int placed, int unplaced, int capacity
});




}
/// @nodoc
class _$DayLoadModelCopyWithImpl<$Res>
    implements $DayLoadModelCopyWith<$Res> {
  _$DayLoadModelCopyWithImpl(this._self, this._then);

  final DayLoadModel _self;
  final $Res Function(DayLoadModel) _then;

/// Create a copy of DayLoadModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? placed = null,Object? unplaced = null,Object? capacity = null,}) {
  return _then(DayLoadModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,placed: null == placed ? _self.placed : placed // ignore: cast_nullable_to_non_nullable
as int,unplaced: null == unplaced ? _self.unplaced : unplaced // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [DayLoadModel].
extension DayLoadModelPatterns on DayLoadModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DayLoadModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DayLoadModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DayLoadModel value)  $default,){
final _that = this;
switch (_that) {
case _DayLoadModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DayLoadModel value)?  $default,){
final _that = this;
switch (_that) {
case _DayLoadModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  int placed,  int unplaced,  int capacity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DayLoadModel() when $default != null:
return $default(_that.date,_that.placed,_that.unplaced,_that.capacity);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  int placed,  int unplaced,  int capacity)  $default,) {final _that = this;
switch (_that) {
case _DayLoadModel():
return $default(_that.date,_that.placed,_that.unplaced,_that.capacity);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  int placed,  int unplaced,  int capacity)?  $default,) {final _that = this;
switch (_that) {
case _DayLoadModel() when $default != null:
return $default(_that.date,_that.placed,_that.unplaced,_that.capacity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DayLoadModel implements DayLoadModel {
  const _DayLoadModel({required this.date, required this.placed, required this.unplaced, required this.capacity});
  factory _DayLoadModel.fromJson(Map<String, dynamic> json) => _$DayLoadModelFromJson(json);

@override final  String date;
@override final  int placed;
@override final  int unplaced;
@override final  int capacity;

/// Create a copy of DayLoadModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DayLoadModelCopyWith<_DayLoadModel> get copyWith => __$DayLoadModelCopyWithImpl<_DayLoadModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DayLoadModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DayLoadModel&&(identical(other.date, date) || other.date == date)&&(identical(other.placed, placed) || other.placed == placed)&&(identical(other.unplaced, unplaced) || other.unplaced == unplaced)&&(identical(other.capacity, capacity) || other.capacity == capacity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,date,placed,unplaced,capacity);
}

@override
String toString() {
    return 'DayLoadModel(date: $date, placed: $placed, unplaced: $unplaced, capacity: $capacity)';
}


}

/// @nodoc
abstract mixin class _$DayLoadModelCopyWith<$Res> implements $DayLoadModelCopyWith<$Res> {
  factory _$DayLoadModelCopyWith(_DayLoadModel value, $Res Function(_DayLoadModel) _then) = __$DayLoadModelCopyWithImpl;
@override @useResult
$Res call({
 String date, int placed, int unplaced, int capacity
});




}
/// @nodoc
class __$DayLoadModelCopyWithImpl<$Res>
    implements _$DayLoadModelCopyWith<$Res> {
  __$DayLoadModelCopyWithImpl(this._self, this._then);

  final _DayLoadModel _self;
  final $Res Function(_DayLoadModel) _then;

/// Create a copy of DayLoadModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? placed = null,Object? unplaced = null,Object? capacity = null,}) {
  return _then(_DayLoadModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,placed: null == placed ? _self.placed : placed // ignore: cast_nullable_to_non_nullable
as int,unplaced: null == unplaced ? _self.unplaced : unplaced // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$PlanningAlertModel {

 String get kind; String? get date; int? get count; String? get spotCode; String? get reference;
/// Create a copy of PlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlanningAlertModelCopyWith<PlanningAlertModel> get copyWith => _$PlanningAlertModelCopyWithImpl<PlanningAlertModel>(this as PlanningAlertModel, _$identity);

  /// Serializes this PlanningAlertModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlanningAlertModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlanningAlertModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.count, _this.count) || other.count == _this.count)&&(identical(other.spotCode, _this.spotCode) || other.spotCode == _this.spotCode)&&(identical(other.reference, _this.reference) || other.reference == _this.reference));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlanningAlertModel;
  return Object.hash(runtimeType,_this.kind,_this.date,_this.count,_this.spotCode,_this.reference);
}

@override
String toString() {
  final _this = this as PlanningAlertModel;
  return 'PlanningAlertModel(kind: ${_this.kind}, date: ${_this.date}, count: ${_this.count}, spotCode: ${_this.spotCode}, reference: ${_this.reference})';
}


}

/// @nodoc
abstract mixin class $PlanningAlertModelCopyWith<$Res>  {
  factory $PlanningAlertModelCopyWith(PlanningAlertModel value, $Res Function(PlanningAlertModel) _then) = _$PlanningAlertModelCopyWithImpl;
@useResult
$Res call({
 String kind, String? date, int? count, String? spotCode, String? reference
});




}
/// @nodoc
class _$PlanningAlertModelCopyWithImpl<$Res>
    implements $PlanningAlertModelCopyWith<$Res> {
  _$PlanningAlertModelCopyWithImpl(this._self, this._then);

  final PlanningAlertModel _self;
  final $Res Function(PlanningAlertModel) _then;

/// Create a copy of PlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? date = freezed,Object? count = freezed,Object? spotCode = freezed,Object? reference = freezed,}) {
  return _then(PlanningAlertModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,date: freezed == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String?,count: freezed == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int?,spotCode: freezed == spotCode ? _self.spotCode : spotCode // ignore: cast_nullable_to_non_nullable
as String?,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [PlanningAlertModel].
extension PlanningAlertModelPatterns on PlanningAlertModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlanningAlertModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlanningAlertModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlanningAlertModel value)  $default,){
final _that = this;
switch (_that) {
case _PlanningAlertModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlanningAlertModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlanningAlertModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  String? date,  int? count,  String? spotCode,  String? reference)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlanningAlertModel() when $default != null:
return $default(_that.kind,_that.date,_that.count,_that.spotCode,_that.reference);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  String? date,  int? count,  String? spotCode,  String? reference)  $default,) {final _that = this;
switch (_that) {
case _PlanningAlertModel():
return $default(_that.kind,_that.date,_that.count,_that.spotCode,_that.reference);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  String? date,  int? count,  String? spotCode,  String? reference)?  $default,) {final _that = this;
switch (_that) {
case _PlanningAlertModel() when $default != null:
return $default(_that.kind,_that.date,_that.count,_that.spotCode,_that.reference);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlanningAlertModel implements PlanningAlertModel {
  const _PlanningAlertModel({required this.kind, this.date, this.count, this.spotCode, this.reference});
  factory _PlanningAlertModel.fromJson(Map<String, dynamic> json) => _$PlanningAlertModelFromJson(json);

@override final  String kind;
@override final  String? date;
@override final  int? count;
@override final  String? spotCode;
@override final  String? reference;

/// Create a copy of PlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlanningAlertModelCopyWith<_PlanningAlertModel> get copyWith => __$PlanningAlertModelCopyWithImpl<_PlanningAlertModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlanningAlertModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlanningAlertModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.date, date) || other.date == date)&&(identical(other.count, count) || other.count == count)&&(identical(other.spotCode, spotCode) || other.spotCode == spotCode)&&(identical(other.reference, reference) || other.reference == reference));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,date,count,spotCode,reference);
}

@override
String toString() {
    return 'PlanningAlertModel(kind: $kind, date: $date, count: $count, spotCode: $spotCode, reference: $reference)';
}


}

/// @nodoc
abstract mixin class _$PlanningAlertModelCopyWith<$Res> implements $PlanningAlertModelCopyWith<$Res> {
  factory _$PlanningAlertModelCopyWith(_PlanningAlertModel value, $Res Function(_PlanningAlertModel) _then) = __$PlanningAlertModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, String? date, int? count, String? spotCode, String? reference
});




}
/// @nodoc
class __$PlanningAlertModelCopyWithImpl<$Res>
    implements _$PlanningAlertModelCopyWith<$Res> {
  __$PlanningAlertModelCopyWithImpl(this._self, this._then);

  final _PlanningAlertModel _self;
  final $Res Function(_PlanningAlertModel) _then;

/// Create a copy of PlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? date = freezed,Object? count = freezed,Object? spotCode = freezed,Object? reference = freezed,}) {
  return _then(_PlanningAlertModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,date: freezed == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String?,count: freezed == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int?,spotCode: freezed == spotCode ? _self.spotCode : spotCode // ignore: cast_nullable_to_non_nullable
as String?,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$SpotPlanningModel {

 String get from; int get days; int get capacity; List<PlannedSpotModel> get spots; List<PlannedStayModel> get unplaced; List<DayLoadModel> get load; List<PlanningAlertModel> get alerts;
/// Create a copy of SpotPlanningModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SpotPlanningModelCopyWith<SpotPlanningModel> get copyWith => _$SpotPlanningModelCopyWithImpl<SpotPlanningModel>(this as SpotPlanningModel, _$identity);

  /// Serializes this SpotPlanningModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SpotPlanningModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SpotPlanningModel&&(identical(other.from, _this.from) || other.from == _this.from)&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&const DeepCollectionEquality().equals(other.spots, _this.spots)&&const DeepCollectionEquality().equals(other.unplaced, _this.unplaced)&&const DeepCollectionEquality().equals(other.load, _this.load)&&const DeepCollectionEquality().equals(other.alerts, _this.alerts));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SpotPlanningModel;
  return Object.hash(runtimeType,_this.from,_this.days,_this.capacity,const DeepCollectionEquality().hash(_this.spots),const DeepCollectionEquality().hash(_this.unplaced),const DeepCollectionEquality().hash(_this.load),const DeepCollectionEquality().hash(_this.alerts));
}

@override
String toString() {
  final _this = this as SpotPlanningModel;
  return 'SpotPlanningModel(from: ${_this.from}, days: ${_this.days}, capacity: ${_this.capacity}, spots: ${_this.spots}, unplaced: ${_this.unplaced}, load: ${_this.load}, alerts: ${_this.alerts})';
}


}

/// @nodoc
abstract mixin class $SpotPlanningModelCopyWith<$Res>  {
  factory $SpotPlanningModelCopyWith(SpotPlanningModel value, $Res Function(SpotPlanningModel) _then) = _$SpotPlanningModelCopyWithImpl;
@useResult
$Res call({
 String from, int days, int capacity, List<PlannedSpotModel> spots, List<PlannedStayModel> unplaced, List<DayLoadModel> load, List<PlanningAlertModel> alerts
});




}
/// @nodoc
class _$SpotPlanningModelCopyWithImpl<$Res>
    implements $SpotPlanningModelCopyWith<$Res> {
  _$SpotPlanningModelCopyWithImpl(this._self, this._then);

  final SpotPlanningModel _self;
  final $Res Function(SpotPlanningModel) _then;

/// Create a copy of SpotPlanningModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? from = null,Object? days = null,Object? capacity = null,Object? spots = null,Object? unplaced = null,Object? load = null,Object? alerts = null,}) {
  return _then(SpotPlanningModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,spots: null == spots ? _self.spots : spots // ignore: cast_nullable_to_non_nullable
as List<PlannedSpotModel>,unplaced: null == unplaced ? _self.unplaced : unplaced // ignore: cast_nullable_to_non_nullable
as List<PlannedStayModel>,load: null == load ? _self.load : load // ignore: cast_nullable_to_non_nullable
as List<DayLoadModel>,alerts: null == alerts ? _self.alerts : alerts // ignore: cast_nullable_to_non_nullable
as List<PlanningAlertModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [SpotPlanningModel].
extension SpotPlanningModelPatterns on SpotPlanningModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SpotPlanningModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SpotPlanningModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SpotPlanningModel value)  $default,){
final _that = this;
switch (_that) {
case _SpotPlanningModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SpotPlanningModel value)?  $default,){
final _that = this;
switch (_that) {
case _SpotPlanningModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String from,  int days,  int capacity,  List<PlannedSpotModel> spots,  List<PlannedStayModel> unplaced,  List<DayLoadModel> load,  List<PlanningAlertModel> alerts)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SpotPlanningModel() when $default != null:
return $default(_that.from,_that.days,_that.capacity,_that.spots,_that.unplaced,_that.load,_that.alerts);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String from,  int days,  int capacity,  List<PlannedSpotModel> spots,  List<PlannedStayModel> unplaced,  List<DayLoadModel> load,  List<PlanningAlertModel> alerts)  $default,) {final _that = this;
switch (_that) {
case _SpotPlanningModel():
return $default(_that.from,_that.days,_that.capacity,_that.spots,_that.unplaced,_that.load,_that.alerts);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String from,  int days,  int capacity,  List<PlannedSpotModel> spots,  List<PlannedStayModel> unplaced,  List<DayLoadModel> load,  List<PlanningAlertModel> alerts)?  $default,) {final _that = this;
switch (_that) {
case _SpotPlanningModel() when $default != null:
return $default(_that.from,_that.days,_that.capacity,_that.spots,_that.unplaced,_that.load,_that.alerts);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SpotPlanningModel implements SpotPlanningModel {
  const _SpotPlanningModel({required this.from, required this.days, this.capacity = 0,  List<PlannedSpotModel> spots = const [],  List<PlannedStayModel> unplaced = const [],  List<DayLoadModel> load = const [],  List<PlanningAlertModel> alerts = const []}): _spots = spots,_unplaced = unplaced,_load = load,_alerts = alerts;
  factory _SpotPlanningModel.fromJson(Map<String, dynamic> json) => _$SpotPlanningModelFromJson(json);

@override final  String from;
@override final  int days;
@override@JsonKey() final  int capacity;
 final  List<PlannedSpotModel> _spots;
@override@JsonKey() List<PlannedSpotModel> get spots {
  if (_spots is EqualUnmodifiableListView) return _spots;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_spots);
}

 final  List<PlannedStayModel> _unplaced;
@override@JsonKey() List<PlannedStayModel> get unplaced {
  if (_unplaced is EqualUnmodifiableListView) return _unplaced;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_unplaced);
}

 final  List<DayLoadModel> _load;
@override@JsonKey() List<DayLoadModel> get load {
  if (_load is EqualUnmodifiableListView) return _load;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_load);
}

 final  List<PlanningAlertModel> _alerts;
@override@JsonKey() List<PlanningAlertModel> get alerts {
  if (_alerts is EqualUnmodifiableListView) return _alerts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_alerts);
}


/// Create a copy of SpotPlanningModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SpotPlanningModelCopyWith<_SpotPlanningModel> get copyWith => __$SpotPlanningModelCopyWithImpl<_SpotPlanningModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SpotPlanningModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SpotPlanningModel&&(identical(other.from, from) || other.from == from)&&(identical(other.days, days) || other.days == days)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&const DeepCollectionEquality().equals(other.spots, _spots)&&const DeepCollectionEquality().equals(other.unplaced, _unplaced)&&const DeepCollectionEquality().equals(other.load, _load)&&const DeepCollectionEquality().equals(other.alerts, _alerts));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,from,days,capacity,const DeepCollectionEquality().hash(_spots),const DeepCollectionEquality().hash(_unplaced),const DeepCollectionEquality().hash(_load),const DeepCollectionEquality().hash(_alerts));
}

@override
String toString() {
    return 'SpotPlanningModel(from: $from, days: $days, capacity: $capacity, spots: $spots, unplaced: $unplaced, load: $load, alerts: $alerts)';
}


}

/// @nodoc
abstract mixin class _$SpotPlanningModelCopyWith<$Res> implements $SpotPlanningModelCopyWith<$Res> {
  factory _$SpotPlanningModelCopyWith(_SpotPlanningModel value, $Res Function(_SpotPlanningModel) _then) = __$SpotPlanningModelCopyWithImpl;
@override @useResult
$Res call({
 String from, int days, int capacity, List<PlannedSpotModel> spots, List<PlannedStayModel> unplaced, List<DayLoadModel> load, List<PlanningAlertModel> alerts
});




}
/// @nodoc
class __$SpotPlanningModelCopyWithImpl<$Res>
    implements _$SpotPlanningModelCopyWith<$Res> {
  __$SpotPlanningModelCopyWithImpl(this._self, this._then);

  final _SpotPlanningModel _self;
  final $Res Function(_SpotPlanningModel) _then;

/// Create a copy of SpotPlanningModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? from = null,Object? days = null,Object? capacity = null,Object? spots = null,Object? unplaced = null,Object? load = null,Object? alerts = null,}) {
  return _then(_SpotPlanningModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,spots: null == spots ? _self._spots : spots // ignore: cast_nullable_to_non_nullable
as List<PlannedSpotModel>,unplaced: null == unplaced ? _self._unplaced : unplaced // ignore: cast_nullable_to_non_nullable
as List<PlannedStayModel>,load: null == load ? _self._load : load // ignore: cast_nullable_to_non_nullable
as List<DayLoadModel>,alerts: null == alerts ? _self._alerts : alerts // ignore: cast_nullable_to_non_nullable
as List<PlanningAlertModel>,
  ));
}


}


/// @nodoc
mixin _$PreassignedModel {

 String get reservationId; String get reference; String get spotId; String get code;
/// Create a copy of PreassignedModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PreassignedModelCopyWith<PreassignedModel> get copyWith => _$PreassignedModelCopyWithImpl<PreassignedModel>(this as PreassignedModel, _$identity);

  /// Serializes this PreassignedModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PreassignedModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PreassignedModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.code, _this.code) || other.code == _this.code));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PreassignedModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.spotId,_this.code);
}

@override
String toString() {
  final _this = this as PreassignedModel;
  return 'PreassignedModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, spotId: ${_this.spotId}, code: ${_this.code})';
}


}

/// @nodoc
abstract mixin class $PreassignedModelCopyWith<$Res>  {
  factory $PreassignedModelCopyWith(PreassignedModel value, $Res Function(PreassignedModel) _then) = _$PreassignedModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String spotId, String code
});




}
/// @nodoc
class _$PreassignedModelCopyWithImpl<$Res>
    implements $PreassignedModelCopyWith<$Res> {
  _$PreassignedModelCopyWithImpl(this._self, this._then);

  final PreassignedModel _self;
  final $Res Function(PreassignedModel) _then;

/// Create a copy of PreassignedModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? spotId = null,Object? code = null,}) {
  return _then(PreassignedModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,spotId: null == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [PreassignedModel].
extension PreassignedModelPatterns on PreassignedModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PreassignedModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PreassignedModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PreassignedModel value)  $default,){
final _that = this;
switch (_that) {
case _PreassignedModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PreassignedModel value)?  $default,){
final _that = this;
switch (_that) {
case _PreassignedModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String spotId,  String code)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PreassignedModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.spotId,_that.code);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String spotId,  String code)  $default,) {final _that = this;
switch (_that) {
case _PreassignedModel():
return $default(_that.reservationId,_that.reference,_that.spotId,_that.code);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String spotId,  String code)?  $default,) {final _that = this;
switch (_that) {
case _PreassignedModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.spotId,_that.code);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PreassignedModel implements PreassignedModel {
  const _PreassignedModel({required this.reservationId, required this.reference, required this.spotId, required this.code});
  factory _PreassignedModel.fromJson(Map<String, dynamic> json) => _$PreassignedModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String spotId;
@override final  String code;

/// Create a copy of PreassignedModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PreassignedModelCopyWith<_PreassignedModel> get copyWith => __$PreassignedModelCopyWithImpl<_PreassignedModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PreassignedModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PreassignedModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.code, code) || other.code == code));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,spotId,code);
}

@override
String toString() {
    return 'PreassignedModel(reservationId: $reservationId, reference: $reference, spotId: $spotId, code: $code)';
}


}

/// @nodoc
abstract mixin class _$PreassignedModelCopyWith<$Res> implements $PreassignedModelCopyWith<$Res> {
  factory _$PreassignedModelCopyWith(_PreassignedModel value, $Res Function(_PreassignedModel) _then) = __$PreassignedModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String spotId, String code
});




}
/// @nodoc
class __$PreassignedModelCopyWithImpl<$Res>
    implements _$PreassignedModelCopyWith<$Res> {
  __$PreassignedModelCopyWithImpl(this._self, this._then);

  final _PreassignedModel _self;
  final $Res Function(_PreassignedModel) _then;

/// Create a copy of PreassignedModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? spotId = null,Object? code = null,}) {
  return _then(_PreassignedModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,spotId: null == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$PreassignResultModel {

 List<PreassignedModel> get assigned; List<Map<String, dynamic>> get skipped;
/// Create a copy of PreassignResultModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PreassignResultModelCopyWith<PreassignResultModel> get copyWith => _$PreassignResultModelCopyWithImpl<PreassignResultModel>(this as PreassignResultModel, _$identity);

  /// Serializes this PreassignResultModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PreassignResultModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PreassignResultModel&&const DeepCollectionEquality().equals(other.assigned, _this.assigned)&&const DeepCollectionEquality().equals(other.skipped, _this.skipped));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PreassignResultModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.assigned),const DeepCollectionEquality().hash(_this.skipped));
}

@override
String toString() {
  final _this = this as PreassignResultModel;
  return 'PreassignResultModel(assigned: ${_this.assigned}, skipped: ${_this.skipped})';
}


}

/// @nodoc
abstract mixin class $PreassignResultModelCopyWith<$Res>  {
  factory $PreassignResultModelCopyWith(PreassignResultModel value, $Res Function(PreassignResultModel) _then) = _$PreassignResultModelCopyWithImpl;
@useResult
$Res call({
 List<PreassignedModel> assigned, List<Map<String, dynamic>> skipped
});




}
/// @nodoc
class _$PreassignResultModelCopyWithImpl<$Res>
    implements $PreassignResultModelCopyWith<$Res> {
  _$PreassignResultModelCopyWithImpl(this._self, this._then);

  final PreassignResultModel _self;
  final $Res Function(PreassignResultModel) _then;

/// Create a copy of PreassignResultModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? assigned = null,Object? skipped = null,}) {
  return _then(PreassignResultModel(
assigned: null == assigned ? _self.assigned : assigned // ignore: cast_nullable_to_non_nullable
as List<PreassignedModel>,skipped: null == skipped ? _self.skipped : skipped // ignore: cast_nullable_to_non_nullable
as List<Map<String, dynamic>>,
  ));
}

}


/// Adds pattern-matching-related methods to [PreassignResultModel].
extension PreassignResultModelPatterns on PreassignResultModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PreassignResultModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PreassignResultModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PreassignResultModel value)  $default,){
final _that = this;
switch (_that) {
case _PreassignResultModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PreassignResultModel value)?  $default,){
final _that = this;
switch (_that) {
case _PreassignResultModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<PreassignedModel> assigned,  List<Map<String, dynamic>> skipped)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PreassignResultModel() when $default != null:
return $default(_that.assigned,_that.skipped);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<PreassignedModel> assigned,  List<Map<String, dynamic>> skipped)  $default,) {final _that = this;
switch (_that) {
case _PreassignResultModel():
return $default(_that.assigned,_that.skipped);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<PreassignedModel> assigned,  List<Map<String, dynamic>> skipped)?  $default,) {final _that = this;
switch (_that) {
case _PreassignResultModel() when $default != null:
return $default(_that.assigned,_that.skipped);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PreassignResultModel implements PreassignResultModel {
  const _PreassignResultModel({ List<PreassignedModel> assigned = const [],  List<Map<String, dynamic>> skipped = const []}): _assigned = assigned,_skipped = skipped;
  factory _PreassignResultModel.fromJson(Map<String, dynamic> json) => _$PreassignResultModelFromJson(json);

 final  List<PreassignedModel> _assigned;
@override@JsonKey() List<PreassignedModel> get assigned {
  if (_assigned is EqualUnmodifiableListView) return _assigned;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_assigned);
}

 final  List<Map<String, dynamic>> _skipped;
@override@JsonKey() List<Map<String, dynamic>> get skipped {
  if (_skipped is EqualUnmodifiableListView) return _skipped;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_skipped);
}


/// Create a copy of PreassignResultModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PreassignResultModelCopyWith<_PreassignResultModel> get copyWith => __$PreassignResultModelCopyWithImpl<_PreassignResultModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PreassignResultModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PreassignResultModel&&const DeepCollectionEquality().equals(other.assigned, _assigned)&&const DeepCollectionEquality().equals(other.skipped, _skipped));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_assigned),const DeepCollectionEquality().hash(_skipped));
}

@override
String toString() {
    return 'PreassignResultModel(assigned: $assigned, skipped: $skipped)';
}


}

/// @nodoc
abstract mixin class _$PreassignResultModelCopyWith<$Res> implements $PreassignResultModelCopyWith<$Res> {
  factory _$PreassignResultModelCopyWith(_PreassignResultModel value, $Res Function(_PreassignResultModel) _then) = __$PreassignResultModelCopyWithImpl;
@override @useResult
$Res call({
 List<PreassignedModel> assigned, List<Map<String, dynamic>> skipped
});




}
/// @nodoc
class __$PreassignResultModelCopyWithImpl<$Res>
    implements _$PreassignResultModelCopyWith<$Res> {
  __$PreassignResultModelCopyWithImpl(this._self, this._then);

  final _PreassignResultModel _self;
  final $Res Function(_PreassignResultModel) _then;

/// Create a copy of PreassignResultModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? assigned = null,Object? skipped = null,}) {
  return _then(_PreassignResultModel(
assigned: null == assigned ? _self._assigned : assigned // ignore: cast_nullable_to_non_nullable
as List<PreassignedModel>,skipped: null == skipped ? _self._skipped : skipped // ignore: cast_nullable_to_non_nullable
as List<Map<String, dynamic>>,
  ));
}


}


/// @nodoc
mixin _$PreassignEnvelopeModel {

 PreassignResultModel get data;
/// Create a copy of PreassignEnvelopeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PreassignEnvelopeModelCopyWith<PreassignEnvelopeModel> get copyWith => _$PreassignEnvelopeModelCopyWithImpl<PreassignEnvelopeModel>(this as PreassignEnvelopeModel, _$identity);

  /// Serializes this PreassignEnvelopeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PreassignEnvelopeModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PreassignEnvelopeModel&&(identical(other.data, _this.data) || other.data == _this.data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PreassignEnvelopeModel;
  return Object.hash(runtimeType,_this.data);
}

@override
String toString() {
  final _this = this as PreassignEnvelopeModel;
  return 'PreassignEnvelopeModel(data: ${_this.data})';
}


}

/// @nodoc
abstract mixin class $PreassignEnvelopeModelCopyWith<$Res>  {
  factory $PreassignEnvelopeModelCopyWith(PreassignEnvelopeModel value, $Res Function(PreassignEnvelopeModel) _then) = _$PreassignEnvelopeModelCopyWithImpl;
@useResult
$Res call({
 PreassignResultModel data
});


$PreassignResultModelCopyWith<$Res> get data;

}
/// @nodoc
class _$PreassignEnvelopeModelCopyWithImpl<$Res>
    implements $PreassignEnvelopeModelCopyWith<$Res> {
  _$PreassignEnvelopeModelCopyWithImpl(this._self, this._then);

  final PreassignEnvelopeModel _self;
  final $Res Function(PreassignEnvelopeModel) _then;

/// Create a copy of PreassignEnvelopeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? data = null,}) {
  return _then(PreassignEnvelopeModel(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as PreassignResultModel,
  ));
}
/// Create a copy of PreassignEnvelopeModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PreassignResultModelCopyWith<$Res> get data {
  
  return $PreassignResultModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [PreassignEnvelopeModel].
extension PreassignEnvelopeModelPatterns on PreassignEnvelopeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PreassignEnvelopeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PreassignEnvelopeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PreassignEnvelopeModel value)  $default,){
final _that = this;
switch (_that) {
case _PreassignEnvelopeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PreassignEnvelopeModel value)?  $default,){
final _that = this;
switch (_that) {
case _PreassignEnvelopeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( PreassignResultModel data)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PreassignEnvelopeModel() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( PreassignResultModel data)  $default,) {final _that = this;
switch (_that) {
case _PreassignEnvelopeModel():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( PreassignResultModel data)?  $default,) {final _that = this;
switch (_that) {
case _PreassignEnvelopeModel() when $default != null:
return $default(_that.data);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PreassignEnvelopeModel implements PreassignEnvelopeModel {
  const _PreassignEnvelopeModel({required this.data});
  factory _PreassignEnvelopeModel.fromJson(Map<String, dynamic> json) => _$PreassignEnvelopeModelFromJson(json);

@override final  PreassignResultModel data;

/// Create a copy of PreassignEnvelopeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PreassignEnvelopeModelCopyWith<_PreassignEnvelopeModel> get copyWith => __$PreassignEnvelopeModelCopyWithImpl<_PreassignEnvelopeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PreassignEnvelopeModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PreassignEnvelopeModel&&(identical(other.data, data) || other.data == data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,data);
}

@override
String toString() {
    return 'PreassignEnvelopeModel(data: $data)';
}


}

/// @nodoc
abstract mixin class _$PreassignEnvelopeModelCopyWith<$Res> implements $PreassignEnvelopeModelCopyWith<$Res> {
  factory _$PreassignEnvelopeModelCopyWith(_PreassignEnvelopeModel value, $Res Function(_PreassignEnvelopeModel) _then) = __$PreassignEnvelopeModelCopyWithImpl;
@override @useResult
$Res call({
 PreassignResultModel data
});


@override $PreassignResultModelCopyWith<$Res> get data;

}
/// @nodoc
class __$PreassignEnvelopeModelCopyWithImpl<$Res>
    implements _$PreassignEnvelopeModelCopyWith<$Res> {
  __$PreassignEnvelopeModelCopyWithImpl(this._self, this._then);

  final _PreassignEnvelopeModel _self;
  final $Res Function(_PreassignEnvelopeModel) _then;

/// Create a copy of PreassignEnvelopeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? data = null,}) {
  return _then(_PreassignEnvelopeModel(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as PreassignResultModel,
  ));
}

/// Create a copy of PreassignEnvelopeModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PreassignResultModelCopyWith<$Res> get data {
  
  return $PreassignResultModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
