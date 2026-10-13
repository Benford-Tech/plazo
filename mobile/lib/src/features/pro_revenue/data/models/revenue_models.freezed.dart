// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'revenue_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$RevenueSummaryModel {

/// The parking's local date the figures stop at (YYYY-MM-DD).
 String get today; RevenueMonthModel get month; int get todayCents; int get weekCents;
/// Create a copy of RevenueSummaryModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueSummaryModelCopyWith<RevenueSummaryModel> get copyWith => _$RevenueSummaryModelCopyWithImpl<RevenueSummaryModel>(this as RevenueSummaryModel, _$identity);

  /// Serializes this RevenueSummaryModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RevenueSummaryModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueSummaryModel&&(identical(other.today, _this.today) || other.today == _this.today)&&(identical(other.month, _this.month) || other.month == _this.month)&&(identical(other.todayCents, _this.todayCents) || other.todayCents == _this.todayCents)&&(identical(other.weekCents, _this.weekCents) || other.weekCents == _this.weekCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RevenueSummaryModel;
  return Object.hash(runtimeType,_this.today,_this.month,_this.todayCents,_this.weekCents);
}

@override
String toString() {
  final _this = this as RevenueSummaryModel;
  return 'RevenueSummaryModel(today: ${_this.today}, month: ${_this.month}, todayCents: ${_this.todayCents}, weekCents: ${_this.weekCents})';
}


}

/// @nodoc
abstract mixin class $RevenueSummaryModelCopyWith<$Res>  {
  factory $RevenueSummaryModelCopyWith(RevenueSummaryModel value, $Res Function(RevenueSummaryModel) _then) = _$RevenueSummaryModelCopyWithImpl;
@useResult
$Res call({
 String today, RevenueMonthModel month, int todayCents, int weekCents
});


$RevenueMonthModelCopyWith<$Res> get month;

}
/// @nodoc
class _$RevenueSummaryModelCopyWithImpl<$Res>
    implements $RevenueSummaryModelCopyWith<$Res> {
  _$RevenueSummaryModelCopyWithImpl(this._self, this._then);

  final RevenueSummaryModel _self;
  final $Res Function(RevenueSummaryModel) _then;

/// Create a copy of RevenueSummaryModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? today = null,Object? month = null,Object? todayCents = null,Object? weekCents = null,}) {
  return _then(RevenueSummaryModel(
today: null == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String,month: null == month ? _self.month : month // ignore: cast_nullable_to_non_nullable
as RevenueMonthModel,todayCents: null == todayCents ? _self.todayCents : todayCents // ignore: cast_nullable_to_non_nullable
as int,weekCents: null == weekCents ? _self.weekCents : weekCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}
/// Create a copy of RevenueSummaryModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RevenueMonthModelCopyWith<$Res> get month {
  
  return $RevenueMonthModelCopyWith<$Res>(_self.month, (value) {
    return _then(_self.copyWith(month: value));
  });
}
}


