// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'return_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$FlightViewModel {

 String? get number;/// scheduled, delayed, departed, landed, cancelled, diverted, unknown; null: not looked up yet.
 String? get status; DateTime? get scheduledAt; DateTime? get estimatedAt; DateTime? get landedAt;/// tracking (the flight API) or traveller ("J'ai atterri").
 String? get landedSource; String? get terminal; String? get gate; DateTime? get checkedAt;
/// Create a copy of FlightViewModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FlightViewModelCopyWith<FlightViewModel> get copyWith => _$FlightViewModelCopyWithImpl<FlightViewModel>(this as FlightViewModel, _$identity);

  /// Serializes this FlightViewModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FlightViewModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FlightViewModel&&(identical(other.number, _this.number) || other.number == _this.number)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.scheduledAt, _this.scheduledAt) || other.scheduledAt == _this.scheduledAt)&&(identical(other.estimatedAt, _this.estimatedAt) || other.estimatedAt == _this.estimatedAt)&&(identical(other.landedAt, _this.landedAt) || other.landedAt == _this.landedAt)&&(identical(other.landedSource, _this.landedSource) || other.landedSource == _this.landedSource)&&(identical(other.terminal, _this.terminal) || other.terminal == _this.terminal)&&(identical(other.gate, _this.gate) || other.gate == _this.gate)&&(identical(other.checkedAt, _this.checkedAt) || other.checkedAt == _this.checkedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FlightViewModel;
  return Object.hash(runtimeType,_this.number,_this.status,_this.scheduledAt,_this.estimatedAt,_this.landedAt,_this.landedSource,_this.terminal,_this.gate,_this.checkedAt);
}

@override
String toString() {
  final _this = this as FlightViewModel;
  return 'FlightViewModel(number: ${_this.number}, status: ${_this.status}, scheduledAt: ${_this.scheduledAt}, estimatedAt: ${_this.estimatedAt}, landedAt: ${_this.landedAt}, landedSource: ${_this.landedSource}, terminal: ${_this.terminal}, gate: ${_this.gate}, checkedAt: ${_this.checkedAt})';
}


}

