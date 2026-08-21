"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteCourse } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/button";

export function CourseDeleteButton({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Move focus into dialog on open
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const allFocusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (!allFocusable || allFocusable.length === 0) return;
      const first = allFocusable[0];
      const last = allFocusable[allFocusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label={`Delete ${courseName}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={handleClose}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${courseId}`}
            aria-describedby={`delete-desc-${courseId}`}
            className="surface-card w-full max-w-md p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id={`delete-title-${courseId}`} className="text-lg font-bold">
                  Delete this course?
                </h2>
                <p id={`delete-desc-${courseId}`} className="mt-2 text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">{courseName}</span> and all of its
                  modules, notes, and progress will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
                Cancel
              </Button>
              <form action={deleteCourse} onSubmit={() => setIsDeleting(true)}>
                <input type="hidden" name="courseId" value={courseId} />
                <Button type="submit" variant="destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? "Deleting" : "Delete course"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
