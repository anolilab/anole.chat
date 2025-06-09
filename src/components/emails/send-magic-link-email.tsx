import { Button, Text } from "@react-email/components";
import { EmailLayout } from "./layout-email";

export const SendMagicLinkEmail = ({ username, url, token }: { username: string; url: string; token: string }) => {
    return (
        <EmailLayout preview="Your magic link to sign in">
            <Text className="text-2xl font-bold text-gray-800">Magic Link</Text>
            <Text className="text-gray-600">Hi {username},</Text>
            <Text className="text-gray-600">Please click the button below to sign in:</Text>
            <Button className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white" href={url}>
                Sign In
            </Button>
            <Text className="mt-4 text-gray-600">Or copy and paste this link in your browser:</Text>
            <Text className="font-medium break-all text-blue-600">{url}</Text>
            <Text className="mt-6 text-sm text-gray-500">If you didn't request this magic link, you can safely ignore this email.</Text>
        </EmailLayout>
    );
};
