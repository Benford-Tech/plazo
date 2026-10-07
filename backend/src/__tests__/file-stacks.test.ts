import { blockersIn, movesToday, planEmptyFiles, positionFromAisle, rankFiles, type StackCar, type StackFile } from '@/domain/file-stacks';

const day = (d: string, h = 10) => new Date(`2026-10-${d}T${String(h).padStart(2, '0')}:00:00Z`);
const car = (id: string, returnAt: Date, rank: number): StackCar => ({
  reservationId: id,
  reference: id,
  plate: id,
  customerName: id,
  returnAt,
  rank,
});
const file = (id: string, cars: StackCar[], extra: Partial<StackFile> = {}): StackFile => ({
  id,
  code: id,
  capacity: 5,
  active: true,
  sortOrder: Number(id.replace(/\D/g, '')) || 0,
  plannedDay: null,
  cars,
  ...extra,
});

describe('file stacks (S-C, 07/10/2026)', () => {
  it('a sound file has its returns getting closer from the back to the aisle', () => {
    const f = file('F1', [car('a', day('20'), 1), car('b', day('15'), 2), car('c', day('12'), 3)]);
    expect(blockersIn(f).size).toBe(0);
    expect(positionFromAisle(f, 'c')).toBe(1);
    expect(positionFromAisle(f, 'a')).toBe(3);
  });

  it('counts the cars to take out when a car in front leaves later', () => {
    const f = file('F1', [car('a', day('12'), 1), car('b', day('20'), 2), car('c', day('21'), 3)]);
    expect([...blockersIn(f).keys()]).toEqual(['a', 'b']);
    expect(
      blockersIn(f)
        .get('a')
        ?.map(c => c.reservationId),
    ).toEqual(['b', 'c']);
    expect(movesToday(f, day('12', 0), day('13', 0))).toBe(2);
    expect(movesToday(f, day('20', 0), day('21', 0))).toBe(1);
    expect(movesToday(f, day('21', 0), day('22', 0))).toBe(0);
  });

  it('sends an arriving car to the tightest file that still leaves after it, never in front of an earlier return', () => {
    const files = [
      file('F1', [car('a', day('20'), 1)]), // leaves after: fits, loose
      file('F2', [car('b', day('13'), 1)]), // leaves after: tightest fit
      file('F3', [car('c', day('11'), 1)]), // leaves before: would be blocked
      file('F4', []),
    ];
    const ranked = rankFiles(files, { returnAt: day('12'), returnDay: '2026-10-12' });
    expect(ranked.map(r => `${r.code}:${r.reason}`)).toEqual(['F2:tight_fit', 'F1:tight_fit', 'F4:empty', 'F3:moves']);
    expect(ranked[3].moves).toBe(1);
  });

  it('prefers the file kept for the return day, then the file already serving that day', () => {
    const files = [file('F1', [], { plannedDay: '2026-10-12' }), file('F2', [car('b', day('12', 18), 1)]), file('F3', [])];
    const ranked = rankFiles(files, { returnAt: day('12'), returnDay: '2026-10-12' });
    expect(ranked.map(r => `${r.code}:${r.reason}`)).toEqual(['F2:planned_day', 'F1:planned_day', 'F3:empty']);
  });

  it('a full file comes last, and a file kept for another day after a free one', () => {
    const files = [file('F1', [car('a', day('20'), 1)], { capacity: 1 }), file('F2', [], { plannedDay: '2026-10-25' }), file('F3', [])];
    const ranked = rankFiles(files, { returnAt: day('12'), returnDay: '2026-10-12' });
    expect(ranked.map(r => `${r.code}:${r.reason}`)).toEqual(['F3:empty', 'F2:empty', 'F1:full']);
  });

  it('two cars returning within the same wave keep no order', () => {
    const f = file('F1', [car('a', day('12', 10), 1), car('b', day('12', 11), 2)]);
    expect(blockersIn(f).size).toBe(0);
    expect(rankFiles([f], { returnAt: day('12', 12), returnDay: '2026-10-12' })[0].moves).toBe(0);
  });

  it('the night preparation keeps empty files for the busiest days and leaves a third free', () => {
    const files = [file('F1', []), file('F2', []), file('F3', []), file('F4', [car('x', day('14'), 1)]), file('F5', []), file('F6', [])];
    const plan = planEmptyFiles(files, [
      { day: '2026-10-14', cars: 2 }, // room already open in F4 (4 free slots): nothing to keep
      { day: '2026-10-15', cars: 12 }, // 3 files of 5
      { day: '2026-10-16', cars: 4 }, // worth a file (half of 5), but a third of the files stays free
      { day: '2026-10-17', cars: 2 }, // not worth one
    ]);
    expect([...plan.entries()]).toEqual([
      ['F1', '2026-10-15'],
      ['F2', '2026-10-15'],
      ['F3', '2026-10-15'],
      ['F5', null],
      ['F6', null],
    ]);
    // Fewer cars to come: the second day gets its file too.
    const lighter = planEmptyFiles(files, [
      { day: '2026-10-15', cars: 7 },
      { day: '2026-10-16', cars: 4 },
    ]);
    expect([...lighter.values()]).toEqual(['2026-10-15', '2026-10-15', '2026-10-16', null, null]);
  });
});
