// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'paperwork_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$PaperworkState {

 ViewState get viewState; ViewState get actionState; PaperworkOwner? get owner; PaperworkModel? get data; CodeSentModel? get codeSent; String? get busySlot;/// The last action's failure: its code, its fields' codes and its French message.
 String? get errorCode; Map<String, String>? get errorFields; String? get errorMessage;/// What just happened, for a snackbar: signed, answered, completed.
 String? get notice;
/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaperworkStateCopyWith<PaperworkState> get copyWith => _$PaperworkStateCopyWithImpl<PaperworkState>(this as PaperworkState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as PaperworkState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaperworkState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.owner, _this.owner) || other.owner == _this.owner)&&(identical(other.data, _this.data) || other.data == _this.data)&&(identical(other.codeSent, _this.codeSent) || other.codeSent == _this.codeSent)&&(identical(other.busySlot, _this.busySlot) || other.busySlot == _this.busySlot)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode)&&const DeepCollectionEquality().equals(other.errorFields, _this.errorFields)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.notice, _this.notice) || other.notice == _this.notice));
}


@override
int get hashCode {
  final _this = this as PaperworkState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.owner,_this.data,_this.codeSent,_this.busySlot,_this.errorCode,const DeepCollectionEquality().hash(_this.errorFields),_this.errorMessage,_this.notice);
}

@override
String toString() {
  final _this = this as PaperworkState;
  return 'PaperworkState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, owner: ${_this.owner}, data: ${_this.data}, codeSent: ${_this.codeSent}, busySlot: ${_this.busySlot}, errorCode: ${_this.errorCode}, errorFields: ${_this.errorFields}, errorMessage: ${_this.errorMessage}, notice: ${_this.notice})';
}


}

/// @nodoc
abstract mixin class $PaperworkStateCopyWith<$Res>  {
  factory $PaperworkStateCopyWith(PaperworkState value, $Res Function(PaperworkState) _then) = _$PaperworkStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, PaperworkOwner? owner, PaperworkModel? data, CodeSentModel? codeSent, String? busySlot, String? errorCode, Map<String, String>? errorFields, String? errorMessage, String? notice
});


$PaperworkModelCopyWith<$Res>? get data;$CodeSentModelCopyWith<$Res>? get codeSent;

}
/// @nodoc
class _$PaperworkStateCopyWithImpl<$Res>
    implements $PaperworkStateCopyWith<$Res> {
  _$PaperworkStateCopyWithImpl(this._self, this._then);

  final PaperworkState _self;
  final $Res Function(PaperworkState) _then;

/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? owner = freezed,Object? data = freezed,Object? codeSent = freezed,Object? busySlot = freezed,Object? errorCode = freezed,Object? errorFields = freezed,Object? errorMessage = freezed,Object? notice = freezed,}) {
  return _then(PaperworkState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,owner: freezed == owner ? _self.owner : owner // ignore: cast_nullable_to_non_nullable
as PaperworkOwner?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as PaperworkModel?,codeSent: freezed == codeSent ? _self.codeSent : codeSent // ignore: cast_nullable_to_non_nullable
as CodeSentModel?,busySlot: freezed == busySlot ? _self.busySlot : busySlot // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorFields: freezed == errorFields ? _self.errorFields : errorFields // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PaperworkModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $PaperworkModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CodeSentModelCopyWith<$Res>? get codeSent {
    if (_self.codeSent == null) {
    return null;
  }

  return $CodeSentModelCopyWith<$Res>(_self.codeSent!, (value) {
    return _then(_self.copyWith(codeSent: value));
  });
}
}


/// Adds pattern-matching-related methods to [PaperworkState].
extension PaperworkStatePatterns on PaperworkState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaperworkState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaperworkState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaperworkState value)  $default,){
final _that = this;
switch (_that) {
case _PaperworkState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaperworkState value)?  $default,){
final _that = this;
switch (_that) {
case _PaperworkState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  PaperworkOwner? owner,  PaperworkModel? data,  CodeSentModel? codeSent,  String? busySlot,  String? errorCode,  Map<String, String>? errorFields,  String? errorMessage,  String? notice)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaperworkState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.owner,_that.data,_that.codeSent,_that.busySlot,_that.errorCode,_that.errorFields,_that.errorMessage,_that.notice);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  PaperworkOwner? owner,  PaperworkModel? data,  CodeSentModel? codeSent,  String? busySlot,  String? errorCode,  Map<String, String>? errorFields,  String? errorMessage,  String? notice)  $default,) {final _that = this;
switch (_that) {
case _PaperworkState():
return $default(_that.viewState,_that.actionState,_that.owner,_that.data,_that.codeSent,_that.busySlot,_that.errorCode,_that.errorFields,_that.errorMessage,_that.notice);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  PaperworkOwner? owner,  PaperworkModel? data,  CodeSentModel? codeSent,  String? busySlot,  String? errorCode,  Map<String, String>? errorFields,  String? errorMessage,  String? notice)?  $default,) {final _that = this;
switch (_that) {
case _PaperworkState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.owner,_that.data,_that.codeSent,_that.busySlot,_that.errorCode,_that.errorFields,_that.errorMessage,_that.notice);case _:
  return null;

}
}

}

