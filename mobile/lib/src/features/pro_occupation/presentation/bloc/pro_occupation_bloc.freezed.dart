// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_occupation_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProOccupationState {

 ViewState get viewState; ViewState get actionState; ParkingSummaryModel? get parking; OccupationBoardModel? get board; String get query; List<OccupantModel> get results; bool get searching;/// The vehicle whose card is open (from the search or the arrivals).
 OccupantModel? get vehicle;/// A placement just happened: "GA-124-RB placé en A-05-10".
 String? get notice; String? get errorCode;
/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProOccupationStateCopyWith<ProOccupationState> get copyWith => _$ProOccupationStateCopyWithImpl<ProOccupationState>(this as ProOccupationState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProOccupationState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProOccupationState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.actionState, _this.actionState) || other.actionState == _this.actionState)&&(identical(other.parking, _this.parking) || other.parking == _this.parking)&&(identical(other.board, _this.board) || other.board == _this.board)&&(identical(other.query, _this.query) || other.query == _this.query)&&const DeepCollectionEquality().equals(other.results, _this.results)&&(identical(other.searching, _this.searching) || other.searching == _this.searching)&&(identical(other.vehicle, _this.vehicle) || other.vehicle == _this.vehicle)&&(identical(other.notice, _this.notice) || other.notice == _this.notice)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ProOccupationState;
  return Object.hash(runtimeType,_this.viewState,_this.actionState,_this.parking,_this.board,_this.query,const DeepCollectionEquality().hash(_this.results),_this.searching,_this.vehicle,_this.notice,_this.errorCode);
}

@override
String toString() {
  final _this = this as ProOccupationState;
  return 'ProOccupationState(viewState: ${_this.viewState}, actionState: ${_this.actionState}, parking: ${_this.parking}, board: ${_this.board}, query: ${_this.query}, results: ${_this.results}, searching: ${_this.searching}, vehicle: ${_this.vehicle}, notice: ${_this.notice}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ProOccupationStateCopyWith<$Res>  {
  factory $ProOccupationStateCopyWith(ProOccupationState value, $Res Function(ProOccupationState) _then) = _$ProOccupationStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, ViewState actionState, ParkingSummaryModel? parking, OccupationBoardModel? board, String query, List<OccupantModel> results, bool searching, OccupantModel? vehicle, String? notice, String? errorCode
});


$ParkingSummaryModelCopyWith<$Res>? get parking;$OccupationBoardModelCopyWith<$Res>? get board;$OccupantModelCopyWith<$Res>? get vehicle;

}
/// @nodoc
class _$ProOccupationStateCopyWithImpl<$Res>
    implements $ProOccupationStateCopyWith<$Res> {
  _$ProOccupationStateCopyWithImpl(this._self, this._then);

  final ProOccupationState _self;
  final $Res Function(ProOccupationState) _then;

/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? actionState = null,Object? parking = freezed,Object? board = freezed,Object? query = null,Object? results = null,Object? searching = null,Object? vehicle = freezed,Object? notice = freezed,Object? errorCode = freezed,}) {
  return _then(ProOccupationState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSummaryModel?,board: freezed == board ? _self.board : board // ignore: cast_nullable_to_non_nullable
as OccupationBoardModel?,query: null == query ? _self.query : query // ignore: cast_nullable_to_non_nullable
as String,results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,searching: null == searching ? _self.searching : searching // ignore: cast_nullable_to_non_nullable
as bool,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as OccupantModel?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of ProOccupationState
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
}/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupationBoardModelCopyWith<$Res>? get board {
    if (_self.board == null) {
    return null;
  }

  return $OccupationBoardModelCopyWith<$Res>(_self.board!, (value) {
    return _then(_self.copyWith(board: value));
  });
}/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<$Res>? get vehicle {
    if (_self.vehicle == null) {
    return null;
  }

  return $OccupantModelCopyWith<$Res>(_self.vehicle!, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProOccupationState].
extension ProOccupationStatePatterns on ProOccupationState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProOccupationState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProOccupationState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProOccupationState value)  $default,){
final _that = this;
switch (_that) {
case _ProOccupationState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProOccupationState value)?  $default,){
final _that = this;
switch (_that) {
case _ProOccupationState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ParkingSummaryModel? parking,  OccupationBoardModel? board,  String query,  List<OccupantModel> results,  bool searching,  OccupantModel? vehicle,  String? notice,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProOccupationState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.parking,_that.board,_that.query,_that.results,_that.searching,_that.vehicle,_that.notice,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  ViewState actionState,  ParkingSummaryModel? parking,  OccupationBoardModel? board,  String query,  List<OccupantModel> results,  bool searching,  OccupantModel? vehicle,  String? notice,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ProOccupationState():
return $default(_that.viewState,_that.actionState,_that.parking,_that.board,_that.query,_that.results,_that.searching,_that.vehicle,_that.notice,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  ViewState actionState,  ParkingSummaryModel? parking,  OccupationBoardModel? board,  String query,  List<OccupantModel> results,  bool searching,  OccupantModel? vehicle,  String? notice,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ProOccupationState() when $default != null:
return $default(_that.viewState,_that.actionState,_that.parking,_that.board,_that.query,_that.results,_that.searching,_that.vehicle,_that.notice,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ProOccupationState extends ProOccupationState {
  const _ProOccupationState({this.viewState = ViewState.idle, this.actionState = ViewState.idle, this.parking, this.board, this.query = '',  List<OccupantModel> results = const [], this.searching = false, this.vehicle, this.notice, this.errorCode}): _results = results,super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  ViewState actionState;
@override final  ParkingSummaryModel? parking;
@override final  OccupationBoardModel? board;
@override@JsonKey() final  String query;
 final  List<OccupantModel> _results;
@override@JsonKey() List<OccupantModel> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}

@override@JsonKey() final  bool searching;
/// The vehicle whose card is open (from the search or the arrivals).
@override final  OccupantModel? vehicle;
/// A placement just happened: "GA-124-RB placé en A-05-10".
@override final  String? notice;
@override final  String? errorCode;

/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProOccupationStateCopyWith<_ProOccupationState> get copyWith => __$ProOccupationStateCopyWithImpl<_ProOccupationState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProOccupationState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.actionState, actionState) || other.actionState == actionState)&&(identical(other.parking, parking) || other.parking == parking)&&(identical(other.board, board) || other.board == board)&&(identical(other.query, query) || other.query == query)&&const DeepCollectionEquality().equals(other.results, _results)&&(identical(other.searching, searching) || other.searching == searching)&&(identical(other.vehicle, vehicle) || other.vehicle == vehicle)&&(identical(other.notice, notice) || other.notice == notice)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,actionState,parking,board,query,const DeepCollectionEquality().hash(_results),searching,vehicle,notice,errorCode);
}

