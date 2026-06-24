import { create } from 'zustand';

/**
 * Global lightweight state engine for report parameters.
 * Prevents prop-drilling between Dashboard and LocationReport.
 */
export const useReportStore = create((set) => ({
  pinCode: '',
  resolvedAddress: 'Chennai, Tamil Nadu, India',
  tracedArea: 1378,
  coordinates: { lat: 13.0827, lng: 80.2707 },
  selectedMode: 'hybrid',
  monthlyConsumption: 650, // kWh per month

  // Actions to update state safely
  setPinCode: (pin) => set({ pinCode: pin }),
  setResolvedAddress: (address) => set({ resolvedAddress: address }),
  setTracedArea: (area) => set({ tracedArea: area }),
  setCoordinates: (coords) => set({ coordinates: coords }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setMonthlyConsumption: (kwh) => set({ monthlyConsumption: kwh }),
}));