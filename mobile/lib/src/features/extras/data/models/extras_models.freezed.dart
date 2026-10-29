// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'extras_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ExtraOfferModel {

 String get kind; String get label; String get description; int get priceCents; bool get available; String? get reason;
/// Create a copy of ExtraOfferModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraOfferModelCopyWith<ExtraOfferModel> get copyWith => _$ExtraOfferModelCopyWithImpl<ExtraOfferModel>(this as ExtraOfferModel, _$identity);

  /// Serializes this ExtraOfferModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ExtraOfferModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraOfferModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.description, _this.description) || other.description == _this.description)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.available, _this.available) || other.available == _this.available)&&(identical(other.reason, _this.reason) || other.reason == _this.reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ExtraOfferModel;
  return Object.hash(runtimeType,_this.kind,_this.label,_this.description,_this.priceCents,_this.available,_this.reason);
}

@override
String toString() {
  final _this = this as ExtraOfferModel;
  return 'ExtraOfferModel(kind: ${_this.kind}, label: ${_this.label}, description: ${_this.description}, priceCents: ${_this.priceCents}, available: ${_this.available}, reason: ${_this.reason})';
}


}

/// @nodoc
abstract mixin class $ExtraOfferModelCopyWith<$Res>  {
  factory $ExtraOfferModelCopyWith(ExtraOfferModel value, $Res Function(ExtraOfferModel) _then) = _$ExtraOfferModelCopyWithImpl;
@useResult
$Res call({
 String kind, String label, String description, int priceCents, bool available, String? reason
});




}
/// @nodoc
class _$ExtraOfferModelCopyWithImpl<$Res>
    implements $ExtraOfferModelCopyWith<$Res> {
  _$ExtraOfferModelCopyWithImpl(this._self, this._then);

  final ExtraOfferModel _self;
  final $Res Function(ExtraOfferModel) _then;

/// Create a copy of ExtraOfferModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? label = null,Object? description = null,Object? priceCents = null,Object? available = null,Object? reason = freezed,}) {
  return _then(ExtraOfferModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ExtraOfferModel].
extension ExtraOfferModelPatterns on ExtraOfferModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraOfferModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraOfferModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraOfferModel value)  $default,){
final _that = this;
switch (_that) {
case _ExtraOfferModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraOfferModel value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraOfferModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  String label,  String description,  int priceCents,  bool available,  String? reason)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraOfferModel() when $default != null:
return $default(_that.kind,_that.label,_that.description,_that.priceCents,_that.available,_that.reason);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  String label,  String description,  int priceCents,  bool available,  String? reason)  $default,) {final _that = this;
switch (_that) {
case _ExtraOfferModel():
return $default(_that.kind,_that.label,_that.description,_that.priceCents,_that.available,_that.reason);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  String label,  String description,  int priceCents,  bool available,  String? reason)?  $default,) {final _that = this;
switch (_that) {
case _ExtraOfferModel() when $default != null:
return $default(_that.kind,_that.label,_that.description,_that.priceCents,_that.available,_that.reason);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtraOfferModel implements ExtraOfferModel {
  const _ExtraOfferModel({required this.kind, required this.label, this.description = '', required this.priceCents, this.available = true, this.reason});
  factory _ExtraOfferModel.fromJson(Map<String, dynamic> json) => _$ExtraOfferModelFromJson(json);

@override final  String kind;
@override final  String label;
@override@JsonKey() final  String description;
@override final  int priceCents;
@override@JsonKey() final  bool available;
@override final  String? reason;

/// Create a copy of ExtraOfferModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraOfferModelCopyWith<_ExtraOfferModel> get copyWith => __$ExtraOfferModelCopyWithImpl<_ExtraOfferModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtraOfferModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraOfferModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.label, label) || other.label == label)&&(identical(other.description, description) || other.description == description)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.available, available) || other.available == available)&&(identical(other.reason, reason) || other.reason == reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,label,description,priceCents,available,reason);
}

@override
String toString() {
    return 'ExtraOfferModel(kind: $kind, label: $label, description: $description, priceCents: $priceCents, available: $available, reason: $reason)';
}


}

/// @nodoc
abstract mixin class _$ExtraOfferModelCopyWith<$Res> implements $ExtraOfferModelCopyWith<$Res> {
  factory _$ExtraOfferModelCopyWith(_ExtraOfferModel value, $Res Function(_ExtraOfferModel) _then) = __$ExtraOfferModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, String label, String description, int priceCents, bool available, String? reason
});




}
/// @nodoc
class __$ExtraOfferModelCopyWithImpl<$Res>
    implements _$ExtraOfferModelCopyWith<$Res> {
  __$ExtraOfferModelCopyWithImpl(this._self, this._then);

  final _ExtraOfferModel _self;
  final $Res Function(_ExtraOfferModel) _then;

/// Create a copy of ExtraOfferModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? label = null,Object? description = null,Object? priceCents = null,Object? available = null,Object? reason = freezed,}) {
  return _then(_ExtraOfferModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ExtraOrderModel {

 String get id; String get kind; String get label; int get priceCents; String get status; bool get withBooking; DateTime? get paidAt; DateTime? get doneAt; DateTime? get refusedAt; String? get refusedReason; DateTime? get refundedAt;/// Staff only: who marked it done or not possible (first name).
 String? get doneBy; String? get refusedBy; DateTime? get acceptedAt; String? get acceptedBy;
/// Create a copy of ExtraOrderModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraOrderModelCopyWith<ExtraOrderModel> get copyWith => _$ExtraOrderModelCopyWithImpl<ExtraOrderModel>(this as ExtraOrderModel, _$identity);

  /// Serializes this ExtraOrderModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ExtraOrderModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraOrderModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.withBooking, _this.withBooking) || other.withBooking == _this.withBooking)&&(identical(other.paidAt, _this.paidAt) || other.paidAt == _this.paidAt)&&(identical(other.doneAt, _this.doneAt) || other.doneAt == _this.doneAt)&&(identical(other.refusedAt, _this.refusedAt) || other.refusedAt == _this.refusedAt)&&(identical(other.refusedReason, _this.refusedReason) || other.refusedReason == _this.refusedReason)&&(identical(other.refundedAt, _this.refundedAt) || other.refundedAt == _this.refundedAt)&&(identical(other.doneBy, _this.doneBy) || other.doneBy == _this.doneBy)&&(identical(other.refusedBy, _this.refusedBy) || other.refusedBy == _this.refusedBy)&&(identical(other.acceptedAt, _this.acceptedAt) || other.acceptedAt == _this.acceptedAt)&&(identical(other.acceptedBy, _this.acceptedBy) || other.acceptedBy == _this.acceptedBy));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ExtraOrderModel;
  return Object.hash(runtimeType,_this.id,_this.kind,_this.label,_this.priceCents,_this.status,_this.withBooking,_this.paidAt,_this.doneAt,_this.refusedAt,_this.refusedReason,_this.refundedAt,_this.doneBy,_this.refusedBy,_this.acceptedAt,_this.acceptedBy);
}

@override
String toString() {
  final _this = this as ExtraOrderModel;
  return 'ExtraOrderModel(id: ${_this.id}, kind: ${_this.kind}, label: ${_this.label}, priceCents: ${_this.priceCents}, status: ${_this.status}, withBooking: ${_this.withBooking}, paidAt: ${_this.paidAt}, doneAt: ${_this.doneAt}, refusedAt: ${_this.refusedAt}, refusedReason: ${_this.refusedReason}, refundedAt: ${_this.refundedAt}, doneBy: ${_this.doneBy}, refusedBy: ${_this.refusedBy}, acceptedAt: ${_this.acceptedAt}, acceptedBy: ${_this.acceptedBy})';
}


}

/// @nodoc
abstract mixin class $ExtraOrderModelCopyWith<$Res>  {
  factory $ExtraOrderModelCopyWith(ExtraOrderModel value, $Res Function(ExtraOrderModel) _then) = _$ExtraOrderModelCopyWithImpl;
@useResult
$Res call({
 String id, String kind, String label, int priceCents, String status, bool withBooking, DateTime? paidAt, DateTime? doneAt, DateTime? refusedAt, String? refusedReason, DateTime? refundedAt, String? doneBy, String? refusedBy, DateTime? acceptedAt, String? acceptedBy
});




}
/// @nodoc
class _$ExtraOrderModelCopyWithImpl<$Res>
    implements $ExtraOrderModelCopyWith<$Res> {
  _$ExtraOrderModelCopyWithImpl(this._self, this._then);

  final ExtraOrderModel _self;
  final $Res Function(ExtraOrderModel) _then;

/// Create a copy of ExtraOrderModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? kind = null,Object? label = null,Object? priceCents = null,Object? status = null,Object? withBooking = null,Object? paidAt = freezed,Object? doneAt = freezed,Object? refusedAt = freezed,Object? refusedReason = freezed,Object? refundedAt = freezed,Object? doneBy = freezed,Object? refusedBy = freezed,Object? acceptedAt = freezed,Object? acceptedBy = freezed,}) {
  return _then(ExtraOrderModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,withBooking: null == withBooking ? _self.withBooking : withBooking // ignore: cast_nullable_to_non_nullable
as bool,paidAt: freezed == paidAt ? _self.paidAt : paidAt // ignore: cast_nullable_to_non_nullable
as DateTime?,doneAt: freezed == doneAt ? _self.doneAt : doneAt // ignore: cast_nullable_to_non_nullable
as DateTime?,refusedAt: freezed == refusedAt ? _self.refusedAt : refusedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,refusedReason: freezed == refusedReason ? _self.refusedReason : refusedReason // ignore: cast_nullable_to_non_nullable
as String?,refundedAt: freezed == refundedAt ? _self.refundedAt : refundedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,doneBy: freezed == doneBy ? _self.doneBy : doneBy // ignore: cast_nullable_to_non_nullable
as String?,refusedBy: freezed == refusedBy ? _self.refusedBy : refusedBy // ignore: cast_nullable_to_non_nullable
as String?,acceptedAt: freezed == acceptedAt ? _self.acceptedAt : acceptedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,acceptedBy: freezed == acceptedBy ? _self.acceptedBy : acceptedBy // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ExtraOrderModel].
extension ExtraOrderModelPatterns on ExtraOrderModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraOrderModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraOrderModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraOrderModel value)  $default,){
final _that = this;
switch (_that) {
case _ExtraOrderModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraOrderModel value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraOrderModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String kind,  String label,  int priceCents,  String status,  bool withBooking,  DateTime? paidAt,  DateTime? doneAt,  DateTime? refusedAt,  String? refusedReason,  DateTime? refundedAt,  String? doneBy,  String? refusedBy,  DateTime? acceptedAt,  String? acceptedBy)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraOrderModel() when $default != null:
return $default(_that.id,_that.kind,_that.label,_that.priceCents,_that.status,_that.withBooking,_that.paidAt,_that.doneAt,_that.refusedAt,_that.refusedReason,_that.refundedAt,_that.doneBy,_that.refusedBy,_that.acceptedAt,_that.acceptedBy);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String kind,  String label,  int priceCents,  String status,  bool withBooking,  DateTime? paidAt,  DateTime? doneAt,  DateTime? refusedAt,  String? refusedReason,  DateTime? refundedAt,  String? doneBy,  String? refusedBy,  DateTime? acceptedAt,  String? acceptedBy)  $default,) {final _that = this;
switch (_that) {
case _ExtraOrderModel():
return $default(_that.id,_that.kind,_that.label,_that.priceCents,_that.status,_that.withBooking,_that.paidAt,_that.doneAt,_that.refusedAt,_that.refusedReason,_that.refundedAt,_that.doneBy,_that.refusedBy,_that.acceptedAt,_that.acceptedBy);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String kind,  String label,  int priceCents,  String status,  bool withBooking,  DateTime? paidAt,  DateTime? doneAt,  DateTime? refusedAt,  String? refusedReason,  DateTime? refundedAt,  String? doneBy,  String? refusedBy,  DateTime? acceptedAt,  String? acceptedBy)?  $default,) {final _that = this;
switch (_that) {
case _ExtraOrderModel() when $default != null:
return $default(_that.id,_that.kind,_that.label,_that.priceCents,_that.status,_that.withBooking,_that.paidAt,_that.doneAt,_that.refusedAt,_that.refusedReason,_that.refundedAt,_that.doneBy,_that.refusedBy,_that.acceptedAt,_that.acceptedBy);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtraOrderModel extends ExtraOrderModel {
  const _ExtraOrderModel({required this.id, required this.kind, required this.label, required this.priceCents, required this.status, this.withBooking = false, this.paidAt, this.doneAt, this.refusedAt, this.refusedReason, this.refundedAt, this.doneBy, this.refusedBy, this.acceptedAt, this.acceptedBy}): super._();
  factory _ExtraOrderModel.fromJson(Map<String, dynamic> json) => _$ExtraOrderModelFromJson(json);

@override final  String id;
@override final  String kind;
@override final  String label;
@override final  int priceCents;
@override final  String status;
@override@JsonKey() final  bool withBooking;
@override final  DateTime? paidAt;
@override final  DateTime? doneAt;
@override final  DateTime? refusedAt;
@override final  String? refusedReason;
@override final  DateTime? refundedAt;
/// Staff only: who marked it done or not possible (first name).
@override final  String? doneBy;
@override final  String? refusedBy;
@override final  DateTime? acceptedAt;
@override final  String? acceptedBy;

/// Create a copy of ExtraOrderModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraOrderModelCopyWith<_ExtraOrderModel> get copyWith => __$ExtraOrderModelCopyWithImpl<_ExtraOrderModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtraOrderModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraOrderModel&&(identical(other.id, id) || other.id == id)&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.label, label) || other.label == label)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.status, status) || other.status == status)&&(identical(other.withBooking, withBooking) || other.withBooking == withBooking)&&(identical(other.paidAt, paidAt) || other.paidAt == paidAt)&&(identical(other.doneAt, doneAt) || other.doneAt == doneAt)&&(identical(other.refusedAt, refusedAt) || other.refusedAt == refusedAt)&&(identical(other.refusedReason, refusedReason) || other.refusedReason == refusedReason)&&(identical(other.refundedAt, refundedAt) || other.refundedAt == refundedAt)&&(identical(other.doneBy, doneBy) || other.doneBy == doneBy)&&(identical(other.refusedBy, refusedBy) || other.refusedBy == refusedBy)&&(identical(other.acceptedAt, acceptedAt) || other.acceptedAt == acceptedAt)&&(identical(other.acceptedBy, acceptedBy) || other.acceptedBy == acceptedBy));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,kind,label,priceCents,status,withBooking,paidAt,doneAt,refusedAt,refusedReason,refundedAt,doneBy,refusedBy,acceptedAt,acceptedBy);
}

@override
String toString() {
    return 'ExtraOrderModel(id: $id, kind: $kind, label: $label, priceCents: $priceCents, status: $status, withBooking: $withBooking, paidAt: $paidAt, doneAt: $doneAt, refusedAt: $refusedAt, refusedReason: $refusedReason, refundedAt: $refundedAt, doneBy: $doneBy, refusedBy: $refusedBy, acceptedAt: $acceptedAt, acceptedBy: $acceptedBy)';
}


}

/// @nodoc
abstract mixin class _$ExtraOrderModelCopyWith<$Res> implements $ExtraOrderModelCopyWith<$Res> {
  factory _$ExtraOrderModelCopyWith(_ExtraOrderModel value, $Res Function(_ExtraOrderModel) _then) = __$ExtraOrderModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String kind, String label, int priceCents, String status, bool withBooking, DateTime? paidAt, DateTime? doneAt, DateTime? refusedAt, String? refusedReason, DateTime? refundedAt, String? doneBy, String? refusedBy, DateTime? acceptedAt, String? acceptedBy
});




}
/// @nodoc
class __$ExtraOrderModelCopyWithImpl<$Res>
    implements _$ExtraOrderModelCopyWith<$Res> {
  __$ExtraOrderModelCopyWithImpl(this._self, this._then);

  final _ExtraOrderModel _self;
  final $Res Function(_ExtraOrderModel) _then;

/// Create a copy of ExtraOrderModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? kind = null,Object? label = null,Object? priceCents = null,Object? status = null,Object? withBooking = null,Object? paidAt = freezed,Object? doneAt = freezed,Object? refusedAt = freezed,Object? refusedReason = freezed,Object? refundedAt = freezed,Object? doneBy = freezed,Object? refusedBy = freezed,Object? acceptedAt = freezed,Object? acceptedBy = freezed,}) {
  return _then(_ExtraOrderModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,withBooking: null == withBooking ? _self.withBooking : withBooking // ignore: cast_nullable_to_non_nullable
as bool,paidAt: freezed == paidAt ? _self.paidAt : paidAt // ignore: cast_nullable_to_non_nullable
as DateTime?,doneAt: freezed == doneAt ? _self.doneAt : doneAt // ignore: cast_nullable_to_non_nullable
as DateTime?,refusedAt: freezed == refusedAt ? _self.refusedAt : refusedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,refusedReason: freezed == refusedReason ? _self.refusedReason : refusedReason // ignore: cast_nullable_to_non_nullable
as String?,refundedAt: freezed == refundedAt ? _self.refundedAt : refundedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,doneBy: freezed == doneBy ? _self.doneBy : doneBy // ignore: cast_nullable_to_non_nullable
as String?,refusedBy: freezed == refusedBy ? _self.refusedBy : refusedBy // ignore: cast_nullable_to_non_nullable
as String?,acceptedAt: freezed == acceptedAt ? _self.acceptedAt : acceptedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,acceptedBy: freezed == acceptedBy ? _self.acceptedBy : acceptedBy // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$TravellerExtrasModel {

 List<ExtraOfferModel> get offers; List<ExtraOrderModel> get orders; DateTime? get orderUntil; bool get canOrder;
/// Create a copy of TravellerExtrasModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TravellerExtrasModelCopyWith<TravellerExtrasModel> get copyWith => _$TravellerExtrasModelCopyWithImpl<TravellerExtrasModel>(this as TravellerExtrasModel, _$identity);

  /// Serializes this TravellerExtrasModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as TravellerExtrasModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TravellerExtrasModel&&const DeepCollectionEquality().equals(other.offers, _this.offers)&&const DeepCollectionEquality().equals(other.orders, _this.orders)&&(identical(other.orderUntil, _this.orderUntil) || other.orderUntil == _this.orderUntil)&&(identical(other.canOrder, _this.canOrder) || other.canOrder == _this.canOrder));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as TravellerExtrasModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.offers),const DeepCollectionEquality().hash(_this.orders),_this.orderUntil,_this.canOrder);
}

@override
String toString() {
  final _this = this as TravellerExtrasModel;
  return 'TravellerExtrasModel(offers: ${_this.offers}, orders: ${_this.orders}, orderUntil: ${_this.orderUntil}, canOrder: ${_this.canOrder})';
}


}

