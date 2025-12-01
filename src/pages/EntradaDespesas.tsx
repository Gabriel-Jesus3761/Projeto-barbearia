import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Plus,
  X,
  Percent
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TabType = 'entradas' | 'despesas'
type StatusFilter = 'todos' | 'concluido' | 'agendado' | 'cancelado'
type PaymentMethod = 'percentage' | 'fixed'

interface ProfessionalPayment {
  type: PaymentMethod
  value: number // % ou valor fixo mensal
}

interface Agendamento {
  id: string
  clienteNome: string
  servico: string
  valor: number
  data: string
  hora: string
  status: 'concluido' | 'agendado' | 'cancelado'
  profissional: string
  professionalPayment: ProfessionalPayment
}

interface DespesaManual {
  id: string
  descricao: string
  valor: number
  data: string
  categoria: string
}

// Mock data com informações de pagamento dos profissionais
const mockAgendamentos: Agendamento[] = [
  {
    id: '1',
    clienteNome: 'João Silva',
    servico: 'Corte + Barba',
    valor: 80.00,
    data: '2025-12-01',
    hora: '10:00',
    status: 'concluido',
    profissional: 'Carlos Barbeiro',
    professionalPayment: { type: 'percentage', value: 40 } // 40% prof / 60% estabelecimento
  },
  {
    id: '2',
    clienteNome: 'Maria Santos',
    servico: 'Corte Feminino',
    valor: 120.00,
    data: '2025-12-01',
    hora: '14:00',
    status: 'agendado',
    profissional: 'Ana Silva',
    professionalPayment: { type: 'fixed', value: 3000 } // R$ 3000/mês fixo
  },
  {
    id: '3',
    clienteNome: 'Pedro Costa',
    servico: 'Barba',
    valor: 45.00,
    data: '2025-11-30',
    hora: '16:00',
    status: 'cancelado',
    profissional: 'Carlos Barbeiro',
    professionalPayment: { type: 'percentage', value: 40 }
  },
  {
    id: '4',
    clienteNome: 'Lucas Oliveira',
    servico: 'Corte + Barba + Sombrancelha',
    valor: 95.00,
    data: '2025-12-01',
    hora: '11:30',
    status: 'concluido',
    profissional: 'Roberto Santos',
    professionalPayment: { type: 'percentage', value: 50 } // 50% / 50%
  },
  {
    id: '5',
    clienteNome: 'Rafael Souza',
    servico: 'Corte',
    valor: 50.00,
    data: '2025-12-02',
    hora: '09:00',
    status: 'agendado',
    profissional: 'Carlos Barbeiro',
    professionalPayment: { type: 'percentage', value: 40 }
  },
]

const mockDespesasManuais: DespesaManual[] = [
  {
    id: '1',
    descricao: 'Aluguel',
    valor: 2500.00,
    data: '2025-12-01',
    categoria: 'Fixo'
  },
  {
    id: '2',
    descricao: 'Energia Elétrica',
    valor: 350.00,
    data: '2025-12-05',
    categoria: 'Utilidades'
  },
]

