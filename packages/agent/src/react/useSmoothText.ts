import { useEffect, useRef, useState } from "react";

const FPS = 20;
const MS_PER_FRAME = 1000 / FPS;
const MAX_TIME_JUMP_MS = 250;
/**
 * A hook that smoothly displays text as it is streamed.
 *
 * @param text The text to display. Pass in the full text each time.
 * @param charsPerSec The number of characters to display per second.
 * @returns A tuple of the visible text and the state of the smooth text,
 * including the current cursor position and whether it's still streaming.
 * This allows you to decide if it's too far behind and you want to adjust
 * the charsPerSec or just prefer the full text.
 */
export function useSmoothText(
  text: string,
  {
    charsPerSec = 256,
  }: {
    /**
     * The number of characters to display per second.
     */
    charsPerSec?: number;
  } = {}
): [string, { cursor: number; isStreaming: boolean }] {
  const [visibleText, setVisibleText] = useState(text);
  const smoothState = useRef({
    tick: Date.now() + (text.length * 1000) / charsPerSec,
    cursor: text.length,
    start: Date.now(),
    initialLength: text.length,
    charsPerMs: charsPerSec / 1000,
  });

  const isStreaming = smoothState.current.cursor < text.length;

  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    const latestCharsPerMs =
      (text.length - smoothState.current.initialLength) /
      (Date.now() - smoothState.current.start);
    // Smooth out the charsPerSec by averaging it with the previous value.
    smoothState.current.charsPerMs = Math.min(
      (2 * latestCharsPerMs + smoothState.current.charsPerMs) / 3,
      smoothState.current.charsPerMs * 2
    );
    smoothState.current.tick = Math.max(
      smoothState.current.tick,
      Date.now() - 2 * MS_PER_FRAME
    );

    function update() {
      if (smoothState.current.cursor >= text.length) {
        return;
      }
      const now = Date.now();
      const timeSinceLastUpdate = Math.min(
        MAX_TIME_JUMP_MS,
        now - smoothState.current.tick
      );
      const chars = Math.floor(
        timeSinceLastUpdate * smoothState.current.charsPerMs
      );
      smoothState.current.cursor = Math.min(
        smoothState.current.cursor + chars,
        text.length
      );
      smoothState.current.tick = now;
      setVisibleText(text.slice(0, smoothState.current.cursor));
    }
    update();
    const interval = setInterval(update, MS_PER_FRAME);
    return () => clearInterval(interval);
  }, [text, isStreaming, charsPerSec]);

  return [visibleText, { cursor: smoothState.current.cursor, isStreaming }];
}
