"use client"

import { Suspense } from "react"
import { SearchHero } from "@/components/search-hero"
import { Footer } from "@/components/footer"
import { FeaturedCategories } from "@/components/featured-categories"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

function HomeContent() {
  const router = useRouter()
  
  return (
    <div className="space-y-24">
      {/* Section 1: Hero */}
      <SearchHero />

      {/* Section 2: Popular services near you */}
      <section className="mx-auto max-w-6xl px-6">
        <h3 className="mt-2 text-3xl font-semibold mb-6">Find a Burpp Pro Near You</h3>
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
            <h3 className="text-3xl font-semibold">How Burpp Works</h3>
            <p className="mt-4 text-xl text-muted-foreground">
              Connect with skilled professionals in your area in just a few simple steps.
            </p>
            <ol className="mt-8 space-y-8">
              <li className="flex items-start gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
                  1
                </div>
                <div>
                  <div className="text-xl font-medium">Discover Local Experts</div>
                  <p className="text-lg text-muted-foreground mt-2">Browse trusted professionals by service category, location, and reviews.</p>
                </div>
              </li>
              <li className="flex items-start gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
                  2
                </div>
                <div>
                  <div className="text-xl font-medium">Message & Coordinate Directly</div>
                  <p className="text-lg text-muted-foreground mt-2">Reach out to providers to discuss availability, pricing, and specific needs.</p>
                </div>
              </li>
              <li className="flex items-start gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
                  3
                </div>
                <div>
                  <div className="text-xl font-medium">Hire with Confidence</div>
                  <p className="text-lg text-muted-foreground mt-2">Once you've found the right fit, handle booking and payment directly with your pro</p>
                </div>
              </li>
            </ol>
            {/* <div className="mt-6">
              <Button onClick={() => router.push('/signup')}>Join Today</Button>
            </div> */}
          </div>
        </div>
      </section>

     

      {/* Section 5: Find Your Next Anything - Profile Section */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">
              Find Your Next{' '}
              <span className="text-primary">Anything</span>
            </h3>
            <p className="text-lg text-muted-foreground">
              Burpp makes it easy to connect with trusted local professionals – from fitness instructors and poker dealers to home improvement specialists. Whatever you need, we've got you covered.
            </p>
            <Button onClick={() => router.push('/signup')} className="mt-4">
              Find Your Next Burpp Pro
            </Button>
          </div>

          {/* Right: Profile Images */}
          <div className="flex items-center justify-center">
            <Image
              src="/images/home-burpp-pros.png"
              alt="Burpp Professionals"
              width={400}
              height={400}
              className="max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
