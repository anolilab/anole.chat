import { useCallback, useEffect, useSyncExternalStore } from "react";

const dispatchStorageEvent = (key, newValue) => {
    globalThis.dispatchEvent(new StorageEvent("storage", { key, newValue }));
};

const setLocalStorageItem = (key, value) => {
    const stringifiedValue = JSON.stringify(value);

    globalThis.localStorage.setItem(key, stringifiedValue);
    dispatchStorageEvent(key, stringifiedValue);
};

const removeLocalStorageItem = (key) => {
    globalThis.localStorage.removeItem(key);
    dispatchStorageEvent(key, null);
};

const getLocalStorageItem = (key) => globalThis.localStorage.getItem(key);

const useLocalStorageSubscribe = (callback) => {
    globalThis.addEventListener("storage", callback);

    return () => globalThis.removeEventListener("storage", callback);
};

const getLocalStorageServerSnapshot = () => {
    throw new Error("useLocalStorage is a client-only hook");
};

const useLocalStorage = (key, initialValue) => {
    const getSnapshot = useCallback<() => string>(() => getLocalStorageItem(key), [key]);

    const store = useSyncExternalStore(useLocalStorageSubscribe, getSnapshot, getLocalStorageServerSnapshot);

    const setState = useCallback(
        (v) => {
            try {
                const nextState = typeof v === "function" ? v(JSON.parse(getSnapshot() as string)) : v;

                if (nextState === undefined || nextState === null) {
                    removeLocalStorageItem(key);
                } else {
                    setLocalStorageItem(key, nextState);
                }
            } catch (error: any) {
                console.warn(error);
            }
        },
        [key, getSnapshot],
    );

    useEffect(() => {
        if (getLocalStorageItem(key) === null && initialValue !== undefined) {
            setLocalStorageItem(key, initialValue);
        }
    }, [key, initialValue]);

    return [store ? JSON.parse(store) : initialValue, setState];
};

export default useLocalStorage;
