import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../services/share_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../data/datasources/paperwork_data_source.dart';
import '../../data/models/paperwork_models.dart';
import '../bloc/paperwork_bloc.dart';
import '../widgets/paperwork_widgets.dart';

/// Plazo Pro: the traveller signs the parking contract at the counter, with the code sent to their phone or by hand.
@RoutePage()
class ProContractPage extends StatelessWidget implements AutoRouteWrapper {
  const ProContractPage({super.key, @PathParam('id') required this.id});
  final String id;

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(StaffOwner(id))), child: this);

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: BrandAppBar(pro: true, title: 'paperwork.contract_title'.tr()),
    body: const SafeArea(top: false, child: _ContractBody(staff: true)),
  );
}

/// Plazo: the traveller reads their contract before the day; it is signed at the counter (choice of the 20/10/2026), with
/// a code sent to their phone and typed on the parking's, or by hand.
@RoutePage()
class TravellerContractPage extends StatelessWidget implements AutoRouteWrapper {
  const TravellerContractPage({super.key, @PathParam('reference') required this.reference});
  final String reference;

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<PaperworkBloc>()..add(PaperworkStarted(TravellerOwner(reference))), child: this);

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text('paperwork.contract_title'.tr(), style: AppText.strong(size: 16, color: AppColors.brownOrInk)),
    ),
    body: const SafeArea(top: false, child: _ContractBody(staff: false)),
  );
}

class _ContractBody extends StatefulWidget {
  const _ContractBody({required this.staff});
  final bool staff;

  @override
  State<_ContractBody> createState() => _ContractBodyState();
}

class _ContractBodyState extends State<_ContractBody> {
  final _code = TextEditingController();
  final _signature = SignatureController();
  bool _accepted = false;
  String _method = 'code';

  @override
  void dispose() {
    _code.dispose();
    _signature.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<PaperworkBloc, PaperworkState>(
      listenWhen: (a, b) => (a.errorMessage != b.errorMessage && b.errorMessage != null && b.data != null) || (a.notice != b.notice && b.notice != null),
      listener: (context, state) {
        final text = state.notice != null ? 'paperwork.notice.${state.notice}'.tr() : state.errorMessage;
        if (text != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
        context.read<PaperworkBloc>().add(const PaperworkErrorDismissed());
      },
      builder: (context, state) {
        final contract = state.data?.contract;
        if (contract == null) {
          return Center(
            child: state.viewState.isError
                ? Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center),
                  )
                : const CircularProgressIndicator(color: AppColors.accent),
          );
        }
        final doc = contract.document;
        // Without SMS (no mobile, or SMS off), the counter signs by hand.
        final method = !contract.codeAvailable ? 'hand' : _method;
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            Semantics(header: true, child: Text(doc.title, style: AppText.title(size: 24))),
            const SizedBox(height: 12),
            // The parking's own PDF (26/10/2026, choice A): read it before signing.
            if (contract.template != null) ...[_TemplateCard(template: contract.template!, owner: state.owner), const SizedBox(height: 10)],
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (final line in doc.summary)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(line, style: AppText.body(size: 14)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('paperwork.contract_clauses'.tr().toUpperCase(), style: AppText.label(size: 11)),
                  const SizedBox(height: 6),
                  for (final (i, clause) in doc.clauses.indexed)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text('${i + 1}. $clause', style: AppText.body(size: 13.5, height: 1.45)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            if (contract.isSigned)
              _Signed(signed: contract.signed!, files: contract.files, owner: state.owner)
            else if (!widget.staff && contract.atCounter)
              AppCard(
                key: const Key('contract-at-counter'),
                color: AppColors.canvas,
                child: Text('paperwork.contract_at_counter'.tr(), style: AppText.body(size: 14)),
              )
            else if (!contract.canSign)
              Text('paperwork.contract_closed'.tr(), style: AppText.muted(size: 13.5), textAlign: TextAlign.center)
            else ...[
              CheckboxListTile(
                key: const Key('contract-accept'),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                value: _accepted,
                onChanged: (v) => setState(() => _accepted = v ?? false),
                title: Text('paperwork.contract_accept_staff'.tr(), style: AppText.body(size: 14)),
              ),
              if (contract.codeAvailable) ...[
                Segmented<String>(
                  values: const ['code', 'hand'],
                  labels: ['paperwork.method_code'.tr(), 'paperwork.method_hand'.tr()],
                  selected: method,
                  onChanged: (m) => setState(() => _method = m),
                ),
                const SizedBox(height: 12),
              ],
              if (method == 'code') ..._codeStep(context, state, contract) else ..._handStep(context, state),
            ],
          ],
        );
      },
    );
  }

  List<Widget> _codeStep(BuildContext context, PaperworkState state, ContractModel contract) {
    final bloc = context.read<PaperworkBloc>();
    final sent = state.codeSent;
    return [
      if (sent == null)
        GradientButton(
          key: const Key('contract-send-code'),
          label: 'paperwork.send_code'.tr(args: [contract.phoneMasked]),
          icon: Icons.sms_outlined,
          busy: state.busy,
          onPressed: !_accepted || state.busy ? null : () => bloc.add(const PaperworkCodeRequested()),
        )
      else ...[
        Text('paperwork.code_sent'.tr(args: [sent.sentTo]), style: AppText.body(size: 13.5)),
        const SizedBox(height: 8),
        TextField(
          key: const Key('contract-code'),
          controller: _code,
          autofocus: true,
          keyboardType: TextInputType.number,
          autofillHints: const [AutofillHints.oneTimeCode],
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
          textAlign: TextAlign.center,
          style: AppText.tabular(size: 24).copyWith(letterSpacing: 8),
          decoration: InputDecoration(labelText: 'paperwork.code_label'.tr(), errorText: state.errorFields?['code'] != null ? 'errors.wrong_code'.tr() : null),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            key: const Key('contract-resend'),
            onPressed: state.busy ? null : () => bloc.add(const PaperworkCodeRequested()),
            child: Text('paperwork.resend_code'.tr()),
          ),
        ),
        const SizedBox(height: 4),
        GradientButton(
          key: const Key('contract-sign'),
          label: 'paperwork.sign_contract'.tr(),
          busy: state.busy,
          onPressed: !_accepted || _code.text.length != 6 || state.busy ? null : () => bloc.add(PaperworkSigned(code: _code.text)),
        ),
      ],
      const SizedBox(height: 8),
      Text('paperwork.signature_note'.tr(), style: AppText.muted(size: 12), textAlign: TextAlign.center),
    ];
  }

  List<Widget> _handStep(BuildContext context, PaperworkState state) {
    final bloc = context.read<PaperworkBloc>();
    return [
      SignaturePad(controller: _signature),
      const SizedBox(height: 12),
      ListenableBuilder(
        listenable: _signature,
        builder: (context, _) => GradientButton(
          key: const Key('contract-sign-hand'),
          label: 'paperwork.sign_contract'.tr(),
          busy: state.busy,
          onPressed: !_accepted || !_signature.signed || state.busy ? null : () => bloc.add(PaperworkSigned(strokes: _signature.toJson())),
        ),
      ),
    ];
  }
}

