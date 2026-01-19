"use client"

import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Scale, Users, MessageSquare, CreditCard, Shield, Mail, AlertTriangle, Gavel } from "lucide-react"

export default function TermsOfService() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm font-bold uppercase tracking-wide mb-6">
              User Terms of Service
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Burpp User Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              Welcome to Burpp. These User Terms govern your access to and use of the Platform as a customer seeking services.
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
              By creating a User account or using the Platform, you acknowledge that you have read, understood, and agreed to these User Terms.
            </p>
            <p className="text-lg text-gray-600 font-semibold">
              If you do not agree, do not use the Platform.
            </p>
          </div>

          {/* What Burpp Is */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              1. What Burpp Is (and Is Not)
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Burpp is a technology platform that connects individuals seeking services with independent service providers ("Vendors").
            </p>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 font-semibold mb-3">Burpp does not:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Provide services</li>
                  <li>Employ Vendors</li>
                  <li>Supervise or manage Vendors</li>
                  <li>Act as an agent or representative of Vendors</li>
                  <li>Guarantee service quality, safety, pricing, availability, or outcomes</li>
                </ul>
                <p className="text-gray-700 font-medium mt-4">
                  All services are provided by independent third-party Vendors, not Burpp.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Eligibility */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              2. Eligibility
            </h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-2">
                  You must be at least <span className="font-bold">18 years old</span> to create a User account or use the Platform.
                </p>
                <p className="text-gray-600">
                  By using Burpp, you represent and warrant that you meet this requirement.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Independent Vendor Relationship */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Independent Vendor Relationship</h2>
            <p className="text-lg text-gray-600 mb-6">
              You acknowledge and agree that:
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-600">Vendors are independent professionals, not employees, agents, or representatives of Burpp</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-600">Burpp does not verify Vendor qualifications, licenses, certifications, insurance, or background information</p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-600">Any agreement, communication, or transaction you enter into is solely between you and the Vendor</p>
              </div>
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">
                Burpp is not a party to, and has no responsibility for, any agreement or dispute between you and a Vendor.
              </p>
            </div>
          </div>

          {/* User Responsibility */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              4. User Responsibility and Assumption of Risk
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">You acknowledge that:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                    <li>You choose Vendors at your own discretion</li>
                    <li>Interactions with Vendors involve inherent risk</li>
                    <li>Burpp does not guarantee Vendor behavior, performance, or reliability</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">You are responsible for:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                    <li>Evaluating Vendors before hiring</li>
                    <li>Confirming pricing, scope of work, and expectations</li>
                    <li>Taking reasonable safety precautions when engaging services</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payments */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              5. Payments and Service Arrangements
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              All payments, scheduling, cancellations, and refunds are handled directly between you and the Vendor.
            </p>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 font-semibold mb-3">Burpp:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Does not process payments</li>
                  <li>Does not set prices</li>
                  <li>Does not issue invoices</li>
                  <li>Does not provide refunds</li>
                  <li>Does not mediate disputes</li>
                </ul>
                <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium">
                    Burpp is not responsible for payment disputes, unsatisfactory services, cancellations, or no-shows.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prohibited Use */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-primary" />
              6. Prohibited Use and User Conduct
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              You agree not to:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Use the Platform for unlawful, fraudulent, or deceptive purposes</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Harass, threaten, abuse, or harm Vendors or other users</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Misrepresent your identity, intent, or information</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Attempt to hold Burpp responsible for Vendor services or outcomes</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Interfere with the security, integrity, or operation of the Platform</p>
              </div>
            </div>
            <p className="text-gray-600 mt-6 italic">
              Burpp reserves the right to suspend or terminate accounts that violate this section.
            </p>
          </div>

          {/* Reviews */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              7. Reviews and User Content
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Users may submit reviews or other content related to Vendors.
            </p>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 font-semibold mb-3">By submitting content, you agree that:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Your content is honest and based on a real experience</li>
                  <li>You are solely responsible for your statements</li>
                  <li>Your content does not contain false, misleading, defamatory, or abusive material</li>
                </ul>
                <p className="text-gray-600 mt-4 text-sm italic">
                  Burpp is not responsible for user-generated content and may remove or modify reviews at its discretion, with or without notice.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer of Warranties */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Disclaimer of Warranties</h2>
            <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                The Platform is provided on an <span className="font-bold">"AS IS"</span> and <span className="font-bold">"AS AVAILABLE"</span> basis.
              </p>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, Burpp disclaims all warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p className="text-gray-700">
                Burpp does not warrant that the Platform will be uninterrupted, error-free, secure, or free of defects.
              </p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              9. Limitation of Liability
            </h2>
            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg space-y-4">
              <p className="text-gray-700 font-bold">
                To the fullest extent permitted by law, Burpp is not liable for any claims, damages, losses, injuries, or disputes arising out of or related to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Services provided by Vendors</li>
                <li>Acts or omissions of Vendors</li>
                <li>Property damage or personal injury</li>
                <li>Theft, fraud, or misconduct</li>
                <li>Misrepresentation by Vendors</li>
                <li>Disputes between Users and Vendors</li>
              </ul>
              <p className="text-gray-900 font-bold mt-4">
                Burpp shall not be liable for direct, indirect, incidental, consequential, or punitive damages of any kind.
              </p>
            </div>
          </div>

          {/* Emergency Disclaimer */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Emergency Disclaimer</h2>
            <div className="bg-red-100 border-2 border-red-500 p-6 rounded-lg">
              <p className="text-red-900 font-bold text-lg mb-2">
                ⚠️ Burpp is not an emergency or safety response service.
              </p>
              <p className="text-red-800">
                If you believe you are in danger or require immediate assistance, contact local emergency services.
              </p>
            </div>
          </div>

          {/* Dispute Resolution */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Gavel className="h-8 w-8 text-primary" />
              11. Dispute Resolution; Arbitration Agreement; Class Action Waiver
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600">
                  Any dispute arising out of or relating to these User Terms or your use of the Platform shall be resolved through <span className="font-bold">binding arbitration</span>, rather than in court, except where prohibited by law.
                </p>
                <p className="text-gray-600">
                  You waive any right to a jury trial and agree that disputes may be brought only in an individual capacity, and not as part of a class, collective, or representative action.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p className="text-gray-700 font-medium">
                    These User Terms are governed by the laws of the State of New York, without regard to conflict of law principles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Suspension */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">12. Account Suspension or Termination</h2>
            <p className="text-lg text-gray-600 mb-6">
              Burpp may suspend or terminate your User account if you:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-600 text-sm">Violate these User Terms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-600 text-sm">Misuse the Platform</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-600 text-sm">Engage in abusive, fraudulent, or unlawful behavior</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-600 text-sm">Attempt to hold Burpp responsible for Vendor actions or outcomes</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Changes to Terms */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">13. Changes to These User Terms</h2>
            <p className="text-lg text-gray-600 mb-4">
              Burpp may update these User Terms from time to time.
            </p>
            <p className="text-lg text-gray-600 font-semibold">
              Continued use of the Platform after changes are posted constitutes acceptance of the revised terms.
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">14. Contact Information</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Questions?</p>
                    <p className="text-gray-600">
                      If you have questions about these User Terms, contact:{' '}
                      <a href="mailto:support@burpp.com" className="text-primary hover:underline font-bold">
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

