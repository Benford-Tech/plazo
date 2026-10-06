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
 int get submitted;/// The parkings of the current stay, for the home's map and featured card (T-A).
 ViewState get previewState; SearchResponseModel? get preview; DateTime? get previewAt;/// K-A: the live layer (shuttles on the road), null until the first answer.
 AirportLiveModel? get live; DateTime? get liveAt;/// I-C: the heading of each moving shuttle, from its previous position (trip id → degrees).
 Map<String, double> get headings;/// K-A: the parking the traveller tapped on the map; null: the cheapest one.
 String? get selectedSlug;
/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchStateCopyWith<SearchState> get copyWith => _$SearchStateCopyWithImpl<SearchState>(this as SearchState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as SearchState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchState&&(identical(other.loadState, _this.loadState) || other.loadState == _this.loadState)&&const DeepCollectionEquality().equals(other.airports, _this.airports)&&(identical(other.airportSlug, _this.airportSlug) || other.airportSlug == _this.airportSlug)&&(identical(other.arrivalAt, _this.arrivalAt) || other.arrivalAt == _this.arrivalAt)&&(identical(other.returnAt, _this.returnAt) || other.returnAt == _this.returnAt)&&const DeepCollectionEquality().equals(other.errors, _this.errors)&&(identical(other.submitted, _this.submitted) || other.submitted == _this.submitted)&&(identical(other.previewState, _this.previewState) || other.previewState == _this.previewState)&&(identical(other.preview, _this.preview) || other.preview == _this.preview)&&(identical(other.previewAt, _this.previewAt) || other.previewAt == _this.previewAt)&&(identical(other.live, _this.live) || other.live == _this.live)&&(identical(other.liveAt, _this.liveAt) || other.liveAt == _this.liveAt)&&const DeepCollectionEquality().equals(other.headings, _this.headings)&&(identical(other.selectedSlug, _this.selectedSlug) || other.selectedSlug == _this.selectedSlug));
}


@override
int get hashCode {
  final _this = this as SearchState;
  return Object.hash(runtimeType,_this.loadState,const DeepCollectionEquality().hash(_this.airports),_this.airportSlug,_this.arrivalAt,_this.returnAt,const DeepCollectionEquality().hash(_this.errors),_this.submitted,_this.previewState,_this.preview,_this.previewAt,_this.live,_this.liveAt,const DeepCollectionEquality().hash(_this.headings),_this.selectedSlug);
}

@override
String toString() {
  final _this = this as SearchState;
  return 'SearchState(loadState: ${_this.loadState}, airports: ${_this.airports}, airportSlug: ${_this.airportSlug}, arrivalAt: ${_this.arrivalAt}, returnAt: ${_this.returnAt}, errors: ${_this.errors}, submitted: ${_this.submitted}, previewState: ${_this.previewState}, preview: ${_this.preview}, previewAt: ${_this.previewAt}, live: ${_this.live}, liveAt: ${_this.liveAt}, headings: ${_this.headings}, selectedSlug: ${_this.selectedSlug})';
}


}

