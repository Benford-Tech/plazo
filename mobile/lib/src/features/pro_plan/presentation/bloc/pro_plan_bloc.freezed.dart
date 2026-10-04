// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_plan_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProPlanState {

 ViewState get viewState; ViewState get actionState; PlanStep get step; ParkingSummaryModel? get parking; ParkingPlanViewModel? get view;/// Where the map looks: the address, the phone, or the saved outline.
 LatLng? get center; List<GeocodeResultModel> get results; bool get searching; LocationAccess? get locationProblem;/// The corners being drawn (open ring, in order).
 List<LatLng> get corners; PlanEstimateModel? get estimate; String get layout;/// The last generation applied the capacity.
 bool get generated; String? get errorCode;
/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProPlanStateCopyWith<ProPlanState> get copyWith => _$ProPlanStateCopyWithImpl<ProPlanState>(this as ProPlanState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProPlanState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProPlanState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.step, _this.step) || other.step == _this.step)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.view, _this.view) || other.view == _this.view)&&(identical(other.center, _this.center) || other.center == _this.center)&&const DeepCollectionEquality().equals(other.results, _this.results)&&(identical(other.searching, _this.searching) || other.searching == _this.searching)&&(identical(other.locationProblem, _this.locationProblem) || other.locationProblem == _this.locationProblem)&&const DeepCollectionEquality().equals(other.corners, _this.corners)&&(identical(other.estimate, _this.estimate) || other.estimate == _this.estimate)&&(identical(other.layout, _this.layout) || other.layout == _this.layout)&&(identical(other.generated, _this.generated) || other.generated == _this.generated)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ProPlanState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.step,_this.parking,_this.view,_this.center,const DeepCollectionEquality().hash(_this.results),_this.searching,_this.locationProblem,const DeepCollectionEquality().hash(_this.corners),_this.estimate,_this.layout,_this.generated,_this.errorCode);
}

@override
String toString() {
  final _this = this as ProPlanState;
  return 'ProPlanState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, step: ${_this.step}, parking: ${_this.parking}, view: ${_this.view}, center: ${_this.center}, results: ${_this.results}, searching: ${_this.searching}, locationProblem: ${_this.locationProblem}, corners: ${_this.corners}, estimate: ${_this.estimate}, layout: ${_this.layout}, generated: ${_this.generated}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ProPlanStateCopyWith<$Res>  {
  factory $ProPlanStateCopyWith(ProPlanState value, $Res Function(ProPlanState) _then) = _$ProPlanStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, PlanStep step, ParkingSummaryModel? parking, ParkingPlanViewModel? view, LatLng? center, List<GeocodeResultModel> results, bool searching, LocationAccess? locationProblem, List<LatLng> corners, PlanEstimateModel? estimate, String layout, bool generated, String? errorCode
});


