import { createFileRoute } from "@tanstack/react-router";

import { AnonymousUserDemo } from "@/features/auth/components/anonymous-user-demo";

export const Route = createFileRoute("/anonymous-demo")({
    component: AnonymousDemoPage,
});

const AnonymousDemoPage = () => (
    <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Anonymous User Features Demo</h1>
        <AnonymousUserDemo />
    </div>
);
