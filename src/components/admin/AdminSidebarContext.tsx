import { createContext, useContext, useState, type ReactNode } from 'react'

interface AdminSidebarContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(null)

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <AdminSidebarContext.Provider value={{ open, setOpen, toggle: () => setOpen((o) => !o) }}>
      {children}
    </AdminSidebarContext.Provider>
  )
}

export function useAdminSidebar() {
  return useContext(AdminSidebarContext)
}
