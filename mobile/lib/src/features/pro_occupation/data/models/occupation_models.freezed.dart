// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'occupation_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OccupantModel {

 String get id; String get reference; String get customerName; String get plate; String get status; String get arrivalAt; String get returnAt; String? get returnFlight; String? get spotId; String? get keyHook; bool get onSite; bool get leavesToday;/// Search results carry the spot's code.
 SpotRefModel? get spot;/// Arrivals to place carry their suggestions.
 List<SuggestionModel> get suggestions;
/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<OccupantModel> get copyWith => _$OccupantModelCopyWithImpl<OccupantModel>(this as OccupantModel, _$identity);

  /// Serializes this OccupantModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OccupantModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OccupantModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.keyHook, _this.keyHook) || other.keyHook == _this.keyHook)&&(identical(other.onSite, _this.onSite) || other.onSite == _this.onSite)&&(identical(other.leavesToday, _this.leavesToday) || other.leavesToday == _this.leavesToday)&&(identical(other.spot, _this.spot) || other.spot == _this.spot)&&const DeepCollectionEquality().equals(other.suggestions, _this.suggestions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OccupantModel;
  return Object.hash(runtimeType,_this.id,_this.reference,_this.customerName,_this.plate,_this.status,_this.arrivalAt,_this.returnAt,_this.returnFlight,_this.spotId,_this.keyHook,_this.onSite,_this.leavesToday,_this.spot,const DeepCollectionEquality().hash(_this.suggestions));
}

@override
String toString() {
  final _this = this as OccupantModel;
  return 'OccupantModel(id: ${_this.id}, reference: ${_this.reference}, customerName: ${_this.customerName}, plate: ${_this.plate}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, returnFlight: ${_this.returnFlight}, spotId: ${_this.spotId}, keyHook: ${_this.keyHook}, onSite: ${_this.onSite}, leavesToday: ${_this.leavesToday}, spot: ${_this.spot}, suggestions: ${_this.suggestions})';
}


}

/// @nodoc
abstract mixin class $OccupantModelCopyWith<$Res>  {
  factory $OccupantModelCopyWith(OccupantModel value, $Res Function(OccupantModel) _then) = _$OccupantModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String customerName, String plate, String status, String arrivalAt, String returnAt, String? returnFlight, String? spotId, String? keyHook, bool onSite, bool leavesToday, SpotRefModel? spot, List<SuggestionModel> suggestions
});


$SpotRefModelCopyWith<$Res>? get spot;

}
/// @nodoc
class _$OccupantModelCopyWithImpl<$Res>
    implements $OccupantModelCopyWith<$Res> {
  _$OccupantModelCopyWithImpl(this._self, this._then);

  final OccupantModel _self;
  final $Res Function(OccupantModel) _then;

/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? returnFlight = freezed,Object? spotId = freezed,Object? keyHook = freezed,Object? onSite = null,Object? leavesToday = null,Object? spot = freezed,Object? suggestions = null,}) {
  return _then(OccupantModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,spotId: freezed == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as bool,leavesToday: null == leavesToday ? _self.leavesToday : leavesToday // ignore: cast_nullable_to_non_nullable
as bool,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as SpotRefModel?,suggestions: null == suggestions ? _self.suggestions : suggestions // ignore: cast_nullable_to_non_nullable
as List<SuggestionModel>,
  ));
}
/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SpotRefModelCopyWith<$Res>? get spot {
    if (_self.spot == null) {
    return null;
  }

  return $SpotRefModelCopyWith<$Res>(_self.spot!, (value) {
    return _then(_self.copyWith(spot: value));
  });
}
}


/// Adds pattern-matching-related methods to [OccupantModel].
extension OccupantModelPatterns on OccupantModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OccupantModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OccupantModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OccupantModel value)  $default,){
final _that = this;
switch (_that) {
case _OccupantModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OccupantModel value)?  $default,){
final _that = this;
switch (_that) {
case _OccupantModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String plate,  String status,  String arrivalAt,  String returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  bool onSite,  bool leavesToday,  SpotRefModel? spot,  List<SuggestionModel> suggestions)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OccupantModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.onSite,_that.leavesToday,_that.spot,_that.suggestions);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String plate,  String status,  String arrivalAt,  String returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  bool onSite,  bool leavesToday,  SpotRefModel? spot,  List<SuggestionModel> suggestions)  $default,) {final _that = this;
switch (_that) {
case _OccupantModel():
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.onSite,_that.leavesToday,_that.spot,_that.suggestions);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String customerName,  String plate,  String status,  String arrivalAt,  String returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  bool onSite,  bool leavesToday,  SpotRefModel? spot,  List<SuggestionModel> suggestions)?  $default,) {final _that = this;
switch (_that) {
case _OccupantModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.onSite,_that.leavesToday,_that.spot,_that.suggestions);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OccupantModel implements OccupantModel {
  const _OccupantModel({required this.id, required this.reference, required this.customerName, required this.plate, required this.status, required this.arrivalAt, required this.returnAt, this.returnFlight, this.spotId, this.keyHook, this.onSite = false, this.leavesToday = false, this.spot,  List<SuggestionModel> suggestions = const []}): _suggestions = suggestions;
  factory _OccupantModel.fromJson(Map<String, dynamic> json) => _$OccupantModelFromJson(json);

@override final  String id;
@override final  String reference;
@override final  String customerName;
@override final  String plate;
@override final  String status;
@override final  String arrivalAt;
@override final  String returnAt;
@override final  String? returnFlight;
@override final  String? spotId;
@override final  String? keyHook;
@override@JsonKey() final  bool onSite;
@override@JsonKey() final  bool leavesToday;
/// Search results carry the spot's code.
@override final  SpotRefModel? spot;
/// Arrivals to place carry their suggestions.
 final  List<SuggestionModel> _suggestions;
/// Arrivals to place carry their suggestions.
@override@JsonKey() List<SuggestionModel> get suggestions {
  if (_suggestions is EqualUnmodifiableListView) return _suggestions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_suggestions);
}


/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OccupantModelCopyWith<_OccupantModel> get copyWith => __$OccupantModelCopyWithImpl<_OccupantModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OccupantModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OccupantModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.keyHook, keyHook) || other.keyHook == keyHook)&&(identical(other.onSite, onSite) || other.onSite == onSite)&&(identical(other.leavesToday, leavesToday) || other.leavesToday == leavesToday)&&(identical(other.spot, spot) || other.spot == spot)&&const DeepCollectionEquality().equals(other.suggestions, _suggestions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,reference,customerName,plate,status,arrivalAt,returnAt,returnFlight,spotId,keyHook,onSite,leavesToday,spot,const DeepCollectionEquality().hash(_suggestions));
}

