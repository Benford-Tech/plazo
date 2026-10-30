import { Service } from 'typedi';
import prisma, { StaffRole } from '@/database';
import { effectivePost } from '@/domain/roles';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';

/**
 * « Bien démarrer avec Plazo Pro » (26/10/2026, choice T-A): the steps of a parking's setup, ticked from what Plazo
 * sees, per post. The manager's seven steps, and a short list for the driver, the agent and the valet. Pure reading:
 * nothing is stored, the apps and the web show the list until everything is done.
 */
export interface GettingStartedStep {
  key: string;
  done: boolean;
  /** A short French line under the title (counts, dates), or null. */
  detail: string | null;
}

export interface GettingStartedView {
  post: StaffRole;
  steps: GettingStartedStep[];
  done: number;
  total: number;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

@Service()
export class GettingStartedService {
  /** GET /internal/getting-started: the steps of the staff member's post (chosen for the day, else their role). */
  public async get(actor: AuthenticatedStaff): Promise<GettingStartedView> {
    const post = effectivePost(actor);
    const steps = post === 'manager' ? await this.manager(actor) : await this.member(actor, post);
    // « Votre photo » (30/10/2026): last for every post, the team sees it in the menu and in Équipe.
    steps.push({ key: 'photo', done: !!actor.photoUpdatedAt, detail: actor.photoUpdatedAt ? null : 'Ajoutez votre photo dans Mon compte' });
    return { post, steps, done: steps.filter(s => s.done).length, total: steps.length };
  }

  private async manager(actor: AuthenticatedStaff): Promise<GettingStartedStep[]> {
    const operatorId = actor.operatorId;
    const parking = await prisma.parking.findFirst({
      where: { operatorId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, address: true, totalCapacity: true, returnMeetingLabel: true },
    });
    const parkingId = parking?.id ?? '';
    const [spots, files, inbound, imported, members, requests, vehicles, tiers, listing, template, reminders] = await Promise.all([
      prisma.parkingSpot.count({ where: { parkingId, active: true } }),
      prisma.parkingFile.count({ where: { parkingId, active: true } }),
      prisma.inboundEmail.count({ where: { operatorId, status: { notIn: ['ignored', 'forwarding'] } } }),
      prisma.reservation.count({ where: { operatorId, channel: 'aggregator' } }),
      prisma.staff.count({ where: { operatorId, isActive: true } }),
      prisma.staffJoinRequest.count({ where: { operatorId, status: 'pending' } }),
      prisma.shuttleVehicle.count({ where: { operatorId, inService: true } }),
      prisma.pricingTier.count({ where: { parkingId } }),
      prisma.listing.findUnique({ where: { parkingId }, select: { status: true } }),
      prisma.operatorContractTemplate.findFirst({ where: { operatorId, retiredAt: null }, select: { version: true } }),
      prisma.reminderSettings.findUnique({ where: { parkingId }, select: { id: true } }),
    ]);
    const capacity = spots > 0 || files > 0 || (parking?.totalCapacity ?? 0) > 0;
    return [
      {
        key: 'parking',
        done: !!parking?.address && capacity,
        detail: !parking?.address
          ? 'Adresse à renseigner'
          : files > 0
            ? `${plural(files, 'file', 'files')} de voiturier`
            : spots > 0
              ? `${plural(spots, 'place', 'places')} sur le plan`
              : `${parking.totalCapacity} places déclarées`,
      },
      {
        key: 'bookings',
        done: inbound > 0 || imported > 0,
        detail:
          inbound > 0
            ? `${plural(inbound, 'mail reçu', 'mails reçus')}, ${plural(imported, 'réservation importée', 'réservations importées')}`
            : 'Aucun mail de comparateur reçu pour l’instant',
      },
      {
        key: 'team',
        done: members >= 2,
        detail: `${plural(members, 'membre', 'membres')}${requests ? `, ${plural(requests, 'demande en attente', 'demandes en attente')}` : ''}`,
      },
      {
        key: 'shuttles',
        done: vehicles > 0,
        detail:
          vehicles > 0
            ? `${plural(vehicles, 'véhicule en service', 'véhicules en service')}${parking?.returnMeetingLabel ? ` · rendez-vous : ${parking.returnMeetingLabel}` : ''}`
            : 'Aucun véhicule de navette',
      },
      {
        key: 'listing',
        done: tiers > 0 && !!listing,
        detail:
          tiers === 0
            ? 'Grille tarifaire vide'
            : !listing
              ? 'Fiche Plazo à créer'
              : listing.status === 'published'
                ? 'Fiche en ligne'
                : `Fiche ${listing.status === 'draft' ? 'en brouillon' : 'en attente de relecture'}`,
      },
      {
        key: 'contract',
        done: !!template,
        detail: template ? `Votre PDF, version ${template.version}` : 'Le modèle Plazo pour l’instant',
      },
      {
        key: 'sms',
        done: !!reminders,
        detail: reminders ? 'Réglé' : 'Heure et texte par défaut (18:00, texte Plazo)',
      },
    ];
  }

