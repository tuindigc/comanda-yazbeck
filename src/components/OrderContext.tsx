"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface OrderItem {
  variantId: number;
  productId: number;
  productName: string;
  colorName: string;
  colorHex: string;
  materialName: string;
  genderName: string;
  cutName: string;
  size: string;
  weightName: string;
  quantity: number;
  unitCost: number;
  imageUrl: string;
  catalogCode: string;
}

interface OrderContextValue {
  items: Map<number, OrderItem>;
  totalPieces: number;
  totalCost: number;
  increment: (variantId: number, productInfo: Omit<OrderItem, "quantity">) => void;
  decrement: (variantId: number) => void;
  setQuantity: (variantId: number, qty: number, productInfo: Omit<OrderItem, "quantity">) => void;
  clearAll: () => void;
  getItems: () => OrderItem[];
}

const OrderContext = createContext<OrderContextValue | null>(null);
const STORAGE_KEY = "comanda_yazbeck_order";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Map<number, OrderItem>>(new Map());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: OrderItem[] = JSON.parse(saved);
        setItems(new Map(parsed.map((item) => [item.variantId, item])));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const arr = Array.from(items.values()).filter((i) => i.quantity > 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }, [items]);

  const increment = useCallback((variantId: number, productInfo: Omit<OrderItem, "quantity">) => {
    setItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(variantId);
      if (existing) next.set(variantId, { ...existing, quantity: existing.quantity + 1 });
      else next.set(variantId, { ...productInfo, quantity: 1 });
      return next;
    });
  }, []);

  const decrement = useCallback((variantId: number) => {
    setItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(variantId);
      if (existing && existing.quantity > 1) next.set(variantId, { ...existing, quantity: existing.quantity - 1 });
      else next.delete(variantId);
      return next;
    });
  }, []);

  const setQuantity = useCallback((variantId: number, qty: number, productInfo: Omit<OrderItem, "quantity">) => {
    setItems((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(variantId);
      else next.set(variantId, { ...productInfo, quantity: qty });
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setItems(new Map()), []);
  const getItems = useCallback(() => Array.from(items.values()).filter((i) => i.quantity > 0), [items]);

  const totalPieces = Array.from(items.values()).reduce((sum, i) => sum + i.quantity, 0);
  const totalCost = Array.from(items.values()).reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  return (
    <OrderContext.Provider value={{ items, totalPieces, totalCost, increment, decrement, setQuantity, clearAll, getItems }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