/// @nodoc
abstract mixin class $FlightViewModelCopyWith<$Res>  {
  factory $FlightViewModelCopyWith(FlightViewModel value, $Res Function(FlightViewModel) _then) = _$FlightViewModelCopyWithImpl;
@useResult
$Res call({
 String? number, String? status, DateTime? scheduledAt, DateTime? estimatedAt, DateTime? landedAt, String? landedSource, String? terminal, String? gate, DateTime? checkedAt
});




}
/// @nodoc
class _$FlightViewModelCopyWithImpl<$Res>
    implements $FlightViewModelCopyWith<$Res> {
  _$FlightViewModelCopyWithImpl(this._self, this._then);

  final FlightViewModel _self;
  final $Res Function(FlightViewModel) _then;

/// Create a copy of FlightViewModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? number = freezed,Object? status = freezed,Object? scheduledAt = freezed,Object? estimatedAt = freezed,Object? landedAt = freezed,Object? landedSource = freezed,Object? terminal = freezed,Object? gate = freezed,Object? checkedAt = freezed,}) {
  return _then(FlightViewModel(
number: freezed == number ? _self.number : number // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: freezed == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,estimatedAt: freezed == estimatedAt ? _self.estimatedAt : estimatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,landedAt: freezed == landedAt ? _self.landedAt : landedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,landedSource: freezed == landedSource ? _self.landedSource : landedSource // ignore: cast_nullable_to_non_nullable
as String?,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,gate: freezed == gate ? _self.gate : gate // ignore: cast_nullable_to_non_nullable
as String?,checkedAt: freezed == checkedAt ? _self.checkedAt : checkedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [FlightViewModel].
extension FlightViewModelPatterns on FlightViewModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FlightViewModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FlightViewModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FlightViewModel value)  $default,){
final _that = this;
switch (_that) {
case _FlightViewModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FlightViewModel value)?  $default,){
final _that = this;
switch (_that) {
case _FlightViewModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? number,  String? status,  DateTime? scheduledAt,  DateTime? estimatedAt,  DateTime? landedAt,  String? landedSource,  String? terminal,  String? gate,  DateTime? checkedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FlightViewModel() when $default != null:
return $default(_that.number,_that.status,_that.scheduledAt,_that.estimatedAt,_that.landedAt,_that.landedSource,_that.terminal,_that.gate,_that.checkedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? number,  String? status,  DateTime? scheduledAt,  DateTime? estimatedAt,  DateTime? landedAt,  String? landedSource,  String? terminal,  String? gate,  DateTime? checkedAt)  $default,) {final _that = this;
switch (_that) {
case _FlightViewModel():
return $default(_that.number,_that.status,_that.scheduledAt,_that.estimatedAt,_that.landedAt,_that.landedSource,_that.terminal,_that.gate,_that.checkedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? number,  String? status,  DateTime? scheduledAt,  DateTime? estimatedAt,  DateTime? landedAt,  String? landedSource,  String? terminal,  String? gate,  DateTime? checkedAt)?  $default,) {final _that = this;
switch (_that) {
case _FlightViewModel() when $default != null:
return $default(_that.number,_that.status,_that.scheduledAt,_that.estimatedAt,_that.landedAt,_that.landedSource,_that.terminal,_that.gate,_that.checkedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FlightViewModel extends FlightViewModel {
  const _FlightViewModel({this.number, this.status, this.scheduledAt, this.estimatedAt, this.landedAt, this.landedSource, this.terminal, this.gate, this.checkedAt}): super._();
  factory _FlightViewModel.fromJson(Map<String, dynamic> json) => _$FlightViewModelFromJson(json);

@override final  String? number;
/// scheduled, delayed, departed, landed, cancelled, diverted, unknown; null: not looked up yet.
@override final  String? status;
@override final  DateTime? scheduledAt;
@override final  DateTime? estimatedAt;
@override final  DateTime? landedAt;
/// tracking (the flight API) or traveller ("J'ai atterri").
@override final  String? landedSource;
@override final  String? terminal;
@override final  String? gate;
@override final  DateTime? checkedAt;

/// Create a copy of FlightViewModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FlightViewModelCopyWith<_FlightViewModel> get copyWith => __$FlightViewModelCopyWithImpl<_FlightViewModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FlightViewModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FlightViewModel&&(identical(other.number, number) || other.number == number)&&(identical(other.status, status) || other.status == status)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.estimatedAt, estimatedAt) || other.estimatedAt == estimatedAt)&&(identical(other.landedAt, landedAt) || other.landedAt == landedAt)&&(identical(other.landedSource, landedSource) || other.landedSource == landedSource)&&(identical(other.terminal, terminal) || other.terminal == terminal)&&(identical(other.gate, gate) || other.gate == gate)&&(identical(other.checkedAt, checkedAt) || other.checkedAt == checkedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,number,status,scheduledAt,estimatedAt,landedAt,landedSource,terminal,gate,checkedAt);
}

@override
String toString() {
    return 'FlightViewModel(number: $number, status: $status, scheduledAt: $scheduledAt, estimatedAt: $estimatedAt, landedAt: $landedAt, landedSource: $landedSource, terminal: $terminal, gate: $gate, checkedAt: $checkedAt)';
}


}

/// @nodoc
abstract mixin class _$FlightViewModelCopyWith<$Res> implements $FlightViewModelCopyWith<$Res> {
  factory _$FlightViewModelCopyWith(_FlightViewModel value, $Res Function(_FlightViewModel) _then) = __$FlightViewModelCopyWithImpl;
@override @useResult
$Res call({
 String? number, String? status, DateTime? scheduledAt, DateTime? estimatedAt, DateTime? landedAt, String? landedSource, String? terminal, String? gate, DateTime? checkedAt
});




}
/// @nodoc
class __$FlightViewModelCopyWithImpl<$Res>
    implements _$FlightViewModelCopyWith<$Res> {
  __$FlightViewModelCopyWithImpl(this._self, this._then);

  final _FlightViewModel _self;
  final $Res Function(_FlightViewModel) _then;

/// Create a copy of FlightViewModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? number = freezed,Object? status = freezed,Object? scheduledAt = freezed,Object? estimatedAt = freezed,Object? landedAt = freezed,Object? landedSource = freezed,Object? terminal = freezed,Object? gate = freezed,Object? checkedAt = freezed,}) {
  return _then(_FlightViewModel(
number: freezed == number ? _self.number : number // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,scheduledAt: freezed == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,estimatedAt: freezed == estimatedAt ? _self.estimatedAt : estimatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,landedAt: freezed == landedAt ? _self.landedAt : landedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,landedSource: freezed == landedSource ? _self.landedSource : landedSource // ignore: cast_nullable_to_non_nullable
as String?,terminal: freezed == terminal ? _self.terminal : terminal // ignore: cast_nullable_to_non_nullable
as String?,gate: freezed == gate ? _self.gate : gate // ignore: cast_nullable_to_non_nullable
as String?,checkedAt: freezed == checkedAt ? _self.checkedAt : checkedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$TripVehicleModel {

 String? get model; String? get colour; String? get plate;
/// Create a copy of TripVehicleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<TripVehicleModel> get copyWith => _$TripVehicleModelCopyWithImpl<TripVehicleModel>(this as TripVehicleModel, _$identity);

  /// Serializes this TripVehicleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TripVehicleModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TripVehicleModel&&(identical(other.model, _this.model) || other.model == _this.model)&&(identical(other.colour, _this.colour) || other.colour == _this.colour)&&(identical(other.plate, _this.plate) || other.plate == _this.plate));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TripVehicleModel;
  return Object.hash(runtimeType,_this.model,_this.colour,_this.plate);
}

@override
String toString() {
  final _this = this as TripVehicleModel;
  return 'TripVehicleModel(model: ${_this.model}, colour: ${_this.colour}, plate: ${_this.plate})';
}


}

/// @nodoc
abstract mixin class $TripVehicleModelCopyWith<$Res>  {
  factory $TripVehicleModelCopyWith(TripVehicleModel value, $Res Function(TripVehicleModel) _then) = _$TripVehicleModelCopyWithImpl;
@useResult
$Res call({
 String? model, String? colour, String? plate
});




}
/// @nodoc
class _$TripVehicleModelCopyWithImpl<$Res>
    implements $TripVehicleModelCopyWith<$Res> {
  _$TripVehicleModelCopyWithImpl(this._self, this._then);

  final TripVehicleModel _self;
  final $Res Function(TripVehicleModel) _then;

/// Create a copy of TripVehicleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? model = freezed,Object? colour = freezed,Object? plate = freezed,}) {
  return _then(TripVehicleModel(
model: freezed == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String?,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [TripVehicleModel].
extension TripVehicleModelPatterns on TripVehicleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TripVehicleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TripVehicleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TripVehicleModel value)  $default,){
final _that = this;
switch (_that) {
case _TripVehicleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TripVehicleModel value)?  $default,){
final _that = this;
switch (_that) {
case _TripVehicleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? model,  String? colour,  String? plate)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TripVehicleModel() when $default != null:
return $default(_that.model,_that.colour,_that.plate);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? model,  String? colour,  String? plate)  $default,) {final _that = this;
switch (_that) {
case _TripVehicleModel():
return $default(_that.model,_that.colour,_that.plate);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? model,  String? colour,  String? plate)?  $default,) {final _that = this;
switch (_that) {
case _TripVehicleModel() when $default != null:
return $default(_that.model,_that.colour,_that.plate);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TripVehicleModel implements TripVehicleModel {
  const _TripVehicleModel({this.model, this.colour, this.plate});
  factory _TripVehicleModel.fromJson(Map<String, dynamic> json) => _$TripVehicleModelFromJson(json);

@override final  String? model;
@override final  String? colour;
@override final  String? plate;

/// Create a copy of TripVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TripVehicleModelCopyWith<_TripVehicleModel> get copyWith => __$TripVehicleModelCopyWithImpl<_TripVehicleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TripVehicleModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TripVehicleModel&&(identical(other.model, model) || other.model == model)&&(identical(other.colour, colour) || other.colour == colour)&&(identical(other.plate, plate) || other.plate == plate));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,model,colour,plate);
}

@override
String toString() {
    return 'TripVehicleModel(model: $model, colour: $colour, plate: $plate)';
}


}

/// @nodoc
abstract mixin class _$TripVehicleModelCopyWith<$Res> implements $TripVehicleModelCopyWith<$Res> {
  factory _$TripVehicleModelCopyWith(_TripVehicleModel value, $Res Function(_TripVehicleModel) _then) = __$TripVehicleModelCopyWithImpl;
@override @useResult
$Res call({
 String? model, String? colour, String? plate
});




}
/// @nodoc
class __$TripVehicleModelCopyWithImpl<$Res>
    implements _$TripVehicleModelCopyWith<$Res> {
  __$TripVehicleModelCopyWithImpl(this._self, this._then);

  final _TripVehicleModel _self;
  final $Res Function(_TripVehicleModel) _then;

/// Create a copy of TripVehicleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? model = freezed,Object? colour = freezed,Object? plate = freezed,}) {
  return _then(_TripVehicleModel(
model: freezed == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String?,colour: freezed == colour ? _self.colour : colour // ignore: cast_nullable_to_non_nullable
as String?,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ShuttlePositionModel {

 double get lat; double get lng;
/// Create a copy of ShuttlePositionModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<ShuttlePositionModel> get copyWith => _$ShuttlePositionModelCopyWithImpl<ShuttlePositionModel>(this as ShuttlePositionModel, _$identity);

  /// Serializes this ShuttlePositionModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttlePositionModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttlePositionModel&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttlePositionModel;
  return Object.hash(runtimeType,_this.lat,_this.lng);
}

@override
String toString() {
  final _this = this as ShuttlePositionModel;
  return 'ShuttlePositionModel(lat: ${_this.lat}, lng: ${_this.lng})';
}


}

/// @nodoc
abstract mixin class $ShuttlePositionModelCopyWith<$Res>  {
  factory $ShuttlePositionModelCopyWith(ShuttlePositionModel value, $Res Function(ShuttlePositionModel) _then) = _$ShuttlePositionModelCopyWithImpl;
@useResult
$Res call({
 double lat, double lng
});




}
/// @nodoc
class _$ShuttlePositionModelCopyWithImpl<$Res>
    implements $ShuttlePositionModelCopyWith<$Res> {
  _$ShuttlePositionModelCopyWithImpl(this._self, this._then);

  final ShuttlePositionModel _self;
  final $Res Function(ShuttlePositionModel) _then;

/// Create a copy of ShuttlePositionModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? lat = null,Object? lng = null,}) {
  return _then(ShuttlePositionModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [ShuttlePositionModel].
extension ShuttlePositionModelPatterns on ShuttlePositionModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttlePositionModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttlePositionModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttlePositionModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttlePositionModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttlePositionModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttlePositionModel() when $default != null:
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
case _ShuttlePositionModel() when $default != null:
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
case _ShuttlePositionModel():
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
case _ShuttlePositionModel() when $default != null:
return $default(_that.lat,_that.lng);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttlePositionModel implements ShuttlePositionModel {
  const _ShuttlePositionModel({required this.lat, required this.lng});
  factory _ShuttlePositionModel.fromJson(Map<String, dynamic> json) => _$ShuttlePositionModelFromJson(json);

@override final  double lat;
@override final  double lng;

/// Create a copy of ShuttlePositionModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttlePositionModelCopyWith<_ShuttlePositionModel> get copyWith => __$ShuttlePositionModelCopyWithImpl<_ShuttlePositionModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttlePositionModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttlePositionModel&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,lat,lng);
}

@override
String toString() {
    return 'ShuttlePositionModel(lat: $lat, lng: $lng)';
}


}

/// @nodoc
abstract mixin class _$ShuttlePositionModelCopyWith<$Res> implements $ShuttlePositionModelCopyWith<$Res> {
  factory _$ShuttlePositionModelCopyWith(_ShuttlePositionModel value, $Res Function(_ShuttlePositionModel) _then) = __$ShuttlePositionModelCopyWithImpl;
@override @useResult
$Res call({
 double lat, double lng
});




}
/// @nodoc
class __$ShuttlePositionModelCopyWithImpl<$Res>
    implements _$ShuttlePositionModelCopyWith<$Res> {
  __$ShuttlePositionModelCopyWithImpl(this._self, this._then);

  final _ShuttlePositionModel _self;
  final $Res Function(_ShuttlePositionModel) _then;

/// Create a copy of ShuttlePositionModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? lat = null,Object? lng = null,}) {
  return _then(_ShuttlePositionModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$TravellerShuttleModel {

 String get tripId;/// `pickup`: coming to the airport for returning travellers; `dropoff`: leaving the parking for the terminal.
 String get direction;/// This booking is on the trip.
 bool get mine; DateTime get startedAt; TripVehicleModel get vehicle; String get driverFirstName; ShuttlePositionModel? get position; int? get positionAgeSeconds; int? get distanceM; int? get etaMinutes; DateTime? get etaAt; MeetingPointModel? get meetingPoint; ShuttleDestinationModel? get destination;
/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TravellerShuttleModelCopyWith<TravellerShuttleModel> get copyWith => _$TravellerShuttleModelCopyWithImpl<TravellerShuttleModel>(this as TravellerShuttleModel, _$identity);

  /// Serializes this TravellerShuttleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TravellerShuttleModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TravellerShuttleModel&&(identical(other.tripId, _this.tripId) || other.tripId == _this.tripId)&&(identical(other.direction, _this.direction) || other.direction == _this.direction)&&(identical(other.mine, _this.mine) || other.mine == _this.mine)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.driverFirstName, _this.driverFirstName) || other.driverFirstName == _this.driverFirstName)&&(identical(other.position, _this.position) || other.position == _this.position)&&(identical(other.positionAgeSeconds, _this.positionAgeSeconds) || other.positionAgeSeconds == _this.positionAgeSeconds)&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.etaMinutes, _this.etaMinutes) || other.etaMinutes == _this.etaMinutes)&&(identical(other.etaAt, _this.etaAt) || other.etaAt == _this.etaAt)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint)&&(identical(other.destination, _this.destination) || other.destination == _this.destination));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TravellerShuttleModel;
  return Object.hash(runtimeType,_this.tripId,_this.direction,_this.mine,_this.startedAt,_this.vehicle,_this.driverFirstName,_this.position,_this.positionAgeSeconds,_this.distanceM,_this.etaMinutes,_this.etaAt,_this.meetingPoint,_this.destination);
}

@override
String toString() {
  final _this = this as TravellerShuttleModel;
  return 'TravellerShuttleModel(tripId: ${_this.tripId}, direction: ${_this.direction}, mine: ${_this.mine}, startedAt: ${_this.startedAt}, vehicle: ${_this.vehicle}, driverFirstName: ${_this.driverFirstName}, position: ${_this.position}, positionAgeSeconds: ${_this.positionAgeSeconds}, distanceM: ${_this.distanceM}, etaMinutes: ${_this.etaMinutes}, etaAt: ${_this.etaAt}, meetingPoint: ${_this.meetingPoint}, destination: ${_this.destination})';
}


}

/// @nodoc
abstract mixin class $TravellerShuttleModelCopyWith<$Res>  {
  factory $TravellerShuttleModelCopyWith(TravellerShuttleModel value, $Res Function(TravellerShuttleModel) _then) = _$TravellerShuttleModelCopyWithImpl;
@useResult
$Res call({
 String tripId, String direction, bool mine, DateTime startedAt, TripVehicleModel vehicle, String driverFirstName, ShuttlePositionModel? position, int? positionAgeSeconds, int? distanceM, int? etaMinutes, DateTime? etaAt, MeetingPointModel? meetingPoint, ShuttleDestinationModel? destination
});


$TripVehicleModelCopyWith<$Res> get vehicle;$ShuttlePositionModelCopyWith<$Res>? get position;$MeetingPointModelCopyWith<$Res>? get meetingPoint;$ShuttleDestinationModelCopyWith<$Res>? get destination;

}
/// @nodoc
class _$TravellerShuttleModelCopyWithImpl<$Res>
    implements $TravellerShuttleModelCopyWith<$Res> {
  _$TravellerShuttleModelCopyWithImpl(this._self, this._then);

  final TravellerShuttleModel _self;
  final $Res Function(TravellerShuttleModel) _then;

/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tripId = null,Object? direction = null,Object? mine = null,Object? startedAt = null,Object? vehicle = null,Object? driverFirstName = null,Object? position = freezed,Object? positionAgeSeconds = freezed,Object? distanceM = freezed,Object? etaMinutes = freezed,Object? etaAt = freezed,Object? meetingPoint = freezed,Object? destination = freezed,}) {
  return _then(TravellerShuttleModel(
tripId: null == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,mine: null == mine ? _self.mine : mine // ignore: cast_nullable_to_non_nullable
as bool,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,vehicle: null == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleModel,driverFirstName: null == driverFirstName ? _self.driverFirstName : driverFirstName // ignore: cast_nullable_to_non_nullable
as String,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as ShuttlePositionModel?,positionAgeSeconds: freezed == positionAgeSeconds ? _self.positionAgeSeconds : positionAgeSeconds // ignore: cast_nullable_to_non_nullable
as int?,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,etaMinutes: freezed == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int?,etaAt: freezed == etaAt ? _self.etaAt : etaAt // ignore: cast_nullable_to_non_nullable
as DateTime?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,destination: freezed == destination ? _self.destination : destination // ignore: cast_nullable_to_non_nullable
as ShuttleDestinationModel?,
  ));
}
/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<$Res> get vehicle {
  
  return $TripVehicleModelCopyWith<$Res>(_self.vehicle, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<$Res>? get position {
    if (_self.position == null) {
    return null;
  }

  return $ShuttlePositionModelCopyWith<$Res>(_self.position!, (value) {
    return _then(_self.copyWith(position: value));
  });
}/// Create a copy of TravellerShuttleModel
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
}/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleDestinationModelCopyWith<$Res>? get destination {
    if (_self.destination == null) {
    return null;
  }

  return $ShuttleDestinationModelCopyWith<$Res>(_self.destination!, (value) {
    return _then(_self.copyWith(destination: value));
  });
}
}


/// Adds pattern-matching-related methods to [TravellerShuttleModel].
extension TravellerShuttleModelPatterns on TravellerShuttleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TravellerShuttleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TravellerShuttleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TravellerShuttleModel value)  $default,){
final _that = this;
switch (_that) {
case _TravellerShuttleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TravellerShuttleModel value)?  $default,){
final _that = this;
switch (_that) {
case _TravellerShuttleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String tripId,  String direction,  bool mine,  DateTime startedAt,  TripVehicleModel vehicle,  String driverFirstName,  ShuttlePositionModel? position,  int? positionAgeSeconds,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  MeetingPointModel? meetingPoint,  ShuttleDestinationModel? destination)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TravellerShuttleModel() when $default != null:
return $default(_that.tripId,_that.direction,_that.mine,_that.startedAt,_that.vehicle,_that.driverFirstName,_that.position,_that.positionAgeSeconds,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.meetingPoint,_that.destination);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String tripId,  String direction,  bool mine,  DateTime startedAt,  TripVehicleModel vehicle,  String driverFirstName,  ShuttlePositionModel? position,  int? positionAgeSeconds,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  MeetingPointModel? meetingPoint,  ShuttleDestinationModel? destination)  $default,) {final _that = this;
switch (_that) {
case _TravellerShuttleModel():
return $default(_that.tripId,_that.direction,_that.mine,_that.startedAt,_that.vehicle,_that.driverFirstName,_that.position,_that.positionAgeSeconds,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.meetingPoint,_that.destination);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String tripId,  String direction,  bool mine,  DateTime startedAt,  TripVehicleModel vehicle,  String driverFirstName,  ShuttlePositionModel? position,  int? positionAgeSeconds,  int? distanceM,  int? etaMinutes,  DateTime? etaAt,  MeetingPointModel? meetingPoint,  ShuttleDestinationModel? destination)?  $default,) {final _that = this;
switch (_that) {
case _TravellerShuttleModel() when $default != null:
return $default(_that.tripId,_that.direction,_that.mine,_that.startedAt,_that.vehicle,_that.driverFirstName,_that.position,_that.positionAgeSeconds,_that.distanceM,_that.etaMinutes,_that.etaAt,_that.meetingPoint,_that.destination);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TravellerShuttleModel implements TravellerShuttleModel {
  const _TravellerShuttleModel({required this.tripId, this.direction = 'pickup', this.mine = false, required this.startedAt, this.vehicle = const TripVehicleModel(), this.driverFirstName = '', this.position, this.positionAgeSeconds, this.distanceM, this.etaMinutes, this.etaAt, this.meetingPoint, this.destination});
  factory _TravellerShuttleModel.fromJson(Map<String, dynamic> json) => _$TravellerShuttleModelFromJson(json);

@override final  String tripId;
/// `pickup`: coming to the airport for returning travellers; `dropoff`: leaving the parking for the terminal.
@override@JsonKey() final  String direction;
/// This booking is on the trip.
@override@JsonKey() final  bool mine;
@override final  DateTime startedAt;
@override@JsonKey() final  TripVehicleModel vehicle;
@override@JsonKey() final  String driverFirstName;
@override final  ShuttlePositionModel? position;
@override final  int? positionAgeSeconds;
@override final  int? distanceM;
@override final  int? etaMinutes;
@override final  DateTime? etaAt;
@override final  MeetingPointModel? meetingPoint;
@override final  ShuttleDestinationModel? destination;

/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TravellerShuttleModelCopyWith<_TravellerShuttleModel> get copyWith => __$TravellerShuttleModelCopyWithImpl<_TravellerShuttleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TravellerShuttleModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TravellerShuttleModel&&(identical(other.tripId, tripId) || other.tripId == tripId)&&(identical(other.direction, direction) || other.direction == direction)&&(identical(other.mine, mine) || other.mine == mine)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.driverFirstName, driverFirstName) || other.driverFirstName == driverFirstName)&&(identical(other.position, position) || other.position == position)&&(identical(other.positionAgeSeconds, positionAgeSeconds) || other.positionAgeSeconds == positionAgeSeconds)&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.etaMinutes, etaMinutes) || other.etaMinutes == etaMinutes)&&(identical(other.etaAt, etaAt) || other.etaAt == etaAt)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint)&&(identical(other.destination, destination) || other.destination == destination));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,tripId,direction,mine,startedAt,vehicle,driverFirstName,position,positionAgeSeconds,distanceM,etaMinutes,etaAt,meetingPoint,destination);
}

@override
String toString() {
    return 'TravellerShuttleModel(tripId: $tripId, direction: $direction, mine: $mine, startedAt: $startedAt, vehicle: $vehicle, driverFirstName: $driverFirstName, position: $position, positionAgeSeconds: $positionAgeSeconds, distanceM: $distanceM, etaMinutes: $etaMinutes, etaAt: $etaAt, meetingPoint: $meetingPoint, destination: $destination)';
}


}

/// @nodoc
abstract mixin class _$TravellerShuttleModelCopyWith<$Res> implements $TravellerShuttleModelCopyWith<$Res> {
  factory _$TravellerShuttleModelCopyWith(_TravellerShuttleModel value, $Res Function(_TravellerShuttleModel) _then) = __$TravellerShuttleModelCopyWithImpl;
@override @useResult
$Res call({
 String tripId, String direction, bool mine, DateTime startedAt, TripVehicleModel vehicle, String driverFirstName, ShuttlePositionModel? position, int? positionAgeSeconds, int? distanceM, int? etaMinutes, DateTime? etaAt, MeetingPointModel? meetingPoint, ShuttleDestinationModel? destination
});


@override $TripVehicleModelCopyWith<$Res> get vehicle;@override $ShuttlePositionModelCopyWith<$Res>? get position;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;@override $ShuttleDestinationModelCopyWith<$Res>? get destination;

}
/// @nodoc
class __$TravellerShuttleModelCopyWithImpl<$Res>
    implements _$TravellerShuttleModelCopyWith<$Res> {
  __$TravellerShuttleModelCopyWithImpl(this._self, this._then);

  final _TravellerShuttleModel _self;
  final $Res Function(_TravellerShuttleModel) _then;

/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tripId = null,Object? direction = null,Object? mine = null,Object? startedAt = null,Object? vehicle = null,Object? driverFirstName = null,Object? position = freezed,Object? positionAgeSeconds = freezed,Object? distanceM = freezed,Object? etaMinutes = freezed,Object? etaAt = freezed,Object? meetingPoint = freezed,Object? destination = freezed,}) {
  return _then(_TravellerShuttleModel(
tripId: null == tripId ? _self.tripId : tripId // ignore: cast_nullable_to_non_nullable
as String,direction: null == direction ? _self.direction : direction // ignore: cast_nullable_to_non_nullable
as String,mine: null == mine ? _self.mine : mine // ignore: cast_nullable_to_non_nullable
as bool,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,vehicle: null == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as TripVehicleModel,driverFirstName: null == driverFirstName ? _self.driverFirstName : driverFirstName // ignore: cast_nullable_to_non_nullable
as String,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as ShuttlePositionModel?,positionAgeSeconds: freezed == positionAgeSeconds ? _self.positionAgeSeconds : positionAgeSeconds // ignore: cast_nullable_to_non_nullable
as int?,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,etaMinutes: freezed == etaMinutes ? _self.etaMinutes : etaMinutes // ignore: cast_nullable_to_non_nullable
as int?,etaAt: freezed == etaAt ? _self.etaAt : etaAt // ignore: cast_nullable_to_non_nullable
as DateTime?,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,destination: freezed == destination ? _self.destination : destination // ignore: cast_nullable_to_non_nullable
as ShuttleDestinationModel?,
  ));
}

/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TripVehicleModelCopyWith<$Res> get vehicle {
  
  return $TripVehicleModelCopyWith<$Res>(_self.vehicle, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<$Res>? get position {
    if (_self.position == null) {
    return null;
  }

  return $ShuttlePositionModelCopyWith<$Res>(_self.position!, (value) {
    return _then(_self.copyWith(position: value));
  });
}/// Create a copy of TravellerShuttleModel
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
}/// Create a copy of TravellerShuttleModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttleDestinationModelCopyWith<$Res>? get destination {
    if (_self.destination == null) {
    return null;
  }

  return $ShuttleDestinationModelCopyWith<$Res>(_self.destination!, (value) {
    return _then(_self.copyWith(destination: value));
  });
}
}


