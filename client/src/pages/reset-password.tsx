import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token from the URL query string
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      const body = await res.json();

      if (!res.ok) {
        toast({
          title: 'Reset Failed',
          description: body.message || 'Could not reset password. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setSuccess(true);
      // Give the user a moment to read the success message, then redirect.
      setTimeout(() => setLocation('/signin'), 3000);
    } catch {
      toast({
        title: 'Network Error',
        description: 'Could not reach the server. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Missing or clearly invalid token — show a helpful error without trying.
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <CardTitle className="text-2xl font-bold text-temple-brown">Invalid Link</CardTitle>
            <CardDescription>This password reset link is missing or malformed.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Please use the link sent to your email, or request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-semibold text-sm underline"
            >
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-saffron-500 to-temple-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <CardTitle className="text-3xl font-bold text-temple-brown">
            {success ? 'Password Updated' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-lg">
            {success ? 'You can now sign in' : 'Choose a new password for your account'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 text-center text-sm text-green-800">
                <CheckCircle size={40} className="text-green-500" />
                <p>Your password has been updated successfully.</p>
                <p className="text-xs text-green-700">Redirecting you to Sign In…</p>
              </div>
              <div className="text-center">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-semibold text-sm"
                >
                  <ArrowLeft size={16} />
                  Go to Sign In now
                </Link>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock size={16} />
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock size={16} />
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repeat your new password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-yellow-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving…' : 'Set New Password'}
                </Button>

                <div className="text-center">
                  <Link
                    href="/signin"
                    className="inline-flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-semibold text-sm"
                  >
                    <ArrowLeft size={16} />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
