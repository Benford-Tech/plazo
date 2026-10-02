// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'planning_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PlanningRowModel {

 String get id; String get reference; String get status; DateTime get arrivalAt; DateTime get returnAt; int get passengers; String get customerName; String get plate; String? get returnFlight; StaffSignalModel? get arrivalSignal;
/// Create a copy of PlanningRowModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlanningRowModelCopyWith<PlanningRowModel> get copyWith => _$PlanningRowModelCopyWithImpl<PlanningRowModel>(this as PlanningRowModel, _$identity);

  /// Serializes this PlanningRowModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlanningRowModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlanningRowModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.passengers, _this.passengers) || other.passengers == _this.passengers)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.arrivalSignal, _this.arrivalSignal) || other.arrivalSignal == _this.arrivalSignal));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlanningRowModel;
  return Object.hash(runtimeType,_this.id,_this.reference,_this.status,_this.arrivalAt,_this.returnAt,_this.passengers,_this.customerName,_this.plate,_this.returnFlight,_this.arrivalSignal);
}

@override
String toString() {
  final _this = this as PlanningRowModel;
  return 'PlanningRowModel(id: ${_this.id}, reference: ${_this.reference}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, passengers: ${_this.passengers}, customerName: ${_this.customerName}, plate: ${_this.plate}, returnFlight: ${_this.returnFlight}, arrivalSignal: ${_this.arrivalSignal})';
}


}

/// @nodoc
abstract mixin class $PlanningRowModelCopyWith<$Res>  {
  factory $PlanningRowModelCopyWith(PlanningRowModel value, $Res Function(PlanningRowModel) _then) = _$PlanningRowModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String status, DateTime arrivalAt, DateTime returnAt, int passengers, String customerName, String plate, String? returnFlight, StaffSignalModel? arrivalSignal
});


$StaffSignalModelCopyWith<$Res>? get arrivalSignal;

}
/// @nodoc
class _$PlanningRowModelCopyWithImpl<$Res>
    implements $PlanningRowModelCopyWith<$Res> {
  _$PlanningRowModelCopyWithImpl(this._self, this._then);

  final PlanningRowModel _self;
  final $Res Function(PlanningRowModel) _then;

/// Create a copy of PlanningRowModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? passengers = null,Object? customerName = null,Object? plate = null,Object? returnFlight = freezed,Object? arrivalSignal = freezed,}) {
  return _then(PlanningRowModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,arrivalSignal: freezed == arrivalSignal ? _self.arrivalSignal : arrivalSignal // ignore: cast_nullable_to_non_nullable
as StaffSignalModel?,
  ));
}
/// Create a copy of PlanningRowModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffSignalModelCopyWith<$Res>? get arrivalSignal {
    if (_self.arrivalSignal == null) {
    return null;
  }

  return $StaffSignalModelCopyWith<$Res>(_self.arrivalSignal!, (value) {
    return _then(_self.copyWith(arrivalSignal: value));
  });
}
}


