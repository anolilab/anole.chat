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
    const subscription = useQuery(api.polar.getUserSubscription, { userId });
    const hasActiveSubscription = useQuery(api.polar.hasActiveSubscription, { userId });
    const daysUntilExpiry = useQuery(api.polar.getDaysUntilExpiry, { userId });

    // Mutations
    const createCheckout = useMutation(api.polar.createCheckoutSession);

    const handleSubscribe = async (productId: string) => {
        try {
            const result = await createCheckout({
                userId,
                productId,
                successUrl: `${window.location.origin}/success?checkout_id={CHECKOUT_ID}`,
                cancelUrl: `${window.location.origin}/cancel`,
            });

            // Redirect to Polar checkout
            window.location.href = result.url;
        } catch (error) {
            console.error("Failed to create checkout session:", error);
        }
    };

    if (products === undefined) {
        return <div>Loading...</div>;
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
                    {hasActiveSubscription ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="default">Active</Badge>
                                {subscription && (
                                    <span className="text-sm text-muted-foreground">
                                        Expires {formatDistanceToNow(subscription.currentPeriodEnd, { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                        Your subscription expires in {daysUntilExpiry} days. 
                                        Consider renewing to maintain access.
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

            {/* Available Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>
                        Choose a plan that fits your needs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <Card key={product.id} className="relative">
                                <CardHeader>
                                    <CardTitle className="text-lg">{product.name}</CardTitle>
                                    <CardDescription>
                                        {product.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">
                                            ${product.price}
                                        </span>
                                        <span className="text-muted-foreground">
                                            /{product.interval}
                                        </span>
                                    </div>
                                    <Button 
                                        onClick={() => handleSubscribe(product.id)}
                                        className="w-full"
                                        disabled={hasActiveSubscription}
                                    >
                                        {hasActiveSubscription ? "Already Subscribed" : "Subscribe"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Subscription Details */}
            {subscription && (
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                                    {subscription.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Period:</span>
                                <span>
                                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </span>
                            </div>
                            {subscription.cancelAtPeriodEnd && (
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