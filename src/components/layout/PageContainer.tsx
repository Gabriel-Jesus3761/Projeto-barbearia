import { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { pageClasses } from '@/styles/theme'

interface PageContainerProps {
  title: string
  subtitle: string
  onMobileMenuClick: () => void
  children: ReactNode
}

/**
 * Container padrão para páginas do dashboard com fundo escuro
 */
export function PageContainer({ title, subtitle, onMobileMenuClick, children }: PageContainerProps) {
  return (
    <div className={pageClasses.container()}>
      <Header
        title={title}
        subtitle={subtitle}
        onMobileMenuClick={onMobileMenuClick}
      />
      <div className={pageClasses.content()}>
        {children}
      </div>
    </div>
  )
}
