import { useTranslation } from "@/lib/intl/react";
import { Link, createFileRoute } from "@tanstack/react-router";
import ForgotPasswordForm from "@/features/auth/components/forgot-password";

export const Route = createFileRoute("/(auth)/forgot-password")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
            <ForgotPasswordForm />

            <div className="mt-4 text-center">
                {t("DONT_HAVE_ACCOUNT")}{" "}
                <Link to="/login" className="underline">
                    {t("LOGIN")}
                </Link>
                !
            </div>
        </div>
    );
}
