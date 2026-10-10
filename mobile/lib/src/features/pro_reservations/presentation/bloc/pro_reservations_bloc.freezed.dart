// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'pro_reservations_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ProReservationsState {

 ViewState get viewState; String get query; List<ReservationModel> get items; int get total; int get page; bool get hasMore; bool get loadingMore;/// The earliest page loaded: 1 opens on today, 0 and below are before today.
 int get firstPage; bool get hasEarlier; bool get loadingEarlier; String? get errorCode;
/// Create a copy of ProReservationsState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProReservationsStateCopyWith<ProReservationsState> get copyWith => _$ProReservationsStateCopyWithImpl<ProReservationsState>(this as ProReservationsState, _$identity);



@override
bool operator ==(Object other) {
  final _this = this as ProReservationsState;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProReservationsState&&(identical(other.viewState, _this.viewState) || other.viewState == _this.viewState)&&(identical(other.query, _this.query) || other.query == _this.query)&&const DeepCollectionEquality().equals(other.items, _this.items)&&(identical(other.total, _this.total) || other.total == _this.total)&&(identical(other.page, _this.page) || other.page == _this.page)&&(identical(other.hasMore, _this.hasMore) || other.hasMore == _this.hasMore)&&(identical(other.loadingMore, _this.loadingMore) || other.loadingMore == _this.loadingMore)&&(identical(other.firstPage, _this.firstPage) || other.firstPage == _this.firstPage)&&(identical(other.hasEarlier, _this.hasEarlier) || other.hasEarlier == _this.hasEarlier)&&(identical(other.loadingEarlier, _this.loadingEarlier) || other.loadingEarlier == _this.loadingEarlier)&&(identical(other.errorCode, _this.errorCode) || other.errorCode == _this.errorCode));
}


@override
int get hashCode {
  final _this = this as ProReservationsState;
  return Object.hash(runtimeType,_this.viewState,_this.query,const DeepCollectionEquality().hash(_this.items),_this.total,_this.page,_this.hasMore,_this.loadingMore,_this.firstPage,_this.hasEarlier,_this.loadingEarlier,_this.errorCode);
}

@override
String toString() {
  final _this = this as ProReservationsState;
  return 'ProReservationsState(viewState: ${_this.viewState}, query: ${_this.query}, items: ${_this.items}, total: ${_this.total}, page: ${_this.page}, hasMore: ${_this.hasMore}, loadingMore: ${_this.loadingMore}, firstPage: ${_this.firstPage}, hasEarlier: ${_this.hasEarlier}, loadingEarlier: ${_this.loadingEarlier}, errorCode: ${_this.errorCode})';
}


}

/// @nodoc
abstract mixin class $ProReservationsStateCopyWith<$Res>  {
  factory $ProReservationsStateCopyWith(ProReservationsState value, $Res Function(ProReservationsState) _then) = _$ProReservationsStateCopyWithImpl;
@useResult
$Res call({
 ViewState viewState, String query, List<ReservationModel> items, int total, int page, bool hasMore, bool loadingMore, int firstPage, bool hasEarlier, bool loadingEarlier, String? errorCode
});




}
/// @nodoc
class _$ProReservationsStateCopyWithImpl<$Res>
    implements $ProReservationsStateCopyWith<$Res> {
  _$ProReservationsStateCopyWithImpl(this._self, this._then);

  final ProReservationsState _self;
  final $Res Function(ProReservationsState) _then;

/// Create a copy of ProReservationsState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? viewState = null,Object? query = null,Object? items = null,Object? total = null,Object? page = null,Object? hasMore = null,Object? loadingMore = null,Object? firstPage = null,Object? hasEarlier = null,Object? loadingEarlier = null,Object? errorCode = freezed,}) {
  return _then(ProReservationsState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,query: null == query ? _self.query : query // ignore: cast_nullable_to_non_nullable
as String,items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<ReservationModel>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,page: null == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int,hasMore: null == hasMore ? _self.hasMore : hasMore // ignore: cast_nullable_to_non_nullable
as bool,loadingMore: null == loadingMore ? _self.loadingMore : loadingMore // ignore: cast_nullable_to_non_nullable
as bool,firstPage: null == firstPage ? _self.firstPage : firstPage // ignore: cast_nullable_to_non_nullable
as int,hasEarlier: null == hasEarlier ? _self.hasEarlier : hasEarlier // ignore: cast_nullable_to_non_nullable
as bool,loadingEarlier: null == loadingEarlier ? _self.loadingEarlier : loadingEarlier // ignore: cast_nullable_to_non_nullable
as bool,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ProReservationsState].
extension ProReservationsStatePatterns on ProReservationsState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProReservationsState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProReservationsState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProReservationsState value)  $default,){
final _that = this;
switch (_that) {
case _ProReservationsState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProReservationsState value)?  $default,){
final _that = this;
switch (_that) {
case _ProReservationsState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ViewState viewState,  String query,  List<ReservationModel> items,  int total,  int page,  bool hasMore,  bool loadingMore,  int firstPage,  bool hasEarlier,  bool loadingEarlier,  String? errorCode)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProReservationsState() when $default != null:
return $default(_that.viewState,_that.query,_that.items,_that.total,_that.page,_that.hasMore,_that.loadingMore,_that.firstPage,_that.hasEarlier,_that.loadingEarlier,_that.errorCode);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ViewState viewState,  String query,  List<ReservationModel> items,  int total,  int page,  bool hasMore,  bool loadingMore,  int firstPage,  bool hasEarlier,  bool loadingEarlier,  String? errorCode)  $default,) {final _that = this;
switch (_that) {
case _ProReservationsState():
return $default(_that.viewState,_that.query,_that.items,_that.total,_that.page,_that.hasMore,_that.loadingMore,_that.firstPage,_that.hasEarlier,_that.loadingEarlier,_that.errorCode);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ViewState viewState,  String query,  List<ReservationModel> items,  int total,  int page,  bool hasMore,  bool loadingMore,  int firstPage,  bool hasEarlier,  bool loadingEarlier,  String? errorCode)?  $default,) {final _that = this;
switch (_that) {
case _ProReservationsState() when $default != null:
return $default(_that.viewState,_that.query,_that.items,_that.total,_that.page,_that.hasMore,_that.loadingMore,_that.firstPage,_that.hasEarlier,_that.loadingEarlier,_that.errorCode);case _:
  return null;

}
}

}

