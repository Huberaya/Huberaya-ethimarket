import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ProducerShop from './pages/ProducerShop';
import HowItWorks from './pages/HowItWorks';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import DevenirVendeur from './pages/DevenirVendeur';
import NotreMission from './pages/NotreMission';
import Producers from './pages/Producers';
import ComingSoon from './pages/ComingSoon';
import Legal from './pages/Legal';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/dashboard/AddProduct';
import EditProduct from './pages/dashboard/EditProduct';
import MyProducts from './pages/dashboard/MyProducts';
import MyShop from './pages/dashboard/MyShop';
import MonProfil from './pages/dashboard/MonProfil';
import { Orders, Messages, SettingsPage } from './pages/dashboard/PlaceholderPages';
import Verification from './pages/dashboard/Verification';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducers from './pages/admin/Producers';
import AdminVerificationsPage from './pages/admin/Verifications';
import AdminCertifications from './pages/admin/Certifications';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminDisputes from './pages/admin/Disputes';
import AdminFinances from './pages/admin/Finances';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import ScoreEthiMarket from './pages/ScoreEthiMarket';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/produit/:id" element={<ProductDetail />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/boutique/:id" element={<ProducerShop />} />
        <Route path="/comment-ca-marche" element={<HowItWorks />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/devenir-vendeur" element={<DevenirVendeur />} />
        <Route path="/notre-mission" element={<NotreMission />} />
        <Route path="/producteurs" element={<Producers />} />
        <Route path="/conditions-utilisation" element={<Legal />} />
        <Route path="/confidentialite" element={<Legal />} />
        <Route path="/cookies" element={<Legal />} />
        <Route path="/notre-equipe" element={<ComingSoon />} />
        <Route path="/certifications" element={<ComingSoon />} />
        <Route path="/presse" element={<ComingSoon />} />
        <Route path="/partenaires" element={<ComingSoon />} />
        <Route path="/centre-aide" element={<ComingSoon />} />
        <Route path="/tarifs" element={<ComingSoon />} />

        {/* Dashboard routes (protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="mes-produits" element={<MyProducts />} />
          <Route path="ajouter-produit" element={<AddProduct />} />
          <Route path="modifier-produit/:id" element={<EditProduct />} />
          <Route path="ma-boutique" element={<MyShop />} />
          <Route path="mon-profil" element={<MonProfil />} />
          <Route path="commandes" element={<Orders />} />
          <Route path="messages" element={<Messages />} />
          <Route path="parametres" element={<SettingsPage />} />
          <Route path="verification" element={<Verification />} />
        </Route>
        <Route path="/score-ethimarket" element={<ScoreEthiMarket />} />

        {/* Admin routes (protected by admin role) */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="producteurs" element={<AdminProducers />} />
          <Route path="verifications" element={<AdminVerificationsPage />} />
          <Route path="certifications" element={<AdminCertifications />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="litiges" element={<AdminDisputes />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="finances" element={<AdminFinances />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="configuration" element={<AdminReports />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