  private async member(actor: AuthenticatedStaff, post: StaffRole): Promise<GettingStartedStep[]> {
    const operatorId = actor.operatorId;
    const parking = await prisma.parking.findFirst({
      where: { operatorId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, shuttleTracking: true },
    });
    const parkingId = parking?.id ?? '';
    const devices = await prisma.staffDevice.count({ where: { staffId: actor.id } });
    const postStep: GettingStartedStep = {
      key: 'post',
      done: !!actor.post,
      detail: actor.post ? null : 'Choisissez votre poste du jour dans « Plus »',
    };
    const notifications: GettingStartedStep = {
      key: 'notifications',
      done: devices > 0,
      detail: devices > 0 ? 'Ce téléphone reçoit les notifications' : 'Autorisez les notifications sur ce téléphone',
    };
    if (post === 'driver') {
      return [
        postStep,
        { key: 'vehicle', done: !!actor.vehicleSetAt, detail: actor.vehicleSetAt ? null : 'Prenez votre véhicule du jour' },
        notifications,
        {
          key: 'tracking',
          done: parking?.shuttleTracking !== 'off',
          detail: parking?.shuttleTracking === 'off' ? 'Le suivi des navettes est coupé par le gérant' : 'Partagez votre position pendant un trajet',
        },
      ];
    }
    if (post === 'valet') {
      const [spots, files, keys] = await Promise.all([
        prisma.parkingSpot.count({ where: { parkingId, active: true } }),
        prisma.parkingFile.count({ where: { parkingId, active: true } }),
        prisma.reservation.count({ where: { operatorId, OR: [{ keyHook: { not: null } }, { keysLeftAt: { not: null } }] } }),
      ]);
      return [
        postStep,
        {
          key: 'plan',
          done: spots > 0 || files > 0,
          detail:
            files > 0
              ? `${plural(files, 'file', 'files')} de voiturier`
              : spots > 0
                ? `${plural(spots, 'place', 'places')}`
                : 'Le gérant trace le plan dans l’espace pro',
        },
        { key: 'keys', done: keys > 0, detail: keys > 0 ? null : 'Notez les clés laissées ou le crochet à la première voiture' },
        notifications,
      ];
    }
    const [created, inbound] = await Promise.all([
      prisma.reservation.count({ where: { operatorId, createdById: { not: null } } }),
      prisma.inboundEmail.count({ where: { operatorId, status: { notIn: ['ignored', 'forwarding'] } } }),
    ]);
    return [
      postStep,
      {
        key: 'reservations',
        done: created > 0,
        detail: created > 0 ? `${plural(created, 'réservation saisie', 'réservations saisies')}` : 'Saisissez une réservation reçue par téléphone',
      },
      {
        key: 'inbox',
        done: inbound > 0,
        detail: inbound > 0 ? `${plural(inbound, 'mail reçu', 'mails reçus')}` : 'Les mails des comparateurs arrivent dans la boîte de réception',
      },
      notifications,
    ];
  }
}