/// @nodoc
abstract mixin class $SearchStateCopyWith<$Res>  {
  factory $SearchStateCopyWith(SearchState value, $Res Function(SearchState) _then) = _$SearchStateCopyWithImpl;
@useResult
$Res call({
 ViewState loadState, List<AirportModel> airports, String airportSlug, String arrivalAt, String returnAt, Map<String, String> errors, int submitted, ViewState previewState, SearchResponseModel? preview, DateTime? previewAt, AirportLiveModel? live, DateTime? liveAt, Map<String, double> headings, String? selectedSlug
});


$SearchResponseModelCopyWith<$Res>? get preview;$AirportLiveModelCopyWith<$Res>? get live;

}
/// @nodoc
class _$SearchStateCopyWithImpl<$Res>
    implements $SearchStateCopyWith<$Res> {
  _$SearchStateCopyWithImpl(this._self, this._then);

  final SearchState _self;
  final $Res Function(SearchState) _then;

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? loadState = null,Object? airports = null,Object? airportSlug = null,Object? arrivalAt = null,Object? returnAt = null,Object? errors = null,Object? submitted = null,Object? previewState = null,Object? preview = freezed,Object? previewAt = freezed,Object? live = freezed,Object? liveAt = freezed,Object? headings = null,Object? selectedSlug = freezed,}) {
  return _then(SearchState(
loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,airports: null == airports ? _self.airports : airports // ignore: cast_nullable_to_non_nullable
as List<AirportModel>,airportSlug: null == airportSlug ? _self.airportSlug : airportSlug // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,errors: null == errors ? _self.errors : errors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,submitted: null == submitted ? _self.submitted : submitted // ignore: cast_nullable_to_non_nullable
as int,previewState: null == previewState ? _self.previewState : previewState // ignore: cast_nullable_to_non_nullable
as ViewState,preview: freezed == preview ? _self.preview : preview // ignore: cast_nullable_to_non_nullable
as SearchResponseModel?,previewAt: freezed == previewAt ? _self.previewAt : previewAt // ignore: cast_nullable_to_non_nullable
as DateTime?,live: freezed == live ? _self.live : live // ignore: cast_nullable_to_non_nullable
as AirportLiveModel?,liveAt: freezed == liveAt ? _self.liveAt : liveAt // ignore: cast_nullable_to_non_nullable
as DateTime?,headings: null == headings ? _self.headings : headings // ignore: cast_nullable_to_non_nullable
as Map<String, double>,selectedSlug: freezed == selectedSlug ? _self.selectedSlug : selectedSlug // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SearchResponseModelCopyWith<$Res>? get preview {
    if (_self.preview == null) {
    return null;
  }

  return $SearchResponseModelCopyWith<$Res>(_self.preview!, (value) {
    return _then(_self.copyWith(preview: value));
  });
}/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AirportLiveModelCopyWith<$Res>? get live {
    if (_self.live == null) {
    return null;
  }

  return $AirportLiveModelCopyWith<$Res>(_self.live!, (value) {
    return _then(_self.copyWith(live: value));
  });
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState loadState,  List<AirportModel> airports,  String airportSlug,  String arrivalAt,  String returnAt,  Map<String, String> errors,  int submitted,  ViewState previewState,  SearchResponseModel? preview,  DateTime? previewAt,  AirportLiveModel? live,  DateTime? liveAt,  Map<String, double> headings,  String? selectedSlug)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchState() when $default != null:
return $default(_that.loadState,_that.airports,_that.airportSlug,_that.arrivalAt,_that.returnAt,_that.errors,_that.submitted,_that.previewState,_that.preview,_that.previewAt,_that.live,_that.liveAt,_that.headings,_that.selectedSlug);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState loadState,  List<AirportModel> airports,  String airportSlug,  String arrivalAt,  String returnAt,  Map<String, String> errors,  int submitted,  ViewState previewState,  SearchResponseModel? preview,  DateTime? previewAt,  AirportLiveModel? live,  DateTime? liveAt,  Map<String, double> headings,  String? selectedSlug)  $default,) {final _that = this;
switch (_that) {
case _SearchState():
return $default(_that.loadState,_that.airports,_that.airportSlug,_that.arrivalAt,_that.returnAt,_that.errors,_that.submitted,_that.previewState,_that.preview,_that.previewAt,_that.live,_that.liveAt,_that.headings,_that.selectedSlug);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState loadState,  List<AirportModel> airports,  String airportSlug,  String arrivalAt,  String returnAt,  Map<String, String> errors,  int submitted,  ViewState previewState,  SearchResponseModel? preview,  DateTime? previewAt,  AirportLiveModel? live,  DateTime? liveAt,  Map<String, double> headings,  String? selectedSlug)?  $default,) {final _that = this;
switch (_that) {
case _SearchState() when $default != null:
return $default(_that.loadState,_that.airports,_that.airportSlug,_that.arrivalAt,_that.returnAt,_that.errors,_that.submitted,_that.previewState,_that.preview,_that.previewAt,_that.live,_that.liveAt,_that.headings,_that.selectedSlug);case _:
  return null;

}
}

}

/// @nodoc


class _SearchState extends SearchState {
  const _SearchState({this.loadState = ViewState.idle,  List<AirportModel> airports = const <AirportModel>[], required this.airportSlug, required this.arrivalAt, required this.returnAt,  Map<String, String> errors = const <String, String>{}, this.submitted = 0, this.previewState = ViewState.idle, this.preview, this.previewAt, this.live, this.liveAt,  Map<String, double> headings = const <String, double>{}, this.selectedSlug}): _airports = airports,_errors = errors,_headings = headings,super._();
  

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
/// The parkings of the current stay, for the home's map and featured card (T-A).
@override@JsonKey() final  ViewState previewState;
@override final  SearchResponseModel? preview;
@override final  DateTime? previewAt;
/// K-A: the live layer (shuttles on the road), null until the first answer.
@override final  AirportLiveModel? live;
@override final  DateTime? liveAt;
/// I-C: the heading of each moving shuttle, from its previous position (trip id → degrees).
 final  Map<String, double> _headings;
/// I-C: the heading of each moving shuttle, from its previous position (trip id → degrees).
@override@JsonKey() Map<String, double> get headings {
  if (_headings is EqualUnmodifiableMapView) return _headings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_headings);
}

