import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Chart from 'react-apexcharts';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week'); // today | week | month | year | all

  // Fetch data
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const data = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate?.() || new Date(),
        };
      });
      setOrders(data);
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubCategories();
    };
  }, []);

  // ═══ Date Helpers ═══
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // ═══ Revenue Calculations ═══
  const getRevenue = (from) =>
    orders
      .filter((o) => o.createdAt >= from && o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

  const todayRevenue = getRevenue(startOfDay);
  const weekRevenue = getRevenue(startOfWeek);
  const monthRevenue = getRevenue(startOfMonth);
  const yearRevenue = getRevenue(startOfYear);
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // ═══ Order Stats ═══
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  // ═══ Product Stats ═══
  const lowStock = products.filter((p) => (p.quantity || 0) > 0 && (p.quantity || 0) < 5).length;
  const outOfStock = products.filter((p) => (p.quantity || 0) === 0).length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
    0
  );

  // ═══ Revenue Trend (Last 7 Days) ═══
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const revenue = orders
      .filter(
        (o) =>
          o.createdAt >= d && o.createdAt < next && o.status !== 'cancelled'
      )
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue,
    };
  });

  // ═══ Monthly Revenue (Last 12 Months) ═══
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const year = d.getFullYear();
    const month = d.getMonth();
    const revenue = orders
      .filter((o) => {
        const od = o.createdAt;
        return (
          od.getFullYear() === year &&
          od.getMonth() === month &&
          o.status !== 'cancelled'
        );
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
    };
  });

  // ═══ Category Performance ═══
  const categoryStats = categories
    .map((cat) => {
      const catProducts = products.filter((p) => p.category === cat.id);
      const catProductIds = catProducts.map((p) => p.id);
      const catOrders = orders.filter((o) =>
        o.items?.some((item) => catProductIds.includes(item.productId))
      );
      const revenue = catOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      return {
        name: cat.name,
        revenue,
        products: catProducts.length,
      };
    })
    .filter((c) => c.revenue > 0 || c.products > 0);

  // ═══ Top Selling Products ═══
  const productSales = {};
  orders.forEach((order) => {
    order.items?.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.name || 'Unknown',
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].quantity += item.quantity || 0;
      productSales[item.productId].revenue +=
        (item.price || 0) * (item.quantity || 0);
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ═══ Currency Formatter ═══
  const formatCurrency = (n) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n}`;
  };

  // ═══ Chart Configs ═══
  const revenueTrendOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit',
      sparkline: { enabled: false },
    },
    colors: ['#E91E63'],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#F1F1F1',
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    xaxis: {
      categories: last7Days.map((d) => d.label),
      labels: { style: { colors: '#9CA3AF', fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#9CA3AF', fontSize: '12px' },
        formatter: (val) => formatCurrency(val),
      },
    },
    tooltip: {
      y: { formatter: (val) => `₹${val.toLocaleString()}` },
    },
  };
  const revenueTrendSeries = [
    { name: 'Revenue', data: last7Days.map((d) => d.revenue) },
  ];

  const monthlyOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: ['#9C27B0'],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '55%',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#F1F1F1',
      strokeDashArray: 4,
    },
    xaxis: {
      categories: last12Months.map((d) => d.label),
      labels: { style: { colors: '#9CA3AF', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#9CA3AF', fontSize: '11px' },
        formatter: (val) => formatCurrency(val),
      },
    },
    tooltip: {
      y: { formatter: (val) => `₹${val.toLocaleString()}` },
    },
  };
  const monthlySeries = [
    { name: 'Revenue', data: last12Months.map((d) => d.revenue) },
  ];

  const categoryOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: categoryStats.map((c) => c.name),
    colors: ['#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#FF9800', '#4CAF50'],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: '#6B7280' },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(0)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () =>
                `${categoryStats.reduce((s, c) => s + c.revenue, 0).toLocaleString()}`,
              style: { fontSize: '14px', fontWeight: 600 },
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (val) => `₹${val.toLocaleString()}` },
    },
  };
  const categorySeries = categoryStats.map((c) => c.revenue);

  const topProductsOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: ['#E91E63'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
        barHeight: '60%',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#F1F1F1',
      strokeDashArray: 4,
    },
    xaxis: {
      categories: topProducts.map((p) => p.name),
      labels: {
        style: { colors: '#9CA3AF', fontSize: '11px' },
        formatter: (val) => formatCurrency(val),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#374151', fontSize: '12px', fontWeight: 500 } },
    },
    tooltip: {
      y: { formatter: (val) => `₹${val.toLocaleString()}` },
    },
  };
  const topProductsSeries = [
    { name: 'Revenue', data: topProducts.map((p) => p.revenue) },
  ];

  const orderStatusOptions = {
    chart: { type: 'pie', fontFamily: 'inherit' },
    labels: ['Pending', 'Delivered', 'Cancelled'],
    colors: ['#FF9800', '#4CAF50', '#F44336'],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: '#6B7280' },
    },
    dataLabels: { enabled: true },
    tooltip: {
      y: { formatter: (val) => `${val} orders` },
    },
  };
  const orderStatusSeries = [pendingOrders, deliveredOrders, cancelledOrders];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:ml-72">
        <Header setSidebarOpen={setSidebarOpen} title="Analytics" />

        <main className="p-4 sm:p-8 space-y-6">
          {/* Period Selector */}
          <div className="flex flex-wrap items-center gap-2 animate-fade-in">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'year', label: 'This Year' },
              { key: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  period === p.key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <RevenueCard
              label="Today's Revenue"
              value={formatCurrency(todayRevenue)}
              gradient="from-pink-500 to-rose-500"
              icon="💰"
            />
            <RevenueCard
              label="This Week"
              value={formatCurrency(weekRevenue)}
              gradient="from-purple-500 to-indigo-500"
              icon="📅"
            />
            <RevenueCard
              label="This Month"
              value={formatCurrency(monthRevenue)}
              gradient="from-blue-500 to-cyan-500"
              icon="📊"
            />
            <RevenueCard
              label="This Year"
              value={formatCurrency(yearRevenue)}
              gradient="from-emerald-500 to-teal-500"
              icon="📈"
            />
          </div>

          {/* Lifetime + Inventory Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <StatCard
              label="Lifetime Revenue"
              value={formatCurrency(totalRevenue)}
              sub={`${totalOrders} orders`}
              color="pink"
            />
            <StatCard
              label="Inventory Value"
              value={formatCurrency(inventoryValue)}
              sub={`${products.length} products`}
              color="purple"
            />
            <StatCard
              label="Low Stock"
              value={lowStock}
              sub="Below 5 units"
              color="orange"
            />
            <StatCard
              label="Out of Stock"
              value={outOfStock}
              sub="Need restocking"
              color="red"
            />
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  Revenue Trend
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Last 7 days performance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                <span className="text-xs font-semibold text-gray-600">
                  Revenue
                </span>
              </div>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Chart
                options={revenueTrendOptions}
                series={revenueTrendSeries}
                type="area"
                height={280}
              />
            )}
          </div>

          {/* Monthly + Category Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1">
                Monthly Revenue
              </h3>
              <p className="text-xs text-gray-500 mb-6">Last 12 months</p>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <Chart
                  options={monthlyOptions}
                  series={monthlySeries}
                  type="bar"
                  height={280}
                />
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1">
                Category Performance
              </h3>
              <p className="text-xs text-gray-500 mb-6">Revenue by category</p>
              {loading || categoryStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No data available</p>
                </div>
              ) : (
                <Chart
                  options={categoryOptions}
                  series={categorySeries}
                  type="donut"
                  height={280}
                />
              )}
            </div>
          </div>

          {/* Top Products + Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1">
                Top Selling Products
              </h3>
              <p className="text-xs text-gray-500 mb-6">By revenue</p>
              {topProducts.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No sales yet</p>
                </div>
              ) : (
                <Chart
                  options={topProductsOptions}
                  series={topProductsSeries}
                  type="bar"
                  height={280}
                />
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1">
                Order Status
              </h3>
              <p className="text-xs text-gray-500 mb-6">Current breakdown</p>
              {totalOrders === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No orders yet</p>
                </div>
              ) : (
                <Chart
                  options={orderStatusOptions}
                  series={orderStatusSeries}
                  type="pie"
                  height={280}
                />
              )}
            </div>
          </div>

          <div className="h-8"></div>
        </main>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// ═══ Reusable Components ═══
function RevenueCard({ label, value, gradient, icon }) {
  return (
    <div className="group bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div
          className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  const colorMap = {
    pink: 'text-pink-600 bg-pink-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-shadow">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-2 tracking-tight ${colorMap[color].split(' ')[0]}`}>
        {value}
      </p>
      <p className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colorMap[color]}`}>
        {sub}
      </p>
    </div>
  );
}