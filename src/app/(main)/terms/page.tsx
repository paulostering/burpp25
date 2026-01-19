"use client"

import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Scale, Users, MessageSquare, CreditCard, Shield, Mail } from "lucide-react"
import Link from "next/link"

export default function TermsOfService() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm font-bold uppercase tracking-wide mb-6">
              Terms of Service
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Burpp Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              Welcome to Burpp! These Terms of Service govern your access to and use of the Burpp platform.
            </p>
            <p className="text-sm text-primary-foreground/70">
              Effective Date: January 1, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <div className="mb-12">
            <p className="text-lg text-gray-600 mb-4">
              These Terms of Service ("Terms") govern your access to and use of the Burpp website, mobile app, and services (collectively, the "Platform"). By using Burpp, you agree to these Terms.
            </p>
            <p className="text-lg text-gray-600 font-semibold">
              If you don't agree, please don't use the Platform.
            </p>
          </div>

          {/* What We Do */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              1. What We Do
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600">
                  Burpp is a platform that connects people who need services ("Users") with local independent service professionals ("Providers"). We help make the connection—but we do not perform or supervise the services.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium mb-2">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Burpp is not a service provider, employer, or agent of any User or Provider</li>
                    <li>All service agreements, payments, schedules, and outcomes are strictly between Users and Providers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Who Can Use Burpp */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              2. Who Can Use Burpp
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              To use Burpp, you must:
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold mb-2">Age Requirement</p>
                  <p className="text-gray-600 text-sm">Be at least 18 years old</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold mb-2">Accurate Information</p>
                  <p className="text-gray-600 text-sm">Provide accurate, up-to-date information</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold mb-2">Lawful Use</p>
                  <p className="text-gray-600 text-sm">Use the Platform in a respectful and lawful way</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payments */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              3. Payments
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600">
                  All payments for services are handled directly between Users and Providers. Burpp does not process payments, issue invoices, or provide refunds.
                </p>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    We do not take responsibility for any aspect of the payment process, including pricing, refunds, or disputes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews and Content */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              4. Reviews and Content
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Users may leave reviews of Providers they've hired through the Platform. By submitting a review, you agree that:
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-600">Your content is honest, respectful, and based on a real interaction</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-600">You grant Burpp a license to display and use your content across the Platform</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-600">We may remove reviews that violate these Terms or appear fraudulent, abusive, or misleading</p>
              </div>
            </div>
          </div>

          {/* Messaging and Communication */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Messaging and Communication</h2>
            <p className="text-lg text-gray-600 mb-6">
              Burpp may provide a messaging feature that allows Users and Providers to communicate directly.
            </p>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4 font-medium">You agree to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Use this feature respectfully and for its intended purpose</li>
                  <li>Not send spam, solicitations, or inappropriate content</li>
                </ul>
                <p className="text-gray-600 mt-4 text-sm italic">
                  We reserve the right to monitor communications for safety and misuse.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Burpp's Role */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              6. Burpp's Role and Responsibilities
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              We do our best to ensure Burpp is a helpful, safe, and functional platform. However:
            </p>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg space-y-3">
              <p className="text-gray-700">• We do not guarantee the quality, safety, legality, or availability of services provided by Providers</p>
              <p className="text-gray-700">• We do not verify any claims, qualifications, or credentials</p>
              <p className="text-gray-700">• We are not liable for damages, losses, or disputes that arise between Users and Providers</p>
              <p className="text-gray-900 font-bold mt-4">You use Burpp at your own risk.</p>
            </div>
          </div>

          {/* Termination */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Termination</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  We reserve the right to suspend or terminate your account if you violate these Terms, misuse the platform, or engage in behavior we find inappropriate or harmful.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Changes to Terms */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Changes to These Terms</h2>
            <p className="text-lg text-gray-600 mb-4">
              We may update these Terms from time to time. When we do, we'll update the "Effective Date" above.
            </p>
            <p className="text-lg text-gray-600 font-semibold">
              Continued use of the Platform after changes means you accept the revised Terms.
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Questions?</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Contact Us</p>
                    <p className="text-gray-600">
                      If you have questions about these Terms, contact us at:{' '}
                      <a href="mailto:support@burpp.com" className="text-primary hover:underline">
                        support@burpp.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}

