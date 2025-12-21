import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, User, Scissors, Calendar, DollarSign, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Appointment } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { theme } from '@/styles/theme'

interface KanbanViewProps {
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
}

interface Column {
  id: string
  title: string
  status: string
  color: string
  bgColor: string
  borderColor: string
}

const columns: Column[] = [
  {
    id: 'pending',
    title: 'Pendentes',
    status: 'pending',
    color: 'text-yellow-200',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
  {
    id: 'confirmed',
    title: 'Confirmados',
    status: 'confirmed',
    color: 'text-blue-200',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'completed',
    title: 'Concluídos',
    status: 'completed',
    color: 'text-green-200',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  {
    id: 'cancelled',
    title: 'Cancelados',
    status: 'cancelled',
    color: 'text-red-200',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  }
]

export function KanbanView({ appointments, onAppointmentClick }: KanbanViewProps) {
  const getAppointmentsByStatus = (status: string) => {
    return appointments.filter(apt => apt.status === status)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500/20 border-blue-500 text-blue-200'
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-200'
      case 'completed':
        return 'bg-green-500/20 border-green-500 text-green-200'
      case 'cancelled':
        return 'bg-red-500/20 border-red-500 text-red-200'
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-200'
    }
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max lg:grid lg:grid-cols-4 lg:min-w-0">
        {columns.map((column, columnIndex) => {
          const columnAppointments = getAppointmentsByStatus(column.status)

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.1 }}
              className="flex-shrink-0 w-80 lg:w-auto"
            >
              <Card className={`${theme.colors.card.base} border-t-4 ${column.borderColor} h-full`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-lg ${column.color}`}>
                      {column.title}
                    </h3>
                    <Badge variant="outline" className={`${column.bgColor} ${column.color} border-0`}>
                      {columnAppointments.length}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {columnAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum agendamento
                    </div>
                  ) : (
                    columnAppointments.map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => onAppointmentClick?.(appointment)}
                      >
                        <Card className={`${theme.colors.card.base} border-l-4 ${column.borderColor} hover:shadow-lg transition-all duration-200`}>
                          <CardContent className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-bold text-white text-base">
                                {appointment.clientName}
                              </h4>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1">
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              </Button>
                            </div>

                            {/* Service */}
                            <div className="flex items-center gap-2 mb-2">
                              <Scissors className="w-4 h-4 text-gold flex-shrink-0" />
                              <span className="text-sm text-gray-300 truncate">
                                {appointment.service}
                              </span>
                            </div>

                            {/* Professional */}
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gold flex-shrink-0" />
                              <span className="text-sm text-gray-300 truncate">
                                {appointment.professional}
                              </span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                              <span className="text-xs text-gray-400">
                                {formatDate(appointment.date)}
                              </span>
                              <Clock className="w-4 h-4 text-gold flex-shrink-0 ml-auto" />
                              <span className="text-xs text-gray-400">
                                {appointment.time}
                              </span>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                              <span className="text-xs text-gray-500">
                                {appointment.duration} min
                              </span>
                              <span className="text-lg font-bold text-gold">
                                {formatCurrency(appointment.price)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
