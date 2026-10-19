import 'dart:typed_data';

import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../../data/models/paperwork_models.dart';
import '../repositories/paperwork_repository.dart';

class LoadPaperworkUseCase with UseCase<PaperworkModel, PaperworkOwner> {
  LoadPaperworkUseCase(this._repository);
  final PaperworkRepository _repository;
  @override
  Future<Either<Failure, PaperworkModel>> call(PaperworkOwner params) => _repository.load(params);
}

class SendSignatureCodeUseCase with UseCase<CodeSentModel, PaperworkOwner> {
  SendSignatureCodeUseCase(this._repository);
  final PaperworkRepository _repository;
  @override
  Future<Either<Failure, CodeSentModel>> call(PaperworkOwner params) => _repository.sendCode(params);
}

class SignContractParams extends Equatable {
  const SignContractParams(this.owner, {this.code, this.strokes});
  final PaperworkOwner owner;
  final String? code;
  final List<List<List<double>>>? strokes;
  @override
  List<Object?> get props => [owner, code, strokes];
}

class SignContractUseCase with UseCase<PaperworkModel, SignContractParams> {
  SignContractUseCase(this._repository);
  final PaperworkRepository _repository;
  @override
  Future<Either<Failure, PaperworkModel>> call(SignContractParams params) => _repository.sign(params.owner, code: params.code, strokes: params.strokes);
}

class AnswerInspectionParams extends Equatable {
  const AnswerInspectionParams(this.owner, this.kind, {required this.decision, this.reserveText, this.strokes});
  final PaperworkOwner owner;
  final String kind;

  /// accepted | reserved
  final String decision;
  final String? reserveText;
  final List<List<List<double>>>? strokes;
  @override
  List<Object?> get props => [owner, kind, decision, reserveText, strokes];
}

class AnswerInspectionUseCase with UseCase<PaperworkModel, AnswerInspectionParams> {
  AnswerInspectionUseCase(this._repository);
  final PaperworkRepository _repository;
  @override
  Future<Either<Failure, PaperworkModel>> call(AnswerInspectionParams params) =>
      _repository.answer(params.owner, params.kind, decision: params.decision, reserveText: params.reserveText, strokes: params.strokes);
}

class InspectionPhotoParams extends Equatable {
  const InspectionPhotoParams(this.owner, this.kind, this.photoId);
  final PaperworkOwner owner;
  final String kind;
  final String photoId;
  @override
  List<Object?> get props => [owner, kind, photoId];
}

class LoadInspectionPhotoUseCase with UseCase<Uint8List, InspectionPhotoParams> {
  LoadInspectionPhotoUseCase(this._repository);
  final PaperworkRepository _repository;
  @override
  Future<Either<Failure, Uint8List>> call(InspectionPhotoParams params) => _repository.photo(params.owner, params.kind, params.photoId);
}

/// What the staff does to a report being taken (Plazo Pro).
sealed class InspectionEdit {
  const InspectionEdit(this.reservationId, this.kind);
  final String reservationId;
  final String kind;
}

class StartInspection extends InspectionEdit {
  const StartInspection(super.reservationId, super.kind);
}

class UpdateInspection extends InspectionEdit {
  const UpdateInspection(super.reservationId, super.kind, this.body);
  final Map<String, dynamic> body;
}

class AddInspectionPhoto extends InspectionEdit {
  const AddInspectionPhoto(super.reservationId, super.kind, this.slot, this.bytes);
  final String slot;
  final Uint8List bytes;
}

class RemoveInspectionPhoto extends InspectionEdit {
  const RemoveInspectionPhoto(super.reservationId, super.kind, this.photoId);
  final String photoId;
}

/// Saves the last typed values ([body]: mileage, notes), then locks the report.
class CompleteInspection extends InspectionEdit {
  const CompleteInspection(super.reservationId, super.kind, {this.body = const {}});
  final Map<String, dynamic> body;
}

/// Returns the paperwork after the change.
class EditInspectionUseCase with UseCase<PaperworkModel, InspectionEdit> {
  EditInspectionUseCase(this._repository);
  final PaperworkRepository _repository;

  @override
  Future<Either<Failure, PaperworkModel>> call(InspectionEdit params) async {
    switch (params) {
      case StartInspection(:final reservationId, :final kind):
        return _repository.start(reservationId, kind);
      case UpdateInspection(:final reservationId, :final kind, :final body):
        return _repository.update(reservationId, kind, body);
      case AddInspectionPhoto(:final reservationId, :final kind, :final slot, :final bytes):
        final result = await _repository.addPhoto(reservationId, kind, slot, bytes);
        return result.fold(Left.new, (added) => Right(added.paperwork));
      case RemoveInspectionPhoto(:final reservationId, :final kind, :final photoId):
        return _repository.removePhoto(reservationId, kind, photoId);
      case CompleteInspection(:final reservationId, :final kind, :final body):
        if (body.isNotEmpty) {
          final saved = await _repository.update(reservationId, kind, body);
          if (saved.isLeft) return saved;
        }
        return _repository.complete(reservationId, kind);
    }
  }
}
