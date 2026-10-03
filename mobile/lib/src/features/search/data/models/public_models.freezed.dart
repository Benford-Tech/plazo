// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'public_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$LatLngModel {

 double get lat; double get lng;
/// Create a copy of LatLngModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<LatLngModel> get copyWith => _$LatLngModelCopyWithImpl<LatLngModel>(this as LatLngModel, _$identity);

  /// Serializes this LatLngModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as LatLngModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LatLngModel&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as LatLngModel;
  return Object.hash(runtimeType,_this.lat,_this.lng);
}

@override
String toString() {
  final _this = this as LatLngModel;
  return 'LatLngModel(lat: ${_this.lat}, lng: ${_this.lng})';
}


}

/// @nodoc
abstract mixin class $LatLngModelCopyWith<$Res>  {
  factory $LatLngModelCopyWith(LatLngModel value, $Res Function(LatLngModel) _then) = _$LatLngModelCopyWithImpl;
@useResult
$Res call({
 double lat, double lng
});




}
/// @nodoc
class _$LatLngModelCopyWithImpl<$Res>
    implements $LatLngModelCopyWith<$Res> {
  _$LatLngModelCopyWithImpl(this._self, this._then);

  final LatLngModel _self;
  final $Res Function(LatLngModel) _then;

/// Create a copy of LatLngModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? lat = null,Object? lng = null,}) {
  return _then(LatLngModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [LatLngModel].
extension LatLngModelPatterns on LatLngModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LatLngModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LatLngModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LatLngModel value)  $default,){
final _that = this;
switch (_that) {
case _LatLngModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LatLngModel value)?  $default,){
final _that = this;
switch (_that) {
case _LatLngModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double lat,  double lng)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LatLngModel() when $default != null:
return $default(_that.lat,_that.lng);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double lat,  double lng)  $default,) {final _that = this;
switch (_that) {
case _LatLngModel():
return $default(_that.lat,_that.lng);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double lat,  double lng)?  $default,) {final _that = this;
switch (_that) {
case _LatLngModel() when $default != null:
return $default(_that.lat,_that.lng);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LatLngModel implements LatLngModel {
  const _LatLngModel({required this.lat, required this.lng});
  factory _LatLngModel.fromJson(Map<String, dynamic> json) => _$LatLngModelFromJson(json);

@override final  double lat;
@override final  double lng;

/// Create a copy of LatLngModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LatLngModelCopyWith<_LatLngModel> get copyWith => __$LatLngModelCopyWithImpl<_LatLngModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LatLngModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _LatLngModel&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,lat,lng);
}

@override
String toString() {
    return 'LatLngModel(lat: $lat, lng: $lng)';
}


}

/// @nodoc
abstract mixin class _$LatLngModelCopyWith<$Res> implements $LatLngModelCopyWith<$Res> {
  factory _$LatLngModelCopyWith(_LatLngModel value, $Res Function(_LatLngModel) _then) = __$LatLngModelCopyWithImpl;
@override @useResult
$Res call({
 double lat, double lng
});




}
/// @nodoc
class __$LatLngModelCopyWithImpl<$Res>
    implements _$LatLngModelCopyWith<$Res> {
  __$LatLngModelCopyWithImpl(this._self, this._then);

  final _LatLngModel _self;
  final $Res Function(_LatLngModel) _then;

/// Create a copy of LatLngModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? lat = null,Object? lng = null,}) {
  return _then(_LatLngModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$AirportModel {

 String get code; String get name; String? get city; String get slug; LatLngModel? get location;
/// Create a copy of AirportModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AirportModelCopyWith<AirportModel> get copyWith => _$AirportModelCopyWithImpl<AirportModel>(this as AirportModel, _$identity);

  /// Serializes this AirportModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as AirportModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AirportModel&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.city, _this.city) || other.city == _this.city)&&(identical(other.slug, _this.slug) || other.slug == _this.slug)&&(identical(other.location, _this.location) || other.location == _this.location));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as AirportModel;
  return Object.hash(runtimeType,_this.code,_this.name,_this.city,_this.slug,_this.location);
}

@override
String toString() {
  final _this = this as AirportModel;
  return 'AirportModel(code: ${_this.code}, name: ${_this.name}, city: ${_this.city}, slug: ${_this.slug}, location: ${_this.location})';
}


}

/// @nodoc
abstract mixin class $AirportModelCopyWith<$Res>  {
  factory $AirportModelCopyWith(AirportModel value, $Res Function(AirportModel) _then) = _$AirportModelCopyWithImpl;
@useResult
$Res call({
 String code, String name, String? city, String slug, LatLngModel? location
});


$LatLngModelCopyWith<$Res>? get location;

}
/// @nodoc
class _$AirportModelCopyWithImpl<$Res>
    implements $AirportModelCopyWith<$Res> {
  _$AirportModelCopyWithImpl(this._self, this._then);

  final AirportModel _self;
  final $Res Function(AirportModel) _then;

/// Create a copy of AirportModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? code = null,Object? name = null,Object? city = freezed,Object? slug = null,Object? location = freezed,}) {
  return _then(AirportModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as LatLngModel?,
  ));
}
/// Create a copy of AirportModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $LatLngModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}
}


/// Adds pattern-matching-related methods to [AirportModel].
extension AirportModelPatterns on AirportModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AirportModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AirportModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AirportModel value)  $default,){
final _that = this;
switch (_that) {
case _AirportModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AirportModel value)?  $default,){
final _that = this;
switch (_that) {
case _AirportModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String code,  String name,  String? city,  String slug,  LatLngModel? location)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AirportModel() when $default != null:
return $default(_that.code,_that.name,_that.city,_that.slug,_that.location);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String code,  String name,  String? city,  String slug,  LatLngModel? location)  $default,) {final _that = this;
switch (_that) {
case _AirportModel():
return $default(_that.code,_that.name,_that.city,_that.slug,_that.location);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String code,  String name,  String? city,  String slug,  LatLngModel? location)?  $default,) {final _that = this;
switch (_that) {
case _AirportModel() when $default != null:
return $default(_that.code,_that.name,_that.city,_that.slug,_that.location);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AirportModel implements AirportModel {
  const _AirportModel({required this.code, required this.name, this.city, required this.slug, this.location});
  factory _AirportModel.fromJson(Map<String, dynamic> json) => _$AirportModelFromJson(json);

@override final  String code;
@override final  String name;
@override final  String? city;
@override final  String slug;
@override final  LatLngModel? location;

/// Create a copy of AirportModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AirportModelCopyWith<_AirportModel> get copyWith => __$AirportModelCopyWithImpl<_AirportModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AirportModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _AirportModel&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.city, city) || other.city == city)&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.location, location) || other.location == location));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,code,name,city,slug,location);
}

@override
String toString() {
    return 'AirportModel(code: $code, name: $name, city: $city, slug: $slug, location: $location)';
}


}

/// @nodoc
abstract mixin class _$AirportModelCopyWith<$Res> implements $AirportModelCopyWith<$Res> {
  factory _$AirportModelCopyWith(_AirportModel value, $Res Function(_AirportModel) _then) = __$AirportModelCopyWithImpl;
@override @useResult
$Res call({
 String code, String name, String? city, String slug, LatLngModel? location
});


@override $LatLngModelCopyWith<$Res>? get location;

}
/// @nodoc
class __$AirportModelCopyWithImpl<$Res>
    implements _$AirportModelCopyWith<$Res> {
  __$AirportModelCopyWithImpl(this._self, this._then);

  final _AirportModel _self;
  final $Res Function(_AirportModel) _then;

/// Create a copy of AirportModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? code = null,Object? name = null,Object? city = freezed,Object? slug = null,Object? location = freezed,}) {
  return _then(_AirportModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as LatLngModel?,
  ));
}

/// Create a copy of AirportModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $LatLngModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}
}


