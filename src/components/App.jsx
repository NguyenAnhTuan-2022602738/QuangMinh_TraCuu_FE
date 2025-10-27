import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { CustomerProvider } from '../context/CustomerContext';
import Header from './Header';
import Footer from './Footer';
import Home from './Home';
import ProductSearch from './ProductSearch';
import ProductCatalog from './ProductCatalog';
import CategorySelection from './CategorySelection';
import ProductCatalogByCategory from './ProductCatalogByCategory';
import About from './About';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';
import CustomerLogin from './CustomerLogin';

const App = () => {
    return (
        <Switch>
            {/* Admin routes - all admin pages use same component, differentiate by URL */}
            <Route exact path="/admin-login" component={AdminLogin} />
            <Route exact path="/admin" component={AdminPanel} />
            <Route exact path="/admin/products" component={AdminPanel} />
            <Route exact path="/admin/users" component={AdminPanel} />
            <Route exact path="/admin/qr" component={AdminPanel} />
            <Route exact path="/admin/categories" component={AdminPanel} />
            
            {/* Customer-specific routes with locked price type */}
            <Route path="/BBCL" render={() => <AppWithPriceType priceType="BBCL" />} />
            <Route path="/BBPT" render={() => <AppWithPriceType priceType="BBPT" />} />
            <Route path="/BL" render={() => <AppWithPriceType priceType="BL" />} />
            <Route path="/BLVIP" render={() => <AppWithPriceType priceType="BLVIP" />} />
            <Route path="/HONDA247" render={() => <AppWithPriceType priceType="HONDA247" />} />
            
            {/* Default root: show customer login (separate flow). Admin can still access /admin-login */}
            <Route exact path="/" render={() => <CustomerLogin />} />
            <Route render={() => <Redirect to="/" />} />
        </Switch>
    );
};

const AppWithPriceType = ({ priceType }) => {
    const showSelector = !priceType; // Only show selector if no price type locked

    // If a customer is logging in, check localStorage for allowed types
    if (priceType) {
        const token = localStorage.getItem('customerToken');
        const allowed = JSON.parse(localStorage.getItem('customerAllowed') || '[]').map(s => String(s).toUpperCase());
        if (!token || !allowed.includes(String(priceType).toUpperCase())) {
            // Redirect to login for customers
            return <CustomerLogin priceType={priceType} />;
        }
    }

    return (
        <CustomerProvider initialType={priceType} locked={!!priceType}>
            <div className="app">
                <Header showSelector={showSelector} priceType={priceType} />
                <main>
                    <Switch>
                        <Route exact path={priceType ? `/${priceType}` : '/'} component={Home} />
                        <Route path={priceType ? `/${priceType}/search` : '/search'} component={ProductSearch} />
                        <Route exact path={priceType ? `/${priceType}/categories` : '/categories'} component={CategorySelection} />
                        <Route path={priceType ? `/${priceType}/catalog/:parentCategory` : '/catalog/:parentCategory'} component={ProductCatalogByCategory} />
                        <Route path={priceType ? `/${priceType}/catalog` : '/catalog'} component={ProductCatalog} />
                        <Route path={priceType ? `/${priceType}/about` : '/about'} component={About} />
                    </Switch>
                </main>
                <Footer />
            </div>
        </CustomerProvider>
    );
};

export default App;