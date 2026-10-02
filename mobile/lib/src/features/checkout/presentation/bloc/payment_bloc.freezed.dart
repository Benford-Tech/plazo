// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$PaymentState {

 String get reference; PaymentStatus get status; PublicBookingModel? get booking; PaymentsConfigModel? get config;/// Seconds left on the hold, counted down from the API's figure (never the phone's clock).
 int? get secondsLeft; PaymentNotice? get notice;/// Stripe's message of a failed attempt, or the translated API error.
 String? get message; bool get busy;
/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentStateCopyWith<PaymentState> get copyWith => _$PaymentStateCopyWithImpl<PaymentState>(this as PaymentState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as PaymentState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentState&&(identical(other.reference, _this.reference) || other.reference == _this.reference)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.booking, _this.booking) || other.booking == _this.booking)&&(identical(other.config, _this.config) || other.config == _this.config)&&(identical(other.secondsLeft, _this.secondsLeft) || other.secondsLeft == _this.secondsLeft)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.message, _this.message) || other.message == _this.message)&&(identical(other.busy, _this.busy) || other.busy == _this.busy));
}


@override
int get hashCode {
  final _this = this as PaymentState;
  return Object.hash(runtimeType,_this.reference,_this.status,_this.booking,_this.config,_this.secondsLeft,_this.notice,_this.message,_this.busy);
}

@override
String toString() {
  final _this = this as PaymentState;
  return 'PaymentState(reference: ${_this.reference}, status: ${_this.status}, booking: ${_this.booking}, config: ${_this.config}, secondsLeft: ${_this.secondsLeft}, notice: ${_this.notice}, message: ${_this.message}, busy: ${_this.busy})';
}


}

/// @nodoc
abstract mixin class $PaymentStateCopyWith<$Res>  {
  factory $PaymentStateCopyWith(PaymentState value, $Res Function(PaymentState) _then) = _$PaymentStateCopyWithImpl;
@useResult
$Res call({
 String reference, PaymentStatus status, PublicBookingModel? booking, PaymentsConfigModel? config, int? secondsLeft, PaymentNotice? notice, String? message, bool busy
});


$PublicBookingModelCopyWith<$Res>? get booking;$PaymentsConfigModelCopyWith<$Res>? get config;

}
/// @nodoc
class _$PaymentStateCopyWithImpl<$Res>
    implements $PaymentStateCopyWith<$Res> {
  _$PaymentStateCopyWithImpl(this._self, this._then);

  final PaymentState _self;
  final $Res Function(PaymentState) _then;

/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reference = null,Object? status = null,Object? booking = freezed,Object? config = freezed,Object? secondsLeft = freezed,Object? notice = freezed,Object? message = freezed,Object? busy = null,}) {
  return _then(PaymentState(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PaymentStatus,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,config: freezed == config ? _self.config : config // ignore: cast_nullable_to_non_nullable
as PaymentsConfigModel?,secondsLeft: freezed == secondsLeft ? _self.secondsLeft : secondsLeft // ignore: cast_nullable_to_non_nullable
as int?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as PaymentNotice?,message: freezed == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String?,busy: null == busy ? _self.busy : busy // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}
/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<$Res>? get booking {
    if (_self.booking == null) {
    return null;
  }

  return $PublicBookingModelCopyWith<$Res>(_self.booking!, (value) {
    return _then(_self.copyWith(booking: value));
  });
}/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PaymentsConfigModelCopyWith<$Res>? get config {
    if (_self.config == null) {
    return null;
  }

  return $PaymentsConfigModelCopyWith<$Res>(_self.config!, (value) {
    return _then(_self.copyWith(config: value));
  });
}
}


/// Adds pattern-matching-related methods to [PaymentState].
extension PaymentStatePatterns on PaymentState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentState value)  $default,){
final _that = this;
switch (_that) {
case _PaymentState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentState value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reference,  PaymentStatus status,  PublicBookingModel? booking,  PaymentsConfigModel? config,  int? secondsLeft,  PaymentNotice? notice,  String? message,  bool busy)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentState() when $default != null:
return $default(_that.reference,_that.status,_that.booking,_that.config,_that.secondsLeft,_that.notice,_that.message,_that.busy);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reference,  PaymentStatus status,  PublicBookingModel? booking,  PaymentsConfigModel? config,  int? secondsLeft,  PaymentNotice? notice,  String? message,  bool busy)  $default,) {final _that = this;
switch (_that) {
case _PaymentState():
return $default(_that.reference,_that.status,_that.booking,_that.config,_that.secondsLeft,_that.notice,_that.message,_that.busy);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reference,  PaymentStatus status,  PublicBookingModel? booking,  PaymentsConfigModel? config,  int? secondsLeft,  PaymentNotice? notice,  String? message,  bool busy)?  $default,) {final _that = this;
switch (_that) {
case _PaymentState() when $default != null:
return $default(_that.reference,_that.status,_that.booking,_that.config,_that.secondsLeft,_that.notice,_that.message,_that.busy);case _:
  return null;

}
}

}

