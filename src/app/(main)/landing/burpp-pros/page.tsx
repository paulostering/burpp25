'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRight, Quote } from 'lucide-react'
import Image from 'next/image'
import type { Category } from '@/types/db'

export default function BurppProsLandingPage() {
  const router = useRouter()
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [businessName, setBusinessName] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Convert all categories (including subcategories) to MultiSelect options
  const categoryOptions: Option[] = useMemo(
    () =>
      allCategories.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [allCategories]
  )

  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load categories')
        return (await r.json()) as Category[]
      })
      .then((data) => {
        // Filter to only show active categories
        const activeCategories = (data ?? []).filter(category => category.is_active === true)
        setAllCategories(activeCategories)
      })
      .catch(() => {
        setAllCategories([])
      })
  }, [])

  const handleCategoryChange = (selected: string[]) => {
    setErrors((prev) => ({ ...prev, service_categories: '' }))
    setSelectedCategoryIds(selected)
  }

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    
    if (!businessName.trim()) {
      newErrors.business_name = 'Business name is required'
    }
    
    if (selectedCategoryIds.length === 0) {
      newErrors.service_categories = 'Select at least one category'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      return
    }

    // Store in localStorage for prefill and indicate we're starting at step 2
    try {
      localStorage.setItem('burpp_vendor_prefill', JSON.stringify({
        businessName: businessName.trim(),
        serviceCategories: selectedCategoryIds,
        startStep: 2, // Indicate we've completed step 1
      }))
    } catch {
      // ignore
    }

    router.push('/vendor-registration')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-gray-200">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          {/* Geometric Background Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Large Circle - Top Left */}
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/8 blur-2xl" />
            
            {/* Medium Circle - Top Right */}
            <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-primary/6" />
            
            {/* Small Circle - Middle Left */}
            <div className="absolute top-1/2 left-20 h-16 w-16 rounded-full bg-primary/10" />
            
            {/* Triangle - Bottom Right */}
            <div className="absolute bottom-20 right-32 h-24 w-24 rotate-45 bg-primary/7" />
            
            {/* Hexagon-like shape - Middle Right */}
            <div className="absolute top-1/3 right-1/4 h-20 w-20 rotate-12 bg-primary/8" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            
            {/* Rounded Rectangle - Bottom Left */}
            <div className="absolute bottom-32 left-1/4 h-12 w-32 rounded-full bg-primary/6 rotate-12" />
            
            {/* Small Circle - Top Center */}
            <div className="absolute top-32 left-1/2 h-12 w-12 rounded-full bg-primary/9 -translate-x-1/2" />
            
            {/* Diamond - Middle Center */}
            <div className="absolute top-2/3 left-1/2 h-16 w-16 rotate-45 bg-primary/7 -translate-x-1/2" />
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* LEFT: Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3 max-w-1xl">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                  Share your skills.
                  <span className="text-primary block"> Grow your business.</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  A simpler way for independent professionals to get discovered, booked, and build real client relationships—without bidding wars, algorithms, or marketplace chaos.
                </p>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-5">
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-semibold">Claim your free profile</h2>
                  <div className="space-y-2">
                    <Label htmlFor="business">Business Name *</Label>
                    <Input 
                      id="business" 
                      value={businessName} 
                      onChange={(e) => {
                        setErrors((prev) => ({ ...prev, business_name: '' }))
                        setBusinessName(e.target.value)
                      }}
                      className={errors.business_name ? 'border-red-500' : ''}
                      placeholder="Enter your business name"
                    />
                    {errors.business_name && (
                      <p className="text-sm text-red-500">{errors.business_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Service Category *</Label>
                    <MultiSelect
                      options={categoryOptions}
                      selected={selectedCategoryIds}
                      onChange={handleCategoryChange}
                      placeholder="Select categories"
                      maxCount={2}
                      className={errors.service_categories ? 'border-red-500' : ''}
                    />
                    {errors.service_categories && (
                      <p className="text-sm text-red-500">{errors.service_categories}</p>
                    )}
                  </div>

                  <Button 
                    className="w-full text-lg px-8 py-3" 
                    size="lg"
                    onClick={handleSubmit}
                  >
                    Continue to registration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND SECTION */}
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* LEFT: Image */}
          <div className="lg:col-span-6">
            <div className="relative flex items-center justify-start">
              <Image
                src="/images/landing.png"
                alt="How Burpp Works"
                width={600}
                height={700}
                className="max-h-[700px] w-auto rounded-lg"
                priority
              />
              {/* Financial Advisor Tag */}
              <div className="absolute bottom-8 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border-l-4 border-primary">
                <div className="text-sm font-semibold text-white">
                  Financial Advisor
                </div>
                <div className="text-xs text-white/80">
                  Miami, FL
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-primary tracking-tight">
                Claim Your Free Burpp Profile
              </h2>
              <h2 className="text-xl md:text-3xl font-medium text-foreground">
                Establish trust and help customers get to know your business
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    1
                  </div>
                  <h3 className="font-semibold">Get Discovered</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-11">
                  Show up when locals are searching for services like yours.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold">Control Your Presence</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-11">
                  Keep your info up to date, add photos, and highlight what makes you unique.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold">Connect Instantly</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-11">
                  Respond to messages and inquiries in real time to win more business.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    4
                  </div>
                  <h3 className="font-semibold">Build Credibility</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-11">
                  Let your profile speak for you with reviews, updates, and clear service offerings.
                </p>
              </div>
            </div>

            <div>
              <Button
                size="lg"
                className="text-lg px-8 py-3"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-16 md:pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Review 1 */}
          <Card className="border border-gray-200 shadow-none relative">
            <CardContent className="px-4 py-3">
              <div className="space-y-2.5">
                <Quote className="h-5 w-5 text-primary opacity-20" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Burpp has completely transformed how I connect with clients. I've booked more jobs in the past month than the previous three months combined."
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">SM</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">Sarah Martinez</div>
                    <div className="text-xs text-muted-foreground">Home Cleaning Pro</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review 2 */}
          <Card className="border border-gray-200 shadow-none relative">
            <CardContent className="px-4 py-3">
              <div className="space-y-2.5">
                <Quote className="h-5 w-5 text-primary opacity-20" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "I love that Burpp lets me offer both virtual and in-person sessions. The messaging feature makes it easy to coordinate with clients."
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">James Davis</div>
                    <div className="text-xs text-muted-foreground">Personal Trainer</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review 3 */}
          <Card className="border border-gray-200 shadow-none relative">
            <CardContent className="px-4 py-3">
              <div className="space-y-2.5">
                <Quote className="h-5 w-5 text-primary opacity-20" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Setting up my profile was quick and free. Within a week, I had my first booking. No commission fees eating into my earnings."
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">EW</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">Emily Wilson</div>
                    <div className="text-xs text-muted-foreground">Event Planner</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3: Ready to meet customers */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Mobile: Stacked Layout */}
        <div className="md:hidden space-y-6">
          <div className="relative h-64 rounded-lg overflow-hidden">
            <Image 
              src="/images/burpp-for-business-3.jpg"
              alt="Ready to meet customers"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-4 right-4 text-white border-l-4 border-primary pl-3 pr-3 py-2 bg-black/40 backdrop-blur-sm">
              <div className="text-sm font-semibold">Drumming Teacher</div>
              <div className="text-xs font-bold">Brooklyn, NY</div>
            </div>
          </div>
          <div className="bg-white rounded-lg">
            <h2 className="text-2xl font-bold text-black mb-3">Ready to meet your new customers?</h2>
            <p className="text-base text-black mb-6">It&apos;s free, easy, and only takes a few minutes.</p>
            <Button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              size="lg"
              className="w-full text-base px-6 py-3"
            >
              Meet Your Next Customer
            </Button>
          </div>
        </div>

        {/* Desktop: Overlay Layout */}
        <div className="hidden md:block relative min-h-[500px] bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" style={{ backgroundImage: "url('/images/burpp-for-business-3.jpg')" }}>
          <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white rounded-lg p-8 max-w-md">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to meet your new customers?</h2>
            <p className="text-xl text-black mb-8">It&apos;s free, easy, and only takes a few minutes.</p>
            <Button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              size="lg"
              className="text-lg px-8 py-3"
            >
              Meet Your Next Customer
            </Button>
          </div>
          <div className="absolute bottom-10 right-10 text-white border-l-4 border-primary pl-4 pr-4 py-2 bg-black/40 backdrop-blur-sm">
            <div className="text-lg font-semibold">Drumming Teacher</div>
            <div className="text-sm font-bold">Brooklyn, NY</div>
          </div>
        </div>
      </div>
    </div>
  )
}


