import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { login as apiLogin, register as apiRegister } from '../../api/auth'
import api from '../../api/client'
import { sileo } from 'sileo'
import Button from '../../components/Button'
import InputError from '../../components/InputError'
import Loader from '../../components/Loader'

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' 
    ? 'signup' 
    : searchParams.get('mode') === 'forgot-password' 
      ? 'forgot-password' 
      : 'login'

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode)
  
  useEffect(() => {
    setEmailError('')
    setPasswordError('')
    setUsernameError('')
  }, [mode])

  // URL sync
  useEffect(() => {
    if (mode === 'login') navigate('/auth', { replace: true })
    else navigate(`/auth?mode=${mode}`, { replace: true })
  }, [mode, navigate])

  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    if (!emailError && !passwordError && !usernameError) return
    const timer = setTimeout(() => {
      setEmailError('')
      setPasswordError('')
      setUsernameError('')
    }, 5000)
    return () => clearTimeout(timer)
  }, [emailError, passwordError, usernameError])

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isDesktop = windowSize.w >= 768
  const MIN_VIRTUAL_WIDTH = isDesktop ? 500 : 210
  const TARGET_VIRTUAL_HEIGHT = 350
  
  let scale = windowSize.h / TARGET_VIRTUAL_HEIGHT
  let virtualWidth = windowSize.w / scale

  if (virtualWidth < MIN_VIRTUAL_WIDTH) {
    scale = windowSize.w / MIN_VIRTUAL_WIDTH
    virtualWidth = MIN_VIRTUAL_WIDTH
  }
  const virtualHeight = windowSize.h / scale

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setPasswordError('')
    setUsernameError('')
    
    let hasError = false
    
    if (mode === 'signup') {
      if (!username.trim()) { setUsernameError('Username required'); hasError = true }
      else if (username.trim().length < 3) { setUsernameError('Minimum 3 characters'); hasError = true }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) { setEmailError('Email required'); hasError = true }
    else if (!emailRegex.test(email)) { setEmailError('Must be a valid email (e.g. user@domain.com)'); hasError = true }
    
    if (!password) { setPasswordError('Password required'); hasError = true }
    else if (password.length < 5) { setPasswordError('Minimum 5 characters'); hasError = true }
    
    if (hasError) return

    setLoading(true)
    
    try {
      const res = mode === 'login'
        ? await apiLogin(email, password)
        : await apiRegister(email, username, password)
      setAuth(res.user, res.access_token)
      sileo.success({ title: 'Welcome to Tyractyl™', description: mode === 'login' ? 'Signed in successfully' : 'Your account has been created' })
      navigate('/')
    } catch (err: any) {
      const message = err?.response?.data?.error || (mode === 'login' ? 'Invalid email or password' : 'Registration failed')
      sileo.error({ title: mode === 'login' ? 'Sign In Failed' : 'Registration Failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setEmailError('')
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) { setEmailError('Email required'); return }
    else if (!emailRegex.test(email)) { setEmailError('Must be a valid email (e.g. user@domain.com)'); return }
    
    setLoading(true)
    const forgotRequest = api.post('/auth/forgot-password', { email })
    
    sileo.promise(forgotRequest, {
      loading: { title: 'Sending reset link...', description: 'Please wait a moment' },
      success: { title: 'Link Sent', description: 'Check your email for the reset link' },
      error: (err: any) => ({ title: 'Failed', description: err?.response?.data?.error || 'Failed to send reset link' })
    }).then(() => {
      setForgotSent(true)
    }).catch(() => {
      // Error handled by Sileo toast
    }).finally(() => {
      setLoading(false)
    })
  }

  const slideIndex = mode === 'forgot-password' ? 0 : mode === 'login' ? 1 : 2

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <style>{`
        @keyframes blurReveal {
          0% { opacity: 0; filter: blur(8px); }
          100% { opacity: 1; filter: blur(0); }
        }
        .loader-fade-in {
          animation: loaderBlurIn 0.2s ease-out forwards;
        }
        @keyframes loaderBlurIn {
          0% { opacity: 0; filter: blur(4px); transform: scale(0.7); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
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
        flexDirection: 'row',
        padding: 5,
        gap: 20,
      }}>

        {/* Left Side: Hero Image & Logo */}
        <div className="hidden md:block" style={{ position: 'relative', flex: 1, height: '100%', animation: 'blurReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <img style={{ width: '100%', height: '100%', borderRadius: 11, objectFit: 'cover' }} src="/Footerherobg1.png" alt="" />
          <div style={{ position: 'absolute', top: -5, left: -5, width: 67, height: 48, background: '#000', borderBottomRightRadius: 21 }} />
          <img style={{ position: 'absolute', top: -6, left: 4, width: 50, height: 50, objectFit: 'cover' }} src="/2353329381.png" alt="" />
          <svg style={{ position: 'absolute', top: -1, left: 61 }} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M0 0 H16 V1 A15 15 0 0 0 1 16 H0 Z" fill="black"/></svg>
          <svg style={{ position: 'absolute', top: 42, left: -1 }} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M0 0 H16 V1 A15 15 0 0 0 1 16 H0 Z" fill="black"/></svg>
        </div>

        {/* Mobile Logo Only */}
        <div className="md:hidden" style={{ position: 'absolute', top: 5, left: 5, animation: 'fadeIn 0.8s ease-in-out forwards' }}>
          <img style={{ width: 50, height: 50, objectFit: 'cover' }} src="/2353329381.png" alt="" />
        </div>

        {/* Right Side: Sliding Form Carousel */}
        <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', animation: 'blurReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}>
          <div style={{ 
            display: 'flex', 
            width: '300%', 
            height: '100%',
            transform: `translateX(-${slideIndex * (100/3)}%)`,
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>

            {/* --- FORGOT PASSWORD PANEL (Index 0) --- */}
            <div style={{ width: '33.333%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: 178 }}>
                <div style={{ color: '#fff', fontSize: 16, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 4, whiteSpace: 'nowrap' }}>Reset your password</div>
                <div style={{ color: '#4B4B4B', fontSize: 10, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 25, whiteSpace: 'nowrap' }}>We'll send you a link to reset it</div>
                
                {!forgotSent ? (
                  <form noValidate onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15, position: 'relative' }}>
                    {/* Email Input */}
                    <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                      <div style={{ position: 'absolute', top: -2, left: 15, width: 22, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                      <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>Email</div>
                      <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                      <svg style={{ position: 'absolute', top: -1, left: 36, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                      <input tabIndex={mode === 'forgot-password' ? 0 : -1} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
                      <InputError message={emailError} />
                    </div>
                    {/* Divider Or */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: '#212121', borderRadius: 5 }} />
                      <div style={{ color: '#636363', fontSize: 7, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)' }}>Or</div>
                      <div style={{ flex: 1, height: 1, background: '#212121', borderRadius: 5 }} />
                    </div>
                    {/* Back to Sign In */}
                    <Button tabIndex={mode === 'forgot-password' ? 0 : -1} variant="secondary" width={178} height={22} onClick={() => setMode('login')} style={{ marginTop: 2 }}>
                      <span style={{ color: '#fff', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Back to Sign In</span>
                    </Button>
                    {/* Submit Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: 178, marginTop: 30 }}>
                      <Button tabIndex={mode === 'forgot-password' ? 0 : -1} type="submit" loading={loading} width={167} height={22}>Send Link</Button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 15, position: 'relative' }}>
                    <div style={{ color: '#C0C0C0', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, lineHeight: 1.4 }}>
                      Check your inbox for a password reset link. If you don't see it, check your spam folder.
                    </div>
                    <Button tabIndex={mode === 'forgot-password' ? 0 : -1} variant="secondary" width={178} height={22} onClick={() => setMode('login')} style={{ marginTop: 10 }}>
                      <span style={{ color: '#fff', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Back to Sign In</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* --- LOGIN PANEL (Index 1) --- */}
            <div style={{ width: '33.333%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: 178, textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: 16, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 4 }}>Welcome to Tyractyl™</div>
                <div style={{ color: '#4B4B4B', fontSize: 10, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 25 }}>Hosting that doesn't feel ancient</div>
                <form noValidate onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15, position: 'relative' }}>
                  {/* Discord Button */}
                  <Button 
                    variant="discord" 
                    width={178} 
                    height={22} 
                    loading={discordLoading}
                    tabIndex={mode === 'login' ? 0 : -1}
                    onClick={() => { setDiscordLoading(true); setTimeout(() => { window.location.href = '/api/auth/discord' }, 100) }}
                  >
                    {discordLoading ? (
                      <Loader size={32} color="#ccc" />
                    ) : (
                      <>
                        <div style={{ position: 'absolute', top: 5, left: 7, width: 12, height: 12 }}>
                          <img style={{ width: 12, height: 12, objectFit: 'fill' }} src="/discord-bg.png" alt="" />
                          <svg style={{ position: 'absolute', top: 1, left: 0, width: 12, height: 10 }} viewBox="0 0 12 10" fill="none">
                            <path d="M10.1651 0.777966C9.38836 0.414529 8.55779 0.150398 7.68945 0C7.58281 0.192805 7.45822 0.452133 7.37232 0.658427C6.44925 0.519609 5.53467 0.519609 4.62858 0.658427C4.5427 0.452133 4.41528 0.192805 4.30768 0C3.4384 0.150398 2.60688 0.4155 1.8301 0.77989C0.263321 3.14749 -0.161406 5.45629 0.0509583 7.7323C1.09013 8.50832 2.0972 8.97974 3.08729 9.28821C3.33174 8.95177 3.54977 8.59412 3.73759 8.2172C3.37988 8.08128 3.03726 7.91354 2.71354 7.71881C2.79942 7.65518 2.88343 7.58866 2.96459 7.52022C4.9391 8.44374 7.08445 8.44374 9.03537 7.52022C9.11748 7.58866 9.20148 7.65518 9.28642 7.71881C8.96174 7.91449 8.61819 8.08223 8.26048 8.21817C8.4483 8.59412 8.66538 8.95274 8.91078 9.28917C9.90182 8.98069 10.9098 8.50929 11.949 7.7323C12.1982 5.09382 11.5233 2.80623 10.1651 0.777966ZM4.00659 6.33257C3.41386 6.33257 2.92778 5.77923 2.92778 5.10539C2.92778 4.43155 3.40348 3.87724 4.00659 3.87724C4.60971 3.87724 5.09578 4.43058 5.0854 5.10539C5.08634 5.77923 4.60971 6.33257 4.00659 6.33257ZM7.99337 6.33257C7.40064 6.33257 6.91456 5.77923 6.91456 5.10539C6.91456 4.43155 7.39025 3.87724 7.99337 3.87724C8.59648 3.87724 9.08256 4.43058 9.07218 5.10539C9.07218 5.77923 8.59648 6.33257 7.99337 6.33257Z" fill="#D1DFFF" />
                          </svg>
                        </div>
                        <div style={{ position: 'absolute', top: 6, left: 58, color: '#fff', fontSize: 8, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, pointerEvents: 'none' }}>
                          Sign in with Discord
                        </div>
                      </>
                    )}
                  </Button>
                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 178, marginTop: -2, marginBottom: -2 }}>
                    <div style={{ flex: 1, height: 1, background: '#212121', borderRadius: 5 }} />
                    <div style={{ color: '#636363', fontSize: 7, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)' }}>Or</div>
                    <div style={{ flex: 1, height: 1, background: '#212121', borderRadius: 5 }} />
                  </div>
                  {/* Email Input */}
                  <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                    <div style={{ position: 'absolute', top: -2, left: 15, width: 22, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>Email</div>
                    <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                    <svg style={{ position: 'absolute', top: -1, left: 36, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                    <input tabIndex={mode === 'login' ? 0 : -1} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
                    <InputError message={emailError} />
                  </div>
                  {/* Password Input */}
                  <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                    <div style={{ position: 'absolute', top: -2, left: 15, width: 31, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>Password</div>
                    <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                    <svg style={{ position: 'absolute', top: -1, left: 45, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                    <input tabIndex={mode === 'login' ? 0 : -1} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
                    <InputError message={passwordError} />
                  </div>
                  {/* Links */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: 178, marginTop: -5 }}>
                    <div tabIndex={mode === 'login' ? 0 : -1} onKeyDown={(e) => { if(e.key==='Enter') setMode('forgot-password'); }} onClick={() => setMode('forgot-password')} style={{ color: '#C0C0C0', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 500, cursor: 'pointer', outline: 'none' }}>Forgot your password?</div>
                    <div tabIndex={mode === 'login' ? 0 : -1} onKeyDown={(e) => { if(e.key==='Enter') setMode('signup'); }} onClick={() => setMode('signup')} style={{ cursor: 'pointer', display: 'flex', outline: 'none' }}>
                      <span style={{ color: '#A3A3A3', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Don't have an account?</span>
                      <span style={{ color: '#C0C0C0', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 500 }}> Sign up</span>
                    </div>
                  </div>
                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', width: 178, marginTop: 25 }}>
                    <Button tabIndex={mode === 'login' ? 0 : -1} type="submit" loading={loading} width={167} height={23}>Sign In</Button>
                  </div>
                </form>
              </div>
            </div>

            {/* --- SIGN UP PANEL (Index 2) --- */}
            <div style={{ width: '33.333%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: 178, textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: 16, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 4 }}>Welcome to Tyractyl™</div>
                <div style={{ color: '#4B4B4B', fontSize: 10, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400, marginBottom: 25 }}>Hosting that doesn't feel ancient</div>
                <form noValidate onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15, position: 'relative' }}>
                  {/* Username Input */}
                  <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                    <div style={{ position: 'absolute', top: -2, left: 15, width: 33, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>Username</div>
                    <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                    <svg style={{ position: 'absolute', top: -1, left: 47, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                    <input tabIndex={mode === 'signup' ? 0 : -1} type="text" value={username} onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
                    <InputError message={usernameError} />
                  </div>
                  {/* Email Input */}
                  <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                    <div style={{ position: 'absolute', top: -2, left: 15, width: 22, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>Email</div>
                    <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                    <svg style={{ position: 'absolute', top: -1, left: 36, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                    <input tabIndex={mode === 'signup' ? 0 : -1} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
                    <InputError message={emailError} />
                  </div>
                  {/* Password Input */}
                  <div className="auth-input-wrapper" style={{ position: 'relative', width: 178, height: 22, background: 'linear-gradient(180deg, #272727 0%, #232323 0.01%, #0a0a0a 100%)', borderRadius: 5 }}>
                    <div style={{ position: 'absolute', top: -2, left: 15, width: 31, height: 8, background: '#000', borderBottomRightRadius: 3, borderBottomLeftRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -1, left: 20, color: '#fff', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', pointerEvents: 'none' }}>Password</div>
                    <svg style={{ position: 'absolute', top: -1, left: 12, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 2V0H0C1.10457 0 2 0.89543 2 2Z" fill="black" /></svg>
                    <svg style={{ position: 'absolute', top: -1, left: 45, width: 4, height: 4 }} viewBox="-1 -1 4 4" fill="none"><path d="M2 0H0V2C0 0.89543 0.89543 0 2 0Z" fill="black" /></svg>
                    <input tabIndex={mode === 'signup' ? 0 : -1} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} style={{ position: 'absolute', top: 7, left: 0, width: '100%', height: 8, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 6, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', padding: '0 15px', boxSizing: 'border-box', lineHeight: '8px' }} />
                    <InputError message={passwordError} />
                  </div>
                  {/* Links */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: 178, marginTop: -5 }}>
                    <div tabIndex={mode === 'signup' ? 0 : -1} onKeyDown={(e) => { if(e.key==='Enter') setMode('login'); }} onClick={() => setMode('login')} style={{ cursor: 'pointer', display: 'flex', outline: 'none' }}>
                      <span style={{ color: '#A3A3A3', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 400 }}>Already have an account?</span>
                      <span style={{ color: '#C0C0C0', fontSize: 5, fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)', fontWeight: 500 }}> Sign in</span>
                    </div>
                  </div>
                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', width: 178, marginTop: 25 }}>
                    <Button tabIndex={mode === 'signup' ? 0 : -1} type="submit" loading={loading} width={167} height={23}>Sign Up</Button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