@override
String toString() {
    return 'OccupantModel(id: $id, reference: $reference, customerName: $customerName, plate: $plate, status: $status, arrivalAt: $arrivalAt, returnAt: $returnAt, returnFlight: $returnFlight, spotId: $spotId, keyHook: $keyHook, onSite: $onSite, leavesToday: $leavesToday, spot: $spot, suggestions: $suggestions)';
}


}

/// @nodoc
abstract mixin class _$OccupantModelCopyWith<$Res> implements $OccupantModelCopyWith<$Res> {
  factory _$OccupantModelCopyWith(_OccupantModel value, $Res Function(_OccupantModel) _then) = __$OccupantModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String customerName, String plate, String status, String arrivalAt, String returnAt, String? returnFlight, String? spotId, String? keyHook, bool onSite, bool leavesToday, SpotRefModel? spot, List<SuggestionModel> suggestions
});


@override $SpotRefModelCopyWith<$Res>? get spot;

}
/// @nodoc
class __$OccupantModelCopyWithImpl<$Res>
    implements _$OccupantModelCopyWith<$Res> {
  __$OccupantModelCopyWithImpl(this._self, this._then);

  final _OccupantModel _self;
  final $Res Function(_OccupantModel) _then;

/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? returnFlight = freezed,Object? spotId = freezed,Object? keyHook = freezed,Object? onSite = null,Object? leavesToday = null,Object? spot = freezed,Object? suggestions = null,}) {
  return _then(_OccupantModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,spotId: freezed == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as bool,leavesToday: null == leavesToday ? _self.leavesToday : leavesToday // ignore: cast_nullable_to_non_nullable
as bool,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as SpotRefModel?,suggestions: null == suggestions ? _self._suggestions : suggestions // ignore: cast_nullable_to_non_nullable
as List<SuggestionModel>,
  ));
}

/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SpotRefModelCopyWith<$Res>? get spot {
    if (_self.spot == null) {
    return null;
  }

  return $SpotRefModelCopyWith<$Res>(_self.spot!, (value) {
    return _then(_self.copyWith(spot: value));
  });
}
}


/// @nodoc
mixin _$SpotRefModel {

 String get code;
/// Create a copy of SpotRefModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SpotRefModelCopyWith<SpotRefModel> get copyWith => _$SpotRefModelCopyWithImpl<SpotRefModel>(this as SpotRefModel, _$identity);

  /// Serializes this SpotRefModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SpotRefModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SpotRefModel&&(identical(other.code, _this.code) || other.code == _this.code));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SpotRefModel;
  return Object.hash(runtimeType,_this.code);
}

@override
String toString() {
  final _this = this as SpotRefModel;
  return 'SpotRefModel(code: ${_this.code})';
}


}