/// @nodoc
mixin _$ShuttleDestinationModel {

 String get kind; double get lat; double get lng; String? get label;
/// Create a copy of ShuttleDestinationModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleDestinationModelCopyWith<ShuttleDestinationModel> get copyWith => _$ShuttleDestinationModelCopyWithImpl<ShuttleDestinationModel>(this as ShuttleDestinationModel, _$identity);

  /// Serializes this ShuttleDestinationModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttleDestinationModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleDestinationModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng)&&(identical(other.label, _this.label) || other.label == _this.label));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleDestinationModel;
  return Object.hash(runtimeType,_this.kind,_this.lat,_this.lng,_this.label);
}

@override
String toString() {
  final _this = this as ShuttleDestinationModel;
  return 'ShuttleDestinationModel(kind: ${_this.kind}, lat: ${_this.lat}, lng: ${_this.lng}, label: ${_this.label})';
}


}

/// @nodoc
abstract mixin class $ShuttleDestinationModelCopyWith<$Res>  {
  factory $ShuttleDestinationModelCopyWith(ShuttleDestinationModel value, $Res Function(ShuttleDestinationModel) _then) = _$ShuttleDestinationModelCopyWithImpl;
@useResult
$Res call({
 String kind, double lat, double lng, String? label
});




}
/// @nodoc
class _$ShuttleDestinationModelCopyWithImpl<$Res>
    implements $ShuttleDestinationModelCopyWith<$Res> {
  _$ShuttleDestinationModelCopyWithImpl(this._self, this._then);

  final ShuttleDestinationModel _self;
  final $Res Function(ShuttleDestinationModel) _then;

/// Create a copy of ShuttleDestinationModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? lat = null,Object? lng = null,Object? label = freezed,}) {
  return _then(ShuttleDestinationModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ShuttleDestinationModel].
extension ShuttleDestinationModelPatterns on ShuttleDestinationModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleDestinationModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleDestinationModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleDestinationModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleDestinationModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleDestinationModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleDestinationModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  double lat,  double lng,  String? label)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleDestinationModel() when $default != null:
return $default(_that.kind,_that.lat,_that.lng,_that.label);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  double lat,  double lng,  String? label)  $default,) {final _that = this;
switch (_that) {
case _ShuttleDestinationModel():
return $default(_that.kind,_that.lat,_that.lng,_that.label);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  double lat,  double lng,  String? label)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleDestinationModel() when $default != null:
return $default(_that.kind,_that.lat,_that.lng,_that.label);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleDestinationModel implements ShuttleDestinationModel {
  const _ShuttleDestinationModel({required this.kind, required this.lat, required this.lng, this.label});
  factory _ShuttleDestinationModel.fromJson(Map<String, dynamic> json) => _$ShuttleDestinationModelFromJson(json);

@override final  String kind;
@override final  double lat;
@override final  double lng;
@override final  String? label;

/// Create a copy of ShuttleDestinationModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleDestinationModelCopyWith<_ShuttleDestinationModel> get copyWith => __$ShuttleDestinationModelCopyWithImpl<_ShuttleDestinationModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttleDestinationModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleDestinationModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng)&&(identical(other.label, label) || other.label == label));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,lat,lng,label);
}

@override
String toString() {
    return 'ShuttleDestinationModel(kind: $kind, lat: $lat, lng: $lng, label: $label)';
}


}