/// @nodoc
abstract mixin class $TravellerExtrasModelCopyWith<$Res>  {
  factory $TravellerExtrasModelCopyWith(TravellerExtrasModel value, $Res Function(TravellerExtrasModel) _then) = _$TravellerExtrasModelCopyWithImpl;
@useResult
$Res call({
 List<ExtraOfferModel> offers, List<ExtraOrderModel> orders, DateTime? orderUntil, bool canOrder
});




}
/// @nodoc
class _$TravellerExtrasModelCopyWithImpl<$Res>
    implements $TravellerExtrasModelCopyWith<$Res> {
  _$TravellerExtrasModelCopyWithImpl(this._self, this._then);

  final TravellerExtrasModel _self;
  final $Res Function(TravellerExtrasModel) _then;

/// Create a copy of TravellerExtrasModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? offers = null,Object? orders = null,Object? orderUntil = freezed,Object? canOrder = null,}) {
  return _then(TravellerExtrasModel(
offers: null == offers ? _self.offers : offers // ignore: cast_nullable_to_non_nullable
as List<ExtraOfferModel>,orders: null == orders ? _self.orders : orders // ignore: cast_nullable_to_non_nullable
as List<ExtraOrderModel>,orderUntil: freezed == orderUntil ? _self.orderUntil : orderUntil // ignore: cast_nullable_to_non_nullable
as DateTime?,canOrder: null == canOrder ? _self.canOrder : canOrder // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [TravellerExtrasModel].
extension TravellerExtrasModelPatterns on TravellerExtrasModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TravellerExtrasModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TravellerExtrasModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TravellerExtrasModel value)  $default,){
final _that = this;
switch (_that) {
case _TravellerExtrasModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TravellerExtrasModel value)?  $default,){
final _that = this;
switch (_that) {
case _TravellerExtrasModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ExtraOfferModel> offers,  List<ExtraOrderModel> orders,  DateTime? orderUntil,  bool canOrder)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TravellerExtrasModel() when $default != null:
return $default(_that.offers,_that.orders,_that.orderUntil,_that.canOrder);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ExtraOfferModel> offers,  List<ExtraOrderModel> orders,  DateTime? orderUntil,  bool canOrder)  $default,) {final _that = this;
switch (_that) {
case _TravellerExtrasModel():
return $default(_that.offers,_that.orders,_that.orderUntil,_that.canOrder);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ExtraOfferModel> offers,  List<ExtraOrderModel> orders,  DateTime? orderUntil,  bool canOrder)?  $default,) {final _that = this;
switch (_that) {
case _TravellerExtrasModel() when $default != null:
return $default(_that.offers,_that.orders,_that.orderUntil,_that.canOrder);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TravellerExtrasModel extends TravellerExtrasModel {
  const _TravellerExtrasModel({ List<ExtraOfferModel> offers = const <ExtraOfferModel>[],  List<ExtraOrderModel> orders = const <ExtraOrderModel>[], this.orderUntil, this.canOrder = false}): _offers = offers,_orders = orders,super._();
  factory _TravellerExtrasModel.fromJson(Map<String, dynamic> json) => _$TravellerExtrasModelFromJson(json);

 final  List<ExtraOfferModel> _offers;
@override@JsonKey() List<ExtraOfferModel> get offers {
  if (_offers is EqualUnmodifiableListView) return _offers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_offers);
}

 final  List<ExtraOrderModel> _orders;
@override@JsonKey() List<ExtraOrderModel> get orders {
  if (_orders is EqualUnmodifiableListView) return _orders;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_orders);
}

@override final  DateTime? orderUntil;
@override@JsonKey() final  bool canOrder;

/// Create a copy of TravellerExtrasModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TravellerExtrasModelCopyWith<_TravellerExtrasModel> get copyWith => __$TravellerExtrasModelCopyWithImpl<_TravellerExtrasModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TravellerExtrasModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _TravellerExtrasModel&&const DeepCollectionEquality().equals(other.offers, _offers)&&const DeepCollectionEquality().equals(other.orders, _orders)&&(identical(other.orderUntil, orderUntil) || other.orderUntil == orderUntil)&&(identical(other.canOrder, canOrder) || other.canOrder == canOrder));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_offers),const DeepCollectionEquality().hash(_orders),orderUntil,canOrder);
}