@override
String toString() {
    return 'ProOccupationState(viewState: $viewState, actionState: $actionState, parking: $parking, board: $board, query: $query, results: $results, searching: $searching, vehicle: $vehicle, notice: $notice, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ProOccupationStateCopyWith<$Res> implements $ProOccupationStateCopyWith<$Res> {
  factory _$ProOccupationStateCopyWith(_ProOccupationState value, $Res Function(_ProOccupationState) _then) = __$ProOccupationStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, ViewState actionState, ParkingSummaryModel? parking, OccupationBoardModel? board, String query, List<OccupantModel> results, bool searching, OccupantModel? vehicle, String? notice, String? errorCode
});


@override $ParkingSummaryModelCopyWith<$Res>? get parking;@override $OccupationBoardModelCopyWith<$Res>? get board;@override $OccupantModelCopyWith<$Res>? get vehicle;

}
/// @nodoc
class __$ProOccupationStateCopyWithImpl<$Res>
    implements _$ProOccupationStateCopyWith<$Res> {
  __$ProOccupationStateCopyWithImpl(this._self, this._then);

  final _ProOccupationState _self;
  final $Res Function(_ProOccupationState) _then;

/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? actionState = null,Object? parking = freezed,Object? board = freezed,Object? query = null,Object? results = null,Object? searching = null,Object? vehicle = freezed,Object? notice = freezed,Object? errorCode = freezed,}) {
  return _then(_ProOccupationState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,actionState: null == actionState ? _self.actionState : actionState // ignore: cast_nullable_to_non_nullable
as ViewState,parking: freezed == parking ? _self.parking : parking // ignore: cast_nullable_to_non_nullable
as ParkingSummaryModel?,board: freezed == board ? _self.board : board // ignore: cast_nullable_to_non_nullable
as OccupationBoardModel?,query: null == query ? _self.query : query // ignore: cast_nullable_to_non_nullable
as String,results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<OccupantModel>,searching: null == searching ? _self.searching : searching // ignore: cast_nullable_to_non_nullable
as bool,vehicle: freezed == vehicle ? _self.vehicle : vehicle // ignore: cast_nullable_to_non_nullable
as OccupantModel?,notice: freezed == notice ? _self.notice : notice // ignore: cast_nullable_to_non_nullable
as String?,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of ProOccupationState
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
}/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupationBoardModelCopyWith<$Res>? get board {
    if (_self.board == null) {
    return null;
  }

  return $OccupationBoardModelCopyWith<$Res>(_self.board!, (value) {
    return _then(_self.copyWith(board: value));
  });
}/// Create a copy of ProOccupationState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OccupantModelCopyWith<$Res>? get vehicle {
    if (_self.vehicle == null) {
    return null;
  }

  return $OccupantModelCopyWith<$Res>(_self.vehicle!, (value) {
    return _then(_self.copyWith(vehicle: value));
  });
}
}

// dart format on
