'use client'

import { useState } from 'react'
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
import { ArrowLeft, Mail } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true)
    try {
      // Send custom password reset email via our template
      // This will generate the reset link and send our branded email
      console.log('🔐 Password reset requested - sending custom email...')
      const response = await fetch('/api/send-password-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      })

      const result = await response.json()
      console.log('Password reset email API response:', result)

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to send reset email. Please try again.')
        return
      }

      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground text-sm text-balance">
              We've sent a password reset link to <strong>{form.getValues('email')}</strong>.
              Click the link in the email to reset your password.
            </p>
          </div>
        </div>
        <div className="text-sm">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={() => setEmailSent(false)}
            className="text-primary hover:underline font-medium"
          >
            try again
          </button>
        </div>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="inline h-4 w-4 mr-1" />
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={form.handleSubmit(onSubmit)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Forgot Your Password?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email address and we'll send you a link to reset your password
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </div>
      <div className="text-center text-sm">
        Remember your password?{' '}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </form>
  )
}

