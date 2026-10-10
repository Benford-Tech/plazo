// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_reservation_form_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProReservationFormState {

/// Null for a new booking.
 String? get id; ReservationInput get input;/// The price field as typed (euros); `input.priceCents` takes it on save.
 String get priceText; ViewState get saveState; CapacityPreviewModel? get capacity; bool get checkingCapacity; ReservationModel? get saved; String? get errorCode; Map<String, String> get fieldErrors;
/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProReservationFormStateCopyWith<ProReservationFormState> get copyWith => _$ProReservationFormStateCopyWithImpl<ProReservationFormState>(this as ProReservationFormState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProReservationFormState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProReservationFormState&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.input, _this.input) || other.input == _this.input)&&(identical(other.priceText, _this.priceText) || other.priceText == _this.priceText)&&(identical(other.saveState, _this.saveState) || other.saveState == _this.saveState)&&(identical(other.capacity, _this.capacity) || other.capacity == _this.capacity)&&(identical(other.checkingCapacity, _this.checkingCapacity) || other.checkingCapacity == _this.checkingCapacity)&&(identical(other.saved, _this.saved) || other.saved == _this.saved)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors));
}


@override
int get hashCode {
  final _this = this as ProReservationFormState;
  return Object.hash(runtimeType,_this.id,_this.input,_this.priceText,_this.saveState,_this.capacity,_this.checkingCapacity,_this.saved,_this.errorCode,const DeepCollectionEquality().hash(_this.fieldErrors));
}

@override
String toString() {
  final _this = this as ProReservationFormState;
  return 'ProReservationFormState(id: ${_this.id}, input: ${_this.input}, priceText: ${_this.priceText}, saveState: ${_this.saveState}, capacity: ${_this.capacity}, checkingCapacity: ${_this.checkingCapacity}, saved: ${_this.saved}, errorCode: ${_this.errorCode}, fieldErrors: ${_this.fieldErrors})';
}


}

/// @nodoc
abstract mixin class $ProReservationFormStateCopyWith<$Res>  {
  factory $ProReservationFormStateCopyWith(ProReservationFormState value, $Res Function(ProReservationFormState) _then) = _$ProReservationFormStateCopyWithImpl;
@useResult
$Res call({
 String? id, ReservationInput input, String priceText, ViewState saveState, CapacityPreviewModel? capacity, bool checkingCapacity, ReservationModel? saved, String? errorCode, Map<String, String> fieldErrors
});


$ReservationInputCopyWith<$Res> get input;$CapacityPreviewModelCopyWith<$Res>? get capacity;$ReservationModelCopyWith<$Res>? get saved;

}
/// @nodoc
class _$ProReservationFormStateCopyWithImpl<$Res>
    implements $ProReservationFormStateCopyWith<$Res> {
  _$ProReservationFormStateCopyWithImpl(this._self, this._then);

  final ProReservationFormState _self;
  final $Res Function(ProReservationFormState) _then;

/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? input = null,Object? priceText = null,Object? saveState = null,Object? capacity = freezed,Object? checkingCapacity = null,Object? saved = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(ProReservationFormState(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,input: null == input ? _self.input : input // ignore: cast_nullable_to_non_nullable
as ReservationInput,priceText: null == priceText ? _self.priceText : priceText // ignore: cast_nullable_to_non_nullable
as String,saveState: null == saveState ? _self.saveState : saveState // ignore: cast_nullable_to_non_nullable
as ViewState,capacity: freezed == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as CapacityPreviewModel?,checkingCapacity: null == checkingCapacity ? _self.checkingCapacity : checkingCapacity // ignore: cast_nullable_to_non_nullable
as bool,saved: freezed == saved ? _self.saved : saved // ignore: cast_nullable_to_non_nullable
as ReservationModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}
/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationInputCopyWith<$Res> get input {
  
  return $ReservationInputCopyWith<$Res>(_self.input, (value) {
    return _then(_self.copyWith(input: value));
  });
}/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CapacityPreviewModelCopyWith<$Res>? get capacity {
    if (_self.capacity == null) {
    return null;
  }

  return $CapacityPreviewModelCopyWith<$Res>(_self.capacity!, (value) {
    return _then(_self.copyWith(capacity: value));
  });
}/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationModelCopyWith<$Res>? get saved {
    if (_self.saved == null) {
    return null;
  }

  return $ReservationModelCopyWith<$Res>(_self.saved!, (value) {
    return _then(_self.copyWith(saved: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProReservationFormState].
extension ProReservationFormStatePatterns on ProReservationFormState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProReservationFormState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProReservationFormState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProReservationFormState value)  $default,){
final _that = this;
switch (_that) {
case _ProReservationFormState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProReservationFormState value)?  $default,){
final _that = this;
switch (_that) {
case _ProReservationFormState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? id,  ReservationInput input,  String priceText,  ViewState saveState,  CapacityPreviewModel? capacity,  bool checkingCapacity,  ReservationModel? saved,  String? errorCode,  Map<String, String> fieldErrors)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProReservationFormState() when $default != null:
return $default(_that.id,_that.input,_that.priceText,_that.saveState,_that.capacity,_that.checkingCapacity,_that.saved,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? id,  ReservationInput input,  String priceText,  ViewState saveState,  CapacityPreviewModel? capacity,  bool checkingCapacity,  ReservationModel? saved,  String? errorCode,  Map<String, String> fieldErrors)  $default,) {final _that = this;
switch (_that) {
case _ProReservationFormState():
return $default(_that.id,_that.input,_that.priceText,_that.saveState,_that.capacity,_that.checkingCapacity,_that.saved,_that.errorCode,_that.fieldErrors);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? id,  ReservationInput input,  String priceText,  ViewState saveState,  CapacityPreviewModel? capacity,  bool checkingCapacity,  ReservationModel? saved,  String? errorCode,  Map<String, String> fieldErrors)?  $default,) {final _that = this;
switch (_that) {
case _ProReservationFormState() when $default != null:
return $default(_that.id,_that.input,_that.priceText,_that.saveState,_that.capacity,_that.checkingCapacity,_that.saved,_that.errorCode,_that.fieldErrors);case _:
  return null;

}
}

}

/// @nodoc


class _ProReservationFormState extends ProReservationFormState {
  const _ProReservationFormState({this.id, required this.input, this.priceText = '', this.saveState = ViewState.idle, this.capacity, this.checkingCapacity = false, this.saved, this.errorCode,  Map<String, String> fieldErrors = const {}}): _fieldErrors = fieldErrors,super._();
  

/// Null for a new booking.
@override final  String? id;
@override final  ReservationInput input;
/// The price field as typed (euros); `input.priceCents` takes it on save.
@override@JsonKey() final  String priceText;
@override@JsonKey() final  ViewState saveState;
@override final  CapacityPreviewModel? capacity;
@override@JsonKey() final  bool checkingCapacity;
@override final  ReservationModel? saved;
@override final  String? errorCode;
 final  Map<String, String> _fieldErrors;
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}


/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProReservationFormStateCopyWith<_ProReservationFormState> get copyWith => __$ProReservationFormStateCopyWithImpl<_ProReservationFormState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProReservationFormState&&(identical(other.id, id) || other.id == id)&&(identical(other.input, input) || other.input == input)&&(identical(other.priceText, priceText) || other.priceText == priceText)&&(identical(other.saveState, saveState) || other.saveState == saveState)&&(identical(other.capacity, capacity) || other.capacity == capacity)&&(identical(other.checkingCapacity, checkingCapacity) || other.checkingCapacity == checkingCapacity)&&(identical(other.saved, saved) || other.saved == saved)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors));
}


