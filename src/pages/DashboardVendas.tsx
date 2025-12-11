import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  Users,
  Target,
  Award,
  Star,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockAppointments } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { DateRangePicker, type DateRange } from "@/components/DateRangePicker";

export default function DashboardVendas() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: today,
    to: today,
  });

  const salesData = useMemo(() => {
    const from = dateRange.from || today;
    const to = dateRange.to || today;

    const filteredAppointments = mockAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate >= from && aptDate <= to && apt.status === "completed";
    });

    // Vendas por serviço
    const servicesSales = filteredAppointments.reduce((acc, apt) => {
      if (!acc[apt.service]) {
        acc[apt.service] = { count: 0, revenue: 0 };
      }
      acc[apt.service].count += 1;
      acc[apt.service].revenue += apt.price;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Vendas por profissional
    const professionalSales = filteredAppointments.reduce((acc, apt) => {
      if (!acc[apt.professional]) {
        acc[apt.professional] = { count: 0, revenue: 0 };
      }
      acc[apt.professional].count += 1;
      acc[apt.professional].revenue += apt.price;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Top 5 serviços mais vendidos
    const topServices = Object.entries(servicesSales)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Top 5 profissionais com mais vendas
    const topProfessionals = Object.entries(professionalSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    const totalSales = filteredAppointments.length;
    const totalRevenue = filteredAppointments.reduce(
      (sum, apt) => sum + apt.price,
      0
    );
    const uniqueClients = new Set(
      filteredAppointments.map((apt) => apt.clientName)
    ).size;
    const conversionRate = 85; // Taxa fictícia de conversão

    return {
      totalSales,
      totalRevenue,
      uniqueClients,
      conversionRate,
      topServices,
      topProfessionals,
      servicesSales,
      professionalSales,
    };
  }, [dateRange]);

  const statsCards = [
    {
      title: "Total de Vendas",
      value: salesData.totalSales.toString(),
      icon: ShoppingCart,
      trend: "+18.2%",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Receita de Vendas",
      value: formatCurrency(salesData.totalRevenue),
      icon: TrendingUp,
      trend: "+23.5%",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Clientes Únicos",
      value: salesData.uniqueClients.toString(),
      icon: Users,
      trend: "+12.8%",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Taxa de Conversão",
      value: `${salesData.conversionRate}%`,
      icon: Target,
      trend: "+5.3%",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Painel de Vendas
              </h1>
              <p className="text-gray-400">
                Análise de desempenho de vendas e serviços
              </p>
            </div>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`${stat.bgColor
                        .replace("bg-", "bg-")
                        .replace("-100", "-500/20")} p-3 rounded-lg`}
                    >
                      <stat.icon
                        className={`w-6 h-6 ${stat.color
                          .replace("text-", "text-")
                          .replace("-600", "-400")}`}
                      />
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {stat.trend}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    {stat.title}
                  </h3>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Serviços Mais Vendidos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/5/5 backdrop-blur-sm border-white/10 bg-white/5/5 backdrop-blur-sm border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="w-5 h-5 text-gold" />
                  Top 5 Serviços Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {salesData.topServices.map(([service, data], index) => {
                    const maxCount = salesData.topServices[0][1].count;
                    const percentage = (data.count / maxCount) * 100;

                    return (
                      <div key={service} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {service}
                              </p>
                              <p className="text-xs text-gray-500">
                                {data.count} vendas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">
                              {formatCurrency(data.revenue)}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-white/5/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-gold to-gold-dark h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top 5 Profissionais com Mais Vendas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/5/5 backdrop-blur-sm border-white/10 bg-white/5/5 backdrop-blur-sm border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold" />
                  Top 5 Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {salesData.topProfessionals.map(
                    ([professional, data], index) => {
                      const maxRevenue =
                        salesData.topProfessionals[0][1].revenue;
                      const percentage = (data.revenue / maxRevenue) * 100;
                      const colors = [
                        "bg-yellow-500",
                        "bg-gray-400",
                        "bg-orange-600",
                        "bg-blue-500",
                        "bg-green-500",
                      ];

                      return (
                        <div key={professional} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 ${colors[index]} rounded-full flex items-center justify-center`}
                              >
                                {index === 0 ? (
                                  <Star className="w-5 h-5 text-white fill-white" />
                                ) : (
                                  <span className="text-white font-bold">
                                    #{index + 1}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {professional}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {data.count} atendimentos
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">
                                {formatCurrency(data.revenue)}
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className={`${colors[index]} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Análise de Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="bg-white/5/5 backdrop-blur-sm border-white/10 bg-white/5/5 backdrop-blur-sm border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                Análise de Performance por Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        Serviço
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                        Vendas
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                        Receita
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                        Ticket Médio
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(salesData.servicesSales)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .map(([service, data]) => {
                        const avgTicket = data.revenue / data.count;
                        const performance =
                          data.count > 10
                            ? "Alta"
                            : data.count > 5
                            ? "Média"
                            : "Baixa";
                        const performanceColor =
                          performance === "Alta"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : performance === "Média"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-red-100 text-red-700 border-red-200";

                        return (
                          <tr
                            key={service}
                            className="border-b border-white/10 hover:bg-white/5/5 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm font-medium text-white">
                              {service}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-400 text-center">
                              {data.count}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                              {formatCurrency(data.revenue)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-400 text-right">
                              {formatCurrency(avgTicket)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={performanceColor}>
                                {performance}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
