// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'files_planning_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$FilesPlanningFileModel {

 String get id; String get code; String? get name; int get capacity; bool get active;/// The return day (YYYY-MM-DD) an empty file is kept for; null when free.
 String? get plannedDay;/// The return day the file serves: its front car's local day, else [plannedDay].
 String? get day; int get cars; bool get sound;/// The planned day was chosen by hand: the night preparation leaves it.
 bool get keptByHand;
/// Create a copy of FilesPlanningFileModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FilesPlanningFileModelCopyWith<FilesPlanningFileModel> get copyWith => _$FilesPlanningFileModelCopyWithImpl<FilesPlanningFileModel>(this as FilesPlanningFileModel, _$identity);

  /// Serializes this FilesPlanningFileModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FilesPlanningFileModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FilesPlanningFileModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&(identical(other.active, _this.active) || other.active == _this.active)&&(identical(other.plannedDay, _this.plannedDay) || other.plannedDay == _this.plannedDay)&&(identical(other.day, _this.day) || other.day == _this.day)&&(identical(other.cars, _this.cars) || other.cars == _this.cars)&&(identical(other.sound, _this.sound) || other.sound == _this.sound)&&(identical(other.keptByHand, _this.keptByHand) || other.keptByHand == _this.keptByHand));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FilesPlanningFileModel;
  return Object.hash(runtimeType,_this.id,_this.code,_this.name,_this.capacity,_this.active,_this.plannedDay,_this.day,_this.cars,_this.sound,_this.keptByHand);
}

@override
String toString() {
  final _this = this as FilesPlanningFileModel;
  return 'FilesPlanningFileModel(id: ${_this.id}, code: ${_this.code}, name: ${_this.name}, capacity: ${_this.capacity}, active: ${_this.active}, plannedDay: ${_this.plannedDay}, day: ${_this.day}, cars: ${_this.cars}, sound: ${_this.sound}, keptByHand: ${_this.keptByHand})';
}


}

/// @nodoc
abstract mixin class $FilesPlanningFileModelCopyWith<$Res>  {
  factory $FilesPlanningFileModelCopyWith(FilesPlanningFileModel value, $Res Function(FilesPlanningFileModel) _then) = _$FilesPlanningFileModelCopyWithImpl;
@useResult
$Res call({
 String id, String code, String? name, int capacity, bool active, String? plannedDay, String? day, int cars, bool sound, bool keptByHand
});




}
/// @nodoc
class _$FilesPlanningFileModelCopyWithImpl<$Res>
    implements $FilesPlanningFileModelCopyWith<$Res> {
  _$FilesPlanningFileModelCopyWithImpl(this._self, this._then);

  final FilesPlanningFileModel _self;
  final $Res Function(FilesPlanningFileModel) _then;

/// Create a copy of FilesPlanningFileModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = freezed,Object? capacity = null,Object? active = null,Object? plannedDay = freezed,Object? day = freezed,Object? cars = null,Object? sound = null,Object? keptByHand = null,}) {
  return _then(FilesPlanningFileModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,plannedDay: freezed == plannedDay ? _self.plannedDay : plannedDay // ignore: cast_nullable_to_non_nullable
as String?,day: freezed == day ? _self.day : day // ignore: cast_nullable_to_non_nullable
as String?,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as int,sound: null == sound ? _self.sound : sound // ignore: cast_nullable_to_non_nullable
as bool,keptByHand: null == keptByHand ? _self.keptByHand : keptByHand // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [FilesPlanningFileModel].
extension FilesPlanningFileModelPatterns on FilesPlanningFileModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FilesPlanningFileModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FilesPlanningFileModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FilesPlanningFileModel value)  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningFileModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FilesPlanningFileModel value)?  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningFileModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String? name,  int capacity,  bool active,  String? plannedDay,  String? day,  int cars,  bool sound,  bool keptByHand)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FilesPlanningFileModel() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.active,_that.plannedDay,_that.day,_that.cars,_that.sound,_that.keptByHand);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String? name,  int capacity,  bool active,  String? plannedDay,  String? day,  int cars,  bool sound,  bool keptByHand)  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningFileModel():
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.active,_that.plannedDay,_that.day,_that.cars,_that.sound,_that.keptByHand);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String? name,  int capacity,  bool active,  String? plannedDay,  String? day,  int cars,  bool sound,  bool keptByHand)?  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningFileModel() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.active,_that.plannedDay,_that.day,_that.cars,_that.sound,_that.keptByHand);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FilesPlanningFileModel implements FilesPlanningFileModel {
  const _FilesPlanningFileModel({required this.id, required this.code, this.name, required this.capacity, required this.active, this.plannedDay, this.day, required this.cars, required this.sound, this.keptByHand = false});
  factory _FilesPlanningFileModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningFileModelFromJson(json);

@override final  String id;
@override final  String code;
@override final  String? name;
@override final  int capacity;
@override final  bool active;
/// The return day (YYYY-MM-DD) an empty file is kept for; null when free.
@override final  String? plannedDay;
/// The return day the file serves: its front car's local day, else [plannedDay].
@override final  String? day;
@override final  int cars;
@override final  bool sound;
/// The planned day was chosen by hand: the night preparation leaves it.
@override@JsonKey() final  bool keptByHand;

/// Create a copy of FilesPlanningFileModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FilesPlanningFileModelCopyWith<_FilesPlanningFileModel> get copyWith => __$FilesPlanningFileModelCopyWithImpl<_FilesPlanningFileModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FilesPlanningFileModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FilesPlanningFileModel&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&(identical(other.active, active) || other.active == active)&&(identical(other.plannedDay, plannedDay) || other.plannedDay == plannedDay)&&(identical(other.day, day) || other.day == day)&&(identical(other.cars, cars) || other.cars == cars)&&(identical(other.sound, sound) || other.sound == sound)&&(identical(other.keptByHand, keptByHand) || other.keptByHand == keptByHand));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,code,name,capacity,active,plannedDay,day,cars,sound,keptByHand);
}

