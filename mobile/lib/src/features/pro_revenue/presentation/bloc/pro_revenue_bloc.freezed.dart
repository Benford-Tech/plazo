// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_revenue_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProRevenueState {

 ViewState get viewState; RevenueSpan get span;/// A local date inside the period shown.
 String get anchor;/// The parking's today: the phone's until the server says it.
 String get today; String get basis;/// The report of the period shown; null while another period loads.
 RevenueReportModel? get report; String? get errorMessage;/// The manager moved away from the opening period: the server's today no longer re-anchors it.
 bool get moved; Set<String> get saving; Map<String, RevenueRowError> get rowErrors;/// The last amount saved, for « Montant enregistré : … ».
 String? get savedName; int? get savedCents;
/// Create a copy of ProRevenueState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProRevenueStateCopyWith<ProRevenueState> get copyWith => _$ProRevenueStateCopyWithImpl<ProRevenueState>(this as ProRevenueState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProRevenueState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProRevenueState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.span, _this.span) || other.span == _this.span)&&(identical(other.anchor, _this.anchor) || other.anchor == _this.anchor)&&(identical(other.today, _this.today) || other.today == _this.today)&&(identical(other.basis, _this.basis) || other.basis == _this.basis)&&(identical(other.report, _this.report) || other.report == _this.report)&&(identical(other.errorMessage, _this.errorMessage) || other.errorMessage == _this.errorMessage)&&(identical(other.moved, _this.moved) || other.moved == _this.moved)&&const DeepCollectionEquality().equals(other.saving, _this.saving)&&const DeepCollectionEquality().equals(other.rowErrors, _this.rowErrors)&&(identical(other.savedName, _this.savedName) || other.savedName == _this.savedName)&&(identical(other.savedCents, _this.savedCents) || other.savedCents == _this.savedCents));
}


@override
int get hashCode {
  final _this = this as ProRevenueState;
  return Object.hash(runtimeType,_this.viewState,_this.span,_this.anchor,_this.today,_this.basis,_this.report,_this.errorMessage,_this.moved,const DeepCollectionEquality().hash(_this.saving),const DeepCollectionEquality().hash(_this.rowErrors),_this.savedName,_this.savedCents);
}

@override
String toString() {
  final _this = this as ProRevenueState;
  return 'ProRevenueState(viewState: ${_this.viewState}, span: ${_this.span}, anchor: ${_this.anchor}, today: ${_this.today}, basis: ${_this.basis}, report: ${_this.report}, errorMessage: ${_this.errorMessage}, moved: ${_this.moved}, saving: ${_this.saving}, rowErrors: ${_this.rowErrors}, savedName: ${_this.savedName}, savedCents: ${_this.savedCents})';
}


}

/// @nodoc
abstract mixin class $ProRevenueStateCopyWith<$Res>  {
  factory $ProRevenueStateCopyWith(ProRevenueState value, $Res Function(ProRevenueState) _then) = _$ProRevenueStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, RevenueSpan span, String anchor, String today, String basis, RevenueReportModel? report, String? errorMessage, bool moved, Set<String> saving, Map<String, RevenueRowError> rowErrors, String? savedName, int? savedCents
});


