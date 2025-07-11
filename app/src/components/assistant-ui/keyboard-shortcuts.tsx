export const ShortcutsProvider = ({ children, keyMappings = {}, os = "mac" }: ShortcutsProviderProps) => {
    // Add custom mappings for common letters and symbols

    const customMappings = {
        "?": { label: "Question Mark", symbols: { default: "?" } },
        b: { label: "B", symbols: { default: "B" } },
        d: { label: "D", symbols: { default: "D" } },
        n: { label: "N", symbols: { default: "N" } },
        p: { label: "P", symbols: { default: "P" } },
    };

    const keyMappingsWithDefaults = defaultsDeep({}, keyMappings, customMappings, DEFAULT_KEY_MAPPINGS);
};
