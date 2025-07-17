import React, { useEffect, useState } from "react";
import { useSearchParams } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export function SuccessPage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkoutId = searchParams.get("checkout_id");

    useEffect(() => {
        // You can add additional verification here if needed
        // For example, verify the checkout with Polar API
        const verifyCheckout = async () => {
            try {
                // Add any verification logic here
                // const result = await verifyCheckoutWithPolar(checkoutId);
                setIsLoading(false);
            } catch (err) {
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Verifying your subscription...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Verification Failed</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.history.back()} className="w-full">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Welcome!</CardTitle>
                    <CardDescription>
                        Your subscription has been successfully activated
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Thank you for subscribing! You now have access to all premium features.
                        </p>
                        {checkoutId && (
                            <p className="text-xs text-muted-foreground">
                                Checkout ID: {checkoutId}
                            </p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <Button 
                            onClick={() => window.location.href = "/dashboard"} 
                            className="w-full"
                        >
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.href = "/settings/billing"}
                            className="w-full"
                        >
                            Manage Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}