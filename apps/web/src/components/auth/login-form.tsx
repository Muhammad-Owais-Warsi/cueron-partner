'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendMagicLink, signInWithEmailAndPassword, signUpWithEmailAndPassword } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
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
    <div className="relative flex min-h-[100vh] items-center justify-center p-4">
      {/* Global Back Button - Fixed to Top Left */}
      <div className="fixed left-4 top-4 z-50">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1 bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
        >
          <Link href="/">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-[400px] shadow-lg border">
        <CardContent className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2 text-center mb-6">
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
                inputMode="email"
                placeholder="name@example.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </Field>

            {mode !== 'magic' && (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel className="text-sm font-medium">Password</FieldLabel>
                  <Button
                    className="text-xs text-primary underline-offset-4 hover:underline p-0 h-auto"
                    onClick={() => setMode('magic')}
                    variant="link"
                  >
                    Use magic link
                  </Button>
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
                mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleMagicLink
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

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <Button
                      className="p-0 h-auto font-medium"
                      onClick={() => setMode('signup')}
                      variant="link"
                    >
                      Sign up
                    </Button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Button
                      className="text-primary p-0 h-auto font-medium"
                      onClick={() => setMode('login')}
                      variant="link"
                    >
                      Login
                    </Button>
                  </>
                )}
              </p>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
