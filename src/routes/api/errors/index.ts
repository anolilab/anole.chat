import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/errors/").methods({
    POST: async ({ request }) => {
        try {
            const errorReport = await request.json();

            // Log error to console in development
            if (process.env.NODE_ENV === "development") {
                console.group("📊 Error Report");
                console.error("Type:", errorReport.type);
                console.error("Feature:", errorReport.feature);
                console.error("Error:", errorReport.error);
                console.error("Context:", errorReport.context || errorReport);
                console.groupEnd();
            }

            // In production, you would send this to your error reporting service
            // Examples: Sentry, LogRocket, Bugsnag, etc.
            if (import.meta.env.PROD) {
                // Example: Send to Sentry
                // Sentry.captureException(new Error(errorReport.error.message), {
                //   tags: {
                //     feature: errorReport.feature,
                //     type: errorReport.type,
                //   },
                //   extra: errorReport,
                // });

                // Example: Send to custom logging service
                // await fetch(process.env.ERROR_REPORTING_URL, {
                //   method: "POST",
                //   headers: { "Content-Type": "application/json" },
                //   body: JSON.stringify(errorReport),
                // });

                // For now, just log to server console
                console.error("Production Error Report:", JSON.stringify(errorReport, null, 2));
            }

            // Store error in database (optional)
            // await storeErrorReport(errorReport);

            return new Response(JSON.stringify({ success: true, id: generateErrorId() }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Failed to process error report:", error);
            return new Response(JSON.stringify({ success: false, error: "Failed to process error report" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    },
});

function generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Optional: Store error reports in database
// async function storeErrorReport(errorReport: any) {
//   // Implementation depends on your database choice
//   // Example with Convex:
//   // await ctx.db.insert("errorReports", {
//   //   ...errorReport,
//   //   createdAt: Date.now(),
//   // });
// }
