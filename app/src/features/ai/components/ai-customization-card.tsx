import { api } from "@anole/convex/api";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery } from "convex/react";
import type { FC } from "react";
import React, { useEffect, useState } from "react";
import { z } from "zod/v4";

import { FormError } from "@/components/form/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MultipleSelector from "@/components/ui/multiselect";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTED_TRAITS = [
    "friendly",
    "witty",
    "concise",
    "curious",
    "empathetic",
    "creative",
    "patient",
];

const SUGGESTED_TRAITS_OPTIONS = SUGGESTED_TRAITS.map((trait) => {
    return {
        label: trait,
        value: trait,
    };
});

const aiCustomizationSchema = z.object({
    aiBehavior: z.string().max(300, t`Must be at most 300 characters.`).default(""),
    aiContext: z.string().max(3000, t`Must be at most 3000 characters.`).default(""),
    aiName: z.string().max(50, t`Must be at most 50 characters.`).default(""),
    traits: z.array(z.string().max(100, t`Each trait must be at most 100 characters.`)).max(50, t`You can add up to 50 traits.`).default([]),
}).strict();

const initialValues: { aiBehavior: string; aiContext: string; aiName: string; traits: string[] } = {
    aiBehavior: "",
    aiContext: "",
    aiName: "",
    traits: [],
};

const AiCustomizationCard: FC = () => {
    const [formError, setFormError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [traitsError, setTraitsError] = useState<string | undefined>(undefined);

    const aiUserPreferences = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserPreferences = useMutation(api.auth.functions.updateAIUserPreferences);

    const form = useAppForm({
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            setLoading(true);
            setFormError(undefined);

            try {
                await updateAIUserPreferences({
                    customization: {
                        additionalContext: value.aiContext,
                        aiPersonality: value.aiBehavior,
                        name: value.aiName,
                        traits: value.traits || [],
                    },
                });
            } catch (error) {
                setFormError((error as Error).message);
            }

            setLoading(false);
        },
        validators: { onChange: aiCustomizationSchema },
    });

    // Memoized event handlers to avoid recreating in render
    const handleNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue("aiName", event.target.value), [form]);
    const handleBehaviorChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => form.setFieldValue("aiBehavior", event.target.value), [form]);
    const handleContextChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => form.setFieldValue("aiContext", event.target.value), [form]);
    const handleTraitsChange = React.useCallback((options: { label: string; value: string }[]) => {
        if (options.length > 50) {
            setTraitsError(t`You can add up to 50 traits.`);

            return;
        }

        for (const o of options) {
            if (o.value.length > 100) {
                setTraitsError(t`Each trait must be at most 100 characters.`);

                return;
            }
        }

        setTraitsError(undefined);
        form.setFieldValue("traits", options.map((o) => o.value));
    }, [form]);
    const traitsValue = React.useMemo(
        () => (form.state.values.traits ? form.state.values.traits.map((trait: string) => { return { label: trait, value: trait }; }) : []),
        [form.state.values.traits],
    );

    useEffect(() => {
        const customization = aiUserPreferences?.customization;

        if (customization && !form.state.isDirty) {
            form.reset({
                aiBehavior: customization.aiPersonality ?? "",
                aiContext: customization.additionalContext ?? "",
                aiName: customization.name ?? "",
                traits: customization.traits ?? [],
            });
        }
    }, [aiUserPreferences?.customization, form]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t`AI Personalization`}</CardTitle>
                <CardDescription>{t`Customize how the AI addresses you and behaves in conversations`}</CardDescription>
            </CardHeader>
            <form.AppForm>
                <form className="space-y-6" onSubmit={form.handleSubmit}>
                    <CardContent className="space-y-6">
                        <form.AppField name="aiName">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>{t`How should the AI address you?`}</field.FormLabel>
                                    <field.FormControl>
                                        <Input
                                            disabled={loading}
                                            maxLength={50}
                                            onBlur={field.handleBlur}
                                            onChange={handleNameChange}
                                            placeholder={t`e.g. Alex, Dr. Smith, Captain`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormDescription>{t`This helps the AI address you personally in conversations.`}</field.FormDescription>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="aiBehavior">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>{t`Describe how you want the AI to behave and communicate...`}</field.FormLabel>
                                    <field.FormControl>
                                        <Textarea
                                            disabled={loading}
                                            maxLength={300}
                                            onBlur={field.handleBlur}
                                            onChange={handleBehaviorChange}
                                            placeholder={t`Shape the AI's communication style and personality.`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormDescription>{t`Shape the AI's communication style and personality.`}</field.FormDescription>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="aiContext">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>{t`Share relevant information about yourself, your work, or preferences...`}</field.FormLabel>
                                    <field.FormControl>
                                        <Textarea
                                            disabled={loading}
                                            maxLength={3000}
                                            onBlur={field.handleBlur}
                                            onChange={handleContextChange}
                                            placeholder={t`Provide context that helps the AI give you more relevant responses.`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormDescription>{t`Provide context that helps the AI give you more relevant responses.`}</field.FormDescription>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="traits">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>{t`What traits should Chat have?`}</field.FormLabel>
                                    <field.FormControl>
                                        <MultipleSelector
                                            badgeClassName="rounded-md border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 flex select-none items-center gap-1 text-xs font-medium cursor-pointer"
                                            className="mb-2 flex flex-wrap gap-2"
                                            creatable
                                            disabled={loading}
                                            maxSelected={50}
                                            onChange={handleTraitsChange}
                                            options={SUGGESTED_TRAITS_OPTIONS}
                                            placeholder={t`Add or select traits...`}
                                            value={traitsValue}
                                        />
                                    </field.FormControl>
                                    <field.FormDescription>{t`Choose or add personality traits that will shape how Chat interacts with you. (Up to 50 traits, 100 characters each)`}</field.FormDescription>
                                    {traitsError && <div className="text-destructive text-xs mt-1">{traitsError}</div>}
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <FormError error={formError} />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button disabled={loading} type="submit">
                            {loading ? t`Saving...` : t`Save Preferences`}
                        </Button>
                    </CardFooter>
                </form>
            </form.AppForm>
        </Card>
    );
};

export default AiCustomizationCard;
