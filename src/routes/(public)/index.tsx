export const Route = createFileRoute({
    component: LandingPage,
});

export default function LandingPage() {
    return (
        <div className="bg-background flex min-h-screen flex-col items-center justify-center">
            <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"></header>

            <main className="flex-1 px-4 py-12 md:py-16 lg:py-20"></main>

            <footer className="mt-16 border-t">
                <div className="text-muted-foreground container py-6 text-center text-sm">
                    Built with Modern Tech. &copy; {new Date().getFullYear()} Your Company/Name.
                </div>
            </footer>
        </div>
    );
}
