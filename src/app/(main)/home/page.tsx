"use client"

import { SearchHero } from "@/components/search-hero"
import { Footer } from "@/components/footer"
import { FeaturedCategories } from "@/components/featured-categories"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  
  return (
    <div className="space-y-24">
      {/* Section 1: Hero */}
      <SearchHero />

      {/* Section 2: Popular services near you */}
      <section className="mx-auto max-w-6xl px-6">
        <h2 className="mb-4 text-2xl font-semibold">Popular services near you</h2>
        <FeaturedCategories />
      </section>

      {/* Section 3: How it works */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
          {/* Col 1: Image - Full height */}
          <div className="flex items-center justify-start relative">
            <Image
              src="/images/home-1.jpeg"
              alt="How Burpp Works"
              width={600}
              height={700}
              className="max-h-[700px] w-auto rounded-lg"
              priority
            />
            {/* Master Florist Tag */}
            <div className="absolute bottom-8 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border-l-4 border-primary">
              <div className="text-sm font-semibold text-white">
                Master Florist
              </div>
              <div className="text-xs text-white/80">
                Bentonville, AR
              </div>
            </div>
          </div>
          {/* Col 2: Content - Full height */}
          <div className="flex flex-col justify-center">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Simple & Straightforward</p>
            <h3 className="mt-2 text-5xl font-semibold">How Burpp Works</h3>
            <p className="mt-2 text-muted-foreground">
              Connect with skilled professionals in your area in just a few simple steps.
            </p>
            <ol className="mt-6 space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <div className="font-medium">Discover Local Experts</div>
                  <p className="text-muted-foreground">Browse trusted professionals by service category, location, and reviews.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <div className="font-medium">Message & Coordinate Directly</div>
                  <p className="text-muted-foreground">Reach out to providers to discuss availability, pricing, and specific needs.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <div className="font-medium">Hire with Confidence</div>
                  <p className="text-muted-foreground">Once you’ve found the right fit, handle booking and payment directly with your pro</p>
                </div>
              </li>
            </ol>
            <div className="mt-6">
              <Button onClick={() => router.push('/signup')}>Join Burpp Today</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Full-width CTA */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/images/home-2.jpeg"
              alt="Massage therapy background"
              fill
              className="object-cover"
              priority
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-12 md:p-24">
            <div className="max-w-3xl space-y-4 text-left">
              <h3 className="text-5xl font-semibold text-white">Find your next anything</h3>
              <p className="text-xl text-white/90">
                Join Burpp free today and instantly connect with verified local experts for any service you need.
              </p>
              <Button variant="secondary" onClick={() => router.push('/signup')}>Sign Up</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
