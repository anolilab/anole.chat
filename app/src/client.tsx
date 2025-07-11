import { i18n } from "@lingui/core";
import { StartClient } from "@tanstack/react-start";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { dynamicActivate } from "@/lib/intl/client";

import { createRouter } from "./router";

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
