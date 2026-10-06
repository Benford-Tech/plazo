// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notification_preferences_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$NotificationPreferencesModel {

 bool get arrivals; bool get returns; bool get shuttles; bool get platform; bool get bookings; int get devices;
/// Create a copy of NotificationPreferencesModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NotificationPreferencesModelCopyWith<NotificationPreferencesModel> get copyWith => _$NotificationPreferencesModelCopyWithImpl<NotificationPreferencesModel>(this as NotificationPreferencesModel, _$identity);

  /// Serializes this NotificationPreferencesModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as NotificationPreferencesModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is NotificationPreferencesModel&&(identical(other.arrivals, _this.arrivals) || other.arrivals == _this.arrivals)&&(identical(other.returns, _this.returns) || other.returns == _this.returns)&&(identical(other.shuttles, _this.shuttles) || other.shuttles == _this.shuttles)&&(identical(other.platform, _this.platform) || other.platform == _this.platform)&&(identical(other.bookings, _this.bookings) || other.bookings == _this.bookings)&&(identical(other.devices, _this.devices) || other.devices == _this.devices));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as NotificationPreferencesModel;
  return Object.hash(runtimeType,_this.arrivals,_this.returns,_this.shuttles,_this.platform,_this.bookings,_this.devices);
}

@override
String toString() {
  final _this = this as NotificationPreferencesModel;
  return 'NotificationPreferencesModel(arrivals: ${_this.arrivals}, returns: ${_this.returns}, shuttles: ${_this.shuttles}, platform: ${_this.platform}, bookings: ${_this.bookings}, devices: ${_this.devices})';
}


}

/// @nodoc
abstract mixin class $NotificationPreferencesModelCopyWith<$Res>  {
  factory $NotificationPreferencesModelCopyWith(NotificationPreferencesModel value, $Res Function(NotificationPreferencesModel) _then) = _$NotificationPreferencesModelCopyWithImpl;
@useResult
$Res call({
 bool arrivals, bool returns, bool shuttles, bool platform, bool bookings, int devices
});




}
/// @nodoc
class _$NotificationPreferencesModelCopyWithImpl<$Res>
    implements $NotificationPreferencesModelCopyWith<$Res> {
  _$NotificationPreferencesModelCopyWithImpl(this._self, this._then);

  final NotificationPreferencesModel _self;
  final $Res Function(NotificationPreferencesModel) _then;

/// Create a copy of NotificationPreferencesModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? arrivals = null,Object? returns = null,Object? shuttles = null,Object? platform = null,Object? bookings = null,Object? devices = null,}) {
  return _then(NotificationPreferencesModel(
arrivals: null == arrivals ? _self.arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as bool,returns: null == returns ? _self.returns : returns // ignore: cast_nullable_to_non_nullable
as bool,shuttles: null == shuttles ? _self.shuttles : shuttles // ignore: cast_nullable_to_non_nullable
as bool,platform: null == platform ? _self.platform : platform // ignore: cast_nullable_to_non_nullable
as bool,bookings: null == bookings ? _self.bookings : bookings // ignore: cast_nullable_to_non_nullable
as bool,devices: null == devices ? _self.devices : devices // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [NotificationPreferencesModel].
extension NotificationPreferencesModelPatterns on NotificationPreferencesModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _NotificationPreferencesModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _NotificationPreferencesModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _NotificationPreferencesModel value)  $default,){
final _that = this;
switch (_that) {
case _NotificationPreferencesModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _NotificationPreferencesModel value)?  $default,){
final _that = this;
switch (_that) {
case _NotificationPreferencesModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool arrivals,  bool returns,  bool shuttles,  bool platform,  bool bookings,  int devices)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _NotificationPreferencesModel() when $default != null:
return $default(_that.arrivals,_that.returns,_that.shuttles,_that.platform,_that.bookings,_that.devices);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool arrivals,  bool returns,  bool shuttles,  bool platform,  bool bookings,  int devices)  $default,) {final _that = this;
switch (_that) {
case _NotificationPreferencesModel():
return $default(_that.arrivals,_that.returns,_that.shuttles,_that.platform,_that.bookings,_that.devices);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool arrivals,  bool returns,  bool shuttles,  bool platform,  bool bookings,  int devices)?  $default,) {final _that = this;
switch (_that) {
case _NotificationPreferencesModel() when $default != null:
return $default(_that.arrivals,_that.returns,_that.shuttles,_that.platform,_that.bookings,_that.devices);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _NotificationPreferencesModel implements NotificationPreferencesModel {
  const _NotificationPreferencesModel({required this.arrivals, required this.returns, this.shuttles = true, this.platform = true, this.bookings = true, this.devices = 0});
  factory _NotificationPreferencesModel.fromJson(Map<String, dynamic> json) => _$NotificationPreferencesModelFromJson(json);

@override final  bool arrivals;
@override final  bool returns;
@override@JsonKey() final  bool shuttles;
@override@JsonKey() final  bool platform;
@override@JsonKey() final  bool bookings;
@override@JsonKey() final  int devices;

/// Create a copy of NotificationPreferencesModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NotificationPreferencesModelCopyWith<_NotificationPreferencesModel> get copyWith => __$NotificationPreferencesModelCopyWithImpl<_NotificationPreferencesModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NotificationPreferencesModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _NotificationPreferencesModel&&(identical(other.arrivals, arrivals) || other.arrivals == arrivals)&&(identical(other.returns, returns) || other.returns == returns)&&(identical(other.shuttles, shuttles) || other.shuttles == shuttles)&&(identical(other.platform, platform) || other.platform == platform)&&(identical(other.bookings, bookings) || other.bookings == bookings)&&(identical(other.devices, devices) || other.devices == devices));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,arrivals,returns,shuttles,platform,bookings,devices);
}

@override
String toString() {
    return 'NotificationPreferencesModel(arrivals: $arrivals, returns: $returns, shuttles: $shuttles, platform: $platform, bookings: $bookings, devices: $devices)';
}


}

/// @nodoc
abstract mixin class _$NotificationPreferencesModelCopyWith<$Res> implements $NotificationPreferencesModelCopyWith<$Res> {
  factory _$NotificationPreferencesModelCopyWith(_NotificationPreferencesModel value, $Res Function(_NotificationPreferencesModel) _then) = __$NotificationPreferencesModelCopyWithImpl;
@override @useResult
$Res call({
 bool arrivals, bool returns, bool shuttles, bool platform, bool bookings, int devices
});




}
/// @nodoc
class __$NotificationPreferencesModelCopyWithImpl<$Res>
    implements _$NotificationPreferencesModelCopyWith<$Res> {
  __$NotificationPreferencesModelCopyWithImpl(this._self, this._then);

  final _NotificationPreferencesModel _self;
  final $Res Function(_NotificationPreferencesModel) _then;

/// Create a copy of NotificationPreferencesModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? arrivals = null,Object? returns = null,Object? shuttles = null,Object? platform = null,Object? bookings = null,Object? devices = null,}) {
  return _then(_NotificationPreferencesModel(
arrivals: null == arrivals ? _self.arrivals : arrivals // ignore: cast_nullable_to_non_nullable
as bool,returns: null == returns ? _self.returns : returns // ignore: cast_nullable_to_non_nullable
as bool,shuttles: null == shuttles ? _self.shuttles : shuttles // ignore: cast_nullable_to_non_nullable
as bool,platform: null == platform ? _self.platform : platform // ignore: cast_nullable_to_non_nullable
as bool,bookings: null == bookings ? _self.bookings : bookings // ignore: cast_nullable_to_non_nullable
as bool,devices: null == devices ? _self.devices : devices // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