@override
String toString() {
    return 'FilesPlanningFileModel(id: $id, code: $code, name: $name, capacity: $capacity, active: $active, plannedDay: $plannedDay, day: $day, cars: $cars, sound: $sound, keptByHand: $keptByHand)';
}


}

/// @nodoc
abstract mixin class _$FilesPlanningFileModelCopyWith<$Res> implements $FilesPlanningFileModelCopyWith<$Res> {
  factory _$FilesPlanningFileModelCopyWith(_FilesPlanningFileModel value, $Res Function(_FilesPlanningFileModel) _then) = __$FilesPlanningFileModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String? name, int capacity, bool active, String? plannedDay, String? day, int cars, bool sound, bool keptByHand
});




}
/// @nodoc
class __$FilesPlanningFileModelCopyWithImpl<$Res>
    implements _$FilesPlanningFileModelCopyWith<$Res> {
  __$FilesPlanningFileModelCopyWithImpl(this._self, this._then);

  final _FilesPlanningFileModel _self;
  final $Res Function(_FilesPlanningFileModel) _then;

/// Create a copy of FilesPlanningFileModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = freezed,Object? capacity = null,Object? active = null,Object? plannedDay = freezed,Object? day = freezed,Object? cars = null,Object? sound = null,Object? keptByHand = null,}) {
  return _then(_FilesPlanningFileModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,plannedDay: freezed == plannedDay ? _self.plannedDay : plannedDay // ignore: cast_nullable_to_non_nullable
as String?,day: freezed == day ? _self.day : day // ignore: cast_nullable_to_non_nullable
as String?,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as int,sound: null == sound ? _self.sound : sound // ignore: cast_nullable_to_non_nullable
as bool,keptByHand: null == keptByHand ? _self.keptByHand : keptByHand // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$FilesPlanningDayModel {

 String get date; int get returns; int get placed; int get toCome; int get onSite; List<String> get filesServing; List<String> get filesKept; int get room; int get missing;
/// Create a copy of FilesPlanningDayModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FilesPlanningDayModelCopyWith<FilesPlanningDayModel> get copyWith => _$FilesPlanningDayModelCopyWithImpl<FilesPlanningDayModel>(this as FilesPlanningDayModel, _$identity);

  /// Serializes this FilesPlanningDayModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FilesPlanningDayModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FilesPlanningDayModel&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.returns, _this.returns) || other.returns == _this.returns)&&(identical(other.placed, _this.placed) || other.placed == _this.placed)&&(identical(other.toCome, _this.toCome) || other.toCome == _this.toCome)&&(identical(other.onSite, _this.onSite) || other.onSite == _this.onSite)&&const DeepCollectionEquality().equals(other.filesServing, _this.filesServing)&&const DeepCollectionEquality().equals(other.filesKept, _this.filesKept)&&(identical(other.room, _this.room) || other.room == _this.room)&&(identical(other.missing, _this.missing) || other.missing == _this.missing));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FilesPlanningDayModel;
  return Object.hash(runtimeType,_this.date,_this.returns,_this.placed,_this.toCome,_this.onSite,const DeepCollectionEquality().hash(_this.filesServing),const DeepCollectionEquality().hash(_this.filesKept),_this.room,_this.missing);
}

@override
String toString() {
  final _this = this as FilesPlanningDayModel;
  return 'FilesPlanningDayModel(date: ${_this.date}, returns: ${_this.returns}, placed: ${_this.placed}, toCome: ${_this.toCome}, onSite: ${_this.onSite}, filesServing: ${_this.filesServing}, filesKept: ${_this.filesKept}, room: ${_this.room}, missing: ${_this.missing})';
}


}

