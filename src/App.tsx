import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import DashboardFinanceiro from './pages/DashboardFinanceiro'
import DashboardVendas from './pages/DashboardVendas'
import { DashboardProfissionais } from './pages/DashboardProfissionais'
import { DashboardServicos } from './pages/DashboardServicos'
import { DashboardClientes } from './pages/DashboardClientes'
import { DashboardAgendamentos } from './pages/DashboardAgendamentos'
import { Agendamentos } from './pages/Agendamentos'
import { Servicos } from './pages/Servicos'
import { Profissionais } from './pages/Profissionais'

function App() {
  return (
    <Router basename="/Projeto-barbearia">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard/financeiro" element={<DashboardFinanceiro />} />
          <Route path="dashboard/vendas" element={<DashboardVendas />} />
          <Route path="dashboard/profissionais" element={<DashboardProfissionais />} />
          <Route path="dashboard/servicos" element={<DashboardServicos />} />
          <Route path="dashboard/clientes" element={<DashboardClientes />} />
          <Route path="dashboard/agendamentos" element={<DashboardAgendamentos />} />
          <Route path="agendamentos" element={<Agendamentos />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="profissionais" element={<Profissionais />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
