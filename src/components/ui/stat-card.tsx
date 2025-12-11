import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cardClasses, iconClasses, textClasses } from '@/styles/theme'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  variant: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gold'
}

export function StatCard({ title, value, description, icon: Icon, variant }: StatCardProps) {
  return (
    <Card className={cardClasses.statCard(variant)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium mb-1 ${textClasses.secondary()}`}>
              {title}
            </p>
            <h3 className={`text-3xl font-bold mb-2 ${textClasses.primary()}`}>
              {value}
            </h3>
            {description && (
              <p className={`text-xs ${textClasses.tertiary()}`}>
                {description}
              </p>
            )}
          </div>
          <div className={iconClasses.container(variant)}>
            <Icon className={iconClasses.icon(variant)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
