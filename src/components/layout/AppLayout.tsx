import { Outlet } from 'react-router-dom'
import { MobileHeader } from './MobileHeader'
import { DesktopHeader } from './DesktopHeader'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Desktop Header */}
      <DesktopHeader />

      {/* Page Content */}
      <div className="pt-24">
        <Outlet />
      </div>
    </div>
  )
}
