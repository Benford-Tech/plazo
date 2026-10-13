// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'revenue_summary_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$RevenueSummaryState {

 ViewState get viewState; RevenueSummaryModel? get data;
/// Create a copy of RevenueSummaryState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RevenueSummaryStateCopyWith<RevenueSummaryState> get copyWith => _$RevenueSummaryStateCopyWithImpl<RevenueSummaryState>(this as RevenueSummaryState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as RevenueSummaryState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RevenueSummaryState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.data, _this.data) || other.data == _this.data));
}


@override
int get hashCode {
  final _this = this as RevenueSummaryState;
  return Object.hash(runtimeType,_this.viewState,_this.data);
}

@override
String toString() {
  final _this = this as RevenueSummaryState;
  return 'RevenueSummaryState(viewState: ${_this.viewState}, data: ${_this.data})';
}


}

/// @nodoc
abstract mixin class $RevenueSummaryStateCopyWith<$Res>  {
  factory $RevenueSummaryStateCopyWith(RevenueSummaryState value, $Res Function(RevenueSummaryState) _then) = _$RevenueSummaryStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, RevenueSummaryModel? data
});


$RevenueSummaryModelCopyWith<$Res>? get data;

}
/// @nodoc
class _$RevenueSummaryStateCopyWithImpl<$Res>
    implements $RevenueSummaryStateCopyWith<$Res> {
  _$RevenueSummaryStateCopyWithImpl(this._self, this._then);

  final RevenueSummaryState _self;
  final $Res Function(RevenueSummaryState) _then;

/// Create a copy of RevenueSummaryState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? data = freezed,}) {
  return _then(RevenueSummaryState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as RevenueSummaryModel?,
  ));
}
/// Create a copy of RevenueSummaryState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RevenueSummaryModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $RevenueSummaryModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}


/// Adds pattern-matching-related methods to [RevenueSummaryState].
extension RevenueSummaryStatePatterns on RevenueSummaryState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RevenueSummaryState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RevenueSummaryState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RevenueSummaryState value)  $default,){
final _that = this;
switch (_that) {
case _RevenueSummaryState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RevenueSummaryState value)?  $default,){
final _that = this;
switch (_that) {
case _RevenueSummaryState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  RevenueSummaryModel? data)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RevenueSummaryState() when $default != null:
return $default(_that.viewState,_that.data);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  RevenueSummaryModel? data)  $default,) {final _that = this;
switch (_that) {
case _RevenueSummaryState():
return $default(_that.viewState,_that.data);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  RevenueSummaryModel? data)?  $default,) {final _that = this;
switch (_that) {
case _RevenueSummaryState() when $default != null:
return $default(_that.viewState,_that.data);case _:
  return null;

}
}

}

/// @nodoc


class _RevenueSummaryState implements RevenueSummaryState {
  const _RevenueSummaryState({this.viewState = ViewState.idle, this.data});
  

@override@JsonKey() final  ViewState viewState;
@override final  RevenueSummaryModel? data;

/// Create a copy of RevenueSummaryState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RevenueSummaryStateCopyWith<_RevenueSummaryState> get copyWith => __$RevenueSummaryStateCopyWithImpl<_RevenueSummaryState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RevenueSummaryState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.data, data) || other.data == data));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,data);
}

@override
String toString() {
    return 'RevenueSummaryState(viewState: $viewState, data: $data)';
}


}

/// @nodoc
abstract mixin class _$RevenueSummaryStateCopyWith<$Res> implements $RevenueSummaryStateCopyWith<$Res> {
  factory _$RevenueSummaryStateCopyWith(_RevenueSummaryState value, $Res Function(_RevenueSummaryState) _then) = __$RevenueSummaryStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, RevenueSummaryModel? data
});


@override $RevenueSummaryModelCopyWith<$Res>? get data;

}
/// @nodoc
class __$RevenueSummaryStateCopyWithImpl<$Res>
    implements _$RevenueSummaryStateCopyWith<$Res> {
  __$RevenueSummaryStateCopyWithImpl(this._self, this._then);

  final _RevenueSummaryState _self;
  final $Res Function(_RevenueSummaryState) _then;

/// Create a copy of RevenueSummaryState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? data = freezed,}) {
  return _then(_RevenueSummaryState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as RevenueSummaryModel?,
  ));
}

/// Create a copy of RevenueSummaryState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RevenueSummaryModelCopyWith<$Res>? get data {
    if (_self.data == null) {
    return null;
  }

  return $RevenueSummaryModelCopyWith<$Res>(_self.data!, (value) {
    return _then(_self.copyWith(data: value));
  });
}
}

// dart format on
