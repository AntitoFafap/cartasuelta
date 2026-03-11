import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar carrito desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading cart:', e);
        }
      }

      // Escuchar cambios en localStorage (para limpiar carrito al cerrar sesión)
      const handleStorage = (e) => {
        if (e.key === 'cart' && !e.newValue) {
          setItems([]);
        }
      };
      window.addEventListener('storage', handleStorage);

      // También verificar periódicamente si el carrito fue limpiado
      const checkCart = () => {
        const current = localStorage.getItem('cart');
        if (!current) {
          setItems([]);
        }
      };
      
      // Escuchar evento personalizado para limpiar carrito
      const handleClearCart = () => {
        setItems([]);
      };
      window.addEventListener('clearCart', handleClearCart);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('clearCart', handleClearCart);
      };
    }
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items]);

  const addItem = (card, quantity) => {
    if (quantity <= 0) return;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === card.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === card.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { ...card, quantity }];
    });
  };

  const updateQuantity = (cardId, quantity) => {
    if (quantity <= 0) {
      removeItem(cardId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === cardId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeItem = (cardId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== cardId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const value = {
    items,
    isOpen,
    setIsOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
}
