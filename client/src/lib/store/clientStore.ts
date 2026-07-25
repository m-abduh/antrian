import { create } from 'zustand';
import type { Merchant, Service, Queue } from '@/lib/types';

interface ClientState {
  selectedMerchant: Merchant | null;
  selectedService: Service | null;
  currentQueue: Queue | null;
  setMerchant: (merchant: Merchant) => void;
  setService: (service: Service) => void;
  setQueue: (queue: Queue) => void;
  clearAll: () => void;
}

export const useClientStore = create<ClientState>((set) => ({
  selectedMerchant: null,
  selectedService: null,
  currentQueue: null,
  setMerchant: (merchant) => set({ selectedMerchant: merchant }),
  setService: (service) => set({ selectedService: service }),
  setQueue: (queue) => set({ currentQueue: queue }),
  clearAll: () => set({ selectedMerchant: null, selectedService: null, currentQueue: null }),
}));