
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface Beneficiary {
  id: string;
  address: string;
  percentage: number;
  name?: string;
}

interface WillContextType {
  beneficiaries: Beneficiary[];
  addBeneficiary: (beneficiary: Omit<Beneficiary, 'id'>) => void;
  updateBeneficiary: (id: string, beneficiary: Partial<Beneficiary>) => void;
  removeBeneficiary: (id: string) => void;
  lastActiveTime: number;
  updateLastActiveTime: () => void;
  isWillActive: boolean;
  toggleWillActive: () => void;
  totalPercentage: number;
}

const WillContext = createContext<WillContextType | undefined>(undefined);

export const useWill = () => {
  const context = useContext(WillContext);
  if (!context) {
    throw new Error('useWill must be used within a WillProvider');
  }
  return context;
};

interface WillProviderProps {
  children: React.ReactNode;
}

export const WillProvider = ({ children }: WillProviderProps) => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
  const [isWillActive, setIsWillActive] = useState<boolean>(false);
  const [totalPercentage, setTotalPercentage] = useState<number>(0);

  // Load data from localStorage
  useEffect(() => {
    const savedBeneficiaries = localStorage.getItem('beneficiaries');
    const savedLastActiveTime = localStorage.getItem('lastActiveTime');
    const savedWillActive = localStorage.getItem('isWillActive');

    if (savedBeneficiaries) {
      setBeneficiaries(JSON.parse(savedBeneficiaries));
    }
    
    if (savedLastActiveTime) {
      setLastActiveTime(JSON.parse(savedLastActiveTime));
    }
    
    if (savedWillActive) {
      setIsWillActive(JSON.parse(savedWillActive));
    }
  }, []);

  // Update totalPercentage when beneficiaries change
  useEffect(() => {
    const total = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    setTotalPercentage(total);
    localStorage.setItem('beneficiaries', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  // Save lastActiveTime to localStorage
  useEffect(() => {
    localStorage.setItem('lastActiveTime', JSON.stringify(lastActiveTime));
  }, [lastActiveTime]);

  // Save isWillActive to localStorage
  useEffect(() => {
    localStorage.setItem('isWillActive', JSON.stringify(isWillActive));
  }, [isWillActive]);

  const addBeneficiary = (beneficiary: Omit<Beneficiary, 'id'>) => {
    // Check if adding this beneficiary would exceed 100%
    const newTotal = totalPercentage + beneficiary.percentage;
    if (newTotal > 100) {
      toast({
        title: "Percentage exceeds 100%",
        description: `Total allocation would be ${newTotal}%. Please adjust percentages.`,
        variant: "destructive",
      });
      return;
    }

    // Check if the address already exists
    const exists = beneficiaries.some(b => b.address.toLowerCase() === beneficiary.address.toLowerCase());
    if (exists) {
      toast({
        title: "Duplicate address",
        description: "This wallet address is already in your will",
        variant: "destructive",
      });
      return;
    }

    const newBeneficiary = {
      ...beneficiary,
      id: Date.now().toString(),
    };

    setBeneficiaries(prev => [...prev, newBeneficiary]);
    updateLastActiveTime();
    
    toast({
      title: "Beneficiary added",
      description: "Beneficiary has been successfully added to your will",
    });
  };

  const updateBeneficiary = (id: string, updatedData: Partial<Beneficiary>) => {
    setBeneficiaries(prev => {
      const newBeneficiaries = prev.map(b => {
        if (b.id === id) {
          return { ...b, ...updatedData };
        }
        return b;
      });

      // Check if the update would exceed 100%
      const newTotal = newBeneficiaries.reduce((sum, b) => sum + b.percentage, 0);
      if (newTotal > 100) {
        toast({
          title: "Percentage exceeds 100%",
          description: `Total allocation would be ${newTotal}%. Please adjust percentages.`,
          variant: "destructive",
        });
        return prev; // Return original state if it would exceed 100%
      }

      return newBeneficiaries;
    });
    
    updateLastActiveTime();
    
    toast({
      title: "Beneficiary updated",
      description: "Beneficiary information has been updated",
    });
  };

  const removeBeneficiary = (id: string) => {
    setBeneficiaries(prev => prev.filter(b => b.id !== id));
    updateLastActiveTime();
    
    toast({
      title: "Beneficiary removed",
      description: "Beneficiary has been removed from your will",
    });
  };

  const updateLastActiveTime = () => {
    setLastActiveTime(Date.now());
  };

  const toggleWillActive = () => {
    if (!isWillActive && totalPercentage !== 100) {
      toast({
        title: "Cannot activate will",
        description: "Total percentage must equal 100% to activate your will",
        variant: "destructive",
      });
      return;
    }

    if (!isWillActive && beneficiaries.length === 0) {
      toast({
        title: "Cannot activate will",
        description: "You must add at least one beneficiary to activate your will",
        variant: "destructive",
      });
      return;
    }

    setIsWillActive(prev => !prev);
    updateLastActiveTime();
    
    toast({
      title: isWillActive ? "Will deactivated" : "Will activated",
      description: isWillActive 
        ? "Your will has been deactivated" 
        : "Your will is now active and will execute after 2 years of inactivity",
    });
  };

  return (
    <WillContext.Provider
      value={{
        beneficiaries,
        addBeneficiary,
        updateBeneficiary,
        removeBeneficiary,
        lastActiveTime,
        updateLastActiveTime,
        isWillActive,
        toggleWillActive,
        totalPercentage,
      }}
    >
      {children}
    </WillContext.Provider>
  );
};
