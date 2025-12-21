'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendMagicLink, signInWithEmailAndPassword, signUpWithEmailAndPassword } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Spinner } from '../ui/spinner';

interface LoginFormProps {
  onEmailSent?: (email: string) => void;
}

export function LoginForm({ onEmailSent }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMagicLink = async () => {
    setLoading(true);
    try {
      if (!email.includes('@')) throw new Error('Enter a valid email.');
      await sendMagicLink(email);
      toast.success('Magic link sent!');
      onEmailSent?.(email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!email.includes('@')) throw new Error('Enter a valid email.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');

      await signInWithEmailAndPassword(email, password);

      toast.success('Logged in.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      if (!email.includes('@')) throw new Error('Enter a valid email.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');

      await signUpWithEmailAndPassword(email, password);

      toast.success('Account created. Redirecting…');
      router.push('/engineer');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-[400px] md:max-w-[800px] overflow-hidden shadow-lg border">
        <CardContent className="grid p-0 grid-cols-1 md:grid-cols-2">
          {/* Form Side */}
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
            <div className="flex flex-col items-center gap-2 text-center mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create an account'}
                {mode === 'magic' && 'Magic Link Login'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === 'login' && 'Login to your Cueron account'}
                {mode === 'signup' && 'Sign up for an Cueron account'}
                {mode === 'magic' && 'Receive a login link in your inbox'}
              </p>
            </div>

            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel className="text-sm font-medium">Email</FieldLabel>
                <Input
                  type="email"
                  inputMode="email" // Better mobile keyboard
                  placeholder="name@example.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11" // Taller touch target
                />
              </Field>

              {mode !== 'magic' && (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-sm font-medium">Password</FieldLabel>
                    <button
                      className="text-xs text-primary underline-offset-4 hover:underline"
                      onClick={() => setMode('magic')}
                      type="button"
                    >
                      Use magic link
                    </button>
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      disabled={loading}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={togglePasswordVisibility}
                        size="icon-xs"
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              )}

              <Button
                onClick={
                  mode === 'login'
                    ? handleLogin
                    : mode === 'signup'
                      ? handleSignup
                      : handleMagicLink
                }
                disabled={loading}
                className="w-full h-11 text-base mt-2"
              >
                {loading ? (
                  <Spinner />
                ) : mode === 'login' ? (
                  'Login'
                ) : mode === 'signup' ? (
                  'Create Account'
                ) : (
                  'Send Link'
                )}
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        className="text-primary font-medium hover:underline"
                        onClick={() => setMode('signup')}
                        type="button"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        className="text-primary font-medium hover:underline"
                        onClick={() => setMode('login')}
                        type="button"
                      >
                        Login
                      </button>
                    </>
                  )}
                </p>
              </div>
            </FieldGroup>
          </div>

          {/* Desktop Illustration - Hidden on mobile */}
          <div className="bg-muted hidden md:block relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
            <Image
              src="/placeholder.svg"
              alt="Login illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
              width={400}
              height={600}
              priority
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
