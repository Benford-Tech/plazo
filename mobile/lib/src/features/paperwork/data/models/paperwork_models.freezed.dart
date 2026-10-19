// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'paperwork_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaperworkModel {

 String? get reservationId; String get status;/// False while no photo store is connected on the server (photos cannot be taken).
 bool get photosAvailable; ContractModel get contract; InspectionModel? get dropoff;@JsonKey(name: 'return') InspectionModel? get returnReport; ComparisonModel? get comparison;
/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaperworkModelCopyWith<PaperworkModel> get copyWith => _$PaperworkModelCopyWithImpl<PaperworkModel>(this as PaperworkModel, _$identity);

  /// Serializes this PaperworkModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as PaperworkModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaperworkModel&&(identical(other.reservationId, _this.reservationId) || other.reservationId == _this.reservationId)&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.photosAvailable, _this.photosAvailable) || other.photosAvailable == _this.photosAvailable)&&(identical(other.contract, _this.contract) || other.contract == _this.contract)&&(identical(other.dropoff, _this.dropoff) || other.dropoff == _this.dropoff)&&(identical(other.returnReport, _this.returnReport) || other.returnReport == _this.returnReport)&&(identical(other.comparison, _this.comparison) || other.comparison == _this.comparison));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as PaperworkModel;
  return Object.hash(runtimeType,_this.reservationId,_this.status,_this.photosAvailable,_this.contract,_this.dropoff,_this.returnReport,_this.comparison);
}

@override
String toString() {
  final _this = this as PaperworkModel;
  return 'PaperworkModel(reservationId: ${_this.reservationId}, status: ${_this.status}, photosAvailable: ${_this.photosAvailable}, contract: ${_this.contract}, dropoff: ${_this.dropoff}, returnReport: ${_this.returnReport}, comparison: ${_this.comparison})';
}


}

/// @nodoc
abstract mixin class $PaperworkModelCopyWith<$Res>  {
  factory $PaperworkModelCopyWith(PaperworkModel value, $Res Function(PaperworkModel) _then) = _$PaperworkModelCopyWithImpl;
@useResult
$Res call({
 String? reservationId, String status, bool photosAvailable, ContractModel contract, InspectionModel? dropoff,@JsonKey(name: 'return') InspectionModel? returnReport, ComparisonModel? comparison
});


$ContractModelCopyWith<$Res> get contract;$InspectionModelCopyWith<$Res>? get dropoff;$InspectionModelCopyWith<$Res>? get returnReport;$ComparisonModelCopyWith<$Res>? get comparison;

}
/// @nodoc
class _$PaperworkModelCopyWithImpl<$Res>
    implements $PaperworkModelCopyWith<$Res> {
  _$PaperworkModelCopyWithImpl(this._self, this._then);

  final PaperworkModel _self;
  final $Res Function(PaperworkModel) _then;

/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reservationId = freezed,Object? status = null,Object? photosAvailable = null,Object? contract = null,Object? dropoff = freezed,Object? returnReport = freezed,Object? comparison = freezed,}) {
  return _then(PaperworkModel(
reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,photosAvailable: null == photosAvailable ? _self.photosAvailable : photosAvailable // ignore: cast_nullable_to_non_nullable
as bool,contract: null == contract ? _self.contract : contract // ignore: cast_nullable_to_non_nullable
as ContractModel,dropoff: freezed == dropoff ? _self.dropoff : dropoff // ignore: cast_nullable_to_non_nullable
as InspectionModel?,returnReport: freezed == returnReport ? _self.returnReport : returnReport // ignore: cast_nullable_to_non_nullable
as InspectionModel?,comparison: freezed == comparison ? _self.comparison : comparison // ignore: cast_nullable_to_non_nullable
as ComparisonModel?,
  ));
}
/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContractModelCopyWith<$Res> get contract {
  
  return $ContractModelCopyWith<$Res>(_self.contract, (value) {
    return _then(_self.copyWith(contract: value));
  });
}/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$InspectionModelCopyWith<$Res>? get dropoff {
    if (_self.dropoff == null) {
    return null;
  }

  return $InspectionModelCopyWith<$Res>(_self.dropoff!, (value) {
    return _then(_self.copyWith(dropoff: value));
  });
}/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$InspectionModelCopyWith<$Res>? get returnReport {
    if (_self.returnReport == null) {
    return null;
  }

  return $InspectionModelCopyWith<$Res>(_self.returnReport!, (value) {
    return _then(_self.copyWith(returnReport: value));
  });
}/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ComparisonModelCopyWith<$Res>? get comparison {
    if (_self.comparison == null) {
    return null;
  }

  return $ComparisonModelCopyWith<$Res>(_self.comparison!, (value) {
    return _then(_self.copyWith(comparison: value));
  });
}
}


/// Adds pattern-matching-related methods to [PaperworkModel].
extension PaperworkModelPatterns on PaperworkModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaperworkModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaperworkModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaperworkModel value)  $default,){
final _that = this;
switch (_that) {
case _PaperworkModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaperworkModel value)?  $default,){
final _that = this;
switch (_that) {
case _PaperworkModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? reservationId,  String status,  bool photosAvailable,  ContractModel contract,  InspectionModel? dropoff, @JsonKey(name: 'return')  InspectionModel? returnReport,  ComparisonModel? comparison)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaperworkModel() when $default != null:
return $default(_that.reservationId,_that.status,_that.photosAvailable,_that.contract,_that.dropoff,_that.returnReport,_that.comparison);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? reservationId,  String status,  bool photosAvailable,  ContractModel contract,  InspectionModel? dropoff, @JsonKey(name: 'return')  InspectionModel? returnReport,  ComparisonModel? comparison)  $default,) {final _that = this;
switch (_that) {
case _PaperworkModel():
return $default(_that.reservationId,_that.status,_that.photosAvailable,_that.contract,_that.dropoff,_that.returnReport,_that.comparison);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? reservationId,  String status,  bool photosAvailable,  ContractModel contract,  InspectionModel? dropoff, @JsonKey(name: 'return')  InspectionModel? returnReport,  ComparisonModel? comparison)?  $default,) {final _that = this;
switch (_that) {
case _PaperworkModel() when $default != null:
return $default(_that.reservationId,_that.status,_that.photosAvailable,_that.contract,_that.dropoff,_that.returnReport,_that.comparison);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaperworkModel extends PaperworkModel {
  const _PaperworkModel({this.reservationId, required this.status, this.photosAvailable = true, required this.contract, this.dropoff, @JsonKey(name: 'return') this.returnReport, this.comparison}): super._();
  factory _PaperworkModel.fromJson(Map<String, dynamic> json) => _$PaperworkModelFromJson(json);

@override final  String? reservationId;
@override final  String status;
/// False while no photo store is connected on the server (photos cannot be taken).
@override@JsonKey() final  bool photosAvailable;
@override final  ContractModel contract;
@override final  InspectionModel? dropoff;
@override@JsonKey(name: 'return') final  InspectionModel? returnReport;
@override final  ComparisonModel? comparison;

/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaperworkModelCopyWith<_PaperworkModel> get copyWith => __$PaperworkModelCopyWithImpl<_PaperworkModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaperworkModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaperworkModel&&(identical(other.reservationId, reservationId) || other.reservationId == reservationId)&&(identical(other.status, status) || other.status == status)&&(identical(other.photosAvailable, photosAvailable) || other.photosAvailable == photosAvailable)&&(identical(other.contract, contract) || other.contract == contract)&&(identical(other.dropoff, dropoff) || other.dropoff == dropoff)&&(identical(other.returnReport, returnReport) || other.returnReport == returnReport)&&(identical(other.comparison, comparison) || other.comparison == comparison));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,reservationId,status,photosAvailable,contract,dropoff,returnReport,comparison);
}

@override
String toString() {
    return 'PaperworkModel(reservationId: $reservationId, status: $status, photosAvailable: $photosAvailable, contract: $contract, dropoff: $dropoff, returnReport: $returnReport, comparison: $comparison)';
}


}

/// @nodoc
abstract mixin class _$PaperworkModelCopyWith<$Res> implements $PaperworkModelCopyWith<$Res> {
  factory _$PaperworkModelCopyWith(_PaperworkModel value, $Res Function(_PaperworkModel) _then) = __$PaperworkModelCopyWithImpl;
@override @useResult
$Res call({
 String? reservationId, String status, bool photosAvailable, ContractModel contract, InspectionModel? dropoff,@JsonKey(name: 'return') InspectionModel? returnReport, ComparisonModel? comparison
});


@override $ContractModelCopyWith<$Res> get contract;@override $InspectionModelCopyWith<$Res>? get dropoff;@override $InspectionModelCopyWith<$Res>? get returnReport;@override $ComparisonModelCopyWith<$Res>? get comparison;

}
/// @nodoc
class __$PaperworkModelCopyWithImpl<$Res>
    implements _$PaperworkModelCopyWith<$Res> {
  __$PaperworkModelCopyWithImpl(this._self, this._then);

  final _PaperworkModel _self;
  final $Res Function(_PaperworkModel) _then;

/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reservationId = freezed,Object? status = null,Object? photosAvailable = null,Object? contract = null,Object? dropoff = freezed,Object? returnReport = freezed,Object? comparison = freezed,}) {
  return _then(_PaperworkModel(
reservationId: freezed == reservationId ? _self.reservationId : reservationId // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,photosAvailable: null == photosAvailable ? _self.photosAvailable : photosAvailable // ignore: cast_nullable_to_non_nullable
as bool,contract: null == contract ? _self.contract : contract // ignore: cast_nullable_to_non_nullable
as ContractModel,dropoff: freezed == dropoff ? _self.dropoff : dropoff // ignore: cast_nullable_to_non_nullable
as InspectionModel?,returnReport: freezed == returnReport ? _self.returnReport : returnReport // ignore: cast_nullable_to_non_nullable
as InspectionModel?,comparison: freezed == comparison ? _self.comparison : comparison // ignore: cast_nullable_to_non_nullable
as ComparisonModel?,
  ));
}

