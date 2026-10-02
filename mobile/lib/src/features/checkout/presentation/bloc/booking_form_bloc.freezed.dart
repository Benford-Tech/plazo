// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'booking_form_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$BookingFormState {

 String get airport; String get parking; String get arrivalAt; String get returnAt; ViewState get loadState; ParkingResponseModel? get parkingResponse; BookingDraft? get draft; ViewState get submitState;/// API codes per field ("invalid_phone"…), from the app's checks or the API's.
 Map<String, String> get fieldErrors;/// General API code ("overbooked", "validation_failed"…).
 String? get errorCode; List<String> get fullNights; CreatedBookingModel? get created;
/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingFormStateCopyWith<BookingFormState> get copyWith => _$BookingFormStateCopyWithImpl<BookingFormState>(this as BookingFormState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as BookingFormState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingFormState&&(identical(other.airport, _this.airport) || other.airport == _this.airport)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.parkingResponse, _this.parkingResponse) || other.parkingResponse == _this.parkingResponse)&&(identical(other.draft, _this.draft) || other.draft == _this.draft)&&(identical(other.submitState, _this.submitState) || other.submitState == _this.submitState)&&const DeepCollectionEquality().equals(other.fieldErrors, _this.fieldErrors)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&const DeepCollectionEquality().equals(other.fullNights, _this.fullNights)&&(identical(other.created, _this.created) || other.created == _this.created));
}


@override
int get hashCode {
  final _this = this as BookingFormState;
  return Object.hash(runtimeType,_this.airport,_this.parking,_this.arrivalAt,_this.returnAt,_this.loadState,_this.parkingResponse,_this.draft,_this.submitState,const DeepCollectionEquality().hash(_this.fieldErrors),_this.errorCode,const DeepCollectionEquality().hash(_this.fullNights),_this.created);
}

@override
String toString() {
  final _this = this as BookingFormState;
  return 'BookingFormState(airport: ${_this.airport}, parking: ${_this.parking}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, loadState: ${_this.loadState}, parkingResponse: ${_this.parkingResponse}, draft: ${_this.draft}, submitState: ${_this.submitState}, fieldErrors: ${_this.fieldErrors}, errorCode: ${_this.errorCode}, fullNights: ${_this.fullNights}, created: ${_this.created})';
}


}

/// @nodoc
abstract mixin class $BookingFormStateCopyWith<$Res>  {
  factory $BookingFormStateCopyWith(BookingFormState value, $Res Function(BookingFormState) _then) = _$BookingFormStateCopyWithImpl;
@useResult
$Res call({
 String airport, String parking, String arrivalAt, String returnAt, ViewState loadState, ParkingResponseModel? parkingResponse, BookingDraft? draft, ViewState submitState, Map<String, String> fieldErrors, String? errorCode, List<String> fullNights, CreatedBookingModel? created
});


$ParkingResponseModelCopyWith<$Res>? get parkingResponse;$CreatedBookingModelCopyWith<$Res>? get created;

}
/// @nodoc
class _$BookingFormStateCopyWithImpl<$Res>
    implements $BookingFormStateCopyWith<$Res> {
  _$BookingFormStateCopyWithImpl(this._self, this._then);

  final BookingFormState _self;
  final $Res Function(BookingFormState) _then;

/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? airport = null,Object? parking = null,Object? arrivalAt = null,Object? returnAt = null,Object? loadState = null,Object? parkingResponse = freezed,Object? draft = freezed,Object? submitState = null,Object? fieldErrors = null,Object? errorCode = freezed,Object? fullNights = null,Object? created = freezed,}) {
  return _then(BookingFormState(
airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,parkingResponse: freezed == parkingResponse ? _self.parkingResponse : parkingResponse // ignore: cast_nullable_to_non_nullable
as ParkingResponseModel?,draft: freezed == draft ? _self.draft : draft // ignore: cast_nullable_to_non_nullable
as BookingDraft?,submitState: null == submitState ? _self.submitState : submitState // ignore: cast_nullable_to_non_nullable
as ViewState,fieldErrors: null == fieldErrors ? _self.fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fullNights: null == fullNights ? _self.fullNights : fullNights // ignore: cast_nullable_to_non_nullable
as List<String>,created: freezed == created ? _self.created : created // ignore: cast_nullable_to_non_nullable
as CreatedBookingModel?,
  ));
}
/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingResponseModelCopyWith<$Res>? get parkingResponse {
    if (_self.parkingResponse == null) {
    return null;
  }

  return $ParkingResponseModelCopyWith<$Res>(_self.parkingResponse!, (value) {
    return _then(_self.copyWith(parkingResponse: value));
  });
}/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CreatedBookingModelCopyWith<$Res>? get created {
    if (_self.created == null) {
    return null;
  }

  return $CreatedBookingModelCopyWith<$Res>(_self.created!, (value) {
    return _then(_self.copyWith(created: value));
  });
}
}


