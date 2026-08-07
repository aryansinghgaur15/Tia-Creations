// server/lib/scopes.js
// Central capability definitions — single source of truth for the
// blueprint permission matrix (§3) and UI guards (§21.10, §19.9).
//
// A "scope" is a granular capability. Roles combine scopes:
//   visitor   -> [] (unauthenticated)
//   user      -> base user scopes
//   artist    -> user scopes + upload_artwork family (after approval)
//   admin     -> all scopes

export const SCOPES = {
  browse: 'browse',
  purchase: 'purchase',
  wishlist: 'wishlist',
  review: 'review',
  follow: 'follow',
  upload_artwork: 'upload_artwork',
  manage_artwork: 'manage_artwork',
  artist_analytics: 'artist_analytics',
  payout_manage: 'payout_manage',
  admin_review: 'admin_review',
  admin_manage: 'admin_manage',
};

// Base scopes every registered user gets (blueprint §2 Registered User).
export const USER_SCOPES = [
  SCOPES.browse,
  SCOPES.purchase,
  SCOPES.wishlist,
  SCOPES.review,
  SCOPES.follow,
];

// Additional scopes granted only when artistStatus = approved.
export const ARTIST_SCOPES = [
  SCOPES.upload_artwork,
  SCOPES.manage_artwork,
  SCOPES.artist_analytics,
  SCOPES.payout_manage,
];

// Admin gets everything.
export const ADMIN_SCOPES = Object.values(SCOPES);

// Recompute a user's scope list from their row state.
// This is the canonical function — called after any status change so the
// materialized `scopes` JSON stays in sync (blueprint §0 "Automatic synch").
export function computeScopes(user) {
  if (!user) return [];
  if (user.role === 'admin') return [...ADMIN_SCOPES];
  const scopes = [...USER_SCOPES];
  if (user.artistStatus === 'approved') {
    scopes.push(...ARTIST_SCOPES);
  }
  return scopes;
}

export function hasScope(user, scope) {
  if (!user || !user.scopes) return false;
  const list = Array.isArray(user.scopes) ? user.scopes : JSON.parse(user.scopes || '[]');
  return list.includes(scope);
}
