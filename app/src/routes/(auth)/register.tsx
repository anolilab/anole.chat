import { useLingui } from "@lingui/react/macro";
import { Link, createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const Route = createFileRoute("/(auth)/register")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useLingui();
    return (
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-2 md:p-6">
            <SignUpForm />
            <div className="mt-4 text-center">
                {t`Already have an account?`}{" "}
                <Link to="/login" className="underline">
                    {t`Log in`}
                </Link>
                !
            </div>
        </div>
    );
}
