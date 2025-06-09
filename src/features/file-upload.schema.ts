import { zfd } from "zod-form-data";

export const uploadFileSchema = zfd.formData({
    file: zfd.file(),
    title: zfd.text(),
});