/// @nodoc
abstract mixin class $FilesPlanningDayModelCopyWith<$Res>  {
  factory $FilesPlanningDayModelCopyWith(FilesPlanningDayModel value, $Res Function(FilesPlanningDayModel) _then) = _$FilesPlanningDayModelCopyWithImpl;
@useResult
$Res call({
 String date, int returns, int placed, int toCome, int onSite, List<String> filesServing, List<String> filesKept, int room, int missing
});




}
/// @nodoc
class _$FilesPlanningDayModelCopyWithImpl<$Res>
    implements $FilesPlanningDayModelCopyWith<$Res> {
  _$FilesPlanningDayModelCopyWithImpl(this._self, this._then);

  final FilesPlanningDayModel _self;
  final $Res Function(FilesPlanningDayModel) _then;

/// Create a copy of FilesPlanningDayModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? returns = null,Object? placed = null,Object? toCome = null,Object? onSite = null,Object? filesServing = null,Object? filesKept = null,Object? room = null,Object? missing = null,}) {
  return _then(FilesPlanningDayModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,returns: null == returns ? _self.returns : returns // ignore: cast_nullable_to_non_nullable
as int,placed: null == placed ? _self.placed : placed // ignore: cast_nullable_to_non_nullable
as int,toCome: null == toCome ? _self.toCome : toCome // ignore: cast_nullable_to_non_nullable
as int,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as int,filesServing: null == filesServing ? _self.filesServing : filesServing // ignore: cast_nullable_to_non_nullable
as List<String>,filesKept: null == filesKept ? _self.filesKept : filesKept // ignore: cast_nullable_to_non_nullable
as List<String>,room: null == room ? _self.room : room // ignore: cast_nullable_to_non_nullable
as int,missing: null == missing ? _self.missing : missing // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [FilesPlanningDayModel].
extension FilesPlanningDayModelPatterns on FilesPlanningDayModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FilesPlanningDayModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FilesPlanningDayModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FilesPlanningDayModel value)  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningDayModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FilesPlanningDayModel value)?  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningDayModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  int returns,  int placed,  int toCome,  int onSite,  List<String> filesServing,  List<String> filesKept,  int room,  int missing)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FilesPlanningDayModel() when $default != null:
return $default(_that.date,_that.returns,_that.placed,_that.toCome,_that.onSite,_that.filesServing,_that.filesKept,_that.room,_that.missing);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  int returns,  int placed,  int toCome,  int onSite,  List<String> filesServing,  List<String> filesKept,  int room,  int missing)  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningDayModel():
return $default(_that.date,_that.returns,_that.placed,_that.toCome,_that.onSite,_that.filesServing,_that.filesKept,_that.room,_that.missing);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  int returns,  int placed,  int toCome,  int onSite,  List<String> filesServing,  List<String> filesKept,  int room,  int missing)?  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningDayModel() when $default != null:
return $default(_that.date,_that.returns,_that.placed,_that.toCome,_that.onSite,_that.filesServing,_that.filesKept,_that.room,_that.missing);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FilesPlanningDayModel implements FilesPlanningDayModel {
  const _FilesPlanningDayModel({required this.date, required this.returns, required this.placed, required this.toCome, required this.onSite,  List<String> filesServing = const <String>[],  List<String> filesKept = const <String>[], required this.room, required this.missing}): _filesServing = filesServing,_filesKept = filesKept;
  factory _FilesPlanningDayModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningDayModelFromJson(json);

@override final  String date;
@override final  int returns;
@override final  int placed;
@override final  int toCome;
@override final  int onSite;
 final  List<String> _filesServing;
@override@JsonKey() List<String> get filesServing {
  if (_filesServing is EqualUnmodifiableListView) return _filesServing;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_filesServing);
}

 final  List<String> _filesKept;
@override@JsonKey() List<String> get filesKept {
  if (_filesKept is EqualUnmodifiableListView) return _filesKept;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_filesKept);
}

@override final  int room;
@override final  int missing;

/// Create a copy of FilesPlanningDayModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FilesPlanningDayModelCopyWith<_FilesPlanningDayModel> get copyWith => __$FilesPlanningDayModelCopyWithImpl<_FilesPlanningDayModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FilesPlanningDayModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FilesPlanningDayModel&&(identical(other.date, date) || other.date == date)&&(identical(other.returns, returns) || other.returns == returns)&&(identical(other.placed, placed) || other.placed == placed)&&(identical(other.toCome, toCome) || other.toCome == toCome)&&(identical(other.onSite, onSite) || other.onSite == onSite)&&const DeepCollectionEquality().equals(other.filesServing, _filesServing)&&const DeepCollectionEquality().equals(other.filesKept, _filesKept)&&(identical(other.room, room) || other.room == room)&&(identical(other.missing, missing) || other.missing == missing));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,date,returns,placed,toCome,onSite,const DeepCollectionEquality().hash(_filesServing),const DeepCollectionEquality().hash(_filesKept),room,missing);
}

@override
String toString() {
    return 'FilesPlanningDayModel(date: $date, returns: $returns, placed: $placed, toCome: $toCome, onSite: $onSite, filesServing: $filesServing, filesKept: $filesKept, room: $room, missing: $missing)';
}


}

