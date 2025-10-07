'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface VendorAuthFormProps {
  mode: 'login' | 'signup'
  onModeChange: (mode: 'login' | 'signup') => void
  onAuthSuccess?: () => void
  className?: string
}

export function VendorAuthForm({ mode, onModeChange, onAuthSuccess, className }: VendorAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  
  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password)
    }
    
    score += checks.length ? 1 : 0
    score += checks.lowercase ? 1 : 0
    score += checks.uppercase ? 1 : 0
    score += checks.numbers ? 1 : 0
    score += checks.symbols ? 1 : 0
    
    if (score <= 2) return { strength: 'weak', color: 'bg-red-500', text: 'Weak' }
    if (score <= 3) return { strength: 'medium', color: 'bg-yellow-500', text: 'Medium' }
    if (score <= 4) return { strength: 'strong', color: 'bg-blue-500', text: 'Strong' }
    return { strength: 'very-strong', color: 'bg-green-500', text: 'Very Strong' }
  }

  const passwordStrength = getPasswordStrength(signupForm.watch('password'))

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      
      if (error) {
        console.error('Login error:', error)
        toast.error(error.message)
        return
      }
      
      // Check user role after successful login
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single()
        
        // Check if user is admin (either from profile or user metadata)
        const isAdmin = (profile?.role === 'administrator' && profile?.is_active) ||
                       data.user.user_metadata?.role === 'administrator'
        
        // Check if user is vendor (check both user_metadata and raw_user_meta_data)
        const isVendor = (profile?.role === 'vendor' && profile?.is_active) ||
                        data.user.user_metadata?.role === 'vendor' ||
                        (data.user as any).raw_user_meta_data?.role === 'vendor'
        
        if (isAdmin) {
          toast.success('Welcome back, Administrator!')
          router.push('/admin')
        } else if (isVendor) {
          toast.success('Welcome back!')
          router.push(`/vendor/${data.user.id}/dashboard`)
        } else {
          // Smooth transition to messaging - no toast
          onAuthSuccess?.()
        }
      } else {
        // Smooth transition to messaging - no toast
        onAuthSuccess?.()
      }
      
      // Force refresh to ensure session is recognized
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Create user without metadata to avoid trigger issues
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })
      
      if (error) {
        console.error('Auth signup error:', error)
        toast.error(error.message)
        return
      }

      if (data.user) {
        // Create the user profile manually
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: values.email,
            first_name: values.firstName,
            last_name: values.lastName,
            role: 'customer',
            is_active: true,
          })

        if (profileError) {
          console.error('Profile creation error:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          toast.error('Database error saving new user')
          return
        }
      }

      // Attempt immediate sign-in to create a seamless experience
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      
      if (signInError) {
        // If email confirmation is required, inform the user.
        toast.success('Account created. Check your email to confirm your account')
        return
      }
      
      // Check if this is a vendor signup (from vendor registration context)
      // For now, redirect to home page as this is used in vendor profile modal
      // Smooth transition to messaging - no toast
      onAuthSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === 'login') {
    return (
      <form className={cn("flex flex-col gap-6", className)} onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              {...loginForm.register('email')}
              disabled={isLoading}
            />
            {loginForm.formState.errors.email && (
              <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input 
              id="password" 
              type="password" 
              {...loginForm.register('password')}
              disabled={isLoading}
            />
            {loginForm.formState.errors.password && (
              <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </div>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => onModeChange('signup')}
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </button>
        </div>
      </form>
    )
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={signupForm.handleSubmit(onSignupSubmit)}>
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="firstName">First name</Label>
            <Input 
              id="firstName" 
              type="text" 
              placeholder="John"
              {...signupForm.register('firstName')}
              disabled={isLoading}
            />
            {signupForm.formState.errors.firstName && (
              <p className="text-sm text-red-500">{signupForm.formState.errors.firstName.message}</p>
            )}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="lastName">Last name</Label>
            <Input 
              id="lastName" 
              type="text" 
              placeholder="Doe"
              {...signupForm.register('lastName')}
              disabled={isLoading}
            />
            {signupForm.formState.errors.lastName && (
              <p className="text-sm text-red-500">{signupForm.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com"
            {...signupForm.register('email')}
            disabled={isLoading}
          />
          {signupForm.formState.errors.email && (
            <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            {...signupForm.register('password')}
            disabled={isLoading}
          />
          {signupForm.watch('password') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Password strength:</span>
                <span className={`font-medium ${
                  passwordStrength.strength === 'weak' ? 'text-red-600' :
                  passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                  passwordStrength.strength === 'strong' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.text}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ 
                    width: passwordStrength.strength === 'weak' ? '25%' :
                           passwordStrength.strength === 'medium' ? '50%' :
                           passwordStrength.strength === 'strong' ? '75%' : '100%'
                  }}
                ></div>
              </div>
            </div>
          )}
          {signupForm.formState.errors.password && (
            <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            {...signupForm.register('confirmPassword')}
            disabled={isLoading}
          />
          {signupForm.formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onModeChange('login')}
          className="underline underline-offset-4 hover:text-primary"
        >
          Log in
        </button>
      </div>
    </form>
  )
}