$RevenueReportModelCopyWith<$Res>? get report;

}
/// @nodoc
class _$ProRevenueStateCopyWithImpl<$Res>
    implements $ProRevenueStateCopyWith<$Res> {
  _$ProRevenueStateCopyWithImpl(this._self, this._then);

  final ProRevenueState _self;
  final $Res Function(ProRevenueState) _then;

/// Create a copy of ProRevenueState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? span = null,Object? anchor = null,Object? today = null,Object? basis = null,Object? report = freezed,Object? errorMessage = freezed,Object? moved = null,Object? saving = null,Object? rowErrors = null,Object? savedName = freezed,Object? savedCents = freezed,}) {
  return _then(ProRevenueState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,span: null == span ? _self.span : span // ignore: cast_nullable_to_non_nullable
as RevenueSpan,anchor: null == anchor ? _self.anchor : anchor // ignore: cast_nullable_to_non_nullable
as String,today: null == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String,basis: null == basis ? _self.basis : basis // ignore: cast_nullable_to_non_nullable
as String,report: freezed == report ? _self.report : report // ignore: cast_nullable_to_non_nullable
as RevenueReportModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,moved: null == moved ? _self.moved : moved // ignore: cast_nullable_to_non_nullable
as bool,saving: null == saving ? _self.saving : saving // ignore: cast_nullable_to_non_nullable
as Set<String>,rowErrors: null == rowErrors ? _self.rowErrors : rowErrors // ignore: cast_nullable_to_non_nullable
as Map<String, RevenueRowError>,savedName: freezed == savedName ? _self.savedName : savedName // ignore: cast_nullable_to_non_nullable
as String?,savedCents: freezed == savedCents ? _self.savedCents : savedCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}
/// Create a copy of ProRevenueState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RevenueReportModelCopyWith<$Res>? get report {
    if (_self.report == null) {
    return null;
  }

  return $RevenueReportModelCopyWith<$Res>(_self.report!, (value) {
    return _then(_self.copyWith(report: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProRevenueState].
extension ProRevenueStatePatterns on ProRevenueState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProRevenueState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProRevenueState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProRevenueState value)  $default,){
final _that = this;
switch (_that) {
case _ProRevenueState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProRevenueState value)?  $default,){
final _that = this;
switch (_that) {
case _ProRevenueState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  RevenueSpan span,  String anchor,  String today,  String basis,  RevenueReportModel? report,  String? errorMessage,  bool moved,  Set<String> saving,  Map<String, RevenueRowError> rowErrors,  String? savedName,  int? savedCents)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProRevenueState() when $default != null:
return $default(_that.viewState,_that.span,_that.anchor,_that.today,_that.basis,_that.report,_that.errorMessage,_that.moved,_that.saving,_that.rowErrors,_that.savedName,_that.savedCents);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  RevenueSpan span,  String anchor,  String today,  String basis,  RevenueReportModel? report,  String? errorMessage,  bool moved,  Set<String> saving,  Map<String, RevenueRowError> rowErrors,  String? savedName,  int? savedCents)  $default,) {final _that = this;
switch (_that) {
case _ProRevenueState():
return $default(_that.viewState,_that.span,_that.anchor,_that.today,_that.basis,_that.report,_that.errorMessage,_that.moved,_that.saving,_that.rowErrors,_that.savedName,_that.savedCents);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  RevenueSpan span,  String anchor,  String today,  String basis,  RevenueReportModel? report,  String? errorMessage,  bool moved,  Set<String> saving,  Map<String, RevenueRowError> rowErrors,  String? savedName,  int? savedCents)?  $default,) {final _that = this;
switch (_that) {
case _ProRevenueState() when $default != null:
return $default(_that.viewState,_that.span,_that.anchor,_that.today,_that.basis,_that.report,_that.errorMessage,_that.moved,_that.saving,_that.rowErrors,_that.savedName,_that.savedCents);case _:
  return null;

}
}

}

/// @nodoc


class _ProRevenueState extends ProRevenueState {
  const _ProRevenueState({this.viewState = ViewState.idle, this.span = RevenueSpan.month, required this.anchor, required this.today, this.basis = 'arrival', this.report, this.errorMessage, this.moved = false,  Set<String> saving = const <String>{},  Map<String, RevenueRowError> rowErrors = const <String, RevenueRowError>{}, this.savedName, this.savedCents}): _saving = saving,_rowErrors = rowErrors,super._();
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  RevenueSpan span;
/// A local date inside the period shown.
@override final  String anchor;
/// The parking's today: the phone's until the server says it.
@override final  String today;
@override@JsonKey() final  String basis;
/// The report of the period shown; null while another period loads.
@override final  RevenueReportModel? report;
@override final  String? errorMessage;
/// The manager moved away from the opening period: the server's today no longer re-anchors it.
@override@JsonKey() final  bool moved;
 final  Set<String> _saving;
@override@JsonKey() Set<String> get saving {
  if (_saving is EqualUnmodifiableSetView) return _saving;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableSetView(_saving);
}

 final  Map<String, RevenueRowError> _rowErrors;
@override@JsonKey() Map<String, RevenueRowError> get rowErrors {
  if (_rowErrors is EqualUnmodifiableMapView) return _rowErrors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_rowErrors);
}