/// @nodoc
abstract mixin class _$FilesPlanningDayModelCopyWith<$Res> implements $FilesPlanningDayModelCopyWith<$Res> {
  factory _$FilesPlanningDayModelCopyWith(_FilesPlanningDayModel value, $Res Function(_FilesPlanningDayModel) _then) = __$FilesPlanningDayModelCopyWithImpl;
@override @useResult
$Res call({
 String date, int returns, int placed, int toCome, int onSite, List<String> filesServing, List<String> filesKept, int room, int missing
});




}
/// @nodoc
class __$FilesPlanningDayModelCopyWithImpl<$Res>
    implements _$FilesPlanningDayModelCopyWith<$Res> {
  __$FilesPlanningDayModelCopyWithImpl(this._self, this._then);

  final _FilesPlanningDayModel _self;
  final $Res Function(_FilesPlanningDayModel) _then;

/// Create a copy of FilesPlanningDayModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? returns = null,Object? placed = null,Object? toCome = null,Object? onSite = null,Object? filesServing = null,Object? filesKept = null,Object? room = null,Object? missing = null,}) {
  return _then(_FilesPlanningDayModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,returns: null == returns ? _self.returns : returns // ignore: cast_nullable_to_non_nullable
as int,placed: null == placed ? _self.placed : placed // ignore: cast_nullable_to_non_nullable
as int,toCome: null == toCome ? _self.toCome : toCome // ignore: cast_nullable_to_non_nullable
as int,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as int,filesServing: null == filesServing ? _self._filesServing : filesServing // ignore: cast_nullable_to_non_nullable
as List<String>,filesKept: null == filesKept ? _self._filesKept : filesKept // ignore: cast_nullable_to_non_nullable
as List<String>,room: null == room ? _self.room : room // ignore: cast_nullable_to_non_nullable
as int,missing: null == missing ? _self.missing : missing // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$FilesPlanningAlertModel {

 String get kind; String? get date; int? get count; String? get fileCode;
/// Create a copy of FilesPlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FilesPlanningAlertModelCopyWith<FilesPlanningAlertModel> get copyWith => _$FilesPlanningAlertModelCopyWithImpl<FilesPlanningAlertModel>(this as FilesPlanningAlertModel, _$identity);

  /// Serializes this FilesPlanningAlertModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FilesPlanningAlertModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FilesPlanningAlertModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.count, _this.count) || other.count == _this.count)&&(identical(other.fileCode, _this.fileCode) || other.fileCode == _this.fileCode));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FilesPlanningAlertModel;
  return Object.hash(runtimeType,_this.kind,_this.date,_this.count,_this.fileCode);
}

@override
String toString() {
  final _this = this as FilesPlanningAlertModel;
  return 'FilesPlanningAlertModel(kind: ${_this.kind}, date: ${_this.date}, count: ${_this.count}, fileCode: ${_this.fileCode})';
}


}

/// @nodoc
abstract mixin class $FilesPlanningAlertModelCopyWith<$Res>  {
  factory $FilesPlanningAlertModelCopyWith(FilesPlanningAlertModel value, $Res Function(FilesPlanningAlertModel) _then) = _$FilesPlanningAlertModelCopyWithImpl;
@useResult
$Res call({
 String kind, String? date, int? count, String? fileCode
});




}
/// @nodoc
class _$FilesPlanningAlertModelCopyWithImpl<$Res>
    implements $FilesPlanningAlertModelCopyWith<$Res> {
  _$FilesPlanningAlertModelCopyWithImpl(this._self, this._then);

  final FilesPlanningAlertModel _self;
  final $Res Function(FilesPlanningAlertModel) _then;

/// Create a copy of FilesPlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? date = freezed,Object? count = freezed,Object? fileCode = freezed,}) {
  return _then(FilesPlanningAlertModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,date: freezed == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String?,count: freezed == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int?,fileCode: freezed == fileCode ? _self.fileCode : fileCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [FilesPlanningAlertModel].
extension FilesPlanningAlertModelPatterns on FilesPlanningAlertModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FilesPlanningAlertModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FilesPlanningAlertModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FilesPlanningAlertModel value)  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningAlertModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FilesPlanningAlertModel value)?  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningAlertModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  String? date,  int? count,  String? fileCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FilesPlanningAlertModel() when $default != null:
return $default(_that.kind,_that.date,_that.count,_that.fileCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  String? date,  int? count,  String? fileCode)  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningAlertModel():
return $default(_that.kind,_that.date,_that.count,_that.fileCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  String? date,  int? count,  String? fileCode)?  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningAlertModel() when $default != null:
return $default(_that.kind,_that.date,_that.count,_that.fileCode);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FilesPlanningAlertModel implements FilesPlanningAlertModel {
  const _FilesPlanningAlertModel({required this.kind, this.date, this.count, this.fileCode});
  factory _FilesPlanningAlertModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningAlertModelFromJson(json);

@override final  String kind;
@override final  String? date;
@override final  int? count;
@override final  String? fileCode;

/// Create a copy of FilesPlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FilesPlanningAlertModelCopyWith<_FilesPlanningAlertModel> get copyWith => __$FilesPlanningAlertModelCopyWithImpl<_FilesPlanningAlertModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FilesPlanningAlertModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FilesPlanningAlertModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.date, date) || other.date == date)&&(identical(other.count, count) || other.count == count)&&(identical(other.fileCode, fileCode) || other.fileCode == fileCode));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,date,count,fileCode);
}

