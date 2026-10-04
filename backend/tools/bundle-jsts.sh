#!/bin/sh
# Rebuilds vendor/jsts-subset.js (the geometry classes the layout engine needs) from the jsts ESM sources.
set -e
cd "$(dirname "$0")/.."
cat > /tmp/jsts-entry.mjs <<'ENTRY'
export { default as Coordinate } from "jsts/org/locationtech/jts/geom/Coordinate.js";
export { default as GeometryFactory } from "jsts/org/locationtech/jts/geom/GeometryFactory.js";
export { default as BufferOp } from "jsts/org/locationtech/jts/operation/buffer/BufferOp.js";
export { default as SnapIfNeededOverlayOp } from "jsts/org/locationtech/jts/operation/overlay/snap/SnapIfNeededOverlayOp.js";
export { default as UnaryUnionOp } from "jsts/org/locationtech/jts/operation/union/UnaryUnionOp.js";
export { default as TopologyPreservingSimplifier } from "jsts/org/locationtech/jts/simplify/TopologyPreservingSimplifier.js";
ENTRY
cp /tmp/jsts-entry.mjs ./jsts-entry.mjs
npx esbuild jsts-entry.mjs --bundle --format=cjs --platform=node --minify --outfile=vendor/jsts-subset.js
rm jsts-entry.mjs