/// K-A: the parking the traveller tapped on the map; null: the cheapest one.
@override final  String? selectedSlug;

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchStateCopyWith<_SearchState> get copyWith => __$SearchStateCopyWithImpl<_SearchState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchState&&(identical(other.loadState, loadState) || other.loadState == loadState)&&const DeepCollectionEquality().equals(other.airports, _airports)&&(identical(other.airportSlug, airportSlug) || other.airportSlug == airportSlug)&&(identical(other.arrivalAt, arrivalAt) || other.arrivalAt == arrivalAt)&&(identical(other.returnAt, returnAt) || other.returnAt == returnAt)&&const DeepCollectionEquality().equals(other.errors, _errors)&&(identical(other.submitted, submitted) || other.submitted == submitted)&&(identical(other.previewState, previewState) || other.previewState == previewState)&&(identical(other.preview, preview) || other.preview == preview)&&(identical(other.previewAt, previewAt) || other.previewAt == previewAt)&&(identical(other.live, live) || other.live == live)&&(identical(other.liveAt, liveAt) || other.liveAt == liveAt)&&const DeepCollectionEquality().equals(other.headings, _headings)&&(identical(other.selectedSlug, selectedSlug) || other.selectedSlug == selectedSlug));
}


@override
int get hashCode {
    return Object.hash(runtimeType,loadState,const DeepCollectionEquality().hash(_airports),airportSlug,arrivalAt,returnAt,const DeepCollectionEquality().hash(_errors),submitted,previewState,preview,previewAt,live,liveAt,const DeepCollectionEquality().hash(_headings),selectedSlug);
}

@override
String toString() {
    return 'SearchState(loadState: $loadState, airports: $airports, airportSlug: $airportSlug, arrivalAt: $arrivalAt, returnAt: $returnAt, errors: $errors, submitted: $submitted, previewState: $previewState, preview: $preview, previewAt: $previewAt, live: $live, liveAt: $liveAt, headings: $headings, selectedSlug: $selectedSlug)';
}


}

/// @nodoc
abstract mixin class _$SearchStateCopyWith<$Res> implements $SearchStateCopyWith<$Res> {
  factory _$SearchStateCopyWith(_SearchState value, $Res Function(_SearchState) _then) = __$SearchStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState loadState, List<AirportModel> airports, String airportSlug, String arrivalAt, String returnAt, Map<String, String> errors, int submitted, ViewState previewState, SearchResponseModel? preview, DateTime? previewAt, AirportLiveModel? live, DateTime? liveAt, Map<String, double> headings, String? selectedSlug
});


@override $SearchResponseModelCopyWith<$Res>? get preview;@override $AirportLiveModelCopyWith<$Res>? get live;

}
/// @nodoc
class __$SearchStateCopyWithImpl<$Res>
    implements _$SearchStateCopyWith<$Res> {
  __$SearchStateCopyWithImpl(this._self, this._then);

  final _SearchState _self;
  final $Res Function(_SearchState) _then;

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? loadState = null,Object? airports = null,Object? airportSlug = null,Object? arrivalAt = null,Object? returnAt = null,Object? errors = null,Object? submitted = null,Object? previewState = null,Object? preview = freezed,Object? previewAt = freezed,Object? live = freezed,Object? liveAt = freezed,Object? headings = null,Object? selectedSlug = freezed,}) {
  return _then(_SearchState(
loadState: null == loadState ? _self.loadState : loadState // ignore: cast_nullable_to_non_nullable
as ViewState,airports: null == airports ? _self._airports : airports // ignore: cast_nullable_to_non_nullable
as List<AirportModel>,airportSlug: null == airportSlug ? _self.airportSlug : airportSlug // ignore: cast_nullable_to_non_nullable
as String,arrivalAt: null == arrivalAt ? _self.arrivalAt : arrivalAt // ignore: cast_nullable_to_non_nullable
as String,returnAt: null == returnAt ? _self.returnAt : returnAt // ignore: cast_nullable_to_non_nullable
as String,errors: null == errors ? _self._errors : errors // ignore: cast_nullable_to_non_nullable
as Map<String, String>,submitted: null == submitted ? _self.submitted : submitted // ignore: cast_nullable_to_non_nullable
as int,previewState: null == previewState ? _self.previewState : previewState // ignore: cast_nullable_to_non_nullable
as ViewState,preview: freezed == preview ? _self.preview : preview // ignore: cast_nullable_to_non_nullable
as SearchResponseModel?,previewAt: freezed == previewAt ? _self.previewAt : previewAt // ignore: cast_nullable_to_non_nullable
as DateTime?,live: freezed == live ? _self.live : live // ignore: cast_nullable_to_non_nullable
as AirportLiveModel?,liveAt: freezed == liveAt ? _self.liveAt : liveAt // ignore: cast_nullable_to_non_nullable
as DateTime?,headings: null == headings ? _self._headings : headings // ignore: cast_nullable_to_non_nullable
as Map<String, double>,selectedSlug: freezed == selectedSlug ? _self.selectedSlug : selectedSlug // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SearchResponseModelCopyWith<$Res>? get preview {
    if (_self.preview == null) {
    return null;
  }

  return $SearchResponseModelCopyWith<$Res>(_self.preview!, (value) {
    return _then(_self.copyWith(preview: value));
  });
}/// Create a copy of SearchState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AirportLiveModelCopyWith<$Res>? get live {
    if (_self.live == null) {
    return null;
  }

  return $AirportLiveModelCopyWith<$Res>(_self.live!, (value) {
    return _then(_self.copyWith(live: value));
  });
}
}

// dart format on