/// @nodoc
abstract mixin class $SpotRefModelCopyWith<$Res>  {
  factory $SpotRefModelCopyWith(SpotRefModel value, $Res Function(SpotRefModel) _then) = _$SpotRefModelCopyWithImpl;
@useResult
$Res call({
 String code
});




}
/// @nodoc
class _$SpotRefModelCopyWithImpl<$Res>
    implements $SpotRefModelCopyWith<$Res> {
  _$SpotRefModelCopyWithImpl(this._self, this._then);

  final SpotRefModel _self;
  final $Res Function(SpotRefModel) _then;

/// Create a copy of SpotRefModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? code = null,}) {
  return _then(SpotRefModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SpotRefModel].
extension SpotRefModelPatterns on SpotRefModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SpotRefModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SpotRefModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SpotRefModel value)  $default,){
final _that = this;
switch (_that) {
case _SpotRefModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SpotRefModel value)?  $default,){
final _that = this;
switch (_that) {
case _SpotRefModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String code)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SpotRefModel() when $default != null:
return $default(_that.code);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String code)  $default,) {final _that = this;
switch (_that) {
case _SpotRefModel():
return $default(_that.code);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String code)?  $default,) {final _that = this;
switch (_that) {
case _SpotRefModel() when $default != null:
return $default(_that.code);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SpotRefModel implements SpotRefModel {
  const _SpotRefModel({required this.code});
  factory _SpotRefModel.fromJson(Map<String, dynamic> json) => _$SpotRefModelFromJson(json);

@override final  String code;

/// Create a copy of SpotRefModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SpotRefModelCopyWith<_SpotRefModel> get copyWith => __$SpotRefModelCopyWithImpl<_SpotRefModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SpotRefModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SpotRefModel&&(identical(other.code, code) || other.code == code));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,code);
}

@override
String toString() {
    return 'SpotRefModel(code: $code)';
}


}

/// @nodoc
abstract mixin class _$SpotRefModelCopyWith<$Res> implements $SpotRefModelCopyWith<$Res> {
  factory _$SpotRefModelCopyWith(_SpotRefModel value, $Res Function(_SpotRefModel) _then) = __$SpotRefModelCopyWithImpl;
@override @useResult
$Res call({
 String code
});




}
/// @nodoc
class __$SpotRefModelCopyWithImpl<$Res>
    implements _$SpotRefModelCopyWith<$Res> {
  __$SpotRefModelCopyWithImpl(this._self, this._then);

  final _SpotRefModel _self;
  final $Res Function(_SpotRefModel) _then;

/// Create a copy of SpotRefModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? code = null,}) {
  return _then(_SpotRefModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$SuggestionModel {

 String get spotId; String get code; int? get distanceM; String get reason;
/// Create a copy of SuggestionModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SuggestionModelCopyWith<SuggestionModel> get copyWith => _$SuggestionModelCopyWithImpl<SuggestionModel>(this as SuggestionModel, _$identity);

  /// Serializes this SuggestionModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SuggestionModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SuggestionModel&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.reason, _this.reason) || other.reason == _this.reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SuggestionModel;
  return Object.hash(runtimeType,_this.spotId,_this.code,_this.distanceM,_this.reason);
}

@override
String toString() {
  final _this = this as SuggestionModel;
  return 'SuggestionModel(spotId: ${_this.spotId}, code: ${_this.code}, distanceM: ${_this.distanceM}, reason: ${_this.reason})';
}


}

/// @nodoc
abstract mixin class $SuggestionModelCopyWith<$Res>  {
  factory $SuggestionModelCopyWith(SuggestionModel value, $Res Function(SuggestionModel) _then) = _$SuggestionModelCopyWithImpl;
@useResult
$Res call({
 String spotId, String code, int? distanceM, String reason
});




}
/// @nodoc
class _$SuggestionModelCopyWithImpl<$Res>
    implements $SuggestionModelCopyWith<$Res> {
  _$SuggestionModelCopyWithImpl(this._self, this._then);

  final SuggestionModel _self;
  final $Res Function(SuggestionModel) _then;

/// Create a copy of SuggestionModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? spotId = null,Object? code = null,Object? distanceM = freezed,Object? reason = null,}) {
  return _then(SuggestionModel(
spotId: null == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SuggestionModel].
extension SuggestionModelPatterns on SuggestionModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SuggestionModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SuggestionModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SuggestionModel value)  $default,){
final _that = this;
switch (_that) {
case _SuggestionModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SuggestionModel value)?  $default,){
final _that = this;
switch (_that) {
case _SuggestionModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String spotId,  String code,  int? distanceM,  String reason)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SuggestionModel() when $default != null:
return $default(_that.spotId,_that.code,_that.distanceM,_that.reason);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String spotId,  String code,  int? distanceM,  String reason)  $default,) {final _that = this;
switch (_that) {
case _SuggestionModel():
return $default(_that.spotId,_that.code,_that.distanceM,_that.reason);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String spotId,  String code,  int? distanceM,  String reason)?  $default,) {final _that = this;
switch (_that) {
case _SuggestionModel() when $default != null:
return $default(_that.spotId,_that.code,_that.distanceM,_that.reason);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SuggestionModel implements SuggestionModel {
  const _SuggestionModel({required this.spotId, required this.code, this.distanceM, required this.reason});
  factory _SuggestionModel.fromJson(Map<String, dynamic> json) => _$SuggestionModelFromJson(json);

@override final  String spotId;
@override final  String code;
@override final  int? distanceM;
@override final  String reason;

/// Create a copy of SuggestionModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SuggestionModelCopyWith<_SuggestionModel> get copyWith => __$SuggestionModelCopyWithImpl<_SuggestionModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SuggestionModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SuggestionModel&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.code, code) || other.code == code)&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.reason, reason) || other.reason == reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,spotId,code,distanceM,reason);
}

@override
String toString() {
    return 'SuggestionModel(spotId: $spotId, code: $code, distanceM: $distanceM, reason: $reason)';
}


}

/// @nodoc
abstract mixin class _$SuggestionModelCopyWith<$Res> implements $SuggestionModelCopyWith<$Res> {
  factory _$SuggestionModelCopyWith(_SuggestionModel value, $Res Function(_SuggestionModel) _then) = __$SuggestionModelCopyWithImpl;
@override @useResult
$Res call({
 String spotId, String code, int? distanceM, String reason
});




}
/// @nodoc
class __$SuggestionModelCopyWithImpl<$Res>
    implements _$SuggestionModelCopyWith<$Res> {
  __$SuggestionModelCopyWithImpl(this._self, this._then);

  final _SuggestionModel _self;
  final $Res Function(_SuggestionModel) _then;

/// Create a copy of SuggestionModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? spotId = null,Object? code = null,Object? distanceM = freezed,Object? reason = null,}) {
  return _then(_SuggestionModel(
spotId: null == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$SpotStateModel {

 String get id; String get zoneId; String get code; int get row; int get index; String get kind; bool get active; List<List<double>> get geometry; OccupantModel? get occupant;
/// Create a copy of SpotStateModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SpotStateModelCopyWith<SpotStateModel> get copyWith => _$SpotStateModelCopyWithImpl<SpotStateModel>(this as SpotStateModel, _$identity);

  /// Serializes this SpotStateModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SpotStateModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SpotStateModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.zoneId, _this.zoneId) || other.zoneId == _this.zoneId)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.row, _this.row) || other.row == _this.row)&&(identical(other.index, _this.index) || other.index == _this.index)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.active, _this.active) || other.active == _this.active)&&const DeepCollectionEquality().equals(other.geometry, _this.geometry)&&(identical(other.occupant, _this.occupant) || other.occupant == _this.occupant));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SpotStateModel;
  return Object.hash(runtimeType,_this.id,_this.zoneId,_this.code,_this.row,_this.index,_this.kind,_this.active,const DeepCollectionEquality().hash(_this.geometry),_this.occupant);
}

@override
String toString() {
  final _this = this as SpotStateModel;
  return 'SpotStateModel(id: ${_this.id}, zoneId: ${_this.zoneId}, code: ${_this.code}, row: ${_this.row}, index: ${_this.index}, kind: ${_this.kind}, active: ${_this.active}, geometry: ${_this.geometry}, occupant: ${_this.occupant})';
}


}

/// @nodoc
abstract mixin class $SpotStateModelCopyWith<$Res>  {
  factory $SpotStateModelCopyWith(SpotStateModel value, $Res Function(SpotStateModel) _then) = _$SpotStateModelCopyWithImpl;
@useResult
$Res call({
 String id, String zoneId, String code, int row, int index, String kind, bool active, List<List<double>> geometry, OccupantModel? occupant
});


$OccupantModelCopyWith<$Res>? get occupant;

}
/// @nodoc
class _$SpotStateModelCopyWithImpl<$Res>
    implements $SpotStateModelCopyWith<$Res> {
  _$SpotStateModelCopyWithImpl(this._self, this._then);

  final SpotStateModel _self;
  final $Res Function(SpotStateModel) _then;

/// Create a copy of SpotStateModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? zoneId = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? geometry = null,Object? occupant = freezed,}) {
  return _then(SpotStateModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,zoneId: null == zoneId ? _self.zoneId : zoneId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,geometry: null == geometry ? _self.geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,occupant: freezed == occupant ? _self.occupant : occupant // ignore: cast_nullable_to_non_nullable
as OccupantModel?,
  ));
}
/// Create a copy of SpotStateModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<$Res>? get occupant {
    if (_self.occupant == null) {
    return null;
  }

  return $OccupantModelCopyWith<$Res>(_self.occupant!, (value) {
    return _then(_self.copyWith(occupant: value));
  });
}
}


/// Adds pattern-matching-related methods to [SpotStateModel].
extension SpotStateModelPatterns on SpotStateModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SpotStateModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SpotStateModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SpotStateModel value)  $default,){
final _that = this;
switch (_that) {
case _SpotStateModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SpotStateModel value)?  $default,){
final _that = this;
switch (_that) {
case _SpotStateModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  List<List<double>> geometry,  OccupantModel? occupant)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SpotStateModel() when $default != null:
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.geometry,_that.occupant);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  List<List<double>> geometry,  OccupantModel? occupant)  $default,) {final _that = this;
switch (_that) {
case _SpotStateModel():
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.geometry,_that.occupant);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  List<List<double>> geometry,  OccupantModel? occupant)?  $default,) {final _that = this;
switch (_that) {
case _SpotStateModel() when $default != null:
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.geometry,_that.occupant);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SpotStateModel implements SpotStateModel {
  const _SpotStateModel({required this.id, required this.zoneId, required this.code, required this.row, required this.index, required this.kind, required this.active, required  List<List<double>> geometry, this.occupant}): _geometry = geometry;
  factory _SpotStateModel.fromJson(Map<String, dynamic> json) => _$SpotStateModelFromJson(json);

@override final  String id;
@override final  String zoneId;
@override final  String code;
@override final  int row;
@override final  int index;
@override final  String kind;
@override final  bool active;
 final  List<List<double>> _geometry;
@override List<List<double>> get geometry {
  if (_geometry is EqualUnmodifiableListView) return _geometry;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_geometry);
}

@override final  OccupantModel? occupant;

/// Create a copy of SpotStateModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SpotStateModelCopyWith<_SpotStateModel> get copyWith => __$SpotStateModelCopyWithImpl<_SpotStateModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SpotStateModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SpotStateModel&&(identical(other.id, id) || other.id == id)&&(identical(other.zoneId, zoneId) || other.zoneId == zoneId)&&(identical(other.code, code) || other.code == code)&&(identical(other.row, row) || other.row == row)&&(identical(other.index, index) || other.index == index)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.active, active) || other.active == active)&&const DeepCollectionEquality().equals(other.geometry, _geometry)&&(identical(other.occupant, occupant) || other.occupant == occupant));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,zoneId,code,row,index,kind,active,const DeepCollectionEquality().hash(_geometry),occupant);
}

