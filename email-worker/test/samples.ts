/** An Allopark confirmation forwarded by a parking's Gmail filter: quoted-printable text and HTML parts. */
export const alloparkForwarded = [
  "From: ALLOPARK <info@allopark.com>",
  "To: Parking Air Lyon <contact@parkair.fr>",
  "Subject: =?UTF-8?Q?Confirmation_de_votre_r=C3=A9servation_AL-884880719?=",
  "Date: Tue, 07 Oct 2026 14:32:00 +0200",
  "Message-ID: <abc123@allopark.com>",
  "MIME-Version: 1.0",
  'Content-Type: multipart/alternative; boundary="b1"',
  "",
  "--b1",
  "Content-Type: text/plain; charset=UTF-8",
  "Content-Transfer-Encoding: quoted-printable",
  "",
  "R=C3=A9servation AL-884880719",
  "Du 12 octobre 2026 - 08:30 au 19 octobre 2026 - 17:00",
  "--b1",
  "Content-Type: text/html; charset=UTF-8",
  "",
  "<p>R&eacute;servation <b>AL-884880719</b></p>",
  "--b1--",
  "",
].join("\r\n");

/** Gmail asking the Plazo address to confirm a forwarding (G-B shows the code). */
export const gmailConfirmation = [
  "From: Gmail Team <forwarding-noreply@google.com>",
  "To: parkair-lyon-7f3a@plazo.fr",
  "Subject: (#482913507) Gmail Forwarding Confirmation - Receive Mail from contact.parkair@gmail.com",
  "Content-Type: text/plain; charset=UTF-8",
  "",
  "Confirmation code: 482913507",
  "",
].join("\r\n");

/** A message addressed to a group, without a text part. */
export const groupOnly = [
  "From: undisclosed <x@example.com>",
  "To: Équipe: a@example.com, b@example.com;",
  "Subject: Hello",
  "Content-Type: text/html; charset=UTF-8",
  "",
  "<p>hi</p>",
  "",
].join("\r\n");
