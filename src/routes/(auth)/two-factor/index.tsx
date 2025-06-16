import TwoFactorForm from "@/features/auth/components/two-factor";
import { useLingui } from "@lingui/react/macro";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/two-factor/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useLingui();

    return (
        <div className="flex flex-col items-center p-2 md:p-6">
            <div className="bg-elevated w-full max-w-md rounded-lg p-4 md:p-8">
                <TwoFactorForm />

                <div className="mt-4 text-center">
                    {t`Don't have an account?`}{" "}
                    <Link to="/login" className="underline">
                        {t`Login`}
                    </Link>
                    !
                </div>
            </div>
        </div>
    );
}
