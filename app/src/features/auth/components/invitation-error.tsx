import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

export function InvitationError() {
    const { t } = useLingui();
    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <AlertCircle className="text-destructive h-6 w-6" />
                    <CardTitle className="text-destructive text-xl">{t`Invitation Error`}</CardTitle>
                </div>
                <CardDescription>{t`There was an error with your invitation`}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">{t`The invitation link may be invalid or expired. Please contact the person who invited you.`}</p>
            </CardContent>
            <CardFooter>
                <Link to="/" className="w-full">
                    <Button variant="outline" className="w-full">
                        {t`Go Home`}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
