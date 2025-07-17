import { api } from "@anole/convex/api";
import type { Id } from "@anole/convex/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useSubscription(userId: Id<"users">) {
    // Queries
    const customer = useQuery(api.polar.getCustomer, { userId });
    const subscriptions = useQuery(api.polar.getCustomerSubscriptions, { userId });
    const products = useQuery(api.polar.getProducts);

    // Get the active subscription
    const activeSubscription = subscriptions?.find((sub) => sub.status === "active");

    // Get the first (and only) product
    const product = products?.[0];

    // Check if user has active subscription
    const hasActiveSubscription = !!activeSubscription;

    // Check if subscription is expired
    const isExpired = activeSubscription ? new Date(activeSubscription.currentPeriodEnd * 1000) < new Date() : false;

    // Calculate days until expiry
    const daysUntilExpiry = activeSubscription ? Math.ceil((activeSubscription.currentPeriodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    // Mutations
    const createCheckout = useMutation(api.polar.createCheckoutSession);
    const createCustomer = useMutation(api.polar.createCustomer);
    const updateCustomer = useMutation(api.polar.updateCustomer);
    const cancelSubscription = useMutation(api.polar.cancelSubscription);
    const reactivateSubscription = useMutation(api.polar.reactivateSubscription);

    // Helper functions
    const subscribe = async () => {
        if (!product)
            throw new Error("No product available");

        try {
            const checkoutUrl = await createCheckout({
                cancelUrl: `${globalThis.location.origin}/cancel`,
                customerId: customer?.id,
                productId: product.id,
                successUrl: `${globalThis.location.origin}/success`,
                userId,
            });

            globalThis.location.href = checkoutUrl;
        } catch (error) {
            console.error("Failed to create checkout session:", error);
            throw error;
        }
    };

    const cancel = async () => {
        if (!activeSubscription)
            throw new Error("No active subscription to cancel");

        try {
            await cancelSubscription({ subscriptionId: activeSubscription.id });
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
            throw error;
        }
    };

    const reactivate = async () => {
        if (!activeSubscription)
            throw new Error("No subscription to reactivate");

        try {
            await reactivateSubscription({ subscriptionId: activeSubscription.id });
        } catch (error) {
            console.error("Failed to reactivate subscription:", error);
            throw error;
        }
    };

    return {
        activeSubscription,
        cancel,
        createCustomer,
        // Data
        customer,
        daysUntilExpiry,
        hasActiveSubscription,
        isExpired,

        // Loading states
        isLoading: subscriptions === undefined || products === undefined,
        product,
        reactivate,
        // Actions
        subscribe,
        subscriptions,

        updateCustomer,
    };
}
