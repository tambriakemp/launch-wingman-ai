import { CouponManagement } from '@/components/admin/CouponManagement';

const AdminCoupons = () => (
  <div className="space-y-4 md:space-y-8">
    <div>
      <h1 className="text-xl md:text-2xl font-bold">Coupons</h1>
      <p className="text-sm text-muted-foreground">Manage discount codes and promotions</p>
    </div>
    <CouponManagement />
  </div>
);

export default AdminCoupons;
