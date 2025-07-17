import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

const useIsMobile = (breakpoint: number = MOBILE_BREAKPOINT): boolean => {
    const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = globalThis.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        mql.addEventListener("change", onChange);

        setIsMobile(window.innerWidth < breakpoint);

        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
};

export default useIsMobile;
