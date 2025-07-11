import type { HTMLProps, ReactNode } from "react";
import { createContext, use } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/*
Example Usage:

<ShortcutsProvider os="mac">
  <h3 className="font-semibold">Keyboard Shortcuts</h3>
  <div className="flex justify-between">
    <p>Undo</p>
    <KeyCombo keyNames={[Keys.Command, "z"]} />
  </div>
  <div className="flex justify-between">
    <p>Redo</p>
    <KeyCombo keyNames={[Keys.Command, Keys.Shift, "z"]} />
  </div>
  <div className="flex justify-between">
    <p>Clear Selection</p>
    <KeySymbol keyName={Keys.Escape} />
  </div>
</ShortcutsProvider>;
*/

interface KeyData {
    label: string;
    symbols: {
        default: string;
        mac?: string;
        windows?: string;
    };
}

export enum Keys {
    Alt = "Alt",
    ArrowDown = "ArrowDown",
    ArrowLeft = "ArrowLeft",
    ArrowRight = "ArrowRight",
    ArrowUp = "ArrowUp",
    Backspace = "Backspace",
    CapsLock = "CapsLock",
    Command = "Command",
    Control = "Control",
    Delete = "Delete",
    End = "End",
    Enter = "Enter",
    Escape = "Escape",
    Function_ = "Fn",
    Home = "Home",
    Insert = "Insert",
    PageDown = "PageDown",
    PageUp = "PageUp",
    Pause = "Pause",
    PrintScreen = "PrintScreen",
    Shift = "Shift",
    Space = "Space",
    Tab = "Tab",
}

export const DEFAULT_KEY_MAPPINGS = {
    [Keys.Alt]: {
        label: "Alt/Option",
        symbols: { default: "Alt", mac: "⌥" },
    },
    [Keys.ArrowDown]: {
        label: "Arrow Down",
        symbols: { default: "↓" },
    },
    [Keys.ArrowLeft]: {
        label: "Arrow Left",
        symbols: { default: "←" },
    },
    [Keys.ArrowRight]: {
        label: "Arrow Right",
        symbols: { default: "→" },
    },
    [Keys.ArrowUp]: {
        label: "Arrow Up",
        symbols: { default: "↑" },
    },
    [Keys.Backspace]: {
        label: "Backspace",
        symbols: { default: "⟵", mac: "⌫" },
    },
    [Keys.CapsLock]: {
        label: "Caps Lock",
        symbols: { default: "⇪" },
    },
    [Keys.Command]: {
        label: "Command",
        symbols: { default: "Command", mac: "⌘", windows: "⊞ Win" },
    },
    [Keys.Control]: {
        label: "Control",
        symbols: { default: "Ctrl", mac: "⌃" },
    },
    [Keys.Delete]: {
        label: "Delete",
        symbols: { default: "Del", mac: "⌦" },
    },
    [Keys.End]: {
        label: "End",
        symbols: { default: "End", mac: "↘" },
    },
    [Keys.Enter]: {
        label: "Enter",
        symbols: { default: "↵", mac: "↩" },
    },
    [Keys.Escape]: {
        label: "Escape",
        symbols: { default: "Esc", mac: "⎋" },
    },
    [Keys.Fn]: {
        label: "Fn",
        symbols: { default: "Fn" }, // mac symbol for Fn not universally recognized
    },
    [Keys.Home]: {
        label: "Home",
        symbols: { default: "Home", mac: "↖" },
    },
    [Keys.Insert]: {
        label: "Insert",
        symbols: { default: "Ins" },
    },
    [Keys.PageDown]: {
        label: "Page Down",
        symbols: { default: "PgDn", mac: "⇟" },
    },
    [Keys.PageUp]: {
        label: "Page Up",
        symbols: { default: "PgUp", mac: "⇞" },
    },
    [Keys.Pause]: {
        label: "Pause/Break",
        symbols: { default: "Pause", mac: "⎉" },
    },
    [Keys.PrintScreen]: {
        label: "Print Screen",
        symbols: { default: "PrtSc" },
    },
    [Keys.Shift]: {
        label: "Shift",
        symbols: { default: "Shift", mac: "⇧" },
    },
    [Keys.Space]: {
        label: "Space",
        symbols: { default: "␣" },
    },
    [Keys.Tab]: {
        label: "Tab",
        symbols: { default: "⭾", mac: "⇥" },
    },
};

interface ShortcutsContextData {
    keyMappings: Record<string, KeyData>;
    os: "mac" | "windows";
}

const ShortcutsContext = createContext<ShortcutsContextData>({
    keyMappings: DEFAULT_KEY_MAPPINGS,
    os: "mac",
});

const useShortcutsContext = () => use(ShortcutsContext);

interface ShortcutsProviderProperties {
    children: ReactNode;
    keyMappings?: Record<
        string,
        {
            label?: string;
            symbols?: {
                default?: string;
                mac?: string;
                windows?: string;
            };
        }
    >;
    os?: ShortcutsContextData["os"];
}

export const ShortcutsProvider = ({ children, keyMappings = {}, os = detectOS() }: ShortcutsProviderProperties) => {
    const keyMappingsWithDefaults = defaultsDeep({}, keyMappings, DEFAULT_KEY_MAPPINGS);

    return (
        <TooltipProvider>
            <ShortcutsContext value={{ keyMappings: keyMappingsWithDefaults, os }}>{children}</ShortcutsContext>
        </TooltipProvider>
    );
};

interface KeySymbolProperties extends HTMLProps<HTMLDivElement> {
    disableTooltip?: boolean;
    keyName: string;
}

export const KeySymbol = ({ className, disableTooltip = false, keyName, ...otherProperties }: KeySymbolProperties) => {
    const context = useShortcutsContext();
    const { keyMappings } = context;
    const os = context.os || "default";
    const keyData = keyMappings[keyName];
    const symbol = keyData?.symbols?.[os] ?? keyData?.symbols?.default ?? keyName;
    const label = keyData?.label ?? keyName;

    return (
        <Tooltip delayDuration={300}>
            <TooltipTrigger>
                <div
                    className={cn(
                        "border-foreground/20 text-foreground/50 flex h-5 w-fit min-w-[1.25rem] items-center justify-center rounded-md border px-1 text-xs",
                        className,
                    )}
                    {...otherProperties}
                >
                    <span>{symbol}</span>
                </div>
            </TooltipTrigger>
            {!disableTooltip && label !== symbol && <TooltipContent className="px-2 py-1">{label}</TooltipContent>}
        </Tooltip>
    );
};

interface KeyComboProperties extends HTMLProps<HTMLDivElement> {
    disableTooltips?: boolean;
    keyNames: string[];
}

export const KeyCombo = ({ className, disableTooltips = false, keyNames, ...otherProperties }: KeyComboProperties) => (
    <div className={cn("flex gap-1", className)} {...otherProperties}>
        {keyNames.map((keyName) => (
            <KeySymbol disableTooltip={disableTooltips} key={keyName} keyName={keyName} />
        ))}
    </div>
);

// Simple utility to merge objects deeply (replaces lodash.defaultsdeep)
function defaultsDeep(target: any, ...sources: any[]): any {
    if (sources.length === 0)
        return target;

    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });

                defaultsDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return defaultsDeep(target, ...sources);
}

function isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
}

// Utility to detect OS
export function detectOS(): "mac" | "windows" {
    if (globalThis.window === undefined)
        return "mac"; // Default for SSR

    const platform = globalThis.navigator.platform.toLowerCase();

    return platform.includes("mac") ? "mac" : "windows";
}
