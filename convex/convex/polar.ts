import { polar } from "@convex-dev/polar";

// Initialize Polar with your configuration
export const polarConfig = polar({
    // Your Polar organization ID
    organizationId: process.env.POLAR_ORGANIZATION_ID!,
    
    // Your Polar access token
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    
    // Webhook secret for verifying webhook signatures
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    
    // Optional: Custom webhook endpoint path (defaults to "/webhooks/polar")
    webhookPath: "/webhooks/polar",
    
    // Optional: Custom success URL for checkout redirects
    successUrl: process.env.POLAR_SUCCESS_URL || "https://yourdomain.com/success",
    
    // Optional: Custom cancel URL for checkout redirects
    cancelUrl: process.env.POLAR_CANCEL_URL || "https://yourdomain.com/cancel",
});

// Export the Polar functions
export const {
    // Queries
    getProducts,
    getProduct,
    getSubscriptions,
    getSubscription,
    getCustomer,
    getCustomerSubscriptions,
    
    // Mutations
    createCustomer,
    updateCustomer,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    
    // Actions
    syncProducts,
    syncSubscriptions,
    syncCustomers,
    
    // Webhook handler
    webhookHandler,
} = polarConfig;