import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";
import { createRouter } from "./router";
import { i18n } from "@lingui/core";
import { dynamicActivate } from "@/lib/intl/client";

dynamicActivate(document.documentElement.lang);

const router = createRouter({ i18n });

startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <StartClient router={router} />
        </StrictMode>,
    );
});