/// @nodoc
abstract mixin class _$ShuttleDestinationModelCopyWith<$Res> implements $ShuttleDestinationModelCopyWith<$Res> {
  factory _$ShuttleDestinationModelCopyWith(_ShuttleDestinationModel value, $Res Function(_ShuttleDestinationModel) _then) = __$ShuttleDestinationModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, double lat, double lng, String? label
});




}
/// @nodoc
class __$ShuttleDestinationModelCopyWithImpl<$Res>
    implements _$ShuttleDestinationModelCopyWith<$Res> {
  __$ShuttleDestinationModelCopyWithImpl(this._self, this._then);

  final _ShuttleDestinationModel _self;
  final $Res Function(_ShuttleDestinationModel) _then;

/// Create a copy of ShuttleDestinationModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? lat = null,Object? lng = null,Object? label = freezed,}) {
  return _then(_ShuttleDestinationModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$StayShuttlesModel {

/// `arrival`, `stay`, `return`; null outside the arrival day → return day window.
 String? get phase; DateTime get serverTime; List<TravellerShuttleModel> get shuttles;
/// Create a copy of StayShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StayShuttlesModelCopyWith<StayShuttlesModel> get copyWith => _$StayShuttlesModelCopyWithImpl<StayShuttlesModel>(this as StayShuttlesModel, _$identity);

  /// Serializes this StayShuttlesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as StayShuttlesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StayShuttlesModel&&(identical(other.phase, _this.phase) || other.phase == _this.phase)&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime)&&const DeepCollectionEquality().equals(other.shuttles, _this.shuttles));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StayShuttlesModel;
  return Object.hash(runtimeType,_this.phase,_this.serverTime,const DeepCollectionEquality().hash(_this.shuttles));
}

@override
String toString() {
  final _this = this as StayShuttlesModel;
  return 'StayShuttlesModel(phase: ${_this.phase}, serverTime: ${_this.serverTime}, shuttles: ${_this.shuttles})';
}


}

/// @nodoc
abstract mixin class $StayShuttlesModelCopyWith<$Res>  {
  factory $StayShuttlesModelCopyWith(StayShuttlesModel value, $Res Function(StayShuttlesModel) _then) = _$StayShuttlesModelCopyWithImpl;
@useResult
$Res call({
 String? phase, DateTime serverTime, List<TravellerShuttleModel> shuttles
});




}
/// @nodoc
class _$StayShuttlesModelCopyWithImpl<$Res>
    implements $StayShuttlesModelCopyWith<$Res> {
  _$StayShuttlesModelCopyWithImpl(this._self, this._then);

  final StayShuttlesModel _self;
  final $Res Function(StayShuttlesModel) _then;

/// Create a copy of StayShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? phase = freezed,Object? serverTime = null,Object? shuttles = null,}) {
  return _then(StayShuttlesModel(
phase: freezed == phase ? _self.phase : phase // ignore: cast_nullable_to_non_nullable
as String?,serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,shuttles: null == shuttles ? _self.shuttles : shuttles // ignore: cast_nullable_to_non_nullable
as List<TravellerShuttleModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [StayShuttlesModel].
extension StayShuttlesModelPatterns on StayShuttlesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StayShuttlesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StayShuttlesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StayShuttlesModel value)  $default,){
final _that = this;
switch (_that) {
case _StayShuttlesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StayShuttlesModel value)?  $default,){
final _that = this;
switch (_that) {
case _StayShuttlesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? phase,  DateTime serverTime,  List<TravellerShuttleModel> shuttles)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StayShuttlesModel() when $default != null:
return $default(_that.phase,_that.serverTime,_that.shuttles);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? phase,  DateTime serverTime,  List<TravellerShuttleModel> shuttles)  $default,) {final _that = this;
switch (_that) {
case _StayShuttlesModel():
return $default(_that.phase,_that.serverTime,_that.shuttles);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? phase,  DateTime serverTime,  List<TravellerShuttleModel> shuttles)?  $default,) {final _that = this;
switch (_that) {
case _StayShuttlesModel() when $default != null:
return $default(_that.phase,_that.serverTime,_that.shuttles);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StayShuttlesModel extends StayShuttlesModel {
  const _StayShuttlesModel({this.phase, required this.serverTime,  List<TravellerShuttleModel> shuttles = const []}): _shuttles = shuttles,super._();
  factory _StayShuttlesModel.fromJson(Map<String, dynamic> json) => _$StayShuttlesModelFromJson(json);

/// `arrival`, `stay`, `return`; null outside the arrival day → return day window.
@override final  String? phase;
@override final  DateTime serverTime;
 final  List<TravellerShuttleModel> _shuttles;
@override@JsonKey() List<TravellerShuttleModel> get shuttles {
  if (_shuttles is EqualUnmodifiableListView) return _shuttles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_shuttles);
}


/// Create a copy of StayShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StayShuttlesModelCopyWith<_StayShuttlesModel> get copyWith => __$StayShuttlesModelCopyWithImpl<_StayShuttlesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StayShuttlesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StayShuttlesModel&&(identical(other.phase, phase) || other.phase == phase)&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime)&&const DeepCollectionEquality().equals(other.shuttles, _shuttles));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,phase,serverTime,const DeepCollectionEquality().hash(_shuttles));
}

@override
String toString() {
    return 'StayShuttlesModel(phase: $phase, serverTime: $serverTime, shuttles: $shuttles)';
}


}

/// @nodoc
abstract mixin class _$StayShuttlesModelCopyWith<$Res> implements $StayShuttlesModelCopyWith<$Res> {
  factory _$StayShuttlesModelCopyWith(_StayShuttlesModel value, $Res Function(_StayShuttlesModel) _then) = __$StayShuttlesModelCopyWithImpl;
@override @useResult
$Res call({
 String? phase, DateTime serverTime, List<TravellerShuttleModel> shuttles
});




}
/// @nodoc
class __$StayShuttlesModelCopyWithImpl<$Res>
    implements _$StayShuttlesModelCopyWith<$Res> {
  __$StayShuttlesModelCopyWithImpl(this._self, this._then);

  final _StayShuttlesModel _self;
  final $Res Function(_StayShuttlesModel) _then;

/// Create a copy of StayShuttlesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? phase = freezed,Object? serverTime = null,Object? shuttles = null,}) {
  return _then(_StayShuttlesModel(
phase: freezed == phase ? _self.phase : phase // ignore: cast_nullable_to_non_nullable
as String?,serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,shuttles: null == shuttles ? _self._shuttles : shuttles // ignore: cast_nullable_to_non_nullable
as List<TravellerShuttleModel>,
  ));
}


}


