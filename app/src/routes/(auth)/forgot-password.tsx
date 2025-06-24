import { useLingui } from "@lingui/react/macro";
import { Link, createFileRoute } from "@tanstack/react-router";
import ForgotPasswordForm from "@/features/auth/components/forgot-password";

export const Route = createFileRoute("/(auth)/forgot-password")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useLingui();

    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
            <ForgotPasswordForm />

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