/// Adds pattern-matching-related methods to [RevenueSummaryModel].
extension RevenueSummaryModelPatterns on RevenueSummaryModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueSummaryModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueSummaryModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueSummaryModel value)  $default,){
final _that = this;
switch (_that) {
case _RevenueSummaryModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueSummaryModel value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueSummaryModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String today,  RevenueMonthModel month,  int todayCents,  int weekCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueSummaryModel() when $default != null:
return $default(_that.today,_that.month,_that.todayCents,_that.weekCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String today,  RevenueMonthModel month,  int todayCents,  int weekCents)  $default,) {final _that = this;
switch (_that) {
case _RevenueSummaryModel():
return $default(_that.today,_that.month,_that.todayCents,_that.weekCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String today,  RevenueMonthModel month,  int todayCents,  int weekCents)?  $default,) {final _that = this;
switch (_that) {
case _RevenueSummaryModel() when $default != null:
return $default(_that.today,_that.month,_that.todayCents,_that.weekCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RevenueSummaryModel implements RevenueSummaryModel {
  const _RevenueSummaryModel({required this.today, required this.month, this.todayCents = 0, this.weekCents = 0});
  factory _RevenueSummaryModel.fromJson(Map<String, dynamic> json) => _$RevenueSummaryModelFromJson(json);

/// The parking's local date the figures stop at (YYYY-MM-DD).
@override final  String today;
@override final  RevenueMonthModel month;
@override@JsonKey() final  int todayCents;
@override@JsonKey() final  int weekCents;

/// Create a copy of RevenueSummaryModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueSummaryModelCopyWith<_RevenueSummaryModel> get copyWith => __$RevenueSummaryModelCopyWithImpl<_RevenueSummaryModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RevenueSummaryModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueSummaryModel&&(identical(other.today, today) || other.today == today)&&(identical(other.month, month) || other.month == month)&&(identical(other.todayCents, todayCents) || other.todayCents == todayCents)&&(identical(other.weekCents, weekCents) || other.weekCents == weekCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,today,month,todayCents,weekCents);
}

@override
String toString() {
    return 'RevenueSummaryModel(today: $today, month: $month, todayCents: $todayCents, weekCents: $weekCents)';
}


}

/// @nodoc
abstract mixin class _$RevenueSummaryModelCopyWith<$Res> implements $RevenueSummaryModelCopyWith<$Res> {
  factory _$RevenueSummaryModelCopyWith(_RevenueSummaryModel value, $Res Function(_RevenueSummaryModel) _then) = __$RevenueSummaryModelCopyWithImpl;
@override @useResult
$Res call({
 String today, RevenueMonthModel month, int todayCents, int weekCents
});


@override $RevenueMonthModelCopyWith<$Res> get month;

}
/// @nodoc
class __$RevenueSummaryModelCopyWithImpl<$Res>
    implements _$RevenueSummaryModelCopyWith<$Res> {
  __$RevenueSummaryModelCopyWithImpl(this._self, this._then);

  final _RevenueSummaryModel _self;
  final $Res Function(_RevenueSummaryModel) _then;

/// Create a copy of RevenueSummaryModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? today = null,Object? month = null,Object? todayCents = null,Object? weekCents = null,}) {
  return _then(_RevenueSummaryModel(
today: null == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String,month: null == month ? _self.month : month // ignore: cast_nullable_to_non_nullable
as RevenueMonthModel,todayCents: null == todayCents ? _self.todayCents : todayCents // ignore: cast_nullable_to_non_nullable
as int,weekCents: null == weekCents ? _self.weekCents : weekCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

/// Create a copy of RevenueSummaryModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RevenueMonthModelCopyWith<$Res> get month {
  
  return $RevenueMonthModelCopyWith<$Res>(_self.month, (value) {
    return _then(_self.copyWith(month: value));
  });
}
}


/// @nodoc
mixin _$RevenueMonthModel {

 String get from; String get to; int get totalCents; int get count; int get withoutAmount;
/// Create a copy of RevenueMonthModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueMonthModelCopyWith<RevenueMonthModel> get copyWith => _$RevenueMonthModelCopyWithImpl<RevenueMonthModel>(this as RevenueMonthModel, _$identity);

  /// Serializes this RevenueMonthModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RevenueMonthModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueMonthModel&&(identical(other.from, _this.from) || other.from == _this.from)&&(identical(other.to, _this.to) || other.to == _this.to)&&(identical(other.totalCents, _this.totalCents) || other.totalCents == _this.totalCents)&&(identical(other.count, _this.count) || other.count == _this.count)&&(identical(other.withoutAmount, _this.withoutAmount) || other.withoutAmount == _this.withoutAmount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RevenueMonthModel;
  return Object.hash(runtimeType,_this.from,_this.to,_this.totalCents,_this.count,_this.withoutAmount);
}

@override
String toString() {
  final _this = this as RevenueMonthModel;
  return 'RevenueMonthModel(from: ${_this.from}, to: ${_this.to}, totalCents: ${_this.totalCents}, count: ${_this.count}, withoutAmount: ${_this.withoutAmount})';
}


}

/// @nodoc
abstract mixin class $RevenueMonthModelCopyWith<$Res>  {
  factory $RevenueMonthModelCopyWith(RevenueMonthModel value, $Res Function(RevenueMonthModel) _then) = _$RevenueMonthModelCopyWithImpl;
@useResult
$Res call({
 String from, String to, int totalCents, int count, int withoutAmount
});




}
/// @nodoc
class _$RevenueMonthModelCopyWithImpl<$Res>
    implements $RevenueMonthModelCopyWith<$Res> {
  _$RevenueMonthModelCopyWithImpl(this._self, this._then);

  final RevenueMonthModel _self;
  final $Res Function(RevenueMonthModel) _then;

/// Create a copy of RevenueMonthModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? from = null,Object? to = null,Object? totalCents = null,Object? count = null,Object? withoutAmount = null,}) {
  return _then(RevenueMonthModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,to: null == to ? _self.to : to // ignore: cast_nullable_to_non_nullable
as String,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,withoutAmount: null == withoutAmount ? _self.withoutAmount : withoutAmount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [RevenueMonthModel].
extension RevenueMonthModelPatterns on RevenueMonthModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueMonthModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueMonthModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueMonthModel value)  $default,){
final _that = this;
switch (_that) {
case _RevenueMonthModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueMonthModel value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueMonthModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String from,  String to,  int totalCents,  int count,  int withoutAmount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueMonthModel() when $default != null:
return $default(_that.from,_that.to,_that.totalCents,_that.count,_that.withoutAmount);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String from,  String to,  int totalCents,  int count,  int withoutAmount)  $default,) {final _that = this;
switch (_that) {
case _RevenueMonthModel():
return $default(_that.from,_that.to,_that.totalCents,_that.count,_that.withoutAmount);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String from,  String to,  int totalCents,  int count,  int withoutAmount)?  $default,) {final _that = this;
switch (_that) {
case _RevenueMonthModel() when $default != null:
return $default(_that.from,_that.to,_that.totalCents,_that.count,_that.withoutAmount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RevenueMonthModel implements RevenueMonthModel {
  const _RevenueMonthModel({required this.from, required this.to, this.totalCents = 0, this.count = 0, this.withoutAmount = 0});
  factory _RevenueMonthModel.fromJson(Map<String, dynamic> json) => _$RevenueMonthModelFromJson(json);

@override final  String from;
@override final  String to;
@override@JsonKey() final  int totalCents;
@override@JsonKey() final  int count;
@override@JsonKey() final  int withoutAmount;

/// Create a copy of RevenueMonthModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueMonthModelCopyWith<_RevenueMonthModel> get copyWith => __$RevenueMonthModelCopyWithImpl<_RevenueMonthModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RevenueMonthModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueMonthModel&&(identical(other.from, from) || other.from == from)&&(identical(other.to, to) || other.to == to)&&(identical(other.totalCents, totalCents) || other.totalCents == totalCents)&&(identical(other.count, count) || other.count == count)&&(identical(other.withoutAmount, withoutAmount) || other.withoutAmount == withoutAmount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,from,to,totalCents,count,withoutAmount);
}

@override
String toString() {
    return 'RevenueMonthModel(from: $from, to: $to, totalCents: $totalCents, count: $count, withoutAmount: $withoutAmount)';
}


}

/// @nodoc
abstract mixin class _$RevenueMonthModelCopyWith<$Res> implements $RevenueMonthModelCopyWith<$Res> {
  factory _$RevenueMonthModelCopyWith(_RevenueMonthModel value, $Res Function(_RevenueMonthModel) _then) = __$RevenueMonthModelCopyWithImpl;
@override @useResult
$Res call({
 String from, String to, int totalCents, int count, int withoutAmount
});




}
/// @nodoc
class __$RevenueMonthModelCopyWithImpl<$Res>
    implements _$RevenueMonthModelCopyWith<$Res> {
  __$RevenueMonthModelCopyWithImpl(this._self, this._then);

  final _RevenueMonthModel _self;
  final $Res Function(_RevenueMonthModel) _then;

/// Create a copy of RevenueMonthModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? from = null,Object? to = null,Object? totalCents = null,Object? count = null,Object? withoutAmount = null,}) {
  return _then(_RevenueMonthModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,to: null == to ? _self.to : to // ignore: cast_nullable_to_non_nullable
as String,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,withoutAmount: null == withoutAmount ? _self.withoutAmount : withoutAmount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$RevenueReportModel {

 String get from; String get to; String get basis; String? get timezone;/// The parking's local date now (13/10/2026); older servers leave it out.
 String? get today; int get totalCents;/// Bookings with an amount.
 int get count; int? get averageCents; double? get averageDays;/// Bookings of the period without an amount: not counted.
 int get withoutAmount; List<RevenueChannelModel> get byChannel; List<RevenueDayModel> get byDay;/// The most recent bookings without an amount (50 at most).
 List<RevenueMissingModel> get missing;
/// Create a copy of RevenueReportModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueReportModelCopyWith<RevenueReportModel> get copyWith => _$RevenueReportModelCopyWithImpl<RevenueReportModel>(this as RevenueReportModel, _$identity);

  /// Serializes this RevenueReportModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RevenueReportModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueReportModel&&(identical(other.from, _this.from) || other.from == _this.from)&&(identical(other.to, _this.to) || other.to == _this.to)&&(identical(other.basis, _this.basis) || other.basis == _this.basis)&&(identical(other.timezone, _this.timezone) || other.timezone == _this.timezone)&&(identical(other.today, _this.today) || other.today == _this.today)&&(identical(other.totalCents, _this.totalCents) || other.totalCents == _this.totalCents)&&(identical(other.count, _this.count) || other.count == _this.count)&&(identical(other.averageCents, _this.averageCents) || other.averageCents == _this.averageCents)&&(identical(other.averageDays, _this.averageDays) || other.averageDays == _this.averageDays)&&(identical(other.withoutAmount, _this.withoutAmount) || other.withoutAmount == _this.withoutAmount)&&const DeepCollectionEquality().equals(other.byChannel, _this.byChannel)&&const DeepCollectionEquality().equals(other.byDay, _this.byDay)&&const DeepCollectionEquality().equals(other.missing, _this.missing));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RevenueReportModel;
  return Object.hash(runtimeType,_this.from,_this.to,_this.basis,_this.timezone,_this.today,_this.totalCents,_this.count,_this.averageCents,_this.averageDays,_this.withoutAmount,const DeepCollectionEquality().hash(_this.byChannel),const DeepCollectionEquality().hash(_this.byDay),const DeepCollectionEquality().hash(_this.missing));
}

@override
String toString() {
  final _this = this as RevenueReportModel;
  return 'RevenueReportModel(from: ${_this.from}, to: ${_this.to}, basis: ${_this.basis}, timezone: ${_this.timezone}, today: ${_this.today}, totalCents: ${_this.totalCents}, count: ${_this.count}, averageCents: ${_this.averageCents}, averageDays: ${_this.averageDays}, withoutAmount: ${_this.withoutAmount}, byChannel: ${_this.byChannel}, byDay: ${_this.byDay}, missing: ${_this.missing})';
}


}

/// @nodoc
abstract mixin class $RevenueReportModelCopyWith<$Res>  {
  factory $RevenueReportModelCopyWith(RevenueReportModel value, $Res Function(RevenueReportModel) _then) = _$RevenueReportModelCopyWithImpl;
@useResult
$Res call({
 String from, String to, String basis, String? timezone, String? today, int totalCents, int count, int? averageCents, double? averageDays, int withoutAmount, List<RevenueChannelModel> byChannel, List<RevenueDayModel> byDay, List<RevenueMissingModel> missing
});




}
/// @nodoc
class _$RevenueReportModelCopyWithImpl<$Res>
    implements $RevenueReportModelCopyWith<$Res> {
  _$RevenueReportModelCopyWithImpl(this._self, this._then);

  final RevenueReportModel _self;
  final $Res Function(RevenueReportModel) _then;

/// Create a copy of RevenueReportModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? from = null,Object? to = null,Object? basis = null,Object? timezone = freezed,Object? today = freezed,Object? totalCents = null,Object? count = null,Object? averageCents = freezed,Object? averageDays = freezed,Object? withoutAmount = null,Object? byChannel = null,Object? byDay = null,Object? missing = null,}) {
  return _then(RevenueReportModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,to: null == to ? _self.to : to // ignore: cast_nullable_to_non_nullable
as String,basis: null == basis ? _self.basis : basis // ignore: cast_nullable_to_non_nullable
as String,timezone: freezed == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String?,today: freezed == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String?,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,averageCents: freezed == averageCents ? _self.averageCents : averageCents // ignore: cast_nullable_to_non_nullable
as int?,averageDays: freezed == averageDays ? _self.averageDays : averageDays // ignore: cast_nullable_to_non_nullable
as double?,withoutAmount: null == withoutAmount ? _self.withoutAmount : withoutAmount // ignore: cast_nullable_to_non_nullable
as int,byChannel: null == byChannel ? _self.byChannel : byChannel // ignore: cast_nullable_to_non_nullable
as List<RevenueChannelModel>,byDay: null == byDay ? _self.byDay : byDay // ignore: cast_nullable_to_non_nullable
as List<RevenueDayModel>,missing: null == missing ? _self.missing : missing // ignore: cast_nullable_to_non_nullable
as List<RevenueMissingModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [RevenueReportModel].
extension RevenueReportModelPatterns on RevenueReportModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueReportModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueReportModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueReportModel value)  $default,){
final _that = this;
switch (_that) {
case _RevenueReportModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueReportModel value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueReportModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String from,  String to,  String basis,  String? timezone,  String? today,  int totalCents,  int count,  int? averageCents,  double? averageDays,  int withoutAmount,  List<RevenueChannelModel> byChannel,  List<RevenueDayModel> byDay,  List<RevenueMissingModel> missing)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueReportModel() when $default != null:
return $default(_that.from,_that.to,_that.basis,_that.timezone,_that.today,_that.totalCents,_that.count,_that.averageCents,_that.averageDays,_that.withoutAmount,_that.byChannel,_that.byDay,_that.missing);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String from,  String to,  String basis,  String? timezone,  String? today,  int totalCents,  int count,  int? averageCents,  double? averageDays,  int withoutAmount,  List<RevenueChannelModel> byChannel,  List<RevenueDayModel> byDay,  List<RevenueMissingModel> missing)  $default,) {final _that = this;
switch (_that) {
case _RevenueReportModel():
return $default(_that.from,_that.to,_that.basis,_that.timezone,_that.today,_that.totalCents,_that.count,_that.averageCents,_that.averageDays,_that.withoutAmount,_that.byChannel,_that.byDay,_that.missing);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String from,  String to,  String basis,  String? timezone,  String? today,  int totalCents,  int count,  int? averageCents,  double? averageDays,  int withoutAmount,  List<RevenueChannelModel> byChannel,  List<RevenueDayModel> byDay,  List<RevenueMissingModel> missing)?  $default,) {final _that = this;
switch (_that) {
case _RevenueReportModel() when $default != null:
return $default(_that.from,_that.to,_that.basis,_that.timezone,_that.today,_that.totalCents,_that.count,_that.averageCents,_that.averageDays,_that.withoutAmount,_that.byChannel,_that.byDay,_that.missing);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RevenueReportModel implements RevenueReportModel {
  const _RevenueReportModel({required this.from, required this.to, this.basis = 'arrival', this.timezone, this.today, this.totalCents = 0, this.count = 0, this.averageCents, this.averageDays, this.withoutAmount = 0,  List<RevenueChannelModel> byChannel = const [],  List<RevenueDayModel> byDay = const [],  List<RevenueMissingModel> missing = const []}): _byChannel = byChannel,_byDay = byDay,_missing = missing;
  factory _RevenueReportModel.fromJson(Map<String, dynamic> json) => _$RevenueReportModelFromJson(json);

@override final  String from;
@override final  String to;
@override@JsonKey() final  String basis;
@override final  String? timezone;
/// The parking's local date now (13/10/2026); older servers leave it out.
@override final  String? today;
@override@JsonKey() final  int totalCents;
/// Bookings with an amount.
@override@JsonKey() final  int count;
@override final  int? averageCents;
@override final  double? averageDays;
/// Bookings of the period without an amount: not counted.
@override@JsonKey() final  int withoutAmount;
 final  List<RevenueChannelModel> _byChannel;
@override@JsonKey() List<RevenueChannelModel> get byChannel {
  if (_byChannel is EqualUnmodifiableListView) return _byChannel;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_byChannel);
}

 final  List<RevenueDayModel> _byDay;
@override@JsonKey() List<RevenueDayModel> get byDay {
  if (_byDay is EqualUnmodifiableListView) return _byDay;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_byDay);
}

/// The most recent bookings without an amount (50 at most).
 final  List<RevenueMissingModel> _missing;
/// The most recent bookings without an amount (50 at most).
@override@JsonKey() List<RevenueMissingModel> get missing {
  if (_missing is EqualUnmodifiableListView) return _missing;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_missing);
}


/// Create a copy of RevenueReportModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueReportModelCopyWith<_RevenueReportModel> get copyWith => __$RevenueReportModelCopyWithImpl<_RevenueReportModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RevenueReportModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueReportModel&&(identical(other.from, from) || other.from == from)&&(identical(other.to, to) || other.to == to)&&(identical(other.basis, basis) || other.basis == basis)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.today, today) || other.today == today)&&(identical(other.totalCents, totalCents) || other.totalCents == totalCents)&&(identical(other.count, count) || other.count == count)&&(identical(other.averageCents, averageCents) || other.averageCents == averageCents)&&(identical(other.averageDays, averageDays) || other.averageDays == averageDays)&&(identical(other.withoutAmount, withoutAmount) || other.withoutAmount == withoutAmount)&&const DeepCollectionEquality().equals(other.byChannel, _byChannel)&&const DeepCollectionEquality().equals(other.byDay, _byDay)&&const DeepCollectionEquality().equals(other.missing, _missing));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,from,to,basis,timezone,today,totalCents,count,averageCents,averageDays,withoutAmount,const DeepCollectionEquality().hash(_byChannel),const DeepCollectionEquality().hash(_byDay),const DeepCollectionEquality().hash(_missing));
}

@override
String toString() {
    return 'RevenueReportModel(from: $from, to: $to, basis: $basis, timezone: $timezone, today: $today, totalCents: $totalCents, count: $count, averageCents: $averageCents, averageDays: $averageDays, withoutAmount: $withoutAmount, byChannel: $byChannel, byDay: $byDay, missing: $missing)';
}


}

/// @nodoc
abstract mixin class _$RevenueReportModelCopyWith<$Res> implements $RevenueReportModelCopyWith<$Res> {
  factory _$RevenueReportModelCopyWith(_RevenueReportModel value, $Res Function(_RevenueReportModel) _then) = __$RevenueReportModelCopyWithImpl;
@override @useResult
$Res call({
 String from, String to, String basis, String? timezone, String? today, int totalCents, int count, int? averageCents, double? averageDays, int withoutAmount, List<RevenueChannelModel> byChannel, List<RevenueDayModel> byDay, List<RevenueMissingModel> missing
});




}
/// @nodoc
class __$RevenueReportModelCopyWithImpl<$Res>
    implements _$RevenueReportModelCopyWith<$Res> {
  __$RevenueReportModelCopyWithImpl(this._self, this._then);

  final _RevenueReportModel _self;
  final $Res Function(_RevenueReportModel) _then;

/// Create a copy of RevenueReportModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? from = null,Object? to = null,Object? basis = null,Object? timezone = freezed,Object? today = freezed,Object? totalCents = null,Object? count = null,Object? averageCents = freezed,Object? averageDays = freezed,Object? withoutAmount = null,Object? byChannel = null,Object? byDay = null,Object? missing = null,}) {
  return _then(_RevenueReportModel(
from: null == from ? _self.from : from // ignore: cast_nullable_to_non_nullable
as String,to: null == to ? _self.to : to // ignore: cast_nullable_to_non_nullable
as String,basis: null == basis ? _self.basis : basis // ignore: cast_nullable_to_non_nullable
as String,timezone: freezed == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String?,today: freezed == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String?,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,averageCents: freezed == averageCents ? _self.averageCents : averageCents // ignore: cast_nullable_to_non_nullable
as int?,averageDays: freezed == averageDays ? _self.averageDays : averageDays // ignore: cast_nullable_to_non_nullable
as double?,withoutAmount: null == withoutAmount ? _self.withoutAmount : withoutAmount // ignore: cast_nullable_to_non_nullable
as int,byChannel: null == byChannel ? _self._byChannel : byChannel // ignore: cast_nullable_to_non_nullable
as List<RevenueChannelModel>,byDay: null == byDay ? _self._byDay : byDay // ignore: cast_nullable_to_non_nullable
as List<RevenueDayModel>,missing: null == missing ? _self._missing : missing // ignore: cast_nullable_to_non_nullable
as List<RevenueMissingModel>,
  ));
}


}


/// @nodoc
mixin _$RevenueChannelModel {

 String get channel; String? get detail; int get count; int get totalCents;
/// Create a copy of RevenueChannelModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueChannelModelCopyWith<RevenueChannelModel> get copyWith => _$RevenueChannelModelCopyWithImpl<RevenueChannelModel>(this as RevenueChannelModel, _$identity);

  /// Serializes this RevenueChannelModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RevenueChannelModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueChannelModel&&(identical(other.channel, _this.channel) || other.channel == _this.channel)&&(identical(other.detail, _this.detail) || other.detail == _this.detail)&&(identical(other.count, _this.count) || other.count == _this.count)&&(identical(other.totalCents, _this.totalCents) || other.totalCents == _this.totalCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RevenueChannelModel;
  return Object.hash(runtimeType,_this.channel,_this.detail,_this.count,_this.totalCents);
}

@override
String toString() {
  final _this = this as RevenueChannelModel;
  return 'RevenueChannelModel(channel: ${_this.channel}, detail: ${_this.detail}, count: ${_this.count}, totalCents: ${_this.totalCents})';
}


}

/// @nodoc
abstract mixin class $RevenueChannelModelCopyWith<$Res>  {
  factory $RevenueChannelModelCopyWith(RevenueChannelModel value, $Res Function(RevenueChannelModel) _then) = _$RevenueChannelModelCopyWithImpl;
@useResult
$Res call({
 String channel, String? detail, int count, int totalCents
});




}
/// @nodoc
class _$RevenueChannelModelCopyWithImpl<$Res>
    implements $RevenueChannelModelCopyWith<$Res> {
  _$RevenueChannelModelCopyWithImpl(this._self, this._then);

  final RevenueChannelModel _self;
  final $Res Function(RevenueChannelModel) _then;

/// Create a copy of RevenueChannelModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? channel = null,Object? detail = freezed,Object? count = null,Object? totalCents = null,}) {
  return _then(RevenueChannelModel(
channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,detail: freezed == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String?,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [RevenueChannelModel].
extension RevenueChannelModelPatterns on RevenueChannelModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueChannelModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueChannelModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueChannelModel value)  $default,){
final _that = this;
switch (_that) {
case _RevenueChannelModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueChannelModel value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueChannelModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String channel,  String? detail,  int count,  int totalCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueChannelModel() when $default != null:
return $default(_that.channel,_that.detail,_that.count,_that.totalCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String channel,  String? detail,  int count,  int totalCents)  $default,) {final _that = this;
switch (_that) {
case _RevenueChannelModel():
return $default(_that.channel,_that.detail,_that.count,_that.totalCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String channel,  String? detail,  int count,  int totalCents)?  $default,) {final _that = this;
switch (_that) {
case _RevenueChannelModel() when $default != null:
return $default(_that.channel,_that.detail,_that.count,_that.totalCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RevenueChannelModel implements RevenueChannelModel {
  const _RevenueChannelModel({required this.channel, this.detail, this.count = 0, this.totalCents = 0});
  factory _RevenueChannelModel.fromJson(Map<String, dynamic> json) => _$RevenueChannelModelFromJson(json);

@override final  String channel;
@override final  String? detail;
@override@JsonKey() final  int count;
@override@JsonKey() final  int totalCents;

/// Create a copy of RevenueChannelModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueChannelModelCopyWith<_RevenueChannelModel> get copyWith => __$RevenueChannelModelCopyWithImpl<_RevenueChannelModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RevenueChannelModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueChannelModel&&(identical(other.channel, channel) || other.channel == channel)&&(identical(other.detail, detail) || other.detail == detail)&&(identical(other.count, count) || other.count == count)&&(identical(other.totalCents, totalCents) || other.totalCents == totalCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,channel,detail,count,totalCents);
}

@override
String toString() {
    return 'RevenueChannelModel(channel: $channel, detail: $detail, count: $count, totalCents: $totalCents)';
}


}

/// @nodoc
abstract mixin class _$RevenueChannelModelCopyWith<$Res> implements $RevenueChannelModelCopyWith<$Res> {
  factory _$RevenueChannelModelCopyWith(_RevenueChannelModel value, $Res Function(_RevenueChannelModel) _then) = __$RevenueChannelModelCopyWithImpl;
@override @useResult
$Res call({
 String channel, String? detail, int count, int totalCents
});




}
/// @nodoc
class __$RevenueChannelModelCopyWithImpl<$Res>
    implements _$RevenueChannelModelCopyWith<$Res> {
  __$RevenueChannelModelCopyWithImpl(this._self, this._then);

  final _RevenueChannelModel _self;
  final $Res Function(_RevenueChannelModel) _then;

/// Create a copy of RevenueChannelModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? channel = null,Object? detail = freezed,Object? count = null,Object? totalCents = null,}) {
  return _then(_RevenueChannelModel(
channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,detail: freezed == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String?,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$RevenueDayModel {

 String get date; int get count; int get totalCents;
/// Create a copy of RevenueDayModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueDayModelCopyWith<RevenueDayModel> get copyWith => _$RevenueDayModelCopyWithImpl<RevenueDayModel>(this as RevenueDayModel, _$identity);

  /// Serializes this RevenueDayModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RevenueDayModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueDayModel&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.count, _this.count) || other.count == _this.count)&&(identical(other.totalCents, _this.totalCents) || other.totalCents == _this.totalCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RevenueDayModel;
  return Object.hash(runtimeType,_this.date,_this.count,_this.totalCents);
}

@override
String toString() {
  final _this = this as RevenueDayModel;
  return 'RevenueDayModel(date: ${_this.date}, count: ${_this.count}, totalCents: ${_this.totalCents})';
}


}

/// @nodoc
abstract mixin class $RevenueDayModelCopyWith<$Res>  {
  factory $RevenueDayModelCopyWith(RevenueDayModel value, $Res Function(RevenueDayModel) _then) = _$RevenueDayModelCopyWithImpl;
@useResult
$Res call({
 String date, int count, int totalCents
});




}
/// @nodoc
class _$RevenueDayModelCopyWithImpl<$Res>
    implements $RevenueDayModelCopyWith<$Res> {
  _$RevenueDayModelCopyWithImpl(this._self, this._then);

  final RevenueDayModel _self;
  final $Res Function(RevenueDayModel) _then;

/// Create a copy of RevenueDayModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? count = null,Object? totalCents = null,}) {
  return _then(RevenueDayModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [RevenueDayModel].
extension RevenueDayModelPatterns on RevenueDayModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueDayModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueDayModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueDayModel value)  $default,){
final _that = this;
switch (_that) {
case _RevenueDayModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueDayModel value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueDayModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  int count,  int totalCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueDayModel() when $default != null:
return $default(_that.date,_that.count,_that.totalCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  int count,  int totalCents)  $default,) {final _that = this;
switch (_that) {
case _RevenueDayModel():
return $default(_that.date,_that.count,_that.totalCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  int count,  int totalCents)?  $default,) {final _that = this;
switch (_that) {
case _RevenueDayModel() when $default != null:
return $default(_that.date,_that.count,_that.totalCents);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RevenueDayModel implements RevenueDayModel {
  const _RevenueDayModel({required this.date, this.count = 0, this.totalCents = 0});
  factory _RevenueDayModel.fromJson(Map<String, dynamic> json) => _$RevenueDayModelFromJson(json);

@override final  String date;
@override@JsonKey() final  int count;
@override@JsonKey() final  int totalCents;

/// Create a copy of RevenueDayModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueDayModelCopyWith<_RevenueDayModel> get copyWith => __$RevenueDayModelCopyWithImpl<_RevenueDayModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RevenueDayModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueDayModel&&(identical(other.date, date) || other.date == date)&&(identical(other.count, count) || other.count == count)&&(identical(other.totalCents, totalCents) || other.totalCents == totalCents));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,date,count,totalCents);
}

@override
String toString() {
    return 'RevenueDayModel(date: $date, count: $count, totalCents: $totalCents)';
}


}

/// @nodoc
abstract mixin class _$RevenueDayModelCopyWith<$Res> implements $RevenueDayModelCopyWith<$Res> {
  factory _$RevenueDayModelCopyWith(_RevenueDayModel value, $Res Function(_RevenueDayModel) _then) = __$RevenueDayModelCopyWithImpl;
@override @useResult
$Res call({
 String date, int count, int totalCents
});




}
/// @nodoc
class __$RevenueDayModelCopyWithImpl<$Res>
    implements _$RevenueDayModelCopyWith<$Res> {
  __$RevenueDayModelCopyWithImpl(this._self, this._then);

  final _RevenueDayModel _self;
  final $Res Function(_RevenueDayModel) _then;

/// Create a copy of RevenueDayModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? count = null,Object? totalCents = null,}) {
  return _then(_RevenueDayModel(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,totalCents: null == totalCents ? _self.totalCents : totalCents // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$RevenueMissingModel {

 String get id; String get reference; String get customerName; String? get plate; DateTime get arrivalAt; String get channel; String? get detail;
/// Create a copy of RevenueMissingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueMissingModelCopyWith<RevenueMissingModel> get copyWith => _$RevenueMissingModelCopyWithImpl<RevenueMissingModel>(this as RevenueMissingModel, _$identity);

  /// Serializes this RevenueMissingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RevenueMissingModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueMissingModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.customerName, _this.customerName) || other.customerName == _this.customerName)&&(identical(other.plate, _this.plate) || other.plate == _this.plate)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.channel, _this.channel) || other.channel == _this.channel)&&(identical(other.detail, _this.detail) || other.detail == _this.detail));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RevenueMissingModel;
  return Object.hash(runtimeType,_this.id,_this.reference,_this.customerName,_this.plate,_this.arrivalAt,_this.channel,_this.detail);
}

@override
String toString() {
  final _this = this as RevenueMissingModel;
  return 'RevenueMissingModel(id: ${_this.id}, reference: ${_this.reference}, customerName: ${_this.customerName}, plate: ${_this.plate}, arrivalAt: ${_this.arrivalAt}, channel: ${_this.channel}, detail: ${_this.detail})';
}


}

/// @nodoc
abstract mixin class $RevenueMissingModelCopyWith<$Res>  {
  factory $RevenueMissingModelCopyWith(RevenueMissingModel value, $Res Function(RevenueMissingModel) _then) = _$RevenueMissingModelCopyWithImpl;
@useResult
$Res call({
 String id, String reference, String customerName, String? plate, DateTime arrivalAt, String channel, String? detail
});




}
/// @nodoc
class _$RevenueMissingModelCopyWithImpl<$Res>
    implements $RevenueMissingModelCopyWith<$Res> {
  _$RevenueMissingModelCopyWithImpl(this._self, this._then);

  final RevenueMissingModel _self;
  final $Res Function(RevenueMissingModel) _then;

/// Create a copy of RevenueMissingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = freezed,Object? arrivalAt = null,Object? channel = null,Object? detail = freezed,}) {
  return _then(RevenueMissingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,detail: freezed == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [RevenueMissingModel].
extension RevenueMissingModelPatterns on RevenueMissingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueMissingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueMissingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueMissingModel value)  $default,){
final _that = this;
switch (_that) {
case _RevenueMissingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueMissingModel value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueMissingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String? plate,  DateTime arrivalAt,  String channel,  String? detail)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueMissingModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.arrivalAt,_that.channel,_that.detail);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String reference,  String customerName,  String? plate,  DateTime arrivalAt,  String channel,  String? detail)  $default,) {final _that = this;
switch (_that) {
case _RevenueMissingModel():
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.arrivalAt,_that.channel,_that.detail);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String reference,  String customerName,  String? plate,  DateTime arrivalAt,  String channel,  String? detail)?  $default,) {final _that = this;
switch (_that) {
case _RevenueMissingModel() when $default != null:
return $default(_that.id,_that.reference,_that.customerName,_that.plate,_that.arrivalAt,_that.channel,_that.detail);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RevenueMissingModel implements RevenueMissingModel {
  const _RevenueMissingModel({required this.id, required this.reference, this.customerName = '', this.plate, required this.arrivalAt, required this.channel, this.detail});
  factory _RevenueMissingModel.fromJson(Map<String, dynamic> json) => _$RevenueMissingModelFromJson(json);

@override final  String id;
@override final  String reference;
@override@JsonKey() final  String customerName;
@override final  String? plate;
@override final  DateTime arrivalAt;
@override final  String channel;
@override final  String? detail;

/// Create a copy of RevenueMissingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueMissingModelCopyWith<_RevenueMissingModel> get copyWith => __$RevenueMissingModelCopyWithImpl<_RevenueMissingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RevenueMissingModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueMissingModel&&(identical(other.id, id) || other.id == id)&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.plate, plate) || other.plate == plate)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.channel, channel) || other.channel == channel)&&(identical(other.detail, detail) || other.detail == detail));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,reference,customerName,plate,arrivalAt,channel,detail);
}

@override
String toString() {
    return 'RevenueMissingModel(id: $id, reference: $reference, customerName: $customerName, plate: $plate, arrivalAt: $arrivalAt, channel: $channel, detail: $detail)';
}


}

/// @nodoc
abstract mixin class _$RevenueMissingModelCopyWith<$Res> implements $RevenueMissingModelCopyWith<$Res> {
  factory _$RevenueMissingModelCopyWith(_RevenueMissingModel value, $Res Function(_RevenueMissingModel) _then) = __$RevenueMissingModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String reference, String customerName, String? plate, DateTime arrivalAt, String channel, String? detail
});




}
/// @nodoc
class __$RevenueMissingModelCopyWithImpl<$Res>
    implements _$RevenueMissingModelCopyWith<$Res> {
  __$RevenueMissingModelCopyWithImpl(this._self, this._then);

  final _RevenueMissingModel _self;
  final $Res Function(_RevenueMissingModel) _then;

/// Create a copy of RevenueMissingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? reference = null,Object? customerName = null,Object? plate = freezed,Object? arrivalAt = null,Object? channel = null,Object? detail = freezed,}) {
  return _then(_RevenueMissingModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,customerName: null == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String,plate: freezed == plate ? _self.plate : plate // ignore: cast_nullable_to_non_nullable
as String?,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as DateTime,channel: null == channel ? _self.channel : channel // ignore: cast_nullable_to_non_nullable
as String,detail: freezed == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