@override
String toString() {
    return 'SpotStateModel(id: $id, zoneId: $zoneId, code: $code, row: $row, index: $index, kind: $kind, active: $active, geometry: $geometry, occupant: $occupant)';
}


}

/// @nodoc
abstract mixin class _$SpotStateModelCopyWith<$Res> implements $SpotStateModelCopyWith<$Res> {
  factory _$SpotStateModelCopyWith(_SpotStateModel value, $Res Function(_SpotStateModel) _then) = __$SpotStateModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String zoneId, String code, int row, int index, String kind, bool active, List<List<double>> geometry, OccupantModel? occupant
});


@override $OccupantModelCopyWith<$Res>? get occupant;

}
/// @nodoc
class __$SpotStateModelCopyWithImpl<$Res>
    implements _$SpotStateModelCopyWith<$Res> {
  __$SpotStateModelCopyWithImpl(this._self, this._then);

  final _SpotStateModel _self;
  final $Res Function(_SpotStateModel) _then;

/// Create a copy of SpotStateModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? zoneId = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? geometry = null,Object? occupant = freezed,}) {
  return _then(_SpotStateModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,zoneId: null == zoneId ? _self.zoneId : zoneId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,geometry: null == geometry ? _self._geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,occupant: freezed == occupant ? _self.occupant : occupant // ignore: cast_nullable_to_non_nullable
as OccupantModel?,
  ));
}

