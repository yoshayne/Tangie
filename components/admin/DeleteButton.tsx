"use client";

/** A delete button that asks "are you sure?" first. `action` is a server action bound to the item. */
export function DeleteButton({
  action,
  label = "Delete",
  confirmText,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="border border-[#9b2c2c] px-4 py-2 text-sm text-[#9b2c2c] hover:bg-[#fdf1f1]"
      >
        {label}
      </button>
    </form>
  );
}