/// @nodoc
mixin _$ReturnParkingModel {

 String get name; String? get phone; int? get shuttleMinutes; String? get address; ShuttlePositionModel? get location;
/// Create a copy of ReturnParkingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReturnParkingModelCopyWith<ReturnParkingModel> get copyWith => _$ReturnParkingModelCopyWithImpl<ReturnParkingModel>(this as ReturnParkingModel, _$identity);

  /// Serializes this ReturnParkingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ReturnParkingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReturnParkingModel&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.shuttleMinutes, _this.shuttleMinutes) || other.shuttleMinutes == _this.shuttleMinutes)&&(identical(other.address, _this.address) || other.address == _this.address)&&(identical(other.location, _this.location) || other.location == _this.location));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ReturnParkingModel;
  return Object.hash(runtimeType,_this.name,_this.phone,_this.shuttleMinutes,_this.address,_this.location);
}

@override
String toString() {
  final _this = this as ReturnParkingModel;
  return 'ReturnParkingModel(name: ${_this.name}, phone: ${_this.phone}, shuttleMinutes: ${_this.shuttleMinutes}, address: ${_this.address}, location: ${_this.location})';
}


}

/// @nodoc
abstract mixin class $ReturnParkingModelCopyWith<$Res>  {
  factory $ReturnParkingModelCopyWith(ReturnParkingModel value, $Res Function(ReturnParkingModel) _then) = _$ReturnParkingModelCopyWithImpl;
@useResult
$Res call({
 String name, String? phone, int? shuttleMinutes, String? address, ShuttlePositionModel? location
});


$ShuttlePositionModelCopyWith<$Res>? get location;

}
/// @nodoc
class _$ReturnParkingModelCopyWithImpl<$Res>
    implements $ReturnParkingModelCopyWith<$Res> {
  _$ReturnParkingModelCopyWithImpl(this._self, this._then);

  final ReturnParkingModel _self;
  final $Res Function(ReturnParkingModel) _then;

/// Create a copy of ReturnParkingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? phone = freezed,Object? shuttleMinutes = freezed,Object? address = freezed,Object? location = freezed,}) {
  return _then(ReturnParkingModel(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as ShuttlePositionModel?,
  ));
}
/// Create a copy of ReturnParkingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $ShuttlePositionModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}
}


/// Adds pattern-matching-related methods to [ReturnParkingModel].
extension ReturnParkingModelPatterns on ReturnParkingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReturnParkingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReturnParkingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReturnParkingModel value)  $default,){
final _that = this;
switch (_that) {
case _ReturnParkingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReturnParkingModel value)?  $default,){
final _that = this;
switch (_that) {
case _ReturnParkingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  String? phone,  int? shuttleMinutes,  String? address,  ShuttlePositionModel? location)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReturnParkingModel() when $default != null:
return $default(_that.name,_that.phone,_that.shuttleMinutes,_that.address,_that.location);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  String? phone,  int? shuttleMinutes,  String? address,  ShuttlePositionModel? location)  $default,) {final _that = this;
switch (_that) {
case _ReturnParkingModel():
return $default(_that.name,_that.phone,_that.shuttleMinutes,_that.address,_that.location);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  String? phone,  int? shuttleMinutes,  String? address,  ShuttlePositionModel? location)?  $default,) {final _that = this;
switch (_that) {
case _ReturnParkingModel() when $default != null:
return $default(_that.name,_that.phone,_that.shuttleMinutes,_that.address,_that.location);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReturnParkingModel implements ReturnParkingModel {
  const _ReturnParkingModel({required this.name, this.phone, this.shuttleMinutes, this.address, this.location});
  factory _ReturnParkingModel.fromJson(Map<String, dynamic> json) => _$ReturnParkingModelFromJson(json);

@override final  String name;
@override final  String? phone;
@override final  int? shuttleMinutes;
@override final  String? address;
@override final  ShuttlePositionModel? location;

/// Create a copy of ReturnParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReturnParkingModelCopyWith<_ReturnParkingModel> get copyWith => __$ReturnParkingModelCopyWithImpl<_ReturnParkingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReturnParkingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReturnParkingModel&&(identical(other.name, name) || other.name == name)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.shuttleMinutes, shuttleMinutes) || other.shuttleMinutes == shuttleMinutes)&&(identical(other.address, address) || other.address == address)&&(identical(other.location, location) || other.location == location));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,name,phone,shuttleMinutes,address,location);
}

@override
String toString() {
    return 'ReturnParkingModel(name: $name, phone: $phone, shuttleMinutes: $shuttleMinutes, address: $address, location: $location)';
}


}

/// @nodoc
abstract mixin class _$ReturnParkingModelCopyWith<$Res> implements $ReturnParkingModelCopyWith<$Res> {
  factory _$ReturnParkingModelCopyWith(_ReturnParkingModel value, $Res Function(_ReturnParkingModel) _then) = __$ReturnParkingModelCopyWithImpl;
@override @useResult
$Res call({
 String name, String? phone, int? shuttleMinutes, String? address, ShuttlePositionModel? location
});


@override $ShuttlePositionModelCopyWith<$Res>? get location;

}
/// @nodoc
class __$ReturnParkingModelCopyWithImpl<$Res>
    implements _$ReturnParkingModelCopyWith<$Res> {
  __$ReturnParkingModelCopyWithImpl(this._self, this._then);

  final _ReturnParkingModel _self;
  final $Res Function(_ReturnParkingModel) _then;

/// Create a copy of ReturnParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? phone = freezed,Object? shuttleMinutes = freezed,Object? address = freezed,Object? location = freezed,}) {
  return _then(_ReturnParkingModel(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,shuttleMinutes: freezed == shuttleMinutes ? _self.shuttleMinutes : shuttleMinutes // ignore: cast_nullable_to_non_nullable
as int?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as ShuttlePositionModel?,
  ));
}

/// Create a copy of ReturnParkingModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ShuttlePositionModelCopyWith<$Res>? get location {
    if (_self.location == null) {
    return null;
  }

  return $ShuttlePositionModelCopyWith<$Res>(_self.location!, (value) {
    return _then(_self.copyWith(location: value));
  });
}
}


/// @nodoc
mixin _$TravellerReturnModel {

 String get reference; String get status; String get returnAt; bool get returnDay; FlightViewModel get flight; bool get flightTracked; MeetingPointModel? get meetingPoint; DateTime? get atMeetingPointAt; TravellerShuttleModel? get shuttle; ReturnParkingModel get parking; String get plate;/// The spot the valet placed the vehicle on (bloc 2), for "Retrouver ma voiture"; null until placed.
 ReturnSpotModel? get spot;
/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TravellerReturnModelCopyWith<TravellerReturnModel> get copyWith => _$TravellerReturnModelCopyWithImpl<TravellerReturnModel>(this as TravellerReturnModel, _$identity);

  /// Serializes this TravellerReturnModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TravellerReturnModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TravellerReturnModel&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.returnDay, _this.returnDay) || other.returnDay == _this.returnDay)&&(identical(other.flight, _this.flight) || other.flight == _this.flight)&&(identical(other.flightTracked, _this.flightTracked) || other.flightTracked == _this.flightTracked)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint)&&(identical(other.atMeetingPointAt, _this.atMeetingPointAt) || other.atMeetingPointAt == _this.atMeetingPointAt)&&(identical(other.shuttle, _this.shuttle) || other.shuttle == _this.shuttle)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.spot, _this.spot) || other.spot == _this.spot));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TravellerReturnModel;
  return Object.hash(runtimeType,_this.reference,_this.status,_this.returnAt,_this.returnDay,_this.flight,_this.flightTracked,_this.meetingPoint,_this.atMeetingPointAt,_this.shuttle,_this.parking,_this.plate,_this.spot);
}

@override
String toString() {
  final _this = this as TravellerReturnModel;
  return 'TravellerReturnModel(reference: ${_this.reference}, status: ${_this.status}, returnAt: ${_this.returnAt}, returnDay: ${_this.returnDay}, flight: ${_this.flight}, flightTracked: ${_this.flightTracked}, meetingPoint: ${_this.meetingPoint}, atMeetingPointAt: ${_this.atMeetingPointAt}, shuttle: ${_this.shuttle}, parking: ${_this.parking}, plate: ${_this.plate}, spot: ${_this.spot})';
}


}

/// @nodoc
abstract mixin class $TravellerReturnModelCopyWith<$Res>  {
  factory $TravellerReturnModelCopyWith(TravellerReturnModel value, $Res Function(TravellerReturnModel) _then) = _$TravellerReturnModelCopyWithImpl;
@useResult
$Res call({
 String reference, String status, String returnAt, bool returnDay, FlightViewModel flight, bool flightTracked, MeetingPointModel? meetingPoint, DateTime? atMeetingPointAt, TravellerShuttleModel? shuttle, ReturnParkingModel parking, String plate, ReturnSpotModel? spot
});


$FlightViewModelCopyWith<$Res> get flight;$MeetingPointModelCopyWith<$Res>? get meetingPoint;$TravellerShuttleModelCopyWith<$Res>? get shuttle;$ReturnParkingModelCopyWith<$Res> get parking;$ReturnSpotModelCopyWith<$Res>? get spot;

}
/// @nodoc
class _$TravellerReturnModelCopyWithImpl<$Res>
    implements $TravellerReturnModelCopyWith<$Res> {
  _$TravellerReturnModelCopyWithImpl(this._self, this._then);

  final TravellerReturnModel _self;
  final $Res Function(TravellerReturnModel) _then;

/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? status = null,Object? returnAt = null,Object? returnDay = null,Object? flight = null,Object? flightTracked = null,Object? meetingPoint = freezed,Object? atMeetingPointAt = freezed,Object? shuttle = freezed,Object? parking = null,Object? plate = null,Object? spot = freezed,}) {
  return _then(TravellerReturnModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,returnDay: null == returnDay ? _self.returnDay : returnDay // ignore: cast_nullable_to_non_nullable
as bool,flight: null == flight ? _self.flight : flight // ignore: cast_nullable_to_non_nullable
as FlightViewModel,flightTracked: null == flightTracked ? _self.flightTracked : flightTracked // ignore: cast_nullable_to_non_nullable
as bool,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,shuttle: freezed == shuttle ? _self.shuttle : shuttle // ignore: cast_nullable_to_non_nullable
as TravellerShuttleModel?,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ReturnParkingModel,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as ReturnSpotModel?,
  ));
}
/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FlightViewModelCopyWith<$Res> get flight {
  
  return $FlightViewModelCopyWith<$Res>(_self.flight, (value) {
    return _then(_self.copyWith(flight: value));
  });
}/// Create a copy of TravellerReturnModel
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
}/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerShuttleModelCopyWith<$Res>? get shuttle {
    if (_self.shuttle == null) {
    return null;
  }

  return $TravellerShuttleModelCopyWith<$Res>(_self.shuttle!, (value) {
    return _then(_self.copyWith(shuttle: value));
  });
}/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReturnParkingModelCopyWith<$Res> get parking {
  
  return $ReturnParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReturnSpotModelCopyWith<$Res>? get spot {
    if (_self.spot == null) {
    return null;
  }

  return $ReturnSpotModelCopyWith<$Res>(_self.spot!, (value) {
    return _then(_self.copyWith(spot: value));
  });
}
}