/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContractModelCopyWith<$Res> get contract {
  
  return $ContractModelCopyWith<$Res>(_self.contract, (value) {
    return _then(_self.copyWith(contract: value));
  });
}/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$InspectionModelCopyWith<$Res>? get dropoff {
    if (_self.dropoff == null) {
    return null;
  }

  return $InspectionModelCopyWith<$Res>(_self.dropoff!, (value) {
    return _then(_self.copyWith(dropoff: value));
  });
}/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$InspectionModelCopyWith<$Res>? get returnReport {
    if (_self.returnReport == null) {
    return null;
  }

  return $InspectionModelCopyWith<$Res>(_self.returnReport!, (value) {
    return _then(_self.copyWith(returnReport: value));
  });
}/// Create a copy of PaperworkModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ComparisonModelCopyWith<$Res>? get comparison {
    if (_self.comparison == null) {
    return null;
  }

  return $ComparisonModelCopyWith<$Res>(_self.comparison!, (value) {
    return _then(_self.copyWith(comparison: value));
  });
}
}


/// @nodoc
mixin _$ContractModel {

/// unsigned | signed
 String get status; bool get canSign;/// A code can be sent by SMS (a mobile number, SMS configured on the server).
 bool get codeAvailable; String get phoneMasked; ContractDocumentModel get document; SignedContractModel? get signed;
/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContractModelCopyWith<ContractModel> get copyWith => _$ContractModelCopyWithImpl<ContractModel>(this as ContractModel, _$identity);

  /// Serializes this ContractModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ContractModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContractModel&&(identical(other.status, _this.status) || other.status == _this.status)&&(identical(other.canSign, _this.canSign) || other.canSign == _this.canSign)&&(identical(other.codeAvailable, _this.codeAvailable) || other.codeAvailable == _this.codeAvailable)&&(identical(other.phoneMasked, _this.phoneMasked) || other.phoneMasked == _this.phoneMasked)&&(identical(other.document, _this.document) || other.document == _this.document)&&(identical(other.signed, _this.signed) || other.signed == _this.signed));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ContractModel;
  return Object.hash(runtimeType,_this.status,_this.canSign,_this.codeAvailable,_this.phoneMasked,_this.document,_this.signed);
}

@override
String toString() {
  final _this = this as ContractModel;
  return 'ContractModel(status: ${_this.status}, canSign: ${_this.canSign}, codeAvailable: ${_this.codeAvailable}, phoneMasked: ${_this.phoneMasked}, document: ${_this.document}, signed: ${_this.signed})';
}


}

/// @nodoc
abstract mixin class $ContractModelCopyWith<$Res>  {
  factory $ContractModelCopyWith(ContractModel value, $Res Function(ContractModel) _then) = _$ContractModelCopyWithImpl;
@useResult
$Res call({
 String status, bool canSign, bool codeAvailable, String phoneMasked, ContractDocumentModel document, SignedContractModel? signed
});


$ContractDocumentModelCopyWith<$Res> get document;$SignedContractModelCopyWith<$Res>? get signed;

}
/// @nodoc
class _$ContractModelCopyWithImpl<$Res>
    implements $ContractModelCopyWith<$Res> {
  _$ContractModelCopyWithImpl(this._self, this._then);

  final ContractModel _self;
  final $Res Function(ContractModel) _then;

/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? status = null,Object? canSign = null,Object? codeAvailable = null,Object? phoneMasked = null,Object? document = null,Object? signed = freezed,}) {
  return _then(ContractModel(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,canSign: null == canSign ? _self.canSign : canSign // ignore: cast_nullable_to_non_nullable
as bool,codeAvailable: null == codeAvailable ? _self.codeAvailable : codeAvailable // ignore: cast_nullable_to_non_nullable
as bool,phoneMasked: null == phoneMasked ? _self.phoneMasked : phoneMasked // ignore: cast_nullable_to_non_nullable
as String,document: null == document ? _self.document : document // ignore: cast_nullable_to_non_nullable
as ContractDocumentModel,signed: freezed == signed ? _self.signed : signed // ignore: cast_nullable_to_non_nullable
as SignedContractModel?,
  ));
}
/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContractDocumentModelCopyWith<$Res> get document {
  
  return $ContractDocumentModelCopyWith<$Res>(_self.document, (value) {
    return _then(_self.copyWith(document: value));
  });
}/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SignedContractModelCopyWith<$Res>? get signed {
    if (_self.signed == null) {
    return null;
  }

  return $SignedContractModelCopyWith<$Res>(_self.signed!, (value) {
    return _then(_self.copyWith(signed: value));
  });
}
}


/// Adds pattern-matching-related methods to [ContractModel].
extension ContractModelPatterns on ContractModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContractModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContractModel value)  $default,){
final _that = this;
switch (_that) {
case _ContractModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContractModel value)?  $default,){
final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String status,  bool canSign,  bool codeAvailable,  String phoneMasked,  ContractDocumentModel document,  SignedContractModel? signed)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
return $default(_that.status,_that.canSign,_that.codeAvailable,_that.phoneMasked,_that.document,_that.signed);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String status,  bool canSign,  bool codeAvailable,  String phoneMasked,  ContractDocumentModel document,  SignedContractModel? signed)  $default,) {final _that = this;
switch (_that) {
case _ContractModel():
return $default(_that.status,_that.canSign,_that.codeAvailable,_that.phoneMasked,_that.document,_that.signed);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String status,  bool canSign,  bool codeAvailable,  String phoneMasked,  ContractDocumentModel document,  SignedContractModel? signed)?  $default,) {final _that = this;
switch (_that) {
case _ContractModel() when $default != null:
return $default(_that.status,_that.canSign,_that.codeAvailable,_that.phoneMasked,_that.document,_that.signed);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContractModel extends ContractModel {
  const _ContractModel({required this.status, this.canSign = false, this.codeAvailable = false, required this.phoneMasked, required this.document, this.signed}): super._();
  factory _ContractModel.fromJson(Map<String, dynamic> json) => _$ContractModelFromJson(json);

/// unsigned | signed
@override final  String status;
@override@JsonKey() final  bool canSign;
/// A code can be sent by SMS (a mobile number, SMS configured on the server).
@override@JsonKey() final  bool codeAvailable;
@override final  String phoneMasked;
@override final  ContractDocumentModel document;
@override final  SignedContractModel? signed;

/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContractModelCopyWith<_ContractModel> get copyWith => __$ContractModelCopyWithImpl<_ContractModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContractModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContractModel&&(identical(other.status, status) || other.status == status)&&(identical(other.canSign, canSign) || other.canSign == canSign)&&(identical(other.codeAvailable, codeAvailable) || other.codeAvailable == codeAvailable)&&(identical(other.phoneMasked, phoneMasked) || other.phoneMasked == phoneMasked)&&(identical(other.document, document) || other.document == document)&&(identical(other.signed, signed) || other.signed == signed));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,status,canSign,codeAvailable,phoneMasked,document,signed);
}

@override
String toString() {
    return 'ContractModel(status: $status, canSign: $canSign, codeAvailable: $codeAvailable, phoneMasked: $phoneMasked, document: $document, signed: $signed)';
}


}

/// @nodoc
abstract mixin class _$ContractModelCopyWith<$Res> implements $ContractModelCopyWith<$Res> {
  factory _$ContractModelCopyWith(_ContractModel value, $Res Function(_ContractModel) _then) = __$ContractModelCopyWithImpl;
@override @useResult
$Res call({
 String status, bool canSign, bool codeAvailable, String phoneMasked, ContractDocumentModel document, SignedContractModel? signed
});


@override $ContractDocumentModelCopyWith<$Res> get document;@override $SignedContractModelCopyWith<$Res>? get signed;

}
/// @nodoc
class __$ContractModelCopyWithImpl<$Res>
    implements _$ContractModelCopyWith<$Res> {
  __$ContractModelCopyWithImpl(this._self, this._then);

  final _ContractModel _self;
  final $Res Function(_ContractModel) _then;

/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? status = null,Object? canSign = null,Object? codeAvailable = null,Object? phoneMasked = null,Object? document = null,Object? signed = freezed,}) {
  return _then(_ContractModel(
status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,canSign: null == canSign ? _self.canSign : canSign // ignore: cast_nullable_to_non_nullable
as bool,codeAvailable: null == codeAvailable ? _self.codeAvailable : codeAvailable // ignore: cast_nullable_to_non_nullable
as bool,phoneMasked: null == phoneMasked ? _self.phoneMasked : phoneMasked // ignore: cast_nullable_to_non_nullable
as String,document: null == document ? _self.document : document // ignore: cast_nullable_to_non_nullable
as ContractDocumentModel,signed: freezed == signed ? _self.signed : signed // ignore: cast_nullable_to_non_nullable
as SignedContractModel?,
  ));
}

/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ContractDocumentModelCopyWith<$Res> get document {
  
  return $ContractDocumentModelCopyWith<$Res>(_self.document, (value) {
    return _then(_self.copyWith(document: value));
  });
}/// Create a copy of ContractModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$SignedContractModelCopyWith<$Res>? get signed {
    if (_self.signed == null) {
    return null;
  }

  return $SignedContractModelCopyWith<$Res>(_self.signed!, (value) {
    return _then(_self.copyWith(signed: value));
  });
}
}


