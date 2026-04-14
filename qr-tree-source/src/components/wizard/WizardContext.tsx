import { createContext, useContext } from 'react';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface WizardContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: WizardStep[];
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value: WizardContextType;
}) {
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
