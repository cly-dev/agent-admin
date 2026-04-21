import { signIn } from '@/services/auth/session';
import { RobotOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { useState, type FormEvent } from 'react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      await signIn(username, password);
      history.push('/home');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('登录失败，请稍后再试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="fixed top-0 z-50 w-full app-frosted-header">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[--radius-ui] bg-linear-to-br from-primary to-primary-container">
              <RobotOutlined className="text-sm text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-on-surface">Cognitive Architect</span>
          </div>
          <button type="button" className="app-button-tertiary px-3 py-1 text-sm font-semibold">
            Support
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-24">
        <section className="w-full max-w-md app-floating p-8 md:p-10">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-surface-container-low p-4">
              <RobotOutlined className="text-4xl text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-surface">Welcome Back</h1>
            <p className="mt-2 text-sm text-on-surface/70">Orchestrate your intelligence workforce.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface/70"
                htmlFor="username"
              >
                Email Address
              </label>
              <input
                id="username"
                type="email"
                className="app-input w-full px-4 py-3 text-sm"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="name@company.com"
                autoComplete="username"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface/70"
                  htmlFor="password"
                >
                  Password
                </label>
                <button type="button" className="app-button-tertiary px-2 py-1 text-xs font-medium">
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                className="app-input w-full px-4 py-3 text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errorMessage ? <p className="mt-2 text-xs text-tertiary">{errorMessage}</p> : null}
            </div>

            <button
              type="submit"
              className="app-button-primary w-full px-4 py-3 text-sm font-semibold"
              disabled={submitting}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface/70">
              Don&apos;t have an account?{' '}
              <button type="button" className="app-button-tertiary px-1 py-0 text-sm font-semibold">
                Sign up
              </button>
            </p>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-transparent text-xs text-on-surface/60">
        <div className="flex flex-col items-center justify-between gap-4 px-8 py-6 md:flex-row">
          <p>© 2026 Cognitive Architect. All rights reserved.</p>
          <div className="flex gap-6">
            <button type="button" className="app-button-tertiary px-0 py-0 text-xs">
              Privacy Policy
            </button>
            <button type="button" className="app-button-tertiary px-0 py-0 text-xs">
              Terms of Service
            </button>
            <button type="button" className="app-button-tertiary px-0 py-0 text-xs">
              Security
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