@override
String toString() {
    return 'TravellerExtrasModel(offers: $offers, orders: $orders, orderUntil: $orderUntil, canOrder: $canOrder)';
}


}

/// @nodoc
abstract mixin class _$TravellerExtrasModelCopyWith<$Res> implements $TravellerExtrasModelCopyWith<$Res> {
  factory _$TravellerExtrasModelCopyWith(_TravellerExtrasModel value, $Res Function(_TravellerExtrasModel) _then) = __$TravellerExtrasModelCopyWithImpl;
@override @useResult
$Res call({
 List<ExtraOfferModel> offers, List<ExtraOrderModel> orders, DateTime? orderUntil, bool canOrder
});




}
/// @nodoc
class __$TravellerExtrasModelCopyWithImpl<$Res>
    implements _$TravellerExtrasModelCopyWith<$Res> {
  __$TravellerExtrasModelCopyWithImpl(this._self, this._then);

  final _TravellerExtrasModel _self;
  final $Res Function(_TravellerExtrasModel) _then;

/// Create a copy of TravellerExtrasModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? offers = null,Object? orders = null,Object? orderUntil = freezed,Object? canOrder = null,}) {
  return _then(_TravellerExtrasModel(
offers: null == offers ? _self._offers : offers // ignore: cast_nullable_to_non_nullable
as List<ExtraOfferModel>,orders: null == orders ? _self._orders : orders // ignore: cast_nullable_to_non_nullable
as List<ExtraOrderModel>,orderUntil: freezed == orderUntil ? _self.orderUntil : orderUntil // ignore: cast_nullable_to_non_nullable
as DateTime?,canOrder: null == canOrder ? _self.canOrder : canOrder // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$ExtraPaymentModel {

 String? get clientSecret; String? get paymentIntentId; int? get amountCents; String get currency; bool get paid;
/// Create a copy of ExtraPaymentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraPaymentModelCopyWith<ExtraPaymentModel> get copyWith => _$ExtraPaymentModelCopyWithImpl<ExtraPaymentModel>(this as ExtraPaymentModel, _$identity);

  /// Serializes this ExtraPaymentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ExtraPaymentModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraPaymentModel&&(identical(other.clientSecret, _this.clientSecret) || other.clientSecret == _this.clientSecret)&&(identical(other.paymentIntentId, _this.paymentIntentId) || other.paymentIntentId == _this.paymentIntentId)&&(identical(other.amountCents, _this.amountCents) || other.amountCents == _this.amountCents)&&(identical(other.currency, _this.currency) || other.currency == _this.currency)&&(identical(other.paid, _this.paid) || other.paid == _this.paid));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ExtraPaymentModel;
  return Object.hash(runtimeType,_this.clientSecret,_this.paymentIntentId,_this.amountCents,_this.currency,_this.paid);
}

@override
String toString() {
  final _this = this as ExtraPaymentModel;
  return 'ExtraPaymentModel(clientSecret: ${_this.clientSecret}, paymentIntentId: ${_this.paymentIntentId}, amountCents: ${_this.amountCents}, currency: ${_this.currency}, paid: ${_this.paid})';
}


}

/// @nodoc
abstract mixin class $ExtraPaymentModelCopyWith<$Res>  {
  factory $ExtraPaymentModelCopyWith(ExtraPaymentModel value, $Res Function(ExtraPaymentModel) _then) = _$ExtraPaymentModelCopyWithImpl;
@useResult
$Res call({
 String? clientSecret, String? paymentIntentId, int? amountCents, String currency, bool paid
});




}
/// @nodoc
class _$ExtraPaymentModelCopyWithImpl<$Res>
    implements $ExtraPaymentModelCopyWith<$Res> {
  _$ExtraPaymentModelCopyWithImpl(this._self, this._then);

  final ExtraPaymentModel _self;
  final $Res Function(ExtraPaymentModel) _then;

/// Create a copy of ExtraPaymentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? clientSecret = freezed,Object? paymentIntentId = freezed,Object? amountCents = freezed,Object? currency = null,Object? paid = null,}) {
  return _then(ExtraPaymentModel(
clientSecret: freezed == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String?,paymentIntentId: freezed == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String?,amountCents: freezed == amountCents ? _self.amountCents : amountCents // ignore: cast_nullable_to_non_nullable
as int?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,paid: null == paid ? _self.paid : paid // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ExtraPaymentModel].
extension ExtraPaymentModelPatterns on ExtraPaymentModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraPaymentModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraPaymentModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraPaymentModel value)  $default,){
final _that = this;
switch (_that) {
case _ExtraPaymentModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraPaymentModel value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraPaymentModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? clientSecret,  String? paymentIntentId,  int? amountCents,  String currency,  bool paid)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraPaymentModel() when $default != null:
return $default(_that.clientSecret,_that.paymentIntentId,_that.amountCents,_that.currency,_that.paid);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? clientSecret,  String? paymentIntentId,  int? amountCents,  String currency,  bool paid)  $default,) {final _that = this;
switch (_that) {
case _ExtraPaymentModel():
return $default(_that.clientSecret,_that.paymentIntentId,_that.amountCents,_that.currency,_that.paid);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? clientSecret,  String? paymentIntentId,  int? amountCents,  String currency,  bool paid)?  $default,) {final _that = this;
switch (_that) {
case _ExtraPaymentModel() when $default != null:
return $default(_that.clientSecret,_that.paymentIntentId,_that.amountCents,_that.currency,_that.paid);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtraPaymentModel implements ExtraPaymentModel {
  const _ExtraPaymentModel({this.clientSecret, this.paymentIntentId, this.amountCents, this.currency = 'eur', this.paid = false});
  factory _ExtraPaymentModel.fromJson(Map<String, dynamic> json) => _$ExtraPaymentModelFromJson(json);

@override final  String? clientSecret;
@override final  String? paymentIntentId;
@override final  int? amountCents;
@override@JsonKey() final  String currency;
@override@JsonKey() final  bool paid;

/// Create a copy of ExtraPaymentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraPaymentModelCopyWith<_ExtraPaymentModel> get copyWith => __$ExtraPaymentModelCopyWithImpl<_ExtraPaymentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtraPaymentModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraPaymentModel&&(identical(other.clientSecret, clientSecret) || other.clientSecret == clientSecret)&&(identical(other.paymentIntentId, paymentIntentId) || other.paymentIntentId == paymentIntentId)&&(identical(other.amountCents, amountCents) || other.amountCents == amountCents)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.paid, paid) || other.paid == paid));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,clientSecret,paymentIntentId,amountCents,currency,paid);
}

@override
String toString() {
    return 'ExtraPaymentModel(clientSecret: $clientSecret, paymentIntentId: $paymentIntentId, amountCents: $amountCents, currency: $currency, paid: $paid)';
}


}

/// @nodoc
abstract mixin class _$ExtraPaymentModelCopyWith<$Res> implements $ExtraPaymentModelCopyWith<$Res> {
  factory _$ExtraPaymentModelCopyWith(_ExtraPaymentModel value, $Res Function(_ExtraPaymentModel) _then) = __$ExtraPaymentModelCopyWithImpl;
@override @useResult
$Res call({
 String? clientSecret, String? paymentIntentId, int? amountCents, String currency, bool paid
});




}
/// @nodoc
class __$ExtraPaymentModelCopyWithImpl<$Res>
    implements _$ExtraPaymentModelCopyWith<$Res> {
  __$ExtraPaymentModelCopyWithImpl(this._self, this._then);

  final _ExtraPaymentModel _self;
  final $Res Function(_ExtraPaymentModel) _then;

/// Create a copy of ExtraPaymentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? clientSecret = freezed,Object? paymentIntentId = freezed,Object? amountCents = freezed,Object? currency = null,Object? paid = null,}) {
  return _then(_ExtraPaymentModel(
clientSecret: freezed == clientSecret ? _self.clientSecret : clientSecret // ignore: cast_nullable_to_non_nullable
as String?,paymentIntentId: freezed == paymentIntentId ? _self.paymentIntentId : paymentIntentId // ignore: cast_nullable_to_non_nullable
as String?,amountCents: freezed == amountCents ? _self.amountCents : amountCents // ignore: cast_nullable_to_non_nullable
as int?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,paid: null == paid ? _self.paid : paid // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$ExtraOrderResponseModel {

 ExtraOrderModel get extra; ExtraPaymentModel get payment;
/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraOrderResponseModelCopyWith<ExtraOrderResponseModel> get copyWith => _$ExtraOrderResponseModelCopyWithImpl<ExtraOrderResponseModel>(this as ExtraOrderResponseModel, _$identity);

  /// Serializes this ExtraOrderResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ExtraOrderResponseModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraOrderResponseModel&&(identical(other.extra, _this.extra) || other.extra == _this.extra)&&(identical(other.payment, _this.payment) || other.payment == _this.payment));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ExtraOrderResponseModel;
  return Object.hash(runtimeType,_this.extra,_this.payment);
}

@override
String toString() {
  final _this = this as ExtraOrderResponseModel;
  return 'ExtraOrderResponseModel(extra: ${_this.extra}, payment: ${_this.payment})';
}


}

/// @nodoc
abstract mixin class $ExtraOrderResponseModelCopyWith<$Res>  {
  factory $ExtraOrderResponseModelCopyWith(ExtraOrderResponseModel value, $Res Function(ExtraOrderResponseModel) _then) = _$ExtraOrderResponseModelCopyWithImpl;
@useResult
$Res call({
 ExtraOrderModel extra, ExtraPaymentModel payment
});


$ExtraOrderModelCopyWith<$Res> get extra;$ExtraPaymentModelCopyWith<$Res> get payment;

}
/// @nodoc
class _$ExtraOrderResponseModelCopyWithImpl<$Res>
    implements $ExtraOrderResponseModelCopyWith<$Res> {
  _$ExtraOrderResponseModelCopyWithImpl(this._self, this._then);

  final ExtraOrderResponseModel _self;
  final $Res Function(ExtraOrderResponseModel) _then;

/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? extra = null,Object? payment = null,}) {
  return _then(ExtraOrderResponseModel(
extra: null == extra ? _self.extra : extra // ignore: cast_nullable_to_non_nullable
as ExtraOrderModel,payment: null == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as ExtraPaymentModel,
  ));
}
/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExtraOrderModelCopyWith<$Res> get extra {
  
  return $ExtraOrderModelCopyWith<$Res>(_self.extra, (value) {
    return _then(_self.copyWith(extra: value));
  });
}/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExtraPaymentModelCopyWith<$Res> get payment {
  
  return $ExtraPaymentModelCopyWith<$Res>(_self.payment, (value) {
    return _then(_self.copyWith(payment: value));
  });
}
}


/// Adds pattern-matching-related methods to [ExtraOrderResponseModel].
extension ExtraOrderResponseModelPatterns on ExtraOrderResponseModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraOrderResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraOrderResponseModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraOrderResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _ExtraOrderResponseModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraOrderResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraOrderResponseModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ExtraOrderModel extra,  ExtraPaymentModel payment)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraOrderResponseModel() when $default != null:
return $default(_that.extra,_that.payment);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ExtraOrderModel extra,  ExtraPaymentModel payment)  $default,) {final _that = this;
switch (_that) {
case _ExtraOrderResponseModel():
return $default(_that.extra,_that.payment);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ExtraOrderModel extra,  ExtraPaymentModel payment)?  $default,) {final _that = this;
switch (_that) {
case _ExtraOrderResponseModel() when $default != null:
return $default(_that.extra,_that.payment);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtraOrderResponseModel implements ExtraOrderResponseModel {
  const _ExtraOrderResponseModel({required this.extra, required this.payment});
  factory _ExtraOrderResponseModel.fromJson(Map<String, dynamic> json) => _$ExtraOrderResponseModelFromJson(json);

@override final  ExtraOrderModel extra;
@override final  ExtraPaymentModel payment;

/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraOrderResponseModelCopyWith<_ExtraOrderResponseModel> get copyWith => __$ExtraOrderResponseModelCopyWithImpl<_ExtraOrderResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtraOrderResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraOrderResponseModel&&(identical(other.extra, extra) || other.extra == extra)&&(identical(other.payment, payment) || other.payment == payment));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,extra,payment);
}

