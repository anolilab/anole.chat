import { useTranslation } from "@/lib/intl/react";
import { Link } from "@tanstack/react-router";
import TwoFactorForm from "../-components/two-factor";

export const Route = createFileRoute({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center p-2 md:p-6">
            <div className="bg-elevated w-full max-w-md rounded-lg p-4 md:p-8">
                <TwoFactorForm />

                <div className="mt-4 text-center">
                    {t("DONT_HAVE_ACCOUNT")}{" "}
                    <Link to="/login" className="underline">
                        {t("LOGIN")}
                    </Link>
                    !
                </div>
            </div>
        </div>
    );
}
