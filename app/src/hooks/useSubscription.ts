import { useQuery, useMutation } from "convex/react";
import { api } from "@anole/convex/api";
import { Id } from "@anole/convex/dataModel";

export function useSubscription(userId: Id<"users">) {
    // Queries
    const subscription = useQuery(api.polar.getUserSubscription, { userId });
    const hasActiveSubscription = useQuery(api.polar.hasActiveSubscription, { userId });
    const isExpired = useQuery(api.polar.isSubscriptionExpired, { userId });
    const daysUntilExpiry = useQuery(api.polar.getDaysUntilExpiry, { userId });
    const subscriptionWithProduct = useQuery(api.polar.getSubscriptionWithProduct, { userId });

    // Mutations
    const createCheckout = useMutation(api.polar.createCheckoutSession);
    const createCustomer = useMutation(api.polar.createCustomer);

    const subscribe = async (productId: string, successUrl?: string, cancelUrl?: string) => {
        try {
            const result = await createCheckout({
                userId,
                productId,
                successUrl: successUrl || `${window.location.origin}/success?checkout_id={CHECKOUT_ID}`,
                cancelUrl: cancelUrl || `${window.location.origin}/cancel`,
            });

            // Redirect to Polar checkout
            window.location.href = result.url;
            return result;
        } catch (error) {
            console.error("Failed to create checkout session:", error);
            throw error;
        }
    };

    const createCustomerRecord = async (email: string, name?: string) => {
        try {
            const result = await createCustomer({
                userId,
                email,
                name,
            });
            return result;
        } catch (error) {
            console.error("Failed to create customer:", error);
            throw error;
        }
    };

    return {
        // Data
        subscription,
        hasActiveSubscription,
        isExpired,
        daysUntilExpiry,
        subscriptionWithProduct,
        
        // Loading states
        isLoading: subscription === undefined || hasActiveSubscription === undefined,
        
        // Actions
        subscribe,
        createCustomer: createCustomerRecord,
        
        // Computed values
        isSubscribed: hasActiveSubscription === true,
        isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7,
        canAccessPremium: hasActiveSubscription === true && isExpired === false,
    };
}