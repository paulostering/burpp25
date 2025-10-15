'use client'

import { useState, useEffect, useRef } from 'react'
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
import { CheckCircle2 } from 'lucide-react'

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [resetComplete, setResetComplete] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isValid, setIsValid] = useState(false)
  const hasVerified = useRef(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    // Only run once when component mounts - use ref to prevent re-runs
    if (hasVerified.current) {
      console.log('Token already verified, skipping...')
      return
    }
    
    hasVerified.current = true
    
    // Handle the password reset token from the URL
    const handleResetToken = async () => {
      console.log('🔐 Starting password reset token verification...')
      const supabase = createClient()
      
      // Parse hash parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const error = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      
      console.log('Hash params:', {
        error: error,
        type: type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })
      
      if (error) {
        console.error('Reset token error:', error, errorDescription)
        toast.error(errorDescription || 'Invalid or expired reset link. Please request a new one.')
        setIsVerifying(false)
        setIsValid(false)
        console.log('⏱️  Setting redirect timeout (3 seconds) - REASON: Error in hash params')
        redirectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 REDIRECTING to /forgot-password - REASON: Error in hash params')
          router.push('/forgot-password')
        }, 3000)
        return
      }

      // If we have tokens, set the session explicitly
      if (accessToken && refreshToken) {
        console.log('🔑 Setting session from hash tokens...')
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (sessionError) {
          console.error('❌ Failed to set session:', sessionError)
          toast.error('Failed to establish session. Please try the reset link again.')
          setIsVerifying(false)
          setIsValid(false)
          console.log('⏱️  Setting redirect timeout (3 seconds) - REASON: Session error')
          redirectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 REDIRECTING to /forgot-password - REASON: Session error')
            router.push('/forgot-password')
          }, 3000)
          return
        }
        
        if (sessionData.user?.email) {
          setUserEmail(sessionData.user.email)
          console.log('✅ Password reset session established for:', sessionData.user.email)
          setIsVerifying(false)
          setIsValid(true)
          // Clear the hash from URL for cleaner UX
          window.history.replaceState(null, '', '/reset-password')
          return
        }
      }
      
      // If no tokens in hash, check if we already have a session
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        setUserEmail(user.email)
        console.log('✅ Password reset session found (existing):', user.email)
        setIsVerifying(false)
        setIsValid(true)
      } else {
        console.error('❌ No tokens and no session found')
        toast.error('Invalid or expired reset link. Please request a new one.')
        setIsVerifying(false)
        setIsValid(false)
        console.log('⏱️  Setting redirect timeout (3 seconds) - REASON: No valid session')
        redirectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 REDIRECTING to /forgot-password - REASON: Invalid session')
          router.push('/forgot-password')
        }, 3000)
      }
    }
    
    handleResetToken()
    
    // Cleanup timeout on unmount
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: values.password
      })
      
      if (error) {
        console.error('Password update error:', error)
        toast.error(error.message)
        return
      }

      // Get user info for confirmation email
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get user profile for first name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()

        // Send password reset confirmation email
        console.log('🔐 Password reset successful - sending confirmation email...')
        fetch('/api/send-password-reset-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            firstName: profile?.first_name || 'User',
          }),
        })
          .then(async (response) => {
            const result = await response.json()
            console.log('Password reset confirmation email response:', result)
          })
          .catch(error => {
            console.error('Failed to send confirmation email:', error)
          })
      }

      setResetComplete(true)
      toast.success('Password updated successfully!')
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel any pending redirects when user interacts with form
  const handleFormInteraction = () => {
    if (redirectTimeoutRef.current) {
      console.log('Cancelling redirect timeout due to form interaction')
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
  }

  if (isVerifying) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold">Verifying Reset Link...</h1>
            <p className="text-muted-foreground text-sm">
              Please wait while we verify your password reset link
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!isValid) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-red-100 p-4">
            <CheckCircle2 className="h-8 w-8 text-red-600" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
            <p className="text-muted-foreground text-sm text-balance">
              This password reset link is invalid or has expired. Redirecting...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (resetComplete) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Password Reset Complete</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/login">Continue to Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={form.handleSubmit(onSubmit)} 
      onClick={handleFormInteraction}
      onFocus={handleFormInteraction}
      {...props}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your new password below
        </p>
        {userEmail && (
          <p className="text-xs text-muted-foreground">
            Resetting password for: <strong>{userEmail}</strong>
          </p>
        )}
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="password">New Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Enter new password"
            {...form.register('password')}
            disabled={isLoading}
            onChange={(e) => {
              handleFormInteraction()
              form.setValue('password', e.target.value)
            }}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="Confirm new password"
            {...form.register('confirmPassword')}
            disabled={isLoading}
            onChange={(e) => {
              handleFormInteraction()
              form.setValue('confirmPassword', e.target.value)
            }}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
      <div className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-primary">
          Back to login
        </Link>
      </div>
    </form>
  )
}

