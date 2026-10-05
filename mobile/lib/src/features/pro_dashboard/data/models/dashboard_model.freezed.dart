// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'dashboard_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$DashboardModel {

 DateTime get serverTime; String get date; DashboardParkingModel get parking; DashboardCountsModel get counts; DashboardServicesModel get services; List<DashboardAlertModel> get alerts; DashboardBreakdownModel get breakdown; List<DashboardVehicleModel> get vehicles;
/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardModelCopyWith<DashboardModel> get copyWith => _$DashboardModelCopyWithImpl<DashboardModel>(this as DashboardModel, _$identity);

  /// Serializes this DashboardModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardModel&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.counts, _this.counts) || other.counts == _this.counts)&&(identical(other.services, _this.services) || other.services == _this.services)&&const DeepCollectionEquality().equals(other.alerts, _this.alerts)&&(identical(other.breakdown, _this.breakdown) || other.breakdown == _this.breakdown)&&const DeepCollectionEquality().equals(other.vehicles, _this.vehicles));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardModel;
  return Object.hash(runtimeType,_this.serverTime,_this.date,_this.parking,_this.counts,_this.services,const DeepCollectionEquality().hash(_this.alerts),_this.breakdown,const DeepCollectionEquality().hash(_this.vehicles));
}

@override
String toString() {
  final _this = this as DashboardModel;
  return 'DashboardModel(serverTime: ${_this.serverTime}, date: ${_this.date}, parking: ${_this.parking}, counts: ${_this.counts}, services: ${_this.services}, alerts: ${_this.alerts}, breakdown: ${_this.breakdown}, vehicles: ${_this.vehicles})';
}


}

/// @nodoc
abstract mixin class $DashboardModelCopyWith<$Res>  {
  factory $DashboardModelCopyWith(DashboardModel value, $Res Function(DashboardModel) _then) = _$DashboardModelCopyWithImpl;
@useResult
$Res call({
 DateTime serverTime, String date, DashboardParkingModel parking, DashboardCountsModel counts, DashboardServicesModel services, List<DashboardAlertModel> alerts, DashboardBreakdownModel breakdown, List<DashboardVehicleModel> vehicles
});


$DashboardParkingModelCopyWith<$Res> get parking;$DashboardCountsModelCopyWith<$Res> get counts;$DashboardServicesModelCopyWith<$Res> get services;$DashboardBreakdownModelCopyWith<$Res> get breakdown;

}
/// @nodoc
class _$DashboardModelCopyWithImpl<$Res>
    implements $DashboardModelCopyWith<$Res> {
  _$DashboardModelCopyWithImpl(this._self, this._then);

  final DashboardModel _self;
  final $Res Function(DashboardModel) _then;

/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? serverTime = null,Object? date = null,Object? parking = null,Object? counts = null,Object? services = null,Object? alerts = null,Object? breakdown = null,Object? vehicles = null,}) {
  return _then(DashboardModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as DashboardParkingModel,counts: null == counts ? _self.counts : counts // ignore: cast_nullable_to_non_nullable
as DashboardCountsModel,services: null == services ? _self.services : services // ignore: cast_nullable_to_non_nullable
as DashboardServicesModel,alerts: null == alerts ? _self.alerts : alerts // ignore: cast_nullable_to_non_nullable
as List<DashboardAlertModel>,breakdown: null == breakdown ? _self.breakdown : breakdown // ignore: cast_nullable_to_non_nullable
as DashboardBreakdownModel,vehicles: null == vehicles ? _self.vehicles : vehicles // ignore: cast_nullable_to_non_nullable
as List<DashboardVehicleModel>,
  ));
}
/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardParkingModelCopyWith<$Res> get parking {
  
  return $DashboardParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardCountsModelCopyWith<$Res> get counts {
  
  return $DashboardCountsModelCopyWith<$Res>(_self.counts, (value) {
    return _then(_self.copyWith(counts: value));
  });
}/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardServicesModelCopyWith<$Res> get services {
  
  return $DashboardServicesModelCopyWith<$Res>(_self.services, (value) {
    return _then(_self.copyWith(services: value));
  });
}/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardBreakdownModelCopyWith<$Res> get breakdown {
  
  return $DashboardBreakdownModelCopyWith<$Res>(_self.breakdown, (value) {
    return _then(_self.copyWith(breakdown: value));
  });
}
}


/// Adds pattern-matching-related methods to [DashboardModel].
extension DashboardModelPatterns on DashboardModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime serverTime,  String date,  DashboardParkingModel parking,  DashboardCountsModel counts,  DashboardServicesModel services,  List<DashboardAlertModel> alerts,  DashboardBreakdownModel breakdown,  List<DashboardVehicleModel> vehicles)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardModel() when $default != null:
return $default(_that.serverTime,_that.date,_that.parking,_that.counts,_that.services,_that.alerts,_that.breakdown,_that.vehicles);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime serverTime,  String date,  DashboardParkingModel parking,  DashboardCountsModel counts,  DashboardServicesModel services,  List<DashboardAlertModel> alerts,  DashboardBreakdownModel breakdown,  List<DashboardVehicleModel> vehicles)  $default,) {final _that = this;
switch (_that) {
case _DashboardModel():
return $default(_that.serverTime,_that.date,_that.parking,_that.counts,_that.services,_that.alerts,_that.breakdown,_that.vehicles);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime serverTime,  String date,  DashboardParkingModel parking,  DashboardCountsModel counts,  DashboardServicesModel services,  List<DashboardAlertModel> alerts,  DashboardBreakdownModel breakdown,  List<DashboardVehicleModel> vehicles)?  $default,) {final _that = this;
switch (_that) {
case _DashboardModel() when $default != null:
return $default(_that.serverTime,_that.date,_that.parking,_that.counts,_that.services,_that.alerts,_that.breakdown,_that.vehicles);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardModel extends DashboardModel {
  const _DashboardModel({required this.serverTime, required this.date, required this.parking, required this.counts, required this.services,  List<DashboardAlertModel> alerts = const [], required this.breakdown,  List<DashboardVehicleModel> vehicles = const []}): _alerts = alerts,_vehicles = vehicles,super._();
  factory _DashboardModel.fromJson(Map<String, dynamic> json) => _$DashboardModelFromJson(json);

@override final  DateTime serverTime;
@override final  String date;
@override final  DashboardParkingModel parking;
@override final  DashboardCountsModel counts;
@override final  DashboardServicesModel services;
 final  List<DashboardAlertModel> _alerts;
@override@JsonKey() List<DashboardAlertModel> get alerts {
  if (_alerts is EqualUnmodifiableListView) return _alerts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_alerts);
}

@override final  DashboardBreakdownModel breakdown;
 final  List<DashboardVehicleModel> _vehicles;
@override@JsonKey() List<DashboardVehicleModel> get vehicles {
  if (_vehicles is EqualUnmodifiableListView) return _vehicles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_vehicles);
}


/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardModelCopyWith<_DashboardModel> get copyWith => __$DashboardModelCopyWithImpl<_DashboardModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardModel&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&(identical(other.date, date) || other.date == date)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.counts, counts) || other.counts == counts)&&(identical(other.services, services) || other.services == services)&&const DeepCollectionEquality().equals(other.alerts, _alerts)&&(identical(other.breakdown, breakdown) || other.breakdown == breakdown)&&const DeepCollectionEquality().equals(other.vehicles, _vehicles));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,serverTime,date,parking,counts,services,const DeepCollectionEquality().hash(_alerts),breakdown,const DeepCollectionEquality().hash(_vehicles));
}

@override
String toString() {
    return 'DashboardModel(serverTime: $serverTime, date: $date, parking: $parking, counts: $counts, services: $services, alerts: $alerts, breakdown: $breakdown, vehicles: $vehicles)';
}


}

/// @nodoc
abstract mixin class _$DashboardModelCopyWith<$Res> implements $DashboardModelCopyWith<$Res> {
  factory _$DashboardModelCopyWith(_DashboardModel value, $Res Function(_DashboardModel) _then) = __$DashboardModelCopyWithImpl;
@override @useResult
$Res call({
 DateTime serverTime, String date, DashboardParkingModel parking, DashboardCountsModel counts, DashboardServicesModel services, List<DashboardAlertModel> alerts, DashboardBreakdownModel breakdown, List<DashboardVehicleModel> vehicles
});


@override $DashboardParkingModelCopyWith<$Res> get parking;@override $DashboardCountsModelCopyWith<$Res> get counts;@override $DashboardServicesModelCopyWith<$Res> get services;@override $DashboardBreakdownModelCopyWith<$Res> get breakdown;

}
/// @nodoc
class __$DashboardModelCopyWithImpl<$Res>
    implements _$DashboardModelCopyWith<$Res> {
  __$DashboardModelCopyWithImpl(this._self, this._then);

  final _DashboardModel _self;
  final $Res Function(_DashboardModel) _then;

/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? serverTime = null,Object? date = null,Object? parking = null,Object? counts = null,Object? services = null,Object? alerts = null,Object? breakdown = null,Object? vehicles = null,}) {
  return _then(_DashboardModel(
serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as DashboardParkingModel,counts: null == counts ? _self.counts : counts // ignore: cast_nullable_to_non_nullable
as DashboardCountsModel,services: null == services ? _self.services : services // ignore: cast_nullable_to_non_nullable
as DashboardServicesModel,alerts: null == alerts ? _self._alerts : alerts // ignore: cast_nullable_to_non_nullable
as List<DashboardAlertModel>,breakdown: null == breakdown ? _self.breakdown : breakdown // ignore: cast_nullable_to_non_nullable
as DashboardBreakdownModel,vehicles: null == vehicles ? _self._vehicles : vehicles // ignore: cast_nullable_to_non_nullable
as List<DashboardVehicleModel>,
  ));
}

