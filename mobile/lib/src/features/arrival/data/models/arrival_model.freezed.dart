// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'arrival_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MeetingPointModel {

 double get lat; double get lng;/// parking (its reception), return_point (set by the operator) or airport.
 String get source; String? get label;/// The operator's written directions and photo (return point only).
 String? get instructions; String? get photoUrl;
/// Create a copy of MeetingPointModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MeetingPointModelCopyWith<MeetingPointModel> get copyWith => _$MeetingPointModelCopyWithImpl<MeetingPointModel>(this as MeetingPointModel, _$identity);

  /// Serializes this MeetingPointModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as MeetingPointModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MeetingPointModel&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng)&&(identical(other.source, _this.source) || other.source == _this.source)&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.instructions, _this.instructions) || other.instructions == _this.instructions)&&(identical(other.photoUrl, _this.photoUrl) || other.photoUrl == _this.photoUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as MeetingPointModel;
  return Object.hash(runtimeType,_this.lat,_this.lng,_this.source,_this.label,_this.instructions,_this.photoUrl);
}

@override
String toString() {
  final _this = this as MeetingPointModel;
  return 'MeetingPointModel(lat: ${_this.lat}, lng: ${_this.lng}, source: ${_this.source}, label: ${_this.label}, instructions: ${_this.instructions}, photoUrl: ${_this.photoUrl})';
}


}

