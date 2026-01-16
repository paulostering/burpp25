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
  registrationEnabled = true,
  ...props
}: React.ComponentProps<"form"> & { registrationEnabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
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
            toast.success('Signed in successfully')
            router.push('/')
          }
        } else {
          toast.success('Signed in successfully')
          router.push('/')
        }
        
        // Force refresh to ensure session is recognized
        router.refresh()
    } catch (error) {
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
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
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
      {registrationEnabled && (
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      )}
    </form>
  )
}
