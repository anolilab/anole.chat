import { createFileRoute } from "@tanstack/react-router";

import FilesComponent from "@/features/files/files-component";

export const Route = createFileRoute("/(files)/files")({
    component: FilesComponent,
});
