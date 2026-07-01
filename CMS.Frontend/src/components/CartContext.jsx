import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('namtech_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('namtech_cart', JSON.stringify(items));
  }, [items]);

    const addToCart = (product, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(
                item =>
                    item.id === product.id &&
                    item.color === product.color
            );

            if (existing) {
                const newQuantity = existing.quantity + quantity;

                if (newQuantity > product.stockQuantity) {
                    toast.error(
                        `Chỉ còn ${product.stockQuantity} sản phẩm trong kho!`
                    );

                    return prev;
                }

                return prev.map(item =>
                    item.id === product.id &&
                        item.color === product.color
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }

            if (quantity > product.stockQuantity) {
                toast.error(
                    `Chỉ còn ${product.stockQuantity} sản phẩm trong kho!`
                );

                return prev;
            }

            return [...prev, { ...product, quantity }];
        });
    };

  const removeFromCart = (productId, color) => {
    setItems(prev => prev.filter(item => !(item.id === productId && item.color === color)));
  };

    const updateQuantity = (productId, color, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId, color);
            return;
        }

        setItems(prev =>
            prev.map(item => {
                if (
                    item.id === productId &&
                    item.color === color
                ) {
                    if (quantity > item.stockQuantity) {
                        toast.error(
                            `Chỉ còn ${item.stockQuantity} sản phẩm trong kho!`
                        );
                        return item;
                    }

                    return {
                        ...item,
                        quantity
                    };
                }

                return item;
            })
        );
    };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}
