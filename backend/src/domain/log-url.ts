/**
 * Security pass of 13/11/2026: the access log never keeps a secret carried by a URL: an app-link code (it opens the
 * booking), the SMS gateway's per-operator webhook path, an unsubscribe or demo token, a booking key in the query.
 */
const SECRET_PATHS = [
  /(\/public\/app-link\/)[^/?#]+/g,
  /(\/public\/sms-gateway\/webhook\/)[^/?#]+/g,
  /(\/unsubscribe\/)[^/?#]+/g,
  /(\/public\/demo\/links\/)[^/?#]+/g,
  /(\/a\/)[^/?#]+/g,
];
const SECRET_QUERY = /([?&](?:cle|token|key|code|challenge|hub\.verify_token|hub\.challenge)=)[^&#]*/gi;

export function redactUrl(url: string): string {
  let out = url;
  for (const re of SECRET_PATHS) out = out.replace(re, '$1[hidden]');
  return out.replace(SECRET_QUERY, '$1[hidden]');
}
