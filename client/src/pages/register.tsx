import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { User, Shield, Phone, Mail, Lock, Key } from 'lucide-react';
import { SimpleCaptcha } from '@/components/SimpleCaptcha';
import { insertUserSchema } from '@shared/schema';

// Extend the user schema for registration form validation
const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

const countryCodes = [
  { code: '+1', country: 'US/Canada' },
  { code: '+91', country: 'India' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+1',
      password: '',
      confirmPassword: '',
      passwordHint: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
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
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = data;
      await register(registrationData);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please sign in.",
      });
      
      setLocation('/signin');
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-saffron-500 to-temple-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-white" size={32} />
          </div>
          <CardTitle className="text-3xl font-bold text-temple-brown">Create Account</CardTitle>
          <CardDescription className="text-lg">
            Join our temple community management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="mr-2" size={16} />
                      Email Address *
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

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country Code</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countryCodes.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.code} ({item.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Phone className="mr-2" size={16} />
                          Mobile Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XXXXXXXXXX, XXX-XXX-XXXX, or (XXX) XXX XXXX"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Accepted formats: XXXXXXXXXX, XXX-XXX-XXXX, (XXX) XXX XXXX
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Password Information */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="mr-2" size={16} />
                      Password *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a strong password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters long
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Shield className="mr-2" size={16} />
                      Confirm Password *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Key className="mr-2" size={16} />
                      Password Hint (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A hint to help you remember your password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This hint will help you reset your password if you forget it
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Captcha */}
              <div>
                <label className="text-sm font-medium mb-2 block">Security Verification *</label>
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-saffron-600 hover:text-saffron-700 font-semibold">
                    Sign In
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