/// Adds pattern-matching-related methods to [BookingFormState].
extension BookingFormStatePatterns on BookingFormState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingFormState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingFormState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingFormState value)  $default,){
final _that = this;
switch (_that) {
case _BookingFormState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingFormState value)?  $default,){
final _that = this;
switch (_that) {
case _BookingFormState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String airport,  String parking,  String arrivalAt,  String returnAt,  ViewState loadState,  ParkingResponseModel? parkingResponse,  BookingDraft? draft,  ViewState submitState,  Map<String, String> fieldErrors,  String? errorCode,  List<String> fullNights,  CreatedBookingModel? created)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingFormState() when $default != null:
return $default(_that.airport,_that.parking,_that.arrivalAt,_that.returnAt,_that.loadState,_that.parkingResponse,_that.draft,_that.submitState,_that.fieldErrors,_that.errorCode,_that.fullNights,_that.created);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String airport,  String parking,  String arrivalAt,  String returnAt,  ViewState loadState,  ParkingResponseModel? parkingResponse,  BookingDraft? draft,  ViewState submitState,  Map<String, String> fieldErrors,  String? errorCode,  List<String> fullNights,  CreatedBookingModel? created)  $default,) {final _that = this;
switch (_that) {
case _BookingFormState():
return $default(_that.airport,_that.parking,_that.arrivalAt,_that.returnAt,_that.loadState,_that.parkingResponse,_that.draft,_that.submitState,_that.fieldErrors,_that.errorCode,_that.fullNights,_that.created);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String airport,  String parking,  String arrivalAt,  String returnAt,  ViewState loadState,  ParkingResponseModel? parkingResponse,  BookingDraft? draft,  ViewState submitState,  Map<String, String> fieldErrors,  String? errorCode,  List<String> fullNights,  CreatedBookingModel? created)?  $default,) {final _that = this;
switch (_that) {
case _BookingFormState() when $default != null:
return $default(_that.airport,_that.parking,_that.arrivalAt,_that.returnAt,_that.loadState,_that.parkingResponse,_that.draft,_that.submitState,_that.fieldErrors,_that.errorCode,_that.fullNights,_that.created);case _:
  return null;

}
}

}

/// @nodoc


class _BookingFormState extends BookingFormState {
  const _BookingFormState({required this.airport, required this.parking, required this.arrivalAt, required this.returnAt, this.loadState = ViewState.idle, this.parkingResponse, this.draft, this.submitState = ViewState.idle,  Map<String, String> fieldErrors = const <String, String>{}, this.errorCode,  List<String> fullNights = const <String>[], this.created}): _fieldErrors = fieldErrors,_fullNights = fullNights,super._();
  

@override final  String airport;
@override final  String parking;
@override final  String arrivalAt;
@override final  String returnAt;
@override@JsonKey() final  ViewState loadState;
@override final  ParkingResponseModel? parkingResponse;
@override final  BookingDraft? draft;
@override@JsonKey() final  ViewState submitState;
/// API codes per field ("invalid_phone"…), from the app's checks or the API's.
 final  Map<String, String> _fieldErrors;
/// API codes per field ("invalid_phone"…), from the app's checks or the API's.
@override@JsonKey() Map<String, String> get fieldErrors {
  if (_fieldErrors is EqualUnmodifiableMapView) return _fieldErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_fieldErrors);
}

/// General API code ("overbooked", "validation_failed"…).
@override final  String? errorCode;
 final  List<String> _fullNights;
