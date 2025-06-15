import { useTranslation } from "@/lib/intl/react";
import { Link, createFileRoute } from "@tanstack/react-router";
import SignInForm from "@/features/auth/components/sign-in-form";

export const Route = createFileRoute("/(auth)/login")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-[calc(100vh-10rem)] w-full flex-col items-center justify-center p-2 md:p-6">
            <SignInForm />
            <div className="mt-4 text-center">
                {t("DONT_HAVE_ACCOUNT")}{" "}
                <Link to="/register" className="underline">
                    {t("REGISTER")}
                </Link>
                !
            </div>
        </div>
    );
}
