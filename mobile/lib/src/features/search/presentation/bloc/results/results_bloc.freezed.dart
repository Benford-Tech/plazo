// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'results_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ResultsState {

 String get airport; String get arrivalAt; String get returnAt; ViewState get loadState; SearchResponseModel? get response; Filters get filters; ResultsView get view; String? get selectedSlug; String? get errorMessage; String? get errorCode;
/// Create a copy of ResultsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ResultsStateCopyWith<ResultsState> get copyWith => _$ResultsStateCopyWithImpl<ResultsState>(this as ResultsState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ResultsState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ResultsState&&(identical(other.airport, _this.airport) || other.airport == _this.airport)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&(identical(other.response, _this.response) || other.response == _this.response)&&(identical(other.filters, _this.filters) || other.filters == _this.filters)&&(identical(other.view, _this.view) || other.view == _this.view)&&(identical(other.selectedSlug, _this.selectedSlug) || other.selectedSlug == _this.selectedSlug)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ResultsState;
  return Object.hash(runtimeType,_this.airport,_this.arrivalAt,_this.returnAt,_this.loadState,_this.response,_this.filters,_this.view,_this.selectedSlug,_this.errorMessage,_this.errorCode);
}

@override
String toString() {
  final _this = this as ResultsState;
  return 'ResultsState(airport: ${_this.airport}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, loadState: ${_this.loadState}, response: ${_this.response}, filters: ${_this.filters}, view: ${_this.view}, selectedSlug: ${_this.selectedSlug}, errorMessage: ${_this.errorMessage}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ResultsStateCopyWith<$Res>  {
  factory $ResultsStateCopyWith(ResultsState value, $Res Function(ResultsState) _then) = _$ResultsStateCopyWithImpl;
@useResult
$Res call({
 String airport, String arrivalAt, String returnAt, ViewState loadState, SearchResponseModel? response, Filters filters, ResultsView view, String? selectedSlug, String? errorMessage, String? errorCode
});


$SearchResponseModelCopyWith<$Res>? get response;

}
/// @nodoc
class _$ResultsStateCopyWithImpl<$Res>
    implements $ResultsStateCopyWith<$Res> {
  _$ResultsStateCopyWithImpl(this._self, this._then);

  final ResultsState _self;
  final $Res Function(ResultsState) _then;

/// Create a copy of ResultsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? airport = null,Object? arrivalAt = null,Object? returnAt = null,Object? loadState = null,Object? response = freezed,Object? filters = null,Object? view = null,Object? selectedSlug = freezed,Object? errorMessage = freezed,Object? errorCode = freezed,}) {
  return _then(ResultsState(
airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,response: freezed == response ? _self.response : response // ignore: cast_nullable_to_non_nullable
as SearchResponseModel?,filters: null == filters ? _self.filters : filters // ignore: cast_nullable_to_non_nullable
as Filters,view: null == view ? _self.view : view // ignore: cast_nullable_to_non_nullable
as ResultsView,selectedSlug: freezed == selectedSlug ? _self.selectedSlug : selectedSlug // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ResultsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SearchResponseModelCopyWith<$Res>? get response {
    if (_self.response == null) {
    return null;
  }

  return $SearchResponseModelCopyWith<$Res>(_self.response!, (value) {
    return _then(_self.copyWith(response: value));
  });
}
}


/// Adds pattern-matching-related methods to [ResultsState].
extension ResultsStatePatterns on ResultsState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ResultsState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ResultsState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ResultsState value)  $default,){
final _that = this;
switch (_that) {
case _ResultsState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ResultsState value)?  $default,){
final _that = this;
switch (_that) {
case _ResultsState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String airport,  String arrivalAt,  String returnAt,  ViewState loadState,  SearchResponseModel? response,  Filters filters,  ResultsView view,  String? selectedSlug,  String? errorMessage,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ResultsState() when $default != null:
return $default(_that.airport,_that.arrivalAt,_that.returnAt,_that.loadState,_that.response,_that.filters,_that.view,_that.selectedSlug,_that.errorMessage,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String airport,  String arrivalAt,  String returnAt,  ViewState loadState,  SearchResponseModel? response,  Filters filters,  ResultsView view,  String? selectedSlug,  String? errorMessage,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ResultsState():
return $default(_that.airport,_that.arrivalAt,_that.returnAt,_that.loadState,_that.response,_that.filters,_that.view,_that.selectedSlug,_that.errorMessage,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String airport,  String arrivalAt,  String returnAt,  ViewState loadState,  SearchResponseModel? response,  Filters filters,  ResultsView view,  String? selectedSlug,  String? errorMessage,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ResultsState() when $default != null:
return $default(_that.airport,_that.arrivalAt,_that.returnAt,_that.loadState,_that.response,_that.filters,_that.view,_that.selectedSlug,_that.errorMessage,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ResultsState extends ResultsState {
  const _ResultsState({required this.airport, required this.arrivalAt, required this.returnAt, this.loadState = ViewState.idle, this.response, this.filters = const Filters(), this.view = ResultsView.list, this.selectedSlug, this.errorMessage, this.errorCode}): super._();
  

@override final  String airport;
@override final  String arrivalAt;
@override final  String returnAt;
@override@JsonKey() final  ViewState loadState;
@override final  SearchResponseModel? response;
@override@JsonKey() final  Filters filters;
@override@JsonKey() final  ResultsView view;
@override final  String? selectedSlug;
@override final  String? errorMessage;
@override final  String? errorCode;

/// Create a copy of ResultsState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ResultsStateCopyWith<_ResultsState> get copyWith => __$ResultsStateCopyWithImpl<_ResultsState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ResultsState&&(identical(other.airport, airport) || other.airport == airport)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&(identical(other.loadState, loadState) || other.loadState == loadState)&&(identical(other.response, response) || other.response == response)&&(identical(other.filters, filters) || other.filters == filters)&&(identical(other.view, view) || other.view == view)&&(identical(other.selectedSlug, selectedSlug) || other.selectedSlug == selectedSlug)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,airport,arrivalAt,returnAt,loadState,response,filters,view,selectedSlug,errorMessage,errorCode);
}

@override
String toString() {
    return 'ResultsState(airport: $airport, arrivalAt: $arrivalAt, returnAt: $returnAt, loadState: $loadState, response: $response, filters: $filters, view: $view, selectedSlug: $selectedSlug, errorMessage: $errorMessage, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ResultsStateCopyWith<$Res> implements $ResultsStateCopyWith<$Res> {
  factory _$ResultsStateCopyWith(_ResultsState value, $Res Function(_ResultsState) _then) = __$ResultsStateCopyWithImpl;
@override @useResult
$Res call({
 String airport, String arrivalAt, String returnAt, ViewState loadState, SearchResponseModel? response, Filters filters, ResultsView view, String? selectedSlug, String? errorMessage, String? errorCode
});


@override $SearchResponseModelCopyWith<$Res>? get response;

}
/// @nodoc
class __$ResultsStateCopyWithImpl<$Res>
    implements _$ResultsStateCopyWith<$Res> {
  __$ResultsStateCopyWithImpl(this._self, this._then);

  final _ResultsState _self;
  final $Res Function(_ResultsState) _then;

/// Create a copy of ResultsState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? airport = null,Object? arrivalAt = null,Object? returnAt = null,Object? loadState = null,Object? response = freezed,Object? filters = null,Object? view = null,Object? selectedSlug = freezed,Object? errorMessage = freezed,Object? errorCode = freezed,}) {
  return _then(_ResultsState(
airport: null == airport ? _self.airport : airport // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,response: freezed == response ? _self.response : response // ignore: cast_nullable_to_non_nullable
as SearchResponseModel?,filters: null == filters ? _self.filters : filters // ignore: cast_nullable_to_non_nullable
as Filters,view: null == view ? _self.view : view // ignore: cast_nullable_to_non_nullable
as ResultsView,selectedSlug: freezed == selectedSlug ? _self.selectedSlug : selectedSlug // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ResultsState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SearchResponseModelCopyWith<$Res>? get response {
    if (_self.response == null) {
    return null;
  }

  return $SearchResponseModelCopyWith<$Res>(_self.response!, (value) {
    return _then(_self.copyWith(response: value));
  });
}
}

// dart format on