@override
String toString() {
    return 'FilesPlanningAlertModel(kind: $kind, date: $date, count: $count, fileCode: $fileCode)';
}


}

/// @nodoc
abstract mixin class _$FilesPlanningAlertModelCopyWith<$Res> implements $FilesPlanningAlertModelCopyWith<$Res> {
  factory _$FilesPlanningAlertModelCopyWith(_FilesPlanningAlertModel value, $Res Function(_FilesPlanningAlertModel) _then) = __$FilesPlanningAlertModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, String? date, int? count, String? fileCode
});




}
/// @nodoc
class __$FilesPlanningAlertModelCopyWithImpl<$Res>
    implements _$FilesPlanningAlertModelCopyWith<$Res> {
  __$FilesPlanningAlertModelCopyWithImpl(this._self, this._then);

  final _FilesPlanningAlertModel _self;
  final $Res Function(_FilesPlanningAlertModel) _then;

/// Create a copy of FilesPlanningAlertModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? date = freezed,Object? count = freezed,Object? fileCode = freezed,}) {
  return _then(_FilesPlanningAlertModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,date: freezed == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String?,count: freezed == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int?,fileCode: freezed == fileCode ? _self.fileCode : fileCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$FilesPlanningModel {

 String get from; int get days; String get timezone;/// The parking's local day as the server reckons it (older API: absent, fall back to `from`).
 String? get today;/// Sum of the capacities of the active files.
 int get capacity; List<FilesPlanningFileModel> get files; List<FilesPlanningDayModel> get load; List<FilesPlanningAlertModel> get alerts;
/// Create a copy of FilesPlanningModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FilesPlanningModelCopyWith<FilesPlanningModel> get copyWith => _$FilesPlanningModelCopyWithImpl<FilesPlanningModel>(this as FilesPlanningModel, _$identity);

  /// Serializes this FilesPlanningModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FilesPlanningModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FilesPlanningModel&&(identical(other.from, _this.from) || other.from == _this.from)&&(identical(other.days, _this.days) || other.days == _this.days)&&(identical(other.timezone, _this.timezone) || other.timezone == _this.timezone)&&(identical(other.today, _this.today) || other.today == _this.today)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&const DeepCollectionEquality().equals(other.files, _this.files)&&const DeepCollectionEquality().equals(other.load, _this.load)&&const DeepCollectionEquality().equals(other.alerts, _this.alerts));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FilesPlanningModel;
  return Object.hash(runtimeType,_this.from,_this.days,_this.timezone,_this.today,_this.capacity,const DeepCollectionEquality().hash(_this.files),const DeepCollectionEquality().hash(_this.load),const DeepCollectionEquality().hash(_this.alerts));
}

@override
String toString() {
  final _this = this as FilesPlanningModel;
  return 'FilesPlanningModel(from: ${_this.from}, days: ${_this.days}, timezone: ${_this.timezone}, today: ${_this.today}, capacity: ${_this.capacity}, files: ${_this.files}, load: ${_this.load}, alerts: ${_this.alerts})';
}


}

/// @nodoc
abstract mixin class $FilesPlanningModelCopyWith<$Res>  {
  factory $FilesPlanningModelCopyWith(FilesPlanningModel value, $Res Function(FilesPlanningModel) _then) = _$FilesPlanningModelCopyWithImpl;
@useResult
$Res call({
 String from, int days, String timezone, String? today, int capacity, List<FilesPlanningFileModel> files, List<FilesPlanningDayModel> load, List<FilesPlanningAlertModel> alerts
});




}
/// @nodoc
class _$FilesPlanningModelCopyWithImpl<$Res>
    implements $FilesPlanningModelCopyWith<$Res> {
  _$FilesPlanningModelCopyWithImpl(this._self, this._then);

  final FilesPlanningModel _self;
  final $Res Function(FilesPlanningModel) _then;

/// Create a copy of FilesPlanningModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? from = null,Object? days = null,Object? timezone = null,Object? today = freezed,Object? capacity = null,Object? files = null,Object? load = null,Object? alerts = null,}) {
  return _then(FilesPlanningModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,today: freezed == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,files: null == files ? _self.files : files // ignore: cast_nullable_to_non_nullable
as List<FilesPlanningFileModel>,load: null == load ? _self.load : load // ignore: cast_nullable_to_non_nullable
as List<FilesPlanningDayModel>,alerts: null == alerts ? _self.alerts : alerts // ignore: cast_nullable_to_non_nullable
as List<FilesPlanningAlertModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [FilesPlanningModel].
extension FilesPlanningModelPatterns on FilesPlanningModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FilesPlanningModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FilesPlanningModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FilesPlanningModel value)  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FilesPlanningModel value)?  $default,){
final _that = this;
switch (_that) {
case _FilesPlanningModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String from,  int days,  String timezone,  String? today,  int capacity,  List<FilesPlanningFileModel> files,  List<FilesPlanningDayModel> load,  List<FilesPlanningAlertModel> alerts)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FilesPlanningModel() when $default != null:
return $default(_that.from,_that.days,_that.timezone,_that.today,_that.capacity,_that.files,_that.load,_that.alerts);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String from,  int days,  String timezone,  String? today,  int capacity,  List<FilesPlanningFileModel> files,  List<FilesPlanningDayModel> load,  List<FilesPlanningAlertModel> alerts)  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningModel():
return $default(_that.from,_that.days,_that.timezone,_that.today,_that.capacity,_that.files,_that.load,_that.alerts);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String from,  int days,  String timezone,  String? today,  int capacity,  List<FilesPlanningFileModel> files,  List<FilesPlanningDayModel> load,  List<FilesPlanningAlertModel> alerts)?  $default,) {final _that = this;
switch (_that) {
case _FilesPlanningModel() when $default != null:
return $default(_that.from,_that.days,_that.timezone,_that.today,_that.capacity,_that.files,_that.load,_that.alerts);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FilesPlanningModel implements FilesPlanningModel {
  const _FilesPlanningModel({required this.from, required this.days, required this.timezone, this.today, this.capacity = 0,  List<FilesPlanningFileModel> files = const <FilesPlanningFileModel>[],  List<FilesPlanningDayModel> load = const <FilesPlanningDayModel>[],  List<FilesPlanningAlertModel> alerts = const <FilesPlanningAlertModel>[]}): _files = files,_load = load,_alerts = alerts;
  factory _FilesPlanningModel.fromJson(Map<String, dynamic> json) => _$FilesPlanningModelFromJson(json);

@override final  String from;
@override final  int days;
@override final  String timezone;
/// The parking's local day as the server reckons it (older API: absent, fall back to `from`).
@override final  String? today;
/// Sum of the capacities of the active files.
@override@JsonKey() final  int capacity;
 final  List<FilesPlanningFileModel> _files;
@override@JsonKey() List<FilesPlanningFileModel> get files {
  if (_files is EqualUnmodifiableListView) return _files;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_files);
}

 final  List<FilesPlanningDayModel> _load;
@override@JsonKey() List<FilesPlanningDayModel> get load {
  if (_load is EqualUnmodifiableListView) return _load;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_load);
}

 final  List<FilesPlanningAlertModel> _alerts;
@override@JsonKey() List<FilesPlanningAlertModel> get alerts {
  if (_alerts is EqualUnmodifiableListView) return _alerts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_alerts);
}


