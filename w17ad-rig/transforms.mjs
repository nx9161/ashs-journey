// W17-AD shared wave table: kind conversions + the Ruling #1
// islet-cluster transforms. The four sand-islet clusters
// stand at IDENTICAL coordinates on all four lanes in the
// shipped template: each is a 3x2 block, top row
// [sand, palm, sand], bottom row [sand, sand, sand].
//   C1 NE (24,3) · C2 W (7,4) · C3 S-east (22,11) · C4 S-mid (14,12)
// A transform gives the cluster's destination top-left and
// an optional vertical flip (rows swap — the palm moves to
// the bottom row; the pattern is horizontally symmetric, so
// a horizontal mirror would change nothing). Destinations
// were chosen per lane against that lane's own census:
// every destination cell is open water (or the cluster's own
// cells) in the shipped grid, clear of coral/rock/the
// tropgrass motif, out of the rows 7-8 sailing channel, and
// never adjacent to a warp cell (warps stand on water at the
// edges: x=0/29 rows 7-8, (14-15,0), (2-3,15)).
export const CH = (i) => String.fromCodePoint(0x1E00 + i);
export const CLUSTERS = { C1: [24, 3], C2: [7, 4], C3: [22, 11], C4: [14, 12] };
export const LANES = {
  // West: the mildest hand — C1/C2 hold the template posts,
  // the two south islets shift/flip so the lane no longer
  // mirrors its twin Central (which moves everything).
  'orange-sea-west': {
    sand: 1536, rock: 1537,
    move: { C1: { to: [24, 3], flip: false }, C2: { to: [7, 4], flip: false }, C3: { to: [18, 11], flip: true }, C4: { to: [14, 12], flip: true } },
  },
  // Central: every cluster moves — the crossing heart is
  // the template's strongest break (four warp pairs, the
  // most-sailed water in the isles).
  'orange-sea-central': {
    sand: 1538, rock: 1539,
    move: { C1: { to: [18, 2], flip: true }, C2: { to: [17, 5], flip: false }, C3: { to: [24, 12], flip: true }, C4: { to: [17, 12], flip: false } },
  },
  // East: the resort water re-deals its islets west and
  // north; both south clusters slide toward the Reefside
  // (south) entry.
  'orange-sea-east': {
    sand: 1540, rock: 1541,
    move: { C1: { to: [19, 2], flip: true }, C2: { to: [12, 4], flip: false }, C3: { to: [19, 11], flip: true }, C4: { to: [8, 12], flip: false } },
  },
  // North: the pilgrim channel — C3 climbs two rows toward
  // Sanctum (the lane's run north), C4 slides west toward
  // the Pomelo entry.
  'orange-sea-north': {
    sand: 1542, rock: 1543,
    move: { C1: { to: [18, 3], flip: true }, C2: { to: [11, 4], flip: false }, C3: { to: [24, 10], flip: true }, C4: { to: [7, 12], flip: false } },
  },
};
