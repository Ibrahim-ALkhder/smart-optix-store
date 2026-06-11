import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('smartoptix_cart')) || [];
    } catch {
      return [];
    }
  });

  const [prescription, setPrescription] = useState(null);

  useEffect(() => {
    localStorage.setItem('smartoptix_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1, prescriptionData = null) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, prescriptionData }];
    });
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPrescription(null);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getLensUpgradeFee = (prescriptionData) => {
    if (!prescriptionData || prescriptionData.type === 'fashion') return 0;
    return 50; // flat fee for prescription lenses
  };

  const getShippingFee = () => 15;

  const getTotal = (prescriptionData = null) => {
    const subtotal = getSubtotal();
    const lensFee = prescriptionData ? getLensUpgradeFee(prescriptionData) : 0;
    const shipping = items.length > 0 ? getShippingFee() : 0;
    return subtotal + lensFee + shipping;
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      prescription,
      setPrescription,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getSubtotal,
      getLensUpgradeFee,
      getShippingFee,
      getTotal,
      getItemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
