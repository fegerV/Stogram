import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';
import ru from '../i18n/ru';

interface MessageStatusProps {
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn: boolean;
}

export default function MessageStatus({ status, isOwn }: MessageStatusProps) {
  if (!isOwn) return null;

  if (status === 'failed') {
    return <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#ef4444]" aria-label={ru.chat.status.failed} />;
  }

  if (status === 'pending') {
    return <Clock className="h-4 w-4 flex-shrink-0 text-[#667781] dark:text-[#8696a0]" aria-label={ru.chat.status.pending} />;
  }

  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 flex-shrink-0 text-[#53bdeb]" aria-label={ru.chat.status.read} />;
  }

  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 flex-shrink-0 text-[#667781] dark:text-[#8696a0]" aria-label={ru.chat.status.delivered} />;
  }

  return <Check className="h-4 w-4 flex-shrink-0 text-[#667781] dark:text-[#8696a0]" aria-label={ru.chat.status.sent} />;
}
