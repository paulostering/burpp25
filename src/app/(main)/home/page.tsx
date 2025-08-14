"use client"

import { SearchHero } from "@/components/search-hero"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  
  return (
    <div className="space-y-24">
      {/* Section 1: Hero */}
      <SearchHero />

      {/* Section 2: Popular services near you */}
      <section className="mx-auto max-w-5xl px-4">
        <h2 className="mb-4 text-2xl font-semibold">Popular services near you</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border bg-card p-4 text-center text-sm flex items-center justify-center"
            >
              Featured
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: How it works */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Col 1: Image placeholder */}
          <div className="rounded-lg border bg-muted/30 h-64 md:h-full" />
          {/* Col 2: Content spans two columns on md+ */}
          <div className="md:col-span-2">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Simple & Straightforward</p>
            <h3 className="mt-2 text-3xl font-semibold">How Burpp Works</h3>
            <p className="mt-2 text-muted-foreground">
              Connect with skilled professionals in your area in just a few simple steps.
            </p>
            <ol className="mt-6 space-y-4">
              <li>
                <div className="font-medium">1 · Discover Local Experts</div>
                <p className="text-muted-foreground">Browse trusted professionals by service category, location, and reviews..</p>
              </li>
              <li>
                <div className="font-medium">2 · Message & Coordinate Directly</div>
                <p className="text-muted-foreground">Reach out to providers to discuss availability, pricing, and specific needs.</p>
              </li>
              <li>
                <div className="font-medium">3 · Hire with Confidence</div>
                <p className="text-muted-foreground">Once you’ve found the right fit, handle booking and payment directly with your pro.</p>
              </li>
            </ol>
            <div className="mt-6">
              <Button onClick={() => router.push('/signup')}>Get Started</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Full-width CTA */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <h3 className="text-3xl font-semibold">Find your next anything</h3>
            <p>
              Join Burpp free today and instantly connect with verified local experts for any service you need.
            </p>
            <Button variant="secondary" onClick={() => router.push('/signup')}>Sign Up</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