$ParkingSummaryModelCopyWith<$Res>? get parking;$ParkingPlanViewModelCopyWith<$Res>? get view;$PlanEstimateModelCopyWith<$Res>? get estimate;

}
/// @nodoc
class _$ProPlanStateCopyWithImpl<$Res>
    implements $ProPlanStateCopyWith<$Res> {
  _$ProPlanStateCopyWithImpl(this._self, this._then);

  final ProPlanState _self;
  final $Res Function(ProPlanState) _then;

/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? step = null,Object? parking = freezed,Object? view = freezed,Object? center = freezed,Object? results = null,Object? searching = null,Object? locationProblem = freezed,Object? corners = null,Object? estimate = freezed,Object? layout = null,Object? generated = null,Object? errorCode = freezed,}) {
  return _then(ProPlanState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,step: null == step ? _self.step : step // ignore: cast_nullable_to_non_nullable
as PlanStep,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSummaryModel?,view: freezed == view ? _self.view : view // ignore: cast_nullable_to_non_nullable
as ParkingPlanViewModel?,center: freezed == center ? _self.center : center // ignore: cast_nullable_to_non_nullable
as LatLng?,results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<GeocodeResultModel>,searching: null == searching ? _self.searching : searching // ignore: cast_nullable_to_non_nullable
as bool,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,corners: null == corners ? _self.corners : corners // ignore: cast_nullable_to_non_nullable
as List<LatLng>,estimate: freezed == estimate ? _self.estimate : estimate // ignore: cast_nullable_to_non_nullable
as PlanEstimateModel?,layout: null == layout ? _self.layout : layout // ignore: cast_nullable_to_non_nullable
as String,generated: null == generated ? _self.generated : generated // ignore: cast_nullable_to_non_nullable
as bool,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingSummaryModelCopyWith<$Res>? get parking {
    if (_self.parking == null) {
    return null;
  }

  return $ParkingSummaryModelCopyWith<$Res>(_self.parking!, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingPlanViewModelCopyWith<$Res>? get view {
    if (_self.view == null) {
    return null;
  }

  return $ParkingPlanViewModelCopyWith<$Res>(_self.view!, (value) {
    return _then(_self.copyWith(view: value));
  });
}/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PlanEstimateModelCopyWith<$Res>? get estimate {
    if (_self.estimate == null) {
    return null;
  }

  return $PlanEstimateModelCopyWith<$Res>(_self.estimate!, (value) {
    return _then(_self.copyWith(estimate: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProPlanState].
extension ProPlanStatePatterns on ProPlanState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProPlanState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProPlanState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProPlanState value)  $default,){
final _that = this;
switch (_that) {
case _ProPlanState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProPlanState value)?  $default,){
final _that = this;
switch (_that) {
case _ProPlanState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  PlanStep step,  ParkingSummaryModel? parking,  ParkingPlanViewModel? view,  LatLng? center,  List<GeocodeResultModel> results,  bool searching,  LocationAccess? locationProblem,  List<LatLng> corners,  PlanEstimateModel? estimate,  String layout,  bool generated,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProPlanState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.step,_that.parking,_that.view,_that.center,_that.results,_that.searching,_that.locationProblem,_that.corners,_that.estimate,_that.layout,_that.generated,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  PlanStep step,  ParkingSummaryModel? parking,  ParkingPlanViewModel? view,  LatLng? center,  List<GeocodeResultModel> results,  bool searching,  LocationAccess? locationProblem,  List<LatLng> corners,  PlanEstimateModel? estimate,  String layout,  bool generated,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ProPlanState():
return $default(_that.viewState,_that.actionState,_that.step,_that.parking,_that.view,_that.center,_that.results,_that.searching,_that.locationProblem,_that.corners,_that.estimate,_that.layout,_that.generated,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  PlanStep step,  ParkingSummaryModel? parking,  ParkingPlanViewModel? view,  LatLng? center,  List<GeocodeResultModel> results,  bool searching,  LocationAccess? locationProblem,  List<LatLng> corners,  PlanEstimateModel? estimate,  String layout,  bool generated,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ProPlanState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.step,_that.parking,_that.view,_that.center,_that.results,_that.searching,_that.locationProblem,_that.corners,_that.estimate,_that.layout,_that.generated,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ProPlanState extends ProPlanState {
  const _ProPlanState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.step = PlanStep.locate, this.parking, this.view, this.center,  List<GeocodeResultModel> results = const [], this.searching = false, this.locationProblem,  List<LatLng> corners = const [], this.estimate, this.layout = 'valet24', this.generated = false, this.errorCode}): _results = results,_corners = corners,super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override@JsonKey() final  PlanStep step;
@override final  ParkingSummaryModel? parking;
@override final  ParkingPlanViewModel? view;
/// Where the map looks: the address, the phone, or the saved outline.
@override final  LatLng? center;
 final  List<GeocodeResultModel> _results;
@override@JsonKey() List<GeocodeResultModel> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}

@override@JsonKey() final  bool searching;
@override final  LocationAccess? locationProblem;
/// The corners being drawn (open ring, in order).
 final  List<LatLng> _corners;
/// The corners being drawn (open ring, in order).
@override@JsonKey() List<LatLng> get corners {
  if (_corners is EqualUnmodifiableListView) return _corners;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_corners);
}

@override final  PlanEstimateModel? estimate;
@override@JsonKey() final  String layout;
/// The last generation applied the capacity.
@override@JsonKey() final  bool generated;
@override final  String? errorCode;

/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProPlanStateCopyWith<_ProPlanState> get copyWith => __$ProPlanStateCopyWithImpl<_ProPlanState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProPlanState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.step, step) || other.step == step)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.view, view) || other.view == view)&&(identical(other.center, center) || other.center == center)&&const DeepCollectionEquality().equals(other.results, _results)&&(identical(other.searching, searching) || other.searching == searching)&&(identical(other.locationProblem, locationProblem) || other.locationProblem == locationProblem)&&const DeepCollectionEquality().equals(other.corners, _corners)&&(identical(other.estimate, estimate) || other.estimate == estimate)&&(identical(other.layout, layout) || other.layout == layout)&&(identical(other.generated, generated) || other.generated == generated)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,step,parking,view,center,const DeepCollectionEquality().hash(_results),searching,locationProblem,const DeepCollectionEquality().hash(_corners),estimate,layout,generated,errorCode);
}

