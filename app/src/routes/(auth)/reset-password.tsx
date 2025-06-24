import { useLingui } from "@lingui/react/macro";
import { Link, createFileRoute } from "@tanstack/react-router";
import ResetPasswordForm from "@/features/auth/components/reset-password";

export const Route = createFileRoute("/(auth)/reset-password")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useLingui();
    return (
        <div className="flex flex-col items-center p-2 md:p-6">
            <ResetPasswordForm />

            <div className="mt-4 text-center">
                {t`Don't have an account?`}{" "}
                <Link to="/login" className="underline">
                    {t`Login`}
                </Link>
                !
            </div>
        </div>
    );
}
