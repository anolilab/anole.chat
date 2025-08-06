const objectFlow = <T extends Record<string, any>>(object: T) => {
    return {
        every: (function_: (value: T[keyof T], key: keyof T) => any): boolean => Object.entries(object).every(([key, value]) => function_(value, key)),
        filter: (function_: (value: T[keyof T], key: keyof T) => boolean): Record<keyof T, T[keyof T]> =>
            Object.fromEntries(Object.entries(object).filter(([key, value]) => function_(value, key))) as Record<keyof T, T[keyof T]>,

        find(function_: (value: T[keyof T], key: keyof T) => any): T | undefined {
            return Object.entries(object).find(([key, value]) => function_(value, key))?.[1];
        },
        forEach: (function_: (value: T[keyof T], key: keyof T) => void): void => {
            Object.entries(object).forEach(([key, value]) => function_(value, key));
        },
        getByPath<U>(path: string[]): U | undefined {
            let result: any = object;

            path.find((p) => {
                result = result?.[p];

                return !result;
            });

            return result;
        },
        map: <R>(function_: (value: T[keyof T], key: keyof T) => R): Record<keyof T, R> =>
            Object.fromEntries(Object.entries(object).map(([key, value]) => [key, function_(value, key)])) as Record<keyof T, R>,
        setByPath(path: string[], value: any) {
            path.reduce((accumulator, current, index) => {
                const isLast = index == path.length - 1;

                if (isLast) {
                    accumulator[current] = value;

                    return accumulator;
                }

                accumulator[current] ??= {};

                return accumulator[current];
            }, object as object);

            return object;
        },
        some: (function_: (value: T[keyof T], key: keyof T) => any): boolean => Object.entries(object).some(([key, value]) => function_(value, key)),
    };
};

export default objectFlow;
