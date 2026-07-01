import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('namtech_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (customer) {
      localStorage.setItem('namtech_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('namtech_customer');
    }
  }, [customer]);

  const login = (customerData) => {
    setCustomer(customerData);
  };

  const updateCustomer = (updatedData) => {
    setCustomer(prev => prev ? { ...prev, ...updatedData } : null);
  };

  const logout = () => {
    setCustomer(null);
  };

  const isLoggedIn = !!customer;

  return (
    <AuthContext.Provider value={{ customer, login, updateCustomer, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}
