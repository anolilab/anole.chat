import { useTranslation } from "@/lib/intl/react";
import { Link } from "@tanstack/react-router";
import { SignUpForm } from "./-components/sign-up-form";

export const Route = createFileRoute({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
            <SignUpForm />
            <div className="mt-4 text-center">
                {t("ALREADY_HAVE_ACCOUNT")}{" "}
                <Link to="/login" className="underline">
                    {t("LOG_IN")}
                </Link>
                !
            </div>
        </div>
    );
}