/// Create a copy of FilesPlanningModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FilesPlanningModelCopyWith<_FilesPlanningModel> get copyWith => __$FilesPlanningModelCopyWithImpl<_FilesPlanningModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FilesPlanningModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FilesPlanningModel&&(identical(other.from, from) || other.from == from)&&(identical(other.days, days) || other.days == days)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.today, today) || other.today == today)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&const DeepCollectionEquality().equals(other.files, _files)&&const DeepCollectionEquality().equals(other.load, _load)&&const DeepCollectionEquality().equals(other.alerts, _alerts));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,from,days,timezone,today,capacity,const DeepCollectionEquality().hash(_files),const DeepCollectionEquality().hash(_load),const DeepCollectionEquality().hash(_alerts));
}

@override
String toString() {
    return 'FilesPlanningModel(from: $from, days: $days, timezone: $timezone, today: $today, capacity: $capacity, files: $files, load: $load, alerts: $alerts)';
}


}

/// @nodoc
abstract mixin class _$FilesPlanningModelCopyWith<$Res> implements $FilesPlanningModelCopyWith<$Res> {
  factory _$FilesPlanningModelCopyWith(_FilesPlanningModel value, $Res Function(_FilesPlanningModel) _then) = __$FilesPlanningModelCopyWithImpl;
@override @useResult
$Res call({
 String from, int days, String timezone, String? today, int capacity, List<FilesPlanningFileModel> files, List<FilesPlanningDayModel> load, List<FilesPlanningAlertModel> alerts
});




}
/// @nodoc
class __$FilesPlanningModelCopyWithImpl<$Res>
    implements _$FilesPlanningModelCopyWith<$Res> {
  __$FilesPlanningModelCopyWithImpl(this._self, this._then);

  final _FilesPlanningModel _self;
  final $Res Function(_FilesPlanningModel) _then;

/// Create a copy of FilesPlanningModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? from = null,Object? days = null,Object? timezone = null,Object? today = freezed,Object? capacity = null,Object? files = null,Object? load = null,Object? alerts = null,}) {
  return _then(_FilesPlanningModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,today: freezed == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,files: null == files ? _self._files : files // ignore: cast_nullable_to_non_nullable
as List<FilesPlanningFileModel>,load: null == load ? _self._load : load // ignore: cast_nullable_to_non_nullable
as List<FilesPlanningDayModel>,alerts: null == alerts ? _self._alerts : alerts // ignore: cast_nullable_to_non_nullable
as List<FilesPlanningAlertModel>,
  ));
}


}