/// @nodoc
mixin _$ContractDocumentModel {

 String get title; List<String> get summary; List<String> get clauses;
/// Create a copy of ContractDocumentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContractDocumentModelCopyWith<ContractDocumentModel> get copyWith => _$ContractDocumentModelCopyWithImpl<ContractDocumentModel>(this as ContractDocumentModel, _$identity);

  /// Serializes this ContractDocumentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ContractDocumentModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContractDocumentModel&&(identical(other.title, _this.title) || other.title == _this.title)&&const DeepCollectionEquality().equals(other.summary, _this.summary)&&const DeepCollectionEquality().equals(other.clauses, _this.clauses));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ContractDocumentModel;
  return Object.hash(runtimeType,_this.title,const DeepCollectionEquality().hash(_this.summary),const DeepCollectionEquality().hash(_this.clauses));
}

@override
String toString() {
  final _this = this as ContractDocumentModel;
  return 'ContractDocumentModel(title: ${_this.title}, summary: ${_this.summary}, clauses: ${_this.clauses})';
}


}

/// @nodoc
abstract mixin class $ContractDocumentModelCopyWith<$Res>  {
  factory $ContractDocumentModelCopyWith(ContractDocumentModel value, $Res Function(ContractDocumentModel) _then) = _$ContractDocumentModelCopyWithImpl;
@useResult
$Res call({
 String title, List<String> summary, List<String> clauses
});




}
/// @nodoc
class _$ContractDocumentModelCopyWithImpl<$Res>
    implements $ContractDocumentModelCopyWith<$Res> {
  _$ContractDocumentModelCopyWithImpl(this._self, this._then);

  final ContractDocumentModel _self;
  final $Res Function(ContractDocumentModel) _then;

/// Create a copy of ContractDocumentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? summary = null,Object? clauses = null,}) {
  return _then(ContractDocumentModel(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as List<String>,clauses: null == clauses ? _self.clauses : clauses // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ContractDocumentModel].
extension ContractDocumentModelPatterns on ContractDocumentModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContractDocumentModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContractDocumentModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContractDocumentModel value)  $default,){
final _that = this;
switch (_that) {
case _ContractDocumentModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContractDocumentModel value)?  $default,){
final _that = this;
switch (_that) {
case _ContractDocumentModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  List<String> summary,  List<String> clauses)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContractDocumentModel() when $default != null:
return $default(_that.title,_that.summary,_that.clauses);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  List<String> summary,  List<String> clauses)  $default,) {final _that = this;
switch (_that) {
case _ContractDocumentModel():
return $default(_that.title,_that.summary,_that.clauses);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  List<String> summary,  List<String> clauses)?  $default,) {final _that = this;
switch (_that) {
case _ContractDocumentModel() when $default != null:
return $default(_that.title,_that.summary,_that.clauses);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContractDocumentModel implements ContractDocumentModel {
  const _ContractDocumentModel({required this.title,  List<String> summary = const [],  List<String> clauses = const []}): _summary = summary,_clauses = clauses;
  factory _ContractDocumentModel.fromJson(Map<String, dynamic> json) => _$ContractDocumentModelFromJson(json);

@override final  String title;
 final  List<String> _summary;
@override@JsonKey() List<String> get summary {
  if (_summary is EqualUnmodifiableListView) return _summary;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_summary);
}

 final  List<String> _clauses;
@override@JsonKey() List<String> get clauses {
  if (_clauses is EqualUnmodifiableListView) return _clauses;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_clauses);
}


/// Create a copy of ContractDocumentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContractDocumentModelCopyWith<_ContractDocumentModel> get copyWith => __$ContractDocumentModelCopyWithImpl<_ContractDocumentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContractDocumentModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContractDocumentModel&&(identical(other.title, title) || other.title == title)&&const DeepCollectionEquality().equals(other.summary, _summary)&&const DeepCollectionEquality().equals(other.clauses, _clauses));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,title,const DeepCollectionEquality().hash(_summary),const DeepCollectionEquality().hash(_clauses));
}

@override
String toString() {
    return 'ContractDocumentModel(title: $title, summary: $summary, clauses: $clauses)';
}


}