/// Adds pattern-matching-related methods to [TravellerReturnModel].
extension TravellerReturnModelPatterns on TravellerReturnModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TravellerReturnModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TravellerReturnModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TravellerReturnModel value)  $default,){
final _that = this;
switch (_that) {
case _TravellerReturnModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TravellerReturnModel value)?  $default,){
final _that = this;
switch (_that) {
case _TravellerReturnModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  String status,  String returnAt,  bool returnDay,  FlightViewModel flight,  bool flightTracked,  MeetingPointModel? meetingPoint,  DateTime? atMeetingPointAt,  TravellerShuttleModel? shuttle,  ReturnParkingModel parking,  String plate,  ReturnSpotModel? spot)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TravellerReturnModel() when $default != null:
return $default(_that.reference,_that.status,_that.returnAt,_that.returnDay,_that.flight,_that.flightTracked,_that.meetingPoint,_that.atMeetingPointAt,_that.shuttle,_that.parking,_that.plate,_that.spot);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  String status,  String returnAt,  bool returnDay,  FlightViewModel flight,  bool flightTracked,  MeetingPointModel? meetingPoint,  DateTime? atMeetingPointAt,  TravellerShuttleModel? shuttle,  ReturnParkingModel parking,  String plate,  ReturnSpotModel? spot)  $default,) {final _that = this;
switch (_that) {
case _TravellerReturnModel():
return $default(_that.reference,_that.status,_that.returnAt,_that.returnDay,_that.flight,_that.flightTracked,_that.meetingPoint,_that.atMeetingPointAt,_that.shuttle,_that.parking,_that.plate,_that.spot);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  String status,  String returnAt,  bool returnDay,  FlightViewModel flight,  bool flightTracked,  MeetingPointModel? meetingPoint,  DateTime? atMeetingPointAt,  TravellerShuttleModel? shuttle,  ReturnParkingModel parking,  String plate,  ReturnSpotModel? spot)?  $default,) {final _that = this;
switch (_that) {
case _TravellerReturnModel() when $default != null:
return $default(_that.reference,_that.status,_that.returnAt,_that.returnDay,_that.flight,_that.flightTracked,_that.meetingPoint,_that.atMeetingPointAt,_that.shuttle,_that.parking,_that.plate,_that.spot);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TravellerReturnModel extends TravellerReturnModel {
  const _TravellerReturnModel({required this.reference, required this.status, required this.returnAt, this.returnDay = false, this.flight = const FlightViewModel(), this.flightTracked = false, this.meetingPoint, this.atMeetingPointAt, this.shuttle, required this.parking, required this.plate, this.spot}): super._();
  factory _TravellerReturnModel.fromJson(Map<String, dynamic> json) => _$TravellerReturnModelFromJson(json);

@override final  String reference;
@override final  String status;
@override final  String returnAt;
@override@JsonKey() final  bool returnDay;
@override@JsonKey() final  FlightViewModel flight;
@override@JsonKey() final  bool flightTracked;
@override final  MeetingPointModel? meetingPoint;
@override final  DateTime? atMeetingPointAt;
@override final  TravellerShuttleModel? shuttle;
@override final  ReturnParkingModel parking;
@override final  String plate;
/// The spot the valet placed the vehicle on (bloc 2), for "Retrouver ma voiture"; null until placed.
@override final  ReturnSpotModel? spot;

/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TravellerReturnModelCopyWith<_TravellerReturnModel> get copyWith => __$TravellerReturnModelCopyWithImpl<_TravellerReturnModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TravellerReturnModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TravellerReturnModel&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.status, status) || other.status == status)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.returnDay, returnDay) || other.returnDay == returnDay)&&(identical(other.flight, flight) || other.flight == flight)&&(identical(other.flightTracked, flightTracked) || other.flightTracked == flightTracked)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint)&&(identical(other.atMeetingPointAt, atMeetingPointAt) || other.atMeetingPointAt == atMeetingPointAt)&&(identical(other.shuttle, shuttle) || other.shuttle == shuttle)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.spot, spot) || other.spot == spot));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reference,status,returnAt,returnDay,flight,flightTracked,meetingPoint,atMeetingPointAt,shuttle,parking,plate,spot);
}

@override
String toString() {
    return 'TravellerReturnModel(reference: $reference, status: $status, returnAt: $returnAt, returnDay: $returnDay, flight: $flight, flightTracked: $flightTracked, meetingPoint: $meetingPoint, atMeetingPointAt: $atMeetingPointAt, shuttle: $shuttle, parking: $parking, plate: $plate, spot: $spot)';
}


}

/// @nodoc
abstract mixin class _$TravellerReturnModelCopyWith<$Res> implements $TravellerReturnModelCopyWith<$Res> {
  factory _$TravellerReturnModelCopyWith(_TravellerReturnModel value, $Res Function(_TravellerReturnModel) _then) = __$TravellerReturnModelCopyWithImpl;
@override @useResult
$Res call({
 String reference, String status, String returnAt, bool returnDay, FlightViewModel flight, bool flightTracked, MeetingPointModel? meetingPoint, DateTime? atMeetingPointAt, TravellerShuttleModel? shuttle, ReturnParkingModel parking, String plate, ReturnSpotModel? spot
});


@override $FlightViewModelCopyWith<$Res> get flight;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;@override $TravellerShuttleModelCopyWith<$Res>? get shuttle;@override $ReturnParkingModelCopyWith<$Res> get parking;@override $ReturnSpotModelCopyWith<$Res>? get spot;

}
/// @nodoc
class __$TravellerReturnModelCopyWithImpl<$Res>
    implements _$TravellerReturnModelCopyWith<$Res> {
  __$TravellerReturnModelCopyWithImpl(this._self, this._then);

  final _TravellerReturnModel _self;
  final $Res Function(_TravellerReturnModel) _then;

/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? status = null,Object? returnAt = null,Object? returnDay = null,Object? flight = null,Object? flightTracked = null,Object? meetingPoint = freezed,Object? atMeetingPointAt = freezed,Object? shuttle = freezed,Object? parking = null,Object? plate = null,Object? spot = freezed,}) {
  return _then(_TravellerReturnModel(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,returnDay: null == returnDay ? _self.returnDay : returnDay // ignore: cast_nullable_to_non_nullable
as bool,flight: null == flight ? _self.flight : flight // ignore: cast_nullable_to_non_nullable
as FlightViewModel,flightTracked: null == flightTracked ? _self.flightTracked : flightTracked // ignore: cast_nullable_to_non_nullable
as bool,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,atMeetingPointAt: freezed == atMeetingPointAt ? _self.atMeetingPointAt : atMeetingPointAt // ignore: cast_nullable_to_non_nullable
as DateTime?,shuttle: freezed == shuttle ? _self.shuttle : shuttle // ignore: cast_nullable_to_non_nullable
as TravellerShuttleModel?,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ReturnParkingModel,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as ReturnSpotModel?,
  ));
}

/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FlightViewModelCopyWith<$Res> get flight {
  
  return $FlightViewModelCopyWith<$Res>(_self.flight, (value) {
    return _then(_self.copyWith(flight: value));
  });
}/// Create a copy of TravellerReturnModel
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
}/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerShuttleModelCopyWith<$Res>? get shuttle {
    if (_self.shuttle == null) {
    return null;
  }

  return $TravellerShuttleModelCopyWith<$Res>(_self.shuttle!, (value) {
    return _then(_self.copyWith(shuttle: value));
  });
}/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReturnParkingModelCopyWith<$Res> get parking {
  
  return $ReturnParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of TravellerReturnModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReturnSpotModelCopyWith<$Res>? get spot {
    if (_self.spot == null) {
    return null;
  }

  return $ReturnSpotModelCopyWith<$Res>(_self.spot!, (value) {
    return _then(_self.copyWith(spot: value));
  });
}
}


/// @nodoc
mixin _$ReturnSpotModel {

 String get code; String? get stayClass;
/// Create a copy of ReturnSpotModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReturnSpotModelCopyWith<ReturnSpotModel> get copyWith => _$ReturnSpotModelCopyWithImpl<ReturnSpotModel>(this as ReturnSpotModel, _$identity);

  /// Serializes this ReturnSpotModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ReturnSpotModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReturnSpotModel&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ReturnSpotModel;
  return Object.hash(runtimeType,_this.code,_this.stayClass);
}

@override
String toString() {
  final _this = this as ReturnSpotModel;
  return 'ReturnSpotModel(code: ${_this.code}, stayClass: ${_this.stayClass})';
}


}

