// Test file to verify sharing functions are properly exported
// This is a simple verification that the functions exist and can be imported

import { api } from "../_generated/api";

// Verify that the sharing functions are available in the API
const sharingFunctions = {
    getThreadAccess: api.chat.sharing.getThreadAccess,
    createThreadInvite: api.chat.sharing.createThreadInvite,
    getThreadInvites: api.chat.sharing.getThreadInvites,
    revokeThreadInvite: api.chat.sharing.revokeThreadInvite,
    acceptThreadInvite: api.chat.sharing.acceptThreadInvite,
    removeThreadAccess: api.chat.sharing.removeThreadAccess,
    toggleThreadVisibility: api.chat.sharing.toggleThreadVisibility,
    getPublicThread: api.chat.sharing.getPublicThread,
};

export { sharingFunctions };