import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service } from '@/lib/types';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  note: string;
  addItem: (service: Service) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setNote: (note: string) => void;
  totalPrice: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      note: '',
      addItem: (service) =>
        set((state) => {
          const existing = state.items.find((i) => i._id === service._id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i._id === service._id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return {
            items: [...state.items, {
              _id: service._id,
              name: service.name,
              price: service.price,
              image: service.image || '',
              quantity: 1,
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
