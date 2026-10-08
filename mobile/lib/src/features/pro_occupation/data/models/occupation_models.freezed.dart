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

 String get id; String get reference; String get customerName; String get plate; String get status; String get arrivalAt; String get returnAt; String? get returnFlight; String? get spotId; String? get keyHook;/// Where the car is parked (06/10/2026), when recorded (by the traveller or the staff).
 double? get carLat; double? get carLng; int? get carAccuracyM; DateTime? get carLocatedAt; String? get carLocatedBy; String? get carNote; bool get onSite; bool get leavesToday;/// D-B (07/10/2026): nights of the stay and its class (short, medium, long), for the plan by stay.
 int? get nights; String? get stayClass;/// Search results carry the spot's code.
 SpotRefModel? get spot;/// Arrivals to place carry their suggestions.
 List<SuggestionModel> get suggestions;/// S-C (07/10/2026): the file the car stands in and its position from the aisle (1 = first out).
 FileRefModel? get file; int? get filePosition; int? get position;/// Cars in front that leave later: to take out before this one (file board).
 List<FileBlockerModel> get blockedBy;/// Arrivals of the file board: the ranked files and the one the rule picks.
 List<FileChoiceModel> get choices; FileChoiceModel? get suggested;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OccupantModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.returnFlight, _this.returnFlight) || other.returnFlight == _this.returnFlight)&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.keyHook, _this.keyHook) || other.keyHook == _this.keyHook)&&(identical(other.carLat, _this.carLat) || other.carLat == _this.carLat)&&(identical(other.carLng, _this.carLng) || other.carLng == _this.carLng)&&(identical(other.carAccuracyM, _this.carAccuracyM) || other.carAccuracyM == _this.carAccuracyM)&&(identical(other.carLocatedAt, _this.carLocatedAt) || other.carLocatedAt == _this.carLocatedAt)&&(identical(other.carLocatedBy, _this.carLocatedBy) || other.carLocatedBy == _this.carLocatedBy)&&(identical(other.carNote, _this.carNote) || other.carNote == _this.carNote)&&(identical(other.onSite, _this.onSite) || other.onSite == _this.onSite)&&(identical(other.leavesToday, _this.leavesToday) || other.leavesToday == _this.leavesToday)&&(identical(other.nights, _this.nights) || other.nights == _this.nights)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass)&&(identical(other.spot, _this.spot) || other.spot == _this.spot)&&const DeepCollectionEquality().equals(other.suggestions, _this.suggestions)&&(identical(other.file, _this.file) || other.file == _this.file)&&(identical(other.filePosition, _this.filePosition) || other.filePosition == _this.filePosition)&&(identical(other.position, _this.position) || other.position == _this.position)&&const DeepCollectionEquality().equals(other.blockedBy, _this.blockedBy)&&const DeepCollectionEquality().equals(other.choices, _this.choices)&&(identical(other.suggested, _this.suggested) || other.suggested == _this.suggested));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OccupantModel;
  return Object.hashAll([runtimeType,_this.id,_this.reference,_this.customerName,_this.plate,_this.status,_this.arrivalAt,_this.returnAt,_this.returnFlight,_this.spotId,_this.keyHook,_this.carLat,_this.carLng,_this.carAccuracyM,_this.carLocatedAt,_this.carLocatedBy,_this.carNote,_this.onSite,_this.leavesToday,_this.nights,_this.stayClass,_this.spot,const DeepCollectionEquality().hash(_this.suggestions),_this.file,_this.filePosition,_this.position,const DeepCollectionEquality().hash(_this.blockedBy),const DeepCollectionEquality().hash(_this.choices),_this.suggested]);
}

@override
String toString() {
  final _this = this as OccupantModel;
  return 'OccupantModel(id: ${_this.id}, reference: ${_this.reference}, customerName: ${_this.customerName}, plate: ${_this.plate}, status: ${_this.status}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, returnFlight: ${_this.returnFlight}, spotId: ${_this.spotId}, keyHook: ${_this.keyHook}, carLat: ${_this.carLat}, carLng: ${_this.carLng}, carAccuracyM: ${_this.carAccuracyM}, carLocatedAt: ${_this.carLocatedAt}, carLocatedBy: ${_this.carLocatedBy}, carNote: ${_this.carNote}, onSite: ${_this.onSite}, leavesToday: ${_this.leavesToday}, nights: ${_this.nights}, stayClass: ${_this.stayClass}, spot: ${_this.spot}, suggestions: ${_this.suggestions}, file: ${_this.file}, filePosition: ${_this.filePosition}, position: ${_this.position}, blockedBy: ${_this.blockedBy}, choices: ${_this.choices}, suggested: ${_this.suggested})';
}


}

/// @nodoc
abstract mixin class $OccupantModelCopyWith<$Res>  {
  factory $OccupantModelCopyWith(OccupantModel value, $Res Function(OccupantModel) _then) = _$OccupantModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String customerName, String plate, String status, String arrivalAt, String returnAt, String? returnFlight, String? spotId, String? keyHook, double? carLat, double? carLng, int? carAccuracyM, DateTime? carLocatedAt, String? carLocatedBy, String? carNote, bool onSite, bool leavesToday, int? nights, String? stayClass, SpotRefModel? spot, List<SuggestionModel> suggestions, FileRefModel? file, int? filePosition, int? position, List<FileBlockerModel> blockedBy, List<FileChoiceModel> choices, FileChoiceModel? suggested
});


$SpotRefModelCopyWith<$Res>? get spot;$FileRefModelCopyWith<$Res>? get file;$FileChoiceModelCopyWith<$Res>? get suggested;

}
/// @nodoc
class _$OccupantModelCopyWithImpl<$Res>
    implements $OccupantModelCopyWith<$Res> {
  _$OccupantModelCopyWithImpl(this._self, this._then);

  final OccupantModel _self;
  final $Res Function(OccupantModel) _then;

/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? returnFlight = freezed,Object? spotId = freezed,Object? keyHook = freezed,Object? carLat = freezed,Object? carLng = freezed,Object? carAccuracyM = freezed,Object? carLocatedAt = freezed,Object? carLocatedBy = freezed,Object? carNote = freezed,Object? onSite = null,Object? leavesToday = null,Object? nights = freezed,Object? stayClass = freezed,Object? spot = freezed,Object? suggestions = null,Object? file = freezed,Object? filePosition = freezed,Object? position = freezed,Object? blockedBy = null,Object? choices = null,Object? suggested = freezed,}) {
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
as String?,carLat: freezed == carLat ? _self.carLat : carLat // ignore: cast_nullable_to_non_nullable
as double?,carLng: freezed == carLng ? _self.carLng : carLng // ignore: cast_nullable_to_non_nullable
as double?,carAccuracyM: freezed == carAccuracyM ? _self.carAccuracyM : carAccuracyM // ignore: cast_nullable_to_non_nullable
as int?,carLocatedAt: freezed == carLocatedAt ? _self.carLocatedAt : carLocatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,carLocatedBy: freezed == carLocatedBy ? _self.carLocatedBy : carLocatedBy // ignore: cast_nullable_to_non_nullable
as String?,carNote: freezed == carNote ? _self.carNote : carNote // ignore: cast_nullable_to_non_nullable
as String?,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as bool,leavesToday: null == leavesToday ? _self.leavesToday : leavesToday // ignore: cast_nullable_to_non_nullable
as bool,nights: freezed == nights ? _self.nights : nights // ignore: cast_nullable_to_non_nullable
as int?,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as SpotRefModel?,suggestions: null == suggestions ? _self.suggestions : suggestions // ignore: cast_nullable_to_non_nullable
as List<SuggestionModel>,file: freezed == file ? _self.file : file // ignore: cast_nullable_to_non_nullable
as FileRefModel?,filePosition: freezed == filePosition ? _self.filePosition : filePosition // ignore: cast_nullable_to_non_nullable
as int?,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as int?,blockedBy: null == blockedBy ? _self.blockedBy : blockedBy // ignore: cast_nullable_to_non_nullable
as List<FileBlockerModel>,choices: null == choices ? _self.choices : choices // ignore: cast_nullable_to_non_nullable
as List<FileChoiceModel>,suggested: freezed == suggested ? _self.suggested : suggested // ignore: cast_nullable_to_non_nullable
as FileChoiceModel?,
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
}/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FileRefModelCopyWith<$Res>? get file {
    if (_self.file == null) {
    return null;
  }

  return $FileRefModelCopyWith<$Res>(_self.file!, (value) {
    return _then(_self.copyWith(file: value));
  });
}/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FileChoiceModelCopyWith<$Res>? get suggested {
    if (_self.suggested == null) {
    return null;
  }

  return $FileChoiceModelCopyWith<$Res>(_self.suggested!, (value) {
    return _then(_self.copyWith(suggested: value));
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String plate,  String status,  String arrivalAt,  String returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  double? carLat,  double? carLng,  int? carAccuracyM,  DateTime? carLocatedAt,  String? carLocatedBy,  String? carNote,  bool onSite,  bool leavesToday,  int? nights,  String? stayClass,  SpotRefModel? spot,  List<SuggestionModel> suggestions,  FileRefModel? file,  int? filePosition,  int? position,  List<FileBlockerModel> blockedBy,  List<FileChoiceModel> choices,  FileChoiceModel? suggested)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OccupantModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.carLat,_that.carLng,_that.carAccuracyM,_that.carLocatedAt,_that.carLocatedBy,_that.carNote,_that.onSite,_that.leavesToday,_that.nights,_that.stayClass,_that.spot,_that.suggestions,_that.file,_that.filePosition,_that.position,_that.blockedBy,_that.choices,_that.suggested);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String plate,  String status,  String arrivalAt,  String returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  double? carLat,  double? carLng,  int? carAccuracyM,  DateTime? carLocatedAt,  String? carLocatedBy,  String? carNote,  bool onSite,  bool leavesToday,  int? nights,  String? stayClass,  SpotRefModel? spot,  List<SuggestionModel> suggestions,  FileRefModel? file,  int? filePosition,  int? position,  List<FileBlockerModel> blockedBy,  List<FileChoiceModel> choices,  FileChoiceModel? suggested)  $default,) {final _that = this;
switch (_that) {
case _OccupantModel():
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.carLat,_that.carLng,_that.carAccuracyM,_that.carLocatedAt,_that.carLocatedBy,_that.carNote,_that.onSite,_that.leavesToday,_that.nights,_that.stayClass,_that.spot,_that.suggestions,_that.file,_that.filePosition,_that.position,_that.blockedBy,_that.choices,_that.suggested);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String customerName,  String plate,  String status,  String arrivalAt,  String returnAt,  String? returnFlight,  String? spotId,  String? keyHook,  double? carLat,  double? carLng,  int? carAccuracyM,  DateTime? carLocatedAt,  String? carLocatedBy,  String? carNote,  bool onSite,  bool leavesToday,  int? nights,  String? stayClass,  SpotRefModel? spot,  List<SuggestionModel> suggestions,  FileRefModel? file,  int? filePosition,  int? position,  List<FileBlockerModel> blockedBy,  List<FileChoiceModel> choices,  FileChoiceModel? suggested)?  $default,) {final _that = this;
switch (_that) {
case _OccupantModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.status,_that.arrivalAt,_that.returnAt,_that.returnFlight,_that.spotId,_that.keyHook,_that.carLat,_that.carLng,_that.carAccuracyM,_that.carLocatedAt,_that.carLocatedBy,_that.carNote,_that.onSite,_that.leavesToday,_that.nights,_that.stayClass,_that.spot,_that.suggestions,_that.file,_that.filePosition,_that.position,_that.blockedBy,_that.choices,_that.suggested);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OccupantModel implements OccupantModel {
  const _OccupantModel({required this.id, required this.reference, required this.customerName, required this.plate, required this.status, required this.arrivalAt, required this.returnAt, this.returnFlight, this.spotId, this.keyHook, this.carLat, this.carLng, this.carAccuracyM, this.carLocatedAt, this.carLocatedBy, this.carNote, this.onSite = false, this.leavesToday = false, this.nights, this.stayClass, this.spot,  List<SuggestionModel> suggestions = const [], this.file, this.filePosition, this.position,  List<FileBlockerModel> blockedBy = const <FileBlockerModel>[],  List<FileChoiceModel> choices = const <FileChoiceModel>[], this.suggested}): _suggestions = suggestions,_blockedBy = blockedBy,_choices = choices;
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
/// Where the car is parked (06/10/2026), when recorded (by the traveller or the staff).
@override final  double? carLat;
@override final  double? carLng;
@override final  int? carAccuracyM;
@override final  DateTime? carLocatedAt;
@override final  String? carLocatedBy;
@override final  String? carNote;
@override@JsonKey() final  bool onSite;
@override@JsonKey() final  bool leavesToday;
/// D-B (07/10/2026): nights of the stay and its class (short, medium, long), for the plan by stay.
@override final  int? nights;
@override final  String? stayClass;
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

/// S-C (07/10/2026): the file the car stands in and its position from the aisle (1 = first out).
@override final  FileRefModel? file;
@override final  int? filePosition;
@override final  int? position;
/// Cars in front that leave later: to take out before this one (file board).
 final  List<FileBlockerModel> _blockedBy;
/// Cars in front that leave later: to take out before this one (file board).
@override@JsonKey() List<FileBlockerModel> get blockedBy {
  if (_blockedBy is EqualUnmodifiableListView) return _blockedBy;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_blockedBy);
}

/// Arrivals of the file board: the ranked files and the one the rule picks.
 final  List<FileChoiceModel> _choices;
/// Arrivals of the file board: the ranked files and the one the rule picks.
@override@JsonKey() List<FileChoiceModel> get choices {
  if (_choices is EqualUnmodifiableListView) return _choices;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_choices);
}

