"use client"

import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CheckCircle, Users, MapPin, Clock } from "lucide-react"

export default function AboutUs() {
  const router = useRouter()
  
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="text-center space-y-8">
          <Badge className="bg-primary text-primary-foreground border-0 text-sm font-bold uppercase tracking-wide">
            About Burpp
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Connecting You to the Pros Who Keep Life Moving
          </h1>
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-600 leading-relaxed">
              At Burpp, we believe in the power of people helping people. Whether you're looking for a trusted massage therapist, a reliable dog sitter, or a top-notch tattoo artist—our goal is to make it easy to find the right pro for the job.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Fast. Local. Reliable.
            </h2>
            
            <div className="space-y-4">
              <p className="text-lg text-gray-600 leading-relaxed">
                We're not an agency. We're not a middleman.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Just a simple, no-fluff platform that connects you directly with independent service providers in your area—fast, reliable, and hassle-free.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Burpp was born from a simple observation: finding reliable local service providers shouldn't be complicated.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We cut through the noise of traditional service platforms to create something better—a direct connection between you and the professionals who can help make your life easier.
              </p>
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => router.push('/signup')}
                size="lg"
                className="text-lg px-8 py-3"
              >
                Join Burpp Today
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <Image
              src="/images/about-burpp.webp"
              alt="About Burpp"
              width={600}
              height={450}
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose Burpp?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built our platform around three core principles that make finding and connecting with local pros effortless.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center p-8 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Fast</h3>
                <p className="text-gray-600">
                  Find and connect with local professionals in minutes, not hours. No lengthy signup processes or complicated forms.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Local</h3>
                <p className="text-gray-600">
                  Connect with verified professionals in your neighborhood. Support local businesses and build community connections.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Reliable</h3>
                <p className="text-gray-600">
                  Every professional on our platform is verified and reviewed. Quality service you can trust, every time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6">
        <Card className="bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground border-0">
          <CardContent className="text-center py-16 px-8">
            <div className="space-y-6 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Find Your Next Pro?
              </h2>
              <p className="text-xl opacity-90">
                Join thousands of people who trust Burpp to connect them with the best local professionals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/signup')}
                  variant="secondary"
                  size="lg"
                  className="text-lg px-8 py-3"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
