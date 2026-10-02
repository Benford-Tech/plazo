// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'search_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$SearchState {

 ViewState get loadState; List<AirportModel> get airports; String get airportSlug; String get arrivalAt; String get returnAt;/// API codes per field ("arrival_in_past"…), from the last "Rechercher".
 Map<String, String> get errors;/// Incremented by each valid "Rechercher": the page navigates when it changes.
 int get submitted;
/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchStateCopyWith<SearchState> get copyWith => _$SearchStateCopyWithImpl<SearchState>(this as SearchState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as SearchState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchState&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&const DeepCollectionEquality().equals(other.airports, _this.airports)&&(identical(other.airportSlug, _this.airportSlug) || other.airportSlug == _this.airportSlug)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&const DeepCollectionEquality().equals(other.errors, _this.errors)&&(identical(other.submitted, _this.submitted) || other.submitted == _this.submitted));
}


@override
int get hashCode {
  final _this = this as SearchState;
  return Object.hash(runtimeType,_this.loadState,const DeepCollectionEquality().hash(_this.airports),_this.airportSlug,_this.arrivalAt,_this.returnAt,const DeepCollectionEquality().hash(_this.errors),_this.submitted);
}

@override
String toString() {
  final _this = this as SearchState;
  return 'SearchState(loadState: ${_this.loadState}, airports: ${_this.airports}, airportSlug: ${_this.airportSlug}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, errors: ${_this.errors}, submitted: ${_this.submitted})';
}


}

/// @nodoc
abstract mixin class $SearchStateCopyWith<$Res>  {
  factory $SearchStateCopyWith(SearchState value, $Res Function(SearchState) _then) = _$SearchStateCopyWithImpl;
@useResult
$Res call({
 ViewState loadState, List<AirportModel> airports, String airportSlug, String arrivalAt, String returnAt, Map<String, String> errors, int submitted
});




}
/// @nodoc
class _$SearchStateCopyWithImpl<$Res>
    implements $SearchStateCopyWith<$Res> {
  _$SearchStateCopyWithImpl(this._self, this._then);

  final SearchState _self;
  final $Res Function(SearchState) _then;

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? loadState = null,Object? airports = null,Object? airportSlug = null,Object? arrivalAt = null,Object? returnAt = null,Object? errors = null,Object? submitted = null,}) {
  return _then(SearchState(
loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,airports: null == airports ? _self.airports : airports // ignore: cast_nullable_to_non_nullable
as List<AirportModel>,airportSlug: null == airportSlug ? _self.airportSlug : airportSlug // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,errors: null == errors ? _self.errors : errors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,submitted: null == submitted ? _self.submitted : submitted // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [SearchState].
extension SearchStatePatterns on SearchState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SearchState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SearchState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SearchState value)  $default,){
final _that = this;
switch (_that) {
case _SearchState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SearchState value)?  $default,){
final _that = this;
switch (_that) {
case _SearchState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState loadState,  List<AirportModel> airports,  String airportSlug,  String arrivalAt,  String returnAt,  Map<String, String> errors,  int submitted)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchState() when $default != null:
return $default(_that.loadState,_that.airports,_that.airportSlug,_that.arrivalAt,_that.returnAt,_that.errors,_that.submitted);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState loadState,  List<AirportModel> airports,  String airportSlug,  String arrivalAt,  String returnAt,  Map<String, String> errors,  int submitted)  $default,) {final _that = this;
switch (_that) {
case _SearchState():
return $default(_that.loadState,_that.airports,_that.airportSlug,_that.arrivalAt,_that.returnAt,_that.errors,_that.submitted);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState loadState,  List<AirportModel> airports,  String airportSlug,  String arrivalAt,  String returnAt,  Map<String, String> errors,  int submitted)?  $default,) {final _that = this;
switch (_that) {
case _SearchState() when $default != null:
return $default(_that.loadState,_that.airports,_that.airportSlug,_that.arrivalAt,_that.returnAt,_that.errors,_that.submitted);case _:
  return null;

}
}

}

/// @nodoc


class _SearchState extends SearchState {
  const _SearchState({this.loadState = ViewState.idle,  List<AirportModel> airports = const <AirportModel>[], required this.airportSlug, required this.arrivalAt, required this.returnAt,  Map<String, String> errors = const <String, String>{}, this.submitted = 0}): _airports = airports,_errors = errors,super._();
  

@override@JsonKey() final  ViewState loadState;
 final  List<AirportModel> _airports;
@override@JsonKey() List<AirportModel> get airports {
  if (_airports is EqualUnmodifiableListView) return _airports;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_airports);
}

@override final  String airportSlug;
@override final  String arrivalAt;
@override final  String returnAt;
/// API codes per field ("arrival_in_past"…), from the last "Rechercher".
 final  Map<String, String> _errors;
/// API codes per field ("arrival_in_past"…), from the last "Rechercher".
@override@JsonKey() Map<String, String> get errors {
  if (_errors is EqualUnmodifiableMapView) return _errors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_errors);
}

/// Incremented by each valid "Rechercher": the page navigates when it changes.
@override@JsonKey() final  int submitted;

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchStateCopyWith<_SearchState> get copyWith => __$SearchStateCopyWithImpl<_SearchState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchState&&(identical(other.loadState, loadState) || other.loadState == loadState)&&const DeepCollectionEquality().equals(other.airports, _airports)&&(identical(other.airportSlug, airportSlug) || other.airportSlug == airportSlug)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&const DeepCollectionEquality().equals(other.errors, _errors)&&(identical(other.submitted, submitted) || other.submitted == submitted));
}


@override
int get hashCode {
    return Object.hash(runtimeType,loadState,const DeepCollectionEquality().hash(_airports),airportSlug,arrivalAt,returnAt,const DeepCollectionEquality().hash(_errors),submitted);
}

@override
String toString() {
    return 'SearchState(loadState: $loadState, airports: $airports, airportSlug: $airportSlug, arrivalAt: $arrivalAt, returnAt: $returnAt, errors: $errors, submitted: $submitted)';
}


}

/// @nodoc
abstract mixin class _$SearchStateCopyWith<$Res> implements $SearchStateCopyWith<$Res> {
  factory _$SearchStateCopyWith(_SearchState value, $Res Function(_SearchState) _then) = __$SearchStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState loadState, List<AirportModel> airports, String airportSlug, String arrivalAt, String returnAt, Map<String, String> errors, int submitted
});




}
/// @nodoc
class __$SearchStateCopyWithImpl<$Res>
    implements _$SearchStateCopyWith<$Res> {
  __$SearchStateCopyWithImpl(this._self, this._then);

  final _SearchState _self;
  final $Res Function(_SearchState) _then;

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? loadState = null,Object? airports = null,Object? airportSlug = null,Object? arrivalAt = null,Object? returnAt = null,Object? errors = null,Object? submitted = null,}) {
  return _then(_SearchState(
loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,airports: null == airports ? _self._airports : airports // ignore: cast_nullable_to_non_nullable
as List<AirportModel>,airportSlug: null == airportSlug ? _self.airportSlug : airportSlug // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,errors: null == errors ? _self._errors : errors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,submitted: null == submitted ? _self.submitted : submitted // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