@override final  FileChoiceModel? suggested;

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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OccupantModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.status, status) || other.status == status)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.returnFlight, returnFlight) || other.returnFlight == returnFlight)&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.keyHook, keyHook) || other.keyHook == keyHook)&&(identical(other.carLat, carLat) || other.carLat == carLat)&&(identical(other.carLng, carLng) || other.carLng == carLng)&&(identical(other.carAccuracyM, carAccuracyM) || other.carAccuracyM == carAccuracyM)&&(identical(other.carLocatedAt, carLocatedAt) || other.carLocatedAt == carLocatedAt)&&(identical(other.carLocatedBy, carLocatedBy) || other.carLocatedBy == carLocatedBy)&&(identical(other.carNote, carNote) || other.carNote == carNote)&&(identical(other.onSite, onSite) || other.onSite == onSite)&&(identical(other.leavesToday, leavesToday) || other.leavesToday == leavesToday)&&(identical(other.nights, nights) || other.nights == nights)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass)&&(identical(other.spot, spot) || other.spot == spot)&&const DeepCollectionEquality().equals(other.suggestions, _suggestions)&&(identical(other.file, file) || other.file == file)&&(identical(other.filePosition, filePosition) || other.filePosition == filePosition)&&(identical(other.position, position) || other.position == position)&&const DeepCollectionEquality().equals(other.blockedBy, _blockedBy)&&const DeepCollectionEquality().equals(other.choices, _choices)&&(identical(other.suggested, suggested) || other.suggested == suggested));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,id,reference,customerName,plate,status,arrivalAt,returnAt,returnFlight,spotId,keyHook,carLat,carLng,carAccuracyM,carLocatedAt,carLocatedBy,carNote,onSite,leavesToday,nights,stayClass,spot,const DeepCollectionEquality().hash(_suggestions),file,filePosition,position,const DeepCollectionEquality().hash(_blockedBy),const DeepCollectionEquality().hash(_choices),suggested]);
}

@override
String toString() {
    return 'OccupantModel(id: $id, reference: $reference, customerName: $customerName, plate: $plate, status: $status, arrivalAt: $arrivalAt, returnAt: $returnAt, returnFlight: $returnFlight, spotId: $spotId, keyHook: $keyHook, carLat: $carLat, carLng: $carLng, carAccuracyM: $carAccuracyM, carLocatedAt: $carLocatedAt, carLocatedBy: $carLocatedBy, carNote: $carNote, onSite: $onSite, leavesToday: $leavesToday, nights: $nights, stayClass: $stayClass, spot: $spot, suggestions: $suggestions, file: $file, filePosition: $filePosition, position: $position, blockedBy: $blockedBy, choices: $choices, suggested: $suggested)';
}


}

/// @nodoc
abstract mixin class _$OccupantModelCopyWith<$Res> implements $OccupantModelCopyWith<$Res> {
  factory _$OccupantModelCopyWith(_OccupantModel value, $Res Function(_OccupantModel) _then) = __$OccupantModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String customerName, String plate, String status, String arrivalAt, String returnAt, String? returnFlight, String? spotId, String? keyHook, double? carLat, double? carLng, int? carAccuracyM, DateTime? carLocatedAt, String? carLocatedBy, String? carNote, bool onSite, bool leavesToday, int? nights, String? stayClass, SpotRefModel? spot, List<SuggestionModel> suggestions, FileRefModel? file, int? filePosition, int? position, List<FileBlockerModel> blockedBy, List<FileChoiceModel> choices, FileChoiceModel? suggested
});


