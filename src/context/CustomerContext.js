import React, { createContext, useContext, useState } from 'react';

// Export the context so components can import { CustomerContext }
export const CustomerContext = createContext({
    customerType: 'BBCL',
    setCustomerType: () => {},
    locked: false,
});

export const CustomerProvider = ({ children, initialType = 'BBCL', locked = false }) => {
    // Use initialType if provided, otherwise default to 'BBCL'
    const [customerType, setCustomerType] = useState(initialType);

    // If locked, prevent changing customer type
    const handleSetCustomerType = (type) => {
        if (!locked) {
            setCustomerType(type);
        }
    };

    return (
        <CustomerContext.Provider value={{ 
            customerType, 
            setCustomerType: handleSetCustomerType,
            locked 
        }}>
            {children}
        </CustomerContext.Provider>
    );
};

export const useCustomer = () => {
    return useContext(CustomerContext);
};