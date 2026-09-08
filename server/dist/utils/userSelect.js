"use strict";
// Common user selection objects to reduce duplication
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacySettingsSelect = exports.fullUserSelect = exports.userProfileSelect = exports.userWithBioSelect = exports.userWithStatusSelect = exports.basicUserSelect = void 0;
exports.basicUserSelect = {
    id: true,
    username: true,
    displayName: true,
    avatar: true,
};
exports.userWithStatusSelect = {
    ...exports.basicUserSelect,
    status: true,
};
exports.userWithBioSelect = {
    ...exports.userWithStatusSelect,
    bio: true,
};
exports.userProfileSelect = {
    ...exports.userWithBioSelect,
    lastSeen: true,
    createdAt: true,
};
exports.fullUserSelect = {
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
};
exports.privacySettingsSelect = {
    showOnlineStatus: true,
    showProfilePhoto: true,
    showLastSeen: true,
};
//# sourceMappingURL=userSelect.js.map