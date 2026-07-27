import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconAlertCircle, IconX } from '@tabler/icons-react';

export function ErrorAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="flex items-start gap-3">
      <IconAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <AlertDescription className="flex-1">{message}</AlertDescription>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600 flex-shrink-0">
          <IconX className="w-4 h-4" />
        </button>
      )}
    </Alert>
  );
}