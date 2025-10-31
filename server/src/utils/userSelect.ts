// Common user selection objects to reduce duplication

export const basicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
} as const;

export const userWithStatusSelect = {
  ...basicUserSelect,
  status: true,
} as const;

export const userWithBioSelect = {
  ...userWithStatusSelect,
  bio: true,
} as const;

export const userProfileSelect = {
  ...userWithBioSelect,
  lastSeen: true,
  createdAt: true,
} as const;

export const fullUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatar: true,
  bio: true,
  status: true,
  lastSeen: true,
  emailVerified: true,
  theme: true,
  createdAt: true,
} as const;

export const privacySettingsSelect = {
  showOnlineStatus: true,
  showProfilePhoto: true,
  showLastSeen: true,
} as const;
