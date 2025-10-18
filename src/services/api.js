import axios from 'axios';

// Sử dụng API_BASE_URL từ .env nếu có, nếu không thì dùng IP của máy chủ
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Function to fetch product details by product code
export const fetchProductByCode = async (productCode) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/${productCode}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching product details');
    }
};

// Function to fetch prices based on customer type
export const fetchPricesByCustomerType = async (customerType) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/prices`, {
            params: { customerType }
        });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching prices');
    }
};

// Function to fetch all products
export const fetchAllProducts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching products');
    }
};