import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@anole/convex/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SubscriptionManagerProps {
    userId: string;
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
    // Queries
    const products = useQuery(api.polar.getProducts);
    const customer = useQuery(api.polar.getCustomer, { userId });
    const subscriptions = useQuery(api.polar.getCustomerSubscriptions, { userId });
    
    // Get the active subscription
    const activeSubscription = subscriptions?.find(sub => sub.status === "active");
    
    // Get the first (and only) product
    const product = products?.[0];

    // Mutations
    const createCheckout = useMutation(api.polar.createCheckoutSession);
    const cancelSubscription = useMutation(api.polar.cancelSubscription);
    const reactivateSubscription = useMutation(api.polar.reactivateSubscription);

    const handleSubscribe = async () => {
        if (!product) return;
        
        try {
            const checkoutUrl = await createCheckout({
                productId: product.id,
                customerId: customer?.id,
                userId,
                successUrl: `${window.location.origin}/success`,
                cancelUrl: `${window.location.origin}/cancel`,
            });
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error("Failed to create checkout session:", error);
        }
    };

    const handleCancel = async () => {
        if (!activeSubscription) return;
        try {
            await cancelSubscription({ subscriptionId: activeSubscription.id });
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
        }
    };

    const handleReactivate = async () => {
        if (!activeSubscription) return;
        try {
            await reactivateSubscription({ subscriptionId: activeSubscription.id });
        } catch (error) {
            console.error("Failed to reactivate subscription:", error);
        }
    };

    if (products === undefined) {
        return <div>Loading...</div>;
    }

    if (!product) {
        return <div>No subscription plan available.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Current Subscription Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                    <CardDescription>
                        Manage your subscription and billing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeSubscription ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="default">Active</Badge>
                                <span className="text-sm text-muted-foreground">
                                    Expires {formatDistanceToNow(new Date(activeSubscription.currentPeriodEnd * 1000), { addSuffix: true })}
                                </span>
                            </div>
                            {activeSubscription.cancelAtPeriodEnd && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                        Your subscription will be canceled at the end of the current period
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-muted-foreground mb-4">
                                You don't have an active subscription
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Subscription Plan */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plan</CardTitle>
                    <CardDescription>
                        {product.description || "Premium access to all features"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-2xl font-bold">{product.name}</h3>
                            <p className="text-muted-foreground">{product.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">
                                ${product.price / 100}
                            </div>
                            <div className="text-muted-foreground">
                                per {product.interval}
                            </div>
                        </div>
                    </div>
                    
                    {activeSubscription ? (
                        <div className="space-y-2">
                            <Button 
                                variant="outline" 
                                onClick={handleCancel}
                                className="w-full"
                                disabled={activeSubscription.cancelAtPeriodEnd}
                            >
                                {activeSubscription.cancelAtPeriodEnd ? "Already Canceled" : "Cancel Subscription"}
                            </Button>
                            {activeSubscription.cancelAtPeriodEnd && (
                                <Button 
                                    onClick={handleReactivate}
                                    className="w-full"
                                >
                                    Reactivate Subscription
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Button 
                            onClick={handleSubscribe}
                            className="w-full"
                            size="lg"
                        >
                            Subscribe Now
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Subscription Details */}
            {activeSubscription && (
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={activeSubscription.status === "active" ? "default" : "secondary"}>
                                    {activeSubscription.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Period:</span>
                                <span>
                                    {new Date(activeSubscription.currentPeriodStart * 1000).toLocaleDateString()} - {new Date(activeSubscription.currentPeriodEnd * 1000).toLocaleDateString()}
                                </span>
                            </div>
                            {activeSubscription.cancelAtPeriodEnd && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cancellation:</span>
                                    <span className="text-orange-600">Will cancel at period end</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}