/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardParkingModelCopyWith<$Res> get parking {
  
  return $DashboardParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardCountsModelCopyWith<$Res> get counts {
  
  return $DashboardCountsModelCopyWith<$Res>(_self.counts, (value) {
    return _then(_self.copyWith(counts: value));
  });
}/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardServicesModelCopyWith<$Res> get services {
  
  return $DashboardServicesModelCopyWith<$Res>(_self.services, (value) {
    return _then(_self.copyWith(services: value));
  });
}/// Create a copy of DashboardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardBreakdownModelCopyWith<$Res> get breakdown {
  
  return $DashboardBreakdownModelCopyWith<$Res>(_self.breakdown, (value) {
    return _then(_self.copyWith(breakdown: value));
  });
}
}


/// @nodoc
mixin _$DashboardParkingModel {

 String get id; String get name; String get timezone; int get bookableCapacity; int get plannedSpots;
/// Create a copy of DashboardParkingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardParkingModelCopyWith<DashboardParkingModel> get copyWith => _$DashboardParkingModelCopyWithImpl<DashboardParkingModel>(this as DashboardParkingModel, _$identity);

  /// Serializes this DashboardParkingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardParkingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardParkingModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.timezone, _this.timezone) || other.timezone == _this.timezone)&&(identical(other.bookableCapacity, _this.bookableCapacity) || other.bookableCapacity == _this.bookableCapacity)&&(identical(other.plannedSpots, _this.plannedSpots) || other.plannedSpots == _this.plannedSpots));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardParkingModel;
  return Object.hash(runtimeType,_this.id,_this.name,_this.timezone,_this.bookableCapacity,_this.plannedSpots);
}

@override
String toString() {
  final _this = this as DashboardParkingModel;
  return 'DashboardParkingModel(id: ${_this.id}, name: ${_this.name}, timezone: ${_this.timezone}, bookableCapacity: ${_this.bookableCapacity}, plannedSpots: ${_this.plannedSpots})';
}


}

/// @nodoc
abstract mixin class $DashboardParkingModelCopyWith<$Res>  {
  factory $DashboardParkingModelCopyWith(DashboardParkingModel value, $Res Function(DashboardParkingModel) _then) = _$DashboardParkingModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, String timezone, int bookableCapacity, int plannedSpots
});




}
/// @nodoc
class _$DashboardParkingModelCopyWithImpl<$Res>
    implements $DashboardParkingModelCopyWith<$Res> {
  _$DashboardParkingModelCopyWithImpl(this._self, this._then);

  final DashboardParkingModel _self;
  final $Res Function(DashboardParkingModel) _then;

/// Create a copy of DashboardParkingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? timezone = null,Object? bookableCapacity = null,Object? plannedSpots = null,}) {
  return _then(DashboardParkingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,bookableCapacity: null == bookableCapacity ? _self.bookableCapacity : bookableCapacity // ignore: cast_nullable_to_non_nullable
as int,plannedSpots: null == plannedSpots ? _self.plannedSpots : plannedSpots // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardParkingModel].
extension DashboardParkingModelPatterns on DashboardParkingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardParkingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardParkingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardParkingModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardParkingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardParkingModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardParkingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String timezone,  int bookableCapacity,  int plannedSpots)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardParkingModel() when $default != null:
return $default(_that.id,_that.name,_that.timezone,_that.bookableCapacity,_that.plannedSpots);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String timezone,  int bookableCapacity,  int plannedSpots)  $default,) {final _that = this;
switch (_that) {
case _DashboardParkingModel():
return $default(_that.id,_that.name,_that.timezone,_that.bookableCapacity,_that.plannedSpots);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String timezone,  int bookableCapacity,  int plannedSpots)?  $default,) {final _that = this;
switch (_that) {
case _DashboardParkingModel() when $default != null:
return $default(_that.id,_that.name,_that.timezone,_that.bookableCapacity,_that.plannedSpots);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardParkingModel implements DashboardParkingModel {
  const _DashboardParkingModel({required this.id, required this.name, this.timezone = 'Europe/Paris', this.bookableCapacity = 0, this.plannedSpots = 0});
  factory _DashboardParkingModel.fromJson(Map<String, dynamic> json) => _$DashboardParkingModelFromJson(json);

@override final  String id;
@override final  String name;
@override@JsonKey() final  String timezone;
@override@JsonKey() final  int bookableCapacity;
@override@JsonKey() final  int plannedSpots;

/// Create a copy of DashboardParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardParkingModelCopyWith<_DashboardParkingModel> get copyWith => __$DashboardParkingModelCopyWithImpl<_DashboardParkingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardParkingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardParkingModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.bookableCapacity, bookableCapacity) || other.bookableCapacity == bookableCapacity)&&(identical(other.plannedSpots, plannedSpots) || other.plannedSpots == plannedSpots));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name,timezone,bookableCapacity,plannedSpots);
}

@override
String toString() {
    return 'DashboardParkingModel(id: $id, name: $name, timezone: $timezone, bookableCapacity: $bookableCapacity, plannedSpots: $plannedSpots)';
}


}

/// @nodoc
abstract mixin class _$DashboardParkingModelCopyWith<$Res> implements $DashboardParkingModelCopyWith<$Res> {
  factory _$DashboardParkingModelCopyWith(_DashboardParkingModel value, $Res Function(_DashboardParkingModel) _then) = __$DashboardParkingModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String timezone, int bookableCapacity, int plannedSpots
});




}
/// @nodoc
class __$DashboardParkingModelCopyWithImpl<$Res>
    implements _$DashboardParkingModelCopyWith<$Res> {
  __$DashboardParkingModelCopyWithImpl(this._self, this._then);

  final _DashboardParkingModel _self;
  final $Res Function(_DashboardParkingModel) _then;

/// Create a copy of DashboardParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? timezone = null,Object? bookableCapacity = null,Object? plannedSpots = null,}) {
  return _then(_DashboardParkingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,bookableCapacity: null == bookableCapacity ? _self.bookableCapacity : bookableCapacity // ignore: cast_nullable_to_non_nullable
as int,plannedSpots: null == plannedSpots ? _self.plannedSpots : plannedSpots // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$DashboardCountsModel {

 int get onSite; int get arrivalsToday; int get arrivedToday; int get returnsToday; int get shuttlesRunning; int? get freeSpots; int get toTreat;
/// Create a copy of DashboardCountsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardCountsModelCopyWith<DashboardCountsModel> get copyWith => _$DashboardCountsModelCopyWithImpl<DashboardCountsModel>(this as DashboardCountsModel, _$identity);

  /// Serializes this DashboardCountsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardCountsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardCountsModel&&(identical(other.onSite, _this.onSite) || other.onSite == _this.onSite)&&(identical(other.arrivalsToday, _this.arrivalsToday) || other.arrivalsToday == _this.arrivalsToday)&&(identical(other.arrivedToday, _this.arrivedToday) || other.arrivedToday == _this.arrivedToday)&&(identical(other.returnsToday, _this.returnsToday) || other.returnsToday == _this.returnsToday)&&(identical(other.shuttlesRunning, _this.shuttlesRunning) || other.shuttlesRunning == _this.shuttlesRunning)&&(identical(other.freeSpots, _this.freeSpots) || other.freeSpots == _this.freeSpots)&&(identical(other.toTreat, _this.toTreat) || other.toTreat == _this.toTreat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardCountsModel;
  return Object.hash(runtimeType,_this.onSite,_this.arrivalsToday,_this.arrivedToday,_this.returnsToday,_this.shuttlesRunning,_this.freeSpots,_this.toTreat);
}

@override
String toString() {
  final _this = this as DashboardCountsModel;
  return 'DashboardCountsModel(onSite: ${_this.onSite}, arrivalsToday: ${_this.arrivalsToday}, arrivedToday: ${_this.arrivedToday}, returnsToday: ${_this.returnsToday}, shuttlesRunning: ${_this.shuttlesRunning}, freeSpots: ${_this.freeSpots}, toTreat: ${_this.toTreat})';
}


}

