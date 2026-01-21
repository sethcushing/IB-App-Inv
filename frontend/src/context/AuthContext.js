import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Auth error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    // Fetch full user profile with permissions
    const profileRes = await axios.get(`${API}/auth/me`);
    setUser(profileRes.data);
    return profileRes.data;
  };

  const register = async (email, password, name, role = 'viewer', assignedCostCenters = []) => {
    const response = await axios.post(`${API}/auth/register`, { 
      email, 
      password, 
      name, 
      role,
      assigned_cost_centers: assignedCostCenters
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    // Fetch full user profile with permissions
    const profileRes = await axios.get(`${API}/auth/me`);
    setUser(profileRes.data);
    return profileRes.data;
  };

  const updateProfile = async (updates) => {
    await axios.put(`${API}/auth/me`, updates);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  // Helper functions
  const canEdit = () => user?.can_edit ?? false;
  const isAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'manager';
  const isViewer = () => user?.role === 'viewer';
  const getDashboardView = () => user?.dashboard_view || 'executive';
  const getAssignedCostCenters = () => user?.assigned_cost_centers || [];

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout,
      updateProfile,
      canEdit,
      isAdmin,
      isManager,
      isViewer,
      getDashboardView,
      getAssignedCostCenters
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