/// @nodoc


class _PaymentState extends PaymentState {
  const _PaymentState({required this.reference, this.status = PaymentStatus.loading, this.booking, this.config, this.secondsLeft, this.notice, this.message, this.busy = false}): super._();
  

@override final  String reference;
@override@JsonKey() final  PaymentStatus status;
@override final  PublicBookingModel? booking;
@override final  PaymentsConfigModel? config;
/// Seconds left on the hold, counted down from the API's figure (never the phone's clock).
@override final  int? secondsLeft;
@override final  PaymentNotice? notice;
/// Stripe's message of a failed attempt, or the translated API error.
@override final  String? message;
@override@JsonKey() final  bool busy;

/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentStateCopyWith<_PaymentState> get copyWith => __$PaymentStateCopyWithImpl<_PaymentState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentState&&(identical(other.reference, reference) || other.reference == reference)&&(identical(other.status, status) || other.status == status)&&(identical(other.booking, booking) || other.booking == booking)&&(identical(other.config, config) || other.config == config)&&(identical(other.secondsLeft, secondsLeft) || other.secondsLeft == secondsLeft)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.message, message) || other.message == message)&&(identical(other.busy, busy) || other.busy == busy));
}


@override
int get hashCode {
    return Object.hash(runtimeType,reference,status,booking,config,secondsLeft,notice,message,busy);
}

@override
String toString() {
    return 'PaymentState(reference: $reference, status: $status, booking: $booking, config: $config, secondsLeft: $secondsLeft, notice: $notice, message: $message, busy: $busy)';
}


}

/// @nodoc
abstract mixin class _$PaymentStateCopyWith<$Res> implements $PaymentStateCopyWith<$Res> {
  factory _$PaymentStateCopyWith(_PaymentState value, $Res Function(_PaymentState) _then) = __$PaymentStateCopyWithImpl;
@override @useResult
$Res call({
 String reference, PaymentStatus status, PublicBookingModel? booking, PaymentsConfigModel? config, int? secondsLeft, PaymentNotice? notice, String? message, bool busy
});


@override $PublicBookingModelCopyWith<$Res>? get booking;@override $PaymentsConfigModelCopyWith<$Res>? get config;

}
/// @nodoc
class __$PaymentStateCopyWithImpl<$Res>
    implements _$PaymentStateCopyWith<$Res> {
  __$PaymentStateCopyWithImpl(this._self, this._then);

  final _PaymentState _self;
  final $Res Function(_PaymentState) _then;

/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reference = null,Object? status = null,Object? booking = freezed,Object? config = freezed,Object? secondsLeft = freezed,Object? notice = freezed,Object? message = freezed,Object? busy = null,}) {
  return _then(_PaymentState(
reference: null == reference ? _self.reference : reference // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PaymentStatus,booking: freezed == booking ? _self.booking : booking // ignore: cast_nullable_to_non_nullable
as PublicBookingModel?,config: freezed == config ? _self.config : config // ignore: cast_nullable_to_non_nullable
as PaymentsConfigModel?,secondsLeft: freezed == secondsLeft ? _self.secondsLeft : secondsLeft // ignore: cast_nullable_to_non_nullable
as int?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as PaymentNotice?,message: freezed == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as String?,busy: null == busy ? _self.busy : busy // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PublicBookingModelCopyWith<$Res>? get booking {
    if (_self.booking == null) {
    return null;
  }

  return $PublicBookingModelCopyWith<$Res>(_self.booking!, (value) {
    return _then(_self.copyWith(booking: value));
  });
}/// Create a copy of PaymentState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PaymentsConfigModelCopyWith<$Res>? get config {
    if (_self.config == null) {
    return null;
  }

  return $PaymentsConfigModelCopyWith<$Res>(_self.config!, (value) {
    return _then(_self.copyWith(config: value));
  });
}
}

// dart format on
