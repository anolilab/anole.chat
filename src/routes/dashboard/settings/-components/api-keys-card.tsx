import React, { useState } from "react";
import { Eye, EyeOff, Key, Trash2, Plus, ExternalLink, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { showError, showSuccess } from "@/lib/toast";
import { api } from "@cvx/_generated/api";
import { useAction } from "convex/react";

type Provider = "openai" | "anthropic" | "google";

interface ProviderConfig {
    name: string;
    description: string;
    icon: string;
    keyPrefix: string;
    docsUrl: string;
    getKeyUrl: string;
    color: string;
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
    openai: {
        name: "OpenAI",
        description: "Access GPT-4 and other OpenAI models",
        icon: "🤖",
        keyPrefix: "sk-",
        docsUrl: "https://platform.openai.com/docs/api-reference",
        getKeyUrl: "https://platform.openai.com/api-keys",
        color: "bg-green-100 text-green-800 border-green-200",
    },
    anthropic: {
        name: "Anthropic",
        description: "Access Claude models",
        icon: "🧠",
        keyPrefix: "sk-ant-",
        docsUrl: "https://docs.anthropic.com/claude/reference/getting-started-with-the-api",
        getKeyUrl: "https://console.anthropic.com/settings/keys",
        color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    google: {
        name: "Google AI",
        description: "Access Gemini models",
        icon: "🌟",
        keyPrefix: "AI",
        docsUrl: "https://ai.google.dev/docs",
        getKeyUrl: "https://aistudio.google.com/app/apikey",
        color: "bg-blue-100 text-blue-800 border-blue-200",
    },
};

export function ApiKeysCard({ sessionToken }: { sessionToken: string }) {
    const [showKeys, setShowKeys] = useState<Record<Provider, boolean>>({
        openai: false,
        anthropic: false,
        google: false,
    });
    const [newKeys, setNewKeys] = useState<Record<Provider, string>>({
        openai: "",
        anthropic: "",
        google: "",
    });
    const [validatingKeys, setValidatingKeys] = useState<Record<Provider, boolean>>({
        openai: false,
        anthropic: false,
        google: false,
    });

    // Actions for API key management
    const getUserApiKeys = useAction(api.ai.functions.getUserApiKeys);
    const getUserAvailableProviders = useAction(api.ai.functions.getUserAvailableProviders);
    const storeApiKey = useAction(api.ai.functions.storeUserApiKey);
    const removeApiKey = useAction(api.ai.functions.removeUserApiKey);
    const validateApiKey = useAction(api.ai.functions.validateApiKey);

    // State for API keys and providers
    const [userApiKeys, setUserApiKeys] = useState<{ provider: string; hasKey: boolean; createdAt: number }[]>([]);
    const [availableProviders, setAvailableProviders] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Load data when session is available
    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [keys, providers] = await Promise.all([getUserApiKeys({ sessionToken }), getUserAvailableProviders({ sessionToken })]);
                setUserApiKeys(keys);
                setAvailableProviders(providers);
            } catch (error) {
                showError("Failed to load API keys data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [sessionToken, getUserApiKeys, getUserAvailableProviders]);

    const handleStoreKey = async (provider: Provider) => {
        const apiKey = newKeys[provider].trim();
        if (!apiKey) return;

        try {
            // First validate the key
            setValidatingKeys((prev) => ({ ...prev, [provider]: true }));
            const validation = await validateApiKey({
                provider,
                apiKey,
                sessionToken,
            });

            if (!validation.valid) {
                showError(`Invalid ${PROVIDERS[provider].name} API key: ${validation.message}`);
                return;
            }

            // Store the key if valid
            const result = await storeApiKey({
                provider,
                apiKey,
                sessionToken,
            });

            if (!result.success) {
                showError(result.message || `Failed to store ${PROVIDERS[provider].name} API key`);
                return;
            }

            setNewKeys((prev) => ({ ...prev, [provider]: "" }));
            showSuccess(result.message || `${PROVIDERS[provider].name} API key stored successfully`);

            // Reload data after successful storage
            const [keys, providers] = await Promise.all([getUserApiKeys({ sessionToken }), getUserAvailableProviders({ sessionToken })]);
            setUserApiKeys(keys);
            setAvailableProviders(providers);
        } catch (error: any) {
            showError(`Failed to store API key: ${error.message}`);
        } finally {
            setValidatingKeys((prev) => ({ ...prev, [provider]: false }));
        }
    };

    const handleRemoveKey = async (provider: Provider) => {
        try {
            await removeApiKey({
                provider,
                sessionToken,
            });

            showSuccess(`${PROVIDERS[provider].name} API key removed`);

            // Reload data after successful removal
            const [keys, providers] = await Promise.all([getUserApiKeys({ sessionToken }), getUserAvailableProviders({ sessionToken })]);

            setUserApiKeys(keys);
            setAvailableProviders(providers);
        } catch (error: any) {
            showError(`Failed to remove API key: ${error.message}`);
        }
    };

    const toggleKeyVisibility = (provider: Provider) => {
        setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
    };

    const hasUserKey = (provider: Provider) => {
        return userApiKeys?.some((key) => key.provider === provider && key.hasKey);
    };

    const hasSystemKey = (provider: Provider) => {
        return availableProviders?.[provider]?.hasSystemKey || false;
    };

    return (
        <div className="flex w-full flex-1 p-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Keys
                    </CardTitle>
                    <CardDescription>Manage your AI provider API keys for direct access to models</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Security Notice */}
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            Your API keys are encrypted using XChaCha20-Poly1305 encryption and stored securely. Keys are only decrypted when making API calls
                            to the respective providers.
                        </AlertDescription>
                    </Alert>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Benefits of using your own keys:</h4>
                            <ul className="text-muted-foreground space-y-1 text-sm">
                                <li>• Direct billing (no markup)</li>
                                <li>• Access to your rate limits</li>
                                <li>• Latest model availability</li>
                                <li>• Enhanced privacy</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Supported Providers:</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(PROVIDERS).map(([key, provider]) => (
                                    <Badge key={key} variant="outline" className={provider.color}>
                                        {provider.icon} {provider.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* API Key Management for each provider */}
                    <div className="space-y-6">
                        {Object.entries(PROVIDERS).map(([providerId, provider]) => {
                            const providerKey = providerId as Provider;
                            const userHasKey = hasUserKey(providerKey);
                            const systemHasKey = hasSystemKey(providerKey);

                            return (
                                <div key={providerId} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{provider.icon}</span>
                                            <div>
                                                <h3 className="font-medium">{provider.name}</h3>
                                                <p className="text-muted-foreground text-sm">{provider.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {userHasKey && (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Your Key
                                                </Badge>
                                            )}
                                            {!userHasKey && systemHasKey && <Badge variant="secondary">System Key</Badge>}
                                            {!userHasKey && !systemHasKey && (
                                                <Badge variant="destructive">
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    No Key
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {userHasKey ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    type={showKeys[providerKey] ? "text" : "password"}
                                                    value={showKeys[providerKey] ? `${provider.keyPrefix}****` : "••••••••••••••••"}
                                                    readOnly
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <Button variant="outline" size="icon" onClick={() => toggleKeyVisibility(providerKey)}>
                                                {showKeys[providerKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleRemoveKey(providerKey)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <Label htmlFor={`${providerId}-key`}>API Key</Label>
                                                    <Input
                                                        id={`${providerId}-key`}
                                                        type="password"
                                                        placeholder={`Enter your ${provider.name} API key (${provider.keyPrefix}...)`}
                                                        value={newKeys[providerKey]}
                                                        onChange={(e) => setNewKeys((prev) => ({ ...prev, [providerKey]: e.target.value }))}
                                                        className="font-mono"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => handleStoreKey(providerKey)}
                                                    disabled={!newKeys[providerKey].trim() || validatingKeys[providerKey]}
                                                    className="mt-6"
                                                >
                                                    {validatingKeys[providerKey] ? (
                                                        "Validating..."
                                                    ) : (
                                                        <>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add Key
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="text-muted-foreground flex items-center gap-4 text-sm">
                                                <a
                                                    href={provider.getKeyUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-foreground flex items-center gap-1"
                                                >
                                                    Get API Key
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                                <a
                                                    href={provider.docsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-foreground flex items-center gap-1"
                                                >
                                                    Documentation
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {providerId !== "google" && <Separator />}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