/// @nodoc
abstract mixin class $MeetingPointModelCopyWith<$Res>  {
  factory $MeetingPointModelCopyWith(MeetingPointModel value, $Res Function(MeetingPointModel) _then) = _$MeetingPointModelCopyWithImpl;
@useResult
$Res call({
 double lat, double lng, String source, String? label, String? instructions, String? photoUrl
});




}
/// @nodoc
class _$MeetingPointModelCopyWithImpl<$Res>
    implements $MeetingPointModelCopyWith<$Res> {
  _$MeetingPointModelCopyWithImpl(this._self, this._then);

  final MeetingPointModel _self;
  final $Res Function(MeetingPointModel) _then;

/// Create a copy of MeetingPointModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? lat = null,Object? lng = null,Object? source = null,Object? label = freezed,Object? instructions = freezed,Object? photoUrl = freezed,}) {
  return _then(MeetingPointModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,instructions: freezed == instructions ? _self.instructions : instructions // ignore: cast_nullable_to_non_nullable
as String?,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [MeetingPointModel].
extension MeetingPointModelPatterns on MeetingPointModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MeetingPointModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MeetingPointModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MeetingPointModel value)  $default,){
final _that = this;
switch (_that) {
case _MeetingPointModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MeetingPointModel value)?  $default,){
final _that = this;
switch (_that) {
case _MeetingPointModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double lat,  double lng,  String source,  String? label,  String? instructions,  String? photoUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MeetingPointModel() when $default != null:
return $default(_that.lat,_that.lng,_that.source,_that.label,_that.instructions,_that.photoUrl);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double lat,  double lng,  String source,  String? label,  String? instructions,  String? photoUrl)  $default,) {final _that = this;
switch (_that) {
case _MeetingPointModel():
return $default(_that.lat,_that.lng,_that.source,_that.label,_that.instructions,_that.photoUrl);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double lat,  double lng,  String source,  String? label,  String? instructions,  String? photoUrl)?  $default,) {final _that = this;
switch (_that) {
case _MeetingPointModel() when $default != null:
return $default(_that.lat,_that.lng,_that.source,_that.label,_that.instructions,_that.photoUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MeetingPointModel implements MeetingPointModel {
  const _MeetingPointModel({required this.lat, required this.lng, required this.source, this.label, this.instructions, this.photoUrl});
  factory _MeetingPointModel.fromJson(Map<String, dynamic> json) => _$MeetingPointModelFromJson(json);

@override final  double lat;
@override final  double lng;
/// parking (its reception), return_point (set by the operator) or airport.
@override final  String source;
@override final  String? label;
/// The operator's written directions and photo (return point only).
@override final  String? instructions;
@override final  String? photoUrl;

/// Create a copy of MeetingPointModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MeetingPointModelCopyWith<_MeetingPointModel> get copyWith => __$MeetingPointModelCopyWithImpl<_MeetingPointModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MeetingPointModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _MeetingPointModel&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&(identical(other.source, source) || other.source == source)&&(identical(other.label, label) || other.label == label)&&(identical(other.instructions, instructions) || other.instructions == instructions)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,lat,lng,source,label,instructions,photoUrl);
}

@override
String toString() {
    return 'MeetingPointModel(lat: $lat, lng: $lng, source: $source, label: $label, instructions: $instructions, photoUrl: $photoUrl)';
}


}

/// @nodoc
abstract mixin class _$MeetingPointModelCopyWith<$Res> implements $MeetingPointModelCopyWith<$Res> {
  factory _$MeetingPointModelCopyWith(_MeetingPointModel value, $Res Function(_MeetingPointModel) _then) = __$MeetingPointModelCopyWithImpl;
@override @useResult
$Res call({
 double lat, double lng, String source, String? label, String? instructions, String? photoUrl
});




}
/// @nodoc
class __$MeetingPointModelCopyWithImpl<$Res>
    implements _$MeetingPointModelCopyWith<$Res> {
  __$MeetingPointModelCopyWithImpl(this._self, this._then);

  final _MeetingPointModel _self;
  final $Res Function(_MeetingPointModel) _then;

/// Create a copy of MeetingPointModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? lat = null,Object? lng = null,Object? source = null,Object? label = freezed,Object? instructions = freezed,Object? photoUrl = freezed,}) {
  return _then(_MeetingPointModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,instructions: freezed == instructions ? _self.instructions : instructions // ignore: cast_nullable_to_non_nullable
as String?,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ArrivalMomentModel {

@JsonKey(unknownEnumValue: ArrivalKind.outbound) ArrivalKind get kind; bool get open; DateTime get opensAt; DateTime get closesAt;
/// Create a copy of ArrivalMomentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArrivalMomentModelCopyWith<ArrivalMomentModel> get copyWith => _$ArrivalMomentModelCopyWithImpl<ArrivalMomentModel>(this as ArrivalMomentModel, _$identity);

  /// Serializes this ArrivalMomentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ArrivalMomentModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArrivalMomentModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.open, _this.open) || other.open == _this.open)&&(identical(other.opensAt, _this.opensAt) || other.opensAt == _this.opensAt)&&(identical(other.closesAt, _this.closesAt) || other.closesAt == _this.closesAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ArrivalMomentModel;
  return Object.hash(runtimeType,_this.kind,_this.open,_this.opensAt,_this.closesAt);
}

@override
String toString() {
  final _this = this as ArrivalMomentModel;
  return 'ArrivalMomentModel(kind: ${_this.kind}, open: ${_this.open}, opensAt: ${_this.opensAt}, closesAt: ${_this.closesAt})';
}


}

/// @nodoc
abstract mixin class $ArrivalMomentModelCopyWith<$Res>  {
  factory $ArrivalMomentModelCopyWith(ArrivalMomentModel value, $Res Function(ArrivalMomentModel) _then) = _$ArrivalMomentModelCopyWithImpl;
@useResult
$Res call({
@JsonKey(unknownEnumValue: ArrivalKind.outbound) ArrivalKind kind, bool open, DateTime opensAt, DateTime closesAt
});




}
/// @nodoc
class _$ArrivalMomentModelCopyWithImpl<$Res>
    implements $ArrivalMomentModelCopyWith<$Res> {
  _$ArrivalMomentModelCopyWithImpl(this._self, this._then);

  final ArrivalMomentModel _self;
  final $Res Function(ArrivalMomentModel) _then;

/// Create a copy of ArrivalMomentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? open = null,Object? opensAt = null,Object? closesAt = null,}) {
  return _then(ArrivalMomentModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ArrivalKind,open: null == open ? _self.open : open // ignore: cast_nullable_to_non_nullable
as bool,opensAt: null == opensAt ? _self.opensAt : opensAt // ignore: cast_nullable_to_non_nullable
as DateTime,closesAt: null == closesAt ? _self.closesAt : closesAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [ArrivalMomentModel].
extension ArrivalMomentModelPatterns on ArrivalMomentModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArrivalMomentModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArrivalMomentModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArrivalMomentModel value)  $default,){
final _that = this;
switch (_that) {
case _ArrivalMomentModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArrivalMomentModel value)?  $default,){
final _that = this;
switch (_that) {
case _ArrivalMomentModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(unknownEnumValue: ArrivalKind.outbound)  ArrivalKind kind,  bool open,  DateTime opensAt,  DateTime closesAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArrivalMomentModel() when $default != null:
return $default(_that.kind,_that.open,_that.opensAt,_that.closesAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(unknownEnumValue: ArrivalKind.outbound)  ArrivalKind kind,  bool open,  DateTime opensAt,  DateTime closesAt)  $default,) {final _that = this;
switch (_that) {
case _ArrivalMomentModel():
return $default(_that.kind,_that.open,_that.opensAt,_that.closesAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(unknownEnumValue: ArrivalKind.outbound)  ArrivalKind kind,  bool open,  DateTime opensAt,  DateTime closesAt)?  $default,) {final _that = this;
switch (_that) {
case _ArrivalMomentModel() when $default != null:
return $default(_that.kind,_that.open,_that.opensAt,_that.closesAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArrivalMomentModel implements ArrivalMomentModel {
  const _ArrivalMomentModel({@JsonKey(unknownEnumValue: ArrivalKind.outbound) required this.kind, required this.open, required this.opensAt, required this.closesAt});
  factory _ArrivalMomentModel.fromJson(Map<String, dynamic> json) => _$ArrivalMomentModelFromJson(json);

@override@JsonKey(unknownEnumValue: ArrivalKind.outbound) final  ArrivalKind kind;
@override final  bool open;
@override final  DateTime opensAt;
@override final  DateTime closesAt;

/// Create a copy of ArrivalMomentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArrivalMomentModelCopyWith<_ArrivalMomentModel> get copyWith => __$ArrivalMomentModelCopyWithImpl<_ArrivalMomentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArrivalMomentModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArrivalMomentModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.open, open) || other.open == open)&&(identical(other.opensAt, opensAt) || other.opensAt == opensAt)&&(identical(other.closesAt, closesAt) || other.closesAt == closesAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,open,opensAt,closesAt);
}

@override
String toString() {
    return 'ArrivalMomentModel(kind: $kind, open: $open, opensAt: $opensAt, closesAt: $closesAt)';
}


}

/// @nodoc
abstract mixin class _$ArrivalMomentModelCopyWith<$Res> implements $ArrivalMomentModelCopyWith<$Res> {
  factory _$ArrivalMomentModelCopyWith(_ArrivalMomentModel value, $Res Function(_ArrivalMomentModel) _then) = __$ArrivalMomentModelCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(unknownEnumValue: ArrivalKind.outbound) ArrivalKind kind, bool open, DateTime opensAt, DateTime closesAt
});




}
/// @nodoc
class __$ArrivalMomentModelCopyWithImpl<$Res>
    implements _$ArrivalMomentModelCopyWith<$Res> {
  __$ArrivalMomentModelCopyWithImpl(this._self, this._then);

  final _ArrivalMomentModel _self;
  final $Res Function(_ArrivalMomentModel) _then;

/// Create a copy of ArrivalMomentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? open = null,Object? opensAt = null,Object? closesAt = null,}) {
  return _then(_ArrivalMomentModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ArrivalKind,open: null == open ? _self.open : open // ignore: cast_nullable_to_non_nullable
as bool,opensAt: null == opensAt ? _self.opensAt : opensAt // ignore: cast_nullable_to_non_nullable
as DateTime,closesAt: null == closesAt ? _self.closesAt : closesAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$ArrivalSignalModel {

 ArrivalKind get kind;@JsonKey(unknownEnumValue: ArrivalSignalState.ended) ArrivalSignalState get state; String? get endReason; DateTime get startedAt; DateTime get expiresAt; int get secondsLeft; int? get distanceM; int? get etaMinutes; DateTime? get etaAt; int? get announcedMinutes; DateTime? get atMeetingPointAt; DateTime? get positionUpdatedAt;
/// Create a copy of ArrivalSignalModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArrivalSignalModelCopyWith<ArrivalSignalModel> get copyWith => _$ArrivalSignalModelCopyWithImpl<ArrivalSignalModel>(this as ArrivalSignalModel, _$identity);

  /// Serializes this ArrivalSignalModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ArrivalSignalModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArrivalSignalModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.state, _this.state) || other.state == _this.state)&&(identical(other.endReason, _this.endReason) || other.endReason == _this.endReason)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt)&&(identical(other.secondsLeft, _this.secondsLeft) || other.secondsLeft == _this.secondsLeft)&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.etaMinutes, _this.etaMinutes) || other.etaMinutes == _this.etaMinutes)&&(identical(other.etaAt, _this.etaAt) || other.etaAt == _this.etaAt)&&(identical(other.announcedMinutes, _this.announcedMinutes) || other.announcedMinutes == _this.announcedMinutes)&&(identical(other.atMeetingPointAt, _this.atMeetingPointAt) || other.atMeetingPointAt == _this.atMeetingPointAt)&&(identical(other.positionUpdatedAt, _this.positionUpdatedAt) || other.positionUpdatedAt == _this.positionUpdatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ArrivalSignalModel;
  return Object.hash(runtimeType,_this.kind,_this.state,_this.endReason,_this.startedAt,_this.expiresAt,_this.secondsLeft,_this.distanceM,_this.etaMinutes,_this.etaAt,_this.announcedMinutes,_this.atMeetingPointAt,_this.positionUpdatedAt);
}

@override
String toString() {
  final _this = this as ArrivalSignalModel;
  return 'ArrivalSignalModel(kind: ${_this.kind}, state: ${_this.state}, endReason: ${_this.endReason}, startedAt: ${_this.startedAt}, expiresAt: ${_this.expiresAt}, secondsLeft: ${_this.secondsLeft}, distanceM: ${_this.distanceM}, etaMinutes: ${_this.etaMinutes}, etaAt: ${_this.etaAt}, announcedMinutes: ${_this.announcedMinutes}, atMeetingPointAt: ${_this.atMeetingPointAt}, positionUpdatedAt: ${_this.positionUpdatedAt})';
}


}

/// @nodoc
abstract mixin class $ArrivalSignalModelCopyWith<$Res>  {
  factory $ArrivalSignalModelCopyWith(ArrivalSignalModel value, $Res Function(ArrivalSignalModel) _then) = _$ArrivalSignalModelCopyWithImpl;
@useResult
$Res call({
 ArrivalKind kind,@JsonKey(unknownEnumValue: ArrivalSignalState.ended) ArrivalSignalState state, String? endReason, DateTime startedAt, DateTime expiresAt, int secondsLeft, int? distanceM, int? etaMinutes, DateTime? etaAt, int? announcedMinutes, DateTime? atMeetingPointAt, DateTime? positionUpdatedAt
});




}
/// @nodoc
class _$ArrivalSignalModelCopyWithImpl<$Res>
    implements $ArrivalSignalModelCopyWith<$Res> {
  _$ArrivalSignalModelCopyWithImpl(this._self, this._then);

  final ArrivalSignalModel _self;
  final $Res Function(ArrivalSignalModel) _then;

/// Create a copy of ArrivalSignalModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? state = null,Object? endReason = freezed,Object? startedAt = null,Object? expiresAt = null,Object? secondsLeft = null,Object? distanceM = freezed,Object? etaMinutes = freezed,Object? etaAt = freezed,Object? announcedMinutes = freezed,Object? atMeetingPointAt = freezed,Object? positionUpdatedAt = freezed,}) {
  return _then(ArrivalSignalModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ArrivalKind,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as ArrivalSignalState,endReason: freezed == endReason ? _self.endReason : endReason // ignore: cast_nullable_to_non_nullable
as String?,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,secondsLeft: null == secondsLeft ? _self.secondsLeft : secondsLeft // ignore: cast_nullable_to_non_nullable
as int,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,etaMinutes: freezed == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int?,etaAt: freezed == etaAt ? _self.etaAt : etaAt // ignore: cast_nullable_to_non_nullable
as DateTime?,announcedMinutes: freezed == announcedMinutes ? _self.announcedMinutes : announcedMinutes // ignore: cast_nullable_to_non_nullable
as int?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,positionUpdatedAt: freezed == positionUpdatedAt ? _self.positionUpdatedAt : positionUpdatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [ArrivalSignalModel].
extension ArrivalSignalModelPatterns on ArrivalSignalModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArrivalSignalModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArrivalSignalModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArrivalSignalModel value)  $default,){
final _that = this;
switch (_that) {
case _ArrivalSignalModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArrivalSignalModel value)?  $default,){
final _that = this;
switch (_that) {
case _ArrivalSignalModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ArrivalKind kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended)  ArrivalSignalState state,  String? endReason,  DateTime startedAt,  DateTime expiresAt,  int secondsLeft,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  int? announcedMinutes,  DateTime? atMeetingPointAt,  DateTime? positionUpdatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArrivalSignalModel() when $default != null:
return $default(_that.kind,_that.state,_that.endReason,_that.startedAt,_that.expiresAt,_that.secondsLeft,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.announcedMinutes,_that.atMeetingPointAt,_that.positionUpdatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ArrivalKind kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended)  ArrivalSignalState state,  String? endReason,  DateTime startedAt,  DateTime expiresAt,  int secondsLeft,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  int? announcedMinutes,  DateTime? atMeetingPointAt,  DateTime? positionUpdatedAt)  $default,) {final _that = this;
switch (_that) {
case _ArrivalSignalModel():
return $default(_that.kind,_that.state,_that.endReason,_that.startedAt,_that.expiresAt,_that.secondsLeft,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.announcedMinutes,_that.atMeetingPointAt,_that.positionUpdatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ArrivalKind kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended)  ArrivalSignalState state,  String? endReason,  DateTime startedAt,  DateTime expiresAt,  int secondsLeft,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  int? announcedMinutes,  DateTime? atMeetingPointAt,  DateTime? positionUpdatedAt)?  $default,) {final _that = this;
switch (_that) {
case _ArrivalSignalModel() when $default != null:
return $default(_that.kind,_that.state,_that.endReason,_that.startedAt,_that.expiresAt,_that.secondsLeft,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.announcedMinutes,_that.atMeetingPointAt,_that.positionUpdatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArrivalSignalModel implements ArrivalSignalModel {
  const _ArrivalSignalModel({required this.kind, @JsonKey(unknownEnumValue: ArrivalSignalState.ended) required this.state, this.endReason, required this.startedAt, required this.expiresAt, required this.secondsLeft, this.distanceM, this.etaMinutes, this.etaAt, this.announcedMinutes, this.atMeetingPointAt, this.positionUpdatedAt});
  factory _ArrivalSignalModel.fromJson(Map<String, dynamic> json) => _$ArrivalSignalModelFromJson(json);

@override final  ArrivalKind kind;
@override@JsonKey(unknownEnumValue: ArrivalSignalState.ended) final  ArrivalSignalState state;
@override final  String? endReason;
@override final  DateTime startedAt;
@override final  DateTime expiresAt;
@override final  int secondsLeft;
@override final  int? distanceM;
@override final  int? etaMinutes;
@override final  DateTime? etaAt;
@override final  int? announcedMinutes;
@override final  DateTime? atMeetingPointAt;
@override final  DateTime? positionUpdatedAt;

/// Create a copy of ArrivalSignalModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArrivalSignalModelCopyWith<_ArrivalSignalModel> get copyWith => __$ArrivalSignalModelCopyWithImpl<_ArrivalSignalModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArrivalSignalModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArrivalSignalModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.state, state) || other.state == state)&&(identical(other.endReason, endReason) || other.endReason == endReason)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.secondsLeft, secondsLeft) || other.secondsLeft == secondsLeft)&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.etaMinutes, etaMinutes) || other.etaMinutes == etaMinutes)&&(identical(other.etaAt, etaAt) || other.etaAt == etaAt)&&(identical(other.announcedMinutes, announcedMinutes) || other.announcedMinutes == announcedMinutes)&&(identical(other.atMeetingPointAt, atMeetingPointAt) || other.atMeetingPointAt == atMeetingPointAt)&&(identical(other.positionUpdatedAt, positionUpdatedAt) || other.positionUpdatedAt == positionUpdatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,state,endReason,startedAt,expiresAt,secondsLeft,distanceM,etaMinutes,etaAt,announcedMinutes,atMeetingPointAt,positionUpdatedAt);
}

@override
String toString() {
    return 'ArrivalSignalModel(kind: $kind, state: $state, endReason: $endReason, startedAt: $startedAt, expiresAt: $expiresAt, secondsLeft: $secondsLeft, distanceM: $distanceM, etaMinutes: $etaMinutes, etaAt: $etaAt, announcedMinutes: $announcedMinutes, atMeetingPointAt: $atMeetingPointAt, positionUpdatedAt: $positionUpdatedAt)';
}


}

/// @nodoc
abstract mixin class _$ArrivalSignalModelCopyWith<$Res> implements $ArrivalSignalModelCopyWith<$Res> {
  factory _$ArrivalSignalModelCopyWith(_ArrivalSignalModel value, $Res Function(_ArrivalSignalModel) _then) = __$ArrivalSignalModelCopyWithImpl;
@override @useResult
$Res call({
 ArrivalKind kind,@JsonKey(unknownEnumValue: ArrivalSignalState.ended) ArrivalSignalState state, String? endReason, DateTime startedAt, DateTime expiresAt, int secondsLeft, int? distanceM, int? etaMinutes, DateTime? etaAt, int? announcedMinutes, DateTime? atMeetingPointAt, DateTime? positionUpdatedAt
});




}
/// @nodoc
class __$ArrivalSignalModelCopyWithImpl<$Res>
    implements _$ArrivalSignalModelCopyWith<$Res> {
  __$ArrivalSignalModelCopyWithImpl(this._self, this._then);

  final _ArrivalSignalModel _self;
  final $Res Function(_ArrivalSignalModel) _then;

/// Create a copy of ArrivalSignalModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? state = null,Object? endReason = freezed,Object? startedAt = null,Object? expiresAt = null,Object? secondsLeft = null,Object? distanceM = freezed,Object? etaMinutes = freezed,Object? etaAt = freezed,Object? announcedMinutes = freezed,Object? atMeetingPointAt = freezed,Object? positionUpdatedAt = freezed,}) {
  return _then(_ArrivalSignalModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as ArrivalKind,state: null == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as ArrivalSignalState,endReason: freezed == endReason ? _self.endReason : endReason // ignore: cast_nullable_to_non_nullable
as String?,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,secondsLeft: null == secondsLeft ? _self.secondsLeft : secondsLeft // ignore: cast_nullable_to_non_nullable
as int,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,etaMinutes: freezed == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int?,etaAt: freezed == etaAt ? _self.etaAt : etaAt // ignore: cast_nullable_to_non_nullable
as DateTime?,announcedMinutes: freezed == announcedMinutes ? _self.announcedMinutes : announcedMinutes // ignore: cast_nullable_to_non_nullable
as int?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,positionUpdatedAt: freezed == positionUpdatedAt ? _self.positionUpdatedAt : positionUpdatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$ArrivalRulesModel {

 int get maxMinutes; int get arrivedWithinMeters; int get positionIntervalSeconds; List<int> get announceMinutes;
/// Create a copy of ArrivalRulesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArrivalRulesModelCopyWith<ArrivalRulesModel> get copyWith => _$ArrivalRulesModelCopyWithImpl<ArrivalRulesModel>(this as ArrivalRulesModel, _$identity);

  /// Serializes this ArrivalRulesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ArrivalRulesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArrivalRulesModel&&(identical(other.maxMinutes, _this.maxMinutes) || other.maxMinutes == _this.maxMinutes)&&(identical(other.arrivedWithinMeters, _this.arrivedWithinMeters) || other.arrivedWithinMeters == _this.arrivedWithinMeters)&&(identical(other.positionIntervalSeconds, _this.positionIntervalSeconds) || other.positionIntervalSeconds == _this.positionIntervalSeconds)&&const DeepCollectionEquality().equals(other.announceMinutes, _this.announceMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ArrivalRulesModel;
  return Object.hash(runtimeType,_this.maxMinutes,_this.arrivedWithinMeters,_this.positionIntervalSeconds,const DeepCollectionEquality().hash(_this.announceMinutes));
}

@override
String toString() {
  final _this = this as ArrivalRulesModel;
  return 'ArrivalRulesModel(maxMinutes: ${_this.maxMinutes}, arrivedWithinMeters: ${_this.arrivedWithinMeters}, positionIntervalSeconds: ${_this.positionIntervalSeconds}, announceMinutes: ${_this.announceMinutes})';
}


}

/// @nodoc
abstract mixin class $ArrivalRulesModelCopyWith<$Res>  {
  factory $ArrivalRulesModelCopyWith(ArrivalRulesModel value, $Res Function(ArrivalRulesModel) _then) = _$ArrivalRulesModelCopyWithImpl;
@useResult
$Res call({
 int maxMinutes, int arrivedWithinMeters, int positionIntervalSeconds, List<int> announceMinutes
});




}
/// @nodoc
class _$ArrivalRulesModelCopyWithImpl<$Res>
    implements $ArrivalRulesModelCopyWith<$Res> {
  _$ArrivalRulesModelCopyWithImpl(this._self, this._then);

  final ArrivalRulesModel _self;
  final $Res Function(ArrivalRulesModel) _then;

/// Create a copy of ArrivalRulesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? maxMinutes = null,Object? arrivedWithinMeters = null,Object? positionIntervalSeconds = null,Object? announceMinutes = null,}) {
  return _then(ArrivalRulesModel(
maxMinutes: null == maxMinutes ? _self.maxMinutes : maxMinutes // ignore: cast_nullable_to_non_nullable
as int,arrivedWithinMeters: null == arrivedWithinMeters ? _self.arrivedWithinMeters : arrivedWithinMeters // ignore: cast_nullable_to_non_nullable
as int,positionIntervalSeconds: null == positionIntervalSeconds ? _self.positionIntervalSeconds : positionIntervalSeconds // ignore: cast_nullable_to_non_nullable
as int,announceMinutes: null == announceMinutes ? _self.announceMinutes : announceMinutes // ignore: cast_nullable_to_non_nullable
as List<int>,
  ));
}

}


/// Adds pattern-matching-related methods to [ArrivalRulesModel].
extension ArrivalRulesModelPatterns on ArrivalRulesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArrivalRulesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArrivalRulesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArrivalRulesModel value)  $default,){
final _that = this;
switch (_that) {
case _ArrivalRulesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArrivalRulesModel value)?  $default,){
final _that = this;
switch (_that) {
case _ArrivalRulesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int maxMinutes,  int arrivedWithinMeters,  int positionIntervalSeconds,  List<int> announceMinutes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArrivalRulesModel() when $default != null:
return $default(_that.maxMinutes,_that.arrivedWithinMeters,_that.positionIntervalSeconds,_that.announceMinutes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int maxMinutes,  int arrivedWithinMeters,  int positionIntervalSeconds,  List<int> announceMinutes)  $default,) {final _that = this;
switch (_that) {
case _ArrivalRulesModel():
return $default(_that.maxMinutes,_that.arrivedWithinMeters,_that.positionIntervalSeconds,_that.announceMinutes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int maxMinutes,  int arrivedWithinMeters,  int positionIntervalSeconds,  List<int> announceMinutes)?  $default,) {final _that = this;
switch (_that) {
case _ArrivalRulesModel() when $default != null:
return $default(_that.maxMinutes,_that.arrivedWithinMeters,_that.positionIntervalSeconds,_that.announceMinutes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArrivalRulesModel implements ArrivalRulesModel {
  const _ArrivalRulesModel({this.maxMinutes = 120, this.arrivedWithinMeters = 150, this.positionIntervalSeconds = 10,  List<int> announceMinutes = const [10, 20, 30]}): _announceMinutes = announceMinutes;
  factory _ArrivalRulesModel.fromJson(Map<String, dynamic> json) => _$ArrivalRulesModelFromJson(json);

@override@JsonKey() final  int maxMinutes;
@override@JsonKey() final  int arrivedWithinMeters;
@override@JsonKey() final  int positionIntervalSeconds;
 final  List<int> _announceMinutes;
@override@JsonKey() List<int> get announceMinutes {
  if (_announceMinutes is EqualUnmodifiableListView) return _announceMinutes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_announceMinutes);
}


/// Create a copy of ArrivalRulesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArrivalRulesModelCopyWith<_ArrivalRulesModel> get copyWith => __$ArrivalRulesModelCopyWithImpl<_ArrivalRulesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArrivalRulesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArrivalRulesModel&&(identical(other.maxMinutes, maxMinutes) || other.maxMinutes == maxMinutes)&&(identical(other.arrivedWithinMeters, arrivedWithinMeters) || other.arrivedWithinMeters == arrivedWithinMeters)&&(identical(other.positionIntervalSeconds, positionIntervalSeconds) || other.positionIntervalSeconds == positionIntervalSeconds)&&const DeepCollectionEquality().equals(other.announceMinutes, _announceMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,maxMinutes,arrivedWithinMeters,positionIntervalSeconds,const DeepCollectionEquality().hash(_announceMinutes));
}

@override
String toString() {
    return 'ArrivalRulesModel(maxMinutes: $maxMinutes, arrivedWithinMeters: $arrivedWithinMeters, positionIntervalSeconds: $positionIntervalSeconds, announceMinutes: $announceMinutes)';
}


}

/// @nodoc
abstract mixin class _$ArrivalRulesModelCopyWith<$Res> implements $ArrivalRulesModelCopyWith<$Res> {
  factory _$ArrivalRulesModelCopyWith(_ArrivalRulesModel value, $Res Function(_ArrivalRulesModel) _then) = __$ArrivalRulesModelCopyWithImpl;
@override @useResult
$Res call({
 int maxMinutes, int arrivedWithinMeters, int positionIntervalSeconds, List<int> announceMinutes
});




}
/// @nodoc
class __$ArrivalRulesModelCopyWithImpl<$Res>
    implements _$ArrivalRulesModelCopyWith<$Res> {
  __$ArrivalRulesModelCopyWithImpl(this._self, this._then);

  final _ArrivalRulesModel _self;
  final $Res Function(_ArrivalRulesModel) _then;

/// Create a copy of ArrivalRulesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? maxMinutes = null,Object? arrivedWithinMeters = null,Object? positionIntervalSeconds = null,Object? announceMinutes = null,}) {
  return _then(_ArrivalRulesModel(
maxMinutes: null == maxMinutes ? _self.maxMinutes : maxMinutes // ignore: cast_nullable_to_non_nullable
as int,arrivedWithinMeters: null == arrivedWithinMeters ? _self.arrivedWithinMeters : arrivedWithinMeters // ignore: cast_nullable_to_non_nullable
as int,positionIntervalSeconds: null == positionIntervalSeconds ? _self.positionIntervalSeconds : positionIntervalSeconds // ignore: cast_nullable_to_non_nullable
as int,announceMinutes: null == announceMinutes ? _self._announceMinutes : announceMinutes // ignore: cast_nullable_to_non_nullable
as List<int>,
  ));
}


}


/// @nodoc
mixin _$ArrivalModel {

 String get reference; ArrivalMomentModel? get moment; MeetingPointModel? get meetingPoint; ArrivalSignalModel? get signal; ArrivalRulesModel get rules;
/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ArrivalModelCopyWith<ArrivalModel> get copyWith => _$ArrivalModelCopyWithImpl<ArrivalModel>(this as ArrivalModel, _$identity);

  /// Serializes this ArrivalModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ArrivalModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ArrivalModel&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.moment, _this.moment) || other.moment == _this.moment)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint)&&(identical(other.signal, _this.signal) || other.signal == _this.signal)&&(identical(other.rules, _this.rules) || other.rules == _this.rules));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ArrivalModel;
  return Object.hash(runtimeType,_this.reference,_this.moment,_this.meetingPoint,_this.signal,_this.rules);
}

@override
String toString() {
  final _this = this as ArrivalModel;
  return 'ArrivalModel(reference: ${_this.reference}, moment: ${_this.moment}, meetingPoint: ${_this.meetingPoint}, signal: ${_this.signal}, rules: ${_this.rules})';
}


}

/// @nodoc
abstract mixin class $ArrivalModelCopyWith<$Res>  {
  factory $ArrivalModelCopyWith(ArrivalModel value, $Res Function(ArrivalModel) _then) = _$ArrivalModelCopyWithImpl;
@useResult
$Res call({
 String reference, ArrivalMomentModel? moment, MeetingPointModel? meetingPoint, ArrivalSignalModel? signal, ArrivalRulesModel rules
});


$ArrivalMomentModelCopyWith<$Res>? get moment;$MeetingPointModelCopyWith<$Res>? get meetingPoint;$ArrivalSignalModelCopyWith<$Res>? get signal;$ArrivalRulesModelCopyWith<$Res> get rules;

}
/// @nodoc
class _$ArrivalModelCopyWithImpl<$Res>
    implements $ArrivalModelCopyWith<$Res> {
  _$ArrivalModelCopyWithImpl(this._self, this._then);

  final ArrivalModel _self;
  final $Res Function(ArrivalModel) _then;

/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? moment = freezed,Object? meetingPoint = freezed,Object? signal = freezed,Object? rules = null,}) {
  return _then(ArrivalModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,moment: freezed == moment ? _self.moment : moment // ignore: cast_nullable_to_non_nullable
as ArrivalMomentModel?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,signal: freezed == signal ? _self.signal : signal // ignore: cast_nullable_to_non_nullable
as ArrivalSignalModel?,rules: null == rules ? _self.rules : rules // ignore: cast_nullable_to_non_nullable
as ArrivalRulesModel,
  ));
}
/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalMomentModelCopyWith<$Res>? get moment {
    if (_self.moment == null) {
    return null;
  }

  return $ArrivalMomentModelCopyWith<$Res>(_self.moment!, (value) {
    return _then(_self.copyWith(moment: value));
  });
}/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MeetingPointModelCopyWith<$Res>? get meetingPoint {
    if (_self.meetingPoint == null) {
    return null;
  }

  return $MeetingPointModelCopyWith<$Res>(_self.meetingPoint!, (value) {
    return _then(_self.copyWith(meetingPoint: value));
  });
}/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalSignalModelCopyWith<$Res>? get signal {
    if (_self.signal == null) {
    return null;
  }

  return $ArrivalSignalModelCopyWith<$Res>(_self.signal!, (value) {
    return _then(_self.copyWith(signal: value));
  });
}/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalRulesModelCopyWith<$Res> get rules {
  
  return $ArrivalRulesModelCopyWith<$Res>(_self.rules, (value) {
    return _then(_self.copyWith(rules: value));
  });
}
}


/// Adds pattern-matching-related methods to [ArrivalModel].
extension ArrivalModelPatterns on ArrivalModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ArrivalModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ArrivalModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ArrivalModel value)  $default,){
final _that = this;
switch (_that) {
case _ArrivalModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ArrivalModel value)?  $default,){
final _that = this;
switch (_that) {
case _ArrivalModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  ArrivalMomentModel? moment,  MeetingPointModel? meetingPoint,  ArrivalSignalModel? signal,  ArrivalRulesModel rules)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ArrivalModel() when $default != null:
return $default(_that.reference,_that.moment,_that.meetingPoint,_that.signal,_that.rules);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  ArrivalMomentModel? moment,  MeetingPointModel? meetingPoint,  ArrivalSignalModel? signal,  ArrivalRulesModel rules)  $default,) {final _that = this;
switch (_that) {
case _ArrivalModel():
return $default(_that.reference,_that.moment,_that.meetingPoint,_that.signal,_that.rules);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  ArrivalMomentModel? moment,  MeetingPointModel? meetingPoint,  ArrivalSignalModel? signal,  ArrivalRulesModel rules)?  $default,) {final _that = this;
switch (_that) {
case _ArrivalModel() when $default != null:
return $default(_that.reference,_that.moment,_that.meetingPoint,_that.signal,_that.rules);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ArrivalModel extends ArrivalModel {
  const _ArrivalModel({required this.reference, this.moment, this.meetingPoint, this.signal, this.rules = const ArrivalRulesModel()}): super._();
  factory _ArrivalModel.fromJson(Map<String, dynamic> json) => _$ArrivalModelFromJson(json);

@override final  String reference;
@override final  ArrivalMomentModel? moment;
@override final  MeetingPointModel? meetingPoint;
@override final  ArrivalSignalModel? signal;
@override@JsonKey() final  ArrivalRulesModel rules;

/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ArrivalModelCopyWith<_ArrivalModel> get copyWith => __$ArrivalModelCopyWithImpl<_ArrivalModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ArrivalModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ArrivalModel&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.moment, moment) || other.moment == moment)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint)&&(identical(other.signal, signal) || other.signal == signal)&&(identical(other.rules, rules) || other.rules == rules));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reference,moment,meetingPoint,signal,rules);
}