/// The last amount saved, for « Montant enregistré : … ».
@override final  String? savedName;
@override final  int? savedCents;

/// Create a copy of ProRevenueState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProRevenueStateCopyWith<_ProRevenueState> get copyWith => __$ProRevenueStateCopyWithImpl<_ProRevenueState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProRevenueState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.span, span) || other.span == span)&&(identical(other.anchor, anchor) || other.anchor == anchor)&&(identical(other.today, today) || other.today == today)&&(identical(other.basis, basis) || other.basis == basis)&&(identical(other.report, report) || other.report == report)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.moved, moved) || other.moved == moved)&&const DeepCollectionEquality().equals(other.saving, _saving)&&const DeepCollectionEquality().equals(other.rowErrors, _rowErrors)&&(identical(other.savedName, savedName) || other.savedName == savedName)&&(identical(other.savedCents, savedCents) || other.savedCents == savedCents));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,span,anchor,today,basis,report,errorMessage,moved,const DeepCollectionEquality().hash(_saving),const DeepCollectionEquality().hash(_rowErrors),savedName,savedCents);
}

@override
String toString() {
    return 'ProRevenueState(viewState: $viewState, span: $span, anchor: $anchor, today: $today, basis: $basis, report: $report, errorMessage: $errorMessage, moved: $moved, saving: $saving, rowErrors: $rowErrors, savedName: $savedName, savedCents: $savedCents)';
}


}

/// @nodoc
abstract mixin class _$ProRevenueStateCopyWith<$Res> implements $ProRevenueStateCopyWith<$Res> {
  factory _$ProRevenueStateCopyWith(_ProRevenueState value, $Res Function(_ProRevenueState) _then) = __$ProRevenueStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, RevenueSpan span, String anchor, String today, String basis, RevenueReportModel? report, String? errorMessage, bool moved, Set<String> saving, Map<String, RevenueRowError> rowErrors, String? savedName, int? savedCents
});


@override $RevenueReportModelCopyWith<$Res>? get report;

}
/// @nodoc
class __$ProRevenueStateCopyWithImpl<$Res>
    implements _$ProRevenueStateCopyWith<$Res> {
  __$ProRevenueStateCopyWithImpl(this._self, this._then);

  final _ProRevenueState _self;
  final $Res Function(_ProRevenueState) _then;

/// Create a copy of ProRevenueState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? span = null,Object? anchor = null,Object? today = null,Object? basis = null,Object? report = freezed,Object? errorMessage = freezed,Object? moved = null,Object? saving = null,Object? rowErrors = null,Object? savedName = freezed,Object? savedCents = freezed,}) {
  return _then(_ProRevenueState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,span: null == span ? _self.span : span // ignore: cast_nullable_to_non_nullable
as RevenueSpan,anchor: null == anchor ? _self.anchor : anchor // ignore: cast_nullable_to_non_nullable
as String,today: null == today ? _self.today : today // ignore: cast_nullable_to_non_nullable
as String,basis: null == basis ? _self.basis : basis // ignore: cast_nullable_to_non_nullable
as String,report: freezed == report ? _self.report : report // ignore: cast_nullable_to_non_nullable
as RevenueReportModel?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,moved: null == moved ? _self.moved : moved // ignore: cast_nullable_to_non_nullable
as bool,saving: null == saving ? _self._saving : saving // ignore: cast_nullable_to_non_nullable
as Set<String>,rowErrors: null == rowErrors ? _self._rowErrors : rowErrors // ignore: cast_nullable_to_non_nullable
as Map<String, RevenueRowError>,savedName: freezed == savedName ? _self.savedName : savedName // ignore: cast_nullable_to_non_nullable
as String?,savedCents: freezed == savedCents ? _self.savedCents : savedCents // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

/// Create a copy of ProRevenueState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RevenueReportModelCopyWith<$Res>? get report {
    if (_self.report == null) {
    return null;
  }

  return $RevenueReportModelCopyWith<$Res>(_self.report!, (value) {
    return _then(_self.copyWith(report: value));
  });
}
}

// dart format on
