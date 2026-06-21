import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AvatarContext = createContext(null);

export const AvatarProvider = ({ children }) => {
  // Possible states: 'idle', 'action', 'fun', 'thinking', 'low'
  const [avatarState, setAvatarState] = useState('idle');
  const [timeoutId, setTimeoutId] = useState(null);

  // Set a state temporarily (e.g. 'fun' for 2 seconds, then back to 'idle')
  const triggerState = useCallback((state, durationMs = null) => {
    setAvatarState(state);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    if (durationMs) {
      const id = setTimeout(() => {
        setAvatarState('idle');
      }, durationMs);
      setTimeoutId(id);
    }
  }, [timeoutId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <AvatarContext.Provider value={{ avatarState, setAvatarState: triggerState }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
};
