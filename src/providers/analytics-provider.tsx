import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, type FC, type PropsWithChildren } from "react";

export const AnalyticsProvider: FC<PropsWithChildren> = ({ children }) => {
    useEffect(() => {
        if (import.meta.env.DEV || !window || !import.meta.env.VITE_POSTHOG_API_KEY || !import.meta.env.VITE_POSTHOG_HOST) {
            return;
        }

        posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST,
            loaded: (ph) => {
                if (import.meta.env && import.meta.env.DEV) {
                    ph.opt_in_capturing(); // Ensure capturing is on for debug
                    ph.debug();
                    // You can also call ph.debug() here if you want verbose debugging output
                }
            },
            // Ensure flags are loaded before rendering the app, if you use feature flags
            bootstrap: {
                // distinctID: 'your_distinct_id', // Optional: if you have a distinct ID to set
                // isIdentifiedID: false, // Optional: set to true if the distinctID is from an identify call
                // featureFlags: { 'beta-feature': true, 'another-flag': 'variant' }, // Optional: initial feature flags
                // featureFlagPayloads: { 'another-flag': { value: 'something' } }, // Optional: initial feature flag payloads
            },
            capture_pageview: true,
            person_profiles: "always",
        });
    }, []);

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};