import { useState, useEffect, createContext, useContext } from "react";

const STORAGE_KEY = "groww_visibility";

interface VisibilityContextType {
  isVisible: boolean;
  toggleVisibility: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const VisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsVisible(stored === "true");
      }
    } catch (error) {
      console.error("Error loading visibility state:", error);
    }
  }, []);

  // Save visibility state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isVisible.toString());
    } catch (error) {
      console.error("Error saving visibility state:", error);
    }
  }, [isVisible]);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <VisibilityContext.Provider value={{ isVisible, toggleVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
};

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error("useVisibility must be used within VisibilityProvider");
  }
  return context;
};

// Helper component to render value or placeholder
export const VisibilityValue = ({ 
  value, 
  placeholder = "••••••", 
  className = "" 
}: { 
  value: string | number; 
  placeholder?: string;
  className?: string;
}) => {
  const { isVisible } = useVisibility();
  
  if (isVisible) {
    return <span className={className}>{value}</span>;
  }
  
  return (
    <span className={`${className} tracking-widest`} style={{ letterSpacing: "0.1em" }}>
      {placeholder}
    </span>
  );
};

