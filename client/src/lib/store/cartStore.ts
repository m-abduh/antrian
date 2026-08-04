import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service, ServiceVariant } from '@/lib/types';

export interface CartItem {
  _id: string;
  serviceId?: string;
  variant?: { name: string; price: number } | null;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  note: string;
  addItem: (service: Service, variant?: ServiceVariant, quantity?: number) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setNote: (note: string) => void;
  totalPrice: () => number;
  itemCount: () => number;
}

function lineKey(serviceId: string, variant?: ServiceVariant): string {
  return variant ? `${serviceId}::${variant.name}` : serviceId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      note: '',
      addItem: (service, variant, quantity) =>
        set((state) => {
          const qty = quantity && quantity > 0 ? Math.floor(quantity) : 1;
          const key = lineKey(service._id, variant);
          const existing = state.items.find((i) => i._id === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i._id === key ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return {
            items: [...state.items, {
              _id: key,
              serviceId: service._id,
              variant: variant ? { name: variant.name, price: variant.price } : null,
              name: variant ? `${service.name} (${variant.name})` : service.name,
              price: variant ? variant.price : service.price,
              image: service.image || '',
              quantity: qty,
            }],
          };
        }),
      updateQuantity: (id, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i._id !== id) };
          }
          return {
            items: state.items.map((i) =>
              i._id === id ? { ...i, quantity: qty } : i,
            ),
          };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i._id !== id) })),
      clearCart: () => set({ items: [], note: '' }),
      setNote: (note) => set({ note }),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'tunggu-cart' },
  ),
);
