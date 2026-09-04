import React from 'react';

type AlertDialogProps = {
  onDismiss: () => void;
  children: React.ReactNode;
  titleLabel?: string;
  yesButtonLabel?: string;
  noButtonLabel?: string;
  onClickYes?: () => void;
  onClickNo?: () => void;
};

export default function AlertDialog({
  onDismiss,
  children,
  titleLabel,
  yesButtonLabel = 'Yes',
  noButtonLabel = 'No',
  onClickYes,
  onClickNo,
}: AlertDialogProps) {
  const handleYes = onClickYes ?? onDismiss;
  const handleNo = onClickNo ?? onDismiss;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-drive-surface border border-drive-border rounded-2xl shadow-xl w-auto max-w-[75vw] max-h-[75vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150">
        {titleLabel && (
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-drive-text truncate" title={titleLabel}>
              {titleLabel}
            </h3>
            <button
              type="button"
              onClick={onDismiss}
              className="text-drive-text-subtle hover:text-drive-text p-1 rounded-lg hover:bg-drive-surface-variant transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto mt-4">{children}</div>
        <div className="flex items-center justify-end gap-3 pt-2 mt-4">
          <button
            type="button"
            onClick={handleNo}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-drive-border text-drive-text-subtle hover:bg-drive-surface-variant transition-colors cursor-pointer truncate max-w-[50%]"
          >
            {noButtonLabel}
          </button>
          <button
            type="button"
            onClick={handleYes}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-drive-primary hover:bg-drive-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center gap-2 truncate max-w-[50%]"
          >
            {yesButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
