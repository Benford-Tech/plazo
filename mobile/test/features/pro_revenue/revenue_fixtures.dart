import 'package:parking_app/src/features/pro_revenue/data/models/revenue_models.dart';

/// October 2026 for a parking whose today is the 13th (P-B's mockup figures).
final octoberReport = RevenueReportModel(
  from: '2026-10-01',
  to: '2026-10-31',
  timezone: 'Europe/Paris',
  today: '2026-10-13',
  totalCents: 1248000,
  count: 86,
  averageCents: 14512,
  averageDays: 6.4,
  withoutAmount: 3,
  byChannel: const [
    RevenueChannelModel(channel: 'plazo', count: 31, totalCents: 421000),
    RevenueChannelModel(channel: 'aggregator', detail: 'Allopark', count: 28, totalCents: 398000),
    RevenueChannelModel(channel: 'phone', count: 8, totalCents: 124000),
  ],
  byDay: [
    for (var d = 1; d <= 31; d++)
      RevenueDayModel(date: '2026-10-${d.toString().padLeft(2, '0')}', count: d == 3 ? 6 : 2, totalCents: d == 3 ? 79000 : (d <= 13 ? 30000 : 10000)),
  ],
  missing: [
    RevenueMissingModel(
      id: 'r1',
      reference: 'AL-48213',
      customerName: 'Marc Petit',
      plate: 'AZ-902-LC',
      arrivalAt: DateTime.utc(2026, 10, 21, 6),
      channel: 'aggregator',
      detail: 'Allopark',
    ),
    RevenueMissingModel(
      id: 'r2',
      reference: 'R-7Q2KD',
      customerName: 'Inès Rousseau',
      plate: 'JK-789-LM',
      arrivalAt: DateTime.utc(2026, 10, 17, 6),
      channel: 'phone',
    ),
    RevenueMissingModel(
      id: 'r3',
      reference: 'OP-55102',
      customerName: 'Hugo Lambert',
      arrivalAt: DateTime.utc(2026, 10, 9, 6),
      channel: 'aggregator',
      detail: 'Onepark',
    ),
  ],
);

const summary = RevenueSummaryModel(
  today: '2026-10-13',
  month: RevenueMonthModel(from: '2026-10-01', to: '2026-10-31', totalCents: 1248000, count: 86, withoutAmount: 3),
  todayCents: 32000,
  weekCents: 214000,
);
