import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface User {
  id: string;
  subscription_status: 'free' | 'pro';
  subscription_end: string | null;
  created_at: string;
}

interface RevenueChurnChartProps {
  users: User[];
}

const chartConfig = {
  newPro: {
    label: 'New Pro',
    color: 'hsl(var(--chart-1))',
  },
  churned: {
    label: 'Churned',
    color: 'hsl(var(--chart-2))',
  },
  netGrowth: {
    label: 'Net Growth',
    color: 'hsl(var(--chart-3))',
  },
};

export function RevenueChurnChart({ users }: RevenueChurnChartProps) {
  const monthlyData = useMemo(() => {
    const months: { month: string; date: Date; newPro: number; churned: number; netGrowth: number }[] = [];
    const now = new Date();

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Count new pro users (joined as pro or upgraded this month)
      // This is a simplified version - ideally we'd track subscription start dates
      const newPro = users.filter(user => {
        const createdDate = new Date(user.created_at);
        return user.subscription_status === 'pro' && 
          isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
      }).length;

      // Estimate churned users (those whose subscription ended this month)
      const churned = users.filter(user => {
        if (!user.subscription_end) return false;
        const endDate = new Date(user.subscription_end);
        return isWithinInterval(endDate, { start: monthStart, end: monthEnd }) && 
          user.subscription_status === 'free';
      }).length;

      months.push({
        month: format(monthDate, 'MMM'),
        date: monthDate,
        newPro,
        churned,
        netGrowth: newPro - churned,
      });
    }

    return months;
  }, [users]);

  const stats = useMemo(() => {
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const previousMonthData = monthlyData[monthlyData.length - 2];
    
    const totalNewPro = monthlyData.reduce((sum, m) => sum + m.newPro, 0);
    const totalChurned = monthlyData.reduce((sum, m) => sum + m.churned, 0);
    
    const monthlyChange = currentMonthData && previousMonthData
      ? currentMonthData.netGrowth - previousMonthData.netGrowth
      : 0;

    return {
      totalNewPro,
      totalChurned,
      netGrowth: totalNewPro - totalChurned,
      monthlyChange,
      currentMonth: currentMonthData,
    };
  }, [monthlyData]);

  return (
    <Card className="mb-4 md:mb-8">
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base md:text-lg">Subscription Trends</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Monthly new Pro subscribers vs. churned (last 6 months)
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-[hsl(var(--chart-1))]" />
              <span className="text-muted-foreground">New Pro: {stats.totalNewPro}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-[hsl(var(--chart-2))]" />
              <span className="text-muted-foreground">Churned: {stats.totalChurned}</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.netGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={stats.netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                Net: {stats.netGrowth > 0 ? '+' : ''}{stats.netGrowth}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="newPro" 
              fill="hsl(var(--chart-1))" 
              radius={[4, 4, 0, 0]} 
              name="New Pro"
            />
            <Bar 
              dataKey="churned" 
              fill="hsl(var(--chart-2))" 
              radius={[4, 4, 0, 0]} 
              name="Churned"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
