import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
import { Slot } from "@/components/ui/slot";

const { fieldContext, formContext, useFieldContext: useFormFieldContext, useFormContext } = createFormHookContexts();

const { useAppForm, withForm } = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: {
        FormLabel,
        FormControl,
        FormDescription,
        FormMessage,
        FormItem,
    },
    formComponents: {},
});

type FormItemContextValue = {
    id: string;
    required?: boolean;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

interface FormItemProps extends React.ComponentProps<"div"> {
    required?: boolean;
}

function FormItem({ className, required, ...props }: FormItemProps) {
    const id = React.useId();

    return (
        <FormItemContext.Provider value={{ id, required }}>
            <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
        </FormItemContext.Provider>
    );
}

const useFieldContext = () => {
    const { id, required } = React.useContext(FormItemContext);
    const { name, store, ...fieldContext } = useFormFieldContext();

    const errors = useStore(store, (state) => state.meta.errors);
    if (!fieldContext) {
        throw new Error("useFieldContext should be used within <FormItem>");
    }

    return {
        id,
        name,
        required,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        errors,
        store,
        ...fieldContext,
    };
};

interface FormLabelProps extends React.ComponentProps<typeof Label> {
    required?: boolean;
}

function FormLabel({ className, required, children, ...props }: FormLabelProps) {
    const { formItemId, errors, required: contextRequired } = useFieldContext();
    const isRequired = required ?? contextRequired;

    return (
        <Label
            data-slot="form-label"
            data-error={!!errors.length}
            className={cn("data-[error=true]:text-destructive", className)}
            htmlFor={formItemId}
            {...props}
        >
            {children}
            {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
    );
}

interface FormControlProps extends React.ComponentProps<typeof Slot> {
    required?: boolean;
}

function FormControl({ required, ...props }: FormControlProps) {
    const { errors, formItemId, formDescriptionId, formMessageId, required: contextRequired } = useFieldContext();
    const isRequired = required ?? contextRequired;

    return (
        <Slot
            data-slot="form-control"
            id={formItemId}
            aria-describedby={!errors.length ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
            aria-invalid={!!errors.length}
            aria-required={isRequired}
            data-required={isRequired}
            {...props}
        />
    );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
    const { formDescriptionId } = useFieldContext();

    return <p data-slot="form-description" id={formDescriptionId} className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
    const { errors, formMessageId } = useFieldContext();
    const body = errors.length ? String(errors.at(0)?.message ?? "") : props.children;
    if (!body) return null;

    return (
        <p data-slot="form-message" id={formMessageId} className={cn("text-destructive text-sm", className)} {...props}>
            {body}
        </p>
    );
}

export { useAppForm, useFormContext, useFieldContext, withForm };
