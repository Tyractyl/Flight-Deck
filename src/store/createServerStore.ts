import { create } from 'zustand'

/*
 * Global open/close state for the create-server dialog. Any page can open
 * it; the dialog itself is rendered by ServersPage.
 */
interface CreateServerDialogStore {
  open: boolean
  openDialog: () => void
  closeDialog: () => void
}

export const useCreateServerDialog = create<CreateServerDialogStore>((set) => ({
  open: false,
  openDialog: () => set({ open: true }),
  closeDialog: () => set({ open: false }),
}))
