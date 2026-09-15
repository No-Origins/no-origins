"use client";
import { useState, type ComponentPropsWithoutRef, type FormEvent, type ReactNode } from "react";
import { Chip } from "../atoms/Chip";
import type { Hue } from "../tokens/tokens";
import { cx } from "../cx";

/**
 * ChatInput (§9) — a level-2 surface as a pill, 56px tall; the send button is a 36px circle in the block accent with the blob's
 * eyes inside. `suggestions` render as chips above it: the guided menu until the harness can answer for itself.
 */
export interface ChatSuggestion {
  label: ReactNode;
  value: string;
  hue?: Hue | "accent";
}

export interface ChatInputProps extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> {
  id?: string;
  placeholder?: string;
  suggestions?: ChatSuggestion[];
  onSend?: (text: string) => void;
  onSuggestion?: (suggestion: ChatSuggestion) => void;
  disabled?: boolean;
  sendLabel?: string;
  inputLabel?: string;
}

export function ChatInput({
  id = "chat",
  placeholder = "Hey! What's on your mind today?",
  suggestions,
  onSend,
  onSuggestion,
  disabled,
  sendLabel = "Send",
  inputLabel = "Message",
  className,
  ...rest
}: ChatInputProps) {
  const [text, setText] = useState("");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setText("");
  };
  return (
    <form className={cx("noo-chat", className)} onSubmit={submit} {...rest}>
      {suggestions?.length ? (
        <div className="noo-chat__suggestions" role="group" aria-label="Suggestions">
          {suggestions.map((s) => (
            <Chip key={s.value} hue={s.hue ?? "grey"} dot={false} onClick={() => onSuggestion?.(s)}>
              {s.label}
            </Chip>
          ))}
        </div>
      ) : null}
      <div className="noo-surface noo-surface--2 noo-chat__bar">
        <input
          id={id}
          className="noo-chat__input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={inputLabel}
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="noo-chat__send" aria-label={sendLabel} disabled={disabled || !text.trim()}>
          <svg viewBox="0 0 36 20" aria-hidden="true">
            <circle cx="11" cy="10" r="4.5" fill="currentColor" />
            <circle cx="25" cy="10" r="4.5" fill="currentColor" />
          </svg>
        </button>
      </div>
    </form>
  );
}
