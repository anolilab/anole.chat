"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const InputOTP = ({
    className,
    containerClassName,
    ...properties
}: React.ComponentProps<typeof OTPInput> & {
    containerClassName?: string;
}) => (
    <OTPInput
        className={cn("disabled:cursor-not-allowed", className)}
        containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
        data-slot="input-otp"
        {...properties}
    />
);

const InputOTPGroup = ({ className, ...properties }: React.ComponentProps<"div">) => (
    <div className={cn("flex items-center", className)} data-slot="input-otp-group" {...properties} />
);

const InputOTPSlot = ({
    className,
    index,
    ...properties
}: React.ComponentProps<"div"> & {
    index: number;
}) => {
    const inputOTPContext = React.use(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

    return (
        <div
            className={cn(
                "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input shadow-xs relative flex h-9 w-9 items-center justify-center border-y border-r text-sm outline-none transition-all first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
                className,
            )}
            data-active={isActive}
            data-slot="input-otp-slot"
            {...properties}
        >
            {char}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
                </div>
            )}
        </div>
    );
};

const InputOTPSeparator = ({ ...properties }: React.ComponentProps<"div">) => (
    <div data-slot="input-otp-separator" role="separator" {...properties}>
        <MinusIcon />
    </div>
);

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
