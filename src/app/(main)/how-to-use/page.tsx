"use client"

import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Search, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function HowToUse() {
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)
  
  // Redirect to /pros if registration is disabled
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'user_registration_enabled')
          .single()

        let registrationEnabled = true
        if (data) {
          const value = data.setting_value
          if (typeof value === 'boolean') {
            registrationEnabled = value
          } else if (typeof value === 'string') {
            registrationEnabled = value.toLowerCase().replace(/"/g, '') === 'true'
          }
        }

        if (!registrationEnabled) {
          router.replace('/pros')
          return
        }
        
        setShouldRender(true)
      } catch (error) {
        setShouldRender(true)
      }
    }

    checkAndRedirect()
  }, [router])
  
  if (!shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[30vw] flex items-end justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/how-it-works-hero.webp"
            alt="How to Use Burpp"
            fill
            className="object-cover object-center md:object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center pb-16 px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            3 Simple Steps to Get What You Need—No Headache, No Hassle
          </h1>
        </div>
      </section>

      {/* Steps Section */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="space-y-16">
          {/* Step 1 */}
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">1</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Discover Local Experts
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Browse highly-rated service providers by category, location, and reviews. From photographers to personal trainers, you'll find exactly who (and what) you're looking for.
              </p>
            </div>
            <div className="relative">
              <Image
                src="/images/how-it-works-1.webp"
                alt="Discover Local Experts"
                width={600}
                height={450}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="relative order-2 md:order-1">
              <Image
                src="/images/how-it-works-2.webp"
                alt="Message & Coordinate Directly"
                width={600}
                height={450}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">2</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Message & Coordinate Directly
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                No middlemen. No markups. Just direct communication. Reach out to the pro, ask your questions, and coordinate your needs in real time.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">3</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Hire with Confidence
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                When you're ready, go ahead and book! Payments and scheduling happen directly between you and your chosen pro.
              </p>
            </div>
            <div className="relative">
              <Image
                src="/images/how-it-works-3.webp"
                alt="Hire with Confidence"
                width={600}
                height={450}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Burpp Works Better
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've simplified the process of finding and hiring local professionals.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="text-center p-8 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No Middlemen</h3>
                <p className="text-gray-600">
                  Connect directly with professionals. No agencies, no hidden fees, no complicated processes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Real Communication</h3>
                <p className="text-gray-600">
                  Ask questions, discuss your needs, and get personalized responses from real professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
