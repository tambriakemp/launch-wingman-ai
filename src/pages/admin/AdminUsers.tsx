import AdminDashboard from '@/pages/AdminDashboard';

// The Users page reuses the full AdminDashboard with the users tab pre-selected.
// For now we render the full component; a future refactor can extract just the users tab.
const AdminUsers = () => {
  return <AdminDashboard defaultTab="users" />;
};

export default AdminUsers;
