export const ShortcutsProvider = ({ children, keyMappings = {}, os = "mac" }: ShortcutsProviderProps) => {
    // Add custom mappings for common letters and symbols
    const customMappings = {
        n: { symbols: { default: "N" }, label: "N" },
        d: { symbols: { default: "D" }, label: "D" },
        p: { symbols: { default: "P" }, label: "P" },
        b: { symbols: { default: "B" }, label: "B" },
        "?": { symbols: { default: "?" }, label: "Question Mark" },
    };

    const keyMappingsWithDefaults = defaultsDeep({}, keyMappings, customMappings, DEFAULT_KEY_MAPPINGS);
};