/// Create a copy of SpotStateModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<$Res>? get occupant {
    if (_self.occupant == null) {
    return null;
  }

  return $OccupantModelCopyWith<$Res>(_self.occupant!, (value) {
    return _then(_self.copyWith(occupant: value));
  });
}
}


/// @nodoc
mixin _$OccupationStatsModel {

 int get active; int get occupied; int get leavingToday;
/// Create a copy of OccupationStatsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OccupationStatsModelCopyWith<OccupationStatsModel> get copyWith => _$OccupationStatsModelCopyWithImpl<OccupationStatsModel>(this as OccupationStatsModel, _$identity);

  /// Serializes this OccupationStatsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OccupationStatsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OccupationStatsModel&&(identical(other.active, _this.active) || other.active == _this.active)&&(identical(other.occupied, _this.occupied) || other.occupied == _this.occupied)&&(identical(other.leavingToday, _this.leavingToday) || other.leavingToday == _this.leavingToday));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OccupationStatsModel;
  return Object.hash(runtimeType,_this.active,_this.occupied,_this.leavingToday);
}

@override
String toString() {
  final _this = this as OccupationStatsModel;
  return 'OccupationStatsModel(active: ${_this.active}, occupied: ${_this.occupied}, leavingToday: ${_this.leavingToday})';
}


}