@override $SpotRefModelCopyWith<$Res>? get spot;@override $FileRefModelCopyWith<$Res>? get file;@override $FileChoiceModelCopyWith<$Res>? get suggested;

}
/// @nodoc
class __$OccupantModelCopyWithImpl<$Res>
    implements _$OccupantModelCopyWith<$Res> {
  __$OccupantModelCopyWithImpl(this._self, this._then);

  final _OccupantModel _self;
  final $Res Function(_OccupantModel) _then;

/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = null,Object? status = null,Object? arrivalAt = null,Object? returnAt = null,Object? returnFlight = freezed,Object? spotId = freezed,Object? keyHook = freezed,Object? carLat = freezed,Object? carLng = freezed,Object? carAccuracyM = freezed,Object? carLocatedAt = freezed,Object? carLocatedBy = freezed,Object? carNote = freezed,Object? onSite = null,Object? leavesToday = null,Object? nights = freezed,Object? stayClass = freezed,Object? spot = freezed,Object? suggestions = null,Object? file = freezed,Object? filePosition = freezed,Object? position = freezed,Object? blockedBy = null,Object? choices = null,Object? suggested = freezed,}) {
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
as String?,carLat: freezed == carLat ? _self.carLat : carLat // ignore: cast_nullable_to_non_nullable
as double?,carLng: freezed == carLng ? _self.carLng : carLng // ignore: cast_nullable_to_non_nullable
as double?,carAccuracyM: freezed == carAccuracyM ? _self.carAccuracyM : carAccuracyM // ignore: cast_nullable_to_non_nullable
as int?,carLocatedAt: freezed == carLocatedAt ? _self.carLocatedAt : carLocatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,carLocatedBy: freezed == carLocatedBy ? _self.carLocatedBy : carLocatedBy // ignore: cast_nullable_to_non_nullable
as String?,carNote: freezed == carNote ? _self.carNote : carNote // ignore: cast_nullable_to_non_nullable
as String?,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as bool,leavesToday: null == leavesToday ? _self.leavesToday : leavesToday // ignore: cast_nullable_to_non_nullable
as bool,nights: freezed == nights ? _self.nights : nights // ignore: cast_nullable_to_non_nullable
as int?,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,spot: freezed == spot ? _self.spot : spot // ignore: cast_nullable_to_non_nullable
as SpotRefModel?,suggestions: null == suggestions ? _self._suggestions : suggestions // ignore: cast_nullable_to_non_nullable
as List<SuggestionModel>,file: freezed == file ? _self.file : file // ignore: cast_nullable_to_non_nullable
as FileRefModel?,filePosition: freezed == filePosition ? _self.filePosition : filePosition // ignore: cast_nullable_to_non_nullable
as int?,position: freezed == position ? _self.position : position // ignore: cast_nullable_to_non_nullable
as int?,blockedBy: null == blockedBy ? _self._blockedBy : blockedBy // ignore: cast_nullable_to_non_nullable
as List<FileBlockerModel>,choices: null == choices ? _self._choices : choices // ignore: cast_nullable_to_non_nullable
as List<FileChoiceModel>,suggested: freezed == suggested ? _self.suggested : suggested // ignore: cast_nullable_to_non_nullable
as FileChoiceModel?,
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
}/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FileRefModelCopyWith<$Res>? get file {
    if (_self.file == null) {
    return null;
  }

  return $FileRefModelCopyWith<$Res>(_self.file!, (value) {
    return _then(_self.copyWith(file: value));
  });
}/// Create a copy of OccupantModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FileChoiceModelCopyWith<$Res>? get suggested {
    if (_self.suggested == null) {
    return null;
  }

  return $FileChoiceModelCopyWith<$Res>(_self.suggested!, (value) {
    return _then(_self.copyWith(suggested: value));
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
mixin _$BlockerModel {

 String get reservationId; String get reference; String get spotCode; DateTime get returnAt;
/// Create a copy of BlockerModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BlockerModelCopyWith<BlockerModel> get copyWith => _$BlockerModelCopyWithImpl<BlockerModel>(this as BlockerModel, _$identity);

  /// Serializes this BlockerModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as BlockerModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BlockerModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.spotCode, _this.spotCode) || other.spotCode == _this.spotCode)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as BlockerModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.spotCode,_this.returnAt);
}

@override
String toString() {
  final _this = this as BlockerModel;
  return 'BlockerModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, spotCode: ${_this.spotCode}, returnAt: ${_this.returnAt})';
}


}

/// @nodoc
abstract mixin class $BlockerModelCopyWith<$Res>  {
  factory $BlockerModelCopyWith(BlockerModel value, $Res Function(BlockerModel) _then) = _$BlockerModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String spotCode, DateTime returnAt
});




}
/// @nodoc
class _$BlockerModelCopyWithImpl<$Res>
    implements $BlockerModelCopyWith<$Res> {
  _$BlockerModelCopyWithImpl(this._self, this._then);

  final BlockerModel _self;
  final $Res Function(BlockerModel) _then;

/// Create a copy of BlockerModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? spotCode = null,Object? returnAt = null,}) {
  return _then(BlockerModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,spotCode: null == spotCode ? _self.spotCode : spotCode // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [BlockerModel].
extension BlockerModelPatterns on BlockerModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BlockerModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BlockerModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BlockerModel value)  $default,){
final _that = this;
switch (_that) {
case _BlockerModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BlockerModel value)?  $default,){
final _that = this;
switch (_that) {
case _BlockerModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String spotCode,  DateTime returnAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BlockerModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.spotCode,_that.returnAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String spotCode,  DateTime returnAt)  $default,) {final _that = this;
switch (_that) {
case _BlockerModel():
return $default(_that.reservationId,_that.reference,_that.spotCode,_that.returnAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String spotCode,  DateTime returnAt)?  $default,) {final _that = this;
switch (_that) {
case _BlockerModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.spotCode,_that.returnAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BlockerModel implements BlockerModel {
  const _BlockerModel({required this.reservationId, required this.reference, required this.spotCode, required this.returnAt});
  factory _BlockerModel.fromJson(Map<String, dynamic> json) => _$BlockerModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String spotCode;
@override final  DateTime returnAt;

/// Create a copy of BlockerModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BlockerModelCopyWith<_BlockerModel> get copyWith => __$BlockerModelCopyWithImpl<_BlockerModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BlockerModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BlockerModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.spotCode, spotCode) || other.spotCode == spotCode)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,spotCode,returnAt);
}

@override
String toString() {
    return 'BlockerModel(reservationId: $reservationId, reference: $reference, spotCode: $spotCode, returnAt: $returnAt)';
}


}

/// @nodoc
abstract mixin class _$BlockerModelCopyWith<$Res> implements $BlockerModelCopyWith<$Res> {
  factory _$BlockerModelCopyWith(_BlockerModel value, $Res Function(_BlockerModel) _then) = __$BlockerModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String spotCode, DateTime returnAt
});




}
/// @nodoc
class __$BlockerModelCopyWithImpl<$Res>
    implements _$BlockerModelCopyWith<$Res> {
  __$BlockerModelCopyWithImpl(this._self, this._then);

  final _BlockerModel _self;
  final $Res Function(_BlockerModel) _then;

/// Create a copy of BlockerModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? spotCode = null,Object? returnAt = null,}) {
  return _then(_BlockerModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,spotCode: null == spotCode ? _self.spotCode : spotCode // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$SuggestionModel {

 String get spotId; String get code; int? get distanceM; String get reason; String? get stayClass;/// O-A (06/10/2026): cars to move because of this choice (0: the file stays sound).
 int get moves; List<BlockerModel> get blocking; List<BlockerModel> get blocked;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SuggestionModel&&(identical(other.spotId, _this.spotId) || other.spotId == _this.spotId)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.distanceM, _this.distanceM) || other.distanceM == _this.distanceM)&&(identical(other.reason, _this.reason) || other.reason == _this.reason)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass)&&(identical(other.moves, _this.moves) || other.moves == _this.moves)&&const DeepCollectionEquality().equals(other.blocking, _this.blocking)&&const DeepCollectionEquality().equals(other.blocked, _this.blocked));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SuggestionModel;
  return Object.hash(runtimeType,_this.spotId,_this.code,_this.distanceM,_this.reason,_this.stayClass,_this.moves,const DeepCollectionEquality().hash(_this.blocking),const DeepCollectionEquality().hash(_this.blocked));
}

@override
String toString() {
  final _this = this as SuggestionModel;
  return 'SuggestionModel(spotId: ${_this.spotId}, code: ${_this.code}, distanceM: ${_this.distanceM}, reason: ${_this.reason}, stayClass: ${_this.stayClass}, moves: ${_this.moves}, blocking: ${_this.blocking}, blocked: ${_this.blocked})';
}


}

/// @nodoc
abstract mixin class $SuggestionModelCopyWith<$Res>  {
  factory $SuggestionModelCopyWith(SuggestionModel value, $Res Function(SuggestionModel) _then) = _$SuggestionModelCopyWithImpl;
@useResult
$Res call({
 String spotId, String code, int? distanceM, String reason, String? stayClass, int moves, List<BlockerModel> blocking, List<BlockerModel> blocked
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
@pragma('vm:prefer-inline') @override $Res call({Object? spotId = null,Object? code = null,Object? distanceM = freezed,Object? reason = null,Object? stayClass = freezed,Object? moves = null,Object? blocking = null,Object? blocked = null,}) {
  return _then(SuggestionModel(
spotId: null == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,moves: null == moves ? _self.moves : moves // ignore: cast_nullable_to_non_nullable
as int,blocking: null == blocking ? _self.blocking : blocking // ignore: cast_nullable_to_non_nullable
as List<BlockerModel>,blocked: null == blocked ? _self.blocked : blocked // ignore: cast_nullable_to_non_nullable
as List<BlockerModel>,
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String spotId,  String code,  int? distanceM,  String reason,  String? stayClass,  int moves,  List<BlockerModel> blocking,  List<BlockerModel> blocked)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SuggestionModel() when $default != null:
return $default(_that.spotId,_that.code,_that.distanceM,_that.reason,_that.stayClass,_that.moves,_that.blocking,_that.blocked);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String spotId,  String code,  int? distanceM,  String reason,  String? stayClass,  int moves,  List<BlockerModel> blocking,  List<BlockerModel> blocked)  $default,) {final _that = this;
switch (_that) {
case _SuggestionModel():
return $default(_that.spotId,_that.code,_that.distanceM,_that.reason,_that.stayClass,_that.moves,_that.blocking,_that.blocked);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String spotId,  String code,  int? distanceM,  String reason,  String? stayClass,  int moves,  List<BlockerModel> blocking,  List<BlockerModel> blocked)?  $default,) {final _that = this;
switch (_that) {
case _SuggestionModel() when $default != null:
return $default(_that.spotId,_that.code,_that.distanceM,_that.reason,_that.stayClass,_that.moves,_that.blocking,_that.blocked);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SuggestionModel implements SuggestionModel {
  const _SuggestionModel({required this.spotId, required this.code, this.distanceM, required this.reason, this.stayClass, this.moves = 0,  List<BlockerModel> blocking = const <BlockerModel>[],  List<BlockerModel> blocked = const <BlockerModel>[]}): _blocking = blocking,_blocked = blocked;
  factory _SuggestionModel.fromJson(Map<String, dynamic> json) => _$SuggestionModelFromJson(json);

@override final  String spotId;
@override final  String code;
@override final  int? distanceM;
@override final  String reason;
@override final  String? stayClass;
/// O-A (06/10/2026): cars to move because of this choice (0: the file stays sound).
@override@JsonKey() final  int moves;
 final  List<BlockerModel> _blocking;
@override@JsonKey() List<BlockerModel> get blocking {
  if (_blocking is EqualUnmodifiableListView) return _blocking;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_blocking);
}

 final  List<BlockerModel> _blocked;
@override@JsonKey() List<BlockerModel> get blocked {
  if (_blocked is EqualUnmodifiableListView) return _blocked;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_blocked);
}


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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SuggestionModel&&(identical(other.spotId, spotId) || other.spotId == spotId)&&(identical(other.code, code) || other.code == code)&&(identical(other.distanceM, distanceM) || other.distanceM == distanceM)&&(identical(other.reason, reason) || other.reason == reason)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass)&&(identical(other.moves, moves) || other.moves == moves)&&const DeepCollectionEquality().equals(other.blocking, _blocking)&&const DeepCollectionEquality().equals(other.blocked, _blocked));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,spotId,code,distanceM,reason,stayClass,moves,const DeepCollectionEquality().hash(_blocking),const DeepCollectionEquality().hash(_blocked));
}

@override
String toString() {
    return 'SuggestionModel(spotId: $spotId, code: $code, distanceM: $distanceM, reason: $reason, stayClass: $stayClass, moves: $moves, blocking: $blocking, blocked: $blocked)';
}


}

