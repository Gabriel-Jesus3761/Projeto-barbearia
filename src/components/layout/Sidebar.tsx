import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  DollarSign,
  UserCheck,
  ShoppingBag,
  ClipboardList,
  TrendingUp,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getBusinessById, type Business } from '@/services/businessService'

interface NavItem {
  to?: string
  icon: any
  label: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Painéis de gestão',
    icon: LayoutDashboard,
    children: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Geral' },
      { to: '/dashboard/financeiro', icon: DollarSign, label: 'Financeiro' },
      { to: '/dashboard/profissionais', icon: UserCheck, label: 'Profissionais' },
      { to: '/dashboard/servicos', icon: ShoppingBag, label: 'Serviços' },
      { to: '/dashboard/clientes', icon: Users, label: 'Clientes' },
      { to: '/dashboard/agendamentos', icon: ClipboardList, label: 'Agendamentos' },
    ]
  },
  { to: '/entrada-despesas', icon: TrendingUp, label: 'Entrada/Despesas' },
  { to: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
  { to: '/servicos', icon: Scissors, label: 'Serviços' },
  { to: '/profissionais', icon: Users, label: 'Profissionais' },
  { to: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (value: boolean) => void
}

export function Sidebar({ isExpanded, setIsExpanded, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    'Painéis de gestão': true // Dashboard submenu expanded by default
  })
  const [imageLoadError, setImageLoadError] = useState(false)

  // Carregar dados do estabelecimento
  useEffect(() => {
    const loadBusiness = async () => {
      const businessId = localStorage.getItem('selected_business_id')
      if (businessId) {
        try {
          const businessData = await getBusinessById(businessId)
          if (businessData) {
            setBusiness(businessData)
          }
        } catch (error) {
          console.error('Erro ao carregar estabelecimento:', error)
        }
      }
    }

    loadBusiness()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const shouldExpand = !isMobile && (isExpanded || isHovered)

  // Close mobile menu when clicking on a link
  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }

  // Toggle submenu expansion
  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  // Get business ID for routes
  const businessId = business?.id || localStorage.getItem('selected_business_id') || ''

  // Update routes with business ID
  const getRoutePath = (basePath: string) => {
    if (!businessId) return basePath
    // Se a rota já tem o businessId, retorna como está
    if (basePath.includes(businessId)) return basePath
    // Adiciona o businessId antes do path
    return `/${businessId}${basePath}`
  }

  // Check if any child route is active
  const isParentActive = (item: NavItem) => {
    if (!item.children) return false
    return item.children.some(child => {
      const routePath = child.to ? getRoutePath(child.to) : ''
      return routePath === location.pathname
    })
  }

  // Handle logout - volta para seleção de estabelecimento
  const handleLogout = () => {
    localStorage.removeItem('selected_business_id')
    navigate('/selecionar-empresa')
  }

  // Função para pegar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Melhorar qualidade da imagem do Google
  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('googleusercontent.com') && url.includes('=s96-c')) {
      return url.replace('=s96-c', '=s400-c')
    }
    return url
  }

  const displayAvatar = user?.avatar ? getHighQualityImageUrl(user.avatar) : undefined

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -280 } : { x: -280 }}
        animate={{
          x: isMobile ? (isMobileOpen ? 0 : -280) : 0,
          width: isMobile ? 280 : shouldExpand ? 280 : 80
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className="bg-gradient-to-b from-gray-900 to-black text-white h-screen fixed left-0 top-0 flex flex-col border-r border-gold/20 z-50"
      >
        {/* Header with Logo and Menu Button */}
        <div className={cn(
          "p-6 border-b border-gold/20",
          !isMobile && !shouldExpand && "flex justify-center"
        )}>
          <div className={cn(
            "flex items-center justify-between gap-3",
            !isMobile && !shouldExpand && "w-auto"
          )}>
            <div className={cn(
              "flex items-center gap-3 overflow-hidden",
              !isMobile && !shouldExpand && "w-auto"
            )}>
              <div className="w-12 h-12 bg-gold rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {business?.image ? (
                  <img
                    src={business.image}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/assets/images/Logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover scale-110"
                  />
                )}
              </div>
              <AnimatePresence>
                {(shouldExpand || isMobileOpen) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <h1 className="text-lg font-bold text-gold leading-tight line-clamp-2">
                      {business?.name || 'BarberPro'}
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hamburger Button - Desktop Only */}
            {!isMobile && shouldExpand && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-gold/10 rounded-lg transition-colors flex-shrink-0"
              >
                {isExpanded ? (
                  <X className="w-5 h-5 text-gold" />
                ) : (
                  <Menu className="w-5 h-5 text-gold" />
                )}
              </motion.button>
            )}

            {/* Close Button - Mobile Only */}
            {isMobile && isMobileOpen && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-gold/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gold" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to || item.label}>
                {/* Item with children (submenu) */}
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        "hover:bg-gold/10",
                        isParentActive(item)
                          ? "bg-gold/20 text-white border border-gold/30"
                          : "text-gray-300 hover:text-white",
                        !isMobile && !shouldExpand && "justify-center"
                      )}
                      title={!isMobile && !shouldExpand ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {(shouldExpand || isMobileOpen) && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="font-medium whitespace-nowrap overflow-hidden flex-1 text-left"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {(shouldExpand || isMobileOpen) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, rotate: expandedMenus[item.label] ? 0 : -90 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Submenu items */}
                    <AnimatePresence>
                      {expandedMenus[item.label] && (shouldExpand || isMobileOpen) && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-1 space-y-1 overflow-hidden"
                        >
                          {item.children.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={getRoutePath(child.to!)}
                                end
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                  cn(
                                    "flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg transition-all duration-200",
                                    "hover:bg-gold/10 hover:translate-x-1",
                                    isActive
                                      ? "bg-gold text-white shadow-lg shadow-gold/20"
                                      : "text-gray-400 hover:text-white"
                                  )
                                }
                              >
                                <child.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium text-sm whitespace-nowrap">
                                  {child.label}
                                </span>
                              </NavLink>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Regular item without children */
                  <NavLink
                    to={getRoutePath(item.to!)}
                    end
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        "hover:bg-gold/10 hover:translate-x-1",
                        isActive
                          ? "bg-gold text-white shadow-lg shadow-gold/20"
                          : "text-gray-300 hover:text-white",
                        !isMobile && !shouldExpand && "justify-center"
                      )
                    }
                    title={!isMobile && !shouldExpand ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {(shouldExpand || isMobileOpen) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Actions */}
        <div className="p-4 border-t border-gold/20 space-y-2">
          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50",
            !isMobile && !shouldExpand && "justify-center px-2"
          )}>
            {displayAvatar && !imageLoadError ? (
              <img
                src={displayAvatar}
                alt={user?.name || 'Usuário'}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
            )}
            <AnimatePresence>
              {(shouldExpand || isMobileOpen) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="text-sm font-medium text-white whitespace-nowrap">{user?.name}</p>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {user?.activeRole === 'owner' ? 'Proprietário' : user?.activeRole === 'professional' ? 'Profissional' : 'Cliente'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-red-500/10 text-gray-300 hover:text-red-400",
                !isMobile && !shouldExpand && "justify-center"
              )}
              title={!isMobile && !shouldExpand ? "Sair" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {(shouldExpand || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap overflow-hidden"
                  >
                    Sair
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
