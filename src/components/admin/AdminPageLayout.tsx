import type { ReactNode } from 'react'
import { FrameLayout } from '../layout/FrameLayout'
import { PageTransition } from '../layout/PageTransition'
import { AdminSidebar } from './AdminSidebar'

type AdminPageLayoutProps = {
  children: ReactNode
}

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  return (
    <FrameLayout>
      <div className="flex flex-1 min-h-0">
        <AdminSidebar />
        <div className="flex-1 min-w-0 overflow-auto overscroll-none p-4 sm:p-6" style={{ overscrollBehavior: 'none' }}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </FrameLayout>
  )
}
