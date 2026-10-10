
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import FoodItemsPage from './pages/FoodItemsPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import HotelsPage from './pages/HotelsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/"
              element={<DashboardPage />}
            />

            <Route
              path="/orders"
              element={<OrdersPage />}
            />

            <Route
              path="/food-items"
              element={<FoodItemsPage />}
            />

            <Route
              path="/categories"
              element={<CategoriesPage />}
            />

            <Route
              path="/rooms"
              element={<RoomsPage />}
            />

            <Route
              path="/events"
              element={<EventsPage />}
            />

            <Route
              path="/hotels"
              element={<HotelsPage />}
            />

            {/* Users page — now inside AdminLayout */}
            <Route
              path="/users"
              element={<UsersPage />}
            />
          </Route>
        </Route>

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