@override
String toString() {
    return 'ExtraOrderResponseModel(extra: $extra, payment: $payment)';
}


}

/// @nodoc
abstract mixin class _$ExtraOrderResponseModelCopyWith<$Res> implements $ExtraOrderResponseModelCopyWith<$Res> {
  factory _$ExtraOrderResponseModelCopyWith(_ExtraOrderResponseModel value, $Res Function(_ExtraOrderResponseModel) _then) = __$ExtraOrderResponseModelCopyWithImpl;
@override @useResult
$Res call({
 ExtraOrderModel extra, ExtraPaymentModel payment
});


@override $ExtraOrderModelCopyWith<$Res> get extra;@override $ExtraPaymentModelCopyWith<$Res> get payment;

}
/// @nodoc
class __$ExtraOrderResponseModelCopyWithImpl<$Res>
    implements _$ExtraOrderResponseModelCopyWith<$Res> {
  __$ExtraOrderResponseModelCopyWithImpl(this._self, this._then);

  final _ExtraOrderResponseModel _self;
  final $Res Function(_ExtraOrderResponseModel) _then;

/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? extra = null,Object? payment = null,}) {
  return _then(_ExtraOrderResponseModel(
extra: null == extra ? _self.extra : extra // ignore: cast_nullable_to_non_nullable
as ExtraOrderModel,payment: null == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as ExtraPaymentModel,
  ));
}