/// @nodoc
abstract mixin class $ReturnSpotModelCopyWith<$Res>  {
  factory $ReturnSpotModelCopyWith(ReturnSpotModel value, $Res Function(ReturnSpotModel) _then) = _$ReturnSpotModelCopyWithImpl;
@useResult
$Res call({
 String code, String? stayClass
});




}
/// @nodoc
class _$ReturnSpotModelCopyWithImpl<$Res>
    implements $ReturnSpotModelCopyWith<$Res> {
  _$ReturnSpotModelCopyWithImpl(this._self, this._then);

  final ReturnSpotModel _self;
  final $Res Function(ReturnSpotModel) _then;

/// Create a copy of ReturnSpotModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? code = null,Object? stayClass = freezed,}) {
  return _then(ReturnSpotModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ReturnSpotModel].
extension ReturnSpotModelPatterns on ReturnSpotModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReturnSpotModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReturnSpotModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReturnSpotModel value)  $default,){
final _that = this;
switch (_that) {
case _ReturnSpotModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReturnSpotModel value)?  $default,){
final _that = this;
switch (_that) {
case _ReturnSpotModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String code,  String? stayClass)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReturnSpotModel() when $default != null:
return $default(_that.code,_that.stayClass);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String code,  String? stayClass)  $default,) {final _that = this;
switch (_that) {
case _ReturnSpotModel():
return $default(_that.code,_that.stayClass);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String code,  String? stayClass)?  $default,) {final _that = this;
switch (_that) {
case _ReturnSpotModel() when $default != null:
return $default(_that.code,_that.stayClass);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReturnSpotModel implements ReturnSpotModel {
  const _ReturnSpotModel({required this.code, this.stayClass});
  factory _ReturnSpotModel.fromJson(Map<String, dynamic> json) => _$ReturnSpotModelFromJson(json);

@override final  String code;
@override final  String? stayClass;

/// Create a copy of ReturnSpotModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReturnSpotModelCopyWith<_ReturnSpotModel> get copyWith => __$ReturnSpotModelCopyWithImpl<_ReturnSpotModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReturnSpotModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReturnSpotModel&&(identical(other.code, code) || other.code == code)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,code,stayClass);
}

@override
String toString() {
    return 'ReturnSpotModel(code: $code, stayClass: $stayClass)';
}


}

/// @nodoc
abstract mixin class _$ReturnSpotModelCopyWith<$Res> implements $ReturnSpotModelCopyWith<$Res> {
  factory _$ReturnSpotModelCopyWith(_ReturnSpotModel value, $Res Function(_ReturnSpotModel) _then) = __$ReturnSpotModelCopyWithImpl;
@override @useResult
$Res call({
 String code, String? stayClass
});




}
/// @nodoc
class __$ReturnSpotModelCopyWithImpl<$Res>
    implements _$ReturnSpotModelCopyWith<$Res> {
  __$ReturnSpotModelCopyWithImpl(this._self, this._then);

  final _ReturnSpotModel _self;
  final $Res Function(_ReturnSpotModel) _then;

/// Create a copy of ReturnSpotModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? code = null,Object? stayClass = freezed,}) {
  return _then(_ReturnSpotModel(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ShuttleStatusModel {

 TravellerShuttleModel? get shuttle; DateTime get serverTime;
/// Create a copy of ShuttleStatusModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ShuttleStatusModelCopyWith<ShuttleStatusModel> get copyWith => _$ShuttleStatusModelCopyWithImpl<ShuttleStatusModel>(this as ShuttleStatusModel, _$identity);

  /// Serializes this ShuttleStatusModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ShuttleStatusModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ShuttleStatusModel&&(identical(other.shuttle, _this.shuttle) || other.shuttle == _this.shuttle)&&(identical(other.serverTime, _this.serverTime) || other.serverTime == _this.serverTime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ShuttleStatusModel;
  return Object.hash(runtimeType,_this.shuttle,_this.serverTime);
}

@override
String toString() {
  final _this = this as ShuttleStatusModel;
  return 'ShuttleStatusModel(shuttle: ${_this.shuttle}, serverTime: ${_this.serverTime})';
}


}

/// @nodoc
abstract mixin class $ShuttleStatusModelCopyWith<$Res>  {
  factory $ShuttleStatusModelCopyWith(ShuttleStatusModel value, $Res Function(ShuttleStatusModel) _then) = _$ShuttleStatusModelCopyWithImpl;
@useResult
$Res call({
 TravellerShuttleModel? shuttle, DateTime serverTime
});


$TravellerShuttleModelCopyWith<$Res>? get shuttle;

}
/// @nodoc
class _$ShuttleStatusModelCopyWithImpl<$Res>
    implements $ShuttleStatusModelCopyWith<$Res> {
  _$ShuttleStatusModelCopyWithImpl(this._self, this._then);

  final ShuttleStatusModel _self;
  final $Res Function(ShuttleStatusModel) _then;

/// Create a copy of ShuttleStatusModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? shuttle = freezed,Object? serverTime = null,}) {
  return _then(ShuttleStatusModel(
shuttle: freezed == shuttle ? _self.shuttle : shuttle // ignore: cast_nullable_to_non_nullable
as TravellerShuttleModel?,serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of ShuttleStatusModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerShuttleModelCopyWith<$Res>? get shuttle {
    if (_self.shuttle == null) {
    return null;
  }

  return $TravellerShuttleModelCopyWith<$Res>(_self.shuttle!, (value) {
    return _then(_self.copyWith(shuttle: value));
  });
}
}


/// Adds pattern-matching-related methods to [ShuttleStatusModel].
extension ShuttleStatusModelPatterns on ShuttleStatusModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ShuttleStatusModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ShuttleStatusModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ShuttleStatusModel value)  $default,){
final _that = this;
switch (_that) {
case _ShuttleStatusModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ShuttleStatusModel value)?  $default,){
final _that = this;
switch (_that) {
case _ShuttleStatusModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( TravellerShuttleModel? shuttle,  DateTime serverTime)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ShuttleStatusModel() when $default != null:
return $default(_that.shuttle,_that.serverTime);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( TravellerShuttleModel? shuttle,  DateTime serverTime)  $default,) {final _that = this;
switch (_that) {
case _ShuttleStatusModel():
return $default(_that.shuttle,_that.serverTime);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( TravellerShuttleModel? shuttle,  DateTime serverTime)?  $default,) {final _that = this;
switch (_that) {
case _ShuttleStatusModel() when $default != null:
return $default(_that.shuttle,_that.serverTime);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ShuttleStatusModel implements ShuttleStatusModel {
  const _ShuttleStatusModel({this.shuttle, required this.serverTime});
  factory _ShuttleStatusModel.fromJson(Map<String, dynamic> json) => _$ShuttleStatusModelFromJson(json);

@override final  TravellerShuttleModel? shuttle;
@override final  DateTime serverTime;

/// Create a copy of ShuttleStatusModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ShuttleStatusModelCopyWith<_ShuttleStatusModel> get copyWith => __$ShuttleStatusModelCopyWithImpl<_ShuttleStatusModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ShuttleStatusModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ShuttleStatusModel&&(identical(other.shuttle, shuttle) || other.shuttle == shuttle)&&(identical(other.serverTime, serverTime) || other.serverTime == serverTime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,shuttle,serverTime);
}

@override
String toString() {
    return 'ShuttleStatusModel(shuttle: $shuttle, serverTime: $serverTime)';
}


}

/// @nodoc
abstract mixin class _$ShuttleStatusModelCopyWith<$Res> implements $ShuttleStatusModelCopyWith<$Res> {
  factory _$ShuttleStatusModelCopyWith(_ShuttleStatusModel value, $Res Function(_ShuttleStatusModel) _then) = __$ShuttleStatusModelCopyWithImpl;
@override @useResult
$Res call({
 TravellerShuttleModel? shuttle, DateTime serverTime
});


@override $TravellerShuttleModelCopyWith<$Res>? get shuttle;

}
/// @nodoc
class __$ShuttleStatusModelCopyWithImpl<$Res>
    implements _$ShuttleStatusModelCopyWith<$Res> {
  __$ShuttleStatusModelCopyWithImpl(this._self, this._then);

  final _ShuttleStatusModel _self;
  final $Res Function(_ShuttleStatusModel) _then;

/// Create a copy of ShuttleStatusModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? shuttle = freezed,Object? serverTime = null,}) {
  return _then(_ShuttleStatusModel(
shuttle: freezed == shuttle ? _self.shuttle : shuttle // ignore: cast_nullable_to_non_nullable
as TravellerShuttleModel?,serverTime: null == serverTime ? _self.serverTime : serverTime // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of ShuttleStatusModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$TravellerShuttleModelCopyWith<$Res>? get shuttle {
    if (_self.shuttle == null) {
    return null;
  }

  return $TravellerShuttleModelCopyWith<$Res>(_self.shuttle!, (value) {
    return _then(_self.copyWith(shuttle: value));
  });
}
}


/// @nodoc
mixin _$RoutePointModel {

 double get lat; double get lng;
/// Create a copy of RoutePointModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RoutePointModelCopyWith<RoutePointModel> get copyWith => _$RoutePointModelCopyWithImpl<RoutePointModel>(this as RoutePointModel, _$identity);

  /// Serializes this RoutePointModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RoutePointModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RoutePointModel&&(identical(other.lat, _this.lat) || other.lat == _this.lat)&&(identical(other.lng, _this.lng) || other.lng == _this.lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RoutePointModel;
  return Object.hash(runtimeType,_this.lat,_this.lng);
}

@override
String toString() {
  final _this = this as RoutePointModel;
  return 'RoutePointModel(lat: ${_this.lat}, lng: ${_this.lng})';
}


}

/// @nodoc
abstract mixin class $RoutePointModelCopyWith<$Res>  {
  factory $RoutePointModelCopyWith(RoutePointModel value, $Res Function(RoutePointModel) _then) = _$RoutePointModelCopyWithImpl;
@useResult
$Res call({
 double lat, double lng
});




}
/// @nodoc
class _$RoutePointModelCopyWithImpl<$Res>
    implements $RoutePointModelCopyWith<$Res> {
  _$RoutePointModelCopyWithImpl(this._self, this._then);

  final RoutePointModel _self;
  final $Res Function(RoutePointModel) _then;

/// Create a copy of RoutePointModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? lat = null,Object? lng = null,}) {
  return _then(RoutePointModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [RoutePointModel].
extension RoutePointModelPatterns on RoutePointModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RoutePointModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RoutePointModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RoutePointModel value)  $default,){
final _that = this;
switch (_that) {
case _RoutePointModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RoutePointModel value)?  $default,){
final _that = this;
switch (_that) {
case _RoutePointModel() when $default != null:
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
case _RoutePointModel() when $default != null:
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
case _RoutePointModel():
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
case _RoutePointModel() when $default != null:
return $default(_that.lat,_that.lng);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RoutePointModel implements RoutePointModel {
  const _RoutePointModel({required this.lat, required this.lng});
  factory _RoutePointModel.fromJson(Map<String, dynamic> json) => _$RoutePointModelFromJson(json);

@override final  double lat;
@override final  double lng;

/// Create a copy of RoutePointModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RoutePointModelCopyWith<_RoutePointModel> get copyWith => __$RoutePointModelCopyWithImpl<_RoutePointModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RoutePointModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RoutePointModel&&(identical(other.lat, lat) || other.lat == lat)&&(identical(other.lng, lng) || other.lng == lng));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,lat,lng);
}

@override
String toString() {
    return 'RoutePointModel(lat: $lat, lng: $lng)';
}


}

/// @nodoc
abstract mixin class _$RoutePointModelCopyWith<$Res> implements $RoutePointModelCopyWith<$Res> {
  factory _$RoutePointModelCopyWith(_RoutePointModel value, $Res Function(_RoutePointModel) _then) = __$RoutePointModelCopyWithImpl;
@override @useResult
$Res call({
 double lat, double lng
});




}
/// @nodoc
class __$RoutePointModelCopyWithImpl<$Res>
    implements _$RoutePointModelCopyWith<$Res> {
  __$RoutePointModelCopyWithImpl(this._self, this._then);

  final _RoutePointModel _self;
  final $Res Function(_RoutePointModel) _then;

/// Create a copy of RoutePointModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? lat = null,Object? lng = null,}) {
  return _then(_RoutePointModel(
lat: null == lat ? _self.lat : lat // ignore: cast_nullable_to_non_nullable
as double,lng: null == lng ? _self.lng : lng // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$WalkingRouteModel {

/// [lat, lng] pairs.
 List<List<double>> get geometry; int get distanceM; int get durationMinutes;/// The routing service failed: a straight line.
 bool get fallback; RoutePointModel get from; RoutePointModel get to; MeetingPointModel? get meetingPoint;
/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WalkingRouteModelCopyWith<WalkingRouteModel> get copyWith => _$WalkingRouteModelCopyWithImpl<WalkingRouteModel>(this as WalkingRouteModel, _$identity);

  /// Serializes this WalkingRouteModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as WalkingRouteModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WalkingRouteModel&&const DeepCollectionEquality().equals(other.geometry, _this.geometry)&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.durationMinutes, _this.durationMinutes) || other.durationMinutes == _this.durationMinutes)&&(identical(other.fallback, _this.fallback) || other.fallback == _this.fallback)&&(identical(other.from, _this.from) || other.from == _this.from)&&(identical(other.to, _this.to) || other.to == _this.to)&&(identical(other.meetingPoint, _this.meetingPoint) || other.meetingPoint == _this.meetingPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as WalkingRouteModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.geometry),_this.distanceM,_this.durationMinutes,_this.fallback,_this.from,_this.to,_this.meetingPoint);
}

@override
String toString() {
  final _this = this as WalkingRouteModel;
  return 'WalkingRouteModel(geometry: ${_this.geometry}, distanceM: ${_this.distanceM}, durationMinutes: ${_this.durationMinutes}, fallback: ${_this.fallback}, from: ${_this.from}, to: ${_this.to}, meetingPoint: ${_this.meetingPoint})';
}


}

/// @nodoc
abstract mixin class $WalkingRouteModelCopyWith<$Res>  {
  factory $WalkingRouteModelCopyWith(WalkingRouteModel value, $Res Function(WalkingRouteModel) _then) = _$WalkingRouteModelCopyWithImpl;
@useResult
$Res call({
 List<List<double>> geometry, int distanceM, int durationMinutes, bool fallback, RoutePointModel from, RoutePointModel to, MeetingPointModel? meetingPoint
});


$RoutePointModelCopyWith<$Res> get from;$RoutePointModelCopyWith<$Res> get to;$MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class _$WalkingRouteModelCopyWithImpl<$Res>
    implements $WalkingRouteModelCopyWith<$Res> {
  _$WalkingRouteModelCopyWithImpl(this._self, this._then);

  final WalkingRouteModel _self;
  final $Res Function(WalkingRouteModel) _then;

/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? geometry = null,Object? distanceM = null,Object? durationMinutes = null,Object? fallback = null,Object? from = null,Object? to = null,Object? meetingPoint = freezed,}) {
  return _then(WalkingRouteModel(
geometry: null == geometry ? _self.geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,distanceM: null == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,fallback: null == fallback ? _self.fallback : fallback // ignore: cast_nullable_to_non_nullable
as bool,from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as RoutePointModel,to: null == to ? _self.to : to // ignore: cast_nullable_to_non_nullable
as RoutePointModel,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,
  ));
}
/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RoutePointModelCopyWith<$Res> get from {
  
  return $RoutePointModelCopyWith<$Res>(_self.from, (value) {
    return _then(_self.copyWith(from: value));
  });
}/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RoutePointModelCopyWith<$Res> get to {
  
  return $RoutePointModelCopyWith<$Res>(_self.to, (value) {
    return _then(_self.copyWith(to: value));
  });
}/// Create a copy of WalkingRouteModel
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
}
}


/// Adds pattern-matching-related methods to [WalkingRouteModel].
extension WalkingRouteModelPatterns on WalkingRouteModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WalkingRouteModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WalkingRouteModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WalkingRouteModel value)  $default,){
final _that = this;
switch (_that) {
case _WalkingRouteModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WalkingRouteModel value)?  $default,){
final _that = this;
switch (_that) {
case _WalkingRouteModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<List<double>> geometry,  int distanceM,  int durationMinutes,  bool fallback,  RoutePointModel from,  RoutePointModel to,  MeetingPointModel? meetingPoint)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WalkingRouteModel() when $default != null:
return $default(_that.geometry,_that.distanceM,_that.durationMinutes,_that.fallback,_that.from,_that.to,_that.meetingPoint);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<List<double>> geometry,  int distanceM,  int durationMinutes,  bool fallback,  RoutePointModel from,  RoutePointModel to,  MeetingPointModel? meetingPoint)  $default,) {final _that = this;
switch (_that) {
case _WalkingRouteModel():
return $default(_that.geometry,_that.distanceM,_that.durationMinutes,_that.fallback,_that.from,_that.to,_that.meetingPoint);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<List<double>> geometry,  int distanceM,  int durationMinutes,  bool fallback,  RoutePointModel from,  RoutePointModel to,  MeetingPointModel? meetingPoint)?  $default,) {final _that = this;
switch (_that) {
case _WalkingRouteModel() when $default != null:
return $default(_that.geometry,_that.distanceM,_that.durationMinutes,_that.fallback,_that.from,_that.to,_that.meetingPoint);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WalkingRouteModel extends WalkingRouteModel {
  const _WalkingRouteModel({ List<List<double>> geometry = const [], this.distanceM = 0, this.durationMinutes = 1, this.fallback = false, required this.from, required this.to, this.meetingPoint}): _geometry = geometry,super._();
  factory _WalkingRouteModel.fromJson(Map<String, dynamic> json) => _$WalkingRouteModelFromJson(json);

/// [lat, lng] pairs.
 final  List<List<double>> _geometry;
/// [lat, lng] pairs.
@override@JsonKey() List<List<double>> get geometry {
  if (_geometry is EqualUnmodifiableListView) return _geometry;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_geometry);
}

@override@JsonKey() final  int distanceM;
@override@JsonKey() final  int durationMinutes;
/// The routing service failed: a straight line.
@override@JsonKey() final  bool fallback;
@override final  RoutePointModel from;
@override final  RoutePointModel to;
@override final  MeetingPointModel? meetingPoint;

/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WalkingRouteModelCopyWith<_WalkingRouteModel> get copyWith => __$WalkingRouteModelCopyWithImpl<_WalkingRouteModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WalkingRouteModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _WalkingRouteModel&&const DeepCollectionEquality().equals(other.geometry, _geometry)&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.fallback, fallback) || other.fallback == fallback)&&(identical(other.from, from) || other.from == from)&&(identical(other.to, to) || other.to == to)&&(identical(other.meetingPoint, meetingPoint) || other.meetingPoint == meetingPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_geometry),distanceM,durationMinutes,fallback,from,to,meetingPoint);
}

@override
String toString() {
    return 'WalkingRouteModel(geometry: $geometry, distanceM: $distanceM, durationMinutes: $durationMinutes, fallback: $fallback, from: $from, to: $to, meetingPoint: $meetingPoint)';
}


}

