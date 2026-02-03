// Default images for user profiles
export const DEFAULT_AVATAR = '/images/default-avatar.png';
export const DEFAULT_COVER = '/images/default-cover.jpg';

// Helper to get avatar URL with fallback
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  return avatarUrl || DEFAULT_AVATAR;
}

// Helper to get cover URL with fallback to default cover
export function getCoverUrl(coverUrl: string | null | undefined): string {
  return coverUrl || DEFAULT_COVER;
}