/// @nodoc
mixin _$SearchResultModel {

 String get slug; String get title; List<String> get services; int? get shuttleMinutes; double? get distanceKm; String? get openingHours; String get cancellationPolicy; String? get photo; String get payment; LatLngModel? get location; bool get available; int get days; int? get priceCents;/// Fictional parking of the demo data: shown like the others, with a small "Démo" tag.
 bool get isDemo;
/// Create a copy of SearchResultModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchResultModelCopyWith<SearchResultModel> get copyWith => _$SearchResultModelCopyWithImpl<SearchResultModel>(this as SearchResultModel, _$identity);

  /// Serializes this SearchResultModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SearchResultModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchResultModel&&(identical(other.slug, _this.slug) || other.slug == _this.slug)&&(identical(other.title, _this.title) || other.title == _this.title)&&const DeepCollectionEquality().equals(other.services, _this.services)&&(identical(other.shuttleMinutes, _this.shuttleMinutes) || other.shuttleMinutes == _this.shuttleMinutes)&&(identical(other.distanceKm, _this.distanceKm) || other.distanceKm == _this.distanceKm)&&(identical(other.openingHours, _this.openingHours) || other.openingHours == _this.openingHours)&&(identical(other.cancellationPolicy, _this.cancellationPolicy) || other.cancellationPolicy == _this.cancellationPolicy)&&(identical(other.photo, _this.photo) || other.photo == _this.photo)&&(identical(other.payment, _this.payment) || other.payment == _this.payment)&&(identical(other.location, _this.location) || other.location == _this.location)&&(identical(other.available, _this.available) || other.available == _this.available)&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.isDemo, _this.isDemo) || other.isDemo == _this.isDemo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SearchResultModel;
  return Object.hash(runtimeType,_this.slug,_this.title,const DeepCollectionEquality().hash(_this.services),_this.shuttleMinutes,_this.distanceKm,_this.openingHours,_this.cancellationPolicy,_this.photo,_this.payment,_this.location,_this.available,_this.days,_this.priceCents,_this.isDemo);
}

@override
String toString() {
  final _this = this as SearchResultModel;
  return 'SearchResultModel(slug: ${_this.slug}, title: ${_this.title}, services: ${_this.services}, shuttleMinutes: ${_this.shuttleMinutes}, distanceKm: ${_this.distanceKm}, openingHours: ${_this.openingHours}, cancellationPolicy: ${_this.cancellationPolicy}, photo: ${_this.photo}, payment: ${_this.payment}, location: ${_this.location}, available: ${_this.available}, days: ${_this.days}, priceCents: ${_this.priceCents}, isDemo: ${_this.isDemo})';
}


}

/// @nodoc
abstract mixin class $SearchResultModelCopyWith<$Res>  {
  factory $SearchResultModelCopyWith(SearchResultModel value, $Res Function(SearchResultModel) _then) = _$SearchResultModelCopyWithImpl;
@useResult
$Res call({
 String slug, String title, List<String> services, int? shuttleMinutes, double? distanceKm, String? openingHours, String cancellationPolicy, String? photo, String payment, LatLngModel? location, bool available, int days, int? priceCents, bool isDemo
});


$LatLngModelCopyWith<$Res>? get location;

}
/// @nodoc
class _$SearchResultModelCopyWithImpl<$Res>
    implements $SearchResultModelCopyWith<$Res> {
  _$SearchResultModelCopyWithImpl(this._self, this._then);

  final SearchResultModel _self;
  final $Res Function(SearchResultModel) _then;

/// Create a copy of SearchResultModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? slug = null,Object? title = null,Object? services = null,Object? shuttleMinutes = freezed,Object? distanceKm = freezed,Object? openingHours = freezed,Object? cancellationPolicy = null,Object? photo = freezed,Object? payment = null,Object? location = freezed,Object? available = null,Object? days = null,Object? priceCents = freezed,Object? isDemo = null,}) {
  return _then(SearchResultModel(
slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,services: null == services ? _self.services : services // ignore: cast_nullable_to_non_nullable
as List<String>,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,distanceKm: freezed == distanceKm ? _self.distanceKm : distanceKm // ignore: cast_nullable_to_non_nullable
as double?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,cancellationPolicy: null == cancellationPolicy ? _self.cancellationPolicy : cancellationPolicy // ignore: cast_nullable_to_non_nullable
as String,photo: freezed == photo ? _self.photo : photo // ignore: cast_nullable_to_non_nullable
as String?,payment: null == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as String,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as LatLngModel?,available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,isDemo: null == isDemo ? _self.isDemo : isDemo // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of SearchResultModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $LatLngModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}
}


/// Adds pattern-matching-related methods to [SearchResultModel].
extension SearchResultModelPatterns on SearchResultModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SearchResultModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SearchResultModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SearchResultModel value)  $default,){
final _that = this;
switch (_that) {
case _SearchResultModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SearchResultModel value)?  $default,){
final _that = this;
switch (_that) {
case _SearchResultModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String slug,  String title,  List<String> services,  int? shuttleMinutes,  double? distanceKm,  String? openingHours,  String cancellationPolicy,  String? photo,  String payment,  LatLngModel? location,  bool available,  int days,  int? priceCents,  bool isDemo)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchResultModel() when $default != null:
return $default(_that.slug,_that.title,_that.services,_that.shuttleMinutes,_that.distanceKm,_that.openingHours,_that.cancellationPolicy,_that.photo,_that.payment,_that.location,_that.available,_that.days,_that.priceCents,_that.isDemo);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String slug,  String title,  List<String> services,  int? shuttleMinutes,  double? distanceKm,  String? openingHours,  String cancellationPolicy,  String? photo,  String payment,  LatLngModel? location,  bool available,  int days,  int? priceCents,  bool isDemo)  $default,) {final _that = this;
switch (_that) {
case _SearchResultModel():
return $default(_that.slug,_that.title,_that.services,_that.shuttleMinutes,_that.distanceKm,_that.openingHours,_that.cancellationPolicy,_that.photo,_that.payment,_that.location,_that.available,_that.days,_that.priceCents,_that.isDemo);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String slug,  String title,  List<String> services,  int? shuttleMinutes,  double? distanceKm,  String? openingHours,  String cancellationPolicy,  String? photo,  String payment,  LatLngModel? location,  bool available,  int days,  int? priceCents,  bool isDemo)?  $default,) {final _that = this;
switch (_that) {
case _SearchResultModel() when $default != null:
return $default(_that.slug,_that.title,_that.services,_that.shuttleMinutes,_that.distanceKm,_that.openingHours,_that.cancellationPolicy,_that.photo,_that.payment,_that.location,_that.available,_that.days,_that.priceCents,_that.isDemo);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SearchResultModel extends SearchResultModel {
  const _SearchResultModel({required this.slug, required this.title,  List<String> services = const <String>[], this.shuttleMinutes, this.distanceKm, this.openingHours, this.cancellationPolicy = 'non_refundable', this.photo, this.payment = 'on_site', this.location, this.available = false, this.days = 0, this.priceCents, this.isDemo = false}): _services = services,super._();
  factory _SearchResultModel.fromJson(Map<String, dynamic> json) => _$SearchResultModelFromJson(json);

@override final  String slug;
@override final  String title;
 final  List<String> _services;
@override@JsonKey() List<String> get services {
  if (_services is EqualUnmodifiableListView) return _services;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_services);
}

@override final  int? shuttleMinutes;
@override final  double? distanceKm;
@override final  String? openingHours;
@override@JsonKey() final  String cancellationPolicy;
@override final  String? photo;
@override@JsonKey() final  String payment;
@override final  LatLngModel? location;
@override@JsonKey() final  bool available;
@override@JsonKey() final  int days;
@override final  int? priceCents;
/// Fictional parking of the demo data: shown like the others, with a small "Démo" tag.
@override@JsonKey() final  bool isDemo;

/// Create a copy of SearchResultModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchResultModelCopyWith<_SearchResultModel> get copyWith => __$SearchResultModelCopyWithImpl<_SearchResultModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchResultModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchResultModel&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.title, title) || other.title == title)&&const DeepCollectionEquality().equals(other.services, _services)&&(identical(other.shuttleMinutes, shuttleMinutes) || other.shuttleMinutes == shuttleMinutes)&&(identical(other.distanceKm, distanceKm) || other.distanceKm == distanceKm)&&(identical(other.openingHours, openingHours) || other.openingHours == openingHours)&&(identical(other.cancellationPolicy, cancellationPolicy) || other.cancellationPolicy == cancellationPolicy)&&(identical(other.photo, photo) || other.photo == photo)&&(identical(other.payment, payment) || other.payment == payment)&&(identical(other.location, location) || other.location == location)&&(identical(other.available, available) || other.available == available)&&(identical(other.days, days) || other.days == days)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.isDemo, isDemo) || other.isDemo == isDemo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,slug,title,const DeepCollectionEquality().hash(_services),shuttleMinutes,distanceKm,openingHours,cancellationPolicy,photo,payment,location,available,days,priceCents,isDemo);
}

@override
String toString() {
    return 'SearchResultModel(slug: $slug, title: $title, services: $services, shuttleMinutes: $shuttleMinutes, distanceKm: $distanceKm, openingHours: $openingHours, cancellationPolicy: $cancellationPolicy, photo: $photo, payment: $payment, location: $location, available: $available, days: $days, priceCents: $priceCents, isDemo: $isDemo)';
}


}

