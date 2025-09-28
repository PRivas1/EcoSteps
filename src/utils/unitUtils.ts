import { UnitSystem } from '../contexts/UnitContext';

// Conversion constants
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

export interface DistanceUnit {
  value: number;
  unit: string;
  shortUnit: string;
}

export interface WeightUnit {
  value: number;
  unit: string;
  shortUnit: string;
}

/**
 * Convert distance from kilometers to the specified unit system
 */
export const convertDistance = (km: number, unitSystem: UnitSystem): DistanceUnit => {
  if (unitSystem === 'imperial') {
    return {
      value: km * KM_TO_MILES,
      unit: 'miles',
      shortUnit: 'mi',
    };
  }
  return {
    value: km,
    unit: 'kilometers',
    shortUnit: 'km',
  };
};

/**
 * Convert weight from kilograms to the specified unit system
 */
export const convertWeight = (kg: number, unitSystem: UnitSystem): WeightUnit => {
  if (unitSystem === 'imperial') {
    return {
      value: kg * KG_TO_LBS,
      unit: 'pounds',
      shortUnit: 'lbs',
    };
  }
  return {
    value: kg,
    unit: 'kilograms',
    shortUnit: 'kg',
  };
};

/**
 * Format distance with appropriate unit
 */
export const formatDistance = (km: number, unitSystem: UnitSystem, decimals: number = 2): string => {
  const converted = convertDistance(km, unitSystem);
  return `${converted.value.toFixed(decimals)} ${converted.shortUnit}`;
};

/**
 * Format weight with appropriate unit
 */
export const formatWeight = (kg: number, unitSystem: UnitSystem, decimals: number = 1): string => {
  const converted = convertWeight(kg, unitSystem);
  return `${converted.value.toFixed(decimals)} ${converted.shortUnit}`;
};

/**
 * Format distance for display in cards (shorter format)
 */
export const formatDistanceShort = (km: number, unitSystem: UnitSystem): string => {
  const converted = convertDistance(km, unitSystem);
  if (converted.value < 1) {
    // For small distances, show in smaller units
    if (unitSystem === 'imperial') {
      const feet = converted.value * 5280;
      return `${feet.toFixed(0)} ft`;
    } else {
      const meters = converted.value * 1000;
      return `${meters.toFixed(0)} m`;
    }
  }
  return `${converted.value.toFixed(1)} ${converted.shortUnit}`;
};

/**
 * Format speed (km/h to mph)
 */
export const formatSpeed = (kmh: number, unitSystem: UnitSystem): string => {
  if (unitSystem === 'imperial') {
    const mph = kmh * KM_TO_MILES;
    return `${mph.toFixed(1)} mph`;
  }
  return `${kmh.toFixed(1)} km/h`;
};

/**
 * Get unit label for distance
 */
export const getDistanceUnit = (unitSystem: UnitSystem): string => {
  return unitSystem === 'imperial' ? 'miles' : 'kilometers';
};

/**
 * Get short unit label for distance
 */
export const getDistanceShortUnit = (unitSystem: UnitSystem): string => {
  return unitSystem === 'imperial' ? 'mi' : 'km';
};

/**
 * Get unit label for weight
 */
export const getWeightUnit = (unitSystem: UnitSystem): string => {
  return unitSystem === 'imperial' ? 'pounds' : 'kilograms';
};

/**
 * Get short unit label for weight
 */
export const getWeightShortUnit = (unitSystem: UnitSystem): string => {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
};
