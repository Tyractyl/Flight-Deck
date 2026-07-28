import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createServer } from '../../api/servers'
import { listEggs } from '../../api/eggs'
import { listNodes } from '../../api/nodes'
import { queryKeys } from '../../api/queryKeys'
import { sileo } from 'sileo'
import { Skeleton } from 'parthenon-ui/components'

import { PlaceholderPattern } from '../../components/ui/PlaceholderPattern'
import { Input } from '../../components/ui/Input'

const STEPS = ['Name & Node', 'Template', 'Resources', 'Review']

export default function CreateServerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [eggId, setEggId] = useState('')
  const [nodeId, setNodeId] = useState('')
  const [memoryMB, setMemoryMB] = useState(1024)
  const [diskMB, setDiskMB] = useState(5120)
  const [cpuPercent, setCpuPercent] = useState(100)
  const [leaving, setLeaving] = useState(false)

  const { data: eggs, isLoading: eggsLoading } = useQuery({
    queryKey: queryKeys.eggs.all,
    queryFn: listEggs,
  })

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: queryKeys.nodes.all,
    queryFn: listNodes,
  })

  const isLoading = eggsLoading || nodesLoading

  const createMutation = useMutation({
    mutationFn: () =>
      createServer({
        name,
        egg_id: eggId,
        node_id: nodeId,
        memory_mb: memoryMB,
        disk_mb: diskMB,
        cpu_percent: cpuPercent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.servers.all })
      sileo.success({ description: 'Server created successfully', icon: false })
      close()
    },
    onError: () => {
      sileo.error({ description: 'Failed to create server', icon: false })
    },
  })

  const close = () => {
    setLeaving(true)
    setTimeout(() => navigate('/servers'), 200)
  }

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [])

  const canNext = () => {
    switch (step) {
      case 0: return name.trim() !== '' && nodeId !== ''
      case 1: return eggId !== ''
      case 2: return memoryMB >= 128 && diskMB >= 1024 && cpuPercent >= 10
      default: return true
    }
  }

  const selectedEgg = (Array.isArray(eggs) ? eggs : []).find(e => e.id === eggId)
  const selectedNode = (Array.isArray(nodes) ? nodes : []).find(n => n.id === nodeId)

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        leaving ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Backdrop — blurred + grid pattern */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer [&_path]:stroke-current [&_path]:fill-none"
        onClick={close}
      >
        <PlaceholderPattern className="absolute inset-0 w-full h-full text-white/[0.04]" patternSize={8} />
      </div>

      {/* Modal card */}
      <div className="relative w-full max-w-[540px] max-h-[90vh] bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 flex flex-col" style={{ animation: 'dropdownIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>

        {/* Header */}
        <div className="relative shrink-0 px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h1 className="text-[var(--fg)] font-sans text-lg font-semibold">
              Create a Server
            </h1>
            <button
              onClick={close}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (i < step) setStep(i)
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium transition-all duration-200 ${
                    i === step
                      ? 'bg-white/[0.1] text-[var(--fg)]'
                      : i < step
                        ? 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.05]'
                        : 'text-[var(--fg-faint)] cursor-default'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < step
                      ? 'bg-green-500/20 text-green-400'
                      : i === step
                        ? 'bg-white/[0.15] text-[var(--fg)]'
                        : 'bg-white/[0.05] text-[var(--fg-faint)]'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  {label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px ${i < step ? 'bg-green-500/40' : 'bg-white/[0.08]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-5" style={{ animation: 'fade-in 0.2s ease-out forwards' }}>
              {step === 0 && (
                <>
                  <div>
                    <label className="block text-[var(--fg)] text-sm font-sans font-medium mb-1.5">Server Name</label>
                    <p className="text-[var(--fg-muted)] text-xs font-sans mb-2">Choose a name for your server. You can change this later.</p>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Awesome Server"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--fg)] text-sm font-sans font-medium mb-1.5">Location (Node)</label>
                    <p className="text-[var(--fg-muted)] text-xs font-sans mb-2">Pick where your server will run. Choose a node close to your players.</p>
                    <select
                      value={nodeId}
                      onChange={(e) => setNodeId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm font-sans text-[var(--fg)] transition-all focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.06] focus:ring-1 focus:ring-white/[0.06] appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '2rem',
                      }}
                    >
                      <option value="" disabled>Select a node...</option>
                      {(Array.isArray(nodes) ? nodes : []).map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name} ({node.fqdn}){node.is_online ? '' : ' — Offline'}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {step === 1 && (
                <div>
                  <label className="block text-[var(--fg)] text-sm font-sans font-medium mb-1.5">Game Template</label>
                  <p className="text-[var(--fg-muted)] text-xs font-sans mb-3">Choose the game or software your server will run.</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(Array.isArray(eggs) ? eggs : []).map((egg) => (
                      <button
                        key={egg.id}
                        type="button"
                        onClick={() => setEggId(egg.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-200 ${
                          eggId === egg.id
                            ? 'bg-white/[0.08] border-white/[0.15] ring-1 ring-white/[0.06]'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                        }`}
                      >
                        <p className="text-[var(--fg)] text-sm font-sans font-medium">{egg.name}</p>
                        <p className="text-[var(--fg-faint)] text-[11px] font-sans mt-0.5 truncate">{egg.docker_image}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[var(--fg)] text-sm font-sans font-medium mb-1.5">Memory</label>
                    <p className="text-[var(--fg-muted)] text-xs font-sans mb-2">RAM allocated to your server. More memory = more plugins/players.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={memoryMB}
                        onChange={(e) => setMemoryMB(parseInt(e.target.value))}
                        min="128"
                        max="32768"
                        step="128"
                        className="flex-1 h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <span className="text-[var(--fg)] text-sm font-sans font-medium min-w-[5rem] text-right">
                        {(memoryMB / 1024).toFixed(1)} GB
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[var(--fg)] text-sm font-sans font-medium mb-1.5">Disk</label>
                    <p className="text-[var(--fg-muted)] text-xs font-sans mb-2">Storage space for your server files, worlds, and plugins.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={diskMB}
                        onChange={(e) => setDiskMB(parseInt(e.target.value))}
                        min="1024"
                        max="102400"
                        step="1024"
                        className="flex-1 h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <span className="text-[var(--fg)] text-sm font-sans font-medium min-w-[5rem] text-right">
                        {(diskMB / 1024).toFixed(1)} GB
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[var(--fg)] text-sm font-sans font-medium mb-1.5">CPU Limit</label>
                    <p className="text-[var(--fg-muted)] text-xs font-sans mb-2">Maximum CPU usage. 100% = one full CPU core.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={cpuPercent}
                        onChange={(e) => setCpuPercent(parseInt(e.target.value))}
                        min="10"
                        max="400"
                        step="10"
                        className="flex-1 h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <span className="text-[var(--fg)] text-sm font-sans font-medium min-w-[5rem] text-right">
                        {cpuPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-[var(--fg-muted)] text-xs font-sans">Review your server configuration before creating.</p>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.05]">
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-[var(--fg-muted)] text-sm font-sans">Name</span>
                      <span className="text-[var(--fg)] text-sm font-sans font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-[var(--fg-muted)] text-sm font-sans">Node</span>
                      <span className="text-[var(--fg)] text-sm font-sans font-medium">{selectedNode?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-[var(--fg-muted)] text-sm font-sans">Template</span>
                      <span className="text-[var(--fg)] text-sm font-sans font-medium">{selectedEgg?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-[var(--fg-muted)] text-sm font-sans">Memory</span>
                      <span className="text-[var(--fg)] text-sm font-sans font-medium">{(memoryMB / 1024).toFixed(1)} GB</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-[var(--fg-muted)] text-sm font-sans">Disk</span>
                      <span className="text-[var(--fg)] text-sm font-sans font-medium">{(diskMB / 1024).toFixed(1)} GB</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-[var(--fg-muted)] text-sm font-sans">CPU</span>
                      <span className="text-[var(--fg)] text-sm font-sans font-medium">{cpuPercent}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative shrink-0 px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-[var(--fg-muted)] text-sm font-sans font-medium hover:text-[var(--fg)] hover:bg-white/[0.04] transition-all"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="px-5 py-2 rounded-xl bg-white/[0.08] text-[var(--fg)] text-sm font-sans font-medium hover:bg-white/[0.12] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-600/40 to-green-700/40 text-[var(--fg)] text-sm font-sans font-medium border border-green-500/20 hover:from-green-600/50 hover:to-green-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Server'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