@override
String toString() {
    return 'ArrivalModel(reference: $reference, moment: $moment, meetingPoint: $meetingPoint, signal: $signal, rules: $rules)';
}


}

/// @nodoc
abstract mixin class _$ArrivalModelCopyWith<$Res> implements $ArrivalModelCopyWith<$Res> {
  factory _$ArrivalModelCopyWith(_ArrivalModel value, $Res Function(_ArrivalModel) _then) = __$ArrivalModelCopyWithImpl;
@override @useResult
$Res call({
 String reference, ArrivalMomentModel? moment, MeetingPointModel? meetingPoint, ArrivalSignalModel? signal, ArrivalRulesModel rules
});


@override $ArrivalMomentModelCopyWith<$Res>? get moment;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;@override $ArrivalSignalModelCopyWith<$Res>? get signal;@override $ArrivalRulesModelCopyWith<$Res> get rules;

}
/// @nodoc
class __$ArrivalModelCopyWithImpl<$Res>
    implements _$ArrivalModelCopyWith<$Res> {
  __$ArrivalModelCopyWithImpl(this._self, this._then);

  final _ArrivalModel _self;
  final $Res Function(_ArrivalModel) _then;

/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? moment = freezed,Object? meetingPoint = freezed,Object? signal = freezed,Object? rules = null,}) {
  return _then(_ArrivalModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,moment: freezed == moment ? _self.moment : moment // ignore: cast_nullable_to_non_nullable
as ArrivalMomentModel?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,signal: freezed == signal ? _self.signal : signal // ignore: cast_nullable_to_non_nullable
as ArrivalSignalModel?,rules: null == rules ? _self.rules : rules // ignore: cast_nullable_to_non_nullable
as ArrivalRulesModel,
  ));
}

/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalMomentModelCopyWith<$Res>? get moment {
    if (_self.moment == null) {
    return null;
  }

  return $ArrivalMomentModelCopyWith<$Res>(_self.moment!, (value) {
    return _then(_self.copyWith(moment: value));
  });
}/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MeetingPointModelCopyWith<$Res>? get meetingPoint {
    if (_self.meetingPoint == null) {
    return null;
  }

  return $MeetingPointModelCopyWith<$Res>(_self.meetingPoint!, (value) {
    return _then(_self.copyWith(meetingPoint: value));
  });
}/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalSignalModelCopyWith<$Res>? get signal {
    if (_self.signal == null) {
    return null;
  }

  return $ArrivalSignalModelCopyWith<$Res>(_self.signal!, (value) {
    return _then(_self.copyWith(signal: value));
  });
}/// Create a copy of ArrivalModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ArrivalRulesModelCopyWith<$Res> get rules {
  
  return $ArrivalRulesModelCopyWith<$Res>(_self.rules, (value) {
    return _then(_self.copyWith(rules: value));
  });
}
}

// dart format on
