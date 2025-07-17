import { useAuth } from "@clerk/clerk-react";
import React from "react";

import { SubscriptionManager } from "@/components/polar";

export default function SubscriptionPage() {
    const { userId } = useAuth();

    if (!userId) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="mb-4 text-2xl font-bold">Authentication Required</h1>
                    <p className="text-muted-foreground">Please sign in to manage your subscription.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-8 text-3xl font-bold">Subscription Management</h1>
                <SubscriptionManager userId={userId} />
            </div>
        </div>
    );
}
