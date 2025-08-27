import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { LogIn, Mail, Lock } from 'lucide-react';
import { SimpleCaptcha } from '@/components/SimpleCaptcha';
import { loginUserSchema, type LoginUser } from '@shared/schema';

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginUser) => {
    if (!captchaVerified) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(data.email, data.password);
      
      toast({
        title: "Welcome Back",
        description: "You have been signed in successfully.",
      });
      
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
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
            <LogIn className="text-white" size={32} />
          </div>
          <CardTitle className="text-3xl font-bold text-temple-brown">Sign In</CardTitle>
          <CardDescription className="text-lg">
            Access your temple community account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="mr-2" size={16} />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="mr-2" size={16} />
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Captcha */}
              <div>
                <label className="text-sm font-medium mb-2 block">Security Verification</label>
                <SimpleCaptcha 
                  onVerify={setCaptchaVerified} 
                  isVerified={captchaVerified} 
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-yellow-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105"
                disabled={isLoading || !captchaVerified}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-saffron-600 hover:text-saffron-700 font-semibold">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}