@override
String toString() {
    return 'ProPlanState(viewState: $viewState, actionState: $actionState, step: $step, parking: $parking, view: $view, center: $center, results: $results, searching: $searching, locationProblem: $locationProblem, corners: $corners, estimate: $estimate, layout: $layout, generated: $generated, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ProPlanStateCopyWith<$Res> implements $ProPlanStateCopyWith<$Res> {
  factory _$ProPlanStateCopyWith(_ProPlanState value, $Res Function(_ProPlanState) _then) = __$ProPlanStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, PlanStep step, ParkingSummaryModel? parking, ParkingPlanViewModel? view, LatLng? center, List<GeocodeResultModel> results, bool searching, LocationAccess? locationProblem, List<LatLng> corners, PlanEstimateModel? estimate, String layout, bool generated, String? errorCode
});


@override $ParkingSummaryModelCopyWith<$Res>? get parking;@override $ParkingPlanViewModelCopyWith<$Res>? get view;@override $PlanEstimateModelCopyWith<$Res>? get estimate;

}
/// @nodoc
class __$ProPlanStateCopyWithImpl<$Res>
    implements _$ProPlanStateCopyWith<$Res> {
  __$ProPlanStateCopyWithImpl(this._self, this._then);

  final _ProPlanState _self;
  final $Res Function(_ProPlanState) _then;

/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? step = null,Object? parking = freezed,Object? view = freezed,Object? center = freezed,Object? results = null,Object? searching = null,Object? locationProblem = freezed,Object? corners = null,Object? estimate = freezed,Object? layout = null,Object? generated = null,Object? errorCode = freezed,}) {
  return _then(_ProPlanState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,step: null == step ? _self.step : step // ignore: cast_nullable_to_non_nullable
as PlanStep,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSummaryModel?,view: freezed == view ? _self.view : view // ignore: cast_nullable_to_non_nullable
as ParkingPlanViewModel?,center: freezed == center ? _self.center : center // ignore: cast_nullable_to_non_nullable
as LatLng?,results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<GeocodeResultModel>,searching: null == searching ? _self.searching : searching // ignore: cast_nullable_to_non_nullable
as bool,locationProblem: freezed == locationProblem ? _self.locationProblem : locationProblem // ignore: cast_nullable_to_non_nullable
as LocationAccess?,corners: null == corners ? _self._corners : corners // ignore: cast_nullable_to_non_nullable
as List<LatLng>,estimate: freezed == estimate ? _self.estimate : estimate // ignore: cast_nullable_to_non_nullable
as PlanEstimateModel?,layout: null == layout ? _self.layout : layout // ignore: cast_nullable_to_non_nullable
as String,generated: null == generated ? _self.generated : generated // ignore: cast_nullable_to_non_nullable
as bool,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingSummaryModelCopyWith<$Res>? get parking {
    if (_self.parking == null) {
    return null;
  }

  return $ParkingSummaryModelCopyWith<$Res>(_self.parking!, (value) {
    return _then(_self.copyWith(parking: value));
  });
}/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ParkingPlanViewModelCopyWith<$Res>? get view {
    if (_self.view == null) {
    return null;
  }

  return $ParkingPlanViewModelCopyWith<$Res>(_self.view!, (value) {
    return _then(_self.copyWith(view: value));
  });
}/// Create a copy of ProPlanState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PlanEstimateModelCopyWith<$Res>? get estimate {
    if (_self.estimate == null) {
    return null;
  }

  return $PlanEstimateModelCopyWith<$Res>(_self.estimate!, (value) {
    return _then(_self.copyWith(estimate: value));
  });
}
}

// dart format on
