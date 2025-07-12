import { api } from "@anole/convex/api";
import { useMutation, useQuery } from "convex/react";
import { Copy as CopyIcon, Pencil, Server, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

// Utility for copying to clipboard
const useCopyToClipboard: () => { copied: boolean; copy: (text: string) => void } = () => {
    const [copied, setCopied] = useState(false);
    const copy = (text: string) => {
        if (globalThis.window !== undefined && globalThis.navigator?.clipboard) {
            globalThis.navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        }
    };

    return { copied, copy };
};

type CustomProvider = {
    enabled: boolean;
    encryptedKey: string;
    endpoint: string;
    name: string;
};

type CustomProviders = Record<string, CustomProvider>;

const initialForm: CustomProvider = {
    enabled: true,
    encryptedKey: "",
    endpoint: "",
    name: "",
};

const CustomProviderCard: FC = () => {
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettings = useMutation(api.auth.functions.updateAIUserPreferences);
    const [editingKey, setEditingKey] = useState<string | undefined>(undefined);
    const [form, setForm] = useState<CustomProvider>(initialForm);
    const [loading, setLoading] = useState(false);
    const { copied, copy } = useCopyToClipboard();

    const customProviders: CustomProviders = aiSettings?.customAIProviders || {};

    // Handlers
    const handleEdit = (key: string) => {
        setEditingKey(key);
        setForm(customProviders[key] ?? initialForm);
    };

    const handleDelete = async (key: string) => {
        setLoading(true);
        const updated = { ...customProviders };

        delete updated[key];
        await updateAIUserSettings({ customAIProviders: updated });
        setLoading(false);

        if (editingKey === key)
            setEditingKey(undefined);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { checked, name, type, value } = event.target;

        setForm((f) => { return { ...f, [name]: type === "checkbox" ? checked : value }; });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!form.name || !form.endpoint || !form.encryptedKey)
            return;

        setLoading(true);
        const key = editingKey || form.name;

        await updateAIUserSettings({
            customAIProviders: {
                ...customProviders,
                [key]: { ...form },
            },
        });
        setEditingKey(undefined);
        setForm(initialForm);
        setLoading(false);
    };

    const handleCancel = () => {
        setEditingKey(undefined);
        setForm(initialForm);
    };

    // Memoized handlers for copy buttons
    const handleCopyKey = (key: string) => () => copy(key);

    return (
        <div className="space-y-8">
            {/* Add/Edit Form */}
            <form
                aria-label={editingKey ? "Edit Provider" : "Add Provider"}
                className="rounded-lg border bg-white dark:bg-zinc-900 p-6 shadow flex flex-col gap-4"
                onSubmit={handleSubmit}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Server className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg">
                        {editingKey ? "Edit Provider" : "Add Custom Provider"}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium">Provider Name</span>
                        <input
                            autoComplete="off"
                            className="input input-bordered"
                            disabled={loading}
                            name="name"
                            onChange={handleChange}
                            placeholder="Provider Name"
                            required
                            value={form.name}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium">API Endpoint</span>
                        <input
                            autoComplete="off"
                            className="input input-bordered"
                            disabled={loading}
                            name="endpoint"
                            onChange={handleChange}
                            placeholder="API Endpoint"
                            required
                            value={form.endpoint}
                        />
                    </label>
                    <label className="flex flex-col gap-1 relative">
                        <span className="text-xs font-medium">Encrypted API Key</span>
                        <input
                            aria-describedby="key-help"
                            autoComplete="off"
                            className="input input-bordered pr-10"
                            disabled={loading}
                            name="encryptedKey"
                            onChange={handleChange}
                            placeholder="Encrypted API Key"
                            required
                            type="password"
                            value={form.encryptedKey}
                        />
                        <button
                            aria-label="Copy encrypted key"
                            className="absolute right-2 top-7 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            disabled={!form.encryptedKey}
                            onClick={handleCopyKey(form.encryptedKey)}
                            tabIndex={0}
                            type="button"
                        >
                            <CopyIcon className={`w-4 h-4 ${copied ? "text-green-500" : "text-zinc-500"}`} />
                        </button>
                        <span className="text-xs text-zinc-400 mt-1" id="key-help">
                            Key is hidden for security. Click copy to use.
                        </span>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium">Status</span>
                        <div className="flex items-center gap-2">
                            <input
                                aria-checked={form.enabled}
                                checked={form.enabled}
                                className="toggle toggle-primary"
                                disabled={loading}
                                name="enabled"
                                onChange={handleChange}
                                type="checkbox"
                            />
                            <span className={`badge ${form.enabled ? "badge-success" : "badge-ghost"}`}>{form.enabled ? "Enabled" : "Disabled"}</span>
                        </div>
                    </label>
                </div>
                <div className="flex gap-2 mt-2">
                    <button
                        aria-busy={loading}
                        className="btn btn-primary"
                        disabled={loading}
                        type="submit"
                    >
                        {editingKey ? "Update Provider" : "Add Provider"}
                    </button>
                    {editingKey && (
                        <button
                            className="btn btn-secondary"
                            disabled={loading}
                            onClick={handleCancel}
                            type="button"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
            <hr className="border-zinc-200 dark:border-zinc-700" />
            {/* Provider List */}
            <div>
                <h3 className="mb-4 font-semibold text-lg flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    {" "}
                    Custom Providers
                </h3>
                {Object.entries(customProviders).length === 0
                    ? (
                        <div className="text-zinc-500 text-center py-8">No custom providers.</div>
                    )
                    : (
                        <ul className="grid gap-4">
                            {Object.entries(customProviders).map(([key, provider]) => {
                                const handleCopy = handleCopyKey(provider.encryptedKey);

                                return (
                                    <li
                                        key={key}
                                        className="rounded-lg border bg-white dark:bg-zinc-900 p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-lg transition-shadow group"
                                    >
                                        <div className="flex items-center gap-3">
                                          <Server className="w-6 h-6 text-primary" />
                                          <div>
                                            <div className="font-medium text-base flex items-center gap-2">
                                              {provider.name}
                                              <span className={`badge ${provider.enabled ? "badge-success" : "badge-ghost"}`}>{provider.enabled ? "Enabled" : "Disabled"}</span>
                                          </div>
                                            <div className="text-xs text-zinc-500">{provider.endpoint}</div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                                              Key: {provider.encryptedKey.slice(0, 6)}
                                              ***
<button
    aria-label="Copy encrypted key"
    className="ml-1 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
    onClick={handleCopy}
    tabIndex={0}
    type="button"
>
    <CopyIcon className="w-4 h-4 text-zinc-500" />
</button>
                                          </div>
                                        </div>
                                      </div>
                                        <div className="flex gap-2 mt-2 md:mt-0">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline flex items-center gap-1"
                                            onClick={() => handleEdit(key)}
                                            aria-label="Edit provider"
                                            disabled={loading}
                                        >
                                            <Pencil className="w-4 h-4" />
                                            {" "}
                                            Edit
</button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-error flex items-center gap-1"
                                            onClick={() => handleDelete(key)}
                                            aria-label="Delete provider"
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {" "}
                                            Delete
</button>
                                      </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
            </div>
        </div>
    );
};

export default CustomProviderCard;
