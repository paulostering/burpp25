'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Quote, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function BurppProsLandingPage() {
  const router = useRouter()

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
          {/* Single Left Column */}
          <div className="max-w-2xl">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-normal tracking-tight">
                  Share your skills.
                  <span className="font-bold text-primary block">Grow your business.</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  A simpler way for independent professionals to get discovered, booked, and build real client relationships—without bidding wars, algorithms, or marketplace chaos.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 items-center">
                <Button 
                  className="text-lg px-8 py-3 w-full md:w-auto" 
                  size="lg"
                  onClick={() => router.push('/vendor-registration')}
                >
                  Claim Your Free Profile
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-sm italic text-muted-foreground whitespace-nowrap">
                  No Credit Card Required
                </p>
              </div>
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
                src="/images/vendor_landing_locksmith.png"
                alt="Burpp Professional Locksmith"
                width={600}
                height={700}
                className="max-h-[700px] w-auto rounded-lg"
                priority
              />
              {/* Locksmith Tag */}
              <div className="absolute bottom-8 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border-l-4 border-primary">
                <div className="text-sm font-semibold text-white">
                  Locksmith
                </div>
                <div className="text-xs text-white/80">
                  Brooklyn, NY
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
                  "I didn't realize how much time I was wasting bouncing between Google, texts, and recommendations until I tried Burpp. It's such a relief to have one place where real service providers actually exist and are easy to find. It feels like someone finally built something for real life."
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">EN</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">Elizabeth N.</div>
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
                  "Burpp solves a problem I complain about all the time: knowing I need help, but not wanting to hunt for it. The platform feels intuitive, modern, and actually useful. It's not overwhelming. It just works—and that alone makes it stand out."
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">AH</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">Alex H.</div>
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
                  "What I love about Burpp is that it connects people who need things done with independent professionals in a way that feels human, not corporate. It feels like a smarter, calmer way to get help—without the usual friction."
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">BM</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">Brenda M.</div>
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
              src="/images/vendor-photographer.jpeg"
              alt="Ready to meet customers"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-4 right-4 text-white border-l-4 border-primary pl-3 pr-3 py-2 bg-black/40 backdrop-blur-sm">
              <div className="text-sm font-semibold">Photographer</div>
              <div className="text-xs font-bold">San Diego, CA</div>
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
        <div className="hidden md:block relative min-h-[500px] bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden" style={{ backgroundImage: "url('/images/vendor-photographer.jpeg')" }}>
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
            <div className="text-lg font-semibold">Photographer</div>
            <div className="text-sm font-bold">San Diego, CA</div>
          </div>
        </div>
      </div>
    </div>
  )
}


