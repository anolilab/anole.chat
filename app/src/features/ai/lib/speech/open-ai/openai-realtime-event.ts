export const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/sessions";

export type OpenAIRealtimeSession = {
    [key: string]: any;
    client_secret: {
        expires_at: number;
        value: string;
    };
    id: string;
    input_audio_format: string;
    input_audio_transcription: {
        model: string;
    };
    instructions: string;
    max_response_output_tokens: number;
    modalities: string[];
    model: string;
    object: string;
    output_audio_format: string;
    temperature: number;
    tool_choice: string;
    tools: any[];
    voice: string;
};

export type OpenAIRealtimeClientEvent
    = | {
        data: Partial<OpenAIRealtimeSession>;
        type: "session.update";
    }
    | {
        item: {
            content: [
                {
                    text: string;
                    type: string;
                },
            ];
            id: string;
            role: string;
            type: string;
        };
        previous_item_id?: string;
        type: "conversation.item.create";
    };

export type OpenAIRealtimeServerEvent
    = | {
        event_id: string;
        item_id: string;
        type: "input_audio_buffer.speech_started" | "input_audio_buffer.speech_stopped" | "input_audio_buffer.committed" | "output_audio_buffer.stopped";
    }
    | {
        content_index: number;
        event_id: string;
        item_id: string;
        transcript?: string;
        type: "conversation.item.input_audio_transcription.completed";
    }
    | {
        content_index: number;
        delta: string;
        event_id: string;
        item_id: string;
        type: "conversation.item.input_audio_transcription.delta";
    }
    | {
        content_index: number;
        delta: string;
        event_id: string;
        item_id: string;
        output_index: number;
        response_id: string;
        type: "response.audio_transcript.delta";
    }
    | {
        content_index: number;
        event_id: string;
        item_id: string;
        output_index: number;
        response_id: string;
        transcript: string;
        type: "response.audio_transcript.done";
    }
    | {
        content_index: number;
        event_id: string;
        item_id: string;
        output_index: number;
        response_id: string;
        type: "response.audio.done";
    }
    | {
        arguments: string;
        call_id: string;
        event_id: string;
        item_id: string;
        name: string;
        output_index: number;
        response_id: string;
        type: "response.function_call_arguments.done";
    };