/// @nodoc
abstract mixin class _$SearchResultModelCopyWith<$Res> implements $SearchResultModelCopyWith<$Res> {
  factory _$SearchResultModelCopyWith(_SearchResultModel value, $Res Function(_SearchResultModel) _then) = __$SearchResultModelCopyWithImpl;
@override @useResult
$Res call({
 String slug, String title, List<String> services, int? shuttleMinutes, double? distanceKm, String? openingHours, String cancellationPolicy, String? photo, String payment, LatLngModel? location, bool available, int days, int? priceCents, bool isDemo
});


@override $LatLngModelCopyWith<$Res>? get location;

}
/// @nodoc
class __$SearchResultModelCopyWithImpl<$Res>
    implements _$SearchResultModelCopyWith<$Res> {
  __$SearchResultModelCopyWithImpl(this._self, this._then);

  final _SearchResultModel _self;
  final $Res Function(_SearchResultModel) _then;

/// Create a copy of SearchResultModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? slug = null,Object? title = null,Object? services = null,Object? shuttleMinutes = freezed,Object? distanceKm = freezed,Object? openingHours = freezed,Object? cancellationPolicy = null,Object? photo = freezed,Object? payment = null,Object? location = freezed,Object? available = null,Object? days = null,Object? priceCents = freezed,Object? isDemo = null,}) {
  return _then(_SearchResultModel(
slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,services: null == services ? _self._services : services // ignore: cast_nullable_to_non_nullable
as List<String>,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,distanceKm: freezed == distanceKm ? _self.distanceKm : distanceKm // ignore: cast_nullable_to_non_nullable
as double?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,cancellationPolicy: null == cancellationPolicy ? _self.cancellationPolicy : cancellationPolicy // ignore: cast_nullable_to_non_nullable
as String,photo: freezed == photo ? _self.photo : photo // ignore: cast_nullable_to_non_nullable
as String?,payment: null == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as String,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as LatLngModel?,available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,isDemo: null == isDemo ? _self.isDemo : isDemo // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of SearchResultModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $LatLngModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}
}


/// @nodoc
mixin _$SearchResponseModel {

 String get payments; AirportModel get airport; List<SearchResultModel> get results;
/// Create a copy of SearchResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchResponseModelCopyWith<SearchResponseModel> get copyWith => _$SearchResponseModelCopyWithImpl<SearchResponseModel>(this as SearchResponseModel, _$identity);

  /// Serializes this SearchResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SearchResponseModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchResponseModel&&(identical(other.payments, _this.payments) || other.payments == _this.payments)&&(identical(other.airport, _this.airport) || other.airport == _this.airport)&&const DeepCollectionEquality().equals(other.results, _this.results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SearchResponseModel;
  return Object.hash(runtimeType,_this.payments,_this.airport,const DeepCollectionEquality().hash(_this.results));
}

@override
String toString() {
  final _this = this as SearchResponseModel;
  return 'SearchResponseModel(payments: ${_this.payments}, airport: ${_this.airport}, results: ${_this.results})';
}


}

/// @nodoc
abstract mixin class $SearchResponseModelCopyWith<$Res>  {
  factory $SearchResponseModelCopyWith(SearchResponseModel value, $Res Function(SearchResponseModel) _then) = _$SearchResponseModelCopyWithImpl;
@useResult
$Res call({
 String payments, AirportModel airport, List<SearchResultModel> results
});


$AirportModelCopyWith<$Res> get airport;

}
/// @nodoc
class _$SearchResponseModelCopyWithImpl<$Res>
    implements $SearchResponseModelCopyWith<$Res> {
  _$SearchResponseModelCopyWithImpl(this._self, this._then);

  final SearchResponseModel _self;
  final $Res Function(SearchResponseModel) _then;

/// Create a copy of SearchResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? payments = null,Object? airport = null,Object? results = null,}) {
  return _then(SearchResponseModel(
payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as String,airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as AirportModel,results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<SearchResultModel>,
  ));
}
/// Create a copy of SearchResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AirportModelCopyWith<$Res> get airport {
  
  return $AirportModelCopyWith<$Res>(_self.airport, (value) {
    return _then(_self.copyWith(airport: value));
  });
}
}


/// Adds pattern-matching-related methods to [SearchResponseModel].
extension SearchResponseModelPatterns on SearchResponseModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SearchResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SearchResponseModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SearchResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _SearchResponseModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SearchResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _SearchResponseModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String payments,  AirportModel airport,  List<SearchResultModel> results)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchResponseModel() when $default != null:
return $default(_that.payments,_that.airport,_that.results);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String payments,  AirportModel airport,  List<SearchResultModel> results)  $default,) {final _that = this;
switch (_that) {
case _SearchResponseModel():
return $default(_that.payments,_that.airport,_that.results);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String payments,  AirportModel airport,  List<SearchResultModel> results)?  $default,) {final _that = this;
switch (_that) {
case _SearchResponseModel() when $default != null:
return $default(_that.payments,_that.airport,_that.results);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SearchResponseModel implements SearchResponseModel {
  const _SearchResponseModel({this.payments = 'on_site', required this.airport,  List<SearchResultModel> results = const <SearchResultModel>[]}): _results = results;
  factory _SearchResponseModel.fromJson(Map<String, dynamic> json) => _$SearchResponseModelFromJson(json);

@override@JsonKey() final  String payments;
@override final  AirportModel airport;
 final  List<SearchResultModel> _results;
@override@JsonKey() List<SearchResultModel> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}


/// Create a copy of SearchResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchResponseModelCopyWith<_SearchResponseModel> get copyWith => __$SearchResponseModelCopyWithImpl<_SearchResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchResponseModel&&(identical(other.payments, payments) || other.payments == payments)&&(identical(other.airport, airport) || other.airport == airport)&&const DeepCollectionEquality().equals(other.results, _results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,payments,airport,const DeepCollectionEquality().hash(_results));
}

@override
String toString() {
    return 'SearchResponseModel(payments: $payments, airport: $airport, results: $results)';
}


}

/// @nodoc
abstract mixin class _$SearchResponseModelCopyWith<$Res> implements $SearchResponseModelCopyWith<$Res> {
  factory _$SearchResponseModelCopyWith(_SearchResponseModel value, $Res Function(_SearchResponseModel) _then) = __$SearchResponseModelCopyWithImpl;
@override @useResult
$Res call({
 String payments, AirportModel airport, List<SearchResultModel> results
});


@override $AirportModelCopyWith<$Res> get airport;

}
/// @nodoc
class __$SearchResponseModelCopyWithImpl<$Res>
    implements _$SearchResponseModelCopyWith<$Res> {
  __$SearchResponseModelCopyWithImpl(this._self, this._then);

  final _SearchResponseModel _self;
  final $Res Function(_SearchResponseModel) _then;

/// Create a copy of SearchResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? payments = null,Object? airport = null,Object? results = null,}) {
  return _then(_SearchResponseModel(
payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as String,airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as AirportModel,results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<SearchResultModel>,
  ));
}

