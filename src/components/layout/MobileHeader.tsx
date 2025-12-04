import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/UserMenu'

export function MobileHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
    >
      <div className="w-full py-4 px-4">
        <div className="flex items-center justify-end">
          {user ? (
            <UserMenu />
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-all font-medium text-sm"
            >
              Entrar
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