/// @nodoc
mixin _$KeptFileModel {

 String get id; String get code; String? get name; int get capacity; bool get active; String? get plannedDay; bool get keptByHand;
/// Create a copy of KeptFileModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KeptFileModelCopyWith<KeptFileModel> get copyWith => _$KeptFileModelCopyWithImpl<KeptFileModel>(this as KeptFileModel, _$identity);

  /// Serializes this KeptFileModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as KeptFileModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KeptFileModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&(identical(other.active, _this.active) || other.active == _this.active)&&(identical(other.plannedDay, _this.plannedDay) || other.plannedDay == _this.plannedDay)&&(identical(other.keptByHand, _this.keptByHand) || other.keptByHand == _this.keptByHand));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as KeptFileModel;
  return Object.hash(runtimeType,_this.id,_this.code,_this.name,_this.capacity,_this.active,_this.plannedDay,_this.keptByHand);
}

@override
String toString() {
  final _this = this as KeptFileModel;
  return 'KeptFileModel(id: ${_this.id}, code: ${_this.code}, name: ${_this.name}, capacity: ${_this.capacity}, active: ${_this.active}, plannedDay: ${_this.plannedDay}, keptByHand: ${_this.keptByHand})';
}


}

/// @nodoc
abstract mixin class $KeptFileModelCopyWith<$Res>  {
  factory $KeptFileModelCopyWith(KeptFileModel value, $Res Function(KeptFileModel) _then) = _$KeptFileModelCopyWithImpl;
@useResult
$Res call({
 String id, String code, String? name, int capacity, bool active, String? plannedDay, bool keptByHand
});




}
/// @nodoc
class _$KeptFileModelCopyWithImpl<$Res>
    implements $KeptFileModelCopyWith<$Res> {
  _$KeptFileModelCopyWithImpl(this._self, this._then);

  final KeptFileModel _self;
  final $Res Function(KeptFileModel) _then;

/// Create a copy of KeptFileModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = freezed,Object? capacity = null,Object? active = null,Object? plannedDay = freezed,Object? keptByHand = null,}) {
  return _then(KeptFileModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,plannedDay: freezed == plannedDay ? _self.plannedDay : plannedDay // ignore: cast_nullable_to_non_nullable
as String?,keptByHand: null == keptByHand ? _self.keptByHand : keptByHand // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [KeptFileModel].
extension KeptFileModelPatterns on KeptFileModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KeptFileModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KeptFileModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KeptFileModel value)  $default,){
final _that = this;
switch (_that) {
case _KeptFileModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KeptFileModel value)?  $default,){
final _that = this;
switch (_that) {
case _KeptFileModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String? name,  int capacity,  bool active,  String? plannedDay,  bool keptByHand)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KeptFileModel() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.active,_that.plannedDay,_that.keptByHand);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String? name,  int capacity,  bool active,  String? plannedDay,  bool keptByHand)  $default,) {final _that = this;
switch (_that) {
case _KeptFileModel():
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.active,_that.plannedDay,_that.keptByHand);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String? name,  int capacity,  bool active,  String? plannedDay,  bool keptByHand)?  $default,) {final _that = this;
switch (_that) {
case _KeptFileModel() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.active,_that.plannedDay,_that.keptByHand);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KeptFileModel implements KeptFileModel {
  const _KeptFileModel({required this.id, required this.code, this.name, required this.capacity, this.active = true, this.plannedDay, this.keptByHand = false});
  factory _KeptFileModel.fromJson(Map<String, dynamic> json) => _$KeptFileModelFromJson(json);

@override final  String id;
@override final  String code;
@override final  String? name;
@override final  int capacity;
@override@JsonKey() final  bool active;
@override final  String? plannedDay;
@override@JsonKey() final  bool keptByHand;

/// Create a copy of KeptFileModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KeptFileModelCopyWith<_KeptFileModel> get copyWith => __$KeptFileModelCopyWithImpl<_KeptFileModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KeptFileModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _KeptFileModel&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&(identical(other.active, active) || other.active == active)&&(identical(other.plannedDay, plannedDay) || other.plannedDay == plannedDay)&&(identical(other.keptByHand, keptByHand) || other.keptByHand == keptByHand));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,code,name,capacity,active,plannedDay,keptByHand);
}

@override
String toString() {
    return 'KeptFileModel(id: $id, code: $code, name: $name, capacity: $capacity, active: $active, plannedDay: $plannedDay, keptByHand: $keptByHand)';
}


}

