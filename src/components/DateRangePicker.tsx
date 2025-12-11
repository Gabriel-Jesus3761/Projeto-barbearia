import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { theme } from '@/styles/theme'

export type DateRange = { from?: Date; to?: Date }

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  className?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const formatDateRange = () => {
    if (!dateRange.from) return "Selecione o período"
    if (!dateRange.to) return formatDate(dateRange.from)
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <div className={`p-0 ${theme.colors.card.base} rounded-lg border ${theme.colors.border.light}`}>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range as { from?: Date; to?: Date })
              if (range && (range as { from?: Date; to?: Date }).to) {
                setOpen(false)
              }
            }}
            numberOfMonths={1}
            className={theme.colors.text.primary}
          />
        </div>
      }
    >
      <Button
        variant="outline"
        className={cn(
          `justify-start text-left font-normal ${theme.components.input.base} hover:bg-white/10`,
          !dateRange.from && theme.colors.text.tertiary,
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>
    </Popover>
  )
}
