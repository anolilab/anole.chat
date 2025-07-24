const isJson = (value: any): value is Record<string, any> => {
    try {
        if (typeof value === "string") {
            const string_ = value.trim();

            JSON.parse(string_);

            return true;
        }

        if (isObject(value)) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
};

export default isJson;
