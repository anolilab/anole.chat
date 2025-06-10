import { SITE_URL } from "./env";

export default {
    providers: [
        {
            domain: `${SITE_URL}/api/auth`,
            applicationID: "convex",
        },
    ],
};