/// @nodoc
abstract mixin class _$KeptFileModelCopyWith<$Res> implements $KeptFileModelCopyWith<$Res> {
  factory _$KeptFileModelCopyWith(_KeptFileModel value, $Res Function(_KeptFileModel) _then) = __$KeptFileModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String? name, int capacity, bool active, String? plannedDay, bool keptByHand
});




}
/// @nodoc
class __$KeptFileModelCopyWithImpl<$Res>
    implements _$KeptFileModelCopyWith<$Res> {
  __$KeptFileModelCopyWithImpl(this._self, this._then);

  final _KeptFileModel _self;
  final $Res Function(_KeptFileModel) _then;

/// Create a copy of KeptFileModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = freezed,Object? capacity = null,Object? active = null,Object? plannedDay = freezed,Object? keptByHand = null,}) {
  return _then(_KeptFileModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,plannedDay: freezed == plannedDay ? _self.plannedDay : plannedDay // ignore: cast_nullable_to_non_nullable
as String?,keptByHand: null == keptByHand ? _self.keptByHand : keptByHand // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$KeptFileResponse {

 KeptFileModel get data;
/// Create a copy of KeptFileResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KeptFileResponseCopyWith<KeptFileResponse> get copyWith => _$KeptFileResponseCopyWithImpl<KeptFileResponse>(this as KeptFileResponse, _$identity);

  /// Serializes this KeptFileResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as KeptFileResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KeptFileResponse&&(identical(other.data, _this.data) || other.data == _this.data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as KeptFileResponse;
  return Object.hash(runtimeType,_this.data);
}

@override
String toString() {
  final _this = this as KeptFileResponse;
  return 'KeptFileResponse(data: ${_this.data})';
}


}

/// @nodoc
abstract mixin class $KeptFileResponseCopyWith<$Res>  {
  factory $KeptFileResponseCopyWith(KeptFileResponse value, $Res Function(KeptFileResponse) _then) = _$KeptFileResponseCopyWithImpl;
@useResult
$Res call({
 KeptFileModel data
});


$KeptFileModelCopyWith<$Res> get data;

}
/// @nodoc
class _$KeptFileResponseCopyWithImpl<$Res>
    implements $KeptFileResponseCopyWith<$Res> {
  _$KeptFileResponseCopyWithImpl(this._self, this._then);

  final KeptFileResponse _self;
  final $Res Function(KeptFileResponse) _then;

/// Create a copy of KeptFileResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? data = null,}) {
  return _then(KeptFileResponse(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as KeptFileModel,
  ));
}
/// Create a copy of KeptFileResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KeptFileModelCopyWith<$Res> get data {
  
  return $KeptFileModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [KeptFileResponse].
extension KeptFileResponsePatterns on KeptFileResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KeptFileResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KeptFileResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KeptFileResponse value)  $default,){
final _that = this;
switch (_that) {
case _KeptFileResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KeptFileResponse value)?  $default,){
final _that = this;
switch (_that) {
case _KeptFileResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( KeptFileModel data)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KeptFileResponse() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( KeptFileModel data)  $default,) {final _that = this;
switch (_that) {
case _KeptFileResponse():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( KeptFileModel data)?  $default,) {final _that = this;
switch (_that) {
case _KeptFileResponse() when $default != null:
return $default(_that.data);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KeptFileResponse implements KeptFileResponse {
  const _KeptFileResponse({required this.data});
  factory _KeptFileResponse.fromJson(Map<String, dynamic> json) => _$KeptFileResponseFromJson(json);

@override final  KeptFileModel data;

/// Create a copy of KeptFileResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KeptFileResponseCopyWith<_KeptFileResponse> get copyWith => __$KeptFileResponseCopyWithImpl<_KeptFileResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KeptFileResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _KeptFileResponse&&(identical(other.data, data) || other.data == data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,data);
}

@override
String toString() {
    return 'KeptFileResponse(data: $data)';
}


}

/// @nodoc
abstract mixin class _$KeptFileResponseCopyWith<$Res> implements $KeptFileResponseCopyWith<$Res> {
  factory _$KeptFileResponseCopyWith(_KeptFileResponse value, $Res Function(_KeptFileResponse) _then) = __$KeptFileResponseCopyWithImpl;
@override @useResult
$Res call({
 KeptFileModel data
});


@override $KeptFileModelCopyWith<$Res> get data;

}
/// @nodoc
class __$KeptFileResponseCopyWithImpl<$Res>
    implements _$KeptFileResponseCopyWith<$Res> {
  __$KeptFileResponseCopyWithImpl(this._self, this._then);

  final _KeptFileResponse _self;
  final $Res Function(_KeptFileResponse) _then;

/// Create a copy of KeptFileResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? data = null,}) {
  return _then(_KeptFileResponse(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as KeptFileModel,
  ));
}

/// Create a copy of KeptFileResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KeptFileModelCopyWith<$Res> get data {
  
  return $KeptFileModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