/// @nodoc
abstract mixin class $DashboardCountsModelCopyWith<$Res>  {
  factory $DashboardCountsModelCopyWith(DashboardCountsModel value, $Res Function(DashboardCountsModel) _then) = _$DashboardCountsModelCopyWithImpl;
@useResult
$Res call({
 int onSite, int arrivalsToday, int arrivedToday, int returnsToday, int shuttlesRunning, int? freeSpots, int toTreat
});




}
/// @nodoc
class _$DashboardCountsModelCopyWithImpl<$Res>
    implements $DashboardCountsModelCopyWith<$Res> {
  _$DashboardCountsModelCopyWithImpl(this._self, this._then);

  final DashboardCountsModel _self;
  final $Res Function(DashboardCountsModel) _then;

/// Create a copy of DashboardCountsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? onSite = null,Object? arrivalsToday = null,Object? arrivedToday = null,Object? returnsToday = null,Object? shuttlesRunning = null,Object? freeSpots = freezed,Object? toTreat = null,}) {
  return _then(DashboardCountsModel(
onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as int,arrivalsToday: null == arrivalsToday ? _self.arrivalsToday : arrivalsToday // ignore: cast_nullable_to_non_nullable
as int,arrivedToday: null == arrivedToday ? _self.arrivedToday : arrivedToday // ignore: cast_nullable_to_non_nullable
as int,returnsToday: null == returnsToday ? _self.returnsToday : returnsToday // ignore: cast_nullable_to_non_nullable
as int,shuttlesRunning: null == shuttlesRunning ? _self.shuttlesRunning : shuttlesRunning // ignore: cast_nullable_to_non_nullable
as int,freeSpots: freezed == freeSpots ? _self.freeSpots : freeSpots // ignore: cast_nullable_to_non_nullable
as int?,toTreat: null == toTreat ? _self.toTreat : toTreat // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardCountsModel].
extension DashboardCountsModelPatterns on DashboardCountsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardCountsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardCountsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardCountsModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardCountsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardCountsModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardCountsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int onSite,  int arrivalsToday,  int arrivedToday,  int returnsToday,  int shuttlesRunning,  int? freeSpots,  int toTreat)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardCountsModel() when $default != null:
return $default(_that.onSite,_that.arrivalsToday,_that.arrivedToday,_that.returnsToday,_that.shuttlesRunning,_that.freeSpots,_that.toTreat);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int onSite,  int arrivalsToday,  int arrivedToday,  int returnsToday,  int shuttlesRunning,  int? freeSpots,  int toTreat)  $default,) {final _that = this;
switch (_that) {
case _DashboardCountsModel():
return $default(_that.onSite,_that.arrivalsToday,_that.arrivedToday,_that.returnsToday,_that.shuttlesRunning,_that.freeSpots,_that.toTreat);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int onSite,  int arrivalsToday,  int arrivedToday,  int returnsToday,  int shuttlesRunning,  int? freeSpots,  int toTreat)?  $default,) {final _that = this;
switch (_that) {
case _DashboardCountsModel() when $default != null:
return $default(_that.onSite,_that.arrivalsToday,_that.arrivedToday,_that.returnsToday,_that.shuttlesRunning,_that.freeSpots,_that.toTreat);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardCountsModel implements DashboardCountsModel {
  const _DashboardCountsModel({this.onSite = 0, this.arrivalsToday = 0, this.arrivedToday = 0, this.returnsToday = 0, this.shuttlesRunning = 0, this.freeSpots, this.toTreat = 0});
  factory _DashboardCountsModel.fromJson(Map<String, dynamic> json) => _$DashboardCountsModelFromJson(json);

@override@JsonKey() final  int onSite;
@override@JsonKey() final  int arrivalsToday;
@override@JsonKey() final  int arrivedToday;
@override@JsonKey() final  int returnsToday;
@override@JsonKey() final  int shuttlesRunning;
@override final  int? freeSpots;
@override@JsonKey() final  int toTreat;

/// Create a copy of DashboardCountsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardCountsModelCopyWith<_DashboardCountsModel> get copyWith => __$DashboardCountsModelCopyWithImpl<_DashboardCountsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardCountsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardCountsModel&&(identical(other.onSite, onSite) || other.onSite == onSite)&&(identical(other.arrivalsToday, arrivalsToday) || other.arrivalsToday == arrivalsToday)&&(identical(other.arrivedToday, arrivedToday) || other.arrivedToday == arrivedToday)&&(identical(other.returnsToday, returnsToday) || other.returnsToday == returnsToday)&&(identical(other.shuttlesRunning, shuttlesRunning) || other.shuttlesRunning == shuttlesRunning)&&(identical(other.freeSpots, freeSpots) || other.freeSpots == freeSpots)&&(identical(other.toTreat, toTreat) || other.toTreat == toTreat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,onSite,arrivalsToday,arrivedToday,returnsToday,shuttlesRunning,freeSpots,toTreat);
}

@override
String toString() {
    return 'DashboardCountsModel(onSite: $onSite, arrivalsToday: $arrivalsToday, arrivedToday: $arrivedToday, returnsToday: $returnsToday, shuttlesRunning: $shuttlesRunning, freeSpots: $freeSpots, toTreat: $toTreat)';
}


}

/// @nodoc
abstract mixin class _$DashboardCountsModelCopyWith<$Res> implements $DashboardCountsModelCopyWith<$Res> {
  factory _$DashboardCountsModelCopyWith(_DashboardCountsModel value, $Res Function(_DashboardCountsModel) _then) = __$DashboardCountsModelCopyWithImpl;
@override @useResult
$Res call({
 int onSite, int arrivalsToday, int arrivedToday, int returnsToday, int shuttlesRunning, int? freeSpots, int toTreat
});




}
/// @nodoc
class __$DashboardCountsModelCopyWithImpl<$Res>
    implements _$DashboardCountsModelCopyWith<$Res> {
  __$DashboardCountsModelCopyWithImpl(this._self, this._then);

  final _DashboardCountsModel _self;
  final $Res Function(_DashboardCountsModel) _then;

/// Create a copy of DashboardCountsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? onSite = null,Object? arrivalsToday = null,Object? arrivedToday = null,Object? returnsToday = null,Object? shuttlesRunning = null,Object? freeSpots = freezed,Object? toTreat = null,}) {
  return _then(_DashboardCountsModel(
onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as int,arrivalsToday: null == arrivalsToday ? _self.arrivalsToday : arrivalsToday // ignore: cast_nullable_to_non_nullable
as int,arrivedToday: null == arrivedToday ? _self.arrivedToday : arrivedToday // ignore: cast_nullable_to_non_nullable
as int,returnsToday: null == returnsToday ? _self.returnsToday : returnsToday // ignore: cast_nullable_to_non_nullable
as int,shuttlesRunning: null == shuttlesRunning ? _self.shuttlesRunning : shuttlesRunning // ignore: cast_nullable_to_non_nullable
as int,freeSpots: freezed == freeSpots ? _self.freeSpots : freeSpots // ignore: cast_nullable_to_non_nullable
as int?,toTreat: null == toTreat ? _self.toTreat : toTreat // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$DashboardFlightsModel {

 bool get configured; String? get provider; DateTime? get lastCheckedAt;
/// Create a copy of DashboardFlightsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardFlightsModelCopyWith<DashboardFlightsModel> get copyWith => _$DashboardFlightsModelCopyWithImpl<DashboardFlightsModel>(this as DashboardFlightsModel, _$identity);

  /// Serializes this DashboardFlightsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardFlightsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardFlightsModel&&(identical(other.configured, _this.configured) || other.configured == _this.configured)&&(identical(other.provider, _this.provider) || other.provider == _this.provider)&&(identical(other.lastCheckedAt, _this.lastCheckedAt) || other.lastCheckedAt == _this.lastCheckedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardFlightsModel;
  return Object.hash(runtimeType,_this.configured,_this.provider,_this.lastCheckedAt);
}

@override
String toString() {
  final _this = this as DashboardFlightsModel;
  return 'DashboardFlightsModel(configured: ${_this.configured}, provider: ${_this.provider}, lastCheckedAt: ${_this.lastCheckedAt})';
}


}

/// @nodoc
abstract mixin class $DashboardFlightsModelCopyWith<$Res>  {
  factory $DashboardFlightsModelCopyWith(DashboardFlightsModel value, $Res Function(DashboardFlightsModel) _then) = _$DashboardFlightsModelCopyWithImpl;
@useResult
$Res call({
 bool configured, String? provider, DateTime? lastCheckedAt
});




}
/// @nodoc
class _$DashboardFlightsModelCopyWithImpl<$Res>
    implements $DashboardFlightsModelCopyWith<$Res> {
  _$DashboardFlightsModelCopyWithImpl(this._self, this._then);

  final DashboardFlightsModel _self;
  final $Res Function(DashboardFlightsModel) _then;

/// Create a copy of DashboardFlightsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? configured = null,Object? provider = freezed,Object? lastCheckedAt = freezed,}) {
  return _then(DashboardFlightsModel(
configured: null == configured ? _self.configured : configured // ignore: cast_nullable_to_non_nullable
as bool,provider: freezed == provider ? _self.provider : provider // ignore: cast_nullable_to_non_nullable
as String?,lastCheckedAt: freezed == lastCheckedAt ? _self.lastCheckedAt : lastCheckedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardFlightsModel].
extension DashboardFlightsModelPatterns on DashboardFlightsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardFlightsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardFlightsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardFlightsModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardFlightsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardFlightsModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardFlightsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool configured,  String? provider,  DateTime? lastCheckedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardFlightsModel() when $default != null:
return $default(_that.configured,_that.provider,_that.lastCheckedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool configured,  String? provider,  DateTime? lastCheckedAt)  $default,) {final _that = this;
switch (_that) {
case _DashboardFlightsModel():
return $default(_that.configured,_that.provider,_that.lastCheckedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool configured,  String? provider,  DateTime? lastCheckedAt)?  $default,) {final _that = this;
switch (_that) {
case _DashboardFlightsModel() when $default != null:
return $default(_that.configured,_that.provider,_that.lastCheckedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardFlightsModel implements DashboardFlightsModel {
  const _DashboardFlightsModel({this.configured = false, this.provider, this.lastCheckedAt});
  factory _DashboardFlightsModel.fromJson(Map<String, dynamic> json) => _$DashboardFlightsModelFromJson(json);

@override@JsonKey() final  bool configured;
@override final  String? provider;
@override final  DateTime? lastCheckedAt;

/// Create a copy of DashboardFlightsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardFlightsModelCopyWith<_DashboardFlightsModel> get copyWith => __$DashboardFlightsModelCopyWithImpl<_DashboardFlightsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardFlightsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardFlightsModel&&(identical(other.configured, configured) || other.configured == configured)&&(identical(other.provider, provider) || other.provider == provider)&&(identical(other.lastCheckedAt, lastCheckedAt) || other.lastCheckedAt == lastCheckedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,configured,provider,lastCheckedAt);
}

@override
String toString() {
    return 'DashboardFlightsModel(configured: $configured, provider: $provider, lastCheckedAt: $lastCheckedAt)';
}


}

/// @nodoc
abstract mixin class _$DashboardFlightsModelCopyWith<$Res> implements $DashboardFlightsModelCopyWith<$Res> {
  factory _$DashboardFlightsModelCopyWith(_DashboardFlightsModel value, $Res Function(_DashboardFlightsModel) _then) = __$DashboardFlightsModelCopyWithImpl;
@override @useResult
$Res call({
 bool configured, String? provider, DateTime? lastCheckedAt
});




}
/// @nodoc
class __$DashboardFlightsModelCopyWithImpl<$Res>
    implements _$DashboardFlightsModelCopyWith<$Res> {
  __$DashboardFlightsModelCopyWithImpl(this._self, this._then);

  final _DashboardFlightsModel _self;
  final $Res Function(_DashboardFlightsModel) _then;

/// Create a copy of DashboardFlightsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? configured = null,Object? provider = freezed,Object? lastCheckedAt = freezed,}) {
  return _then(_DashboardFlightsModel(
configured: null == configured ? _self.configured : configured // ignore: cast_nullable_to_non_nullable
as bool,provider: freezed == provider ? _self.provider : provider // ignore: cast_nullable_to_non_nullable
as String?,lastCheckedAt: freezed == lastCheckedAt ? _self.lastCheckedAt : lastCheckedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$DashboardSmsModel {

 String get mode; int get pending; bool get stale; DateTime? get lastSentAt;
/// Create a copy of DashboardSmsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardSmsModelCopyWith<DashboardSmsModel> get copyWith => _$DashboardSmsModelCopyWithImpl<DashboardSmsModel>(this as DashboardSmsModel, _$identity);

  /// Serializes this DashboardSmsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardSmsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardSmsModel&&(identical(other.mode, _this.mode) || other.mode == _this.mode)&&(identical(other.pending, _this.pending) || other.pending == _this.pending)&&(identical(other.stale, _this.stale) || other.stale == _this.stale)&&(identical(other.lastSentAt, _this.lastSentAt) || other.lastSentAt == _this.lastSentAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardSmsModel;
  return Object.hash(runtimeType,_this.mode,_this.pending,_this.stale,_this.lastSentAt);
}

@override
String toString() {
  final _this = this as DashboardSmsModel;
  return 'DashboardSmsModel(mode: ${_this.mode}, pending: ${_this.pending}, stale: ${_this.stale}, lastSentAt: ${_this.lastSentAt})';
}


}

/// @nodoc
abstract mixin class $DashboardSmsModelCopyWith<$Res>  {
  factory $DashboardSmsModelCopyWith(DashboardSmsModel value, $Res Function(DashboardSmsModel) _then) = _$DashboardSmsModelCopyWithImpl;
@useResult
$Res call({
 String mode, int pending, bool stale, DateTime? lastSentAt
});




}
/// @nodoc
class _$DashboardSmsModelCopyWithImpl<$Res>
    implements $DashboardSmsModelCopyWith<$Res> {
  _$DashboardSmsModelCopyWithImpl(this._self, this._then);

  final DashboardSmsModel _self;
  final $Res Function(DashboardSmsModel) _then;

/// Create a copy of DashboardSmsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? mode = null,Object? pending = null,Object? stale = null,Object? lastSentAt = freezed,}) {
  return _then(DashboardSmsModel(
mode: null == mode ? _self.mode : mode // ignore: cast_nullable_to_non_nullable
as String,pending: null == pending ? _self.pending : pending // ignore: cast_nullable_to_non_nullable
as int,stale: null == stale ? _self.stale : stale // ignore: cast_nullable_to_non_nullable
as bool,lastSentAt: freezed == lastSentAt ? _self.lastSentAt : lastSentAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardSmsModel].
extension DashboardSmsModelPatterns on DashboardSmsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardSmsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardSmsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardSmsModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardSmsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardSmsModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardSmsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String mode,  int pending,  bool stale,  DateTime? lastSentAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardSmsModel() when $default != null:
return $default(_that.mode,_that.pending,_that.stale,_that.lastSentAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String mode,  int pending,  bool stale,  DateTime? lastSentAt)  $default,) {final _that = this;
switch (_that) {
case _DashboardSmsModel():
return $default(_that.mode,_that.pending,_that.stale,_that.lastSentAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String mode,  int pending,  bool stale,  DateTime? lastSentAt)?  $default,) {final _that = this;
switch (_that) {
case _DashboardSmsModel() when $default != null:
return $default(_that.mode,_that.pending,_that.stale,_that.lastSentAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardSmsModel implements DashboardSmsModel {
  const _DashboardSmsModel({this.mode = 'none', this.pending = 0, this.stale = false, this.lastSentAt});
  factory _DashboardSmsModel.fromJson(Map<String, dynamic> json) => _$DashboardSmsModelFromJson(json);

@override@JsonKey() final  String mode;
@override@JsonKey() final  int pending;
@override@JsonKey() final  bool stale;
@override final  DateTime? lastSentAt;

/// Create a copy of DashboardSmsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardSmsModelCopyWith<_DashboardSmsModel> get copyWith => __$DashboardSmsModelCopyWithImpl<_DashboardSmsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardSmsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardSmsModel&&(identical(other.mode, mode) || other.mode == mode)&&(identical(other.pending, pending) || other.pending == pending)&&(identical(other.stale, stale) || other.stale == stale)&&(identical(other.lastSentAt, lastSentAt) || other.lastSentAt == lastSentAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,mode,pending,stale,lastSentAt);
}

@override
String toString() {
    return 'DashboardSmsModel(mode: $mode, pending: $pending, stale: $stale, lastSentAt: $lastSentAt)';
}


}

/// @nodoc
abstract mixin class _$DashboardSmsModelCopyWith<$Res> implements $DashboardSmsModelCopyWith<$Res> {
  factory _$DashboardSmsModelCopyWith(_DashboardSmsModel value, $Res Function(_DashboardSmsModel) _then) = __$DashboardSmsModelCopyWithImpl;
@override @useResult
$Res call({
 String mode, int pending, bool stale, DateTime? lastSentAt
});




}
/// @nodoc
class __$DashboardSmsModelCopyWithImpl<$Res>
    implements _$DashboardSmsModelCopyWith<$Res> {
  __$DashboardSmsModelCopyWithImpl(this._self, this._then);

  final _DashboardSmsModel _self;
  final $Res Function(_DashboardSmsModel) _then;

/// Create a copy of DashboardSmsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? mode = null,Object? pending = null,Object? stale = null,Object? lastSentAt = freezed,}) {
  return _then(_DashboardSmsModel(
mode: null == mode ? _self.mode : mode // ignore: cast_nullable_to_non_nullable
as String,pending: null == pending ? _self.pending : pending // ignore: cast_nullable_to_non_nullable
as int,stale: null == stale ? _self.stale : stale // ignore: cast_nullable_to_non_nullable
as bool,lastSentAt: freezed == lastSentAt ? _self.lastSentAt : lastSentAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$DashboardPushModel {

 bool get configured; int get devices;
/// Create a copy of DashboardPushModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardPushModelCopyWith<DashboardPushModel> get copyWith => _$DashboardPushModelCopyWithImpl<DashboardPushModel>(this as DashboardPushModel, _$identity);

  /// Serializes this DashboardPushModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardPushModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardPushModel&&(identical(other.configured, _this.configured) || other.configured == _this.configured)&&(identical(other.devices, _this.devices) || other.devices == _this.devices));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardPushModel;
  return Object.hash(runtimeType,_this.configured,_this.devices);
}

@override
String toString() {
  final _this = this as DashboardPushModel;
  return 'DashboardPushModel(configured: ${_this.configured}, devices: ${_this.devices})';
}


}

/// @nodoc
abstract mixin class $DashboardPushModelCopyWith<$Res>  {
  factory $DashboardPushModelCopyWith(DashboardPushModel value, $Res Function(DashboardPushModel) _then) = _$DashboardPushModelCopyWithImpl;
@useResult
$Res call({
 bool configured, int devices
});




}
/// @nodoc
class _$DashboardPushModelCopyWithImpl<$Res>
    implements $DashboardPushModelCopyWith<$Res> {
  _$DashboardPushModelCopyWithImpl(this._self, this._then);

  final DashboardPushModel _self;
  final $Res Function(DashboardPushModel) _then;

/// Create a copy of DashboardPushModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? configured = null,Object? devices = null,}) {
  return _then(DashboardPushModel(
configured: null == configured ? _self.configured : configured // ignore: cast_nullable_to_non_nullable
as bool,devices: null == devices ? _self.devices : devices // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardPushModel].
extension DashboardPushModelPatterns on DashboardPushModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardPushModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardPushModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardPushModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardPushModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardPushModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardPushModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool configured,  int devices)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardPushModel() when $default != null:
return $default(_that.configured,_that.devices);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool configured,  int devices)  $default,) {final _that = this;
switch (_that) {
case _DashboardPushModel():
return $default(_that.configured,_that.devices);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool configured,  int devices)?  $default,) {final _that = this;
switch (_that) {
case _DashboardPushModel() when $default != null:
return $default(_that.configured,_that.devices);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardPushModel implements DashboardPushModel {
  const _DashboardPushModel({this.configured = false, this.devices = 0});
  factory _DashboardPushModel.fromJson(Map<String, dynamic> json) => _$DashboardPushModelFromJson(json);

@override@JsonKey() final  bool configured;
@override@JsonKey() final  int devices;

/// Create a copy of DashboardPushModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardPushModelCopyWith<_DashboardPushModel> get copyWith => __$DashboardPushModelCopyWithImpl<_DashboardPushModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardPushModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardPushModel&&(identical(other.configured, configured) || other.configured == configured)&&(identical(other.devices, devices) || other.devices == devices));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,configured,devices);
}

@override
String toString() {
    return 'DashboardPushModel(configured: $configured, devices: $devices)';
}


}

/// @nodoc
abstract mixin class _$DashboardPushModelCopyWith<$Res> implements $DashboardPushModelCopyWith<$Res> {
  factory _$DashboardPushModelCopyWith(_DashboardPushModel value, $Res Function(_DashboardPushModel) _then) = __$DashboardPushModelCopyWithImpl;
@override @useResult
$Res call({
 bool configured, int devices
});




}
/// @nodoc
class __$DashboardPushModelCopyWithImpl<$Res>
    implements _$DashboardPushModelCopyWith<$Res> {
  __$DashboardPushModelCopyWithImpl(this._self, this._then);

  final _DashboardPushModel _self;
  final $Res Function(_DashboardPushModel) _then;

/// Create a copy of DashboardPushModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? configured = null,Object? devices = null,}) {
  return _then(_DashboardPushModel(
configured: null == configured ? _self.configured : configured // ignore: cast_nullable_to_non_nullable
as bool,devices: null == devices ? _self.devices : devices // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$DashboardStripeModel {

 bool get connected; bool get payoutsEnabled;
/// Create a copy of DashboardStripeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardStripeModelCopyWith<DashboardStripeModel> get copyWith => _$DashboardStripeModelCopyWithImpl<DashboardStripeModel>(this as DashboardStripeModel, _$identity);

  /// Serializes this DashboardStripeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardStripeModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardStripeModel&&(identical(other.connected, _this.connected) || other.connected == _this.connected)&&(identical(other.payoutsEnabled, _this.payoutsEnabled) || other.payoutsEnabled == _this.payoutsEnabled));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardStripeModel;
  return Object.hash(runtimeType,_this.connected,_this.payoutsEnabled);
}

@override
String toString() {
  final _this = this as DashboardStripeModel;
  return 'DashboardStripeModel(connected: ${_this.connected}, payoutsEnabled: ${_this.payoutsEnabled})';
}


}

/// @nodoc
abstract mixin class $DashboardStripeModelCopyWith<$Res>  {
  factory $DashboardStripeModelCopyWith(DashboardStripeModel value, $Res Function(DashboardStripeModel) _then) = _$DashboardStripeModelCopyWithImpl;
@useResult
$Res call({
 bool connected, bool payoutsEnabled
});




}
/// @nodoc
class _$DashboardStripeModelCopyWithImpl<$Res>
    implements $DashboardStripeModelCopyWith<$Res> {
  _$DashboardStripeModelCopyWithImpl(this._self, this._then);

  final DashboardStripeModel _self;
  final $Res Function(DashboardStripeModel) _then;

/// Create a copy of DashboardStripeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? connected = null,Object? payoutsEnabled = null,}) {
  return _then(DashboardStripeModel(
connected: null == connected ? _self.connected : connected // ignore: cast_nullable_to_non_nullable
as bool,payoutsEnabled: null == payoutsEnabled ? _self.payoutsEnabled : payoutsEnabled // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardStripeModel].
extension DashboardStripeModelPatterns on DashboardStripeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardStripeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardStripeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardStripeModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardStripeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardStripeModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardStripeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool connected,  bool payoutsEnabled)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardStripeModel() when $default != null:
return $default(_that.connected,_that.payoutsEnabled);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool connected,  bool payoutsEnabled)  $default,) {final _that = this;
switch (_that) {
case _DashboardStripeModel():
return $default(_that.connected,_that.payoutsEnabled);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool connected,  bool payoutsEnabled)?  $default,) {final _that = this;
switch (_that) {
case _DashboardStripeModel() when $default != null:
return $default(_that.connected,_that.payoutsEnabled);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardStripeModel implements DashboardStripeModel {
  const _DashboardStripeModel({this.connected = false, this.payoutsEnabled = false});
  factory _DashboardStripeModel.fromJson(Map<String, dynamic> json) => _$DashboardStripeModelFromJson(json);

@override@JsonKey() final  bool connected;
@override@JsonKey() final  bool payoutsEnabled;

/// Create a copy of DashboardStripeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardStripeModelCopyWith<_DashboardStripeModel> get copyWith => __$DashboardStripeModelCopyWithImpl<_DashboardStripeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardStripeModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardStripeModel&&(identical(other.connected, connected) || other.connected == connected)&&(identical(other.payoutsEnabled, payoutsEnabled) || other.payoutsEnabled == payoutsEnabled));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,connected,payoutsEnabled);
}

@override
String toString() {
    return 'DashboardStripeModel(connected: $connected, payoutsEnabled: $payoutsEnabled)';
}


}

/// @nodoc
abstract mixin class _$DashboardStripeModelCopyWith<$Res> implements $DashboardStripeModelCopyWith<$Res> {
  factory _$DashboardStripeModelCopyWith(_DashboardStripeModel value, $Res Function(_DashboardStripeModel) _then) = __$DashboardStripeModelCopyWithImpl;
@override @useResult
$Res call({
 bool connected, bool payoutsEnabled
});




}
/// @nodoc
class __$DashboardStripeModelCopyWithImpl<$Res>
    implements _$DashboardStripeModelCopyWith<$Res> {
  __$DashboardStripeModelCopyWithImpl(this._self, this._then);

  final _DashboardStripeModel _self;
  final $Res Function(_DashboardStripeModel) _then;

/// Create a copy of DashboardStripeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? connected = null,Object? payoutsEnabled = null,}) {
  return _then(_DashboardStripeModel(
connected: null == connected ? _self.connected : connected // ignore: cast_nullable_to_non_nullable
as bool,payoutsEnabled: null == payoutsEnabled ? _self.payoutsEnabled : payoutsEnabled // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$DashboardServicesModel {

 DashboardFlightsModel get flights; DashboardSmsModel get sms; DashboardPushModel get push; DashboardStripeModel get stripe; DateTime? get lastImportAt;
/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardServicesModelCopyWith<DashboardServicesModel> get copyWith => _$DashboardServicesModelCopyWithImpl<DashboardServicesModel>(this as DashboardServicesModel, _$identity);

  /// Serializes this DashboardServicesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardServicesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardServicesModel&&(identical(other.flights, _this.flights) || other.flights == _this.flights)&&(identical(other.sms, _this.sms) || other.sms == _this.sms)&&(identical(other.push, _this.push) || other.push == _this.push)&&(identical(other.stripe, _this.stripe) || other.stripe == _this.stripe)&&(identical(other.lastImportAt, _this.lastImportAt) || other.lastImportAt == _this.lastImportAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardServicesModel;
  return Object.hash(runtimeType,_this.flights,_this.sms,_this.push,_this.stripe,_this.lastImportAt);
}

@override
String toString() {
  final _this = this as DashboardServicesModel;
  return 'DashboardServicesModel(flights: ${_this.flights}, sms: ${_this.sms}, push: ${_this.push}, stripe: ${_this.stripe}, lastImportAt: ${_this.lastImportAt})';
}


}

/// @nodoc
abstract mixin class $DashboardServicesModelCopyWith<$Res>  {
  factory $DashboardServicesModelCopyWith(DashboardServicesModel value, $Res Function(DashboardServicesModel) _then) = _$DashboardServicesModelCopyWithImpl;
@useResult
$Res call({
 DashboardFlightsModel flights, DashboardSmsModel sms, DashboardPushModel push, DashboardStripeModel stripe, DateTime? lastImportAt
});


$DashboardFlightsModelCopyWith<$Res> get flights;$DashboardSmsModelCopyWith<$Res> get sms;$DashboardPushModelCopyWith<$Res> get push;$DashboardStripeModelCopyWith<$Res> get stripe;

}
/// @nodoc
class _$DashboardServicesModelCopyWithImpl<$Res>
    implements $DashboardServicesModelCopyWith<$Res> {
  _$DashboardServicesModelCopyWithImpl(this._self, this._then);

  final DashboardServicesModel _self;
  final $Res Function(DashboardServicesModel) _then;

/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? flights = null,Object? sms = null,Object? push = null,Object? stripe = null,Object? lastImportAt = freezed,}) {
  return _then(DashboardServicesModel(
flights: null == flights ? _self.flights : flights // ignore: cast_nullable_to_non_nullable
as DashboardFlightsModel,sms: null == sms ? _self.sms : sms // ignore: cast_nullable_to_non_nullable
as DashboardSmsModel,push: null == push ? _self.push : push // ignore: cast_nullable_to_non_nullable
as DashboardPushModel,stripe: null == stripe ? _self.stripe : stripe // ignore: cast_nullable_to_non_nullable
as DashboardStripeModel,lastImportAt: freezed == lastImportAt ? _self.lastImportAt : lastImportAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}
/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardFlightsModelCopyWith<$Res> get flights {
  
  return $DashboardFlightsModelCopyWith<$Res>(_self.flights, (value) {
    return _then(_self.copyWith(flights: value));
  });
}/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardSmsModelCopyWith<$Res> get sms {
  
  return $DashboardSmsModelCopyWith<$Res>(_self.sms, (value) {
    return _then(_self.copyWith(sms: value));
  });
}/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardPushModelCopyWith<$Res> get push {
  
  return $DashboardPushModelCopyWith<$Res>(_self.push, (value) {
    return _then(_self.copyWith(push: value));
  });
}/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardStripeModelCopyWith<$Res> get stripe {
  
  return $DashboardStripeModelCopyWith<$Res>(_self.stripe, (value) {
    return _then(_self.copyWith(stripe: value));
  });
}
}


/// Adds pattern-matching-related methods to [DashboardServicesModel].
extension DashboardServicesModelPatterns on DashboardServicesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardServicesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardServicesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardServicesModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardServicesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardServicesModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardServicesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DashboardFlightsModel flights,  DashboardSmsModel sms,  DashboardPushModel push,  DashboardStripeModel stripe,  DateTime? lastImportAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardServicesModel() when $default != null:
return $default(_that.flights,_that.sms,_that.push,_that.stripe,_that.lastImportAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DashboardFlightsModel flights,  DashboardSmsModel sms,  DashboardPushModel push,  DashboardStripeModel stripe,  DateTime? lastImportAt)  $default,) {final _that = this;
switch (_that) {
case _DashboardServicesModel():
return $default(_that.flights,_that.sms,_that.push,_that.stripe,_that.lastImportAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DashboardFlightsModel flights,  DashboardSmsModel sms,  DashboardPushModel push,  DashboardStripeModel stripe,  DateTime? lastImportAt)?  $default,) {final _that = this;
switch (_that) {
case _DashboardServicesModel() when $default != null:
return $default(_that.flights,_that.sms,_that.push,_that.stripe,_that.lastImportAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardServicesModel implements DashboardServicesModel {
  const _DashboardServicesModel({this.flights = const DashboardFlightsModel(), this.sms = const DashboardSmsModel(), this.push = const DashboardPushModel(), this.stripe = const DashboardStripeModel(), this.lastImportAt});
  factory _DashboardServicesModel.fromJson(Map<String, dynamic> json) => _$DashboardServicesModelFromJson(json);

@override@JsonKey() final  DashboardFlightsModel flights;
@override@JsonKey() final  DashboardSmsModel sms;
@override@JsonKey() final  DashboardPushModel push;
@override@JsonKey() final  DashboardStripeModel stripe;
@override final  DateTime? lastImportAt;

/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardServicesModelCopyWith<_DashboardServicesModel> get copyWith => __$DashboardServicesModelCopyWithImpl<_DashboardServicesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardServicesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardServicesModel&&(identical(other.flights, flights) || other.flights == flights)&&(identical(other.sms, sms) || other.sms == sms)&&(identical(other.push, push) || other.push == push)&&(identical(other.stripe, stripe) || other.stripe == stripe)&&(identical(other.lastImportAt, lastImportAt) || other.lastImportAt == lastImportAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,flights,sms,push,stripe,lastImportAt);
}

@override
String toString() {
    return 'DashboardServicesModel(flights: $flights, sms: $sms, push: $push, stripe: $stripe, lastImportAt: $lastImportAt)';
}


}

/// @nodoc
abstract mixin class _$DashboardServicesModelCopyWith<$Res> implements $DashboardServicesModelCopyWith<$Res> {
  factory _$DashboardServicesModelCopyWith(_DashboardServicesModel value, $Res Function(_DashboardServicesModel) _then) = __$DashboardServicesModelCopyWithImpl;
@override @useResult
$Res call({
 DashboardFlightsModel flights, DashboardSmsModel sms, DashboardPushModel push, DashboardStripeModel stripe, DateTime? lastImportAt
});


@override $DashboardFlightsModelCopyWith<$Res> get flights;@override $DashboardSmsModelCopyWith<$Res> get sms;@override $DashboardPushModelCopyWith<$Res> get push;@override $DashboardStripeModelCopyWith<$Res> get stripe;

}
/// @nodoc
class __$DashboardServicesModelCopyWithImpl<$Res>
    implements _$DashboardServicesModelCopyWith<$Res> {
  __$DashboardServicesModelCopyWithImpl(this._self, this._then);

  final _DashboardServicesModel _self;
  final $Res Function(_DashboardServicesModel) _then;

/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? flights = null,Object? sms = null,Object? push = null,Object? stripe = null,Object? lastImportAt = freezed,}) {
  return _then(_DashboardServicesModel(
flights: null == flights ? _self.flights : flights // ignore: cast_nullable_to_non_nullable
as DashboardFlightsModel,sms: null == sms ? _self.sms : sms // ignore: cast_nullable_to_non_nullable
as DashboardSmsModel,push: null == push ? _self.push : push // ignore: cast_nullable_to_non_nullable
as DashboardPushModel,stripe: null == stripe ? _self.stripe : stripe // ignore: cast_nullable_to_non_nullable
as DashboardStripeModel,lastImportAt: freezed == lastImportAt ? _self.lastImportAt : lastImportAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardFlightsModelCopyWith<$Res> get flights {
  
  return $DashboardFlightsModelCopyWith<$Res>(_self.flights, (value) {
    return _then(_self.copyWith(flights: value));
  });
}/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardSmsModelCopyWith<$Res> get sms {
  
  return $DashboardSmsModelCopyWith<$Res>(_self.sms, (value) {
    return _then(_self.copyWith(sms: value));
  });
}/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardPushModelCopyWith<$Res> get push {
  
  return $DashboardPushModelCopyWith<$Res>(_self.push, (value) {
    return _then(_self.copyWith(push: value));
  });
}/// Create a copy of DashboardServicesModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DashboardStripeModelCopyWith<$Res> get stripe {
  
  return $DashboardStripeModelCopyWith<$Res>(_self.stripe, (value) {
    return _then(_self.copyWith(stripe: value));
  });
}
}


/// @nodoc
mixin _$DashboardAlertModel {

 String get kind; String get severity; String? get reservationId; String? get reference; String? get customerName; String? get plate; String? get detail; DateTime? get since; int? get minutes;
/// Create a copy of DashboardAlertModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardAlertModelCopyWith<DashboardAlertModel> get copyWith => _$DashboardAlertModelCopyWithImpl<DashboardAlertModel>(this as DashboardAlertModel, _$identity);

  /// Serializes this DashboardAlertModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardAlertModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardAlertModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.severity, _this.severity) || other.severity == _this.severity)&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.detail, _this.detail) || other.detail == _this.detail)&&(identical(other.since, _this.since) || other.since == _this.since)&&(identical(other.minutes, _this.minutes) || other.minutes == _this.minutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardAlertModel;
  return Object.hash(runtimeType,_this.kind,_this.severity,_this.reservationId,_this.reference,_this.customerName,_this.plate,_this.detail,_this.since,_this.minutes);
}

@override
String toString() {
  final _this = this as DashboardAlertModel;
  return 'DashboardAlertModel(kind: ${_this.kind}, severity: ${_this.severity}, reservationId: ${_this.reservationId}, reference: ${_this.reference}, customerName: ${_this.customerName}, plate: ${_this.plate}, detail: ${_this.detail}, since: ${_this.since}, minutes: ${_this.minutes})';
}


}

/// @nodoc
abstract mixin class $DashboardAlertModelCopyWith<$Res>  {
  factory $DashboardAlertModelCopyWith(DashboardAlertModel value, $Res Function(DashboardAlertModel) _then) = _$DashboardAlertModelCopyWithImpl;
@useResult
$Res call({
 String kind, String severity, String? reservationId, String? reference, String? customerName, String? plate, String? detail, DateTime? since, int? minutes
});




}
/// @nodoc
class _$DashboardAlertModelCopyWithImpl<$Res>
    implements $DashboardAlertModelCopyWith<$Res> {
  _$DashboardAlertModelCopyWithImpl(this._self, this._then);

  final DashboardAlertModel _self;
  final $Res Function(DashboardAlertModel) _then;

/// Create a copy of DashboardAlertModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? severity = null,Object? reservationId = freezed,Object? reference = freezed,Object? customerName = freezed,Object? plate = freezed,Object? detail = freezed,Object? since = freezed,Object? minutes = freezed,}) {
  return _then(DashboardAlertModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,severity: null == severity ? _self.severity : severity // ignore: cast_nullable_to_non_nullable
as String,reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,customerName: freezed == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,detail: freezed == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String?,since: freezed == since ? _self.since : since // ignore: cast_nullable_to_non_nullable
as DateTime?,minutes: freezed == minutes ? _self.minutes : minutes // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardAlertModel].
extension DashboardAlertModelPatterns on DashboardAlertModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardAlertModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardAlertModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardAlertModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardAlertModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardAlertModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardAlertModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  String severity,  String? reservationId,  String? reference,  String? customerName,  String? plate,  String? detail,  DateTime? since,  int? minutes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardAlertModel() when $default != null:
return $default(_that.kind,_that.severity,_that.reservationId,_that.reference,_that.customerName,_that.plate,_that.detail,_that.since,_that.minutes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  String severity,  String? reservationId,  String? reference,  String? customerName,  String? plate,  String? detail,  DateTime? since,  int? minutes)  $default,) {final _that = this;
switch (_that) {
case _DashboardAlertModel():
return $default(_that.kind,_that.severity,_that.reservationId,_that.reference,_that.customerName,_that.plate,_that.detail,_that.since,_that.minutes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  String severity,  String? reservationId,  String? reference,  String? customerName,  String? plate,  String? detail,  DateTime? since,  int? minutes)?  $default,) {final _that = this;
switch (_that) {
case _DashboardAlertModel() when $default != null:
return $default(_that.kind,_that.severity,_that.reservationId,_that.reference,_that.customerName,_that.plate,_that.detail,_that.since,_that.minutes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardAlertModel implements DashboardAlertModel {
  const _DashboardAlertModel({required this.kind, this.severity = 'todo', this.reservationId, this.reference, this.customerName, this.plate, this.detail, this.since, this.minutes});
  factory _DashboardAlertModel.fromJson(Map<String, dynamic> json) => _$DashboardAlertModelFromJson(json);

@override final  String kind;
@override@JsonKey() final  String severity;
@override final  String? reservationId;
@override final  String? reference;
@override final  String? customerName;
@override final  String? plate;
@override final  String? detail;
@override final  DateTime? since;
@override final  int? minutes;

/// Create a copy of DashboardAlertModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardAlertModelCopyWith<_DashboardAlertModel> get copyWith => __$DashboardAlertModelCopyWithImpl<_DashboardAlertModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardAlertModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardAlertModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.severity, severity) || other.severity == severity)&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.detail, detail) || other.detail == detail)&&(identical(other.since, since) || other.since == since)&&(identical(other.minutes, minutes) || other.minutes == minutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,severity,reservationId,reference,customerName,plate,detail,since,minutes);
}

@override
String toString() {
    return 'DashboardAlertModel(kind: $kind, severity: $severity, reservationId: $reservationId, reference: $reference, customerName: $customerName, plate: $plate, detail: $detail, since: $since, minutes: $minutes)';
}


}

/// @nodoc
abstract mixin class _$DashboardAlertModelCopyWith<$Res> implements $DashboardAlertModelCopyWith<$Res> {
  factory _$DashboardAlertModelCopyWith(_DashboardAlertModel value, $Res Function(_DashboardAlertModel) _then) = __$DashboardAlertModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, String severity, String? reservationId, String? reference, String? customerName, String? plate, String? detail, DateTime? since, int? minutes
});




}
/// @nodoc
class __$DashboardAlertModelCopyWithImpl<$Res>
    implements _$DashboardAlertModelCopyWith<$Res> {
  __$DashboardAlertModelCopyWithImpl(this._self, this._then);

  final _DashboardAlertModel _self;
  final $Res Function(_DashboardAlertModel) _then;

/// Create a copy of DashboardAlertModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? severity = null,Object? reservationId = freezed,Object? reference = freezed,Object? customerName = freezed,Object? plate = freezed,Object? detail = freezed,Object? since = freezed,Object? minutes = freezed,}) {
  return _then(_DashboardAlertModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,severity: null == severity ? _self.severity : severity // ignore: cast_nullable_to_non_nullable
as String,reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,reference: freezed == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String?,customerName: freezed == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,detail: freezed == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String?,since: freezed == since ? _self.since : since // ignore: cast_nullable_to_non_nullable
as DateTime?,minutes: freezed == minutes ? _self.minutes : minutes // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$DashboardBreakdownModel {

 int get onSiteQuiet; int get toPlaceToday; int get returnsThisWeek; int get toTreat; int? get freeSpots;
/// Create a copy of DashboardBreakdownModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardBreakdownModelCopyWith<DashboardBreakdownModel> get copyWith => _$DashboardBreakdownModelCopyWithImpl<DashboardBreakdownModel>(this as DashboardBreakdownModel, _$identity);

  /// Serializes this DashboardBreakdownModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardBreakdownModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardBreakdownModel&&(identical(other.onSiteQuiet, _this.onSiteQuiet) || other.onSiteQuiet == _this.onSiteQuiet)&&(identical(other.toPlaceToday, _this.toPlaceToday) || other.toPlaceToday == _this.toPlaceToday)&&(identical(other.returnsThisWeek, _this.returnsThisWeek) || other.returnsThisWeek == _this.returnsThisWeek)&&(identical(other.toTreat, _this.toTreat) || other.toTreat == _this.toTreat)&&(identical(other.freeSpots, _this.freeSpots) || other.freeSpots == _this.freeSpots));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardBreakdownModel;
  return Object.hash(runtimeType,_this.onSiteQuiet,_this.toPlaceToday,_this.returnsThisWeek,_this.toTreat,_this.freeSpots);
}

@override
String toString() {
  final _this = this as DashboardBreakdownModel;
  return 'DashboardBreakdownModel(onSiteQuiet: ${_this.onSiteQuiet}, toPlaceToday: ${_this.toPlaceToday}, returnsThisWeek: ${_this.returnsThisWeek}, toTreat: ${_this.toTreat}, freeSpots: ${_this.freeSpots})';
}


}

/// @nodoc
abstract mixin class $DashboardBreakdownModelCopyWith<$Res>  {
  factory $DashboardBreakdownModelCopyWith(DashboardBreakdownModel value, $Res Function(DashboardBreakdownModel) _then) = _$DashboardBreakdownModelCopyWithImpl;
@useResult
$Res call({
 int onSiteQuiet, int toPlaceToday, int returnsThisWeek, int toTreat, int? freeSpots
});




}
/// @nodoc
class _$DashboardBreakdownModelCopyWithImpl<$Res>
    implements $DashboardBreakdownModelCopyWith<$Res> {
  _$DashboardBreakdownModelCopyWithImpl(this._self, this._then);

  final DashboardBreakdownModel _self;
  final $Res Function(DashboardBreakdownModel) _then;

/// Create a copy of DashboardBreakdownModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? onSiteQuiet = null,Object? toPlaceToday = null,Object? returnsThisWeek = null,Object? toTreat = null,Object? freeSpots = freezed,}) {
  return _then(DashboardBreakdownModel(
onSiteQuiet: null == onSiteQuiet ? _self.onSiteQuiet : onSiteQuiet // ignore: cast_nullable_to_non_nullable
as int,toPlaceToday: null == toPlaceToday ? _self.toPlaceToday : toPlaceToday // ignore: cast_nullable_to_non_nullable
as int,returnsThisWeek: null == returnsThisWeek ? _self.returnsThisWeek : returnsThisWeek // ignore: cast_nullable_to_non_nullable
as int,toTreat: null == toTreat ? _self.toTreat : toTreat // ignore: cast_nullable_to_non_nullable
as int,freeSpots: freezed == freeSpots ? _self.freeSpots : freeSpots // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardBreakdownModel].
extension DashboardBreakdownModelPatterns on DashboardBreakdownModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardBreakdownModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardBreakdownModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardBreakdownModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardBreakdownModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardBreakdownModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardBreakdownModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int onSiteQuiet,  int toPlaceToday,  int returnsThisWeek,  int toTreat,  int? freeSpots)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardBreakdownModel() when $default != null:
return $default(_that.onSiteQuiet,_that.toPlaceToday,_that.returnsThisWeek,_that.toTreat,_that.freeSpots);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int onSiteQuiet,  int toPlaceToday,  int returnsThisWeek,  int toTreat,  int? freeSpots)  $default,) {final _that = this;
switch (_that) {
case _DashboardBreakdownModel():
return $default(_that.onSiteQuiet,_that.toPlaceToday,_that.returnsThisWeek,_that.toTreat,_that.freeSpots);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int onSiteQuiet,  int toPlaceToday,  int returnsThisWeek,  int toTreat,  int? freeSpots)?  $default,) {final _that = this;
switch (_that) {
case _DashboardBreakdownModel() when $default != null:
return $default(_that.onSiteQuiet,_that.toPlaceToday,_that.returnsThisWeek,_that.toTreat,_that.freeSpots);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardBreakdownModel implements DashboardBreakdownModel {
  const _DashboardBreakdownModel({this.onSiteQuiet = 0, this.toPlaceToday = 0, this.returnsThisWeek = 0, this.toTreat = 0, this.freeSpots});
  factory _DashboardBreakdownModel.fromJson(Map<String, dynamic> json) => _$DashboardBreakdownModelFromJson(json);

@override@JsonKey() final  int onSiteQuiet;
@override@JsonKey() final  int toPlaceToday;
@override@JsonKey() final  int returnsThisWeek;
@override@JsonKey() final  int toTreat;
@override final  int? freeSpots;

/// Create a copy of DashboardBreakdownModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardBreakdownModelCopyWith<_DashboardBreakdownModel> get copyWith => __$DashboardBreakdownModelCopyWithImpl<_DashboardBreakdownModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardBreakdownModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardBreakdownModel&&(identical(other.onSiteQuiet, onSiteQuiet) || other.onSiteQuiet == onSiteQuiet)&&(identical(other.toPlaceToday, toPlaceToday) || other.toPlaceToday == toPlaceToday)&&(identical(other.returnsThisWeek, returnsThisWeek) || other.returnsThisWeek == returnsThisWeek)&&(identical(other.toTreat, toTreat) || other.toTreat == toTreat)&&(identical(other.freeSpots, freeSpots) || other.freeSpots == freeSpots));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,onSiteQuiet,toPlaceToday,returnsThisWeek,toTreat,freeSpots);
}

@override
String toString() {
    return 'DashboardBreakdownModel(onSiteQuiet: $onSiteQuiet, toPlaceToday: $toPlaceToday, returnsThisWeek: $returnsThisWeek, toTreat: $toTreat, freeSpots: $freeSpots)';
}


}

/// @nodoc
abstract mixin class _$DashboardBreakdownModelCopyWith<$Res> implements $DashboardBreakdownModelCopyWith<$Res> {
  factory _$DashboardBreakdownModelCopyWith(_DashboardBreakdownModel value, $Res Function(_DashboardBreakdownModel) _then) = __$DashboardBreakdownModelCopyWithImpl;
@override @useResult
$Res call({
 int onSiteQuiet, int toPlaceToday, int returnsThisWeek, int toTreat, int? freeSpots
});




}
/// @nodoc
class __$DashboardBreakdownModelCopyWithImpl<$Res>
    implements _$DashboardBreakdownModelCopyWith<$Res> {
  __$DashboardBreakdownModelCopyWithImpl(this._self, this._then);

  final _DashboardBreakdownModel _self;
  final $Res Function(_DashboardBreakdownModel) _then;

/// Create a copy of DashboardBreakdownModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? onSiteQuiet = null,Object? toPlaceToday = null,Object? returnsThisWeek = null,Object? toTreat = null,Object? freeSpots = freezed,}) {
  return _then(_DashboardBreakdownModel(
onSiteQuiet: null == onSiteQuiet ? _self.onSiteQuiet : onSiteQuiet // ignore: cast_nullable_to_non_nullable
as int,toPlaceToday: null == toPlaceToday ? _self.toPlaceToday : toPlaceToday // ignore: cast_nullable_to_non_nullable
as int,returnsThisWeek: null == returnsThisWeek ? _self.returnsThisWeek : returnsThisWeek // ignore: cast_nullable_to_non_nullable
as int,toTreat: null == toTreat ? _self.toTreat : toTreat // ignore: cast_nullable_to_non_nullable
as int,freeSpots: freezed == freeSpots ? _self.freeSpots : freeSpots // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$DashboardVehicleModel {

 String get id; String get reference; String get customerName; int get passengers; String get plate; String get status; String get arrivalAt; String get returnAt; String? get spotCode; String? get stayClass; String? get keyHook; String? get returnFlight; String? get flightStatus; String? get flightEstimatedAt; String? get flightLandedAt; String? get tripDirection; String? get stopName; bool get returnsToday;
/// Create a copy of DashboardVehicleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardVehicleModelCopyWith<DashboardVehicleModel> get copyWith => _$DashboardVehicleModelCopyWithImpl<DashboardVehicleModel>(this as DashboardVehicleModel, _$identity);

  /// Serializes this DashboardVehicleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DashboardVehicleModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardVehicleModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.spotCode, _this.spotCode) || other.spotCode == _this.spotCode)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass)&&(identical(other.keyHook, _this.keyHook) || other.keyHook == _this.keyHook)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.flightStatus, _this.flightStatus) || other.flightStatus == _this.flightStatus)&&(identical(other.flightEstimatedAt, _this.flightEstimatedAt) || other.flightEstimatedAt == _this.flightEstimatedAt)&&(identical(other.flightLandedAt, _this.flightLandedAt) || other.flightLandedAt == _this.flightLandedAt)&&(identical(other.tripDirection, _this.tripDirection) || other.tripDirection == _this.tripDirection)&&(identical(other.stopName, _this.stopName) || other.stopName == _this.stopName)&&(identical(other.returnsToday, _this.returnsToday) || other.returnsToday == _this.returnsToday));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DashboardVehicleModel;
  return Object.hash(runtimeType,_this.id,_this.reference,_this.customerName,_this.passengers,_this.plate,_this.status,_this.arrivalAt,_this.returnAt,_this.spotCode,_this.stayClass,_this.keyHook,_this.returnFlight,_this.flightStatus,_this.flightEstimatedAt,_this.flightLandedAt,_this.tripDirection,_this.stopName,_this.returnsToday);
}

@override
String toString() {
  final _this = this as DashboardVehicleModel;
  return 'DashboardVehicleModel(id: ${_this.id}, reference: ${_this.reference}, customerName: ${_this.customerName}, passengers: ${_this.passengers}, plate: ${_this.plate}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, spotCode: ${_this.spotCode}, stayClass: ${_this.stayClass}, keyHook: ${_this.keyHook}, returnFlight: ${_this.returnFlight}, flightStatus: ${_this.flightStatus}, flightEstimatedAt: ${_this.flightEstimatedAt}, flightLandedAt: ${_this.flightLandedAt}, tripDirection: ${_this.tripDirection}, stopName: ${_this.stopName}, returnsToday: ${_this.returnsToday})';
}


}

/// @nodoc
abstract mixin class $DashboardVehicleModelCopyWith<$Res>  {
  factory $DashboardVehicleModelCopyWith(DashboardVehicleModel value, $Res Function(DashboardVehicleModel) _then) = _$DashboardVehicleModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String customerName, int passengers, String plate, String status, String arrivalAt, String returnAt, String? spotCode, String? stayClass, String? keyHook, String? returnFlight, String? flightStatus, String? flightEstimatedAt, String? flightLandedAt, String? tripDirection, String? stopName, bool returnsToday
});




}
/// @nodoc
class _$DashboardVehicleModelCopyWithImpl<$Res>
    implements $DashboardVehicleModelCopyWith<$Res> {
  _$DashboardVehicleModelCopyWithImpl(this._self, this._then);

  final DashboardVehicleModel _self;
  final $Res Function(DashboardVehicleModel) _then;

/// Create a copy of DashboardVehicleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? spotCode = freezed,Object? stayClass = freezed,Object? keyHook = freezed,Object? returnFlight = freezed,Object? flightStatus = freezed,Object? flightEstimatedAt = freezed,Object? flightLandedAt = freezed,Object? tripDirection = freezed,Object? stopName = freezed,Object? returnsToday = null,}) {
  return _then(DashboardVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,spotCode: freezed == spotCode ? _self.spotCode : spotCode // ignore: cast_nullable_to_non_nullable
as String?,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,flightStatus: freezed == flightStatus ? _self.flightStatus : flightStatus // ignore: cast_nullable_to_non_nullable
as String?,flightEstimatedAt: freezed == flightEstimatedAt ? _self.flightEstimatedAt : flightEstimatedAt // ignore: cast_nullable_to_non_nullable
as String?,flightLandedAt: freezed == flightLandedAt ? _self.flightLandedAt : flightLandedAt // ignore: cast_nullable_to_non_nullable
as String?,tripDirection: freezed == tripDirection ? _self.tripDirection : tripDirection // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,returnsToday: null == returnsToday ? _self.returnsToday : returnsToday // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardVehicleModel].
extension DashboardVehicleModelPatterns on DashboardVehicleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardVehicleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardVehicleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardVehicleModel value)  $default,){
final _that = this;
switch (_that) {
case _DashboardVehicleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardVehicleModel value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardVehicleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  int passengers,  String plate,  String status,  String arrivalAt,  String returnAt,  String? spotCode,  String? stayClass,  String? keyHook,  String? returnFlight,  String? flightStatus,  String? flightEstimatedAt,  String? flightLandedAt,  String? tripDirection,  String? stopName,  bool returnsToday)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardVehicleModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.spotCode,_that.stayClass,_that.keyHook,_that.returnFlight,_that.flightStatus,_that.flightEstimatedAt,_that.flightLandedAt,_that.tripDirection,_that.stopName,_that.returnsToday);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  int passengers,  String plate,  String status,  String arrivalAt,  String returnAt,  String? spotCode,  String? stayClass,  String? keyHook,  String? returnFlight,  String? flightStatus,  String? flightEstimatedAt,  String? flightLandedAt,  String? tripDirection,  String? stopName,  bool returnsToday)  $default,) {final _that = this;
switch (_that) {
case _DashboardVehicleModel():
return $default(_that.id,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.spotCode,_that.stayClass,_that.keyHook,_that.returnFlight,_that.flightStatus,_that.flightEstimatedAt,_that.flightLandedAt,_that.tripDirection,_that.stopName,_that.returnsToday);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String customerName,  int passengers,  String plate,  String status,  String arrivalAt,  String returnAt,  String? spotCode,  String? stayClass,  String? keyHook,  String? returnFlight,  String? flightStatus,  String? flightEstimatedAt,  String? flightLandedAt,  String? tripDirection,  String? stopName,  bool returnsToday)?  $default,) {final _that = this;
switch (_that) {
case _DashboardVehicleModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.passengers,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.spotCode,_that.stayClass,_that.keyHook,_that.returnFlight,_that.flightStatus,_that.flightEstimatedAt,_that.flightLandedAt,_that.tripDirection,_that.stopName,_that.returnsToday);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardVehicleModel implements DashboardVehicleModel {
  const _DashboardVehicleModel({required this.id, required this.reference, required this.customerName, this.passengers = 1, required this.plate, required this.status, required this.arrivalAt, required this.returnAt, this.spotCode, this.stayClass, this.keyHook, this.returnFlight, this.flightStatus, this.flightEstimatedAt, this.flightLandedAt, this.tripDirection, this.stopName, this.returnsToday = false});
  factory _DashboardVehicleModel.fromJson(Map<String, dynamic> json) => _$DashboardVehicleModelFromJson(json);

@override final  String id;
@override final  String reference;
@override final  String customerName;
@override@JsonKey() final  int passengers;
@override final  String plate;
@override final  String status;
@override final  String arrivalAt;
@override final  String returnAt;
@override final  String? spotCode;
@override final  String? stayClass;
@override final  String? keyHook;
@override final  String? returnFlight;
@override final  String? flightStatus;
@override final  String? flightEstimatedAt;
@override final  String? flightLandedAt;
@override final  String? tripDirection;
@override final  String? stopName;
@override@JsonKey() final  bool returnsToday;

/// Create a copy of DashboardVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardVehicleModelCopyWith<_DashboardVehicleModel> get copyWith => __$DashboardVehicleModelCopyWithImpl<_DashboardVehicleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardVehicleModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardVehicleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.spotCode, spotCode) || other.spotCode == spotCode)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass)&&(identical(other.keyHook, keyHook) || other.keyHook == keyHook)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.flightStatus, flightStatus) || other.flightStatus == flightStatus)&&(identical(other.flightEstimatedAt, flightEstimatedAt) || other.flightEstimatedAt == flightEstimatedAt)&&(identical(other.flightLandedAt, flightLandedAt) || other.flightLandedAt == flightLandedAt)&&(identical(other.tripDirection, tripDirection) || other.tripDirection == tripDirection)&&(identical(other.stopName, stopName) || other.stopName == stopName)&&(identical(other.returnsToday, returnsToday) || other.returnsToday == returnsToday));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,reference,customerName,passengers,plate,status,arrivalAt,returnAt,spotCode,stayClass,keyHook,returnFlight,flightStatus,flightEstimatedAt,flightLandedAt,tripDirection,stopName,returnsToday);
}

@override
String toString() {
    return 'DashboardVehicleModel(id: $id, reference: $reference, customerName: $customerName, passengers: $passengers, plate: $plate, status: $status, arrivalAt: $arrivalAt, returnAt: $returnAt, spotCode: $spotCode, stayClass: $stayClass, keyHook: $keyHook, returnFlight: $returnFlight, flightStatus: $flightStatus, flightEstimatedAt: $flightEstimatedAt, flightLandedAt: $flightLandedAt, tripDirection: $tripDirection, stopName: $stopName, returnsToday: $returnsToday)';
}


}

/// @nodoc
abstract mixin class _$DashboardVehicleModelCopyWith<$Res> implements $DashboardVehicleModelCopyWith<$Res> {
  factory _$DashboardVehicleModelCopyWith(_DashboardVehicleModel value, $Res Function(_DashboardVehicleModel) _then) = __$DashboardVehicleModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String customerName, int passengers, String plate, String status, String arrivalAt, String returnAt, String? spotCode, String? stayClass, String? keyHook, String? returnFlight, String? flightStatus, String? flightEstimatedAt, String? flightLandedAt, String? tripDirection, String? stopName, bool returnsToday
});




}
/// @nodoc
class __$DashboardVehicleModelCopyWithImpl<$Res>
    implements _$DashboardVehicleModelCopyWith<$Res> {
  __$DashboardVehicleModelCopyWithImpl(this._self, this._then);

  final _DashboardVehicleModel _self;
  final $Res Function(_DashboardVehicleModel) _then;

/// Create a copy of DashboardVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? passengers = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? spotCode = freezed,Object? stayClass = freezed,Object? keyHook = freezed,Object? returnFlight = freezed,Object? flightStatus = freezed,Object? flightEstimatedAt = freezed,Object? flightLandedAt = freezed,Object? tripDirection = freezed,Object? stopName = freezed,Object? returnsToday = null,}) {
  return _then(_DashboardVehicleModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,spotCode: freezed == spotCode ? _self.spotCode : spotCode // ignore: cast_nullable_to_non_nullable
as String?,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,keyHook: freezed == keyHook ? _self.keyHook : keyHook // ignore: cast_nullable_to_non_nullable
as String?,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,flightStatus: freezed == flightStatus ? _self.flightStatus : flightStatus // ignore: cast_nullable_to_non_nullable
as String?,flightEstimatedAt: freezed == flightEstimatedAt ? _self.flightEstimatedAt : flightEstimatedAt // ignore: cast_nullable_to_non_nullable
as String?,flightLandedAt: freezed == flightLandedAt ? _self.flightLandedAt : flightLandedAt // ignore: cast_nullable_to_non_nullable
as String?,tripDirection: freezed == tripDirection ? _self.tripDirection : tripDirection // ignore: cast_nullable_to_non_nullable
as String?,stopName: freezed == stopName ? _self.stopName : stopName // ignore: cast_nullable_to_non_nullable
as String?,returnsToday: null == returnsToday ? _self.returnsToday : returnsToday // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
