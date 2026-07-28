import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { sileo } from 'sileo'
import Button from '../../components/Button'
import api from '../../api/client'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const MIN_VIRTUAL_WIDTH = 210
  const TARGET_VIRTUAL_HEIGHT = 350

  let scale = windowSize.h / TARGET_VIRTUAL_HEIGHT
  let virtualWidth = windowSize.w / scale

  if (virtualWidth < MIN_VIRTUAL_WIDTH) {
    scale = windowSize.w / MIN_VIRTUAL_WIDTH
    virtualWidth = MIN_VIRTUAL_WIDTH
  }
  const virtualHeight = windowSize.h / scale

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      sileo.error({ title: 'Invalid Link', description: 'No reset token found in the URL. Please request a new reset link.' })
      return
    }

    if (!password || password.length < 5) {
      sileo.error({ title: 'Invalid Password', description: 'Password must be at least 5 characters.' })
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/reset-password', { token, password })
      sileo.success({
        title: 'Password Reset',
        description: 'Your password has been reset successfully. You can now log in.',
      })
      setDone(true)
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to reset password. The link may have expired.'
      sileo.error({ title: 'Reset Failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <style>{`
        @keyframes blurReveal {
          0% { opacity: 0; filter: blur(8px); }
          100% { opacity: 1; filter: blur(0); }
        }
        .auth-input-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 5px;
          box-shadow: 0 0 0 1px #000, 0 0 0 1px rgba(0, 51, 255, 0.6);
          opacity: 0;
          transition: all 0.2s ease-in-out;
          pointer-events: none;
          z-index: 10;
        }
        .auth-input-wrapper:focus-within::after {
          box-shadow: 0 0 0 1px #000, 0 0 0 3px rgba(0, 51, 255, 0.6);
          opacity: 1;
        }
      `}</style>

      <div style={{
        width: virtualWidth,
        height: virtualHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
      }}>
        <div style={{ width: 178, textAlign: 'center', animation: 'blurReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div style={{ color: '#fff', fontSize: 16, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 4, whiteSpace: 'nowrap' }}>
            {done ? 'Password Reset' : token ? 'Set New Password' : 'Invalid Link'}
          </div>
          <div style={{ color: '#4B4B4B', fontSize: 10, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 25, whiteSpace: 'nowrap' }}>
            {done
              ? 'Your password has been updated.'
              : token
              ? 'Enter your new password below.'
              : 'This reset link is missing or invalid.'}
          </div>

          {!token && !done ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ color: '#C0C0C0', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, lineHeight: 1.4 }}>
                The password reset link appears to be invalid or incomplete. Please request a new reset link from the login page.
              </div>
              <Button variant="secondary" width={178} height={22} onClick={() => navigate('/auth?mode=forgot-password')}>
                <span style={{ color: '#fff', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Request New Link</span>
              </Button>
            </div>
          ) : done ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ color: '#C0C0C0', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, lineHeight: 1.4 }}>
                You can now sign in with your new password.
              </div>
              <Button variant="secondary" width={178} height={22} onClick={() => navigate('/auth')}>
                <span style={{ color: '#fff', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Go to Sign In</span>
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15, position: 'relative' }}>
              {/* Password Input */}
              <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                <div style={{ position: 'absolute', top: -2, left: 15, width: 66, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>New Password</div>
                <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                <svg style={{ position: 'absolute', top: -1, left: 80, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
              </div>
              {/* Divider Or */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#212121', borderRadius: 5 }} />
                <div style={{ color: '#636363', fontSize: 7, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)' }}>Or</div>
                <div style={{ flex: 1, height: 1, background: '#212121', borderRadius: 5 }} />
              </div>
              {/* Back to Sign In */}
              <Button variant="secondary" width={178} height={22} onClick={() => navigate('/auth')} style={{ marginTop: 2 }}>
                <span style={{ color: '#fff', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Back to Sign In</span>
              </Button>
              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', width: 178, marginTop: 30 }}>
                <Button type="submit" loading={loading} width={167} height={22}>Reset Password</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