/// @nodoc
abstract mixin class $OccupationStatsModelCopyWith<$Res>  {
  factory $OccupationStatsModelCopyWith(OccupationStatsModel value, $Res Function(OccupationStatsModel) _then) = _$OccupationStatsModelCopyWithImpl;
@useResult
$Res call({
 int active, int occupied, int leavingToday
});




}
/// @nodoc
class _$OccupationStatsModelCopyWithImpl<$Res>
    implements $OccupationStatsModelCopyWith<$Res> {
  _$OccupationStatsModelCopyWithImpl(this._self, this._then);

  final OccupationStatsModel _self;
  final $Res Function(OccupationStatsModel) _then;

/// Create a copy of OccupationStatsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? active = null,Object? occupied = null,Object? leavingToday = null,}) {
  return _then(OccupationStatsModel(
active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as int,occupied: null == occupied ? _self.occupied : occupied // ignore: cast_nullable_to_non_nullable
as int,leavingToday: null == leavingToday ? _self.leavingToday : leavingToday // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [OccupationStatsModel].
extension OccupationStatsModelPatterns on OccupationStatsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OccupationStatsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OccupationStatsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OccupationStatsModel value)  $default,){
final _that = this;
switch (_that) {
case _OccupationStatsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OccupationStatsModel value)?  $default,){
final _that = this;
switch (_that) {
case _OccupationStatsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int active,  int occupied,  int leavingToday)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OccupationStatsModel() when $default != null:
return $default(_that.active,_that.occupied,_that.leavingToday);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int active,  int occupied,  int leavingToday)  $default,) {final _that = this;
switch (_that) {
case _OccupationStatsModel():
return $default(_that.active,_that.occupied,_that.leavingToday);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int active,  int occupied,  int leavingToday)?  $default,) {final _that = this;
switch (_that) {
case _OccupationStatsModel() when $default != null:
return $default(_that.active,_that.occupied,_that.leavingToday);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OccupationStatsModel implements OccupationStatsModel {
  const _OccupationStatsModel({required this.active, required this.occupied, required this.leavingToday});
  factory _OccupationStatsModel.fromJson(Map<String, dynamic> json) => _$OccupationStatsModelFromJson(json);

@override final  int active;
@override final  int occupied;
@override final  int leavingToday;

/// Create a copy of OccupationStatsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OccupationStatsModelCopyWith<_OccupationStatsModel> get copyWith => __$OccupationStatsModelCopyWithImpl<_OccupationStatsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OccupationStatsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OccupationStatsModel&&(identical(other.active, active) || other.active == active)&&(identical(other.occupied, occupied) || other.occupied == occupied)&&(identical(other.leavingToday, leavingToday) || other.leavingToday == leavingToday));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,active,occupied,leavingToday);
}

@override
String toString() {
    return 'OccupationStatsModel(active: $active, occupied: $occupied, leavingToday: $leavingToday)';
}


}

/// @nodoc
abstract mixin class _$OccupationStatsModelCopyWith<$Res> implements $OccupationStatsModelCopyWith<$Res> {
  factory _$OccupationStatsModelCopyWith(_OccupationStatsModel value, $Res Function(_OccupationStatsModel) _then) = __$OccupationStatsModelCopyWithImpl;
@override @useResult
$Res call({
 int active, int occupied, int leavingToday
});




}
/// @nodoc
class __$OccupationStatsModelCopyWithImpl<$Res>
    implements _$OccupationStatsModelCopyWith<$Res> {
  __$OccupationStatsModelCopyWithImpl(this._self, this._then);

  final _OccupationStatsModel _self;
  final $Res Function(_OccupationStatsModel) _then;

/// Create a copy of OccupationStatsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? active = null,Object? occupied = null,Object? leavingToday = null,}) {
  return _then(_OccupationStatsModel(
active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as int,occupied: null == occupied ? _self.occupied : occupied // ignore: cast_nullable_to_non_nullable
as int,leavingToday: null == leavingToday ? _self.leavingToday : leavingToday // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$OccupationBoardModel {

 String get date; List<SpotStateModel> get spots; List<OccupantModel> get arrivals; OccupationStatsModel get stats;
/// Create a copy of OccupationBoardModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OccupationBoardModelCopyWith<OccupationBoardModel> get copyWith => _$OccupationBoardModelCopyWithImpl<OccupationBoardModel>(this as OccupationBoardModel, _$identity);

  /// Serializes this OccupationBoardModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OccupationBoardModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OccupationBoardModel&&(identical(other.date, _this.date) || other.date == _this.date)&&const DeepCollectionEquality().equals(other.spots, _this.spots)&&const DeepCollectionEquality().equals(other.arrivals, _this.arrivals)&&(identical(other.stats, _this.stats) || other.stats == _this.stats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OccupationBoardModel;
  return Object.hash(runtimeType,_this.date,const DeepCollectionEquality().hash(_this.spots),const DeepCollectionEquality().hash(_this.arrivals),_this.stats);
}

@override
String toString() {
  final _this = this as OccupationBoardModel;
  return 'OccupationBoardModel(date: ${_this.date}, spots: ${_this.spots}, arrivals: ${_this.arrivals}, stats: ${_this.stats})';
}


}

/// @nodoc
abstract mixin class $OccupationBoardModelCopyWith<$Res>  {
  factory $OccupationBoardModelCopyWith(OccupationBoardModel value, $Res Function(OccupationBoardModel) _then) = _$OccupationBoardModelCopyWithImpl;
@useResult
$Res call({
 String date, List<SpotStateModel> spots, List<OccupantModel> arrivals, OccupationStatsModel stats
});


$OccupationStatsModelCopyWith<$Res> get stats;

}
/// @nodoc
class _$OccupationBoardModelCopyWithImpl<$Res>
    implements $OccupationBoardModelCopyWith<$Res> {
  _$OccupationBoardModelCopyWithImpl(this._self, this._then);

  final OccupationBoardModel _self;
  final $Res Function(OccupationBoardModel) _then;

/// Create a copy of OccupationBoardModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? spots = null,Object? arrivals = null,Object? stats = null,}) {
  return _then(OccupationBoardModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,spots: null == spots ? _self.spots : spots // ignore: cast_nullable_to_non_nullable
as List<SpotStateModel>,arrivals: null == arrivals ? _self.arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,stats: null == stats ? _self.stats : stats // ignore: cast_nullable_to_non_nullable
as OccupationStatsModel,
  ));
}
/// Create a copy of OccupationBoardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupationStatsModelCopyWith<$Res> get stats {
  
  return $OccupationStatsModelCopyWith<$Res>(_self.stats, (value) {
    return _then(_self.copyWith(stats: value));
  });
}
}


