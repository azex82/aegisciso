'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@aegisciso/ui';
import { Shield, AlertCircle } from 'lucide-react';
import { SharpLogoSVG } from '@/components/ui/sharp-logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - SHARP branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a237e] via-[#1565c0] to-[#42a5f5] items-center justify-center p-12">
        <div className="text-white max-w-md">
          {/* SHARP Logo */}
          <SharpLogoSVG className="h-20 w-auto mb-8" variant="default" color="white" />
          <h1 className="text-3xl font-bold mb-4 mt-4">AI Cybersecurity Director</h1>
          <p className="text-lg text-white/80 mb-6">
            Enterprise-grade security governance, risk management, and compliance platform powered by sovereign AI.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Sovereign AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>NCA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="space-y-1 text-center pb-2">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-4">
              <SharpLogoSVG className="h-14 w-auto" variant="default" color="gradient" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-gray-500">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@sabic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-[#0047AF] focus:ring-[#0047AF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-gray-200 focus:border-[#0047AF] focus:ring-[#0047AF]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-11 bg-[#0047AF] hover:bg-[#003D99] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-center text-xs text-gray-400 mb-2">Demo credentials</p>
              <div className="bg-gray-50 rounded-md p-3 text-center">
                <p className="text-xs text-gray-600 font-mono">ciso@sabic.com</p>
                <p className="text-xs text-gray-600 font-mono">CisoPass123!</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
