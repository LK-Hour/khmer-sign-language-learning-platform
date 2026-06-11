'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Iconify from '@/components/iconify';
import { ROUTES } from '@/constants/routes';
import {
  fetchCurrentUser,
  loginAsGuest,
  loginWithEmail,
  loginWithFacebook,
  loginWithGoogle,
} from '@/features/auth/api/auth';
import type { AuthTokenResponse, AuthUser } from '@/store/auth.store';
import { useLocaleStore } from '@/store/locale.store';
import { useAuthStore } from '@/store/auth.store';
import {
  KslColors,
  KslFontSizes,
  KslLineHeights,
  KslRadii,
  KslShadows,
} from '@/theme/theme';

type LoginMode = 'learner' | 'admin';
type OAuthProvider = 'google' | 'facebook' | 'telegram';
type LoadingAction = 'admin' | 'guest' | OAuthProvider | null;

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement | null,
        options: {
          theme: 'outline' | 'filled_blue' | 'filled_black';
          size: 'large' | 'medium' | 'small';
        }
      ) => void;
      prompt: () => void;
    };
  };
};

type FacebookLoginResponse = {
  authResponse?: {
    accessToken: string;
  };
};

type FacebookSdk = {
  init: (config: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { scope: string }
  ) => void;
};

declare global {
  interface Window {
    google?: GoogleAccountsApi;
    FB?: FacebookSdk;
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '';
const telegramBotName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

const colors = {
  navy: KslColors.textPrimary,
  muted: KslColors.textSecondary,
  green: KslColors.primary,
  greenDark: KslColors.primaryDark,
  darkOverlay: 'rgba(7, 35, 72, 0.86)',
  border: KslColors.border,
  softBg: KslColors.background,
  white: KslColors.surface,
  fieldHint: KslColors.disabled,
  inactive: "#E1E5EA",
  divider: "#E2E6EC",
  dividerText: "#CDD3DD",
  hoverBorder: "#C8CED8",
  hoverSurface: "#b5e1bd65",
};

export function LoginView() {
  const [mode, setMode] = useState<LoginMode>('learner');
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledTelegramTokenRef = useRef<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const telegramContainerRef = useRef<HTMLDivElement>(null);
  const locale = useLocaleStore((state) => state.locale);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [authError, setAuthError] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);
  const [telegramReady, setTelegramReady] = useState(false);

  const localizedPath = useCallback(
    (path: string) => `/${locale}${path === ROUTES.home ? '' : path}`,
    [locale]
  );

  const completeLearnerLogin = useCallback(
    (response: AuthTokenResponse) => {
      setAuth(response);
      router.push(localizedPath(ROUTES.home));
    },
    [localizedPath, router, setAuth]
  );

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const user = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      queueMicrotask(() => {
        setAuthError(decodeURIComponent(error));
      });
      return;
    }

    if (!token || provider !== 'telegram') return;
    if (handledTelegramTokenRef.current === token) return;

    handledTelegramTokenRef.current = token;

    try {
      const parsedUser = user ? (JSON.parse(user) as AuthUser) : null;

      if (!parsedUser) {
        queueMicrotask(() => {
          setAuthError('Telegram login did not return user information.');
        });
        return;
      }

      completeLearnerLogin({
        access_token: token,
        token_type: 'bearer',
        user: parsedUser,
      });
    } catch {
      queueMicrotask(() => {
        setAuthError('Could not read the Telegram login response.');
      });
    }
  }, [completeLearnerLogin, searchParams]);

  useEffect(() => {
    const container = telegramContainerRef.current;
    if (!container || container.querySelector('script')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', telegramBotName);
    script.setAttribute('data-size', 'large');
    script.setAttribute(
      'data-auth-url',
      `${apiBaseUrl}/api/auth/login/telegram?redirect_to=${encodeURIComponent(
        `${window.location.origin}${localizedPath('/login')}`
      )}`
    );
    script.setAttribute('data-request-access', 'write');
    script.onload = () => setTelegramReady(true);
    script.onerror = () =>
      setAuthError('Telegram login could not be loaded. Please try again.');
    container.appendChild(script);

    return () => {
      script.remove();
    };
  }, [localizedPath]);

  const handleGuestLogin = async () => {
    setAuthError('');
    setLoadingAction('guest');

    try {
      const response = await loginAsGuest();
      completeLearnerLogin(response);
    } catch {
      setAuthError('Could not continue as guest. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setAuthError('');
      setLoadingAction('google');

      try {
        const authResponse = await loginWithGoogle(response.credential);
        completeLearnerLogin(authResponse);
      } catch {
        setAuthError('Google login failed. Please try again.');
      } finally {
        setLoadingAction(null);
      }
    },
    [completeLearnerLogin]
  );

  const handleGoogleLogin = () => {
    if (!googleReady) {
      setAuthError('Google login is still loading. Please try again.');
    }
  };

  const handleFacebookLogin = () => {
    setAuthError('');

    if (!window.FB || !facebookReady) {
      setAuthError('Facebook login is still loading. Please try again.');
      return;
    }

    setLoadingAction('facebook');

    window.FB.login(
      (response) => {
        if (!response.authResponse) {
          setLoadingAction(null);
          setAuthError('Facebook login was cancelled.');
          return;
        }

        loginWithFacebook(response.authResponse.accessToken)
          .then(completeLearnerLogin)
          .catch(() => {
            setAuthError('Facebook login failed. Please try again.');
          })
          .finally(() => {
            setLoadingAction(null);
          });
      },
      { scope: 'public_profile,email' }
    );
  };

  const handleTelegramFallback = () => {
    if (!telegramReady) {
      setAuthError('Telegram login is still loading. Please try again.');
    }
  };

  const handleAdminLogin = async (email: string, password: string) => {
    setAuthError('');
    setLoadingAction('admin');

    try {
      const response = await loginWithEmail(email, password);
      const profile = await fetchCurrentUser();

      if (profile.account_type !== 'admin') {
        setAuthError('This account does not have admin access.');
        return;
      }

      setAuth({
        ...response,
        user: {
          ...response.user,
          account_type: profile.account_type,
          is_guest: profile.is_guest,
        },
      });
      router.push(localizedPath(ROUTES.admin.quiz));
    } catch {
      setAuthError('Invalid credentials. Please check your login details.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Stack
      component="main"
      sx={{
        minHeight: '100dvh',
        position: 'relative',
        overflowY: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4, md: 5 },
        gap: { xs: 2.5, md: 3 },
        bgcolor: KslColors.secondaryDark,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundImage: `
          linear-gradient(${colors.darkOverlay}, ${colors.darkOverlay}),
          url("/assets/bg_login_pg.jpg")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (!window.google) return;

            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleCredential,
            });
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'outline',
              size: 'large',
            });
            setGoogleReady(true);
          } catch {
            setAuthError('Google login could not be initialized.');
          }
        }}
        onError={() => setAuthError('Google login could not be loaded.')}
      />

      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (!window.FB) return;

            window.FB.init({
              appId: facebookAppId,
              cookie: true,
              xfbml: true,
              version: 'v18.0',
            });
            setFacebookReady(true);
          } catch {
            setAuthError('Facebook login could not be initialized.');
          }
        }}
        onError={() => setAuthError('Facebook login could not be loaded.')}
      />

      <Box
        aria-hidden
        sx={{
          height: { xs: 32, sm: 36 },
          flexShrink: 0,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          width: {
            xs: '100%',
            sm: 720,
            md: 910,
          },
          maxWidth: '100%',
          minHeight: {
            xs: 'auto',
            md: 408,
          },
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },
          overflow: 'hidden',
          borderRadius: `${KslRadii.card}px`,
          bgcolor: 'background.paper',
          boxShadow: KslShadows.drop,
        }}
      >
        <WelcomePanel />

        <Stack
          sx={{
            justifyContent: 'center',
            px: {
              xs: 3,
              sm: 4,
              md: 4.5,
            },
            py: {
              xs: 2,
              sm: 3,
              md: 2,
            },
            pt: {
              xs: 1,
              sm: 2,
            },
          }}
        >
          <Stack
            spacing={2}
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: 350 },
              mx: 'auto',
            }}
          >
            <WorkspaceTabs mode={mode} onChange={setMode} />

            <Stack
              sx={{
                width: '100%',
                minHeight: { xs: 386, sm: 386, md: 360 },
                justifyContent: 'flex-start',
              }}
            >
              {mode === 'learner' ? (
                <LearnerLogin
                  isGoogleLoading={loadingAction === 'google'}
                  isFacebookLoading={loadingAction === 'facebook'}
                  isGuestLoading={loadingAction === 'guest'}
                  googleButtonRef={googleButtonRef}
                  googleReady={googleReady}
                  facebookReady={facebookReady}
                  telegramContainerRef={telegramContainerRef}
                  telegramReady={telegramReady}
                  isTelegramDisabled={authError.includes('Bot domain invalid')}
                  onGoogleLogin={handleGoogleLogin}
                  onFacebookLogin={handleFacebookLogin}
                  onGuestLogin={handleGuestLogin}
                  onTelegramFallback={handleTelegramFallback}
                />
              ) : (
                <AdminLogin
                  isLoading={loadingAction === 'admin'}
                  onLogin={handleAdminLogin}
                />
              )}

              {authError ? (
                <Typography
                  role="alert"
                  sx={{
                    mt: 1.5,
                    color: 'error.main',
                    fontSize: KslFontSizes.sm,
                    lineHeight: KslLineHeights.sm,
                    fontWeight: 600,
                  }}
                >
                  {authError}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <PoweredBy />
    </Stack>
  );
}

function WelcomePanel() {
  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: {
          xs: 3,
          sm: 4,
          md: 5,
        },
        py: {
          xs: 3,
          sm: 3,
          md: 4,
        },
        pb: {
          xs: 0,
          sm: 0,
        },
        borderRight: {
          xs: 'none',
          md: `2px dotted ${colors.border}`,
        },
      }}
    >
      <Box
        component="img"
        src="/assets/logo.png"
        alt="KSL Logo"
        sx={{
          width: { xs: 64, sm: 78 },
          height: { xs: 64, sm: 78 },
          mb: 1,
          objectFit: 'contain',
        }}
      />

      <Typography
        component="h1"
        sx={{
          color: colors.navy,
          fontSize: {
            xs: 24,
            sm: 28,
            md: 32,
          },
          fontWeight: 700,
          lineHeight: { xs: 1.15, md: 1.1 },
        }}
      >
        Welcome to KSL
      </Typography>

      <Typography
        sx={{
          mt: 1,
          color: colors.green,
          fontSize: KslFontSizes.sm,
          fontWeight: 700,
          lineHeight: KslLineHeights.sm,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Learning & Recognition Platform
      </Typography>

      <Typography
        sx={{
          mt: 2,
          maxWidth: 390,
          color: colors.navy,
          fontSize: KslFontSizes.md,
          lineHeight: KslLineHeights.md,
        }}
      >
        Learn and practice Khmer Sign Language with AI-powered recognition and
        real-time feedback, helping bridge the communication gap between Deaf
        and hearing communities.
      </Typography>
    </Stack>
  );
}

type WorkspaceTabsProps = {
  mode: LoginMode;
  onChange: (mode: LoginMode) => void;
};

function WorkspaceTabs({ mode, onChange }: WorkspaceTabsProps) {
  return (
    <Stack
      direction="row"
      sx={{
        width: '100%',
        minHeight: "52px",
        p: "1px",
        bgcolor: colors.softBg,
        borderRadius: `${KslRadii.wordCard}px`,
        gap: "1px",
        display: {xs: 'none', sm: 'flex'},
      }}
    >
      <TabButton
        active={mode === 'learner'}
        onClick={() => onChange('learner')}
      >
        Learner
      </TabButton>

      <TabButton active={mode === 'admin'} onClick={() => onChange('admin')} >
        Management
      </TabButton>
    </Stack>
  );
}

type TabButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <Button
      disableRipple
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: "36px",
        borderRadius: `${KslRadii.wordCard - 1}px`,
        bgcolor: active ? colors.green : 'transparent',
        color: active ? colors.white : colors.navy,
        fontSize: KslFontSizes.md,
        lineHeight: KslLineHeights.sm,
        fontWeight: 700,
        textTransform: 'none',
        whiteSpace: 'normal',
        textAlign: 'center',
        '&:hover': {
          bgcolor: active ? colors.green : 'rgba(15, 23, 42, 0.04)',
        },
      }}
    >
      {children}
    </Button>
  );
}

type LearnerLoginProps = {
  isGoogleLoading: boolean;
  isFacebookLoading: boolean;
  isGuestLoading: boolean;
  googleButtonRef: RefObject<HTMLDivElement | null>;
  googleReady: boolean;
  facebookReady: boolean;
  telegramContainerRef: RefObject<HTMLDivElement | null>;
  telegramReady: boolean;
  isTelegramDisabled?: boolean;
  onGoogleLogin: () => void;
  onFacebookLogin: () => void;
  onGuestLogin: () => void;
  onTelegramFallback: () => void;
};

function LearnerLogin({
  isGoogleLoading,
  isFacebookLoading,
  isGuestLoading,
  googleButtonRef,
  googleReady,
  facebookReady,
  telegramContainerRef,
  telegramReady,
  isTelegramDisabled = false,
  onGoogleLogin,
  onFacebookLogin,
  onGuestLogin,
  onTelegramFallback,
}: LearnerLoginProps) {
  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        <Typography
          component="h2"
          sx={{
            color: colors.navy,
            fontSize: KslFontSizes.lg,
            fontWeight: 600,
            lineHeight: KslLineHeights.lg,
            textAlign: { xs: 'center' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          Start Learning
        </Typography>

        <Typography
          sx={{
            color: colors.muted,
            fontSize: KslFontSizes.sm,
            lineHeight: KslLineHeights.sm,
          }}
        >
          Sign in to continue learning Khmer Sign Language with our platform
          practice and feedback.
        </Typography>
      </Stack>

      <Stack spacing={1.2} sx={{ color: KslColors.muted }}>
        <GoogleLoginButton
          ready={googleReady}
          loading={isGoogleLoading}
          googleButtonRef={googleButtonRef}
          onFallbackClick={onGoogleLogin}
        />
        <FacebookLoginButton
          ready={facebookReady}
          loading={isFacebookLoading}
          onClick={onFacebookLogin}
        />
        <TelegramLoginButton
          ready={telegramReady}
          disabled={isTelegramDisabled}
          telegramContainerRef={telegramContainerRef}
          onFallbackClick={onTelegramFallback}
        />
      </Stack>

      <Divider
        sx={{
          color: colors.dividerText,
          fontSize: KslFontSizes.sm,
          lineHeight: KslLineHeights.sm,
          '&::before, &::after': {
            borderColor: colors.divider,
          },
        }}
      >
        OR
      </Divider>

      <SocialButton
        icon="solar:user-rounded-outline"
        loading={isGuestLoading}
        onClick={onGuestLogin}
      >
        Enter as Guest
      </SocialButton>
    </Stack>
  );
}

type AdminLoginProps = {
  isLoading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
};

function AdminLogin({ isLoading, onLogin }: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const canLogin = username.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canLogin || isLoading) return;
    await onLogin(username.trim(), password);
  };

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      <Stack spacing={0.5}>
        <Typography
          component="h2"
          sx={{
            color: colors.navy,
            fontSize: KslFontSizes.lg,
            fontWeight: 700,
            lineHeight: KslLineHeights.lg,
          }}
        >
          Admin Console
        </Typography>

        <Typography
          sx={{
            color: colors.muted,
            fontSize: KslFontSizes.sm,
            lineHeight: KslLineHeights.sm,
          }}
        >
          Sign in to continue learning Khmer Sign Language to manage courses,
          quizzes, and learner content.
        </Typography>
      </Stack>

      <Stack spacing={1.6} >
        <AuthTextField
          label="Username"
          icon="solar:user-rounded-outline"
          name="email"
          autoComplete="username"
          disabled={isLoading}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          variant="outlined"
        />

        <AuthTextField
          label="Password"
          icon="solar:key-outline"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          disabled={isLoading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                sx={{ color: colors.fieldHint }}
              >
                <Iconify
                  icon={
                    showPassword
                      ? 'solar:eye-outline'
                      : 'solar:eye-closed-outline'
                  }
                />
              </IconButton>
            </InputAdornment>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              sx={{
                p: 0,
                mr: 0.5,
                color: colors.fieldHint,
                '&.Mui-checked': {
                  color: colors.green,
                },
              }}
            />
          }
          label="Remember Me"
          sx={{
            ml: 0.5,
            height: 34,
            color: colors.muted,
            '& .MuiFormControlLabel-label': {
              fontSize: KslFontSizes.sm,
              lineHeight: KslLineHeights.sm,
              fontWeight: 600,
            },
            userSelect: 'none',
            '& .MuiCheckbox-root': {
              userSelect: 'auto',
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          disabled={!canLogin || isLoading}
          sx={{
            height: 48,
            borderRadius: `${KslRadii.wordCard}px`,
            bgcolor: canLogin && !isLoading ? colors.green : colors.inactive,
            color: canLogin && !isLoading ? colors.white : colors.fieldHint,
            fontSize: KslFontSizes.sm,
            lineHeight: KslLineHeights.sm,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              bgcolor: canLogin && !isLoading ? colors.greenDark : colors.inactive,
            },
            '&.Mui-disabled': {
              bgcolor: colors.inactive,
              color: colors.fieldHint,
            },
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </Stack>
    </Stack>
  );
}

type AuthTextFieldProps = {
  label: string;
  icon: string;
  type?: string;
  name?: string;
  autoComplete?: string;
  disabled?: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  endAdornment?: React.ReactNode;
  variant?: 'outlined' | 'standard' | 'filled';
};

function AuthTextField({
  label,
  icon,
  type = 'text',
  name,
  autoComplete,
  disabled = false,
  value,
  onChange,
  endAdornment,
  variant = 'outlined',
}: AuthTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const shrinkLabel = isFocused || value.length > 0;

  return (
    <TextField
      fullWidth
      type={type}
      label={label}
      name={name}
      autoComplete={autoComplete}
      disabled={disabled}
      value={value}
      onChange={onChange}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      variant={variant}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon={icon} sx={{ color: colors.fieldHint, mr: 0.5 }} />
            </InputAdornment>
          ),
          endAdornment,
        },
        inputLabel: {
          shrink: shrinkLabel,
          sx: {
            color: colors.fieldHint,
            fontSize: KslFontSizes.md,
            fontWeight: 500,
            lineHeight: KslLineHeights.md,
            '&.MuiInputLabel-outlined:not(.MuiInputLabel-shrink)': {
              transform: {
                xs: 'translate(52px, 16px) scale(1)',
                sm: 'translate(54px, 18px) scale(1)',
              },
            },
            '&.MuiInputLabel-shrink': {
              transform: 'translate(16px, -9px) scale(0.75)',
            },
            '&.Mui-focused': {
              color: colors.fieldHint,
            },
          },
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: { xs: 56, sm: 60 },
          borderRadius: `${KslRadii.card - 4}px`,
          bgcolor: colors.white,
          fontSize: KslFontSizes.md,
          lineHeight: KslLineHeights.md,
          color: colors.navy,
          '& fieldset': {
            borderColor: colors.border,
          },
          '&:hover fieldset': {
            borderColor: colors.border,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.border,
            borderWidth: 1.5,
          },
        },
        '& .MuiOutlinedInput-notchedOutline legend': {
          maxWidth: shrinkLabel ? undefined : 0,
        },
        '& .MuiInputAdornment-root': {
          color: colors.fieldHint,
        },
        '& .MuiOutlinedInput-input': {
          pl: 0,
          py: 0,
        },
      }}
    />
  );
}

type SocialButtonProps = {
  icon: string;
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  overlayActive?: boolean;
  overlayRef?: RefObject<HTMLDivElement | null>;
};

type TelegramLoginButtonProps = {
  ready: boolean;
  disabled?: boolean;
  telegramContainerRef: RefObject<HTMLDivElement | null>;
  onFallbackClick: () => void;
};

type FacebookLoginButtonProps = {
  ready: boolean;
  loading: boolean;
  onClick: () => void;
};

type GoogleLoginButtonProps = {
  ready: boolean;
  loading: boolean;
  googleButtonRef: RefObject<HTMLDivElement | null>;
  onFallbackClick: () => void;
};

const socialOverlaySx = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

function GoogleLoginButton({
  ready,
  loading,
  googleButtonRef,
  onFallbackClick,
}: GoogleLoginButtonProps) {
  return (
    <SocialButton
      icon="logos:google-icon"
      disabled={!ready}
      loading={loading}
      onClick={onFallbackClick}
      overlayActive={ready && !loading}
      overlayRef={googleButtonRef}
    >
      Continue with Google
    </SocialButton>
  );
}

function FacebookLoginButton({
  ready,
  loading,
  onClick,
}: FacebookLoginButtonProps) {
  return (
    <SocialButton
      icon="logos:facebook"
      disabled={!ready}
      loading={loading}
      onClick={onClick}
    >
      Continue with Facebook
    </SocialButton>
  );
}

function TelegramLoginButton({
  ready,
  disabled = false,
  telegramContainerRef,
  onFallbackClick,
}: TelegramLoginButtonProps) {
  return (
    <SocialButton
      icon="logos:telegram"
      disabled={!ready || disabled}
      onClick={onFallbackClick}
      overlayActive={ready && !disabled}
      overlayRef={telegramContainerRef}
    >
      Continue with Telegram
    </SocialButton>
  );
}

const socialButtonHoverSx = {
  borderColor: colors.hoverBorder,
  bgcolor: colors.hoverSurface,
};

function SocialButton({
  icon,
  children,
  disabled = false,
  loading = false,
  onClick,
  overlayActive = false,
  overlayRef,
}: SocialButtonProps) {
  const isDisabled = disabled || loading;
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled || overlayActive) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <Box
      role="button"
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      className="social-login-button"
      onClick={isDisabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: 50,
        width: '100%',
        justifyContent: 'flex-start',
        px: 1.4,
        borderRadius: `${KslRadii.wordCard}px`,
        border: '1px solid',
        borderColor: disabled ? colors.inactive : colors.border,
        color: disabled ? colors.fieldHint : colors.navy,
        bgcolor: disabled ? colors.softBg : colors.white,
        fontSize: KslFontSizes.md,
        lineHeight: KslLineHeights.md,
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
        '&:hover': isDisabled ? undefined : socialButtonHoverSx,
        '&[aria-disabled="true"]': {
          borderColor: colors.inactive,
          color: colors.fieldHint,
          bgcolor: colors.softBg,
        },
        '&[aria-disabled="true"] .social-login-icon': {
          opacity: 0.45,
        },
        '&:focus-visible': {
          outline: `2px solid ${colors.green}`,
          outlineOffset: 2,
        },
        '& .social-login-icon': {
          display: 'inline-flex',
          mr: 1.35,
          ml: 0,
        },
      }}
    >
      <Box className="social-login-icon">
        <Iconify icon={icon} />
      </Box>
      {loading ? 'Please wait...' : children}
      {overlayRef ? (
        <Box
          ref={overlayRef}
          aria-hidden={!overlayActive}
          sx={{
            ...socialOverlaySx,
            opacity: overlayActive ? 0.01 : 0,
            pointerEvents: overlayActive ? 'auto' : 'none',
            cursor: overlayActive ? 'pointer' : 'not-allowed',
          }}
        />
      ) : null}
    </Box>
  );
}

function PoweredBy() {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1.5,
        color: colors.white,
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: KslFontSizes.sm,
          lineHeight: KslLineHeights.sm,
          fontWeight: 500,
          color: colors.white,
        }}
      >
        Powered by
      </Typography>

      <Box
        component="img"
        src="/assets/cadt.png"
        alt="CADT"
        sx={{
          height: 28,
          width: 'auto',
          borderRadius: `${KslRadii.wordCard}px`,
          objectFit: 'contain',
        }}
      />
    </Stack>
  );
}
