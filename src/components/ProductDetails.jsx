import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CustomerContext } from '../context/CustomerContext';
import { fetchProductDetails } from '../services/api';
import './ProductDetails.css';

const ProductDetails = () => {
    const { productId } = useParams();
    const { customerType } = useContext(CustomerContext);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getProductDetails = async () => {
            try {
                const data = await fetchProductDetails(productId, customerType);
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getProductDetails();
    }, [productId, customerType]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="product-details">
            <h2>{product.name}</h2>
            <p>Code: {product.code}</p>
            <p>Category: {product.category}</p>
            <p>Unit: {product.unit}</p>
            <p>Price: ${product.price.toFixed(2)}</p>
        </div>
    );
};

export default ProductDetails;