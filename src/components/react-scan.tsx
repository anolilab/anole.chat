"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { useEffect } from "react";

export const ReactScan = () => {
    useEffect(() => {
        scan({
            enabled: import.meta.env.DEV,
        });
    }, []);

    return <></>;
}