@override@JsonKey() List<String> get fullNights {
  if (_fullNights is EqualUnmodifiableListView) return _fullNights;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_fullNights);
}

@override final  CreatedBookingModel? created;

/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingFormStateCopyWith<_BookingFormState> get copyWith => __$BookingFormStateCopyWithImpl<_BookingFormState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingFormState&&(identical(other.airport, airport) || other.airport == airport)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.parkingResponse, parkingResponse) || other.parkingResponse == parkingResponse)&&(identical(other.draft, draft) || other.draft == draft)&&(identical(other.submitState, submitState) || other.submitState == submitState)&&const DeepCollectionEquality().equals(other.fieldErrors, _fieldErrors)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&const DeepCollectionEquality().equals(other.fullNights, _fullNights)&&(identical(other.created, created) || other.created == created));
}


@override
int get hashCode {
    return Object.hash(runtimeType,airport,parking,arrivalAt,returnAt,loadState,parkingResponse,draft,submitState,const DeepCollectionEquality().hash(_fieldErrors),errorCode,const DeepCollectionEquality().hash(_fullNights),created);
}

@override
String toString() {
    return 'BookingFormState(airport: $airport, parking: $parking, arrivalAt: $arrivalAt, returnAt: $returnAt, loadState: $loadState, parkingResponse: $parkingResponse, draft: $draft, submitState: $submitState, fieldErrors: $fieldErrors, errorCode: $errorCode, fullNights: $fullNights, created: $created)';
}


}

/// @nodoc
abstract mixin class _$BookingFormStateCopyWith<$Res> implements $BookingFormStateCopyWith<$Res> {
  factory _$BookingFormStateCopyWith(_BookingFormState value, $Res Function(_BookingFormState) _then) = __$BookingFormStateCopyWithImpl;
@override @useResult
$Res call({
 String airport, String parking, String arrivalAt, String returnAt, ViewState loadState, ParkingResponseModel? parkingResponse, BookingDraft? draft, ViewState submitState, Map<String, String> fieldErrors, String? errorCode, List<String> fullNights, CreatedBookingModel? created
});


@override $ParkingResponseModelCopyWith<$Res>? get parkingResponse;@override $CreatedBookingModelCopyWith<$Res>? get created;

}
/// @nodoc
class __$BookingFormStateCopyWithImpl<$Res>
    implements _$BookingFormStateCopyWith<$Res> {
  __$BookingFormStateCopyWithImpl(this._self, this._then);

  final _BookingFormState _self;
  final $Res Function(_BookingFormState) _then;

/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? airport = null,Object? parking = null,Object? arrivalAt = null,Object? returnAt = null,Object? loadState = null,Object? parkingResponse = freezed,Object? draft = freezed,Object? submitState = null,Object? fieldErrors = null,Object? errorCode = freezed,Object? fullNights = null,Object? created = freezed,}) {
  return _then(_BookingFormState(
airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as String,parking: null == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,parkingResponse: freezed == parkingResponse ? _self.parkingResponse : parkingResponse // ignore: cast_nullable_to_non_nullable
as ParkingResponseModel?,draft: freezed == draft ? _self.draft : draft // ignore: cast_nullable_to_non_nullable
as BookingDraft?,submitState: null == submitState ? _self.submitState : submitState // ignore: cast_nullable_to_non_nullable
as ViewState,fieldErrors: null == fieldErrors ? _self._fieldErrors : fieldErrors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,fullNights: null == fullNights ? _self._fullNights : fullNights // ignore: cast_nullable_to_non_nullable
as List<String>,created: freezed == created ? _self.created : created // ignore: cast_nullable_to_non_nullable
as CreatedBookingModel?,
  ));
}

/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingResponseModelCopyWith<$Res>? get parkingResponse {
    if (_self.parkingResponse == null) {
    return null;
  }

  return $ParkingResponseModelCopyWith<$Res>(_self.parkingResponse!, (value) {
    return _then(_self.copyWith(parkingResponse: value));
  });
}/// Create a copy of BookingFormState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CreatedBookingModelCopyWith<$Res>? get created {
    if (_self.created == null) {
    return null;
  }

  return $CreatedBookingModelCopyWith<$Res>(_self.created!, (value) {
    return _then(_self.copyWith(created: value));
  });
}
}

// dart format on
