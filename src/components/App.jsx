import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { CustomerProvider } from '../context/CustomerContext';
import Header from './Header';
import Footer from './Footer';
import Home from './Home';
import ProductSearch from './ProductSearch';
import ProductCatalog from './ProductCatalog';
import About from './About';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

const App = () => {
    return (
        <Switch>
            {/* Admin routes */}
            <Route exact path="/admin-login" component={AdminLogin} />
            <Route path="/admin" component={AdminPanel} />
            
            {/* Customer-specific routes with locked price type */}
            <Route path="/BBCL" render={() => <AppWithPriceType priceType="BBCL" />} />
            <Route path="/BBPT" render={() => <AppWithPriceType priceType="BBPT" />} />
            <Route path="/BL" render={() => <AppWithPriceType priceType="BL" />} />
            <Route path="/BLVIP" render={() => <AppWithPriceType priceType="BLVIP" />} />
            <Route path="/HONDA247" render={() => <AppWithPriceType priceType="HONDA247" />} />
            
            {/* Default routes - redirect to admin login */}
            <Route exact path="/" render={() => {
                // Kiểm tra nếu đã login admin
                const isAdmin = localStorage.getItem('isAdmin');
                if (isAdmin) {
                    return <Redirect to="/admin" />;
                }
                return <Redirect to="/admin-login" />;
            }} />
            <Route render={() => <Redirect to="/admin-login" />} />
        </Switch>
    );
};

const AppWithPriceType = ({ priceType }) => {
    const showSelector = !priceType; // Only show selector if no price type locked
    
    return (
        <CustomerProvider initialType={priceType} locked={!!priceType}>
            <div className="app">
                <Header showSelector={showSelector} priceType={priceType} />
                <main>
                    <Switch>
                        <Route exact path={priceType ? `/${priceType}` : '/'} component={Home} />
                        <Route path={priceType ? `/${priceType}/search` : '/search'} component={ProductSearch} />
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