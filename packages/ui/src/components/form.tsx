import {
    createFormHook,
    createFormHookContexts,
    useStore,
} from "@tanstack/react-form";
import * as React from "react";

import { Label } from "./label";
import { Slot } from "./slot";
import cn from "../utils/cn";

const {
    fieldContext,
    formContext,
    useFieldContext: useFormFieldContext,
    useFormContext,
} = createFormHookContexts();

type FormItemContextValue = {
    id: string;
    required?: boolean;
};

const FormItemContext = React.createContext<FormItemContextValue>(
    {} as FormItemContextValue,
);

interface FormItemProperties extends React.ComponentProps<"div"> {
    required?: boolean;
}

const FormItem = ({
    className,
    required,
    ...properties
}: FormItemProperties) => {
    const id = React.useId();

    return (
        <FormItemContext value={{ id, required }}>
            <div
                className={cn("grid gap-2", className)}
                data-slot="form-item"
                {...properties}
            />
        </FormItemContext>
    );
};

const useFieldContext = () => {
    const { id, required } = React.use(FormItemContext);
    const { name, store, ...fieldContext } = useFormFieldContext();

    const errors = useStore(store, (state) => state.meta.errors);

    if (!fieldContext) {
        throw new Error("useFieldContext should be used within <FormItem>");
    }

    return {
        errors,
        formDescriptionId: `${id}-form-item-description`,
        formItemId: `${id}-form-item`,
        formMessageId: `${id}-form-item-message`,
        id,
        name,
        required,
        store,
        ...fieldContext,
    };
};

interface FormLabelProperties extends React.ComponentProps<typeof Label> {
    required?: boolean;
}

const FormLabel = ({
    children,
    className,
    required,
    ...properties
}: FormLabelProperties) => {
    const { errors, formItemId, required: contextRequired } = useFieldContext();
    const isRequired = required ?? contextRequired;

    return (
        <Label
            className={cn("data-[error=true]:text-destructive", className)}
            data-error={errors.length > 0}
            data-slot="form-label"
            htmlFor={formItemId}
            {...properties}
        >
            {children}
            {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
    );
};

interface FormControlProperties extends React.ComponentProps<typeof Slot> {
    required?: boolean;
}

const FormControl = ({ required, ...properties }: FormControlProperties) => {
    const {
        errors,
        formDescriptionId,
        formItemId,
        formMessageId,
        required: contextRequired,
    } = useFieldContext();
    const isRequired = required ?? contextRequired;

    return (
        <Slot
            aria-describedby={
                errors.length === 0
                    ? formDescriptionId
                    : `${formDescriptionId} ${formMessageId}`
            }
            aria-invalid={errors.length > 0}
            aria-required={isRequired}
            data-required={isRequired}
            data-slot="form-control"
            id={formItemId}
            {...properties}
        />
    );
};

const FormDescription = ({
    className,
    ...properties
}: React.ComponentProps<"p">) => {
    const { formDescriptionId } = useFieldContext();

    return (
        <p
            className={cn("text-muted-foreground text-sm", className)}
            data-slot="form-description"
            id={formDescriptionId}
            {...properties}
        />
    );
};

const FormMessage = ({
    className,
    ...properties
}: React.ComponentProps<"p">) => {
    const { errors, formMessageId } = useFieldContext();
    const body =
        errors.length > 0
            ? String(errors.at(0)?.message ?? "")
            : properties.children;

    if (!body) return null;

    return (
        <p
            className={cn("text-destructive text-sm", className)}
            data-slot="form-message"
            id={formMessageId}
            {...properties}
        >
            {body}
        </p>
    );
};

const { useAppForm, withForm } = createFormHook({
    fieldComponents: {
        FormControl,
        FormDescription,
        FormItem,
        FormLabel,
        FormMessage,
    },
    fieldContext,
    formComponents: {},
    formContext,
});

export {
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
    useAppForm,
    useFieldContext,
    useFormContext,
    withForm,
};
