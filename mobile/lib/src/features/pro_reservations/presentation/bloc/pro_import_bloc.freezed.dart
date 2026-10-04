// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_import_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProImportState {

 ViewState get viewState; ParsedEmailModel? get result; String? get errorCode;
/// Create a copy of ProImportState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProImportStateCopyWith<ProImportState> get copyWith => _$ProImportStateCopyWithImpl<ProImportState>(this as ProImportState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProImportState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProImportState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.result, _this.result) || other.result == _this.result)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ProImportState;
  return Object.hash(runtimeType,_this.viewState,_this.result,_this.errorCode);
}

@override
String toString() {
  final _this = this as ProImportState;
  return 'ProImportState(viewState: ${_this.viewState}, result: ${_this.result}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ProImportStateCopyWith<$Res>  {
  factory $ProImportStateCopyWith(ProImportState value, $Res Function(ProImportState) _then) = _$ProImportStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ParsedEmailModel? result, String? errorCode
});


$ParsedEmailModelCopyWith<$Res>? get result;

}
/// @nodoc
class _$ProImportStateCopyWithImpl<$Res>
    implements $ProImportStateCopyWith<$Res> {
  _$ProImportStateCopyWithImpl(this._self, this._then);

  final ProImportState _self;
  final $Res Function(ProImportState) _then;

/// Create a copy of ProImportState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? result = freezed,Object? errorCode = freezed,}) {
  return _then(ProImportState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,result: freezed == result ? _self.result : result // ignore: cast_nullable_to_non_nullable
as ParsedEmailModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProImportState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParsedEmailModelCopyWith<$Res>? get result {
    if (_self.result == null) {
    return null;
  }

  return $ParsedEmailModelCopyWith<$Res>(_self.result!, (value) {
    return _then(_self.copyWith(result: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProImportState].
extension ProImportStatePatterns on ProImportState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProImportState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProImportState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProImportState value)  $default,){
final _that = this;
switch (_that) {
case _ProImportState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProImportState value)?  $default,){
final _that = this;
switch (_that) {
case _ProImportState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ParsedEmailModel? result,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProImportState() when $default != null:
return $default(_that.viewState,_that.result,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ParsedEmailModel? result,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ProImportState():
return $default(_that.viewState,_that.result,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ParsedEmailModel? result,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ProImportState() when $default != null:
return $default(_that.viewState,_that.result,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ProImportState extends ProImportState {
  const _ProImportState({this.viewState = ViewState.idle, this.result, this.errorCode}): super._();
  

@override@JsonKey() final  ViewState viewState;
@override final  ParsedEmailModel? result;
@override final  String? errorCode;

/// Create a copy of ProImportState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProImportStateCopyWith<_ProImportState> get copyWith => __$ProImportStateCopyWithImpl<_ProImportState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProImportState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.result, result) || other.result == result)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,result,errorCode);
}

@override
String toString() {
    return 'ProImportState(viewState: $viewState, result: $result, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ProImportStateCopyWith<$Res> implements $ProImportStateCopyWith<$Res> {
  factory _$ProImportStateCopyWith(_ProImportState value, $Res Function(_ProImportState) _then) = __$ProImportStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ParsedEmailModel? result, String? errorCode
});


@override $ParsedEmailModelCopyWith<$Res>? get result;

}
/// @nodoc
class __$ProImportStateCopyWithImpl<$Res>
    implements _$ProImportStateCopyWith<$Res> {
  __$ProImportStateCopyWithImpl(this._self, this._then);

  final _ProImportState _self;
  final $Res Function(_ProImportState) _then;

/// Create a copy of ProImportState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? result = freezed,Object? errorCode = freezed,}) {
  return _then(_ProImportState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,result: freezed == result ? _self.result : result // ignore: cast_nullable_to_non_nullable
as ParsedEmailModel?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProImportState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParsedEmailModelCopyWith<$Res>? get result {
    if (_self.result == null) {
    return null;
  }

  return $ParsedEmailModelCopyWith<$Res>(_self.result!, (value) {
    return _then(_self.copyWith(result: value));
  });
}
}

// dart format on
