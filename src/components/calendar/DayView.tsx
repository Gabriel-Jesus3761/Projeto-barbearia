import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, User, Scissors, DollarSign, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Appointment } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { theme } from '@/styles/theme'
import { AppointmentDetailModal } from './AppointmentDetailModal'

interface DayViewProps {
  appointments: Appointment[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

export function DayView({ appointments, currentDate, onDateChange, onAppointmentClick }: DayViewProps) {
  const [showAllHours, setShowAllHours] = useState(true)
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const allHours = Array.from({ length: 14 }, (_, i) => i + 7) // 7h às 20h

  const handleAppointmentClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation() // Impede que o clique propague para o container pai

    // Se já está expandido, abre o modal
    if (expandedAppointments.has(appointment.id)) {
      setSelectedAppointment(appointment)
    } else {
      // Se não está expandido, expande
      setExpandedAppointments(prev => {
        const newSet = new Set(prev)
        newSet.add(appointment.id)
        return newSet
      })
    }
  }

  const previousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    return aptDate.getDate() === currentDate.getDate() &&
           aptDate.getMonth() === currentDate.getMonth() &&
           aptDate.getFullYear() === currentDate.getFullYear()
  }).sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
  })

  const getAppointmentsForHour = (hour: number) => {
    return dayAppointments.filter(apt => {
      const [aptHour] = apt.time.split(':').map(Number)
      return aptHour === hour
    })
  }

  // Filtrar apenas horários com agendamentos ou próximos a eles
  const getRelevantHours = () => {
    // Se showAllHours está ativo, retornar todos os horários
    if (showAllHours) {
      return allHours
    }

    if (dayAppointments.length === 0) {
      // Se não há agendamentos, mostrar apenas horário comercial resumido
      return [7, 9, 11, 13, 15, 17, 19, 20]
    }

    const hoursWithAppointments = new Set<number>()
    dayAppointments.forEach(apt => {
      const [hour] = apt.time.split(':').map(Number)
      hoursWithAppointments.add(hour)
    })

    // Adicionar horários adjacentes para contexto
    const relevantHours = new Set<number>()
    hoursWithAppointments.forEach(hour => {
      relevantHours.add(hour)
      // Adicionar hora anterior e posterior para contexto
      if (hour > 7) relevantHours.add(hour - 1)
      if (hour < 20) relevantHours.add(hour + 1)
    })

    // Garantir que temos início e fim do expediente
    relevantHours.add(7)
    relevantHours.add(20)

    return Array.from(relevantHours).sort((a, b) => a - b)
  }

  const hours = getRelevantHours()

  const getStatusColor = (status: string) => {
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

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isCurrentHour = (hour: number) => {
    const now = new Date()
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear()
    return isToday && now.getHours() === hour
  }

  const isPastHour = (hour: number) => {
    const now = new Date()
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear()
    if (!isToday) {
      // Se não é hoje, verificar se a data é anterior
      const compareDate = new Date(currentDate)
      compareDate.setHours(hour, 0, 0, 0)
      return compareDate < now
    }
    return isToday && now.getHours() > hour
  }

  const isCurrentOrFuture = (appointment: Appointment) => {
    const now = new Date()
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear()

    if (!isToday) {
      // Se não é hoje, verificar se a data é futura
      const aptDate = new Date(appointment.date)
      return aptDate >= now
    }

    // Se é hoje, verificar se o horário é atual ou futuro
    const [aptHour, aptMinute] = appointment.time.split(':').map(Number)
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return aptHour > currentHour || (aptHour === currentHour && aptMinute >= currentMinute)
  }

  return (
    <div
      className="space-y-4"
      onClick={() => {
        // Recolher todos os agendamentos expandidos ao clicar fora
        setExpandedAppointments(new Set())
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gold capitalize">
              {formatDayName(currentDate)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''} hoje
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Hoje
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousDay}
                className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-gold"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextDay}
                className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-gold"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Toggle para mostrar todos os horários */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button
            variant={showAllHours ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAllHours(!showAllHours)}
            className="text-xs w-full sm:w-auto"
          >
            {showAllHours ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                Apenas com Agendamentos
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Todos os Horários
              </>
            )}
          </Button>
          {!showAllHours && dayAppointments.length > 0 && (
            <span className="text-xs text-gray-500 text-center sm:text-left">
              Mostrando {hours.length} de {allHours.length} horários
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card className={`${theme.colors.card.base} border-gold/20`}>
        <CardContent className="p-2 sm:p-3">
          <div className="space-y-1 sm:space-y-1.5">
            {hours.map((hour, index) => {
              const hourAppointments = getAppointmentsForHour(hour)
              const isCurrent = isCurrentHour(hour)
              const isPast = isPastHour(hour)
              const hasAppointments = hourAppointments.length > 0

              return (
                <motion.div
                  key={hour}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    flex gap-2 sm:gap-3 rounded-lg border transition-all
                    ${isPast && hasAppointments ? 'p-1 sm:p-1.5' : hasAppointments ? 'p-2 sm:p-2.5' : 'p-1 sm:p-1.5'}
                    ${isCurrent
                      ? 'bg-gold/10 border-gold shadow-lg shadow-gold/20'
                      : isPast
                        ? 'bg-gray-900/10 border-gray-800/30 opacity-50'
                        : hasAppointments
                          ? 'bg-gray-900/30 border-gray-700 hover:border-gold/50'
                          : 'bg-gray-900/10 border-gray-800/50'
                    }
                  `}
                >
                  {/* Hora */}
                  <div className="w-12 sm:w-16 flex-shrink-0">
                    <div className={`text-[10px] sm:text-xs font-semibold ${isCurrent ? 'text-gold' : isPast ? 'text-gray-600' : hasAppointments ? 'text-gray-400' : 'text-gray-600'}`}>
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  </div>

                  {/* Linha divisória - apenas se tiver agendamentos */}
                  {hasAppointments && !isPast && (
                    <div className={`w-px ${isCurrent ? 'bg-gold' : 'bg-gray-700'}`} />
                  )}

                  {/* Agendamentos */}
                  <div className="flex-1">
                    {hourAppointments.length > 0 ? (
                      <div className="space-y-0.5">
                        {hourAppointments.map((appointment) => {
                          const isFutureAppointment = isCurrentOrFuture(appointment)
                          const isExpanded = expandedAppointments.has(appointment.id)
                          // Todos começam recolhidos, só expandem ao clicar
                          const shouldShowExpanded = isExpanded

                          return (
                            <div
                              key={appointment.id}
                              onClick={(e) => handleAppointmentClick(appointment, e)}
                              className={`
                                rounded-lg border-l-3 cursor-pointer
                                transition-all duration-200
                                ${shouldShowExpanded
                                  ? `p-2.5 ${getStatusColor(appointment.status)} hover:shadow-lg`
                                  : `p-1 ${getStatusColor(appointment.status)} ${isFutureAppointment ? 'opacity-90' : 'opacity-60'} hover:opacity-100`
                                }
                              `}
                            >
                              {shouldShowExpanded ? (
                                // Versão expandida (quando clicado)
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="font-bold text-sm">{appointment.time}</span>
                                      <span className="text-xs opacity-70">{appointment.duration}min</span>
                                    </div>
                                  </div>

                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <Scissors className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                    <span className="text-sm font-medium text-white truncate">
                                      {appointment.service}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                // Versão compacta (padrão para todos os agendamentos)
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-xs font-medium">{appointment.time}</span>
                                  <span className="text-xs">•</span>
                                  <span className="text-xs truncate">{appointment.service}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  )
}