/// @nodoc
abstract mixin class _$SuggestionModelCopyWith<$Res> implements $SuggestionModelCopyWith<$Res> {
  factory _$SuggestionModelCopyWith(_SuggestionModel value, $Res Function(_SuggestionModel) _then) = __$SuggestionModelCopyWithImpl;
@override @useResult
$Res call({
 String spotId, String code, int? distanceM, String reason, String? stayClass, int moves, List<BlockerModel> blocking, List<BlockerModel> blocked
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
@override @pragma('vm:prefer-inline') $Res call({Object? spotId = null,Object? code = null,Object? distanceM = freezed,Object? reason = null,Object? stayClass = freezed,Object? moves = null,Object? blocking = null,Object? blocked = null,}) {
  return _then(_SuggestionModel(
spotId: null == spotId ? _self.spotId : spotId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,distanceM: freezed == distanceM ? _self.distanceM : distanceM // ignore: cast_nullable_to_non_nullable
as int?,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,moves: null == moves ? _self.moves : moves // ignore: cast_nullable_to_non_nullable
as int,blocking: null == blocking ? _self._blocking : blocking // ignore: cast_nullable_to_non_nullable
as List<BlockerModel>,blocked: null == blocked ? _self._blocked : blocked // ignore: cast_nullable_to_non_nullable
as List<BlockerModel>,
  ));
}


}


/// @nodoc
mixin _$SpotStateModel {

 String get id; String get zoneId; String get code; int get row; int get index; String get kind; bool get active; List<List<double>> get geometry;/// Z-A: short, medium or long stay zone (valet layouts).
 String? get stayClass; OccupantModel? get occupant;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SpotStateModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.zoneId, _this.zoneId) || other.zoneId == _this.zoneId)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.row, _this.row) || other.row == _this.row)&&(identical(other.index, _this.index) || other.index == _this.index)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.active, _this.active) || other.active == _this.active)&&const DeepCollectionEquality().equals(other.geometry, _this.geometry)&&(identical(other.stayClass, _this.stayClass) || other.stayClass == _this.stayClass)&&(identical(other.occupant, _this.occupant) || other.occupant == _this.occupant));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SpotStateModel;
  return Object.hash(runtimeType,_this.id,_this.zoneId,_this.code,_this.row,_this.index,_this.kind,_this.active,const DeepCollectionEquality().hash(_this.geometry),_this.stayClass,_this.occupant);
}

@override
String toString() {
  final _this = this as SpotStateModel;
  return 'SpotStateModel(id: ${_this.id}, zoneId: ${_this.zoneId}, code: ${_this.code}, row: ${_this.row}, index: ${_this.index}, kind: ${_this.kind}, active: ${_this.active}, geometry: ${_this.geometry}, stayClass: ${_this.stayClass}, occupant: ${_this.occupant})';
}


}

/// @nodoc
abstract mixin class $SpotStateModelCopyWith<$Res>  {
  factory $SpotStateModelCopyWith(SpotStateModel value, $Res Function(SpotStateModel) _then) = _$SpotStateModelCopyWithImpl;
@useResult
$Res call({
 String id, String zoneId, String code, int row, int index, String kind, bool active, List<List<double>> geometry, String? stayClass, OccupantModel? occupant
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
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? zoneId = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? geometry = null,Object? stayClass = freezed,Object? occupant = freezed,}) {
  return _then(SpotStateModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,zoneId: null == zoneId ? _self.zoneId : zoneId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,geometry: null == geometry ? _self.geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,occupant: freezed == occupant ? _self.occupant : occupant // ignore: cast_nullable_to_non_nullable
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  List<List<double>> geometry,  String? stayClass,  OccupantModel? occupant)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SpotStateModel() when $default != null:
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.geometry,_that.stayClass,_that.occupant);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  List<List<double>> geometry,  String? stayClass,  OccupantModel? occupant)  $default,) {final _that = this;
switch (_that) {
case _SpotStateModel():
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.geometry,_that.stayClass,_that.occupant);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String zoneId,  String code,  int row,  int index,  String kind,  bool active,  List<List<double>> geometry,  String? stayClass,  OccupantModel? occupant)?  $default,) {final _that = this;
switch (_that) {
case _SpotStateModel() when $default != null:
return $default(_that.id,_that.zoneId,_that.code,_that.row,_that.index,_that.kind,_that.active,_that.geometry,_that.stayClass,_that.occupant);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SpotStateModel implements SpotStateModel {
  const _SpotStateModel({required this.id, required this.zoneId, required this.code, required this.row, required this.index, required this.kind, required this.active, required  List<List<double>> geometry, this.stayClass, this.occupant}): _geometry = geometry;
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

/// Z-A: short, medium or long stay zone (valet layouts).
@override final  String? stayClass;
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
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SpotStateModel&&(identical(other.id, id) || other.id == id)&&(identical(other.zoneId, zoneId) || other.zoneId == zoneId)&&(identical(other.code, code) || other.code == code)&&(identical(other.row, row) || other.row == row)&&(identical(other.index, index) || other.index == index)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.active, active) || other.active == active)&&const DeepCollectionEquality().equals(other.geometry, _geometry)&&(identical(other.stayClass, stayClass) || other.stayClass == stayClass)&&(identical(other.occupant, occupant) || other.occupant == occupant));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,zoneId,code,row,index,kind,active,const DeepCollectionEquality().hash(_geometry),stayClass,occupant);
}

@override
String toString() {
    return 'SpotStateModel(id: $id, zoneId: $zoneId, code: $code, row: $row, index: $index, kind: $kind, active: $active, geometry: $geometry, stayClass: $stayClass, occupant: $occupant)';
}


}

