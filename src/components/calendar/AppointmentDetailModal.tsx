import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, User, Scissors, Phone, DollarSign, Calendar, CheckCircle2 } from 'lucide-react'
import { Appointment } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AppointmentDetailModalProps {
  appointment: Appointment | null
  onClose: () => void
}

export function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  useEffect(() => {
    if (appointment) {
      // Previne scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden'

      // Adiciona listener para fechar com ESC
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)

      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [appointment, onClose])

  if (!appointment) return null

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmado', color: 'bg-blue-500/20 border-blue-500 text-blue-200' }
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-200' }
      case 'completed':
        return { label: 'Concluído', color: 'bg-green-500/20 border-green-500 text-green-200' }
      case 'cancelled':
        return { label: 'Cancelado', color: 'bg-red-500/20 border-red-500 text-red-200' }
      default:
        return { label: 'Desconhecido', color: 'bg-gray-500/20 border-gray-500 text-gray-200' }
    }
  }

  const statusInfo = getStatusInfo(appointment.status)
  const appointmentDate = new Date(appointment.date)
  const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
      style={{ position: 'fixed' }}
    >
      <div
        className="bg-gray-900 border border-gold/30 rounded-t-2xl sm:rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold/20">
          <h2 className="text-xl font-bold text-gold">Detalhes do Agendamento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status</span>
            <Badge className={`${statusInfo.color} border`}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Data e Hora */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-400">Data</p>
                <p className="text-base font-medium text-white capitalize">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-400">Horário e Duração</p>
                <p className="text-base font-medium text-white">
                  {appointment.time} <span className="text-gray-400">({appointment.duration} minutos)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700" />

          {/* Cliente */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">Cliente</p>
              <p className="text-base font-medium text-white">{appointment.clientName}</p>
              {appointment.clientId && (
                <p className="text-xs text-gray-500 mt-1">ID: {appointment.clientId}</p>
              )}
            </div>
          </div>

          {/* Contato do Cliente - Mock (não está no tipo atual) */}
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">Contato</p>
              <p className="text-base font-medium text-white">(11) 98765-4321</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700" />

          {/* Serviço */}
          <div className="flex items-start gap-3">
            <Scissors className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">Serviço</p>
              <p className="text-base font-medium text-white">{appointment.service}</p>
            </div>
          </div>

          {/* Profissional */}
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">Profissional Responsável</p>
              <p className="text-base font-medium text-white">{appointment.professional}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700" />

          {/* Preço */}
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-400">Valor</p>
              <p className="text-xl font-bold text-gold">{formatCurrency(appointment.price)}</p>
              {appointment.paymentMethod && (
                <p className="text-xs text-gray-500 mt-1">
                  Pagamento: {appointment.paymentMethod.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gold/20 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Fechar
          </Button>
          <Button
            className="flex-1 bg-gold hover:bg-gold/90 text-black font-semibold"
            onClick={() => {
              // Aqui pode adicionar ação de editar
              console.log('Editar agendamento:', appointment.id)
            }}
          >
            Editar
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
