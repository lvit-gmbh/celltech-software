"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileDown, Calendar, TrendingUp, DollarSign, Package, Truck } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import StatisticsCard from "@/components/shadcn-studio/blocks/statistics-card-01"

// Sales data for charts
const salesData = [
  { month: "Jan", orders: 45, revenue: 320000 },
  { month: "Feb", orders: 52, revenue: 380000 },
  { month: "Mar", orders: 48, revenue: 350000 },
  { month: "Apr", orders: 61, revenue: 420000 },
  { month: "May", orders: 55, revenue: 390000 },
  { month: "Jun", orders: 67, revenue: 480000 },
]

const statusData = [
  { name: "Scheduled", value: 89, fill: "hsl(var(--chart-1))" },
  { name: "In Production", value: 127, fill: "hsl(var(--chart-2))" },
  { name: "Ready to Ship", value: 45, fill: "hsl(var(--chart-3))" },
  { name: "Shipped", value: 177, fill: "hsl(var(--chart-4))" },
]

const revenueData = [
  { month: "Jan", brightview: 180000, standard: 140000 },
  { month: "Feb", brightview: 220000, standard: 160000 },
  { month: "Mar", brightview: 200000, standard: 150000 },
  { month: "Apr", brightview: 250000, standard: 170000 },
  { month: "May", brightview: 230000, standard: 160000 },
  { month: "Jun", brightview: 280000, standard: 200000 },
]

const salesChartConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const revenueChartConfig = {
  brightview: {
    label: "BrightView",
    color: "hsl(var(--chart-1))",
  },
  standard: {
    label: "Standard",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function ReportingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          icon={<TrendingUp className="h-4 w-4" />}
          value="$2.4M"
          title="Total Revenue"
          changePercentage="+22.1%"
        />
        <StatisticsCard
          icon={<Package className="h-4 w-4" />}
          value="328"
          title="Total Orders"
          changePercentage="+12.5%"
        />
        <StatisticsCard
          icon={<Truck className="h-4 w-4" />}
          value="177"
          title="Shipped"
          changePercentage="+15.3%"
        />
        <StatisticsCard
          icon={<DollarSign className="h-4 w-4" />}
          value="$7.3K"
          title="Avg. Order Value"
          changePercentage="+8.2%"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Orders & Revenue Chart */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Orders & Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig}>
                  <BarChart data={salesData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Revenue by Model Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig}>
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="brightview" fill="var(--color-brightview)" radius={8} />
                  <Bar dataKey="standard" fill="var(--color-standard)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Monthly Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig}>
                  <LineChart data={salesData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="var(--color-orders)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig}>
                  <LineChart data={salesData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--color-revenue)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Production Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusData.map((status) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{status.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${(status.value / 438) * 100}%`,
                              backgroundColor: status.fill
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{status.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Production Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Build Time</span>
                    <span className="text-lg font-semibold">12.5 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                    <span className="text-lg font-semibold">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quality Score</span>
                    <span className="text-lg font-semibold">98.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Capacity Utilization</span>
                    <span className="text-lg font-semibold">87.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