/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExtraOrderModelCopyWith<$Res> get extra {
  
  return $ExtraOrderModelCopyWith<$Res>(_self.extra, (value) {
    return _then(_self.copyWith(extra: value));
  });
}/// Create a copy of ExtraOrderResponseModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ExtraPaymentModelCopyWith<$Res> get payment {
  
  return $ExtraPaymentModelCopyWith<$Res>(_self.payment, (value) {
    return _then(_self.copyWith(payment: value));
  });
}
}


/// @nodoc
mixin _$StaffExtrasModel {

 List<ExtraOrderModel> get extras;
/// Create a copy of StaffExtrasModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StaffExtrasModelCopyWith<StaffExtrasModel> get copyWith => _$StaffExtrasModelCopyWithImpl<StaffExtrasModel>(this as StaffExtrasModel, _$identity);

  /// Serializes this StaffExtrasModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as StaffExtrasModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StaffExtrasModel&&const DeepCollectionEquality().equals(other.extras, _this.extras));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as StaffExtrasModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.extras));
}

@override
String toString() {
  final _this = this as StaffExtrasModel;
  return 'StaffExtrasModel(extras: ${_this.extras})';
}


}

/// @nodoc
abstract mixin class $StaffExtrasModelCopyWith<$Res>  {
  factory $StaffExtrasModelCopyWith(StaffExtrasModel value, $Res Function(StaffExtrasModel) _then) = _$StaffExtrasModelCopyWithImpl;
@useResult
$Res call({
 List<ExtraOrderModel> extras
});




}
/// @nodoc
class _$StaffExtrasModelCopyWithImpl<$Res>
    implements $StaffExtrasModelCopyWith<$Res> {
  _$StaffExtrasModelCopyWithImpl(this._self, this._then);

  final StaffExtrasModel _self;
  final $Res Function(StaffExtrasModel) _then;

/// Create a copy of StaffExtrasModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? extras = null,}) {
  return _then(StaffExtrasModel(
extras: null == extras ? _self.extras : extras // ignore: cast_nullable_to_non_nullable
as List<ExtraOrderModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [StaffExtrasModel].
extension StaffExtrasModelPatterns on StaffExtrasModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StaffExtrasModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StaffExtrasModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StaffExtrasModel value)  $default,){
final _that = this;
switch (_that) {
case _StaffExtrasModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StaffExtrasModel value)?  $default,){
final _that = this;
switch (_that) {
case _StaffExtrasModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ExtraOrderModel> extras)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StaffExtrasModel() when $default != null:
return $default(_that.extras);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ExtraOrderModel> extras)  $default,) {final _that = this;
switch (_that) {
case _StaffExtrasModel():
return $default(_that.extras);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ExtraOrderModel> extras)?  $default,) {final _that = this;
switch (_that) {
case _StaffExtrasModel() when $default != null:
return $default(_that.extras);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StaffExtrasModel implements StaffExtrasModel {
  const _StaffExtrasModel({ List<ExtraOrderModel> extras = const <ExtraOrderModel>[]}): _extras = extras;
  factory _StaffExtrasModel.fromJson(Map<String, dynamic> json) => _$StaffExtrasModelFromJson(json);

 final  List<ExtraOrderModel> _extras;
@override@JsonKey() List<ExtraOrderModel> get extras {
  if (_extras is EqualUnmodifiableListView) return _extras;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_extras);
}


/// Create a copy of StaffExtrasModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StaffExtrasModelCopyWith<_StaffExtrasModel> get copyWith => __$StaffExtrasModelCopyWithImpl<_StaffExtrasModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StaffExtrasModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _StaffExtrasModel&&const DeepCollectionEquality().equals(other.extras, _extras));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_extras));
}

@override
String toString() {
    return 'StaffExtrasModel(extras: $extras)';
}


}

