import { createFileRoute } from "@tanstack/react-router";

const ChatPage = () => {
    return <div>Hello "/chat/"!</div>;
};

export const Route = createFileRoute("/(chat)/chat/")({
    component: ChatPage,
});
