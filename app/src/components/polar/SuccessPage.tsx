import { useSearchParams } from "@tanstack/react-router";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SuccessPage = () => {
    const [searchParameters] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkoutId = searchParameters.get("checkout_id");

    useEffect(() => {
        // You can add additional verification here if needed
        // For example, verify the checkout with Polar API
        const verifyCheckout = async () => {
            try {
                // Add any verification logic here
                // const result = await verifyCheckoutWithPolar(checkoutId);
                setIsLoading(false);
            } catch {
                setError("Failed to verify checkout");
                setIsLoading(false);
            }
        };

        if (checkoutId) {
            verifyCheckout();
        } else {
            setIsLoading(false);
        }
    }, [checkoutId]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2" />
                    <p>Verifying your subscription...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Verification Failed</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => globalThis.history.back()}>
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Welcome!</CardTitle>
                    <CardDescription>Your subscription has been successfully activated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 text-center">
                        <p className="text-muted-foreground text-sm">Thank you for subscribing! You now have access to all premium features.</p>
                        {checkoutId && (
                            <p className="text-muted-foreground text-xs">
                                Checkout ID:
                                {checkoutId}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Button className="w-full" onClick={() => (globalThis.location.href = "/dashboard")}>
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <Button className="w-full" onClick={() => (globalThis.location.href = "/settings/billing")} variant="outline">
                            Manage Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuccessPage;