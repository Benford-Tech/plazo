// IGN Géoplateforme raster tiles (no key): BD ORTHO, 20 cm aerial photo under the Etalab open
// licence. Tracing and analysing are allowed on it, unlike Google imagery, whose terms forbid
// tracing or deriving data from it: the "Vue satellite Google" layer of the mockup is left out.
export const IGN_ORTHO_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg";
export const IGN_ORTHO_MAX_ZOOM = 19;

/** Date of the BD ORTHO shot over the Rhône (the only department served so far). */
export const IGN_PHOTO_DATE = "08/07/2023";
export const IGN_ATTRIBUTION = `Source : IGN – BD ORTHO® · prise de vue ${IGN_PHOTO_DATE}`;

/** Lyon Saint-Exupéry, where the map opens for a new study. */
export const DEFAULT_CENTER: [number, number] = [5.0811, 45.7256];
