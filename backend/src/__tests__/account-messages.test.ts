import { invitationEmail } from '@/domain/account-messages';

const base = {
  operatorName: 'Parking des Cèdres',
  url: 'https://www.plazo.fr/pro/invitation#tok',
  days: 7,
  demoUrl: 'https://www.plazo.fr/pro/demo',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.benfordtech.plazopro',
  badgesBase: 'https://www.plazo.fr',
};

describe('invitationEmail (22/10/2026: demo, stores, Apple review)', () => {
  it('links the password page, the demo and Google Play, and says the Apple review is running', () => {
    const mail = invitationEmail('Plazo', { ...base, appStoreUrl: null });
    expect(mail.subject).toBe('Votre espace Plazo pour Parking des Cèdres');
    expect(mail.text).toContain('Choisir mon mot de passe : https://www.plazo.fr/pro/invitation#tok');
    expect(mail.text).toContain('- Essayer la démo : https://www.plazo.fr/pro/demo');
    expect(mail.text).toContain('- Plazo Pro sur Google Play (Android) : https://play.google.com/store/apps/details?id=com.benfordtech.plazopro');
    expect(mail.text).toContain("- Plazo Pro sur l'App Store (iPhone) : Validation par Apple en cours");
    expect(mail.html).toContain('href="https://www.plazo.fr/pro/demo"');
    // The stores are official badges: Google Play linked, the App Store greyed without a link.
    expect(mail.html).toContain('href="https://play.google.com/store/apps/details?id=com.benfordtech.plazopro"');
    expect(mail.html).toContain('src="https://www.plazo.fr/badges/google-play-fr.png"');
    expect(mail.html).toContain('src="https://www.plazo.fr/badges/app-store-fr-soon.png"');
    expect(mail.html).not.toContain('apps.apple.com');
    expect(mail.html).toContain('Validation par Apple en cours');
  });

  it('links the App Store once Apple has published the app, and skips the demo without a site URL', () => {
    const mail = invitationEmail('Plazo', { ...base, demoUrl: null, appStoreUrl: 'https://apps.apple.com/fr/app/plazo-pro/id123' });
    expect(mail.text).toContain("- Plazo Pro sur l'App Store (iPhone) : https://apps.apple.com/fr/app/plazo-pro/id123");
    expect(mail.text).not.toContain('validation par Apple');
    expect(mail.text).not.toContain('Essayer la démo');
    expect(mail.html).toContain('href="https://apps.apple.com/fr/app/plazo-pro/id123"');
    expect(mail.html).toContain('src="https://www.plazo.fr/badges/app-store-fr.png"');
    expect(mail.html).not.toContain('Validation par Apple');
  });

  it('falls back to plain links without a site URL for the badges', () => {
    const mail = invitationEmail('Plazo', { ...base, badgesBase: null, appStoreUrl: null });
    expect(mail.html).not.toContain('<img');
    expect(mail.html).toContain(
      'Plazo Pro sur Google Play (Android) : <a href="https://play.google.com/store/apps/details?id=com.benfordtech.plazopro"',
    );
    expect(mail.text).toContain('- Plazo Pro sur Google Play (Android) : https://play.google.com/store/apps/details?id=com.benfordtech.plazopro');
  });

  it('escapes the operator name in the HTML', () => {
    const mail = invitationEmail('Plazo', { ...base, operatorName: 'A & B <x>', appStoreUrl: null });
    expect(mail.html).toContain('A &amp; B &lt;x&gt;');
    expect(mail.text).toContain('A & B <x>');
  });
});