/// Adds pattern-matching-related methods to [OccupationBoardModel].
extension OccupationBoardModelPatterns on OccupationBoardModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OccupationBoardModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OccupationBoardModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OccupationBoardModel value)  $default,){
final _that = this;
switch (_that) {
case _OccupationBoardModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OccupationBoardModel value)?  $default,){
final _that = this;
switch (_that) {
case _OccupationBoardModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  List<SpotStateModel> spots,  List<OccupantModel> arrivals,  OccupationStatsModel stats)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OccupationBoardModel() when $default != null:
return $default(_that.date,_that.spots,_that.arrivals,_that.stats);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  List<SpotStateModel> spots,  List<OccupantModel> arrivals,  OccupationStatsModel stats)  $default,) {final _that = this;
switch (_that) {
case _OccupationBoardModel():
return $default(_that.date,_that.spots,_that.arrivals,_that.stats);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  List<SpotStateModel> spots,  List<OccupantModel> arrivals,  OccupationStatsModel stats)?  $default,) {final _that = this;
switch (_that) {
case _OccupationBoardModel() when $default != null:
return $default(_that.date,_that.spots,_that.arrivals,_that.stats);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OccupationBoardModel implements OccupationBoardModel {
  const _OccupationBoardModel({required this.date,  List<SpotStateModel> spots = const [],  List<OccupantModel> arrivals = const [], required this.stats}): _spots = spots,_arrivals = arrivals;
  factory _OccupationBoardModel.fromJson(Map<String, dynamic> json) => _$OccupationBoardModelFromJson(json);

@override final  String date;
 final  List<SpotStateModel> _spots;
@override@JsonKey() List<SpotStateModel> get spots {
  if (_spots is EqualUnmodifiableListView) return _spots;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_spots);
}

 final  List<OccupantModel> _arrivals;
@override@JsonKey() List<OccupantModel> get arrivals {
  if (_arrivals is EqualUnmodifiableListView) return _arrivals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_arrivals);
}

@override final  OccupationStatsModel stats;

/// Create a copy of OccupationBoardModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OccupationBoardModelCopyWith<_OccupationBoardModel> get copyWith => __$OccupationBoardModelCopyWithImpl<_OccupationBoardModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OccupationBoardModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OccupationBoardModel&&(identical(other.date, date) || other.date == date)&&const DeepCollectionEquality().equals(other.spots, _spots)&&const DeepCollectionEquality().equals(other.arrivals, _arrivals)&&(identical(other.stats, stats) || other.stats == stats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,date,const DeepCollectionEquality().hash(_spots),const DeepCollectionEquality().hash(_arrivals),stats);
}

@override
String toString() {
    return 'OccupationBoardModel(date: $date, spots: $spots, arrivals: $arrivals, stats: $stats)';
}


}

/// @nodoc
abstract mixin class _$OccupationBoardModelCopyWith<$Res> implements $OccupationBoardModelCopyWith<$Res> {
  factory _$OccupationBoardModelCopyWith(_OccupationBoardModel value, $Res Function(_OccupationBoardModel) _then) = __$OccupationBoardModelCopyWithImpl;
@override @useResult
$Res call({
 String date, List<SpotStateModel> spots, List<OccupantModel> arrivals, OccupationStatsModel stats
});


@override $OccupationStatsModelCopyWith<$Res> get stats;

}
/// @nodoc
class __$OccupationBoardModelCopyWithImpl<$Res>
    implements _$OccupationBoardModelCopyWith<$Res> {
  __$OccupationBoardModelCopyWithImpl(this._self, this._then);

  final _OccupationBoardModel _self;
  final $Res Function(_OccupationBoardModel) _then;

/// Create a copy of OccupationBoardModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? spots = null,Object? arrivals = null,Object? stats = null,}) {
  return _then(_OccupationBoardModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,spots: null == spots ? _self._spots : spots // ignore: cast_nullable_to_non_nullable
as List<SpotStateModel>,arrivals: null == arrivals ? _self._arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,stats: null == stats ? _self.stats : stats // ignore: cast_nullable_to_non_nullable
as OccupationStatsModel,
  ));
}

/// Create a copy of OccupationBoardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupationStatsModelCopyWith<$Res> get stats {
  
  return $OccupationStatsModelCopyWith<$Res>(_self.stats, (value) {
    return _then(_self.copyWith(stats: value));
  });
}
}


/// @nodoc
mixin _$VehicleSearchModel {

 List<OccupantModel> get results;
/// Create a copy of VehicleSearchModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$VehicleSearchModelCopyWith<VehicleSearchModel> get copyWith => _$VehicleSearchModelCopyWithImpl<VehicleSearchModel>(this as VehicleSearchModel, _$identity);

  /// Serializes this VehicleSearchModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as VehicleSearchModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is VehicleSearchModel&&const DeepCollectionEquality().equals(other.results, _this.results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as VehicleSearchModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.results));
}

@override
String toString() {
  final _this = this as VehicleSearchModel;
  return 'VehicleSearchModel(results: ${_this.results})';
}


}

/// @nodoc
abstract mixin class $VehicleSearchModelCopyWith<$Res>  {
  factory $VehicleSearchModelCopyWith(VehicleSearchModel value, $Res Function(VehicleSearchModel) _then) = _$VehicleSearchModelCopyWithImpl;
@useResult
$Res call({
 List<OccupantModel> results
});




}
/// @nodoc
class _$VehicleSearchModelCopyWithImpl<$Res>
    implements $VehicleSearchModelCopyWith<$Res> {
  _$VehicleSearchModelCopyWithImpl(this._self, this._then);

  final VehicleSearchModel _self;
  final $Res Function(VehicleSearchModel) _then;

/// Create a copy of VehicleSearchModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? results = null,}) {
  return _then(VehicleSearchModel(
results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [VehicleSearchModel].
extension VehicleSearchModelPatterns on VehicleSearchModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _VehicleSearchModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _VehicleSearchModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _VehicleSearchModel value)  $default,){
final _that = this;
switch (_that) {
case _VehicleSearchModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _VehicleSearchModel value)?  $default,){
final _that = this;
switch (_that) {
case _VehicleSearchModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<OccupantModel> results)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _VehicleSearchModel() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<OccupantModel> results)  $default,) {final _that = this;
switch (_that) {
case _VehicleSearchModel():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<OccupantModel> results)?  $default,) {final _that = this;
switch (_that) {
case _VehicleSearchModel() when $default != null:
return $default(_that.results);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _VehicleSearchModel implements VehicleSearchModel {
  const _VehicleSearchModel({ List<OccupantModel> results = const []}): _results = results;
  factory _VehicleSearchModel.fromJson(Map<String, dynamic> json) => _$VehicleSearchModelFromJson(json);

 final  List<OccupantModel> _results;
@override@JsonKey() List<OccupantModel> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}


/// Create a copy of VehicleSearchModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$VehicleSearchModelCopyWith<_VehicleSearchModel> get copyWith => __$VehicleSearchModelCopyWithImpl<_VehicleSearchModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$VehicleSearchModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _VehicleSearchModel&&const DeepCollectionEquality().equals(other.results, _results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_results));
}

@override
String toString() {
    return 'VehicleSearchModel(results: $results)';
}


}

