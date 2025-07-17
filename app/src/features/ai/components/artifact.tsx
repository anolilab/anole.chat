import type { ReactNode } from "react";
import type {
    ArtifactAction,
    ArtifactConfig,
    ArtifactContent,
    ArtifactKind,
    ArtifactToolbarItem,
    InitializeParameters,
    UIArtifact,
} from "../types/artifacts";

export class Artifact<T extends string, M = any> {
    readonly kind: T;
    readonly description: string;
    readonly content: React.ComponentType<ArtifactContent<M>>;
    readonly actions: Array<ArtifactAction<M>>;
    readonly toolbar: ArtifactToolbarItem[];
    readonly initialize?: (parameters: InitializeParameters<M>) => void;
    readonly onStreamPart: (args: {
        setMetadata: React.Dispatch<React.SetStateAction<M>>;
        setArtifact: React.Dispatch<React.SetStateAction<UIArtifact>>;
        streamPart: any;
    }) => void;

    constructor(config: ArtifactConfig<T, M>) {
        this.kind = config.kind;
        this.description = config.description;
        this.content = config.content;
        this.actions = config.actions || [];
        this.toolbar = config.toolbar || [];
        this.initialize = config.initialize || (async () => ({}));
        this.onStreamPart = config.onStreamPart;
    }
}

export type { ArtifactAction, ArtifactContent, ArtifactKind, ArtifactToolbarItem };