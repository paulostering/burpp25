"use client"

import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function BurppForBusiness() {
  const router = useRouter()
  
  return (
    <div className="space-y-24">
        <div className="min-h-screen bg-white">
          {/* Hero Section */}
          <div className="relative bg-gray-100 rounded-bl-3xl overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/burpp-for-business.jpg"
                alt="Hero Background"
                fill
                className="object-cover"
                priority
              />
            </div>
            
            <div className="relative z-10 mx-auto max-w-6xl pt-24 md:pt-48 px-6">
              <div className="text-left mb-8 max-w-3xl">
                <h1 className="text-5xl font-bold mb-4 text-white">
                  Share your skills. Grow your business.
                </h1>
                <p className="text-xl text-white">
                  Join a community of local pros offering services in person or online. With Burpp, it&apos;s free to connect, chat, and get booked.
                </p>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={() => router.push('/vendor-registration')}
                  size="lg"
                  className="text-lg px-8 py-3"
                >
                  Get Started Today
                </Button>
              </div>
              
              {/* Dog Walker Tag - Inline */}
              <div className="mt-4 flex items-center mt-16 md:mt-36 mb-12">
                <div className="bg-black/50 backdrop-blur-sm pl-4 pr-8 py-4 shadow-lg border-l-4 border-primary">
                  <div className="text-lg font-medium text-white">
                    Dog Walker Extraordinaire
                  </div>
                  <div className="text-xs text-white/80">
                    Claire From Los Angeles, California
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Claim Your Profile */}
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-16 items-center">
              <div className="relative flex items-center justify-start md:col-span-2">
                <Image 
                  alt="Claim Your Profile" 
                  className="max-h-[700px] w-auto rounded-lg" 
                  src="/images/burpp-for-business-2.jpg"
                  width={600}
                  height={700}
                />
                <div className="absolute bottom-10 left-10 text-white border-l-4 border-primary pl-4 pr-4 py-2 bg-black/30">
                  <div className="text-lg font-semibold">Expert Mixologist</div>
                  <div className="text-sm font-bold">Roberto Diego - Miami,Florida</div>
                </div>
              </div>
              <div className="md:col-span-3">
                <h2 className="text-sm uppercase font-semibold text-gray-600 mb-4">Claim Your Free Burpp Profile</h2>
                <h3 className="text-2xl font-bold mb-4">Reach Local Customers Who Are Searching for Your Services</h3>
                <p className="text-lg mb-8">Build trust, showcase your business, and connect with real clients—without spending a dime.</p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="size-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Get Discovered</h4>
                      <p>Show up when locals are searching for services like yours.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="size-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Control Your Presence</h4>
                      <p>Keep your info up to date, add photos, and highlight what makes you unique.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="size-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Connect Instantly</h4>
                      <p>Respond to messages and inquiries in real time to win more business.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="size-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Build Credibility</h4>
                      <p>Let your profile speak for you with reviews, updates, and clear service offerings.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Button 
                    onClick={() => router.push('/vendor-registration')}
                    size="lg"
                    className="text-lg px-8 py-3"
                  >
                    Grow Your Business with Burpp
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Ready to meet customers */}
          <div className="max-w-7xl mx-auto px-4 pb-16">
            <div className="relative min-h-[500px] bg-cover bg-center bg-no-repeat rounded-lg" style={{ backgroundImage: "url('/images/burpp-for-business-3.jpg')" }}>
              <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white rounded-lg p-8 max-w-md">
                <h2 className="text-3xl font-bold text-black mb-4">Ready to meet your new customers?</h2>
                <p className="text-xl text-black mb-8">It&apos;s free, easy, and only takes a few minutes.</p>
                <Button 
                  onClick={() => router.push('/vendor-registration')}
                  size="lg"
                  className="text-lg px-8 py-3"
                >
                  Meet Your Next Customer
                </Button>
              </div>
              <div className="absolute bottom-10 right-10 text-white border-l-4 border-primary pl-4 pr-4 py-2 bg-black/30">
                <div className="text-lg font-semibold">Drumming Teacher</div>
                <div className="text-sm font-bold">Brooklyn, NY</div>
              </div>
            </div>
          </div>
        </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
