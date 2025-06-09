import { betterAuth } from "@/lib/auth/server";

import { createServerFileRoute } from "@tanstack/react-start/server";
import { oAuthDiscoveryMetadata } from "better-auth/plugins";

export const ServerRoute = createServerFileRoute("/[/]well-known/oauth-authorization-server").methods({
    GET: oAuthDiscoveryMetadata(betterAuth),
});
