import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface SelfDestructTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export default function SelfDestructTimer({ expiresAt, onExpire }: SelfDestructTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiration - now) / 1000));
      
      if (remaining === 0 && onExpire) {
        onExpire();
      }
      
      return remaining;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}с`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}м ${secs}с`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}ч ${mins}м`;
    }
  };

  if (timeLeft === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-[#667781] dark:text-[#8696a0]">
      <Clock className="w-3 h-3" />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
