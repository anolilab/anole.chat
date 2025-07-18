/**
 * import { Polar } from "@convex-dev/polar";
 * import { api, components } from "./_generated/api";
 *
 * export const polar = new Polar(components.polar, {
 * // Required: provide a function the component can use to get the current user's ID and
 * // email - this will be used for retrieving the correct subscription data for the
 * // current user. The function should return an object with `userId` and `email`
 * // properties.
 * getUserInfo: async (ctx) => {
 * const user = await ctx.runQuery(api.example.getCurrentUser);
 * return {
 * userId: user.userId,
 * email: user.email,
 * };
 * },
 *
 * // Your Polar organization ID
 * organizationId: process.env.POLAR_ORGANIZATION_ID!,
 *
 * // Your Polar access token
 * accessToken: process.env.POLAR_ACCESS_TOKEN!,
 *
 * // Webhook secret for verifying webhook signatures
 * webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
 *
 * // Optional: Custom webhook endpoint path (defaults to "/webhooks/polar")
 * webhookPath: "/webhooks/polar",
 *
 * // Optional: Custom success URL for checkout redirects
    successUrl: process.env.POLAR_SUCCESS_URL || "https://yourdomain.com/success",
 
    // Optional: Custom cancel URL for checkout redirects
    cancelUrl: process.env.POLAR_CANCEL_URL || "https://yourdomain.com/cancel",
});
 
// Export API functions from the Polar client
export const {
    changeCurrentSubscription,
    cancelCurrentSubscription,
    getConfiguredProducts,
    listAllProducts,
    generateCheckoutLink,
    generateCustomerPortalUrl,
} = polar.api();
 */
