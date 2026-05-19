import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext({ testMode: false, setTestMode: () => {} });

export const UIProvider = ({ children }) => {
  const [testMode, setTestMode] = useState(false);
  return (
    <UIContext.Provider value={{ testMode, setTestMode }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
