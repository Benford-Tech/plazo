/* Plazo · formulaire de réservation du site du parking (19/11/2026). Talks to WordPress (admin-ajax), never to Plazo. */
(function () {
  'use strict';
  var MESSAGES = {
    full: 'Complet à ces dates : choisissez d’autres dates ou appelez le parking.',
    no_price: 'Ce séjour ne peut pas être réservé en ligne : appelez le parking.',
    return_before_arrival: 'Le retour doit être après le dépôt.',
    in_the_past: 'La date de dépôt est passée.',
    invalid_datetime: 'Vérifiez les dates et les heures.',
    required: 'Remplissez les champs obligatoires.',
    invalid_phone: 'Vérifiez le numéro de téléphone.',
    invalid_email: 'Vérifiez l’adresse e-mail.',
    expired: 'La page a expiré : rechargez-la.',
    invalid_site_key: 'Le formulaire n’est pas relié à Plazo : prévenez le parking.',
    operator_inactive: 'Les réservations en ligne sont fermées pour le moment.',
    too_many_requests: 'Trop d’essais : réessayez dans quelques minutes.',
    network: 'Plazo ne répond pas : réessayez dans un instant.'
  };
  var euro = function (cents) {
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };
  var messageOf = function (body) {
    if (body && body.fields) {
      for (var key in body.fields) {
        if (MESSAGES[body.fields[key]]) return MESSAGES[body.fields[key]];
      }
      return MESSAGES.required;
    }
    return (body && MESSAGES[body.code]) || 'La réservation n’a pas pu être enregistrée : réessayez ou appelez le parking.';
  };
  var post = function (action, data) {
    var form = new FormData();
    form.append('action', action);
    form.append('nonce', window.plazoSite.nonce);
    Object.keys(data).forEach(function (k) { form.append(k, data[k]); });
    return fetch(window.plazoSite.ajaxUrl, { method: 'POST', body: form, credentials: 'same-origin' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { ok: r.ok, body: body }; });
    }, function () { return { ok: false, body: { code: 'network' } }; });
  };

  document.querySelectorAll('.plazo-form').forEach(function (form) {
    var quote = form.querySelector('.plazo-quote');
    var result = form.querySelector('.plazo-result');
    var button = form.querySelector('.plazo-button');
    var stay = function () {
      var f = form.elements;
      if (!f.arrivalDate.value || !f.returnDate.value) return null;
      return {
        arrivalAt: f.arrivalDate.value + 'T' + (f.arrivalTime.value || '08:00'),
        returnAt: f.returnDate.value + 'T' + (f.returnTime.value || '18:00')
      };
    };
    var available = false;
    var refresh = function () {
      var s = stay();
      available = false;
      if (!s) { quote.textContent = ''; return; }
      quote.textContent = 'Recherche des places…';
      post('plazo_quote', s).then(function (r) {
        if (r.ok && r.body.available) {
          available = true;
          quote.textContent = r.body.days + ' jour' + (r.body.days > 1 ? 's' : '') + ' · ' + euro(r.body.priceCents) + ', à payer au parking';
        } else {
          quote.textContent = r.ok ? MESSAGES[r.body.reason] || MESSAGES.no_price : messageOf(r.body);
        }
      });
    };
    ['arrivalDate', 'arrivalTime', 'returnDate', 'returnTime'].forEach(function (name) {
      form.elements[name].addEventListener('change', refresh);
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var s = stay();
      if (!s) { result.textContent = MESSAGES.invalid_datetime; return; }
      var f = form.elements;
      var data = Object.assign({}, s, {
        firstName: f.firstName.value,
        lastName: f.lastName.value,
        phone: f.phone.value,
        email: f.email.value,
        plate: f.plate.value,
        returnFlight: f.returnFlight.value,
        passengers: f.passengers.value,
        message: f.message.value,
        website: f.website.value
      });
      button.disabled = true;
      result.textContent = 'Enregistrement…';
      post('plazo_book', data).then(function (r) {
        button.disabled = false;
        if (r.ok && r.body.reference) {
          form.classList.add('plazo-done');
          result.textContent = 'Réservation enregistrée, référence ' + r.body.reference + '. Le parking vous attend.';
        } else {
          result.textContent = messageOf(r.body);
        }
      });
    });
  });
})();
