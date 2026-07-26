import { IconAlertCircle, IconX } from '@tabler/icons-react';

export function ErrorAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
      <IconAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600">
          <IconX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}