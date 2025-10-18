import React from 'react';
import { useCustomer } from '../context/CustomerContext';
import './CustomerTypeSelector.css';

const CustomerTypeSelector = () => {
    const { customerType, setCustomerType } = useCustomer();

    const handleChange = (event) => {
        setCustomerType(event.target.value);
    };

    return (
        <div className="customer-type-selector">
            <label htmlFor="customer-type">Loại giá:</label>
            <select id="customer-type" value={customerType} onChange={handleChange}>
                <option value="BBCL">BBCL</option>
                <option value="BBPT">BBPT</option>
                <option value="BL">BL</option>
                <option value="BLVIP">BLVIP</option>
                <option value="HONDA247">HONDA247</option>
            </select>
        </div>
    );
};

export default CustomerTypeSelector;