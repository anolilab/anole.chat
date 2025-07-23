"use client";

import { FlipWords } from "@anole/ui/components/flip-words";
import { useLingui } from "@lingui/react/macro";
import { authClient } from "auth/client";
import { motion } from "motion/react";
import { useMemo } from "react";

function getGreetingByTime() {
    const hour = new Date().getHours();

    if (hour < 12)
        return "goodMorning";

    if (hour < 18)
        return "goodAfternoon";

    return "goodEvening";
}

export const ChatGreeting = () => {
    const { data: session } = authClient.useSession();

    const { t } = useLingui();
    const user = session?.user;

    const word = useMemo(() => {
        if (!user?.name)
            return "";

        const words = [
            /*
            t(getGreetingByTime(), { name: user.name }),
            t`niceToSeeYouAgain", { name: user.name }),
            t`whatAreYouWorkingOnToday", { name: user.name }),
            t`letMeKnowWhenYoureReadyToBegin"),
            t`whatAreYourThoughtsToday"),
            t`whereWouldYouLikeToStart"),
            t`whatAreYouThinking", { name: user.name }),
            */
        ];

        return words[Math.floor(Math.random() * words.length)];
    }, [user?.name]);

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="mx-auto my-4 h-20 max-w-3xl"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="welcome"
            transition={{ delay: 0.3 }}
        >
            <div className="flex flex-col gap-2 rounded-xl p-6 text-center leading-relaxed">
                <h1 className="text-2xl md:text-3xl">{word ? <FlipWords className="text-primary" words={[word]} /> : ""}</h1>
            </div>
        </motion.div>
    );
};