/// @nodoc
abstract mixin class _$ContractDocumentModelCopyWith<$Res> implements $ContractDocumentModelCopyWith<$Res> {
  factory _$ContractDocumentModelCopyWith(_ContractDocumentModel value, $Res Function(_ContractDocumentModel) _then) = __$ContractDocumentModelCopyWithImpl;
@override @useResult
$Res call({
 String title, List<String> summary, List<String> clauses
});




}
/// @nodoc
class __$ContractDocumentModelCopyWithImpl<$Res>
    implements _$ContractDocumentModelCopyWith<$Res> {
  __$ContractDocumentModelCopyWithImpl(this._self, this._then);

  final _ContractDocumentModel _self;
  final $Res Function(_ContractDocumentModel) _then;

/// Create a copy of ContractDocumentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? summary = null,Object? clauses = null,}) {
  return _then(_ContractDocumentModel(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,summary: null == summary ? _self._summary : summary // ignore: cast_nullable_to_non_nullable
as List<String>,clauses: null == clauses ? _self._clauses : clauses // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}


/// @nodoc
mixin _$SignedContractModel {

 String get version; DateTime get signedAt; String get signerName;/// sms_code | handwritten
 String get method;/// traveller_app | staff_device
 String get device; String? get phoneMasked; String get proofSha256;
/// Create a copy of SignedContractModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SignedContractModelCopyWith<SignedContractModel> get copyWith => _$SignedContractModelCopyWithImpl<SignedContractModel>(this as SignedContractModel, _$identity);

  /// Serializes this SignedContractModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as SignedContractModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SignedContractModel&&(identical(other.version, _this.version) || other.version == _this.version)&&(identical(other.signedAt, _this.signedAt) || other.signedAt == _this.signedAt)&&(identical(other.signerName, _this.signerName) || other.signerName == _this.signerName)&&(identical(other.method, _this.method) || other.method == _this.method)&&(identical(other.device, _this.device) || other.device == _this.device)&&(identical(other.phoneMasked, _this.phoneMasked) || other.phoneMasked == _this.phoneMasked)&&(identical(other.proofSha256, _this.proofSha256) || other.proofSha256 == _this.proofSha256));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as SignedContractModel;
  return Object.hash(runtimeType,_this.version,_this.signedAt,_this.signerName,_this.method,_this.device,_this.phoneMasked,_this.proofSha256);
}

@override
String toString() {
  final _this = this as SignedContractModel;
  return 'SignedContractModel(version: ${_this.version}, signedAt: ${_this.signedAt}, signerName: ${_this.signerName}, method: ${_this.method}, device: ${_this.device}, phoneMasked: ${_this.phoneMasked}, proofSha256: ${_this.proofSha256})';
}


}

/// @nodoc
abstract mixin class $SignedContractModelCopyWith<$Res>  {
  factory $SignedContractModelCopyWith(SignedContractModel value, $Res Function(SignedContractModel) _then) = _$SignedContractModelCopyWithImpl;
@useResult
$Res call({
 String version, DateTime signedAt, String signerName, String method, String device, String? phoneMasked, String proofSha256
});




}
/// @nodoc
class _$SignedContractModelCopyWithImpl<$Res>
    implements $SignedContractModelCopyWith<$Res> {
  _$SignedContractModelCopyWithImpl(this._self, this._then);

  final SignedContractModel _self;
  final $Res Function(SignedContractModel) _then;

/// Create a copy of SignedContractModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? version = null,Object? signedAt = null,Object? signerName = null,Object? method = null,Object? device = null,Object? phoneMasked = freezed,Object? proofSha256 = null,}) {
  return _then(SignedContractModel(
version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as String,signedAt: null == signedAt ? _self.signedAt : signedAt // ignore: cast_nullable_to_non_nullable
as DateTime,signerName: null == signerName ? _self.signerName : signerName // ignore: cast_nullable_to_non_nullable
as String,method: null == method ? _self.method : method // ignore: cast_nullable_to_non_nullable
as String,device: null == device ? _self.device : device // ignore: cast_nullable_to_non_nullable
as String,phoneMasked: freezed == phoneMasked ? _self.phoneMasked : phoneMasked // ignore: cast_nullable_to_non_nullable
as String?,proofSha256: null == proofSha256 ? _self.proofSha256 : proofSha256 // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SignedContractModel].
extension SignedContractModelPatterns on SignedContractModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SignedContractModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SignedContractModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SignedContractModel value)  $default,){
final _that = this;
switch (_that) {
case _SignedContractModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SignedContractModel value)?  $default,){
final _that = this;
switch (_that) {
case _SignedContractModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String version,  DateTime signedAt,  String signerName,  String method,  String device,  String? phoneMasked,  String proofSha256)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SignedContractModel() when $default != null:
return $default(_that.version,_that.signedAt,_that.signerName,_that.method,_that.device,_that.phoneMasked,_that.proofSha256);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String version,  DateTime signedAt,  String signerName,  String method,  String device,  String? phoneMasked,  String proofSha256)  $default,) {final _that = this;
switch (_that) {
case _SignedContractModel():
return $default(_that.version,_that.signedAt,_that.signerName,_that.method,_that.device,_that.phoneMasked,_that.proofSha256);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String version,  DateTime signedAt,  String signerName,  String method,  String device,  String? phoneMasked,  String proofSha256)?  $default,) {final _that = this;
switch (_that) {
case _SignedContractModel() when $default != null:
return $default(_that.version,_that.signedAt,_that.signerName,_that.method,_that.device,_that.phoneMasked,_that.proofSha256);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SignedContractModel implements SignedContractModel {
  const _SignedContractModel({required this.version, required this.signedAt, required this.signerName, required this.method, required this.device, this.phoneMasked, required this.proofSha256});
  factory _SignedContractModel.fromJson(Map<String, dynamic> json) => _$SignedContractModelFromJson(json);

@override final  String version;
@override final  DateTime signedAt;
@override final  String signerName;
/// sms_code | handwritten
@override final  String method;
/// traveller_app | staff_device
@override final  String device;
@override final  String? phoneMasked;
@override final  String proofSha256;

/// Create a copy of SignedContractModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SignedContractModelCopyWith<_SignedContractModel> get copyWith => __$SignedContractModelCopyWithImpl<_SignedContractModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SignedContractModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _SignedContractModel&&(identical(other.version, version) || other.version == version)&&(identical(other.signedAt, signedAt) || other.signedAt == signedAt)&&(identical(other.signerName, signerName) || other.signerName == signerName)&&(identical(other.method, method) || other.method == method)&&(identical(other.device, device) || other.device == device)&&(identical(other.phoneMasked, phoneMasked) || other.phoneMasked == phoneMasked)&&(identical(other.proofSha256, proofSha256) || other.proofSha256 == proofSha256));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,version,signedAt,signerName,method,device,phoneMasked,proofSha256);
}

@override
String toString() {
    return 'SignedContractModel(version: $version, signedAt: $signedAt, signerName: $signerName, method: $method, device: $device, phoneMasked: $phoneMasked, proofSha256: $proofSha256)';
}


}

/// @nodoc
abstract mixin class _$SignedContractModelCopyWith<$Res> implements $SignedContractModelCopyWith<$Res> {
  factory _$SignedContractModelCopyWith(_SignedContractModel value, $Res Function(_SignedContractModel) _then) = __$SignedContractModelCopyWithImpl;
@override @useResult
$Res call({
 String version, DateTime signedAt, String signerName, String method, String device, String? phoneMasked, String proofSha256
});




}
/// @nodoc
class __$SignedContractModelCopyWithImpl<$Res>
    implements _$SignedContractModelCopyWith<$Res> {
  __$SignedContractModelCopyWithImpl(this._self, this._then);

  final _SignedContractModel _self;
  final $Res Function(_SignedContractModel) _then;

/// Create a copy of SignedContractModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? version = null,Object? signedAt = null,Object? signerName = null,Object? method = null,Object? device = null,Object? phoneMasked = freezed,Object? proofSha256 = null,}) {
  return _then(_SignedContractModel(
version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as String,signedAt: null == signedAt ? _self.signedAt : signedAt // ignore: cast_nullable_to_non_nullable
as DateTime,signerName: null == signerName ? _self.signerName : signerName // ignore: cast_nullable_to_non_nullable
as String,method: null == method ? _self.method : method // ignore: cast_nullable_to_non_nullable
as String,device: null == device ? _self.device : device // ignore: cast_nullable_to_non_nullable
as String,phoneMasked: freezed == phoneMasked ? _self.phoneMasked : phoneMasked // ignore: cast_nullable_to_non_nullable
as String?,proofSha256: null == proofSha256 ? _self.proofSha256 : proofSha256 // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$DamageModel {

 int get n; double get x; double get y; String get label; String? get photoId;
/// Create a copy of DamageModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DamageModelCopyWith<DamageModel> get copyWith => _$DamageModelCopyWithImpl<DamageModel>(this as DamageModel, _$identity);

  /// Serializes this DamageModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as DamageModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DamageModel&&(identical(other.n, _this.n) || other.n == _this.n)&&(identical(other.x, _this.x) || other.x == _this.x)&&(identical(other.y, _this.y) || other.y == _this.y)&&(identical(other.label, _this.label) || other.label == _this.label)&&(identical(other.photoId, _this.photoId) || other.photoId == _this.photoId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as DamageModel;
  return Object.hash(runtimeType,_this.n,_this.x,_this.y,_this.label,_this.photoId);
}

@override
String toString() {
  final _this = this as DamageModel;
  return 'DamageModel(n: ${_this.n}, x: ${_this.x}, y: ${_this.y}, label: ${_this.label}, photoId: ${_this.photoId})';
}


}

/// @nodoc
abstract mixin class $DamageModelCopyWith<$Res>  {
  factory $DamageModelCopyWith(DamageModel value, $Res Function(DamageModel) _then) = _$DamageModelCopyWithImpl;
@useResult
$Res call({
 int n, double x, double y, String label, String? photoId
});




}
/// @nodoc
class _$DamageModelCopyWithImpl<$Res>
    implements $DamageModelCopyWith<$Res> {
  _$DamageModelCopyWithImpl(this._self, this._then);

  final DamageModel _self;
  final $Res Function(DamageModel) _then;

/// Create a copy of DamageModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? n = null,Object? x = null,Object? y = null,Object? label = null,Object? photoId = freezed,}) {
  return _then(DamageModel(
n: null == n ? _self.n : n // ignore: cast_nullable_to_non_nullable
as int,x: null == x ? _self.x : x // ignore: cast_nullable_to_non_nullable
as double,y: null == y ? _self.y : y // ignore: cast_nullable_to_non_nullable
as double,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,photoId: freezed == photoId ? _self.photoId : photoId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [DamageModel].
extension DamageModelPatterns on DamageModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DamageModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DamageModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DamageModel value)  $default,){
final _that = this;
switch (_that) {
case _DamageModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DamageModel value)?  $default,){
final _that = this;
switch (_that) {
case _DamageModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int n,  double x,  double y,  String label,  String? photoId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DamageModel() when $default != null:
return $default(_that.n,_that.x,_that.y,_that.label,_that.photoId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int n,  double x,  double y,  String label,  String? photoId)  $default,) {final _that = this;
switch (_that) {
case _DamageModel():
return $default(_that.n,_that.x,_that.y,_that.label,_that.photoId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int n,  double x,  double y,  String label,  String? photoId)?  $default,) {final _that = this;
switch (_that) {
case _DamageModel() when $default != null:
return $default(_that.n,_that.x,_that.y,_that.label,_that.photoId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DamageModel extends DamageModel {
  const _DamageModel({this.n = 0, required this.x, required this.y, required this.label, this.photoId}): super._();
  factory _DamageModel.fromJson(Map<String, dynamic> json) => _$DamageModelFromJson(json);

@override@JsonKey() final  int n;
@override final  double x;
@override final  double y;
@override final  String label;
@override final  String? photoId;

/// Create a copy of DamageModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DamageModelCopyWith<_DamageModel> get copyWith => __$DamageModelCopyWithImpl<_DamageModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DamageModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _DamageModel&&(identical(other.n, n) || other.n == n)&&(identical(other.x, x) || other.x == x)&&(identical(other.y, y) || other.y == y)&&(identical(other.label, label) || other.label == label)&&(identical(other.photoId, photoId) || other.photoId == photoId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,n,x,y,label,photoId);
}

@override
String toString() {
    return 'DamageModel(n: $n, x: $x, y: $y, label: $label, photoId: $photoId)';
}


}

/// @nodoc
abstract mixin class _$DamageModelCopyWith<$Res> implements $DamageModelCopyWith<$Res> {
  factory _$DamageModelCopyWith(_DamageModel value, $Res Function(_DamageModel) _then) = __$DamageModelCopyWithImpl;
@override @useResult
$Res call({
 int n, double x, double y, String label, String? photoId
});




}
/// @nodoc
class __$DamageModelCopyWithImpl<$Res>
    implements _$DamageModelCopyWith<$Res> {
  __$DamageModelCopyWithImpl(this._self, this._then);

  final _DamageModel _self;
  final $Res Function(_DamageModel) _then;

/// Create a copy of DamageModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? n = null,Object? x = null,Object? y = null,Object? label = null,Object? photoId = freezed,}) {
  return _then(_DamageModel(
n: null == n ? _self.n : n // ignore: cast_nullable_to_non_nullable
as int,x: null == x ? _self.x : x // ignore: cast_nullable_to_non_nullable
as double,y: null == y ? _self.y : y // ignore: cast_nullable_to_non_nullable
as double,label: null == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String,photoId: freezed == photoId ? _self.photoId : photoId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$InspectionPhotoModel {

 String get id; String get slot; DateTime get takenAt;
/// Create a copy of InspectionPhotoModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$InspectionPhotoModelCopyWith<InspectionPhotoModel> get copyWith => _$InspectionPhotoModelCopyWithImpl<InspectionPhotoModel>(this as InspectionPhotoModel, _$identity);

  /// Serializes this InspectionPhotoModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as InspectionPhotoModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is InspectionPhotoModel&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.slot, _this.slot) || other.slot == _this.slot)&&(identical(other.takenAt, _this.takenAt) || other.takenAt == _this.takenAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as InspectionPhotoModel;
  return Object.hash(runtimeType,_this.id,_this.slot,_this.takenAt);
}

@override
String toString() {
  final _this = this as InspectionPhotoModel;
  return 'InspectionPhotoModel(id: ${_this.id}, slot: ${_this.slot}, takenAt: ${_this.takenAt})';
}


}

/// @nodoc
abstract mixin class $InspectionPhotoModelCopyWith<$Res>  {
  factory $InspectionPhotoModelCopyWith(InspectionPhotoModel value, $Res Function(InspectionPhotoModel) _then) = _$InspectionPhotoModelCopyWithImpl;
@useResult
$Res call({
 String id, String slot, DateTime takenAt
});




}
/// @nodoc
class _$InspectionPhotoModelCopyWithImpl<$Res>
    implements $InspectionPhotoModelCopyWith<$Res> {
  _$InspectionPhotoModelCopyWithImpl(this._self, this._then);

  final InspectionPhotoModel _self;
  final $Res Function(InspectionPhotoModel) _then;

/// Create a copy of InspectionPhotoModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? slot = null,Object? takenAt = null,}) {
  return _then(InspectionPhotoModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,slot: null == slot ? _self.slot : slot // ignore: cast_nullable_to_non_nullable
as String,takenAt: null == takenAt ? _self.takenAt : takenAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [InspectionPhotoModel].
extension InspectionPhotoModelPatterns on InspectionPhotoModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _InspectionPhotoModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _InspectionPhotoModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _InspectionPhotoModel value)  $default,){
final _that = this;
switch (_that) {
case _InspectionPhotoModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _InspectionPhotoModel value)?  $default,){
final _that = this;
switch (_that) {
case _InspectionPhotoModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String slot,  DateTime takenAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _InspectionPhotoModel() when $default != null:
return $default(_that.id,_that.slot,_that.takenAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String slot,  DateTime takenAt)  $default,) {final _that = this;
switch (_that) {
case _InspectionPhotoModel():
return $default(_that.id,_that.slot,_that.takenAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String slot,  DateTime takenAt)?  $default,) {final _that = this;
switch (_that) {
case _InspectionPhotoModel() when $default != null:
return $default(_that.id,_that.slot,_that.takenAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _InspectionPhotoModel implements InspectionPhotoModel {
  const _InspectionPhotoModel({required this.id, required this.slot, required this.takenAt});
  factory _InspectionPhotoModel.fromJson(Map<String, dynamic> json) => _$InspectionPhotoModelFromJson(json);

@override final  String id;
@override final  String slot;
@override final  DateTime takenAt;

/// Create a copy of InspectionPhotoModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$InspectionPhotoModelCopyWith<_InspectionPhotoModel> get copyWith => __$InspectionPhotoModelCopyWithImpl<_InspectionPhotoModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$InspectionPhotoModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _InspectionPhotoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.slot, slot) || other.slot == slot)&&(identical(other.takenAt, takenAt) || other.takenAt == takenAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,slot,takenAt);
}

@override
String toString() {
    return 'InspectionPhotoModel(id: $id, slot: $slot, takenAt: $takenAt)';
}


}

/// @nodoc
abstract mixin class _$InspectionPhotoModelCopyWith<$Res> implements $InspectionPhotoModelCopyWith<$Res> {
  factory _$InspectionPhotoModelCopyWith(_InspectionPhotoModel value, $Res Function(_InspectionPhotoModel) _then) = __$InspectionPhotoModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String slot, DateTime takenAt
});




}
/// @nodoc
class __$InspectionPhotoModelCopyWithImpl<$Res>
    implements _$InspectionPhotoModelCopyWith<$Res> {
  __$InspectionPhotoModelCopyWithImpl(this._self, this._then);

  final _InspectionPhotoModel _self;
  final $Res Function(_InspectionPhotoModel) _then;

/// Create a copy of InspectionPhotoModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? slot = null,Object? takenAt = null,}) {
  return _then(_InspectionPhotoModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,slot: null == slot ? _self.slot : slot // ignore: cast_nullable_to_non_nullable
as String,takenAt: null == takenAt ? _self.takenAt : takenAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$InspectionModel {

/// dropoff | return
 String get kind; DateTime get startedAt; DateTime? get completedAt;/// First name of the staff member who took it.
 String? get performedBy; List<DamageModel> get damages; int? get mileageKm;/// 0 to 4 quarters of a tank.
 int? get fuelQuarters; String? get notes; List<InspectionPhotoModel> get photos; bool get photosErased;/// What is still needed to complete it: slots, mileageKm, fuelQuarters.
 List<String> get missing; bool get editable;/// pending | accepted | accepted_by_default | reserved
 String get decision; DateTime? get decidedAt; String? get decisionMethod; String? get decisionDevice; String? get reserveText; bool get canAnswer;
/// Create a copy of InspectionModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$InspectionModelCopyWith<InspectionModel> get copyWith => _$InspectionModelCopyWithImpl<InspectionModel>(this as InspectionModel, _$identity);

  /// Serializes this InspectionModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as InspectionModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is InspectionModel&&(identical(other.kind, _this.kind) || other.kind == _this.kind)&&(identical(other.startedAt, _this.startedAt) || other.startedAt == _this.startedAt)&&(identical(other.completedAt, _this.completedAt) || other.completedAt == _this.completedAt)&&(identical(other.performedBy, _this.performedBy) || other.performedBy == _this.performedBy)&&const DeepCollectionEquality().equals(other.damages, _this.damages)&&(identical(other.mileageKm, _this.mileageKm) || other.mileageKm == _this.mileageKm)&&(identical(other.fuelQuarters, _this.fuelQuarters) || other.fuelQuarters == _this.fuelQuarters)&&(identical(other.notes, _this.notes) || other.notes == _this.notes)&&const DeepCollectionEquality().equals(other.photos, _this.photos)&&(identical(other.photosErased, _this.photosErased) || other.photosErased == _this.photosErased)&&const DeepCollectionEquality().equals(other.missing, _this.missing)&&(identical(other.editable, _this.editable) || other.editable == _this.editable)&&(identical(other.decision, _this.decision) || other.decision == _this.decision)&&(identical(other.decidedAt, _this.decidedAt) || other.decidedAt == _this.decidedAt)&&(identical(other.decisionMethod, _this.decisionMethod) || other.decisionMethod == _this.decisionMethod)&&(identical(other.decisionDevice, _this.decisionDevice) || other.decisionDevice == _this.decisionDevice)&&(identical(other.reserveText, _this.reserveText) || other.reserveText == _this.reserveText)&&(identical(other.canAnswer, _this.canAnswer) || other.canAnswer == _this.canAnswer));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as InspectionModel;
  return Object.hash(runtimeType,_this.kind,_this.startedAt,_this.completedAt,_this.performedBy,const DeepCollectionEquality().hash(_this.damages),_this.mileageKm,_this.fuelQuarters,_this.notes,const DeepCollectionEquality().hash(_this.photos),_this.photosErased,const DeepCollectionEquality().hash(_this.missing),_this.editable,_this.decision,_this.decidedAt,_this.decisionMethod,_this.decisionDevice,_this.reserveText,_this.canAnswer);
}

@override
String toString() {
  final _this = this as InspectionModel;
  return 'InspectionModel(kind: ${_this.kind}, startedAt: ${_this.startedAt}, completedAt: ${_this.completedAt}, performedBy: ${_this.performedBy}, damages: ${_this.damages}, mileageKm: ${_this.mileageKm}, fuelQuarters: ${_this.fuelQuarters}, notes: ${_this.notes}, photos: ${_this.photos}, photosErased: ${_this.photosErased}, missing: ${_this.missing}, editable: ${_this.editable}, decision: ${_this.decision}, decidedAt: ${_this.decidedAt}, decisionMethod: ${_this.decisionMethod}, decisionDevice: ${_this.decisionDevice}, reserveText: ${_this.reserveText}, canAnswer: ${_this.canAnswer})';
}


}

/// @nodoc
abstract mixin class $InspectionModelCopyWith<$Res>  {
  factory $InspectionModelCopyWith(InspectionModel value, $Res Function(InspectionModel) _then) = _$InspectionModelCopyWithImpl;
@useResult
$Res call({
 String kind, DateTime startedAt, DateTime? completedAt, String? performedBy, List<DamageModel> damages, int? mileageKm, int? fuelQuarters, String? notes, List<InspectionPhotoModel> photos, bool photosErased, List<String> missing, bool editable, String decision, DateTime? decidedAt, String? decisionMethod, String? decisionDevice, String? reserveText, bool canAnswer
});




}
/// @nodoc
class _$InspectionModelCopyWithImpl<$Res>
    implements $InspectionModelCopyWith<$Res> {
  _$InspectionModelCopyWithImpl(this._self, this._then);

  final InspectionModel _self;
  final $Res Function(InspectionModel) _then;

/// Create a copy of InspectionModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? kind = null,Object? startedAt = null,Object? completedAt = freezed,Object? performedBy = freezed,Object? damages = null,Object? mileageKm = freezed,Object? fuelQuarters = freezed,Object? notes = freezed,Object? photos = null,Object? photosErased = null,Object? missing = null,Object? editable = null,Object? decision = null,Object? decidedAt = freezed,Object? decisionMethod = freezed,Object? decisionDevice = freezed,Object? reserveText = freezed,Object? canAnswer = null,}) {
  return _then(InspectionModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,performedBy: freezed == performedBy ? _self.performedBy : performedBy // ignore: cast_nullable_to_non_nullable
as String?,damages: null == damages ? _self.damages : damages // ignore: cast_nullable_to_non_nullable
as List<DamageModel>,mileageKm: freezed == mileageKm ? _self.mileageKm : mileageKm // ignore: cast_nullable_to_non_nullable
as int?,fuelQuarters: freezed == fuelQuarters ? _self.fuelQuarters : fuelQuarters // ignore: cast_nullable_to_non_nullable
as int?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,photos: null == photos ? _self.photos : photos // ignore: cast_nullable_to_non_nullable
as List<InspectionPhotoModel>,photosErased: null == photosErased ? _self.photosErased : photosErased // ignore: cast_nullable_to_non_nullable
as bool,missing: null == missing ? _self.missing : missing // ignore: cast_nullable_to_non_nullable
as List<String>,editable: null == editable ? _self.editable : editable // ignore: cast_nullable_to_non_nullable
as bool,decision: null == decision ? _self.decision : decision // ignore: cast_nullable_to_non_nullable
as String,decidedAt: freezed == decidedAt ? _self.decidedAt : decidedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,decisionMethod: freezed == decisionMethod ? _self.decisionMethod : decisionMethod // ignore: cast_nullable_to_non_nullable
as String?,decisionDevice: freezed == decisionDevice ? _self.decisionDevice : decisionDevice // ignore: cast_nullable_to_non_nullable
as String?,reserveText: freezed == reserveText ? _self.reserveText : reserveText // ignore: cast_nullable_to_non_nullable
as String?,canAnswer: null == canAnswer ? _self.canAnswer : canAnswer // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [InspectionModel].
extension InspectionModelPatterns on InspectionModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _InspectionModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _InspectionModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _InspectionModel value)  $default,){
final _that = this;
switch (_that) {
case _InspectionModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _InspectionModel value)?  $default,){
final _that = this;
switch (_that) {
case _InspectionModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String kind,  DateTime startedAt,  DateTime? completedAt,  String? performedBy,  List<DamageModel> damages,  int? mileageKm,  int? fuelQuarters,  String? notes,  List<InspectionPhotoModel> photos,  bool photosErased,  List<String> missing,  bool editable,  String decision,  DateTime? decidedAt,  String? decisionMethod,  String? decisionDevice,  String? reserveText,  bool canAnswer)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _InspectionModel() when $default != null:
return $default(_that.kind,_that.startedAt,_that.completedAt,_that.performedBy,_that.damages,_that.mileageKm,_that.fuelQuarters,_that.notes,_that.photos,_that.photosErased,_that.missing,_that.editable,_that.decision,_that.decidedAt,_that.decisionMethod,_that.decisionDevice,_that.reserveText,_that.canAnswer);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String kind,  DateTime startedAt,  DateTime? completedAt,  String? performedBy,  List<DamageModel> damages,  int? mileageKm,  int? fuelQuarters,  String? notes,  List<InspectionPhotoModel> photos,  bool photosErased,  List<String> missing,  bool editable,  String decision,  DateTime? decidedAt,  String? decisionMethod,  String? decisionDevice,  String? reserveText,  bool canAnswer)  $default,) {final _that = this;
switch (_that) {
case _InspectionModel():
return $default(_that.kind,_that.startedAt,_that.completedAt,_that.performedBy,_that.damages,_that.mileageKm,_that.fuelQuarters,_that.notes,_that.photos,_that.photosErased,_that.missing,_that.editable,_that.decision,_that.decidedAt,_that.decisionMethod,_that.decisionDevice,_that.reserveText,_that.canAnswer);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String kind,  DateTime startedAt,  DateTime? completedAt,  String? performedBy,  List<DamageModel> damages,  int? mileageKm,  int? fuelQuarters,  String? notes,  List<InspectionPhotoModel> photos,  bool photosErased,  List<String> missing,  bool editable,  String decision,  DateTime? decidedAt,  String? decisionMethod,  String? decisionDevice,  String? reserveText,  bool canAnswer)?  $default,) {final _that = this;
switch (_that) {
case _InspectionModel() when $default != null:
return $default(_that.kind,_that.startedAt,_that.completedAt,_that.performedBy,_that.damages,_that.mileageKm,_that.fuelQuarters,_that.notes,_that.photos,_that.photosErased,_that.missing,_that.editable,_that.decision,_that.decidedAt,_that.decisionMethod,_that.decisionDevice,_that.reserveText,_that.canAnswer);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _InspectionModel extends InspectionModel {
  const _InspectionModel({required this.kind, required this.startedAt, this.completedAt, this.performedBy,  List<DamageModel> damages = const [], this.mileageKm, this.fuelQuarters, this.notes,  List<InspectionPhotoModel> photos = const [], this.photosErased = false,  List<String> missing = const [], this.editable = false, this.decision = 'pending', this.decidedAt, this.decisionMethod, this.decisionDevice, this.reserveText, this.canAnswer = false}): _damages = damages,_photos = photos,_missing = missing,super._();
  factory _InspectionModel.fromJson(Map<String, dynamic> json) => _$InspectionModelFromJson(json);

/// dropoff | return
@override final  String kind;
@override final  DateTime startedAt;
@override final  DateTime? completedAt;
/// First name of the staff member who took it.
@override final  String? performedBy;
 final  List<DamageModel> _damages;
@override@JsonKey() List<DamageModel> get damages {
  if (_damages is EqualUnmodifiableListView) return _damages;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_damages);
}

@override final  int? mileageKm;
/// 0 to 4 quarters of a tank.
@override final  int? fuelQuarters;
@override final  String? notes;
 final  List<InspectionPhotoModel> _photos;
@override@JsonKey() List<InspectionPhotoModel> get photos {
  if (_photos is EqualUnmodifiableListView) return _photos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_photos);
}

@override@JsonKey() final  bool photosErased;
/// What is still needed to complete it: slots, mileageKm, fuelQuarters.
 final  List<String> _missing;
/// What is still needed to complete it: slots, mileageKm, fuelQuarters.
@override@JsonKey() List<String> get missing {
  if (_missing is EqualUnmodifiableListView) return _missing;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_missing);
}

@override@JsonKey() final  bool editable;
/// pending | accepted | accepted_by_default | reserved
@override@JsonKey() final  String decision;
@override final  DateTime? decidedAt;
@override final  String? decisionMethod;
@override final  String? decisionDevice;
@override final  String? reserveText;
@override@JsonKey() final  bool canAnswer;

/// Create a copy of InspectionModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$InspectionModelCopyWith<_InspectionModel> get copyWith => __$InspectionModelCopyWithImpl<_InspectionModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$InspectionModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _InspectionModel&&(identical(other.kind, kind) || other.kind == kind)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.performedBy, performedBy) || other.performedBy == performedBy)&&const DeepCollectionEquality().equals(other.damages, _damages)&&(identical(other.mileageKm, mileageKm) || other.mileageKm == mileageKm)&&(identical(other.fuelQuarters, fuelQuarters) || other.fuelQuarters == fuelQuarters)&&(identical(other.notes, notes) || other.notes == notes)&&const DeepCollectionEquality().equals(other.photos, _photos)&&(identical(other.photosErased, photosErased) || other.photosErased == photosErased)&&const DeepCollectionEquality().equals(other.missing, _missing)&&(identical(other.editable, editable) || other.editable == editable)&&(identical(other.decision, decision) || other.decision == decision)&&(identical(other.decidedAt, decidedAt) || other.decidedAt == decidedAt)&&(identical(other.decisionMethod, decisionMethod) || other.decisionMethod == decisionMethod)&&(identical(other.decisionDevice, decisionDevice) || other.decisionDevice == decisionDevice)&&(identical(other.reserveText, reserveText) || other.reserveText == reserveText)&&(identical(other.canAnswer, canAnswer) || other.canAnswer == canAnswer));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,kind,startedAt,completedAt,performedBy,const DeepCollectionEquality().hash(_damages),mileageKm,fuelQuarters,notes,const DeepCollectionEquality().hash(_photos),photosErased,const DeepCollectionEquality().hash(_missing),editable,decision,decidedAt,decisionMethod,decisionDevice,reserveText,canAnswer);
}

@override
String toString() {
    return 'InspectionModel(kind: $kind, startedAt: $startedAt, completedAt: $completedAt, performedBy: $performedBy, damages: $damages, mileageKm: $mileageKm, fuelQuarters: $fuelQuarters, notes: $notes, photos: $photos, photosErased: $photosErased, missing: $missing, editable: $editable, decision: $decision, decidedAt: $decidedAt, decisionMethod: $decisionMethod, decisionDevice: $decisionDevice, reserveText: $reserveText, canAnswer: $canAnswer)';
}


}

/// @nodoc
abstract mixin class _$InspectionModelCopyWith<$Res> implements $InspectionModelCopyWith<$Res> {
  factory _$InspectionModelCopyWith(_InspectionModel value, $Res Function(_InspectionModel) _then) = __$InspectionModelCopyWithImpl;
@override @useResult
$Res call({
 String kind, DateTime startedAt, DateTime? completedAt, String? performedBy, List<DamageModel> damages, int? mileageKm, int? fuelQuarters, String? notes, List<InspectionPhotoModel> photos, bool photosErased, List<String> missing, bool editable, String decision, DateTime? decidedAt, String? decisionMethod, String? decisionDevice, String? reserveText, bool canAnswer
});




}
/// @nodoc
class __$InspectionModelCopyWithImpl<$Res>
    implements _$InspectionModelCopyWith<$Res> {
  __$InspectionModelCopyWithImpl(this._self, this._then);

  final _InspectionModel _self;
  final $Res Function(_InspectionModel) _then;

/// Create a copy of InspectionModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? kind = null,Object? startedAt = null,Object? completedAt = freezed,Object? performedBy = freezed,Object? damages = null,Object? mileageKm = freezed,Object? fuelQuarters = freezed,Object? notes = freezed,Object? photos = null,Object? photosErased = null,Object? missing = null,Object? editable = null,Object? decision = null,Object? decidedAt = freezed,Object? decisionMethod = freezed,Object? decisionDevice = freezed,Object? reserveText = freezed,Object? canAnswer = null,}) {
  return _then(_InspectionModel(
kind: null == kind ? _self.kind : kind // ignore: cast_nullable_to_non_nullable
as String,startedAt: null == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,performedBy: freezed == performedBy ? _self.performedBy : performedBy // ignore: cast_nullable_to_non_nullable
as String?,damages: null == damages ? _self._damages : damages // ignore: cast_nullable_to_non_nullable
as List<DamageModel>,mileageKm: freezed == mileageKm ? _self.mileageKm : mileageKm // ignore: cast_nullable_to_non_nullable
as int?,fuelQuarters: freezed == fuelQuarters ? _self.fuelQuarters : fuelQuarters // ignore: cast_nullable_to_non_nullable
as int?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,photos: null == photos ? _self._photos : photos // ignore: cast_nullable_to_non_nullable
as List<InspectionPhotoModel>,photosErased: null == photosErased ? _self.photosErased : photosErased // ignore: cast_nullable_to_non_nullable
as bool,missing: null == missing ? _self._missing : missing // ignore: cast_nullable_to_non_nullable
as List<String>,editable: null == editable ? _self.editable : editable // ignore: cast_nullable_to_non_nullable
as bool,decision: null == decision ? _self.decision : decision // ignore: cast_nullable_to_non_nullable
as String,decidedAt: freezed == decidedAt ? _self.decidedAt : decidedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,decisionMethod: freezed == decisionMethod ? _self.decisionMethod : decisionMethod // ignore: cast_nullable_to_non_nullable
as String?,decisionDevice: freezed == decisionDevice ? _self.decisionDevice : decisionDevice // ignore: cast_nullable_to_non_nullable
as String?,reserveText: freezed == reserveText ? _self.reserveText : reserveText // ignore: cast_nullable_to_non_nullable
as String?,canAnswer: null == canAnswer ? _self.canAnswer : canAnswer // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$ComparisonModel {

 List<DamageModel> get before; List<DamageModel> get after; int? get mileageDeltaKm; int? get fuelDeltaQuarters;
/// Create a copy of ComparisonModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ComparisonModelCopyWith<ComparisonModel> get copyWith => _$ComparisonModelCopyWithImpl<ComparisonModel>(this as ComparisonModel, _$identity);

  /// Serializes this ComparisonModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as ComparisonModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ComparisonModel&&const DeepCollectionEquality().equals(other.before, _this.before)&&const DeepCollectionEquality().equals(other.after, _this.after)&&(identical(other.mileageDeltaKm, _this.mileageDeltaKm) || other.mileageDeltaKm == _this.mileageDeltaKm)&&(identical(other.fuelDeltaQuarters, _this.fuelDeltaQuarters) || other.fuelDeltaQuarters == _this.fuelDeltaQuarters));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as ComparisonModel;
  return Object.hash(runtimeType,const DeepCollectionEquality().hash(_this.before),const DeepCollectionEquality().hash(_this.after),_this.mileageDeltaKm,_this.fuelDeltaQuarters);
}

@override
String toString() {
  final _this = this as ComparisonModel;
  return 'ComparisonModel(before: ${_this.before}, after: ${_this.after}, mileageDeltaKm: ${_this.mileageDeltaKm}, fuelDeltaQuarters: ${_this.fuelDeltaQuarters})';
}


}

/// @nodoc
abstract mixin class $ComparisonModelCopyWith<$Res>  {
  factory $ComparisonModelCopyWith(ComparisonModel value, $Res Function(ComparisonModel) _then) = _$ComparisonModelCopyWithImpl;
@useResult
$Res call({
 List<DamageModel> before, List<DamageModel> after, int? mileageDeltaKm, int? fuelDeltaQuarters
});




}
/// @nodoc
class _$ComparisonModelCopyWithImpl<$Res>
    implements $ComparisonModelCopyWith<$Res> {
  _$ComparisonModelCopyWithImpl(this._self, this._then);

  final ComparisonModel _self;
  final $Res Function(ComparisonModel) _then;

/// Create a copy of ComparisonModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? before = null,Object? after = null,Object? mileageDeltaKm = freezed,Object? fuelDeltaQuarters = freezed,}) {
  return _then(ComparisonModel(
before: null == before ? _self.before : before // ignore: cast_nullable_to_non_nullable
as List<DamageModel>,after: null == after ? _self.after : after // ignore: cast_nullable_to_non_nullable
as List<DamageModel>,mileageDeltaKm: freezed == mileageDeltaKm ? _self.mileageDeltaKm : mileageDeltaKm // ignore: cast_nullable_to_non_nullable
as int?,fuelDeltaQuarters: freezed == fuelDeltaQuarters ? _self.fuelDeltaQuarters : fuelDeltaQuarters // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [ComparisonModel].
extension ComparisonModelPatterns on ComparisonModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ComparisonModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ComparisonModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ComparisonModel value)  $default,){
final _that = this;
switch (_that) {
case _ComparisonModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ComparisonModel value)?  $default,){
final _that = this;
switch (_that) {
case _ComparisonModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<DamageModel> before,  List<DamageModel> after,  int? mileageDeltaKm,  int? fuelDeltaQuarters)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ComparisonModel() when $default != null:
return $default(_that.before,_that.after,_that.mileageDeltaKm,_that.fuelDeltaQuarters);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<DamageModel> before,  List<DamageModel> after,  int? mileageDeltaKm,  int? fuelDeltaQuarters)  $default,) {final _that = this;
switch (_that) {
case _ComparisonModel():
return $default(_that.before,_that.after,_that.mileageDeltaKm,_that.fuelDeltaQuarters);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<DamageModel> before,  List<DamageModel> after,  int? mileageDeltaKm,  int? fuelDeltaQuarters)?  $default,) {final _that = this;
switch (_that) {
case _ComparisonModel() when $default != null:
return $default(_that.before,_that.after,_that.mileageDeltaKm,_that.fuelDeltaQuarters);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ComparisonModel implements ComparisonModel {
  const _ComparisonModel({ List<DamageModel> before = const [],  List<DamageModel> after = const [], this.mileageDeltaKm, this.fuelDeltaQuarters}): _before = before,_after = after;
  factory _ComparisonModel.fromJson(Map<String, dynamic> json) => _$ComparisonModelFromJson(json);

 final  List<DamageModel> _before;
@override@JsonKey() List<DamageModel> get before {
  if (_before is EqualUnmodifiableListView) return _before;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_before);
}

 final  List<DamageModel> _after;
@override@JsonKey() List<DamageModel> get after {
  if (_after is EqualUnmodifiableListView) return _after;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_after);
}

@override final  int? mileageDeltaKm;
@override final  int? fuelDeltaQuarters;

/// Create a copy of ComparisonModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ComparisonModelCopyWith<_ComparisonModel> get copyWith => __$ComparisonModelCopyWithImpl<_ComparisonModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ComparisonModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _ComparisonModel&&const DeepCollectionEquality().equals(other.before, _before)&&const DeepCollectionEquality().equals(other.after, _after)&&(identical(other.mileageDeltaKm, mileageDeltaKm) || other.mileageDeltaKm == mileageDeltaKm)&&(identical(other.fuelDeltaQuarters, fuelDeltaQuarters) || other.fuelDeltaQuarters == fuelDeltaQuarters));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,const DeepCollectionEquality().hash(_before),const DeepCollectionEquality().hash(_after),mileageDeltaKm,fuelDeltaQuarters);
}

@override
String toString() {
    return 'ComparisonModel(before: $before, after: $after, mileageDeltaKm: $mileageDeltaKm, fuelDeltaQuarters: $fuelDeltaQuarters)';
}


}

/// @nodoc
abstract mixin class _$ComparisonModelCopyWith<$Res> implements $ComparisonModelCopyWith<$Res> {
  factory _$ComparisonModelCopyWith(_ComparisonModel value, $Res Function(_ComparisonModel) _then) = __$ComparisonModelCopyWithImpl;
@override @useResult
$Res call({
 List<DamageModel> before, List<DamageModel> after, int? mileageDeltaKm, int? fuelDeltaQuarters
});




}
/// @nodoc
class __$ComparisonModelCopyWithImpl<$Res>
    implements _$ComparisonModelCopyWith<$Res> {
  __$ComparisonModelCopyWithImpl(this._self, this._then);

  final _ComparisonModel _self;
  final $Res Function(_ComparisonModel) _then;

/// Create a copy of ComparisonModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? before = null,Object? after = null,Object? mileageDeltaKm = freezed,Object? fuelDeltaQuarters = freezed,}) {
  return _then(_ComparisonModel(
before: null == before ? _self._before : before // ignore: cast_nullable_to_non_nullable
as List<DamageModel>,after: null == after ? _self._after : after // ignore: cast_nullable_to_non_nullable
as List<DamageModel>,mileageDeltaKm: freezed == mileageDeltaKm ? _self.mileageDeltaKm : mileageDeltaKm // ignore: cast_nullable_to_non_nullable
as int?,fuelDeltaQuarters: freezed == fuelDeltaQuarters ? _self.fuelDeltaQuarters : fuelDeltaQuarters // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$CodeSentModel {

 String get sentTo; DateTime get expiresAt; int get resendAfterSeconds;
/// Create a copy of CodeSentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CodeSentModelCopyWith<CodeSentModel> get copyWith => _$CodeSentModelCopyWithImpl<CodeSentModel>(this as CodeSentModel, _$identity);

  /// Serializes this CodeSentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as CodeSentModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CodeSentModel&&(identical(other.sentTo, _this.sentTo) || other.sentTo == _this.sentTo)&&(identical(other.expiresAt, _this.expiresAt) || other.expiresAt == _this.expiresAt)&&(identical(other.resendAfterSeconds, _this.resendAfterSeconds) || other.resendAfterSeconds == _this.resendAfterSeconds));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as CodeSentModel;
  return Object.hash(runtimeType,_this.sentTo,_this.expiresAt,_this.resendAfterSeconds);
}

@override
String toString() {
  final _this = this as CodeSentModel;
  return 'CodeSentModel(sentTo: ${_this.sentTo}, expiresAt: ${_this.expiresAt}, resendAfterSeconds: ${_this.resendAfterSeconds})';
}


}

/// @nodoc
abstract mixin class $CodeSentModelCopyWith<$Res>  {
  factory $CodeSentModelCopyWith(CodeSentModel value, $Res Function(CodeSentModel) _then) = _$CodeSentModelCopyWithImpl;
@useResult
$Res call({
 String sentTo, DateTime expiresAt, int resendAfterSeconds
});




}
/// @nodoc
class _$CodeSentModelCopyWithImpl<$Res>
    implements $CodeSentModelCopyWith<$Res> {
  _$CodeSentModelCopyWithImpl(this._self, this._then);

  final CodeSentModel _self;
  final $Res Function(CodeSentModel) _then;

/// Create a copy of CodeSentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? sentTo = null,Object? expiresAt = null,Object? resendAfterSeconds = null,}) {
  return _then(CodeSentModel(
sentTo: null == sentTo ? _self.sentTo : sentTo // ignore: cast_nullable_to_non_nullable
as String,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,resendAfterSeconds: null == resendAfterSeconds ? _self.resendAfterSeconds : resendAfterSeconds // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [CodeSentModel].
extension CodeSentModelPatterns on CodeSentModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CodeSentModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CodeSentModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CodeSentModel value)  $default,){
final _that = this;
switch (_that) {
case _CodeSentModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CodeSentModel value)?  $default,){
final _that = this;
switch (_that) {
case _CodeSentModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String sentTo,  DateTime expiresAt,  int resendAfterSeconds)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CodeSentModel() when $default != null:
return $default(_that.sentTo,_that.expiresAt,_that.resendAfterSeconds);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String sentTo,  DateTime expiresAt,  int resendAfterSeconds)  $default,) {final _that = this;
switch (_that) {
case _CodeSentModel():
return $default(_that.sentTo,_that.expiresAt,_that.resendAfterSeconds);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String sentTo,  DateTime expiresAt,  int resendAfterSeconds)?  $default,) {final _that = this;
switch (_that) {
case _CodeSentModel() when $default != null:
return $default(_that.sentTo,_that.expiresAt,_that.resendAfterSeconds);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CodeSentModel implements CodeSentModel {
  const _CodeSentModel({required this.sentTo, required this.expiresAt, this.resendAfterSeconds = 60});
  factory _CodeSentModel.fromJson(Map<String, dynamic> json) => _$CodeSentModelFromJson(json);

@override final  String sentTo;
@override final  DateTime expiresAt;
@override@JsonKey() final  int resendAfterSeconds;

/// Create a copy of CodeSentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CodeSentModelCopyWith<_CodeSentModel> get copyWith => __$CodeSentModelCopyWithImpl<_CodeSentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CodeSentModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _CodeSentModel&&(identical(other.sentTo, sentTo) || other.sentTo == sentTo)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.resendAfterSeconds, resendAfterSeconds) || other.resendAfterSeconds == resendAfterSeconds));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,sentTo,expiresAt,resendAfterSeconds);
}

@override
String toString() {
    return 'CodeSentModel(sentTo: $sentTo, expiresAt: $expiresAt, resendAfterSeconds: $resendAfterSeconds)';
}


}

/// @nodoc
abstract mixin class _$CodeSentModelCopyWith<$Res> implements $CodeSentModelCopyWith<$Res> {
  factory _$CodeSentModelCopyWith(_CodeSentModel value, $Res Function(_CodeSentModel) _then) = __$CodeSentModelCopyWithImpl;
@override @useResult
$Res call({
 String sentTo, DateTime expiresAt, int resendAfterSeconds
});




}
/// @nodoc
class __$CodeSentModelCopyWithImpl<$Res>
    implements _$CodeSentModelCopyWith<$Res> {
  __$CodeSentModelCopyWithImpl(this._self, this._then);

  final _CodeSentModel _self;
  final $Res Function(_CodeSentModel) _then;

/// Create a copy of CodeSentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? sentTo = null,Object? expiresAt = null,Object? resendAfterSeconds = null,}) {
  return _then(_CodeSentModel(
sentTo: null == sentTo ? _self.sentTo : sentTo // ignore: cast_nullable_to_non_nullable
as String,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,resendAfterSeconds: null == resendAfterSeconds ? _self.resendAfterSeconds : resendAfterSeconds // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$AddedPhotoModel {

 String get photoId; PaperworkModel get paperwork;
/// Create a copy of AddedPhotoModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AddedPhotoModelCopyWith<AddedPhotoModel> get copyWith => _$AddedPhotoModelCopyWithImpl<AddedPhotoModel>(this as AddedPhotoModel, _$identity);

  /// Serializes this AddedPhotoModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as AddedPhotoModel;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AddedPhotoModel&&(identical(other.photoId, _this.photoId) || other.photoId == _this.photoId)&&(identical(other.paperwork, _this.paperwork) || other.paperwork == _this.paperwork));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as AddedPhotoModel;
  return Object.hash(runtimeType,_this.photoId,_this.paperwork);
}

@override
String toString() {
  final _this = this as AddedPhotoModel;
  return 'AddedPhotoModel(photoId: ${_this.photoId}, paperwork: ${_this.paperwork})';
}


}

/// @nodoc
abstract mixin class $AddedPhotoModelCopyWith<$Res>  {
  factory $AddedPhotoModelCopyWith(AddedPhotoModel value, $Res Function(AddedPhotoModel) _then) = _$AddedPhotoModelCopyWithImpl;
@useResult
$Res call({
 String photoId, PaperworkModel paperwork
});


$PaperworkModelCopyWith<$Res> get paperwork;

}
/// @nodoc
class _$AddedPhotoModelCopyWithImpl<$Res>
    implements $AddedPhotoModelCopyWith<$Res> {
  _$AddedPhotoModelCopyWithImpl(this._self, this._then);

  final AddedPhotoModel _self;
  final $Res Function(AddedPhotoModel) _then;

/// Create a copy of AddedPhotoModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? photoId = null,Object? paperwork = null,}) {
  return _then(AddedPhotoModel(
photoId: null == photoId ? _self.photoId : photoId // ignore: cast_nullable_to_non_nullable
as String,paperwork: null == paperwork ? _self.paperwork : paperwork // ignore: cast_nullable_to_non_nullable
as PaperworkModel,
  ));
}
/// Create a copy of AddedPhotoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PaperworkModelCopyWith<$Res> get paperwork {
  
  return $PaperworkModelCopyWith<$Res>(_self.paperwork, (value) {
    return _then(_self.copyWith(paperwork: value));
  });
}
}


/// Adds pattern-matching-related methods to [AddedPhotoModel].
extension AddedPhotoModelPatterns on AddedPhotoModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AddedPhotoModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AddedPhotoModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AddedPhotoModel value)  $default,){
final _that = this;
switch (_that) {
case _AddedPhotoModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AddedPhotoModel value)?  $default,){
final _that = this;
switch (_that) {
case _AddedPhotoModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String photoId,  PaperworkModel paperwork)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AddedPhotoModel() when $default != null:
return $default(_that.photoId,_that.paperwork);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String photoId,  PaperworkModel paperwork)  $default,) {final _that = this;
switch (_that) {
case _AddedPhotoModel():
return $default(_that.photoId,_that.paperwork);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String photoId,  PaperworkModel paperwork)?  $default,) {final _that = this;
switch (_that) {
case _AddedPhotoModel() when $default != null:
return $default(_that.photoId,_that.paperwork);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AddedPhotoModel implements AddedPhotoModel {
  const _AddedPhotoModel({required this.photoId, required this.paperwork});
  factory _AddedPhotoModel.fromJson(Map<String, dynamic> json) => _$AddedPhotoModelFromJson(json);

@override final  String photoId;
@override final  PaperworkModel paperwork;

/// Create a copy of AddedPhotoModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AddedPhotoModelCopyWith<_AddedPhotoModel> get copyWith => __$AddedPhotoModelCopyWithImpl<_AddedPhotoModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AddedPhotoModelToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _AddedPhotoModel&&(identical(other.photoId, photoId) || other.photoId == photoId)&&(identical(other.paperwork, paperwork) || other.paperwork == paperwork));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,photoId,paperwork);
}

@override
String toString() {
    return 'AddedPhotoModel(photoId: $photoId, paperwork: $paperwork)';
}


}

/// @nodoc
abstract mixin class _$AddedPhotoModelCopyWith<$Res> implements $AddedPhotoModelCopyWith<$Res> {
  factory _$AddedPhotoModelCopyWith(_AddedPhotoModel value, $Res Function(_AddedPhotoModel) _then) = __$AddedPhotoModelCopyWithImpl;
@override @useResult
$Res call({
 String photoId, PaperworkModel paperwork
});


@override $PaperworkModelCopyWith<$Res> get paperwork;

}
/// @nodoc
class __$AddedPhotoModelCopyWithImpl<$Res>
    implements _$AddedPhotoModelCopyWith<$Res> {
  __$AddedPhotoModelCopyWithImpl(this._self, this._then);

  final _AddedPhotoModel _self;
  final $Res Function(_AddedPhotoModel) _then;

/// Create a copy of AddedPhotoModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? photoId = null,Object? paperwork = null,}) {
  return _then(_AddedPhotoModel(
photoId: null == photoId ? _self.photoId : photoId // ignore: cast_nullable_to_non_nullable
as String,paperwork: null == paperwork ? _self.paperwork : paperwork // ignore: cast_nullable_to_non_nullable
as PaperworkModel,
  ));
}

/// Create a copy of AddedPhotoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PaperworkModelCopyWith<$Res> get paperwork {
  
  return $PaperworkModelCopyWith<$Res>(_self.paperwork, (value) {
    return _then(_self.copyWith(paperwork: value));
  });
}
}

// dart format on
