import { Text } from "@react-email/components";

import { EmailLayout } from "./layout-email";

export const SendVerificationOTP = ({ otp, username }: { otp: string; username: string }) => (
    <EmailLayout preview="Your verification code">
        <Text className="text-2xl font-bold text-gray-800">Verify your email</Text>
        <Text className="text-gray-600">
            Hi
            {username}
            ,
        </Text>
        <Text className="text-gray-600">Please enter the following code to verify your email address:</Text>
        <Text className="my-4 block bg-gray-100 px-6 py-3 text-center font-mono text-xl">{otp}</Text>
        <Text className="mt-6 text-sm text-gray-500">If you didn't request this code, you can safely ignore this email.</Text>
    </EmailLayout>
);
