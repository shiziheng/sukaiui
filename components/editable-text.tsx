"use client";

import { type KeyboardEvent } from "react";
import { Pencil } from "lucide-react";

export function EditableText({
  active,
  value,
  onChange,
  multiline = false,
  className = "",
}: {
  active: boolean;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const save = (element: HTMLElement) => {
    const next = (element.innerText ?? "").replace(/\r/g, "").trim();
    if (next && next !== value) onChange(next);
    if (!next) element.innerText = value;
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter") return;
    if (!multiline || event.metaKey || event.ctrlKey) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <span
      className={`${className} ${active ? "editable-text" : ""}`.trim()}
      contentEditable={active}
      suppressContentEditableWarning
      onBlur={(event) => save(event.currentTarget)}
      onKeyDown={handleKeyDown}
      onClick={(event) => active && event.stopPropagation()}
      data-editable={active || undefined}
      key={`${value}-${active}`}
    >
      {value}
      {active ? <Pencil className="inline-edit-icon" aria-hidden="true" /> : null}
    </span>
  );
}
