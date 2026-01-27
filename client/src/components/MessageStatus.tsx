import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusProps {
  isSent: boolean;
  isRead: boolean;
  isOwn: boolean;
}

export default function MessageStatus({ isSent, isRead, isOwn }: MessageStatusProps) {
  if (!isOwn) return null;

  if (isRead) {
    // Прочитано - две синие галочки (как в Telegram)
    return (
      <CheckCheck className="w-4 h-4 text-[#53bdeb] dark:text-[#53bdeb] flex-shrink-0" />
    );
  } else if (isSent) {
    // Доставлено - две серые галочки
    return (
      <CheckCheck className="w-4 h-4 text-[#667781] dark:text-[#8696a0] flex-shrink-0" />
    );
  } else {
    // Отправлено - одна серая галочка
    return (
      <Check className="w-4 h-4 text-[#667781] dark:text-[#8696a0] flex-shrink-0" />
    );
  }
}