@override
int get hashCode {
    return Object.hash(runtimeType,id,input,priceText,saveState,capacity,checkingCapacity,saved,errorCode,const DeepCollectionEquality().hash(_fieldErrors));
}

@override
String toString() {
    return 'ProReservationFormState(id: $id, input: $input, priceText: $priceText, saveState: $saveState, capacity: $capacity, checkingCapacity: $checkingCapacity, saved: $saved, errorCode: $errorCode, fieldErrors: $fieldErrors)';
}


}

/// @nodoc
abstract mixin class _$ProReservationFormStateCopyWith<$Res> implements $ProReservationFormStateCopyWith<$Res> {
  factory _$ProReservationFormStateCopyWith(_ProReservationFormState value, $Res Function(_ProReservationFormState) _then) = __$ProReservationFormStateCopyWithImpl;
@override @useResult
$Res call({
 String? id, ReservationInput input, String priceText, ViewState saveState, CapacityPreviewModel? capacity, bool checkingCapacity, ReservationModel? saved, String? errorCode, Map<String, String> fieldErrors
});


@override $ReservationInputCopyWith<$Res> get input;@override $CapacityPreviewModelCopyWith<$Res>? get capacity;@override $ReservationModelCopyWith<$Res>? get saved;

}
/// @nodoc
class __$ProReservationFormStateCopyWithImpl<$Res>
    implements _$ProReservationFormStateCopyWith<$Res> {
  __$ProReservationFormStateCopyWithImpl(this._self, this._then);

  final _ProReservationFormState _self;
  final $Res Function(_ProReservationFormState) _then;

/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? input = null,Object? priceText = null,Object? saveState = null,Object? capacity = freezed,Object? checkingCapacity = null,Object? saved = freezed,Object? errorCode = freezed,Object? fieldErrors = null,}) {
  return _then(_ProReservationFormState(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,input: null == input ? _self.input : input // ignore: cast_nullable_to_non_nullable
as ReservationInput,priceText: null == priceText ? _self.priceText : priceText // ignore: cast_nullable_to_non_nullable
as String,saveState: null == saveState ? _self.saveState : saveState // ignore: cast_nullable_to_non_nullable
as ViewState,capacity: freezed == capacity ? _self.capacity : capacity // ignore: cast_nullable_to_non_nullable
as CapacityPreviewModel?,checkingCapacity: null == checkingCapacity ? _self.checkingCapacity : checkingCapacity // ignore: cast_nullable_to_non_nullable
as bool,saved: freezed == saved ? _self.saved : saved // ignore: cast_nullable_to_non_nullable
as ReservationModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}

/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationInputCopyWith<$Res> get input {
  
  return $ReservationInputCopyWith<$Res>(_self.input, (value) {
    return _then(_self.copyWith(input: value));
  });
}/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CapacityPreviewModelCopyWith<$Res>? get capacity {
    if (_self.capacity == null) {
    return null;
  }

  return $CapacityPreviewModelCopyWith<$Res>(_self.capacity!, (value) {
    return _then(_self.copyWith(capacity: value));
  });
}/// Create a copy of ProReservationFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ReservationModelCopyWith<$Res>? get saved {
    if (_self.saved == null) {
    return null;
  }

  return $ReservationModelCopyWith<$Res>(_self.saved!, (value) {
    return _then(_self.copyWith(saved: value));
  });
}
}

// dart format on
