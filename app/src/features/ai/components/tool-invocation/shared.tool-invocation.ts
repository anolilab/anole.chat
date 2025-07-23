export const sanitizeCssVariableName = (label: string) =>
    label
        .replaceAll(" ", "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9\-_]/g, "_");
