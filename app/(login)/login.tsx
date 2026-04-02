'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { signUp } from './actions';
import { useActionState } from 'react';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const urlError = searchParams.get('error');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState('');
  const [credentialLoading, setCredentialLoading] = useState(false);

  // For signup we still use the server action (creates user + team)
  const [signUpState, signUpAction, signUpPending] = useActionState<ActionState, FormData>(
    signUp,
    { error: '' }
  );

  function handleSocialLogin(provider: string) {
    setSocialLoading(provider);
    nextAuthSignIn(provider, { callbackUrl: '/overview' });
  }

  async function handleCredentialSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCredentialError('');
    setCredentialLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setCredentialLoading(false);

    if (result?.error) {
      setCredentialError('Invalid email or password. Please try again.');
    } else {
      router.push('/overview');
    }
  }

  const error = credentialError || (mode === 'signup' ? signUpState?.error : '') || '';
  const pending = credentialLoading || signUpPending || socialLoading !== null;

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-500 text-white font-bold text-sm">
            ai
          </div>
          <span className="text-2xl font-bold text-gray-900">AiBooker</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full py-2.5 flex items-center justify-center gap-3"
            onClick={() => handleSocialLogin('google')}
            disabled={pending}
          >
            {socialLoading === 'google' ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full py-2.5 flex items-center justify-center gap-3"
            onClick={() => handleSocialLogin('github')}
            disabled={pending}
          >
            {socialLoading === 'github' ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            Continue with GitHub
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* OAuth error */}
        {urlError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {urlError === 'OAuthAccountNotLinked'
              ? 'This email is already registered with a different sign-in method.'
              : 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Email/Password Form */}
        {mode === 'signin' ? (
          <form className="space-y-6" onSubmit={handleCredentialSignIn}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</Label>
              <div className="mt-1">
                <Input id="email" name="email" type="email" autoComplete="email" required maxLength={50}
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your email" />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</Label>
              <div className="mt-1">
                <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={100}
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your password" />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" disabled={pending}
              className="w-full rounded-full bg-orange-600 hover:bg-orange-700 text-white">
              {credentialLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Signing in...</> : 'Sign in'}
            </Button>
          </form>
        ) : (
          <form className="space-y-6" action={signUpAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</Label>
              <div className="mt-1">
                <Input id="email" name="email" type="email" autoComplete="email" required maxLength={50}
                  defaultValue={signUpState.email}
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your email" />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</Label>
              <div className="mt-1">
                <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={100}
                  defaultValue={signUpState.password}
                  className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Create a password" />
              </div>
            </div>
            {signUpState?.error && <div className="text-red-500 text-sm">{signUpState.error}</div>}
            <Button type="submit" disabled={signUpPending}
              className="w-full rounded-full bg-orange-600 hover:bg-orange-700 text-white">
              {signUpPending ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Creating account...</> : 'Sign up'}
            </Button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {mode === 'signin' ? 'New to our platform?' : 'Already have an account?'}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
