import '../styles/globals.css';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { SearchProvider } from '../context/SearchContext';
import CartModal from '../components/CartModal';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <CartModal />
          <Component {...pageProps} />
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}
