import 'reflect-metadata';
import { Container } from 'typedi';
import { NotificationService } from '@/services/notification.service';

// 17/11/2026 (« https://www.plazo.fr/pro/ doit être sous pro.plazo.fr »): the links to the pro space go to its own host.
describe("les liens de l'espace pro", () => {
  const notifications = Container.get(NotificationService);
  const saved = { ...notifications.settings };
  afterEach(() => Object.assign(notifications.settings, saved));

  it("mènent à pro.plazo.fr quand l'espace pro a son adresse", () => {
    Object.assign(notifications.settings, { publicSiteUrl: 'https://www.plazo.fr', proSpaceUrl: 'https://pro.plazo.fr/' });
    expect(notifications.proUrl('/invitation#abc')).toBe('https://pro.plazo.fr/pro/invitation#abc');
    // The travellers' links stay on www.
    expect(notifications.siteUrl('/lettre/confirmee')).toBe('https://www.plazo.fr/lettre/confirmee');
  });

  it("restent sur l'adresse du site sans adresse propre", () => {
    Object.assign(notifications.settings, { publicSiteUrl: 'https://site.example', proSpaceUrl: '' });
    expect(notifications.proUrl('/login')).toBe('https://site.example/pro/login');
  });
});