/// @nodoc
abstract mixin class _$WalkingRouteModelCopyWith<$Res> implements $WalkingRouteModelCopyWith<$Res> {
  factory _$WalkingRouteModelCopyWith(_WalkingRouteModel value, $Res Function(_WalkingRouteModel) _then) = __$WalkingRouteModelCopyWithImpl;
@override @useResult
$Res call({
 List<List<double>> geometry, int distanceM, int durationMinutes, bool fallback, RoutePointModel from, RoutePointModel to, MeetingPointModel? meetingPoint
});


@override $RoutePointModelCopyWith<$Res> get from;@override $RoutePointModelCopyWith<$Res> get to;@override $MeetingPointModelCopyWith<$Res>? get meetingPoint;

}
/// @nodoc
class __$WalkingRouteModelCopyWithImpl<$Res>
    implements _$WalkingRouteModelCopyWith<$Res> {
  __$WalkingRouteModelCopyWithImpl(this._self, this._then);

  final _WalkingRouteModel _self;
  final $Res Function(_WalkingRouteModel) _then;

/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? geometry = null,Object? distanceM = null,Object? durationMinutes = null,Object? fallback = null,Object? from = null,Object? to = null,Object? meetingPoint = freezed,}) {
  return _then(_WalkingRouteModel(
geometry: null == geometry ? _self._geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,distanceM: null == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,fallback: null == fallback ? _self.fallback : fallback // ignore: cast_nullable_to_non_nullable
as bool,from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as RoutePointModel,to: null == to ? _self.to : to // ignore: cast_nullable_to_non_nullable
as RoutePointModel,meetingPoint: freezed == meetingPoint ? _self.meetingPoint : meetingPoint // ignore: cast_nullable_to_non_nullable
as MeetingPointModel?,
  ));
}

/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RoutePointModelCopyWith<$Res> get from {
  
  return $RoutePointModelCopyWith<$Res>(_self.from, (value) {
    return _then(_self.copyWith(from: value));
  });
}/// Create a copy of WalkingRouteModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RoutePointModelCopyWith<$Res> get to {
  
  return $RoutePointModelCopyWith<$Res>(_self.to, (value) {
    return _then(_self.copyWith(to: value));
  });
}/// Create a copy of WalkingRouteModel
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
}
}

// dart format on
