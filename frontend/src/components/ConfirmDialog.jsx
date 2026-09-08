import { useEffect } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = false,
  isPending = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isPending) onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-dialog-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onCancel();
      }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {isDestructive ? (
          <div className="confirm-dialog-icon" aria-hidden="true">
            <AlertTriangle size={21} />
          </div>
        ) : null}
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-cancel" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-dialog-confirm ${isDestructive ? "is-destructive" : ""}`}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle size={15} className="confirm-dialog-spinner" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