/// Adds pattern-matching-related methods to [PlanningRowModel].
extension PlanningRowModelPatterns on PlanningRowModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlanningRowModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlanningRowModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlanningRowModel value)  $default,){
final _that = this;
switch (_that) {
case _PlanningRowModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlanningRowModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlanningRowModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String status,  DateTime arrivalAt,  DateTime returnAt,  int passengers,  String customerName,  String plate,  String? returnFlight,  StaffSignalModel? arrivalSignal)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlanningRowModel() when $default != null:
return $default(_that.id,_that.reference,_that.status,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.plate,_that.returnFlight,_that.arrivalSignal);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String status,  DateTime arrivalAt,  DateTime returnAt,  int passengers,  String customerName,  String plate,  String? returnFlight,  StaffSignalModel? arrivalSignal)  $default,) {final _that = this;
switch (_that) {
case _PlanningRowModel():
return $default(_that.id,_that.reference,_that.status,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.plate,_that.returnFlight,_that.arrivalSignal);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String status,  DateTime arrivalAt,  DateTime returnAt,  int passengers,  String customerName,  String plate,  String? returnFlight,  StaffSignalModel? arrivalSignal)?  $default,) {final _that = this;
switch (_that) {
case _PlanningRowModel() when $default != null:
return $default(_that.id,_that.reference,_that.status,_that.arrivalAt,_that.returnAt,_that.passengers,_that.customerName,_that.plate,_that.returnFlight,_that.arrivalSignal);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlanningRowModel implements PlanningRowModel {
  const _PlanningRowModel({required this.id, required this.reference, required this.status, required this.arrivalAt, required this.returnAt, required this.passengers, required this.customerName, required this.plate, this.returnFlight, this.arrivalSignal});
  factory _PlanningRowModel.fromJson(Map<String, dynamic> json) => _$PlanningRowModelFromJson(json);

@override final  String id;
@override final  String reference;
@override final  String status;
@override final  DateTime arrivalAt;
@override final  DateTime returnAt;
@override final  int passengers;
@override final  String customerName;
@override final  String plate;
@override final  String? returnFlight;
@override final  StaffSignalModel? arrivalSignal;

/// Create a copy of PlanningRowModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlanningRowModelCopyWith<_PlanningRowModel> get copyWith => __$PlanningRowModelCopyWithImpl<_PlanningRowModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlanningRowModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlanningRowModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.passengers, passengers) || other.passengers == passengers)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.arrivalSignal, arrivalSignal) || other.arrivalSignal == arrivalSignal));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,reference,status,arrivalAt,returnAt,passengers,customerName,plate,returnFlight,arrivalSignal);
}

@override
String toString() {
    return 'PlanningRowModel(id: $id, reference: $reference, status: $status, arrivalAt: $arrivalAt, returnAt: $returnAt, passengers: $passengers, customerName: $customerName, plate: $plate, returnFlight: $returnFlight, arrivalSignal: $arrivalSignal)';
}


}

/// @nodoc
abstract mixin class _$PlanningRowModelCopyWith<$Res> implements $PlanningRowModelCopyWith<$Res> {
  factory _$PlanningRowModelCopyWith(_PlanningRowModel value, $Res Function(_PlanningRowModel) _then) = __$PlanningRowModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String status, DateTime arrivalAt, DateTime returnAt, int passengers, String customerName, String plate, String? returnFlight, StaffSignalModel? arrivalSignal
});


@override $StaffSignalModelCopyWith<$Res>? get arrivalSignal;

}
/// @nodoc
class __$PlanningRowModelCopyWithImpl<$Res>
    implements _$PlanningRowModelCopyWith<$Res> {
  __$PlanningRowModelCopyWithImpl(this._self, this._then);

  final _PlanningRowModel _self;
  final $Res Function(_PlanningRowModel) _then;

/// Create a copy of PlanningRowModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? passengers = null,Object? customerName = null,Object? plate = null,Object? returnFlight = freezed,Object? arrivalSignal = freezed,}) {
  return _then(_PlanningRowModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,passengers: null == passengers ? _self.passengers : passengers // ignore: cast_nullable_to_non_nullable
as int,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnFlight: freezed == returnFlight ? _self.returnFlight : returnFlight // ignore: cast_nullable_to_non_nullable
as String?,arrivalSignal: freezed == arrivalSignal ? _self.arrivalSignal : arrivalSignal // ignore: cast_nullable_to_non_nullable
as StaffSignalModel?,
  ));
}

/// Create a copy of PlanningRowModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$StaffSignalModelCopyWith<$Res>? get arrivalSignal {
    if (_self.arrivalSignal == null) {
    return null;
  }

  return $StaffSignalModelCopyWith<$Res>(_self.arrivalSignal!, (value) {
    return _then(_self.copyWith(arrivalSignal: value));
  });
}
}


/// @nodoc
mixin _$PlanningParkingModel {

 String get id; String get name;
/// Create a copy of PlanningParkingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlanningParkingModelCopyWith<PlanningParkingModel> get copyWith => _$PlanningParkingModelCopyWithImpl<PlanningParkingModel>(this as PlanningParkingModel, _$identity);

  /// Serializes this PlanningParkingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlanningParkingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlanningParkingModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.name, _this.name) || other.name == _this.name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlanningParkingModel;
  return Object.hash(runtimeType,_this.id,_this.name);
}

@override
String toString() {
  final _this = this as PlanningParkingModel;
  return 'PlanningParkingModel(id: ${_this.id}, name: ${_this.name})';
}


}