/// Opens a contract PDF through the phone's share sheet (the apps have no PDF viewer of their own).
Future<void> _openContractFile(BuildContext context, PaperworkOwner? owner, String kind, String name) async {
  if (owner == null) return;
  final messenger = ScaffoldMessenger.of(context);
  try {
    final bytes = await locator<PaperworkDataSource>().contractFile(owner, kind);
    await locator<ShareService>().shareBytes(bytes, name: name, mimeType: 'application/pdf');
  } catch (_) {
    messenger.showSnackBar(SnackBar(content: Text('paperwork.file_error'.tr())));
  }
}

/// « Contrat du parking » (26/10/2026): the PDF the parking hosts, its version and its pages, to open before signing.
class _TemplateCard extends StatelessWidget {
  const _TemplateCard({required this.template, required this.owner});
  final ContractTemplateInfo template;
  final PaperworkOwner? owner;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      key: const Key('contract-template'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('paperwork.template_title'.tr().toUpperCase(), style: AppText.label(size: 11)),
          const SizedBox(height: 6),
          Text(template.title, style: AppText.strong(size: 15)),
          const SizedBox(height: 2),
          Text('paperwork.template_line'.tr(args: [template.version.toString(), template.pageCount.toString()]), style: AppText.muted(size: 13)),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              key: const Key('contract-template-open'),
              onPressed: () => _openContractFile(context, owner, 'template', template.fileName),
              icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
              label: Text('paperwork.template_open'.tr()),
            ),
          ),
        ],
      ),
    );
  }
}

class _Signed extends StatelessWidget {
  const _Signed({required this.signed, required this.files, required this.owner});
  final SignedContractModel signed;
  final ContractFiles files;
  final PaperworkOwner? owner;

  @override
  Widget build(BuildContext context) {
    final at = DateFormat("d MMMM y 'à' HH:mm", 'fr').format(signed.signedAt.toLocal());
    final how = signed.method == 'sms_code' ? 'paperwork.signed_by_code'.tr(args: [signed.phoneMasked ?? '']) : 'paperwork.signed_by_hand'.tr();
    return AppCard(
      key: const Key('contract-signed'),
      color: AppStatus.okSoft,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_rounded, color: AppStatus.ok),
              const SizedBox(width: 8),
              Expanded(
                child: Text('paperwork.signed_on'.tr(args: [signed.signerName, at]), style: AppText.strong(size: 14.5)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(how, style: AppText.body(size: 13)),
          const SizedBox(height: 4),
          Text('paperwork.proof'.tr(args: [signed.version, signed.proofSha256.substring(0, 16)]), style: AppText.muted(size: 11.5)),
          // The PDF signed and its proof (26/10/2026), kept by Plazo and opened through the share sheet.
          if (files.signed || files.proof) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (files.signed)
                  OutlinedButton.icon(
                    key: const Key('contract-signed-open'),
                    onPressed: () => _openContractFile(context, owner, 'signed', 'contrat-signe.pdf'),
                    icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                    label: Text('paperwork.signed_pdf'.tr()),
                  ),
                if (files.proof)
                  OutlinedButton.icon(
                    key: const Key('contract-proof-open'),
                    onPressed: () => _openContractFile(context, owner, 'proof', 'preuve-signature.pdf'),
                    icon: const Icon(Icons.verified_outlined, size: 18),
                    label: Text('paperwork.proof_pdf'.tr()),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