/// @nodoc
abstract mixin class _$StaffExtrasModelCopyWith<$Res> implements $StaffExtrasModelCopyWith<$Res> {
  factory _$StaffExtrasModelCopyWith(_StaffExtrasModel value, $Res Function(_StaffExtrasModel) _then) = __$StaffExtrasModelCopyWithImpl;
@override @useResult
$Res call({
 List<ExtraOrderModel> extras
});




}
/// @nodoc
class __$StaffExtrasModelCopyWithImpl<$Res>
    implements _$StaffExtrasModelCopyWith<$Res> {
  __$StaffExtrasModelCopyWithImpl(this._self, this._then);

  final _StaffExtrasModel _self;
  final $Res Function(_StaffExtrasModel) _then;

/// Create a copy of StaffExtrasModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? extras = null,}) {
  return _then(_StaffExtrasModel(
extras: null == extras ? _self._extras : extras // ignore: cast_nullable_to_non_nullable
as List<ExtraOrderModel>,
  ));
}


}


/// @nodoc
mixin _$ExtraSettingModel {

 String get kind; String get label; String get description; bool get enabled; int get priceCents; int? get defaultPriceCents;
/// Create a copy of ExtraSettingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraSettingModelCopyWith<ExtraSettingModel> get copyWith => _$ExtraSettingModelCopyWithImpl<ExtraSettingModel>(this as ExtraSettingModel, _$identity);

  /// Serializes this ExtraSettingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ExtraSettingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraSettingModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.description, _this.description) || other.description == _this.description)&&(identical(other.enabled, _this.enabled) || other.enabled == _this.enabled)&&(identical(other.priceCents, _this.priceCents) || other.priceCents == _this.priceCents)&&(identical(other.defaultPriceCents, _this.defaultPriceCents) || other.defaultPriceCents == _this.defaultPriceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ExtraSettingModel;
  return Object.hash(runtimeType,_this.kind,_this.label,_this.description,_this.enabled,_this.priceCents,_this.defaultPriceCents);
}