/// @nodoc
abstract mixin class _$SpotStateModelCopyWith<$Res> implements $SpotStateModelCopyWith<$Res> {
  factory _$SpotStateModelCopyWith(_SpotStateModel value, $Res Function(_SpotStateModel) _then) = __$SpotStateModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String zoneId, String code, int row, int index, String kind, bool active, List<List<double>> geometry, String? stayClass, OccupantModel? occupant
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
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? zoneId = null,Object? code = null,Object? row = null,Object? index = null,Object? kind = null,Object? active = null,Object? geometry = null,Object? stayClass = freezed,Object? occupant = freezed,}) {
  return _then(_SpotStateModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,zoneId: null == zoneId ? _self.zoneId : zoneId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,row: null == row ? _self.row : row // ignore: cast_nullable_to_non_nullable
as int,index: null == index ? _self.index : index // ignore: cast_nullable_to_non_nullable
as int,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,geometry: null == geometry ? _self._geometry : geometry // ignore: cast_nullable_to_non_nullable
as List<List<double>>,stayClass: freezed == stayClass ? _self.stayClass : stayClass // ignore: cast_nullable_to_non_nullable
as String?,occupant: freezed == occupant ? _self.occupant : occupant // ignore: cast_nullable_to_non_nullable
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


/// @nodoc
mixin _$FileRefModel {

 String get id; String get code; String? get name;
/// Create a copy of FileRefModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FileRefModelCopyWith<FileRefModel> get copyWith => _$FileRefModelCopyWithImpl<FileRefModel>(this as FileRefModel, _$identity);

  /// Serializes this FileRefModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FileRefModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FileRefModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FileRefModel;
  return Object.hash(runtimeType,_this.id,_this.code,_this.name);
}

@override
String toString() {
  final _this = this as FileRefModel;
  return 'FileRefModel(id: ${_this.id}, code: ${_this.code}, name: ${_this.name})';
}


}

/// @nodoc
abstract mixin class $FileRefModelCopyWith<$Res>  {
  factory $FileRefModelCopyWith(FileRefModel value, $Res Function(FileRefModel) _then) = _$FileRefModelCopyWithImpl;
@useResult
$Res call({
 String id, String code, String? name
});




}
/// @nodoc
class _$FileRefModelCopyWithImpl<$Res>
    implements $FileRefModelCopyWith<$Res> {
  _$FileRefModelCopyWithImpl(this._self, this._then);

  final FileRefModel _self;
  final $Res Function(FileRefModel) _then;

/// Create a copy of FileRefModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = freezed,}) {
  return _then(FileRefModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [FileRefModel].
extension FileRefModelPatterns on FileRefModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FileRefModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FileRefModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FileRefModel value)  $default,){
final _that = this;
switch (_that) {
case _FileRefModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FileRefModel value)?  $default,){
final _that = this;
switch (_that) {
case _FileRefModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String? name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FileRefModel() when $default != null:
return $default(_that.id,_that.code,_that.name);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String? name)  $default,) {final _that = this;
switch (_that) {
case _FileRefModel():
return $default(_that.id,_that.code,_that.name);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String? name)?  $default,) {final _that = this;
switch (_that) {
case _FileRefModel() when $default != null:
return $default(_that.id,_that.code,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FileRefModel implements FileRefModel {
  const _FileRefModel({required this.id, required this.code, this.name});
  factory _FileRefModel.fromJson(Map<String, dynamic> json) => _$FileRefModelFromJson(json);

@override final  String id;
@override final  String code;
@override final  String? name;

/// Create a copy of FileRefModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FileRefModelCopyWith<_FileRefModel> get copyWith => __$FileRefModelCopyWithImpl<_FileRefModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FileRefModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FileRefModel&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,code,name);
}

@override
String toString() {
    return 'FileRefModel(id: $id, code: $code, name: $name)';
}


}

/// @nodoc
abstract mixin class _$FileRefModelCopyWith<$Res> implements $FileRefModelCopyWith<$Res> {
  factory _$FileRefModelCopyWith(_FileRefModel value, $Res Function(_FileRefModel) _then) = __$FileRefModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String? name
});




}
/// @nodoc
class __$FileRefModelCopyWithImpl<$Res>
    implements _$FileRefModelCopyWith<$Res> {
  __$FileRefModelCopyWithImpl(this._self, this._then);

  final _FileRefModel _self;
  final $Res Function(_FileRefModel) _then;

/// Create a copy of FileRefModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = freezed,}) {
  return _then(_FileRefModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$FileBlockerModel {

 String get reservationId; String get reference; String get plate; String get returnAt;
/// Create a copy of FileBlockerModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FileBlockerModelCopyWith<FileBlockerModel> get copyWith => _$FileBlockerModelCopyWithImpl<FileBlockerModel>(this as FileBlockerModel, _$identity);

  /// Serializes this FileBlockerModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FileBlockerModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FileBlockerModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FileBlockerModel;
  return Object.hash(runtimeType,_this.reservationId,_this.reference,_this.plate,_this.returnAt);
}

@override
String toString() {
  final _this = this as FileBlockerModel;
  return 'FileBlockerModel(reservationId: ${_this.reservationId}, reference: ${_this.reference}, plate: ${_this.plate}, returnAt: ${_this.returnAt})';
}


}

/// @nodoc
abstract mixin class $FileBlockerModelCopyWith<$Res>  {
  factory $FileBlockerModelCopyWith(FileBlockerModel value, $Res Function(FileBlockerModel) _then) = _$FileBlockerModelCopyWithImpl;
@useResult
$Res call({
 String reservationId, String reference, String plate, String returnAt
});




}
/// @nodoc
class _$FileBlockerModelCopyWithImpl<$Res>
    implements $FileBlockerModelCopyWith<$Res> {
  _$FileBlockerModelCopyWithImpl(this._self, this._then);

  final FileBlockerModel _self;
  final $Res Function(FileBlockerModel) _then;

/// Create a copy of FileBlockerModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = null,Object? reference = null,Object? plate = null,Object? returnAt = null,}) {
  return _then(FileBlockerModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [FileBlockerModel].
extension FileBlockerModelPatterns on FileBlockerModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FileBlockerModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FileBlockerModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FileBlockerModel value)  $default,){
final _that = this;
switch (_that) {
case _FileBlockerModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FileBlockerModel value)?  $default,){
final _that = this;
switch (_that) {
case _FileBlockerModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String plate,  String returnAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FileBlockerModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.plate,_that.returnAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reservationId,  String reference,  String plate,  String returnAt)  $default,) {final _that = this;
switch (_that) {
case _FileBlockerModel():
return $default(_that.reservationId,_that.reference,_that.plate,_that.returnAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reservationId,  String reference,  String plate,  String returnAt)?  $default,) {final _that = this;
switch (_that) {
case _FileBlockerModel() when $default != null:
return $default(_that.reservationId,_that.reference,_that.plate,_that.returnAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FileBlockerModel implements FileBlockerModel {
  const _FileBlockerModel({required this.reservationId, required this.reference, required this.plate, required this.returnAt});
  factory _FileBlockerModel.fromJson(Map<String, dynamic> json) => _$FileBlockerModelFromJson(json);

@override final  String reservationId;
@override final  String reference;
@override final  String plate;
@override final  String returnAt;

/// Create a copy of FileBlockerModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FileBlockerModelCopyWith<_FileBlockerModel> get copyWith => __$FileBlockerModelCopyWithImpl<_FileBlockerModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FileBlockerModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FileBlockerModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,reference,plate,returnAt);
}

@override
String toString() {
    return 'FileBlockerModel(reservationId: $reservationId, reference: $reference, plate: $plate, returnAt: $returnAt)';
}


}

/// @nodoc
abstract mixin class _$FileBlockerModelCopyWith<$Res> implements $FileBlockerModelCopyWith<$Res> {
  factory _$FileBlockerModelCopyWith(_FileBlockerModel value, $Res Function(_FileBlockerModel) _then) = __$FileBlockerModelCopyWithImpl;
@override @useResult
$Res call({
 String reservationId, String reference, String plate, String returnAt
});




}
/// @nodoc
class __$FileBlockerModelCopyWithImpl<$Res>
    implements _$FileBlockerModelCopyWith<$Res> {
  __$FileBlockerModelCopyWithImpl(this._self, this._then);

  final _FileBlockerModel _self;
  final $Res Function(_FileBlockerModel) _then;

/// Create a copy of FileBlockerModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = null,Object? reference = null,Object? plate = null,Object? returnAt = null,}) {
  return _then(_FileBlockerModel(
reservationId: null == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,plate: null == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$FileChoiceModel {

 String get fileId; String get code; String get reason; int get moves; int get cars; int get capacity; int? get fitMinutes;
/// Create a copy of FileChoiceModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FileChoiceModelCopyWith<FileChoiceModel> get copyWith => _$FileChoiceModelCopyWithImpl<FileChoiceModel>(this as FileChoiceModel, _$identity);

  /// Serializes this FileChoiceModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FileChoiceModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FileChoiceModel&&(identical(other.fileId, _this.fileId) || other.fileId == _this.fileId)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.reason, _this.reason) || other.reason == _this.reason)&&(identical(other.moves, _this.moves) || other.moves == _this.moves)&&(identical(other.cars, _this.cars) || other.cars == _this.cars)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&(identical(other.fitMinutes, _this.fitMinutes) || other.fitMinutes == _this.fitMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FileChoiceModel;
  return Object.hash(runtimeType,_this.fileId,_this.code,_this.reason,_this.moves,_this.cars,_this.capacity,_this.fitMinutes);
}

@override
String toString() {
  final _this = this as FileChoiceModel;
  return 'FileChoiceModel(fileId: ${_this.fileId}, code: ${_this.code}, reason: ${_this.reason}, moves: ${_this.moves}, cars: ${_this.cars}, capacity: ${_this.capacity}, fitMinutes: ${_this.fitMinutes})';
}


}

/// @nodoc
abstract mixin class $FileChoiceModelCopyWith<$Res>  {
  factory $FileChoiceModelCopyWith(FileChoiceModel value, $Res Function(FileChoiceModel) _then) = _$FileChoiceModelCopyWithImpl;
@useResult
$Res call({
 String fileId, String code, String reason, int moves, int cars, int capacity, int? fitMinutes
});




}
/// @nodoc
class _$FileChoiceModelCopyWithImpl<$Res>
    implements $FileChoiceModelCopyWith<$Res> {
  _$FileChoiceModelCopyWithImpl(this._self, this._then);

  final FileChoiceModel _self;
  final $Res Function(FileChoiceModel) _then;

/// Create a copy of FileChoiceModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? fileId = null,Object? code = null,Object? reason = null,Object? moves = null,Object? cars = null,Object? capacity = null,Object? fitMinutes = freezed,}) {
  return _then(FileChoiceModel(
fileId: null == fileId ? _self.fileId : fileId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,moves: null == moves ? _self.moves : moves // ignore: cast_nullable_to_non_nullable
as int,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,fitMinutes: freezed == fitMinutes ? _self.fitMinutes : fitMinutes // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [FileChoiceModel].
extension FileChoiceModelPatterns on FileChoiceModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FileChoiceModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FileChoiceModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FileChoiceModel value)  $default,){
final _that = this;
switch (_that) {
case _FileChoiceModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FileChoiceModel value)?  $default,){
final _that = this;
switch (_that) {
case _FileChoiceModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String fileId,  String code,  String reason,  int moves,  int cars,  int capacity,  int? fitMinutes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FileChoiceModel() when $default != null:
return $default(_that.fileId,_that.code,_that.reason,_that.moves,_that.cars,_that.capacity,_that.fitMinutes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String fileId,  String code,  String reason,  int moves,  int cars,  int capacity,  int? fitMinutes)  $default,) {final _that = this;
switch (_that) {
case _FileChoiceModel():
return $default(_that.fileId,_that.code,_that.reason,_that.moves,_that.cars,_that.capacity,_that.fitMinutes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String fileId,  String code,  String reason,  int moves,  int cars,  int capacity,  int? fitMinutes)?  $default,) {final _that = this;
switch (_that) {
case _FileChoiceModel() when $default != null:
return $default(_that.fileId,_that.code,_that.reason,_that.moves,_that.cars,_that.capacity,_that.fitMinutes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FileChoiceModel implements FileChoiceModel {
  const _FileChoiceModel({required this.fileId, required this.code, required this.reason, this.moves = 0, this.cars = 0, this.capacity = 0, this.fitMinutes});
  factory _FileChoiceModel.fromJson(Map<String, dynamic> json) => _$FileChoiceModelFromJson(json);

@override final  String fileId;
@override final  String code;
@override final  String reason;
@override@JsonKey() final  int moves;
@override@JsonKey() final  int cars;
@override@JsonKey() final  int capacity;
@override final  int? fitMinutes;

/// Create a copy of FileChoiceModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FileChoiceModelCopyWith<_FileChoiceModel> get copyWith => __$FileChoiceModelCopyWithImpl<_FileChoiceModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FileChoiceModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FileChoiceModel&&(identical(other.fileId, fileId) || other.fileId == fileId)&&(identical(other.code, code) || other.code == code)&&(identical(other.reason, reason) || other.reason == reason)&&(identical(other.moves, moves) || other.moves == moves)&&(identical(other.cars, cars) || other.cars == cars)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&(identical(other.fitMinutes, fitMinutes) || other.fitMinutes == fitMinutes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,fileId,code,reason,moves,cars,capacity,fitMinutes);
}

@override
String toString() {
    return 'FileChoiceModel(fileId: $fileId, code: $code, reason: $reason, moves: $moves, cars: $cars, capacity: $capacity, fitMinutes: $fitMinutes)';
}


}

/// @nodoc
abstract mixin class _$FileChoiceModelCopyWith<$Res> implements $FileChoiceModelCopyWith<$Res> {
  factory _$FileChoiceModelCopyWith(_FileChoiceModel value, $Res Function(_FileChoiceModel) _then) = __$FileChoiceModelCopyWithImpl;
@override @useResult
$Res call({
 String fileId, String code, String reason, int moves, int cars, int capacity, int? fitMinutes
});




}
/// @nodoc
class __$FileChoiceModelCopyWithImpl<$Res>
    implements _$FileChoiceModelCopyWith<$Res> {
  __$FileChoiceModelCopyWithImpl(this._self, this._then);

  final _FileChoiceModel _self;
  final $Res Function(_FileChoiceModel) _then;

/// Create a copy of FileChoiceModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? fileId = null,Object? code = null,Object? reason = null,Object? moves = null,Object? cars = null,Object? capacity = null,Object? fitMinutes = freezed,}) {
  return _then(_FileChoiceModel(
fileId: null == fileId ? _self.fileId : fileId // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,moves: null == moves ? _self.moves : moves // ignore: cast_nullable_to_non_nullable
as int,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,fitMinutes: freezed == fitMinutes ? _self.fitMinutes : fitMinutes // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$FileViewModel {

 String get id; String get code; String? get name; int get capacity; int get sortOrder; bool get active; String? get plannedDay; String? get day; List<OccupantModel> get cars; int get movesToday; bool get sound;
/// Create a copy of FileViewModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FileViewModelCopyWith<FileViewModel> get copyWith => _$FileViewModelCopyWithImpl<FileViewModel>(this as FileViewModel, _$identity);

  /// Serializes this FileViewModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FileViewModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FileViewModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&(identical(other.sortOrder, _this.sortOrder) || other.sortOrder == _this.sortOrder)&&(identical(other.active, _this.active) || other.active == _this.active)&&(identical(other.plannedDay, _this.plannedDay) || other.plannedDay == _this.plannedDay)&&(identical(other.day, _this.day) || other.day == _this.day)&&const DeepCollectionEquality().equals(other.cars, _this.cars)&&(identical(other.movesToday, _this.movesToday) || other.movesToday == _this.movesToday)&&(identical(other.sound, _this.sound) || other.sound == _this.sound));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FileViewModel;
  return Object.hash(runtimeType,_this.id,_this.code,_this.name,_this.capacity,_this.sortOrder,_this.active,_this.plannedDay,_this.day,const DeepCollectionEquality().hash(_this.cars),_this.movesToday,_this.sound);
}

@override
String toString() {
  final _this = this as FileViewModel;
  return 'FileViewModel(id: ${_this.id}, code: ${_this.code}, name: ${_this.name}, capacity: ${_this.capacity}, sortOrder: ${_this.sortOrder}, active: ${_this.active}, plannedDay: ${_this.plannedDay}, day: ${_this.day}, cars: ${_this.cars}, movesToday: ${_this.movesToday}, sound: ${_this.sound})';
}


}

/// @nodoc
abstract mixin class $FileViewModelCopyWith<$Res>  {
  factory $FileViewModelCopyWith(FileViewModel value, $Res Function(FileViewModel) _then) = _$FileViewModelCopyWithImpl;
@useResult
$Res call({
 String id, String code, String? name, int capacity, int sortOrder, bool active, String? plannedDay, String? day, List<OccupantModel> cars, int movesToday, bool sound
});




}
/// @nodoc
class _$FileViewModelCopyWithImpl<$Res>
    implements $FileViewModelCopyWith<$Res> {
  _$FileViewModelCopyWithImpl(this._self, this._then);

  final FileViewModel _self;
  final $Res Function(FileViewModel) _then;

/// Create a copy of FileViewModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = freezed,Object? capacity = null,Object? sortOrder = null,Object? active = null,Object? plannedDay = freezed,Object? day = freezed,Object? cars = null,Object? movesToday = null,Object? sound = null,}) {
  return _then(FileViewModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,plannedDay: freezed == plannedDay ? _self.plannedDay : plannedDay // ignore: cast_nullable_to_non_nullable
as String?,day: freezed == day ? _self.day : day // ignore: cast_nullable_to_non_nullable
as String?,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,movesToday: null == movesToday ? _self.movesToday : movesToday // ignore: cast_nullable_to_non_nullable
as int,sound: null == sound ? _self.sound : sound // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [FileViewModel].
extension FileViewModelPatterns on FileViewModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FileViewModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FileViewModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FileViewModel value)  $default,){
final _that = this;
switch (_that) {
case _FileViewModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FileViewModel value)?  $default,){
final _that = this;
switch (_that) {
case _FileViewModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String? name,  int capacity,  int sortOrder,  bool active,  String? plannedDay,  String? day,  List<OccupantModel> cars,  int movesToday,  bool sound)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FileViewModel() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.sortOrder,_that.active,_that.plannedDay,_that.day,_that.cars,_that.movesToday,_that.sound);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String? name,  int capacity,  int sortOrder,  bool active,  String? plannedDay,  String? day,  List<OccupantModel> cars,  int movesToday,  bool sound)  $default,) {final _that = this;
switch (_that) {
case _FileViewModel():
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.sortOrder,_that.active,_that.plannedDay,_that.day,_that.cars,_that.movesToday,_that.sound);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String? name,  int capacity,  int sortOrder,  bool active,  String? plannedDay,  String? day,  List<OccupantModel> cars,  int movesToday,  bool sound)?  $default,) {final _that = this;
switch (_that) {
case _FileViewModel() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.capacity,_that.sortOrder,_that.active,_that.plannedDay,_that.day,_that.cars,_that.movesToday,_that.sound);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FileViewModel implements FileViewModel {
  const _FileViewModel({required this.id, required this.code, this.name, required this.capacity, this.sortOrder = 0, this.active = true, this.plannedDay, this.day,  List<OccupantModel> cars = const <OccupantModel>[], this.movesToday = 0, this.sound = true}): _cars = cars;
  factory _FileViewModel.fromJson(Map<String, dynamic> json) => _$FileViewModelFromJson(json);

@override final  String id;
@override final  String code;
@override final  String? name;
@override final  int capacity;
@override@JsonKey() final  int sortOrder;
@override@JsonKey() final  bool active;
@override final  String? plannedDay;
@override final  String? day;
 final  List<OccupantModel> _cars;
@override@JsonKey() List<OccupantModel> get cars {
  if (_cars is EqualUnmodifiableListView) return _cars;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_cars);
}

@override@JsonKey() final  int movesToday;
@override@JsonKey() final  bool sound;

/// Create a copy of FileViewModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FileViewModelCopyWith<_FileViewModel> get copyWith => __$FileViewModelCopyWithImpl<_FileViewModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FileViewModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FileViewModel&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&(identical(other.sortOrder, sortOrder) || other.sortOrder == sortOrder)&&(identical(other.active, active) || other.active == active)&&(identical(other.plannedDay, plannedDay) || other.plannedDay == plannedDay)&&(identical(other.day, day) || other.day == day)&&const DeepCollectionEquality().equals(other.cars, _cars)&&(identical(other.movesToday, movesToday) || other.movesToday == movesToday)&&(identical(other.sound, sound) || other.sound == sound));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,code,name,capacity,sortOrder,active,plannedDay,day,const DeepCollectionEquality().hash(_cars),movesToday,sound);
}

@override
String toString() {
    return 'FileViewModel(id: $id, code: $code, name: $name, capacity: $capacity, sortOrder: $sortOrder, active: $active, plannedDay: $plannedDay, day: $day, cars: $cars, movesToday: $movesToday, sound: $sound)';
}


}

/// @nodoc
abstract mixin class _$FileViewModelCopyWith<$Res> implements $FileViewModelCopyWith<$Res> {
  factory _$FileViewModelCopyWith(_FileViewModel value, $Res Function(_FileViewModel) _then) = __$FileViewModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String? name, int capacity, int sortOrder, bool active, String? plannedDay, String? day, List<OccupantModel> cars, int movesToday, bool sound
});




}
/// @nodoc
class __$FileViewModelCopyWithImpl<$Res>
    implements _$FileViewModelCopyWith<$Res> {
  __$FileViewModelCopyWithImpl(this._self, this._then);

  final _FileViewModel _self;
  final $Res Function(_FileViewModel) _then;

/// Create a copy of FileViewModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = freezed,Object? capacity = null,Object? sortOrder = null,Object? active = null,Object? plannedDay = freezed,Object? day = freezed,Object? cars = null,Object? movesToday = null,Object? sound = null,}) {
  return _then(_FileViewModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,sortOrder: null == sortOrder ? _self.sortOrder : sortOrder // ignore: cast_nullable_to_non_nullable
as int,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,plannedDay: freezed == plannedDay ? _self.plannedDay : plannedDay // ignore: cast_nullable_to_non_nullable
as String?,day: freezed == day ? _self.day : day // ignore: cast_nullable_to_non_nullable
as String?,cars: null == cars ? _self._cars : cars // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,movesToday: null == movesToday ? _self.movesToday : movesToday // ignore: cast_nullable_to_non_nullable
as int,sound: null == sound ? _self.sound : sound // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$FileStatsModel {

 int get files; int get capacity; int get cars; int get onSite; int get leavingToday; int get movesToday; int get unsound;
/// Create a copy of FileStatsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FileStatsModelCopyWith<FileStatsModel> get copyWith => _$FileStatsModelCopyWithImpl<FileStatsModel>(this as FileStatsModel, _$identity);

  /// Serializes this FileStatsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FileStatsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FileStatsModel&&(identical(other.files, _this.files) || other.files == _this.files)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&(identical(other.cars, _this.cars) || other.cars == _this.cars)&&(identical(other.onSite, _this.onSite) || other.onSite == _this.onSite)&&(identical(other.leavingToday, _this.leavingToday) || other.leavingToday == _this.leavingToday)&&(identical(other.movesToday, _this.movesToday) || other.movesToday == _this.movesToday)&&(identical(other.unsound, _this.unsound) || other.unsound == _this.unsound));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FileStatsModel;
  return Object.hash(runtimeType,_this.files,_this.capacity,_this.cars,_this.onSite,_this.leavingToday,_this.movesToday,_this.unsound);
}

@override
String toString() {
  final _this = this as FileStatsModel;
  return 'FileStatsModel(files: ${_this.files}, capacity: ${_this.capacity}, cars: ${_this.cars}, onSite: ${_this.onSite}, leavingToday: ${_this.leavingToday}, movesToday: ${_this.movesToday}, unsound: ${_this.unsound})';
}


}

/// @nodoc
abstract mixin class $FileStatsModelCopyWith<$Res>  {
  factory $FileStatsModelCopyWith(FileStatsModel value, $Res Function(FileStatsModel) _then) = _$FileStatsModelCopyWithImpl;
@useResult
$Res call({
 int files, int capacity, int cars, int onSite, int leavingToday, int movesToday, int unsound
});




}
/// @nodoc
class _$FileStatsModelCopyWithImpl<$Res>
    implements $FileStatsModelCopyWith<$Res> {
  _$FileStatsModelCopyWithImpl(this._self, this._then);

  final FileStatsModel _self;
  final $Res Function(FileStatsModel) _then;

/// Create a copy of FileStatsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? files = null,Object? capacity = null,Object? cars = null,Object? onSite = null,Object? leavingToday = null,Object? movesToday = null,Object? unsound = null,}) {
  return _then(FileStatsModel(
files: null == files ? _self.files : files // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as int,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as int,leavingToday: null == leavingToday ? _self.leavingToday : leavingToday // ignore: cast_nullable_to_non_nullable
as int,movesToday: null == movesToday ? _self.movesToday : movesToday // ignore: cast_nullable_to_non_nullable
as int,unsound: null == unsound ? _self.unsound : unsound // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [FileStatsModel].
extension FileStatsModelPatterns on FileStatsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FileStatsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FileStatsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FileStatsModel value)  $default,){
final _that = this;
switch (_that) {
case _FileStatsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FileStatsModel value)?  $default,){
final _that = this;
switch (_that) {
case _FileStatsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int files,  int capacity,  int cars,  int onSite,  int leavingToday,  int movesToday,  int unsound)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FileStatsModel() when $default != null:
return $default(_that.files,_that.capacity,_that.cars,_that.onSite,_that.leavingToday,_that.movesToday,_that.unsound);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int files,  int capacity,  int cars,  int onSite,  int leavingToday,  int movesToday,  int unsound)  $default,) {final _that = this;
switch (_that) {
case _FileStatsModel():
return $default(_that.files,_that.capacity,_that.cars,_that.onSite,_that.leavingToday,_that.movesToday,_that.unsound);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int files,  int capacity,  int cars,  int onSite,  int leavingToday,  int movesToday,  int unsound)?  $default,) {final _that = this;
switch (_that) {
case _FileStatsModel() when $default != null:
return $default(_that.files,_that.capacity,_that.cars,_that.onSite,_that.leavingToday,_that.movesToday,_that.unsound);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FileStatsModel implements FileStatsModel {
  const _FileStatsModel({this.files = 0, this.capacity = 0, this.cars = 0, this.onSite = 0, this.leavingToday = 0, this.movesToday = 0, this.unsound = 0});
  factory _FileStatsModel.fromJson(Map<String, dynamic> json) => _$FileStatsModelFromJson(json);

@override@JsonKey() final  int files;
@override@JsonKey() final  int capacity;
@override@JsonKey() final  int cars;
@override@JsonKey() final  int onSite;
@override@JsonKey() final  int leavingToday;
@override@JsonKey() final  int movesToday;
@override@JsonKey() final  int unsound;

/// Create a copy of FileStatsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FileStatsModelCopyWith<_FileStatsModel> get copyWith => __$FileStatsModelCopyWithImpl<_FileStatsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FileStatsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FileStatsModel&&(identical(other.files, files) || other.files == files)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&(identical(other.cars, cars) || other.cars == cars)&&(identical(other.onSite, onSite) || other.onSite == onSite)&&(identical(other.leavingToday, leavingToday) || other.leavingToday == leavingToday)&&(identical(other.movesToday, movesToday) || other.movesToday == movesToday)&&(identical(other.unsound, unsound) || other.unsound == unsound));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,files,capacity,cars,onSite,leavingToday,movesToday,unsound);
}

@override
String toString() {
    return 'FileStatsModel(files: $files, capacity: $capacity, cars: $cars, onSite: $onSite, leavingToday: $leavingToday, movesToday: $movesToday, unsound: $unsound)';
}


}

/// @nodoc
abstract mixin class _$FileStatsModelCopyWith<$Res> implements $FileStatsModelCopyWith<$Res> {
  factory _$FileStatsModelCopyWith(_FileStatsModel value, $Res Function(_FileStatsModel) _then) = __$FileStatsModelCopyWithImpl;
@override @useResult
$Res call({
 int files, int capacity, int cars, int onSite, int leavingToday, int movesToday, int unsound
});




}
/// @nodoc
class __$FileStatsModelCopyWithImpl<$Res>
    implements _$FileStatsModelCopyWith<$Res> {
  __$FileStatsModelCopyWithImpl(this._self, this._then);

  final _FileStatsModel _self;
  final $Res Function(_FileStatsModel) _then;

/// Create a copy of FileStatsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? files = null,Object? capacity = null,Object? cars = null,Object? onSite = null,Object? leavingToday = null,Object? movesToday = null,Object? unsound = null,}) {
  return _then(_FileStatsModel(
files: null == files ? _self.files : files // ignore: cast_nullable_to_non_nullable
as int,capacity: null == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as int,cars: null == cars ? _self.cars : cars // ignore: cast_nullable_to_non_nullable
as int,onSite: null == onSite ? _self.onSite : onSite // ignore: cast_nullable_to_non_nullable
as int,leavingToday: null == leavingToday ? _self.leavingToday : leavingToday // ignore: cast_nullable_to_non_nullable
as int,movesToday: null == movesToday ? _self.movesToday : movesToday // ignore: cast_nullable_to_non_nullable
as int,unsound: null == unsound ? _self.unsound : unsound // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$FileBoardModel {

 String get date; List<FileViewModel> get files; List<OccupantModel> get arrivals; FileStatsModel get stats;
/// Create a copy of FileBoardModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FileBoardModelCopyWith<FileBoardModel> get copyWith => _$FileBoardModelCopyWithImpl<FileBoardModel>(this as FileBoardModel, _$identity);

  /// Serializes this FileBoardModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FileBoardModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FileBoardModel&&(identical(other.date, _this.date) || other.date == _this.date)&&const DeepCollectionEquality().equals(other.files, _this.files)&&const DeepCollectionEquality().equals(other.arrivals, _this.arrivals)&&(identical(other.stats, _this.stats) || other.stats == _this.stats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FileBoardModel;
  return Object.hash(runtimeType,_this.date,const DeepCollectionEquality().hash(_this.files),const DeepCollectionEquality().hash(_this.arrivals),_this.stats);
}

@override
String toString() {
  final _this = this as FileBoardModel;
  return 'FileBoardModel(date: ${_this.date}, files: ${_this.files}, arrivals: ${_this.arrivals}, stats: ${_this.stats})';
}


}

/// @nodoc
abstract mixin class $FileBoardModelCopyWith<$Res>  {
  factory $FileBoardModelCopyWith(FileBoardModel value, $Res Function(FileBoardModel) _then) = _$FileBoardModelCopyWithImpl;
@useResult
$Res call({
 String date, List<FileViewModel> files, List<OccupantModel> arrivals, FileStatsModel stats
});


$FileStatsModelCopyWith<$Res> get stats;

}
/// @nodoc
class _$FileBoardModelCopyWithImpl<$Res>
    implements $FileBoardModelCopyWith<$Res> {
  _$FileBoardModelCopyWithImpl(this._self, this._then);

  final FileBoardModel _self;
  final $Res Function(FileBoardModel) _then;

/// Create a copy of FileBoardModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? files = null,Object? arrivals = null,Object? stats = null,}) {
  return _then(FileBoardModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,files: null == files ? _self.files : files // ignore: cast_nullable_to_non_nullable
as List<FileViewModel>,arrivals: null == arrivals ? _self.arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,stats: null == stats ? _self.stats : stats // ignore: cast_nullable_to_non_nullable
as FileStatsModel,
  ));
}
/// Create a copy of FileBoardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FileStatsModelCopyWith<$Res> get stats {
  
  return $FileStatsModelCopyWith<$Res>(_self.stats, (value) {
    return _then(_self.copyWith(stats: value));
  });
}
}


/// Adds pattern-matching-related methods to [FileBoardModel].
extension FileBoardModelPatterns on FileBoardModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FileBoardModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FileBoardModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FileBoardModel value)  $default,){
final _that = this;
switch (_that) {
case _FileBoardModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FileBoardModel value)?  $default,){
final _that = this;
switch (_that) {
case _FileBoardModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  List<FileViewModel> files,  List<OccupantModel> arrivals,  FileStatsModel stats)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FileBoardModel() when $default != null:
return $default(_that.date,_that.files,_that.arrivals,_that.stats);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  List<FileViewModel> files,  List<OccupantModel> arrivals,  FileStatsModel stats)  $default,) {final _that = this;
switch (_that) {
case _FileBoardModel():
return $default(_that.date,_that.files,_that.arrivals,_that.stats);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  List<FileViewModel> files,  List<OccupantModel> arrivals,  FileStatsModel stats)?  $default,) {final _that = this;
switch (_that) {
case _FileBoardModel() when $default != null:
return $default(_that.date,_that.files,_that.arrivals,_that.stats);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FileBoardModel implements FileBoardModel {
  const _FileBoardModel({required this.date,  List<FileViewModel> files = const <FileViewModel>[],  List<OccupantModel> arrivals = const <OccupantModel>[], this.stats = const FileStatsModel()}): _files = files,_arrivals = arrivals;
  factory _FileBoardModel.fromJson(Map<String, dynamic> json) => _$FileBoardModelFromJson(json);

@override final  String date;
 final  List<FileViewModel> _files;
@override@JsonKey() List<FileViewModel> get files {
  if (_files is EqualUnmodifiableListView) return _files;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_files);
}

 final  List<OccupantModel> _arrivals;
@override@JsonKey() List<OccupantModel> get arrivals {
  if (_arrivals is EqualUnmodifiableListView) return _arrivals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_arrivals);
}

@override@JsonKey() final  FileStatsModel stats;

/// Create a copy of FileBoardModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FileBoardModelCopyWith<_FileBoardModel> get copyWith => __$FileBoardModelCopyWithImpl<_FileBoardModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FileBoardModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FileBoardModel&&(identical(other.date, date) || other.date == date)&&const DeepCollectionEquality().equals(other.files, _files)&&const DeepCollectionEquality().equals(other.arrivals, _arrivals)&&(identical(other.stats, stats) || other.stats == stats));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,date,const DeepCollectionEquality().hash(_files),const DeepCollectionEquality().hash(_arrivals),stats);
}

@override
String toString() {
    return 'FileBoardModel(date: $date, files: $files, arrivals: $arrivals, stats: $stats)';
}


}

/// @nodoc
abstract mixin class _$FileBoardModelCopyWith<$Res> implements $FileBoardModelCopyWith<$Res> {
  factory _$FileBoardModelCopyWith(_FileBoardModel value, $Res Function(_FileBoardModel) _then) = __$FileBoardModelCopyWithImpl;
@override @useResult
$Res call({
 String date, List<FileViewModel> files, List<OccupantModel> arrivals, FileStatsModel stats
});


@override $FileStatsModelCopyWith<$Res> get stats;

}
/// @nodoc
class __$FileBoardModelCopyWithImpl<$Res>
    implements _$FileBoardModelCopyWith<$Res> {
  __$FileBoardModelCopyWithImpl(this._self, this._then);

  final _FileBoardModel _self;
  final $Res Function(_FileBoardModel) _then;

/// Create a copy of FileBoardModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? files = null,Object? arrivals = null,Object? stats = null,}) {
  return _then(_FileBoardModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,files: null == files ? _self._files : files // ignore: cast_nullable_to_non_nullable
as List<FileViewModel>,arrivals: null == arrivals ? _self._arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,stats: null == stats ? _self.stats : stats // ignore: cast_nullable_to_non_nullable
as FileStatsModel,
  ));
}

/// Create a copy of FileBoardModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FileStatsModelCopyWith<$Res> get stats {
  
  return $FileStatsModelCopyWith<$Res>(_self.stats, (value) {
    return _then(_self.copyWith(stats: value));
  });
}
}


