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
import Link from 'next/link'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true)
    console.log('=== LOGIN ATTEMPT START ===')
    console.log('Email:', values.email)
    
    try {
      const supabase = createClient()
      
      // Check session before login
      const { data: { session: sessionBefore } } = await supabase.auth.getSession()
      console.log('Session before login:', sessionBefore)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      
      console.log('Login response:', { data, error })
      
      if (error) {
        console.error('Login error:', error)
        toast.error(error.message)
        return
      }
      
      // Check session after login
      const { data: { session: sessionAfter } } = await supabase.auth.getSession()
      console.log('Session after login:', sessionAfter)
      console.log('Cookies after login:', document.cookie)
      
              // Check user role after successful login
        if (data.user) {
          console.log('User data:', data.user)
          console.log('User metadata:', data.user.user_metadata)
          console.log('Raw user metadata:', (data.user as any).raw_user_meta_data)
          
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, is_active')
            .eq('id', data.user.id)
            .single()
          
          console.log('User profile from DB:', profile)
          
          // Check if user is admin (either from profile or user metadata)
          const isAdmin = (profile?.role === 'administrator' && profile?.is_active) ||
                         data.user.user_metadata?.role === 'administrator'
          
          // Check if user is vendor (check both user_metadata and raw_user_meta_data)
          const isVendor = (profile?.role === 'vendor' && profile?.is_active) ||
                          data.user.user_metadata?.role === 'vendor' ||
                          (data.user as any).raw_user_meta_data?.role === 'vendor'
          
          console.log('Is admin:', isAdmin)
          console.log('Is vendor:', isVendor)
          
          if (isAdmin) {
            console.log('User is admin, redirecting to /admin')
            toast.success('Welcome back, Administrator!')
            router.push('/admin')
          } else if (isVendor) {
            console.log('User is vendor, redirecting to vendor dashboard')
            toast.success('Welcome back!')
            router.push(`/vendor/${data.user.id}/dashboard`)
          } else {
            console.log('User is customer, redirecting to /')
            toast.success('Signed in successfully')
            router.push('/')
          }
        } else {
          console.log('No user data, redirecting to /')
          toast.success('Signed in successfully')
          router.push('/')
        }
        
        console.log('=== LOGIN ATTEMPT END ===')
        
        // Force refresh to ensure session is recognized
        router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={form.handleSubmit(onSubmit)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            {...form.register('email')}
            disabled={isLoading}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
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
            {...form.register('password')}
            disabled={isLoading}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
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
        <Link href="/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </form>
  )
}
