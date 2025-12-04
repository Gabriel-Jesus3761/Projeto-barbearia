import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/UserMenu'

export function DesktopHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
    >
      <div className="w-full py-6">
        <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* Logo Centralizada */}
          <button
            onClick={() => navigate('/')}
            className="group"
            title="Connecta ServiçosPro"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gold to-yellow-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
              <img
                src="/assets/images/Logo.png"
                alt="Connecta ServiçosPro"
                className="w-full h-full object-cover rounded-xl scale-110"
              />
            </div>

            {/* Tooltip */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-50">
              Connecta ServiçosPro
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-t border-white/10"></div>
            </div>
          </button>

          {/* User Menu - Extremidade Direita */}
          <div className="absolute right-0">
            {user ? (
              <UserMenu />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-gray-100 transition-all font-medium text-sm"
              >
                Entrar
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
