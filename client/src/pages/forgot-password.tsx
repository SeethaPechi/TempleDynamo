import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description: body.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Always show the success state regardless — prevents email enumeration.
      setSubmitted(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-saffron-500 to-temple-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-white" size={32} />
          </div>
          <CardTitle className="text-3xl font-bold text-temple-brown">
            {submitted ? 'Check Your Email' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-lg">
            {submitted
              ? 'We sent you a reset link'
              : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 text-center text-sm text-green-800">
                <CheckCircle size={40} className="text-green-500" />
                <p>
                  If <strong>{form.getValues('email')}</strong> is registered, you will receive
                  an email with a link to reset your password. The link is valid for{' '}
                  <strong>1 hour</strong>.
                </p>
                <p className="text-xs text-green-700">
                  Don't see it? Check your spam folder or{' '}
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      form.reset();
                    }}
                    className="underline font-semibold hover:text-green-900"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
              <div className="text-center">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-semibold text-sm"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail size={16} />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your account email"
                          autoComplete="email"
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
                  {isLoading ? 'Sending…' : 'Send Reset Link'}
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