/// @nodoc
mixin _$FilesPreparedModel {

 int get planned; int get free;
/// Create a copy of FilesPreparedModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FilesPreparedModelCopyWith<FilesPreparedModel> get copyWith => _$FilesPreparedModelCopyWithImpl<FilesPreparedModel>(this as FilesPreparedModel, _$identity);

  /// Serializes this FilesPreparedModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FilesPreparedModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FilesPreparedModel&&(identical(other.planned, _this.planned) || other.planned == _this.planned)&&(identical(other.free, _this.free) || other.free == _this.free));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FilesPreparedModel;
  return Object.hash(runtimeType,_this.planned,_this.free);
}

@override
String toString() {
  final _this = this as FilesPreparedModel;
  return 'FilesPreparedModel(planned: ${_this.planned}, free: ${_this.free})';
}


}

/// @nodoc
abstract mixin class $FilesPreparedModelCopyWith<$Res>  {
  factory $FilesPreparedModelCopyWith(FilesPreparedModel value, $Res Function(FilesPreparedModel) _then) = _$FilesPreparedModelCopyWithImpl;
@useResult
$Res call({
 int planned, int free
});




}
/// @nodoc
class _$FilesPreparedModelCopyWithImpl<$Res>
    implements $FilesPreparedModelCopyWith<$Res> {
  _$FilesPreparedModelCopyWithImpl(this._self, this._then);

  final FilesPreparedModel _self;
  final $Res Function(FilesPreparedModel) _then;

/// Create a copy of FilesPreparedModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? planned = null,Object? free = null,}) {
  return _then(FilesPreparedModel(
planned: null == planned ? _self.planned : planned // ignore: cast_nullable_to_non_nullable
as int,free: null == free ? _self.free : free // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [FilesPreparedModel].
extension FilesPreparedModelPatterns on FilesPreparedModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FilesPreparedModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FilesPreparedModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FilesPreparedModel value)  $default,){
final _that = this;
switch (_that) {
case _FilesPreparedModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FilesPreparedModel value)?  $default,){
final _that = this;
switch (_that) {
case _FilesPreparedModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int planned,  int free)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FilesPreparedModel() when $default != null:
return $default(_that.planned,_that.free);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int planned,  int free)  $default,) {final _that = this;
switch (_that) {
case _FilesPreparedModel():
return $default(_that.planned,_that.free);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int planned,  int free)?  $default,) {final _that = this;
switch (_that) {
case _FilesPreparedModel() when $default != null:
return $default(_that.planned,_that.free);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FilesPreparedModel implements FilesPreparedModel {
  const _FilesPreparedModel({this.planned = 0, this.free = 0});
  factory _FilesPreparedModel.fromJson(Map<String, dynamic> json) => _$FilesPreparedModelFromJson(json);

@override@JsonKey() final  int planned;
@override@JsonKey() final  int free;

/// Create a copy of FilesPreparedModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FilesPreparedModelCopyWith<_FilesPreparedModel> get copyWith => __$FilesPreparedModelCopyWithImpl<_FilesPreparedModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FilesPreparedModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FilesPreparedModel&&(identical(other.planned, planned) || other.planned == planned)&&(identical(other.free, free) || other.free == free));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,planned,free);
}

@override
String toString() {
    return 'FilesPreparedModel(planned: $planned, free: $free)';
}


}

/// @nodoc
abstract mixin class _$FilesPreparedModelCopyWith<$Res> implements $FilesPreparedModelCopyWith<$Res> {
  factory _$FilesPreparedModelCopyWith(_FilesPreparedModel value, $Res Function(_FilesPreparedModel) _then) = __$FilesPreparedModelCopyWithImpl;
@override @useResult
$Res call({
 int planned, int free
});




}
/// @nodoc
class __$FilesPreparedModelCopyWithImpl<$Res>
    implements _$FilesPreparedModelCopyWith<$Res> {
  __$FilesPreparedModelCopyWithImpl(this._self, this._then);

  final _FilesPreparedModel _self;
  final $Res Function(_FilesPreparedModel) _then;

/// Create a copy of FilesPreparedModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? planned = null,Object? free = null,}) {
  return _then(_FilesPreparedModel(
planned: null == planned ? _self.planned : planned // ignore: cast_nullable_to_non_nullable
as int,free: null == free ? _self.free : free // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$FilesPreparedResponse {

 FilesPreparedModel get data;
/// Create a copy of FilesPreparedResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FilesPreparedResponseCopyWith<FilesPreparedResponse> get copyWith => _$FilesPreparedResponseCopyWithImpl<FilesPreparedResponse>(this as FilesPreparedResponse, _$identity);

  /// Serializes this FilesPreparedResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as FilesPreparedResponse;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FilesPreparedResponse&&(identical(other.data, _this.data) || other.data == _this.data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as FilesPreparedResponse;
  return Object.hash(runtimeType,_this.data);
}

@override
String toString() {
  final _this = this as FilesPreparedResponse;
  return 'FilesPreparedResponse(data: ${_this.data})';
}


}

/// @nodoc
abstract mixin class $FilesPreparedResponseCopyWith<$Res>  {
  factory $FilesPreparedResponseCopyWith(FilesPreparedResponse value, $Res Function(FilesPreparedResponse) _then) = _$FilesPreparedResponseCopyWithImpl;
@useResult
$Res call({
 FilesPreparedModel data
});


$FilesPreparedModelCopyWith<$Res> get data;

}
/// @nodoc
class _$FilesPreparedResponseCopyWithImpl<$Res>
    implements $FilesPreparedResponseCopyWith<$Res> {
  _$FilesPreparedResponseCopyWithImpl(this._self, this._then);

  final FilesPreparedResponse _self;
  final $Res Function(FilesPreparedResponse) _then;

/// Create a copy of FilesPreparedResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? data = null,}) {
  return _then(FilesPreparedResponse(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as FilesPreparedModel,
  ));
}
/// Create a copy of FilesPreparedResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FilesPreparedModelCopyWith<$Res> get data {
  
  return $FilesPreparedModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [FilesPreparedResponse].
extension FilesPreparedResponsePatterns on FilesPreparedResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FilesPreparedResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FilesPreparedResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FilesPreparedResponse value)  $default,){
final _that = this;
switch (_that) {
case _FilesPreparedResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FilesPreparedResponse value)?  $default,){
final _that = this;
switch (_that) {
case _FilesPreparedResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( FilesPreparedModel data)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FilesPreparedResponse() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( FilesPreparedModel data)  $default,) {final _that = this;
switch (_that) {
case _FilesPreparedResponse():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( FilesPreparedModel data)?  $default,) {final _that = this;
switch (_that) {
case _FilesPreparedResponse() when $default != null:
return $default(_that.data);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FilesPreparedResponse implements FilesPreparedResponse {
  const _FilesPreparedResponse({required this.data});
  factory _FilesPreparedResponse.fromJson(Map<String, dynamic> json) => _$FilesPreparedResponseFromJson(json);

@override final  FilesPreparedModel data;

/// Create a copy of FilesPreparedResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FilesPreparedResponseCopyWith<_FilesPreparedResponse> get copyWith => __$FilesPreparedResponseCopyWithImpl<_FilesPreparedResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FilesPreparedResponseToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _FilesPreparedResponse&&(identical(other.data, data) || other.data == data));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,data);
}

@override
String toString() {
    return 'FilesPreparedResponse(data: $data)';
}


}

/// @nodoc
abstract mixin class _$FilesPreparedResponseCopyWith<$Res> implements $FilesPreparedResponseCopyWith<$Res> {
  factory _$FilesPreparedResponseCopyWith(_FilesPreparedResponse value, $Res Function(_FilesPreparedResponse) _then) = __$FilesPreparedResponseCopyWithImpl;
@override @useResult
$Res call({
 FilesPreparedModel data
});


@override $FilesPreparedModelCopyWith<$Res> get data;

}
/// @nodoc
class __$FilesPreparedResponseCopyWithImpl<$Res>
    implements _$FilesPreparedResponseCopyWith<$Res> {
  __$FilesPreparedResponseCopyWithImpl(this._self, this._then);

  final _FilesPreparedResponse _self;
  final $Res Function(_FilesPreparedResponse) _then;

/// Create a copy of FilesPreparedResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? data = null,}) {
  return _then(_FilesPreparedResponse(
data: null == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as FilesPreparedModel,
  ));
}

/// Create a copy of FilesPreparedResponse
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FilesPreparedModelCopyWith<$Res> get data {
  
  return $FilesPreparedModelCopyWith<$Res>(_self.data, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
