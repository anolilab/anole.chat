// Test file to verify sharing functions are properly exported
// This is a simple verification that the functions exist and can be imported

import { api } from "../_generated/api";

// Verify that the sharing functions are available in the API
const sharingFunctions = {
    acceptThreadInvite: api.chat.sharing.acceptThreadInvite,
    createThreadInvite: api.chat.sharing.createThreadInvite,
    getPublicThread: api.chat.sharing.getPublicThread,
    getThreadAccess: api.chat.sharing.getThreadAccess,
    getThreadInvites: api.chat.sharing.getThreadInvites,
    removeThreadAccess: api.chat.sharing.removeThreadAccess,
    revokeThreadInvite: api.chat.sharing.revokeThreadInvite,
    toggleThreadVisibility: api.chat.sharing.toggleThreadVisibility,
};

export { sharingFunctions };
