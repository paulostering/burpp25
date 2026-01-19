import { LoginForm } from "@/components/login-form"
import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function LoginPage() {
  // Check if user is already logged in and redirect accordingly
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // ... existing logic ...
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    
    // Check if user is admin (either from profile or user metadata)
    const isAdmin = (profile?.role === 'administrator' && profile?.is_active) ||
                   user.user_metadata?.role === 'administrator'
    
    if (isAdmin) {
      redirect('/admin')
    } else {
      redirect('/')
    }
  }

  // Fetch registration setting
  const { data: regSetting } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'user_registration_enabled')
    .single()

  let registrationEnabled = true
  if (regSetting) {
    const value = regSetting.setting_value
    if (typeof value === 'boolean') {
      registrationEnabled = value
    } else if (typeof value === 'string') {
      registrationEnabled = value.toLowerCase().replace(/"/g, '') === 'true'
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href={registrationEnabled ? "/" : "/pros"} className="flex items-center gap-2 font-medium">
            <Image
              src="/images/burpp_logo.png"
              alt="Burpp Logo"
              width={72}
              height={28}
              className="h-5 md:h-9 w-auto"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm registrationEnabled={registrationEnabled} />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/images/auth_client.webp"
          alt="Burpp Client Authentication"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
        {/* Skydiving Pro Tag */}
        <div className="absolute bottom-8 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border-l-4 border-primary">
          <div className="text-sm font-semibold text-white">
            Skydiving Pro
          </div>
          <div className="text-xs text-white/80">
            Gerald From Scottsdale, AZ
          </div>
        </div>
      </div>
    </div>
  )
}