/// @nodoc
abstract mixin class $PlanningParkingModelCopyWith<$Res>  {
  factory $PlanningParkingModelCopyWith(PlanningParkingModel value, $Res Function(PlanningParkingModel) _then) = _$PlanningParkingModelCopyWithImpl;
@useResult
$Res call({
 String id, String name
});




}
/// @nodoc
class _$PlanningParkingModelCopyWithImpl<$Res>
    implements $PlanningParkingModelCopyWith<$Res> {
  _$PlanningParkingModelCopyWithImpl(this._self, this._then);

  final PlanningParkingModel _self;
  final $Res Function(PlanningParkingModel) _then;

/// Create a copy of PlanningParkingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(PlanningParkingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [PlanningParkingModel].
extension PlanningParkingModelPatterns on PlanningParkingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlanningParkingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlanningParkingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlanningParkingModel value)  $default,){
final _that = this;
switch (_that) {
case _PlanningParkingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlanningParkingModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlanningParkingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlanningParkingModel() when $default != null:
return $default(_that.id,_that.name);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name)  $default,) {final _that = this;
switch (_that) {
case _PlanningParkingModel():
return $default(_that.id,_that.name);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name)?  $default,) {final _that = this;
switch (_that) {
case _PlanningParkingModel() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlanningParkingModel implements PlanningParkingModel {
  const _PlanningParkingModel({required this.id, required this.name});
  factory _PlanningParkingModel.fromJson(Map<String, dynamic> json) => _$PlanningParkingModelFromJson(json);

@override final  String id;
@override final  String name;

/// Create a copy of PlanningParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlanningParkingModelCopyWith<_PlanningParkingModel> get copyWith => __$PlanningParkingModelCopyWithImpl<_PlanningParkingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlanningParkingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlanningParkingModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,name);
}

@override
String toString() {
    return 'PlanningParkingModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$PlanningParkingModelCopyWith<$Res> implements $PlanningParkingModelCopyWith<$Res> {
  factory _$PlanningParkingModelCopyWith(_PlanningParkingModel value, $Res Function(_PlanningParkingModel) _then) = __$PlanningParkingModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name
});




}
/// @nodoc
class __$PlanningParkingModelCopyWithImpl<$Res>
    implements _$PlanningParkingModelCopyWith<$Res> {
  __$PlanningParkingModelCopyWithImpl(this._self, this._then);

  final _PlanningParkingModel _self;
  final $Res Function(_PlanningParkingModel) _then;

/// Create a copy of PlanningParkingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_PlanningParkingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$PlanningModel {

 String get date; PlanningParkingModel get parking; List<PlanningRowModel> get arrivals; List<PlanningRowModel> get returns;
/// Create a copy of PlanningModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PlanningModelCopyWith<PlanningModel> get copyWith => _$PlanningModelCopyWithImpl<PlanningModel>(this as PlanningModel, _$identity);

  /// Serializes this PlanningModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PlanningModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PlanningModel&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&const DeepCollectionEquality().equals(other.arrivals, _this.arrivals)&&const DeepCollectionEquality().equals(other.returns, _this.returns));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PlanningModel;
  return Object.hash(runtimeType,_this.date,_this.parking,const DeepCollectionEquality().hash(_this.arrivals),const DeepCollectionEquality().hash(_this.returns));
}

@override
String toString() {
  final _this = this as PlanningModel;
  return 'PlanningModel(date: ${_this.date}, parking: ${_this.parking}, arrivals: ${_this.arrivals}, returns: ${_this.returns})';
}


}

/// @nodoc
abstract mixin class $PlanningModelCopyWith<$Res>  {
  factory $PlanningModelCopyWith(PlanningModel value, $Res Function(PlanningModel) _then) = _$PlanningModelCopyWithImpl;
@useResult
$Res call({
 String date, PlanningParkingModel parking, List<PlanningRowModel> arrivals, List<PlanningRowModel> returns
});


$PlanningParkingModelCopyWith<$Res> get parking;

}
/// @nodoc
class _$PlanningModelCopyWithImpl<$Res>
    implements $PlanningModelCopyWith<$Res> {
  _$PlanningModelCopyWithImpl(this._self, this._then);

  final PlanningModel _self;
  final $Res Function(PlanningModel) _then;

/// Create a copy of PlanningModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? parking = null,Object? arrivals = null,Object? returns = null,}) {
  return _then(PlanningModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as PlanningParkingModel,arrivals: null == arrivals ? _self.arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as List<PlanningRowModel>,returns: null == returns ? _self.returns : returns // ignore: cast_nullable_to_non_nullable
as List<PlanningRowModel>,
  ));
}
/// Create a copy of PlanningModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PlanningParkingModelCopyWith<$Res> get parking {
  
  return $PlanningParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}
}


