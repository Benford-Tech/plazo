/*
 * Plazo — the parking's booking module in its own site (Site du parking, niveau 3, 19/11/2026).
 * Paste where the module goes:  <script src="https://www.plazo.fr/r/embed.js" data-plazo="<page>" async></script>
 * It adds Plazo's booking page in a frame at that place, and follows its height.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-plazo") || "";
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return;
  var origin = new URL(script.src).origin;
  var frame = document.createElement("iframe");
  frame.src = origin + "/r/" + slug;
  frame.title = "Réservation";
  frame.loading = "lazy";
  frame.style.cssText = "width:100%;max-width:560px;border:0;display:block;margin:0 auto;height:640px;";
  frame.setAttribute("allow", "payment");
  script.parentNode.insertBefore(frame, script);
  window.addEventListener("message", function (event) {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.plazo === "height" && data.slug === slug && typeof data.height === "number" && data.height > 100 && data.height < 5000) {
      frame.style.height = Math.ceil(data.height) + "px";
    }
  });
})();
