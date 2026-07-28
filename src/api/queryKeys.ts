export const queryKeys = {
  servers: {
    all: ['servers'] as const,
    detail: (id: string) => ['servers', id] as const,
    backups: (id: string) => ['servers', id, 'backups'] as const,
    users: (id: string) => ['servers', id, 'users'] as const,
    files: (id: string, path: string) => ['servers', id, 'files', path] as const,
    audit: (id: string) => ['servers', id, 'audit'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  sessions: {
    all: ['sessions'] as const,
  },
  audit: {
    all: ['audit'] as const,
  },
  coins: {
    balance: ['coins', 'balance'] as const,
    transactions: ['coins', 'transactions'] as const,
  },
  nodes: {
    all: ['nodes'] as const,
    detail: (id: string) => ['nodes', id] as const,
  },
  eggs: {
    all: ['eggs'] as const,
  },
  store: {
    items: ['store', 'items'] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
    servers: ['admin', 'servers'] as const,
    nodes: ['admin', 'nodes'] as const,
    eggs: ['admin', 'eggs'] as const,
    store: ['admin', 'store'] as const,
    transactions: ['admin', 'transactions'] as const,
  },
} as const