export function EntradaDespesas() {
  const [activeTab, setActiveTab] = useState<TabType>('entradas')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [isAddDespesaModalOpen, setIsAddDespesaModalOpen] = useState(false)
  const [despesaForm, setDespesaForm] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: ''
  })

  // Calcular entrada do estabelecimento por agendamento
  const calcularEntrada = (agendamento: Agendamento) => {
    if (agendamento.status === 'cancelado') return 0

    const { professionalPayment, valor } = agendamento

    if (professionalPayment.type === 'fixed') {
      // Se é fixo, todo o valor do serviço vai para o estabelecimento
      return valor
    } else {
      // Se é porcentagem, pega a parte do estabelecimento
      const percentualEstabelecimento = 100 - professionalPayment.value
      return (valor * percentualEstabelecimento) / 100
    }
  }

  // Calcular despesa do profissional por agendamento
  const calcularDespesaProfissional = (agendamento: Agendamento) => {
    if (agendamento.status === 'cancelado') return 0

    const { professionalPayment, valor } = agendamento

    if (professionalPayment.type === 'percentage') {
      // Se é porcentagem, calcula o valor do profissional
      return (valor * professionalPayment.value) / 100
    }

    // Se é fixo, não conta por serviço (será contabilizado como despesa mensal fixa)
    return 0
  }

  // Calcular totais de ENTRADA (apenas serviços concluídos)
  const receitaConfirmada = mockAgendamentos
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + calcularEntrada(a), 0)

  const projecaoFaturamento = mockAgendamentos
    .filter(a => a.status === 'agendado')
    .reduce((sum, a) => sum + calcularEntrada(a), 0)

  // Calcular totais de DESPESA com profissionais (apenas concluídos)
  const despesaProfissionaisConfirmada = mockAgendamentos
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + calcularDespesaProfissional(a), 0)

  // Despesas manuais (fixas)
  const despesasManuaisTotal = mockDespesasManuais.reduce((sum, d) => sum + d.valor, 0)

  // Despesas com salários fixos (TODO: calcular salários fixos dos profissionais)
  const salariosFixosTotal = 3000 // Mock: Ana Silva ganha R$ 3000/mês

  // Total de despesas
  const totalDespesasConfirmadas = despesaProfissionaisConfirmada + despesasManuaisTotal + salariosFixosTotal

  // Filtrar agendamentos
  const agendamentosFiltrados = statusFilter === 'todos'
    ? mockAgendamentos
    : mockAgendamentos.filter(a => a.status === statusFilter)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        )
      case 'agendado':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Agendado
          </Badge>
        )
      case 'cancelado':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return null
    }
  }

  const getPaymentBadge = (payment: ProfessionalPayment) => {
    if (payment.type === 'fixed') {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
          <DollarSign className="w-3 h-3 mr-1" />
          Fixo R$ {payment.value}/mês
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
          <Percent className="w-3 h-3 mr-1" />
          {payment.value}% / {100 - payment.value}%
        </Badge>
      )
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleAddDespesa = () => {
    console.log('Adicionar despesa:', despesaForm)
    alert('Despesa adicionada com sucesso!')
    setIsAddDespesaModalOpen(false)
    setDespesaForm({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: ''
    })
  }

  // Calcular lucro líquido
  const lucroLiquido = receitaConfirmada - totalDespesasConfirmadas
  const margemLucro = receitaConfirmada > 0 ? (lucroLiquido / receitaConfirmada) * 100 : 0

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent mb-2">
          Entrada/Despesas
        </h1>
        <p className="text-gray-400">
          Gerencie suas entradas e despesas
        </p>
      </motion.div>

      {/* Card de Resumo Geral */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-sm border-gold/30">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Receita Confirmada</p>
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(receitaConfirmada)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Despesas Totais</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesasConfirmadas)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  lucroLiquido >= 0 ? "bg-gold/20" : "bg-red-500/20"
                )}>
                  <DollarSign className={cn("w-6 h-6", lucroLiquido >= 0 ? "text-gold" : "text-red-500")} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Lucro Líquido</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    lucroLiquido >= 0 ? "text-gold" : "text-red-500"
                  )}>
                    {formatCurrency(lucroLiquido)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Margem: {margemLucro.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('entradas')}
            className={cn(
              "px-6 py-3 font-semibold transition-all duration-200 relative",
              activeTab === 'entradas'
                ? "text-emerald-500"
                : "text-gray-400 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Entradas</span>
            </div>
            {activeTab === 'entradas' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('despesas')}
            className={cn(
              "px-6 py-3 font-semibold transition-all duration-200 relative",
              activeTab === 'despesas'
                ? "text-red-500"
                : "text-gray-400 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              <span>Despesas</span>
            </div>
            {activeTab === 'despesas' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'entradas' ? (
          <div className="space-y-6">
            {/* Cards de Resumo - ENTRADAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Receita Confirmada</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-500">
                    {formatCurrency(receitaConfirmada)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Serviços concluídos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-blue-500/30 hover:border-blue-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Projeção de Faturamento</p>
                  </div>
                  <Clock className="w-5 h-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">
                    {formatCurrency(projecaoFaturamento)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Agendamentos pendentes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-gold/30 hover:border-gold/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Previsto</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gold">
                    {formatCurrency(receitaConfirmada + projecaoFaturamento)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Confirmado + Projeção
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('todos')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  statusFilter === 'todos'
                    ? "bg-white/10 text-gray-300"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('concluido')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  statusFilter === 'concluido'
                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-500"
                )}
              >
                Concluídos
              </button>
              <button
                onClick={() => setStatusFilter('agendado')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  statusFilter === 'agendado'
                    ? "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-500"
                )}
              >
                Agendados
              </button>
              <button
                onClick={() => setStatusFilter('cancelado')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  statusFilter === 'cancelado'
                    ? "bg-red-500/20 text-red-500 border border-red-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                )}
              >
                Cancelados
              </button>
            </div>

            {/* Lista de Agendamentos */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-semibold text-gray-300">
                    Agendamentos ({agendamentosFiltrados.length})
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agendamentosFiltrados.length > 0 ? (
                    agendamentosFiltrados.map((agendamento) => {
                      const entradaEstabelecimento = calcularEntrada(agendamento)

                      return (
                        <motion.div
                          key={agendamento.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gold" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h4 className="font-semibold text-white">{agendamento.clienteNome}</h4>
                                {getStatusBadge(agendamento.status)}
                                {getPaymentBadge(agendamento.professionalPayment)}
                              </div>
                              <p className="text-sm text-gray-400">{agendamento.servico}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <p className="text-xs text-gray-500">
                                  {formatDate(agendamento.data)} às {agendamento.hora}
                                </p>
                                <span className="text-xs text-gray-500">•</span>
                                <p className="text-xs text-gray-500">{agendamento.profissional}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-xl font-bold",
                              agendamento.status === 'concluido' && "text-emerald-500",
                              agendamento.status === 'agendado' && "text-blue-500",
                              agendamento.status === 'cancelado' && "text-gray-500 line-through"
                            )}>
                              {formatCurrency(entradaEstabelecimento)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Total: {formatCurrency(agendamento.valor)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum agendamento encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo - DESPESAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border-red-500/30 hover:border-red-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Despesas com Profissionais</p>
                  </div>
                  <User className="w-5 h-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">
                    {formatCurrency(despesaProfissionaisConfirmada)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Comissões pagas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-orange-500/30 hover:border-orange-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Despesas Fixas</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">
                    {formatCurrency(despesasManuaisTotal + salariosFixosTotal)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Salários + Outras despesas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-red-600/30 hover:border-red-600/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total de Despesas</p>
                  </div>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(totalDespesasConfirmadas)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Total confirmado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Botão Adicionar Despesa */}
            <div className="flex justify-end">
              <Button
                onClick={() => setIsAddDespesaModalOpen(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Despesa
              </Button>
            </div>

            {/* Lista de Despesas Manuais */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-semibold text-gray-300">
                    Despesas Fixas ({mockDespesasManuais.length + 1})
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Salário Fixo */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Salários Fixos</h4>
                      <p className="text-sm text-gray-400">Ana Silva - Profissional</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Mensal • Pagamento Fixo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-500">
                        {formatCurrency(salariosFixosTotal)}
                      </p>
                    </div>
                  </motion.div>

                  {/* Despesas Manuais */}
                  {mockDespesasManuais.map((despesa) => (
                    <motion.div
                      key={despesa.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{despesa.descricao}</h4>
                        <p className="text-sm text-gray-400">{despesa.categoria}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(despesa.data)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-500">
                          {formatCurrency(despesa.valor)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Comissões de Profissionais */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-semibold text-gray-300">
                    Comissões de Profissionais ({mockAgendamentos.filter(a => a.status === 'concluido' && a.professionalPayment.type === 'percentage').length})
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAgendamentos
                    .filter(a => a.status === 'concluido' && a.professionalPayment.type === 'percentage')
                    .map((agendamento) => {
                      const despesaProf = calcularDespesaProfissional(agendamento)

                      return (
                        <motion.div
                          key={agendamento.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-white">{agendamento.profissional}</h4>
                              {getPaymentBadge(agendamento.professionalPayment)}
                            </div>
                            <p className="text-sm text-gray-400">{agendamento.servico} - {agendamento.clienteNome}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(agendamento.data)} • Total: {formatCurrency(agendamento.valor)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-red-500">
                              {formatCurrency(despesaProf)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Modal Adicionar Despesa */}
      <AnimatePresence>
        {isAddDespesaModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDespesaModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Adicionar Despesa</h3>
                    <p className="text-sm text-gray-400 mt-1">Nova despesa manual</p>
                  </div>
                  <button
                    onClick={() => setIsAddDespesaModalOpen(false)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
                    <Input
                      id="descricao"
                      value={despesaForm.descricao}
                      onChange={(e) => setDespesaForm({ ...despesaForm, descricao: e.target.value })}
                      placeholder="Ex: Água, Internet, Produtos..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="valor" className="text-gray-300">Valor (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={despesaForm.valor}
                      onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })}
                      placeholder="0,00"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria" className="text-gray-300">Categoria</Label>
                    <Input
                      id="categoria"
                      value={despesaForm.categoria}
                      onChange={(e) => setDespesaForm({ ...despesaForm, categoria: e.target.value })}
                      placeholder="Ex: Utilidades, Produtos, Manutenção..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="data" className="text-gray-300">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={despesaForm.data}
                      onChange={(e) => setDespesaForm({ ...despesaForm, data: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDespesaModalOpen(false)}
                      className="flex-1 border-white/10 text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddDespesa}
                      disabled={!despesaForm.descricao || !despesaForm.valor}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
