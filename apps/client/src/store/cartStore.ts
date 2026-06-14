import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.productId === item.productId,
          )
          if (!existing) {
            return {
              items: [
                ...state.items,
                { ...item, quantity: Math.min(quantity, item.stock) },
              ],
            }
          }

          return {
            items: state.items.map((cartItem) =>
              cartItem.productId === item.productId
                ? {
                    ...cartItem,
                    quantity: Math.min(
                      cartItem.quantity + quantity,
                      cartItem.stock,
                    ),
                  }
                : cartItem,
            ),
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.max(1, Math.min(quantity, item.stock)),
                }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'tinytreasures-cart' },
  ),
)
