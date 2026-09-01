// contexts/MobileDrawerContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";

interface MobileDrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const MobileDrawerContext = createContext<MobileDrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export const MobileDrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <MobileDrawerContext.Provider
      value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}
    >
      {children}
    </MobileDrawerContext.Provider>
  );
};

export const useMobileDrawer = () => useContext(MobileDrawerContext);
