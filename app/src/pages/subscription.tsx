import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { SubscriptionManager } from "@/components/polar";

export default function SubscriptionPage() {
    const { userId } = useAuth();

    if (!userId) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-muted-foreground">
                        Please sign in to manage your subscription.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
                <SubscriptionManager userId={userId} />
            </div>
        </div>
    );
}