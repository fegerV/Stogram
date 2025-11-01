import React, { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
  botUsername: string;
  onAuth: (user: any) => void;
  buttonSize?: 'small' | 'medium' | 'large';
  cornerRadius?: number;
  requestAccess?: boolean;
}

export const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botUsername,
  onAuth,
  buttonSize = 'large',
  cornerRadius,
  requestAccess = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !botUsername) return;

    // Очистить контейнер
    containerRef.current.innerHTML = '';

    // Создать скрипт виджета
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString());
    }
    if (requestAccess) {
      script.setAttribute('data-request-access', 'write');
    }
    script.async = true;

    containerRef.current.appendChild(script);

    // Установить глобальный обработчик
    (window as any).onTelegramAuth = (user: any) => {
      onAuth(user);
    };

    return () => {
      // Очистить глобальный обработчик при размонтировании
      delete (window as any).onTelegramAuth;
    };
  }, [botUsername, onAuth, buttonSize, cornerRadius, requestAccess]);

  return <div ref={containerRef} />;
};
