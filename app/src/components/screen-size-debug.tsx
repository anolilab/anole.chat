import type { FC } from "react";

const screens = [
    { name: "2xl", className: "2xl:block" },
    { name: "xl", className: "xl:block 2xl:hidden" },
    { name: "lg", className: "lg:block xl:hidden" },
    { name: "md", className: "md:block lg:hidden" },
    { name: "sm", className: "sm:block md:hidden" },
    { name: "xs", className: "block sm:hidden" },
];

const ScreenSizeDebug: FC = () => {
    if (!(import.meta.env && import.meta.env.DEV)) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-2 z-[9999] select-none md:top-6 lg:top-8">
            {screens.map((screen) => (
                <span key={screen.name} className={`hidden ${screen.className} rounded bg-black/80 px-3 py-1 font-mono text-xs text-lime-300 shadow-lg`}>
                    {screen.name}
                </span>
            ))}
        </div>
    );
};

export default ScreenSizeDebug;
