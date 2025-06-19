import { i18n } from "@lingui/core";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

import { setupLocaleFromRequest } from "./lib/intl/server";
import { createRouter } from "./router";

const defineHandler = () => async (event) => {
    await setupLocaleFromRequest();

    const startHandler = createStartHandler({
        createRouter: () => createRouter({ i18n }),
    })(defaultStreamHandler);

    return startHandler(event);
};

export default defineHandler();
