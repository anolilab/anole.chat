import { SiteHeader } from "@/components/sidebar/site-header";
import { useThreadListItem } from "@assistant-ui/react";

export const ChatSiteHeader = () => {
    const title = useThreadListItem((t) => t.title);

    return <SiteHeader title={title || "New Chat"} />;
};
