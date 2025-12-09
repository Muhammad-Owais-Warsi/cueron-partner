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
      router.push('/dashboard');
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
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 shadow-none border-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-2 text-center mb-8">
              <h1 className="text-2xl font-bold">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create an account'}
                {mode === 'magic' && 'Magic Link Login'}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'login' && 'Login to your Cueron account'}
                {mode === 'signup' && 'Sign up for an Cueron account'}
                {mode === 'magic' && 'Receive a login link in your inbox'}
              </p>
            </div>

            {mode === 'login' && (
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field>
                  <div className="flex items-center">
                    <FieldLabel>Password</FieldLabel>
                    <button
                      className="ml-auto text-sm underline-offset-2 hover:underline"
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
                      placeholder="Enter your password"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={togglePasswordVisibility}
                        size="icon-xs"
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Button onClick={handleLogin} disabled={loading} className="w-full">
                  {loading ? <Spinner /> : 'Login'}
                </Button>

                <FieldDescription className="text-center mt-8">
                  Don&apos;t have an account?{' '}
                  <button className="underline" onClick={() => setMode('signup')} type="button">
                    Sign up
                  </button>
                </FieldDescription>
              </FieldGroup>
            )}

            {mode === 'signup' && (
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      disabled={loading}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={togglePasswordVisibility}
                        size="icon-xs"
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Button onClick={handleSignup} disabled={loading} className="w-full">
                  {loading ? <Spinner /> : 'Create Account'}
                </Button>

                <FieldDescription className="text-center mt-8">
                  Already have an account?{' '}
                  <button className="underline" onClick={() => setMode('login')} type="button">
                    Login
                  </button>
                </FieldDescription>
              </FieldGroup>
            )}

            {mode === 'magic' && (
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Button onClick={handleMagicLink} disabled={loading} className="w-full">
                  {loading ? <Spinner /> : 'Send Magic Link'}
                </Button>

                <FieldDescription className="text-center mt-8">
                  Want to use password login?{' '}
                  <button className="underline" onClick={() => setMode('login')} type="button">
                    Back to login
                  </button>
                </FieldDescription>
              </FieldGroup>
            )}
          </div>

          <div className="bg-muted relative hidden md:block">
            <Image
              src="/placeholder.svg"
              alt="Login illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              width={400}
              height={600}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
