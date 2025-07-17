import { api } from "@anole/convex/api";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@anole/ui/components/card";
import { useAppForm } from "@anole/ui/components/form";
import { FormError } from "@anole/ui/components/form/form-error";
import { Input } from "@anole/ui/components/input";
import MultipleSelector from "@anole/ui/components/multiselect";
import { Textarea } from "@anole/ui/components/textarea";
import { useLingui } from "@lingui/react/macro";
import { useMutation, useQuery } from "convex/react";
import type { FC } from "react";
import { useState } from "react";
import { z } from "zod/v4";

const SUGGESTED_TRAITS = ["friendly", "witty", "concise", "curious", "empathetic", "creative", "patient"];

const SUGGESTED_TRAITS_OPTIONS = SUGGESTED_TRAITS.map((trait) => {
    return {
        label: trait,
        value: trait,
    };
});

const aiCustomizationSchema = z
    .object({
        aiBehavior: z
            .string()
            .max(300, t`Must be at most 300 characters.`)
            .default(""),
        aiContext: z
            .string()
            .max(3000, t`Must be at most 3000 characters.`)
            .default(""),
        aiName: z
            .string()
            .max(50, t`Must be at most 50 characters.`)
            .default(""),
        traits: z
            .array(z.string().max(1, t`Each trait must be at most 100 characters.`))
            .max(50, t`You can add up to 50 traits.`)
            .default([]),
    })
    .strict();

const AiCustomizationCard: FC = () => {
    const { t } = useLingui();
    const [formError, setFormError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const aiUserPreferences = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserPreferences = useMutation(api.auth.functions.updateAIUserPreferences);

    const form = useAppForm({
        defaultValues: {
            aiBehavior: aiUserPreferences?.customization.aiPersonality ?? "",
            aiContext: aiUserPreferences?.customization.additionalContext ?? "",
            aiName: aiUserPreferences?.customization.name ?? "",
            traits: aiUserPreferences?.customization.traits ?? [],
        },
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
                                            onChange={(event_) => field.handleChange(event_.target.value)}
                                            placeholder={t`e.g. Alex, Dr. Smith, Captain`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <div className="text-muted-foreground mt-1 flex justify-end text-xs">
                                        {field.state.value.length}
                                        /50
                                    </div>
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
                                            onChange={(event_) => field.handleChange(event_.target.value)}
                                            placeholder={t`Shape the AI's communication style and personality.`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <div className="text-muted-foreground mt-1 flex justify-end text-xs">
                                        {field.state.value.length}
                                        /300
                                    </div>
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
                                            onChange={(event_) => field.handleChange(event_.target.value)}
                                            placeholder={t`Provide context that helps the AI give you more relevant responses.`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <div className="text-muted-foreground mt-1 flex justify-end text-xs">
                                        {field.state.value.length}
                                        /3000
                                    </div>
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
                                            onChange={(options: { label: string; value: string }[]) => {
                                                field.handleChange(options.map((o) => o.value));
                                            }}
                                            options={SUGGESTED_TRAITS_OPTIONS}
                                            placeholder={t`Add or select traits...`}
                                            value={field.state.value.map((trait: string) => {
                                                return { label: trait, value: trait };
                                            })}
                                        />
                                    </field.FormControl>
                                    <field.FormDescription>{t`Choose or add personality traits that will shape how Chat interacts with you. (Up to 50 traits, 100 characters each)`}</field.FormDescription>
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
