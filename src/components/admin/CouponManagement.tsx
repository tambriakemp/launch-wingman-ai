import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Plus, Trash2, RefreshCw, Loader2, Percent, DollarSign, Copy } from "lucide-react";

interface Coupon {
  id: string;
  name: string | null;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: "forever" | "once" | "repeating";
  duration_in_months: number | null;
  valid: boolean;
  times_redeemed: number;
  max_redemptions: number | null;
  redeem_by: number | null;
}

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // New coupon form state
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    name: "",
    discountType: "percent" as "percent" | "amount",
    percentOff: "",
    amountOff: "",
    duration: "once" as "forever" | "once" | "repeating",
    durationInMonths: "",
    maxRedemptions: "",
    expiresAt: "",
  });

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-list-coupons");
      if (error) throw error;
      setCoupons(data?.coupons || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (newCoupon.discountType === "percent" && !newCoupon.percentOff) {
      toast.error("Percent off is required");
      return;
    }

    if (newCoupon.discountType === "amount" && !newCoupon.amountOff) {
      toast.error("Amount off is required");
      return;
    }

    if (newCoupon.duration === "repeating" && !newCoupon.durationInMonths) {
      toast.error("Duration in months is required for repeating coupons");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-coupon", {
        body: {
          action: "create",
          coupon_id: newCoupon.code.trim().toUpperCase(),
          name: newCoupon.name || newCoupon.code.trim().toUpperCase(),
          percent_off: newCoupon.discountType === "percent" ? parseFloat(newCoupon.percentOff) : undefined,
          amount_off: newCoupon.discountType === "amount" ? Math.round(parseFloat(newCoupon.amountOff) * 100) : undefined,
          currency: newCoupon.discountType === "amount" ? "usd" : undefined,
          duration: newCoupon.duration,
          duration_in_months: newCoupon.duration === "repeating" ? parseInt(newCoupon.durationInMonths) : undefined,
          max_redemptions: newCoupon.maxRedemptions ? parseInt(newCoupon.maxRedemptions) : undefined,
          redeem_by: newCoupon.expiresAt ? Math.floor(new Date(newCoupon.expiresAt).getTime() / 1000) : undefined,
        },
      });

      if (error) throw error;

      toast.success(`Coupon "${newCoupon.code.toUpperCase()}" created successfully`);
      setCreateDialogOpen(false);
      setNewCoupon({
        code: "",
        name: "",
        discountType: "percent",
        percentOff: "",
        amountOff: "",
        duration: "once",
        durationInMonths: "",
        maxRedemptions: "",
        expiresAt: "",
      });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to create coupon:", error);
      toast.error("Failed to create coupon");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    setDeletingId(couponId);
    try {
      const { error } = await supabase.functions.invoke("admin-manage-coupon", {
        body: {
          action: "delete",
          coupon_id: couponId,
        },
      });

      if (error) throw error;

      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to delete coupon");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}% off`;
    }
    if (coupon.amount_off) {
      return `$${(coupon.amount_off / 100).toFixed(2)} off`;
    }
    return "N/A";
  };

  const formatDuration = (coupon: Coupon) => {
    if (coupon.duration === "forever") return "Forever";
    if (coupon.duration === "once") return "First payment";
    if (coupon.duration === "repeating" && coupon.duration_in_months) {
      return `${coupon.duration_in_months} months`;
    }
    return coupon.duration;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Coupon Management
          </CardTitle>
          <CardDescription>Create and manage promotional discount codes</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCoupons} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>
                  Create a promotional code for discounts on the Pro plan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., LAUNCH20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is what users will enter. Will be converted to uppercase.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Display Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Launch Sale 20% Off"
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={newCoupon.discountType}
                    onValueChange={(value: "percent" | "amount") =>
                      setNewCoupon({ ...newCoupon, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">
                        <span className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentage Off
                        </span>
                      </SelectItem>
                      <SelectItem value="amount">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Fixed Amount Off
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newCoupon.discountType === "percent" ? (
                  <div className="space-y-2">
                    <Label htmlFor="percentOff">Percent Off *</Label>
                    <div className="relative">
                      <Input
                        id="percentOff"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="20"
                        value={newCoupon.percentOff}
                        onChange={(e) => setNewCoupon({ ...newCoupon, percentOff: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="amountOff">Amount Off (USD) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amountOff"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="5.00"
                        value={newCoupon.amountOff}
                        onChange={(e) => setNewCoupon({ ...newCoupon, amountOff: e.target.value })}
                        className="pl-7"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={newCoupon.duration}
                    onValueChange={(value: "forever" | "once" | "repeating") =>
                      setNewCoupon({ ...newCoupon, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">First payment only</SelectItem>
                      <SelectItem value="repeating">Multiple months</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newCoupon.duration === "repeating" && (
                  <div className="space-y-2">
                    <Label htmlFor="durationInMonths">Number of Months *</Label>
                    <Input
                      id="durationInMonths"
                      type="number"
                      min="1"
                      placeholder="3"
                      value={newCoupon.durationInMonths}
                      onChange={(e) => setNewCoupon({ ...newCoupon, durationInMonths: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="maxRedemptions">Max Redemptions (optional)</Label>
                  <Input
                    id="maxRedemptions"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={newCoupon.maxRedemptions}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxRedemptions: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited use
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCoupon} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Coupon"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No coupons found</p>
            <p className="text-sm">Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {coupon.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(coupon.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {coupon.name && coupon.name !== coupon.id && (
                        <p className="text-xs text-muted-foreground mt-1">{coupon.name}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatDiscount(coupon)}</Badge>
                    </TableCell>
                    <TableCell>{formatDuration(coupon)}</TableCell>
                    <TableCell>
                      {coupon.times_redeemed}
                      {coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : " / ∞"}
                    </TableCell>
                    <TableCell>
                      {coupon.redeem_by
                        ? new Date(coupon.redeem_by * 1000).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.valid ? "default" : "destructive"}>
                        {coupon.valid ? "Active" : "Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        disabled={deletingId === coupon.id}
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
