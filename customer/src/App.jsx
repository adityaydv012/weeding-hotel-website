import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';

import { CartProvider } from './context/CartContext.jsx';

import GuestBottomNav from './components/GuestBottomNav.jsx';

import GuestHomePage from './pages/GuestHomePage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';

function OrderLayout() {
  const { roomToken } = useParams();

  return (
    <CartProvider roomToken={roomToken}>
      <div className="min-h-screen pb-[100px]">
        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={<GuestHomePage />}
          />

          {/* MENU */}
          <Route
            path="/menu"
            element={<MenuPage />}
          />

          {/* EVENTS */}
          <Route
            path="/events"
            element={<EventsPage />}
          />

          {/* CART */}
          <Route
            path="/cart"
            element={<CartPage />}
          />

          {/* CHECKOUT */}
          <Route
            path="/checkout"
            element={<CheckoutPage />}
          />

          {/* ORDER SUCCESS */}
          <Route
            path="/success"
            element={<OrderSuccessPage />}
          />

          {/* ORDER TRACKING */}
          <Route
            path="/track/:orderId"
            element={<OrderTrackingPage />}
          />

          {/* FALLBACK */}
          <Route
            path="*"
            element={
              <Navigate
                to={`/order/${roomToken}`}
                replace
              />
            }
          />

        </Routes>

        {/* ONE SINGLE BOTTOM NAV */}
        <GuestBottomNav />
      </div>
    </CartProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/order/:roomToken/*"
          element={<OrderLayout />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;