import { SiteHeader } from "@/components/sidebar/site-header";
import { useThreadListItem } from "@assistant-ui/react";

export const ChatSiteHeader = ({ threadId }: { threadId: string }) => {
    const threadListItemRuntime = useThreadListItem((t) => {
        console.log((t))
    });
    //console.log(threadListItemRuntime);
    return <SiteHeader title="Chat" />;
};