/// @nodoc
abstract mixin class _$VehicleSearchModelCopyWith<$Res> implements $VehicleSearchModelCopyWith<$Res> {
  factory _$VehicleSearchModelCopyWith(_VehicleSearchModel value, $Res Function(_VehicleSearchModel) _then) = __$VehicleSearchModelCopyWithImpl;
@override @useResult
$Res call({
 List<OccupantModel> results
});




}
/// @nodoc
class __$VehicleSearchModelCopyWithImpl<$Res>
    implements _$VehicleSearchModelCopyWith<$Res> {
  __$VehicleSearchModelCopyWithImpl(this._self, this._then);

  final _VehicleSearchModel _self;
  final $Res Function(_VehicleSearchModel) _then;

/// Create a copy of VehicleSearchModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? results = null,}) {
  return _then(_VehicleSearchModel(
results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,
  ));
}


}


/// @nodoc
mixin _$AssignedModel {

 OccupantModel get data;
/// Create a copy of AssignedModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AssignedModelCopyWith<AssignedModel> get copyWith => _$AssignedModelCopyWithImpl<AssignedModel>(this as AssignedModel, _$identity);

  /// Serializes this AssignedModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as AssignedModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AssignedModel&&(identical(other.data, _this.data) || other.data == _this.data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as AssignedModel;
  return Object.hash(runtimeType,_this.data);
}

@override
String toString() {
  final _this = this as AssignedModel;
  return 'AssignedModel(data: ${_this.data})';
}


}

/// @nodoc
abstract mixin class $AssignedModelCopyWith<$Res>  {
  factory $AssignedModelCopyWith(AssignedModel value, $Res Function(AssignedModel) _then) = _$AssignedModelCopyWithImpl;
@useResult
$Res call({
 OccupantModel data
});


$OccupantModelCopyWith<$Res> get data;

}
/// @nodoc
class _$AssignedModelCopyWithImpl<$Res>
    implements $AssignedModelCopyWith<$Res> {
  _$AssignedModelCopyWithImpl(this._self, this._then);

  final AssignedModel _self;
  final $Res Function(AssignedModel) _then;

/// Create a copy of AssignedModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? data = null,}) {
  return _then(AssignedModel(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as OccupantModel,
  ));
}
/// Create a copy of AssignedModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<$Res> get data {
  
  return $OccupantModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [AssignedModel].
extension AssignedModelPatterns on AssignedModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AssignedModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AssignedModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AssignedModel value)  $default,){
final _that = this;
switch (_that) {
case _AssignedModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AssignedModel value)?  $default,){
final _that = this;
switch (_that) {
case _AssignedModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( OccupantModel data)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AssignedModel() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( OccupantModel data)  $default,) {final _that = this;
switch (_that) {
case _AssignedModel():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( OccupantModel data)?  $default,) {final _that = this;
switch (_that) {
case _AssignedModel() when $default != null:
return $default(_that.data);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AssignedModel implements AssignedModel {
  const _AssignedModel({required this.data});
  factory _AssignedModel.fromJson(Map<String, dynamic> json) => _$AssignedModelFromJson(json);

@override final  OccupantModel data;

/// Create a copy of AssignedModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AssignedModelCopyWith<_AssignedModel> get copyWith => __$AssignedModelCopyWithImpl<_AssignedModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AssignedModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _AssignedModel&&(identical(other.data, data) || other.data == data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,data);
}

@override
String toString() {
    return 'AssignedModel(data: $data)';
}


}

/// @nodoc
abstract mixin class _$AssignedModelCopyWith<$Res> implements $AssignedModelCopyWith<$Res> {
  factory _$AssignedModelCopyWith(_AssignedModel value, $Res Function(_AssignedModel) _then) = __$AssignedModelCopyWithImpl;
@override @useResult
$Res call({
 OccupantModel data
});


@override $OccupantModelCopyWith<$Res> get data;

}
/// @nodoc
class __$AssignedModelCopyWithImpl<$Res>
    implements _$AssignedModelCopyWith<$Res> {
  __$AssignedModelCopyWithImpl(this._self, this._then);

  final _AssignedModel _self;
  final $Res Function(_AssignedModel) _then;

/// Create a copy of AssignedModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? data = null,}) {
  return _then(_AssignedModel(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as OccupantModel,
  ));
}

/// Create a copy of AssignedModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<$Res> get data {
  
  return $OccupantModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