/// @nodoc


class _ProReservationsState implements ProReservationsState {
  const _ProReservationsState({this.viewState = ViewState.idle, this.query = '',  List<ReservationModel> items = const [], this.total = 0, this.page = 1, this.hasMore = false, this.loadingMore = false, this.firstPage = 1, this.hasEarlier = false, this.loadingEarlier = false, this.errorCode}): _items = items;
  

@override@JsonKey() final  ViewState viewState;
@override@JsonKey() final  String query;
 final  List<ReservationModel> _items;
@override@JsonKey() List<ReservationModel> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override@JsonKey() final  int total;
@override@JsonKey() final  int page;
@override@JsonKey() final  bool hasMore;
@override@JsonKey() final  bool loadingMore;
/// The earliest page loaded: 1 opens on today, 0 and below are before today.
@override@JsonKey() final  int firstPage;
@override@JsonKey() final  bool hasEarlier;
@override@JsonKey() final  bool loadingEarlier;
@override final  String? errorCode;

/// Create a copy of ProReservationsState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProReservationsStateCopyWith<_ProReservationsState> get copyWith => __$ProReservationsStateCopyWithImpl<_ProReservationsState>(this, _$identity);



@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProReservationsState&&(identical(other.viewState, viewState) || other.viewState == viewState)&&(identical(other.query, query) || other.query == query)&&const DeepCollectionEquality().equals(other.items, _items)&&(identical(other.total, total) || other.total == total)&&(identical(other.page, page) || other.page == page)&&(identical(other.hasMore, hasMore) || other.hasMore == hasMore)&&(identical(other.loadingMore, loadingMore) || other.loadingMore == loadingMore)&&(identical(other.firstPage, firstPage) || other.firstPage == firstPage)&&(identical(other.hasEarlier, hasEarlier) || other.hasEarlier == hasEarlier)&&(identical(other.loadingEarlier, loadingEarlier) || other.loadingEarlier == loadingEarlier)&&(identical(other.errorCode, errorCode) || other.errorCode == errorCode));
}


@override
int get hashCode {
    return Object.hash(runtimeType,viewState,query,const DeepCollectionEquality().hash(_items),total,page,hasMore,loadingMore,firstPage,hasEarlier,loadingEarlier,errorCode);
}

@override
String toString() {
    return 'ProReservationsState(viewState: $viewState, query: $query, items: $items, total: $total, page: $page, hasMore: $hasMore, loadingMore: $loadingMore, firstPage: $firstPage, hasEarlier: $hasEarlier, loadingEarlier: $loadingEarlier, errorCode: $errorCode)';
}


}

/// @nodoc
abstract mixin class _$ProReservationsStateCopyWith<$Res> implements $ProReservationsStateCopyWith<$Res> {
  factory _$ProReservationsStateCopyWith(_ProReservationsState value, $Res Function(_ProReservationsState) _then) = __$ProReservationsStateCopyWithImpl;
@override @useResult
$Res call({
 ViewState viewState, String query, List<ReservationModel> items, int total, int page, bool hasMore, bool loadingMore, int firstPage, bool hasEarlier, bool loadingEarlier, String? errorCode
});




}
/// @nodoc
class __$ProReservationsStateCopyWithImpl<$Res>
    implements _$ProReservationsStateCopyWith<$Res> {
  __$ProReservationsStateCopyWithImpl(this._self, this._then);

  final _ProReservationsState _self;
  final $Res Function(_ProReservationsState) _then;

/// Create a copy of ProReservationsState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? viewState = null,Object? query = null,Object? items = null,Object? total = null,Object? page = null,Object? hasMore = null,Object? loadingMore = null,Object? firstPage = null,Object? hasEarlier = null,Object? loadingEarlier = null,Object? errorCode = freezed,}) {
  return _then(_ProReservationsState(
viewState: null == viewState ? _self.viewState : viewState // ignore: cast_nullable_to_non_nullable
as ViewState,query: null == query ? _self.query : query // ignore: cast_nullable_to_non_nullable
as String,items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<ReservationModel>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,page: null == page ? _self.page : page // ignore: cast_nullable_to_non_nullable
as int,hasMore: null == hasMore ? _self.hasMore : hasMore // ignore: cast_nullable_to_non_nullable
as bool,loadingMore: null == loadingMore ? _self.loadingMore : loadingMore // ignore: cast_nullable_to_non_nullable
as bool,firstPage: null == firstPage ? _self.firstPage : firstPage // ignore: cast_nullable_to_non_nullable
as int,hasEarlier: null == hasEarlier ? _self.hasEarlier : hasEarlier // ignore: cast_nullable_to_non_nullable
as bool,loadingEarlier: null == loadingEarlier ? _self.loadingEarlier : loadingEarlier // ignore: cast_nullable_to_non_nullable
as bool,errorCode: freezed == errorCode ? _self.errorCode : errorCode // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