/// @nodoc


class _PaperworkState extends PaperworkState {
  const _PaperworkState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.owner, this.data, this.codeSent, this.busySlot, this.errorCode,  Map<String, String>? errorFields, this.errorMessage, this.notice}): _errorFields = errorFields,super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override final  PaperworkOwner? owner;
@override final  PaperworkModel? data;
@override final  CodeSentModel? codeSent;
@override final  String? busySlot;
/// The last action's failure: its code, its fields' codes and its French message.
@override final  String? errorCode;
 final  Map<String, String>? _errorFields;
@override Map<String, String>? get errorFields {
  final value = _errorFields;
  if (value == null) return null;
  if (_errorFields is EqualUnmodifiableMapView) return _errorFields;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  String? errorMessage;
/// What just happened, for a snackbar: signed, answered, completed.
@override final  String? notice;

/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaperworkStateCopyWith<_PaperworkState> get copyWith => __$PaperworkStateCopyWithImpl<_PaperworkState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaperworkState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.owner, owner) || other.owner == owner)&&(identical(other.data, data) || other.data == data)&&(identical(other.codeSent, codeSent) || other.codeSent == codeSent)&&(identical(other.busySlot, busySlot) || other.busySlot == busySlot)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode)&&const DeepCollectionEquality().equals(other.errorFields, _errorFields)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.notice, notice) || other.notice == notice));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,owner,data,codeSent,busySlot,errorCode,const DeepCollectionEquality().hash(_errorFields),errorMessage,notice);
}

@override
String toString() {
    return 'PaperworkState(viewState: $viewState, actionState: $actionState, owner: $owner, data: $data, codeSent: $codeSent, busySlot: $busySlot, errorCode: $errorCode, errorFields: $errorFields, errorMessage: $errorMessage, notice: $notice)';
}


}

/// @nodoc
abstract mixin class _$PaperworkStateCopyWith<$Res> implements $PaperworkStateCopyWith<$Res> {
  factory _$PaperworkStateCopyWith(_PaperworkState value, $Res Function(_PaperworkState) _then) = __$PaperworkStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, PaperworkOwner? owner, PaperworkModel? data, CodeSentModel? codeSent, String? busySlot, String? errorCode, Map<String, String>? errorFields, String? errorMessage, String? notice
});


@override $PaperworkModelCopyWith<$Res>? get data;@override $CodeSentModelCopyWith<$Res>? get codeSent;

}
/// @nodoc
class __$PaperworkStateCopyWithImpl<$Res>
    implements _$PaperworkStateCopyWith<$Res> {
  __$PaperworkStateCopyWithImpl(this._self, this._then);

  final _PaperworkState _self;
  final $Res Function(_PaperworkState) _then;

/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? owner = freezed,Object? data = freezed,Object? codeSent = freezed,Object? busySlot = freezed,Object? errorCode = freezed,Object? errorFields = freezed,Object? errorMessage = freezed,Object? notice = freezed,}) {
  return _then(_PaperworkState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,owner: freezed == owner ? _self.owner : owner // ignore: cast_nullable_to_non_nullable
as PaperworkOwner?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as PaperworkModel?,codeSent: freezed == codeSent ? _self.codeSent : codeSent // ignore: cast_nullable_to_non_nullable
as CodeSentModel?,busySlot: freezed == busySlot ? _self.busySlot : busySlot // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,errorFields: freezed == errorFields ? _self._errorFields : errorFields // ignore: cast_nullable_to_non_nullable
as Map<String, String>?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PaperworkModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $PaperworkModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}/// Create a copy of PaperworkState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CodeSentModelCopyWith<$Res>? get codeSent {
    if (_self.codeSent == null) {
    return null;
  }

  return $CodeSentModelCopyWith<$Res>(_self.codeSent!, (value) {
    return _then(_self.copyWith(codeSent: value));
  });
}
}

// dart format on