@override
String toString() {
  final _this = this as ExtraSettingModel;
  return 'ExtraSettingModel(kind: ${_this.kind}, label: ${_this.label}, description: ${_this.description}, enabled: ${_this.enabled}, priceCents: ${_this.priceCents}, defaultPriceCents: ${_this.defaultPriceCents})';
}


}

/// @nodoc
abstract mixin class $ExtraSettingModelCopyWith<$Res>  {
  factory $ExtraSettingModelCopyWith(ExtraSettingModel value, $Res Function(ExtraSettingModel) _then) = _$ExtraSettingModelCopyWithImpl;
@useResult
$Res call({
 String kind, String label, String description, bool enabled, int priceCents, int? defaultPriceCents
});




}
/// @nodoc
class _$ExtraSettingModelCopyWithImpl<$Res>
    implements $ExtraSettingModelCopyWith<$Res> {
  _$ExtraSettingModelCopyWithImpl(this._self, this._then);

  final ExtraSettingModel _self;
  final $Res Function(ExtraSettingModel) _then;

/// Create a copy of ExtraSettingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? label = null,Object? description = null,Object? enabled = null,Object? priceCents = null,Object? defaultPriceCents = freezed,}) {
  return _then(ExtraSettingModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,enabled: null == enabled ? _self.enabled : enabled // ignore: cast_nullable_to_non_nullable
as bool,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,defaultPriceCents: freezed == defaultPriceCents ? _self.defaultPriceCents : defaultPriceCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [ExtraSettingModel].
extension ExtraSettingModelPatterns on ExtraSettingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraSettingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraSettingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraSettingModel value)  $default,){
final _that = this;
switch (_that) {
case _ExtraSettingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraSettingModel value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraSettingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  String label,  String description,  bool enabled,  int priceCents,  int? defaultPriceCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraSettingModel() when $default != null:
return $default(_that.kind,_that.label,_that.description,_that.enabled,_that.priceCents,_that.defaultPriceCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  String label,  String description,  bool enabled,  int priceCents,  int? defaultPriceCents)  $default,) {final _that = this;
switch (_that) {
case _ExtraSettingModel():
return $default(_that.kind,_that.label,_that.description,_that.enabled,_that.priceCents,_that.defaultPriceCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  String label,  String description,  bool enabled,  int priceCents,  int? defaultPriceCents)?  $default,) {final _that = this;
switch (_that) {
case _ExtraSettingModel() when $default != null:
return $default(_that.kind,_that.label,_that.description,_that.enabled,_that.priceCents,_that.defaultPriceCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtraSettingModel implements ExtraSettingModel {
  const _ExtraSettingModel({required this.kind, required this.label, this.description = '', this.enabled = false, required this.priceCents, this.defaultPriceCents});
  factory _ExtraSettingModel.fromJson(Map<String, dynamic> json) => _$ExtraSettingModelFromJson(json);

@override final  String kind;
@override final  String label;
@override@JsonKey() final  String description;
@override@JsonKey() final  bool enabled;
@override final  int priceCents;
@override final  int? defaultPriceCents;

/// Create a copy of ExtraSettingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraSettingModelCopyWith<_ExtraSettingModel> get copyWith => __$ExtraSettingModelCopyWithImpl<_ExtraSettingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtraSettingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraSettingModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.label, label) || other.label == label)&&(identical(other.description, description) || other.description == description)&&(identical(other.enabled, enabled) || other.enabled == enabled)&&(identical(other.priceCents, priceCents) || other.priceCents == priceCents)&&(identical(other.defaultPriceCents, defaultPriceCents) || other.defaultPriceCents == defaultPriceCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,label,description,enabled,priceCents,defaultPriceCents);
}

@override
String toString() {
    return 'ExtraSettingModel(kind: $kind, label: $label, description: $description, enabled: $enabled, priceCents: $priceCents, defaultPriceCents: $defaultPriceCents)';
}


}

/// @nodoc
abstract mixin class _$ExtraSettingModelCopyWith<$Res> implements $ExtraSettingModelCopyWith<$Res> {
  factory _$ExtraSettingModelCopyWith(_ExtraSettingModel value, $Res Function(_ExtraSettingModel) _then) = __$ExtraSettingModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, String label, String description, bool enabled, int priceCents, int? defaultPriceCents
});




}
/// @nodoc
class __$ExtraSettingModelCopyWithImpl<$Res>
    implements _$ExtraSettingModelCopyWith<$Res> {
  __$ExtraSettingModelCopyWithImpl(this._self, this._then);

  final _ExtraSettingModel _self;
  final $Res Function(_ExtraSettingModel) _then;

/// Create a copy of ExtraSettingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? label = null,Object? description = null,Object? enabled = null,Object? priceCents = null,Object? defaultPriceCents = freezed,}) {
  return _then(_ExtraSettingModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,enabled: null == enabled ? _self.enabled : enabled // ignore: cast_nullable_to_non_nullable
as bool,priceCents: null == priceCents ? _self.priceCents : priceCents // ignore: cast_nullable_to_non_nullable
as int,defaultPriceCents: freezed == defaultPriceCents ? _self.defaultPriceCents : defaultPriceCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$ExtraSettingsModel {

 int get leadHours; List<ExtraSettingModel> get offers;
/// Create a copy of ExtraSettingsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtraSettingsModelCopyWith<ExtraSettingsModel> get copyWith => _$ExtraSettingsModelCopyWithImpl<ExtraSettingsModel>(this as ExtraSettingsModel, _$identity);

  /// Serializes this ExtraSettingsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ExtraSettingsModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtraSettingsModel&&(identical(other.leadHours, _this.leadHours) || other.leadHours == _this.leadHours)&&const DeepCollectionEquality().equals(other.offers, _this.offers));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ExtraSettingsModel;
  return Object.hash(runtimeType,_this.leadHours,const DeepCollectionEquality().hash(_this.offers));
}

@override
String toString() {
  final _this = this as ExtraSettingsModel;
  return 'ExtraSettingsModel(leadHours: ${_this.leadHours}, offers: ${_this.offers})';
}


}

/// @nodoc
abstract mixin class $ExtraSettingsModelCopyWith<$Res>  {
  factory $ExtraSettingsModelCopyWith(ExtraSettingsModel value, $Res Function(ExtraSettingsModel) _then) = _$ExtraSettingsModelCopyWithImpl;
@useResult
$Res call({
 int leadHours, List<ExtraSettingModel> offers
});




}
/// @nodoc
class _$ExtraSettingsModelCopyWithImpl<$Res>
    implements $ExtraSettingsModelCopyWith<$Res> {
  _$ExtraSettingsModelCopyWithImpl(this._self, this._then);

  final ExtraSettingsModel _self;
  final $Res Function(ExtraSettingsModel) _then;

/// Create a copy of ExtraSettingsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? leadHours = null,Object? offers = null,}) {
  return _then(ExtraSettingsModel(
leadHours: null == leadHours ? _self.leadHours : leadHours // ignore: cast_nullable_to_non_nullable
as int,offers: null == offers ? _self.offers : offers // ignore: cast_nullable_to_non_nullable
as List<ExtraSettingModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [ExtraSettingsModel].
extension ExtraSettingsModelPatterns on ExtraSettingsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtraSettingsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtraSettingsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtraSettingsModel value)  $default,){
final _that = this;
switch (_that) {
case _ExtraSettingsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtraSettingsModel value)?  $default,){
final _that = this;
switch (_that) {
case _ExtraSettingsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int leadHours,  List<ExtraSettingModel> offers)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtraSettingsModel() when $default != null:
return $default(_that.leadHours,_that.offers);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int leadHours,  List<ExtraSettingModel> offers)  $default,) {final _that = this;
switch (_that) {
case _ExtraSettingsModel():
return $default(_that.leadHours,_that.offers);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int leadHours,  List<ExtraSettingModel> offers)?  $default,) {final _that = this;
switch (_that) {
case _ExtraSettingsModel() when $default != null:
return $default(_that.leadHours,_that.offers);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtraSettingsModel implements ExtraSettingsModel {
  const _ExtraSettingsModel({this.leadHours = 24,  List<ExtraSettingModel> offers = const <ExtraSettingModel>[]}): _offers = offers;
  factory _ExtraSettingsModel.fromJson(Map<String, dynamic> json) => _$ExtraSettingsModelFromJson(json);

@override@JsonKey() final  int leadHours;
 final  List<ExtraSettingModel> _offers;
@override@JsonKey() List<ExtraSettingModel> get offers {
  if (_offers is EqualUnmodifiableListView) return _offers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_offers);
}


/// Create a copy of ExtraSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtraSettingsModelCopyWith<_ExtraSettingsModel> get copyWith => __$ExtraSettingsModelCopyWithImpl<_ExtraSettingsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtraSettingsModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtraSettingsModel&&(identical(other.leadHours, leadHours) || other.leadHours == leadHours)&&const DeepCollectionEquality().equals(other.offers, _offers));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,leadHours,const DeepCollectionEquality().hash(_offers));
}

@override
String toString() {
    return 'ExtraSettingsModel(leadHours: $leadHours, offers: $offers)';
}


}

/// @nodoc
abstract mixin class _$ExtraSettingsModelCopyWith<$Res> implements $ExtraSettingsModelCopyWith<$Res> {
  factory _$ExtraSettingsModelCopyWith(_ExtraSettingsModel value, $Res Function(_ExtraSettingsModel) _then) = __$ExtraSettingsModelCopyWithImpl;
@override @useResult
$Res call({
 int leadHours, List<ExtraSettingModel> offers
});




}
/// @nodoc
class __$ExtraSettingsModelCopyWithImpl<$Res>
    implements _$ExtraSettingsModelCopyWith<$Res> {
  __$ExtraSettingsModelCopyWithImpl(this._self, this._then);

  final _ExtraSettingsModel _self;
  final $Res Function(_ExtraSettingsModel) _then;

/// Create a copy of ExtraSettingsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? leadHours = null,Object? offers = null,}) {
  return _then(_ExtraSettingsModel(
leadHours: null == leadHours ? _self.leadHours : leadHours // ignore: cast_nullable_to_non_nullable
as int,offers: null == offers ? _self._offers : offers // ignore: cast_nullable_to_non_nullable
as List<ExtraSettingModel>,
  ));
}


}

// dart format on
