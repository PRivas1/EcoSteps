import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UnitSystem = 'metric' | 'imperial';

interface UnitContextType {
  unitSystem: UnitSystem;
  toggleUnitSystem: () => void;
  isMetric: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

const UNIT_STORAGE_KEY = '@EcoSteps:unitSystem';

interface UnitProviderProps {
  children: ReactNode;
}

export const UnitProvider: React.FC<UnitProviderProps> = ({ children }) => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  useEffect(() => {
    loadUnitPreference();
  }, []);

  const loadUnitPreference = async () => {
    try {
      const savedUnit = await AsyncStorage.getItem(UNIT_STORAGE_KEY);
      if (savedUnit !== null) {
        setUnitSystem(savedUnit as UnitSystem);
      }
    } catch (error) {
      console.error('Error loading unit preference:', error);
    }
  };

  const saveUnitPreference = async (unit: UnitSystem) => {
    try {
      await AsyncStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch (error) {
      console.error('Error saving unit preference:', error);
    }
  };

  const toggleUnitSystem = () => {
    const newUnit = unitSystem === 'metric' ? 'imperial' : 'metric';
    setUnitSystem(newUnit);
    saveUnitPreference(newUnit);
  };

  const isMetric = unitSystem === 'metric';

  const value: UnitContextType = {
    unitSystem,
    toggleUnitSystem,
    isMetric,
  };

  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = (): UnitContextType => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
};