/// Adds pattern-matching-related methods to [PlanningModel].
extension PlanningModelPatterns on PlanningModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PlanningModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PlanningModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PlanningModel value)  $default,){
final _that = this;
switch (_that) {
case _PlanningModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PlanningModel value)?  $default,){
final _that = this;
switch (_that) {
case _PlanningModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  PlanningParkingModel parking,  List<PlanningRowModel> arrivals,  List<PlanningRowModel> returns)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PlanningModel() when $default != null:
return $default(_that.date,_that.parking,_that.arrivals,_that.returns);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  PlanningParkingModel parking,  List<PlanningRowModel> arrivals,  List<PlanningRowModel> returns)  $default,) {final _that = this;
switch (_that) {
case _PlanningModel():
return $default(_that.date,_that.parking,_that.arrivals,_that.returns);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  PlanningParkingModel parking,  List<PlanningRowModel> arrivals,  List<PlanningRowModel> returns)?  $default,) {final _that = this;
switch (_that) {
case _PlanningModel() when $default != null:
return $default(_that.date,_that.parking,_that.arrivals,_that.returns);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PlanningModel implements PlanningModel {
  const _PlanningModel({required this.date, required this.parking,  List<PlanningRowModel> arrivals = const [],  List<PlanningRowModel> returns = const []}): _arrivals = arrivals,_returns = returns;
  factory _PlanningModel.fromJson(Map<String, dynamic> json) => _$PlanningModelFromJson(json);

@override final  String date;
@override final  PlanningParkingModel parking;
 final  List<PlanningRowModel> _arrivals;
@override@JsonKey() List<PlanningRowModel> get arrivals {
  if (_arrivals is EqualUnmodifiableListView) return _arrivals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_arrivals);
}

 final  List<PlanningRowModel> _returns;
@override@JsonKey() List<PlanningRowModel> get returns {
  if (_returns is EqualUnmodifiableListView) return _returns;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_returns);
}


/// Create a copy of PlanningModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PlanningModelCopyWith<_PlanningModel> get copyWith => __$PlanningModelCopyWithImpl<_PlanningModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PlanningModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PlanningModel&&(identical(other.date, date) || other.date == date)&&(identical(other.parking, parking) || other.parking == parking)&&const DeepCollectionEquality().equals(other.arrivals, _arrivals)&&const DeepCollectionEquality().equals(other.returns, _returns));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,date,parking,const DeepCollectionEquality().hash(_arrivals),const DeepCollectionEquality().hash(_returns));
}

@override
String toString() {
    return 'PlanningModel(date: $date, parking: $parking, arrivals: $arrivals, returns: $returns)';
}


}

/// @nodoc
abstract mixin class _$PlanningModelCopyWith<$Res> implements $PlanningModelCopyWith<$Res> {
  factory _$PlanningModelCopyWith(_PlanningModel value, $Res Function(_PlanningModel) _then) = __$PlanningModelCopyWithImpl;
@override @useResult
$Res call({
 String date, PlanningParkingModel parking, List<PlanningRowModel> arrivals, List<PlanningRowModel> returns
});


@override $PlanningParkingModelCopyWith<$Res> get parking;

}
/// @nodoc
class __$PlanningModelCopyWithImpl<$Res>
    implements _$PlanningModelCopyWith<$Res> {
  __$PlanningModelCopyWithImpl(this._self, this._then);

  final _PlanningModel _self;
  final $Res Function(_PlanningModel) _then;

/// Create a copy of PlanningModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? parking = null,Object? arrivals = null,Object? returns = null,}) {
  return _then(_PlanningModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as PlanningParkingModel,arrivals: null == arrivals ? _self._arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as List<PlanningRowModel>,returns: null == returns ? _self._returns : returns // ignore: cast_nullable_to_non_nullable
as List<PlanningRowModel>,
  ));
}

/// Create a copy of PlanningModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PlanningParkingModelCopyWith<$Res> get parking {
  
  return $PlanningParkingModelCopyWith<$Res>(_self.parking, (value) {
    return _then(_self.copyWith(parking: value));
  });
}
}

// dart format on