/// Create a copy of SearchResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AirportModelCopyWith<$Res> get airport {
  
  return $AirportModelCopyWith<$Res>(_self.airport, (value) {
    return _then(_self.copyWith(airport: value));
  });
}
}


/// @nodoc
mixin _$OfferModel {

 bool get available; int get days; int? get priceCents;
/// Create a copy of OfferModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OfferModelCopyWith<OfferModel> get copyWith => _$OfferModelCopyWithImpl<OfferModel>(this as OfferModel, _$identity);

  /// Serializes this OfferModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OfferModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OfferModel&&(identical(other.available, _this.available) || other.available == _this.available)&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OfferModel;
  return Object.hash(runtimeType,_this.available,_this.days,_this.priceCents);
}

@override
String toString() {
  final _this = this as OfferModel;
  return 'OfferModel(available: ${_this.available}, days: ${_this.days}, priceCents: ${_this.priceCents})';
}


}

/// @nodoc
abstract mixin class $OfferModelCopyWith<$Res>  {
  factory $OfferModelCopyWith(OfferModel value, $Res Function(OfferModel) _then) = _$OfferModelCopyWithImpl;
@useResult
$Res call({
 bool available, int days, int? priceCents
});




}
/// @nodoc
class _$OfferModelCopyWithImpl<$Res>
    implements $OfferModelCopyWith<$Res> {
  _$OfferModelCopyWithImpl(this._self, this._then);

  final OfferModel _self;
  final $Res Function(OfferModel) _then;

/// Create a copy of OfferModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? available = null,Object? days = null,Object? priceCents = freezed,}) {
  return _then(OfferModel(
available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [OfferModel].
extension OfferModelPatterns on OfferModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OfferModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OfferModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OfferModel value)  $default,){
final _that = this;
switch (_that) {
case _OfferModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OfferModel value)?  $default,){
final _that = this;
switch (_that) {
case _OfferModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool available,  int days,  int? priceCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OfferModel() when $default != null:
return $default(_that.available,_that.days,_that.priceCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool available,  int days,  int? priceCents)  $default,) {final _that = this;
switch (_that) {
case _OfferModel():
return $default(_that.available,_that.days,_that.priceCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool available,  int days,  int? priceCents)?  $default,) {final _that = this;
switch (_that) {
case _OfferModel() when $default != null:
return $default(_that.available,_that.days,_that.priceCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OfferModel extends OfferModel {
  const _OfferModel({required this.available, required this.days, this.priceCents}): super._();
  factory _OfferModel.fromJson(Map<String, dynamic> json) => _$OfferModelFromJson(json);

@override final  bool available;
@override final  int days;
@override final  int? priceCents;

/// Create a copy of OfferModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OfferModelCopyWith<_OfferModel> get copyWith => __$OfferModelCopyWithImpl<_OfferModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OfferModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OfferModel&&(identical(other.available, available) || other.available == available)&&(identical(other.days, days) || other.days == days)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,available,days,priceCents);
}

@override
String toString() {
    return 'OfferModel(available: $available, days: $days, priceCents: $priceCents)';
}


}

/// @nodoc
abstract mixin class _$OfferModelCopyWith<$Res> implements $OfferModelCopyWith<$Res> {
  factory _$OfferModelCopyWith(_OfferModel value, $Res Function(_OfferModel) _then) = __$OfferModelCopyWithImpl;
@override @useResult
$Res call({
 bool available, int days, int? priceCents
});




}
/// @nodoc
class __$OfferModelCopyWithImpl<$Res>
    implements _$OfferModelCopyWith<$Res> {
  __$OfferModelCopyWithImpl(this._self, this._then);

  final _OfferModel _self;
  final $Res Function(_OfferModel) _then;

/// Create a copy of OfferModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? available = null,Object? days = null,Object? priceCents = freezed,}) {
  return _then(_OfferModel(
available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,priceCents: freezed == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$PricingTierModel {

 int get days; int get priceCents;
/// Create a copy of PricingTierModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PricingTierModelCopyWith<PricingTierModel> get copyWith => _$PricingTierModelCopyWithImpl<PricingTierModel>(this as PricingTierModel, _$identity);

  /// Serializes this PricingTierModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PricingTierModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PricingTierModel&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PricingTierModel;
  return Object.hash(runtimeType,_this.days,_this.priceCents);
}

@override
String toString() {
  final _this = this as PricingTierModel;
  return 'PricingTierModel(days: ${_this.days}, priceCents: ${_this.priceCents})';
}


}

/// @nodoc
abstract mixin class $PricingTierModelCopyWith<$Res>  {
  factory $PricingTierModelCopyWith(PricingTierModel value, $Res Function(PricingTierModel) _then) = _$PricingTierModelCopyWithImpl;
@useResult
$Res call({
 int days, int priceCents
});




}
/// @nodoc
class _$PricingTierModelCopyWithImpl<$Res>
    implements $PricingTierModelCopyWith<$Res> {
  _$PricingTierModelCopyWithImpl(this._self, this._then);

  final PricingTierModel _self;
  final $Res Function(PricingTierModel) _then;

/// Create a copy of PricingTierModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? days = null,Object? priceCents = null,}) {
  return _then(PricingTierModel(
days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [PricingTierModel].
extension PricingTierModelPatterns on PricingTierModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PricingTierModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PricingTierModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PricingTierModel value)  $default,){
final _that = this;
switch (_that) {
case _PricingTierModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PricingTierModel value)?  $default,){
final _that = this;
switch (_that) {
case _PricingTierModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int days,  int priceCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PricingTierModel() when $default != null:
return $default(_that.days,_that.priceCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int days,  int priceCents)  $default,) {final _that = this;
switch (_that) {
case _PricingTierModel():
return $default(_that.days,_that.priceCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int days,  int priceCents)?  $default,) {final _that = this;
switch (_that) {
case _PricingTierModel() when $default != null:
return $default(_that.days,_that.priceCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PricingTierModel implements PricingTierModel {
  const _PricingTierModel({required this.days, required this.priceCents});
  factory _PricingTierModel.fromJson(Map<String, dynamic> json) => _$PricingTierModelFromJson(json);

@override final  int days;
@override final  int priceCents;

/// Create a copy of PricingTierModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PricingTierModelCopyWith<_PricingTierModel> get copyWith => __$PricingTierModelCopyWithImpl<_PricingTierModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PricingTierModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PricingTierModel&&(identical(other.days, days) || other.days == days)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,days,priceCents);
}

@override
String toString() {
    return 'PricingTierModel(days: $days, priceCents: $priceCents)';
}


}

/// @nodoc
abstract mixin class _$PricingTierModelCopyWith<$Res> implements $PricingTierModelCopyWith<$Res> {
  factory _$PricingTierModelCopyWith(_PricingTierModel value, $Res Function(_PricingTierModel) _then) = __$PricingTierModelCopyWithImpl;
@override @useResult
$Res call({
 int days, int priceCents
});




}
/// @nodoc
class __$PricingTierModelCopyWithImpl<$Res>
    implements _$PricingTierModelCopyWith<$Res> {
  __$PricingTierModelCopyWithImpl(this._self, this._then);

  final _PricingTierModel _self;
  final $Res Function(_PricingTierModel) _then;

/// Create a copy of PricingTierModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? days = null,Object? priceCents = null,}) {
  return _then(_PricingTierModel(
days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$PricingModel {

 List<PricingTierModel> get tiers; int? get extraDayPriceCents;
/// Create a copy of PricingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PricingModelCopyWith<PricingModel> get copyWith => _$PricingModelCopyWithImpl<PricingModel>(this as PricingModel, _$identity);

  /// Serializes this PricingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PricingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PricingModel&&const DeepCollectionEquality().equals(other.tiers, _this.tiers)&&(identical(other.extraDayPriceCents, _this.extraDayPriceCents) || other.extraDayPriceCents == _this.extraDayPriceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PricingModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.tiers),_this.extraDayPriceCents);
}

@override
String toString() {
  final _this = this as PricingModel;
  return 'PricingModel(tiers: ${_this.tiers}, extraDayPriceCents: ${_this.extraDayPriceCents})';
}


}

/// @nodoc
abstract mixin class $PricingModelCopyWith<$Res>  {
  factory $PricingModelCopyWith(PricingModel value, $Res Function(PricingModel) _then) = _$PricingModelCopyWithImpl;
@useResult
$Res call({
 List<PricingTierModel> tiers, int? extraDayPriceCents
});




}
/// @nodoc
class _$PricingModelCopyWithImpl<$Res>
    implements $PricingModelCopyWith<$Res> {
  _$PricingModelCopyWithImpl(this._self, this._then);

  final PricingModel _self;
  final $Res Function(PricingModel) _then;

/// Create a copy of PricingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tiers = null,Object? extraDayPriceCents = freezed,}) {
  return _then(PricingModel(
tiers: null == tiers ? _self.tiers : tiers // ignore: cast_nullable_to_non_nullable
as List<PricingTierModel>,extraDayPriceCents: freezed == extraDayPriceCents ? _self.extraDayPriceCents : extraDayPriceCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [PricingModel].
extension PricingModelPatterns on PricingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PricingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PricingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PricingModel value)  $default,){
final _that = this;
switch (_that) {
case _PricingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PricingModel value)?  $default,){
final _that = this;
switch (_that) {
case _PricingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<PricingTierModel> tiers,  int? extraDayPriceCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PricingModel() when $default != null:
return $default(_that.tiers,_that.extraDayPriceCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<PricingTierModel> tiers,  int? extraDayPriceCents)  $default,) {final _that = this;
switch (_that) {
case _PricingModel():
return $default(_that.tiers,_that.extraDayPriceCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<PricingTierModel> tiers,  int? extraDayPriceCents)?  $default,) {final _that = this;
switch (_that) {
case _PricingModel() when $default != null:
return $default(_that.tiers,_that.extraDayPriceCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PricingModel implements PricingModel {
  const _PricingModel({ List<PricingTierModel> tiers = const <PricingTierModel>[], this.extraDayPriceCents}): _tiers = tiers;
  factory _PricingModel.fromJson(Map<String, dynamic> json) => _$PricingModelFromJson(json);

 final  List<PricingTierModel> _tiers;
@override@JsonKey() List<PricingTierModel> get tiers {
  if (_tiers is EqualUnmodifiableListView) return _tiers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tiers);
}

@override final  int? extraDayPriceCents;

/// Create a copy of PricingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PricingModelCopyWith<_PricingModel> get copyWith => __$PricingModelCopyWithImpl<_PricingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PricingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PricingModel&&const DeepCollectionEquality().equals(other.tiers, _tiers)&&(identical(other.extraDayPriceCents, extraDayPriceCents) || other.extraDayPriceCents == extraDayPriceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_tiers),extraDayPriceCents);
}

@override
String toString() {
    return 'PricingModel(tiers: $tiers, extraDayPriceCents: $extraDayPriceCents)';
}


}

/// @nodoc
abstract mixin class _$PricingModelCopyWith<$Res> implements $PricingModelCopyWith<$Res> {
  factory _$PricingModelCopyWith(_PricingModel value, $Res Function(_PricingModel) _then) = __$PricingModelCopyWithImpl;
@override @useResult
$Res call({
 List<PricingTierModel> tiers, int? extraDayPriceCents
});




}
/// @nodoc
class __$PricingModelCopyWithImpl<$Res>
    implements _$PricingModelCopyWith<$Res> {
  __$PricingModelCopyWithImpl(this._self, this._then);

  final _PricingModel _self;
  final $Res Function(_PricingModel) _then;

/// Create a copy of PricingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tiers = null,Object? extraDayPriceCents = freezed,}) {
  return _then(_PricingModel(
tiers: null == tiers ? _self._tiers : tiers // ignore: cast_nullable_to_non_nullable
as List<PricingTierModel>,extraDayPriceCents: freezed == extraDayPriceCents ? _self.extraDayPriceCents : extraDayPriceCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$ParkingDetailModel {

 String get slug; String get title; List<String> get services; int? get shuttleMinutes; double? get distanceKm; String? get openingHours; String get cancellationPolicy; String? get photo; String get payment; LatLngModel? get location; String? get description; List<String> get photos; String? get address; String? get phone; PricingModel get pricing; bool get isDemo;
/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingDetailModelCopyWith<ParkingDetailModel> get copyWith => _$ParkingDetailModelCopyWithImpl<ParkingDetailModel>(this as ParkingDetailModel, _$identity);

  /// Serializes this ParkingDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ParkingDetailModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingDetailModel&&(identical(other.slug, _this.slug) || other.slug == _this.slug)&&(identical(other.title, _this.title) || other.title == _this.title)&&const DeepCollectionEquality().equals(other.services, _this.services)&&(identical(other.shuttleMinutes, _this.shuttleMinutes) || other.shuttleMinutes == _this.shuttleMinutes)&&(identical(other.distanceKm, _this.distanceKm) || other.distanceKm == _this.distanceKm)&&(identical(other.openingHours, _this.openingHours) || other.openingHours == _this.openingHours)&&(identical(other.cancellationPolicy, _this.cancellationPolicy) || other.cancellationPolicy == _this.cancellationPolicy)&&(identical(other.photo, _this.photo) || other.photo == _this.photo)&&(identical(other.payment, _this.payment) || other.payment == _this.payment)&&(identical(other.location, _this.location) || other.location == _this.location)&&(identical(other.description, _this.description) || other.description == _this.description)&&const DeepCollectionEquality().equals(other.photos, _this.photos)&&(identical(other.address, _this.address) || other.address == _this.address)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.pricing, _this.pricing) || other.pricing == _this.pricing)&&(identical(other.isDemo, _this.isDemo) || other.isDemo == _this.isDemo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ParkingDetailModel;
  return Object.hash(runtimeType,_this.slug,_this.title,const DeepCollectionEquality().hash(_this.services),_this.shuttleMinutes,_this.distanceKm,_this.openingHours,_this.cancellationPolicy,_this.photo,_this.payment,_this.location,_this.description,const DeepCollectionEquality().hash(_this.photos),_this.address,_this.phone,_this.pricing,_this.isDemo);
}

@override
String toString() {
  final _this = this as ParkingDetailModel;
  return 'ParkingDetailModel(slug: ${_this.slug}, title: ${_this.title}, services: ${_this.services}, shuttleMinutes: ${_this.shuttleMinutes}, distanceKm: ${_this.distanceKm}, openingHours: ${_this.openingHours}, cancellationPolicy: ${_this.cancellationPolicy}, photo: ${_this.photo}, payment: ${_this.payment}, location: ${_this.location}, description: ${_this.description}, photos: ${_this.photos}, address: ${_this.address}, phone: ${_this.phone}, pricing: ${_this.pricing}, isDemo: ${_this.isDemo})';
}


}

/// @nodoc
abstract mixin class $ParkingDetailModelCopyWith<$Res>  {
  factory $ParkingDetailModelCopyWith(ParkingDetailModel value, $Res Function(ParkingDetailModel) _then) = _$ParkingDetailModelCopyWithImpl;
@useResult
$Res call({
 String slug, String title, List<String> services, int? shuttleMinutes, double? distanceKm, String? openingHours, String cancellationPolicy, String? photo, String payment, LatLngModel? location, String? description, List<String> photos, String? address, String? phone, PricingModel pricing, bool isDemo
});


$LatLngModelCopyWith<$Res>? get location;$PricingModelCopyWith<$Res> get pricing;

}
/// @nodoc
class _$ParkingDetailModelCopyWithImpl<$Res>
    implements $ParkingDetailModelCopyWith<$Res> {
  _$ParkingDetailModelCopyWithImpl(this._self, this._then);

  final ParkingDetailModel _self;
  final $Res Function(ParkingDetailModel) _then;

/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? slug = null,Object? title = null,Object? services = null,Object? shuttleMinutes = freezed,Object? distanceKm = freezed,Object? openingHours = freezed,Object? cancellationPolicy = null,Object? photo = freezed,Object? payment = null,Object? location = freezed,Object? description = freezed,Object? photos = null,Object? address = freezed,Object? phone = freezed,Object? pricing = null,Object? isDemo = null,}) {
  return _then(ParkingDetailModel(
slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,services: null == services ? _self.services : services // ignore: cast_nullable_to_non_nullable
as List<String>,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,distanceKm: freezed == distanceKm ? _self.distanceKm : distanceKm // ignore: cast_nullable_to_non_nullable
as double?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,cancellationPolicy: null == cancellationPolicy ? _self.cancellationPolicy : cancellationPolicy // ignore: cast_nullable_to_non_nullable
as String,photo: freezed == photo ? _self.photo : photo // ignore: cast_nullable_to_non_nullable
as String?,payment: null == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as String,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as LatLngModel?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,photos: null == photos ? _self.photos : photos // ignore: cast_nullable_to_non_nullable
as List<String>,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,pricing: null == pricing ? _self.pricing : pricing // ignore: cast_nullable_to_non_nullable
as PricingModel,isDemo: null == isDemo ? _self.isDemo : isDemo // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $LatLngModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PricingModelCopyWith<$Res> get pricing {
  
  return $PricingModelCopyWith<$Res>(_self.pricing, (value) {
    return _then(_self.copyWith(pricing: value));
  });
}
}


/// Adds pattern-matching-related methods to [ParkingDetailModel].
extension ParkingDetailModelPatterns on ParkingDetailModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingDetailModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingDetailModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingDetailModel value)  $default,){
final _that = this;
switch (_that) {
case _ParkingDetailModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingDetailModel value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingDetailModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String slug,  String title,  List<String> services,  int? shuttleMinutes,  double? distanceKm,  String? openingHours,  String cancellationPolicy,  String? photo,  String payment,  LatLngModel? location,  String? description,  List<String> photos,  String? address,  String? phone,  PricingModel pricing,  bool isDemo)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingDetailModel() when $default != null:
return $default(_that.slug,_that.title,_that.services,_that.shuttleMinutes,_that.distanceKm,_that.openingHours,_that.cancellationPolicy,_that.photo,_that.payment,_that.location,_that.description,_that.photos,_that.address,_that.phone,_that.pricing,_that.isDemo);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String slug,  String title,  List<String> services,  int? shuttleMinutes,  double? distanceKm,  String? openingHours,  String cancellationPolicy,  String? photo,  String payment,  LatLngModel? location,  String? description,  List<String> photos,  String? address,  String? phone,  PricingModel pricing,  bool isDemo)  $default,) {final _that = this;
switch (_that) {
case _ParkingDetailModel():
return $default(_that.slug,_that.title,_that.services,_that.shuttleMinutes,_that.distanceKm,_that.openingHours,_that.cancellationPolicy,_that.photo,_that.payment,_that.location,_that.description,_that.photos,_that.address,_that.phone,_that.pricing,_that.isDemo);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String slug,  String title,  List<String> services,  int? shuttleMinutes,  double? distanceKm,  String? openingHours,  String cancellationPolicy,  String? photo,  String payment,  LatLngModel? location,  String? description,  List<String> photos,  String? address,  String? phone,  PricingModel pricing,  bool isDemo)?  $default,) {final _that = this;
switch (_that) {
case _ParkingDetailModel() when $default != null:
return $default(_that.slug,_that.title,_that.services,_that.shuttleMinutes,_that.distanceKm,_that.openingHours,_that.cancellationPolicy,_that.photo,_that.payment,_that.location,_that.description,_that.photos,_that.address,_that.phone,_that.pricing,_that.isDemo);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ParkingDetailModel implements ParkingDetailModel {
  const _ParkingDetailModel({required this.slug, required this.title,  List<String> services = const <String>[], this.shuttleMinutes, this.distanceKm, this.openingHours, this.cancellationPolicy = 'non_refundable', this.photo, this.payment = 'on_site', this.location, this.description,  List<String> photos = const <String>[], this.address, this.phone, this.pricing = const PricingModel(), this.isDemo = false}): _services = services,_photos = photos;
  factory _ParkingDetailModel.fromJson(Map<String, dynamic> json) => _$ParkingDetailModelFromJson(json);

@override final  String slug;
@override final  String title;
 final  List<String> _services;
@override@JsonKey() List<String> get services {
  if (_services is EqualUnmodifiableListView) return _services;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_services);
}

@override final  int? shuttleMinutes;
@override final  double? distanceKm;
@override final  String? openingHours;
@override@JsonKey() final  String cancellationPolicy;
@override final  String? photo;
@override@JsonKey() final  String payment;
@override final  LatLngModel? location;
@override final  String? description;
 final  List<String> _photos;
@override@JsonKey() List<String> get photos {
  if (_photos is EqualUnmodifiableListView) return _photos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_photos);
}

@override final  String? address;
@override final  String? phone;
@override@JsonKey() final  PricingModel pricing;
@override@JsonKey() final  bool isDemo;

/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingDetailModelCopyWith<_ParkingDetailModel> get copyWith => __$ParkingDetailModelCopyWithImpl<_ParkingDetailModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ParkingDetailModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingDetailModel&&(identical(other.slug, slug) || other.slug == slug)&&(identical(other.title, title) || other.title == title)&&const DeepCollectionEquality().equals(other.services, _services)&&(identical(other.shuttleMinutes, shuttleMinutes) || other.shuttleMinutes == shuttleMinutes)&&(identical(other.distanceKm, distanceKm) || other.distanceKm == distanceKm)&&(identical(other.openingHours, openingHours) || other.openingHours == openingHours)&&(identical(other.cancellationPolicy, cancellationPolicy) || other.cancellationPolicy == cancellationPolicy)&&(identical(other.photo, photo) || other.photo == photo)&&(identical(other.payment, payment) || other.payment == payment)&&(identical(other.location, location) || other.location == location)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.photos, _photos)&&(identical(other.address, address) || other.address == address)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.pricing, pricing) || other.pricing == pricing)&&(identical(other.isDemo, isDemo) || other.isDemo == isDemo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,slug,title,const DeepCollectionEquality().hash(_services),shuttleMinutes,distanceKm,openingHours,cancellationPolicy,photo,payment,location,description,const DeepCollectionEquality().hash(_photos),address,phone,pricing,isDemo);
}

@override
String toString() {
    return 'ParkingDetailModel(slug: $slug, title: $title, services: $services, shuttleMinutes: $shuttleMinutes, distanceKm: $distanceKm, openingHours: $openingHours, cancellationPolicy: $cancellationPolicy, photo: $photo, payment: $payment, location: $location, description: $description, photos: $photos, address: $address, phone: $phone, pricing: $pricing, isDemo: $isDemo)';
}


}

/// @nodoc
abstract mixin class _$ParkingDetailModelCopyWith<$Res> implements $ParkingDetailModelCopyWith<$Res> {
  factory _$ParkingDetailModelCopyWith(_ParkingDetailModel value, $Res Function(_ParkingDetailModel) _then) = __$ParkingDetailModelCopyWithImpl;
@override @useResult
$Res call({
 String slug, String title, List<String> services, int? shuttleMinutes, double? distanceKm, String? openingHours, String cancellationPolicy, String? photo, String payment, LatLngModel? location, String? description, List<String> photos, String? address, String? phone, PricingModel pricing, bool isDemo
});


@override $LatLngModelCopyWith<$Res>? get location;@override $PricingModelCopyWith<$Res> get pricing;

}
/// @nodoc
class __$ParkingDetailModelCopyWithImpl<$Res>
    implements _$ParkingDetailModelCopyWith<$Res> {
  __$ParkingDetailModelCopyWithImpl(this._self, this._then);

  final _ParkingDetailModel _self;
  final $Res Function(_ParkingDetailModel) _then;

/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? slug = null,Object? title = null,Object? services = null,Object? shuttleMinutes = freezed,Object? distanceKm = freezed,Object? openingHours = freezed,Object? cancellationPolicy = null,Object? photo = freezed,Object? payment = null,Object? location = freezed,Object? description = freezed,Object? photos = null,Object? address = freezed,Object? phone = freezed,Object? pricing = null,Object? isDemo = null,}) {
  return _then(_ParkingDetailModel(
slug: null == slug ? _self.slug : slug // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,services: null == services ? _self._services : services // ignore: cast_nullable_to_non_nullable
as List<String>,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,distanceKm: freezed == distanceKm ? _self.distanceKm : distanceKm // ignore: cast_nullable_to_non_nullable
as double?,openingHours: freezed == openingHours ? _self.openingHours : openingHours // ignore: cast_nullable_to_non_nullable
as String?,cancellationPolicy: null == cancellationPolicy ? _self.cancellationPolicy : cancellationPolicy // ignore: cast_nullable_to_non_nullable
as String,photo: freezed == photo ? _self.photo : photo // ignore: cast_nullable_to_non_nullable
as String?,payment: null == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as String,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as LatLngModel?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,photos: null == photos ? _self._photos : photos // ignore: cast_nullable_to_non_nullable
as List<String>,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,pricing: null == pricing ? _self.pricing : pricing // ignore: cast_nullable_to_non_nullable
as PricingModel,isDemo: null == isDemo ? _self.isDemo : isDemo // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$LatLngModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $LatLngModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}/// Create a copy of ParkingDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PricingModelCopyWith<$Res> get pricing {
  
  return $PricingModelCopyWith<$Res>(_self.pricing, (value) {
    return _then(_self.copyWith(pricing: value));
  });
}
}


/// @nodoc
mixin _$ParkingResponseModel {

 String get payments; AirportModel get airport; ParkingDetailModel get parking; OfferModel? get offer;
/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ParkingResponseModelCopyWith<ParkingResponseModel> get copyWith => _$ParkingResponseModelCopyWithImpl<ParkingResponseModel>(this as ParkingResponseModel, _$identity);

  /// Serializes this ParkingResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ParkingResponseModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ParkingResponseModel&&(identical(other.payments, _this.payments) || other.payments == _this.payments)&&(identical(other.airport, _this.airport) || other.airport == _this.airport)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.offer, _this.offer) || other.offer == _this.offer));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ParkingResponseModel;
  return Object.hash(runtimeType,_this.payments,_this.airport,_this.parking,_this.offer);
}

@override
String toString() {
  final _this = this as ParkingResponseModel;
  return 'ParkingResponseModel(payments: ${_this.payments}, airport: ${_this.airport}, parking: ${_this.parking}, offer: ${_this.offer})';
}


}

/// @nodoc
abstract mixin class $ParkingResponseModelCopyWith<$Res>  {
  factory $ParkingResponseModelCopyWith(ParkingResponseModel value, $Res Function(ParkingResponseModel) _then) = _$ParkingResponseModelCopyWithImpl;
@useResult
$Res call({
 String payments, AirportModel airport, ParkingDetailModel parking, OfferModel? offer
});


$AirportModelCopyWith<$Res> get airport;$ParkingDetailModelCopyWith<$Res> get parking;$OfferModelCopyWith<$Res>? get offer;

}
/// @nodoc
class _$ParkingResponseModelCopyWithImpl<$Res>
    implements $ParkingResponseModelCopyWith<$Res> {
  _$ParkingResponseModelCopyWithImpl(this._self, this._then);

  final ParkingResponseModel _self;
  final $Res Function(ParkingResponseModel) _then;

/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? payments = null,Object? airport = null,Object? parking = null,Object? offer = freezed,}) {
  return _then(ParkingResponseModel(
payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as String,airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as AirportModel,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingDetailModel,offer: freezed == offer ? _self.offer : offer // ignore: cast_nullable_to_non_nullable
as OfferModel?,
  ));
}
/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AirportModelCopyWith<$Res> get airport {
  
  return $AirportModelCopyWith<$Res>(_self.airport, (value) {
    return _then(_self.copyWith(airport: value));
  });
}/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingDetailModelCopyWith<$Res> get parking {
  
  return $ParkingDetailModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OfferModelCopyWith<$Res>? get offer {
    if (_self.offer == null) {
    return null;
  }

  return $OfferModelCopyWith<$Res>(_self.offer!, (value) {
    return _then(_self.copyWith(offer: value));
  });
}
}


/// Adds pattern-matching-related methods to [ParkingResponseModel].
extension ParkingResponseModelPatterns on ParkingResponseModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ParkingResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ParkingResponseModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ParkingResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _ParkingResponseModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ParkingResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _ParkingResponseModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String payments,  AirportModel airport,  ParkingDetailModel parking,  OfferModel? offer)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ParkingResponseModel() when $default != null:
return $default(_that.payments,_that.airport,_that.parking,_that.offer);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String payments,  AirportModel airport,  ParkingDetailModel parking,  OfferModel? offer)  $default,) {final _that = this;
switch (_that) {
case _ParkingResponseModel():
return $default(_that.payments,_that.airport,_that.parking,_that.offer);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String payments,  AirportModel airport,  ParkingDetailModel parking,  OfferModel? offer)?  $default,) {final _that = this;
switch (_that) {
case _ParkingResponseModel() when $default != null:
return $default(_that.payments,_that.airport,_that.parking,_that.offer);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ParkingResponseModel implements ParkingResponseModel {
  const _ParkingResponseModel({this.payments = 'on_site', required this.airport, required this.parking, this.offer});
  factory _ParkingResponseModel.fromJson(Map<String, dynamic> json) => _$ParkingResponseModelFromJson(json);

@override@JsonKey() final  String payments;
@override final  AirportModel airport;
@override final  ParkingDetailModel parking;
@override final  OfferModel? offer;

/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ParkingResponseModelCopyWith<_ParkingResponseModel> get copyWith => __$ParkingResponseModelCopyWithImpl<_ParkingResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ParkingResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ParkingResponseModel&&(identical(other.payments, payments) || other.payments == payments)&&(identical(other.airport, airport) || other.airport == airport)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.offer, offer) || other.offer == offer));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,payments,airport,parking,offer);
}

@override
String toString() {
    return 'ParkingResponseModel(payments: $payments, airport: $airport, parking: $parking, offer: $offer)';
}


}

/// @nodoc
abstract mixin class _$ParkingResponseModelCopyWith<$Res> implements $ParkingResponseModelCopyWith<$Res> {
  factory _$ParkingResponseModelCopyWith(_ParkingResponseModel value, $Res Function(_ParkingResponseModel) _then) = __$ParkingResponseModelCopyWithImpl;
@override @useResult
$Res call({
 String payments, AirportModel airport, ParkingDetailModel parking, OfferModel? offer
});


@override $AirportModelCopyWith<$Res> get airport;@override $ParkingDetailModelCopyWith<$Res> get parking;@override $OfferModelCopyWith<$Res>? get offer;

}
/// @nodoc
class __$ParkingResponseModelCopyWithImpl<$Res>
    implements _$ParkingResponseModelCopyWith<$Res> {
  __$ParkingResponseModelCopyWithImpl(this._self, this._then);

  final _ParkingResponseModel _self;
  final $Res Function(_ParkingResponseModel) _then;

/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? payments = null,Object? airport = null,Object? parking = null,Object? offer = freezed,}) {
  return _then(_ParkingResponseModel(
payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as String,airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as AirportModel,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingDetailModel,offer: freezed == offer ? _self.offer : offer // ignore: cast_nullable_to_non_nullable
as OfferModel?,
  ));
}

/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AirportModelCopyWith<$Res> get airport {
  
  return $AirportModelCopyWith<$Res>(_self.airport, (value) {
    return _then(_self.copyWith(airport: value));
  });
}/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingDetailModelCopyWith<$Res> get parking {
  
  return $ParkingDetailModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ParkingResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OfferModelCopyWith<$Res>? get offer {
    if (_self.offer == null) {
    return null;
  }

  return $OfferModelCopyWith<$Res>(_self.offer!, (value) {
    return _then(_self.copyWith(offer: value));
  });
}
}


/// @nodoc
mixin _$PaymentsConfigModel {

 String get payments; String? get publishableKey; String get merchantDisplayName; String get merchantCountryCode; String get currency;
/// Create a copy of PaymentsConfigModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentsConfigModelCopyWith<PaymentsConfigModel> get copyWith => _$PaymentsConfigModelCopyWithImpl<PaymentsConfigModel>(this as PaymentsConfigModel, _$identity);

  /// Serializes this PaymentsConfigModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PaymentsConfigModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentsConfigModel&&(identical(other.payments, _this.payments) || other.payments == _this.payments)&&(identical(other.publishableKey, _this.publishableKey) || other.publishableKey == _this.publishableKey)&&(identical(other.merchantDisplayName, _this.merchantDisplayName) || other.merchantDisplayName == _this.merchantDisplayName)&&(identical(other.merchantCountryCode, _this.merchantCountryCode) || other.merchantCountryCode == _this.merchantCountryCode)&&(identical(other.currency, _this.currency) || other.currency == _this.currency));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PaymentsConfigModel;
  return Object.hash(runtimeType,_this.payments,_this.publishableKey,_this.merchantDisplayName,_this.merchantCountryCode,_this.currency);
}

@override
String toString() {
  final _this = this as PaymentsConfigModel;
  return 'PaymentsConfigModel(payments: ${_this.payments}, publishableKey: ${_this.publishableKey}, merchantDisplayName: ${_this.merchantDisplayName}, merchantCountryCode: ${_this.merchantCountryCode}, currency: ${_this.currency})';
}


}

/// @nodoc
abstract mixin class $PaymentsConfigModelCopyWith<$Res>  {
  factory $PaymentsConfigModelCopyWith(PaymentsConfigModel value, $Res Function(PaymentsConfigModel) _then) = _$PaymentsConfigModelCopyWithImpl;
@useResult
$Res call({
 String payments, String? publishableKey, String merchantDisplayName, String merchantCountryCode, String currency
});




}
/// @nodoc
class _$PaymentsConfigModelCopyWithImpl<$Res>
    implements $PaymentsConfigModelCopyWith<$Res> {
  _$PaymentsConfigModelCopyWithImpl(this._self, this._then);

  final PaymentsConfigModel _self;
  final $Res Function(PaymentsConfigModel) _then;

/// Create a copy of PaymentsConfigModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? payments = null,Object? publishableKey = freezed,Object? merchantDisplayName = null,Object? merchantCountryCode = null,Object? currency = null,}) {
  return _then(PaymentsConfigModel(
payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as String,publishableKey: freezed == publishableKey ? _self.publishableKey : publishableKey // ignore: cast_nullable_to_non_nullable
as String?,merchantDisplayName: null == merchantDisplayName ? _self.merchantDisplayName : merchantDisplayName // ignore: cast_nullable_to_non_nullable
as String,merchantCountryCode: null == merchantCountryCode ? _self.merchantCountryCode : merchantCountryCode // ignore: cast_nullable_to_non_nullable
as String,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentsConfigModel].
extension PaymentsConfigModelPatterns on PaymentsConfigModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentsConfigModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentsConfigModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentsConfigModel value)  $default,){
final _that = this;
switch (_that) {
case _PaymentsConfigModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentsConfigModel value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentsConfigModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String payments,  String? publishableKey,  String merchantDisplayName,  String merchantCountryCode,  String currency)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentsConfigModel() when $default != null:
return $default(_that.payments,_that.publishableKey,_that.merchantDisplayName,_that.merchantCountryCode,_that.currency);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String payments,  String? publishableKey,  String merchantDisplayName,  String merchantCountryCode,  String currency)  $default,) {final _that = this;
switch (_that) {
case _PaymentsConfigModel():
return $default(_that.payments,_that.publishableKey,_that.merchantDisplayName,_that.merchantCountryCode,_that.currency);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String payments,  String? publishableKey,  String merchantDisplayName,  String merchantCountryCode,  String currency)?  $default,) {final _that = this;
switch (_that) {
case _PaymentsConfigModel() when $default != null:
return $default(_that.payments,_that.publishableKey,_that.merchantDisplayName,_that.merchantCountryCode,_that.currency);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentsConfigModel implements PaymentsConfigModel {
  const _PaymentsConfigModel({this.payments = 'on_site', this.publishableKey, this.merchantDisplayName = 'Plazo', this.merchantCountryCode = 'FR', this.currency = 'eur'});
  factory _PaymentsConfigModel.fromJson(Map<String, dynamic> json) => _$PaymentsConfigModelFromJson(json);

@override@JsonKey() final  String payments;
@override final  String? publishableKey;
@override@JsonKey() final  String merchantDisplayName;
@override@JsonKey() final  String merchantCountryCode;
@override@JsonKey() final  String currency;

/// Create a copy of PaymentsConfigModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentsConfigModelCopyWith<_PaymentsConfigModel> get copyWith => __$PaymentsConfigModelCopyWithImpl<_PaymentsConfigModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentsConfigModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentsConfigModel&&(identical(other.payments, payments) || other.payments == payments)&&(identical(other.publishableKey, publishableKey) || other.publishableKey == publishableKey)&&(identical(other.merchantDisplayName, merchantDisplayName) || other.merchantDisplayName == merchantDisplayName)&&(identical(other.merchantCountryCode, merchantCountryCode) || other.merchantCountryCode == merchantCountryCode)&&(identical(other.currency, currency) || other.currency == currency));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,payments,publishableKey,merchantDisplayName,merchantCountryCode,currency);
}

@override
String toString() {
    return 'PaymentsConfigModel(payments: $payments, publishableKey: $publishableKey, merchantDisplayName: $merchantDisplayName, merchantCountryCode: $merchantCountryCode, currency: $currency)';
}


}

/// @nodoc
abstract mixin class _$PaymentsConfigModelCopyWith<$Res> implements $PaymentsConfigModelCopyWith<$Res> {
  factory _$PaymentsConfigModelCopyWith(_PaymentsConfigModel value, $Res Function(_PaymentsConfigModel) _then) = __$PaymentsConfigModelCopyWithImpl;
@override @useResult
$Res call({
 String payments, String? publishableKey, String merchantDisplayName, String merchantCountryCode, String currency
});




}
/// @nodoc
class __$PaymentsConfigModelCopyWithImpl<$Res>
    implements _$PaymentsConfigModelCopyWith<$Res> {
  __$PaymentsConfigModelCopyWithImpl(this._self, this._then);

  final _PaymentsConfigModel _self;
  final $Res Function(_PaymentsConfigModel) _then;

/// Create a copy of PaymentsConfigModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? payments = null,Object? publishableKey = freezed,Object? merchantDisplayName = null,Object? merchantCountryCode = null,Object? currency = null,}) {
  return _then(_PaymentsConfigModel(
payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as String,publishableKey: freezed == publishableKey ? _self.publishableKey : publishableKey // ignore: cast_nullable_to_non_nullable
as String?,merchantDisplayName: null == merchantDisplayName ? _self.merchantDisplayName : merchantDisplayName // ignore: cast_nullable_to_non_nullable
as String,merchantCountryCode: null == merchantCountryCode ? _self.merchantCountryCode : merchantCountryCode // ignore: cast_nullable_to_non_nullable
as String,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
