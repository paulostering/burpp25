"use client"

import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Scale, Users, Shield, Mail, AlertTriangle, Gavel, CreditCard, XCircle, FileCheck, DollarSign } from "lucide-react"

export default function VendorTermsOfService() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm font-bold uppercase tracking-wide mb-6">
              Vendor Terms of Service
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Burpp Vendor Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              These Vendor Terms govern your access to and use of the Burpp platform as a service provider.
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
              By creating a Vendor account or listing services on Burpp, you acknowledge that you have read, understood, and agreed to these Vendor Terms.
            </p>
            <p className="text-lg text-gray-600 font-semibold">
              If you do not agree, do not register as a Vendor or use the Platform in this capacity.
            </p>
          </div>

          {/* Burpp's Role */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              1. Burpp's Role
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Burpp is a technology platform that connects independent service providers with individuals seeking services ("Users").
            </p>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 font-semibold mb-3">Burpp does not:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Provide services</li>
                  <li>Supervise or manage services</li>
                  <li>Employ Vendors</li>
                  <li>Act as an agent, broker, or representative of Vendors or Users</li>
                  <li>Guarantee work, payment, safety, or outcomes</li>
                </ul>
                <div className="bg-primary/10 p-4 rounded-lg mt-4">
                  <p className="text-gray-700 font-medium">
                    Burpp's role is strictly limited to facilitating introductions between Vendors and Users.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Independent Contractor */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              2. Vendor Status and Independent Contractor Relationship
            </h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 font-semibold mb-3">You acknowledge and agree that:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>You are an independent contractor, not an employee, agent, partner, or representative of Burpp</li>
                    <li>You operate your own independent business</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 font-semibold mb-3">You are solely responsible for:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>How services are performed</li>
                    <li>Pricing, scheduling, and scope of work</li>
                    <li>Any required licenses, permits, certifications, or insurance</li>
                    <li>Compliance with all applicable laws and regulations</li>
                  </ul>
                </CardContent>
              </Card>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-medium">
                  Nothing in these Vendor Terms creates an employment, partnership, or joint venture relationship with Burpp.
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Eligibility Requirements</h2>
            <p className="text-lg text-gray-600 mb-6">
              To use Burpp as a Vendor, you must:
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
                  <p className="font-semibold mb-2">Legal Authorization</p>
                  <p className="text-gray-600 text-sm">Be legally permitted to provide the services you list</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold mb-2">Accurate Information</p>
                  <p className="text-gray-600 text-sm">Provide accurate, current, and complete information</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-gray-600 mt-6 italic text-sm">
              Burpp reserves the right to suspend or terminate accounts that do not meet these requirements.
            </p>
          </div>

          {/* Vendor Responsibilities */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              4. Vendor Responsibilities and Assumption of Risk
            </h2>
            
            <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-lg mb-6">
              <p className="text-gray-700 font-semibold mb-3">You acknowledge that:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Users are independent third parties</li>
                <li>Burpp does not conduct background checks, screenings, or verifications of Users</li>
                <li>Burpp does not conduct background checks, screenings, or verifications of Vendors unless explicitly stated otherwise</li>
              </ul>
              <p className="text-gray-900 font-bold mt-4">
                All interactions with Users occur at your own risk.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 font-semibold mb-3">You are solely responsible for:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Deciding whether to accept or decline service requests</li>
                  <li>Assessing safety, legality, and suitability of any job</li>
                  <li>Conducting your own due diligence before providing services</li>
                  <li>Establishing your own terms or agreements with Users</li>
                </ul>
              </CardContent>
            </Card>

            <p className="text-gray-600 mt-6 italic">
              Burpp makes no representations or warranties regarding User behavior, safety conditions, or payment reliability.
            </p>
          </div>

          {/* Prohibited Services */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <XCircle className="h-8 w-8 text-primary" />
              5. Prohibited Services
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Vendors may not offer, list, or perform services that are:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-2">
                <p className="text-gray-700">Illegal or unlawful under applicable local, state, or federal law</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-2">
                <p className="text-gray-700">Sexually explicit, exploitative, or abusive</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-2">
                <p className="text-gray-700">Fraudulent, deceptive, or misleading</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-2">
                <p className="text-gray-700">Violent, dangerous, or otherwise high-risk in nature</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-2">
                <p className="text-gray-700">Prohibited by Burpp policies or determined inappropriate at Burpp's sole discretion</p>
              </div>
            </div>
            <p className="text-gray-600 mt-6 font-medium">
              Burpp reserves the right to remove listings, suspend accounts, or terminate access for violations of this section.
            </p>
          </div>

          {/* Payments */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              6. Payments and Financial Responsibility
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              All payments are handled directly between you and the User.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Burpp:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                    <li>Does not process payments</li>
                    <li>Does not collect fees</li>
                    <li>Does not issue invoices</li>
                    <li>Does not provide refunds</li>
                    <li>Does not mediate disputes</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Burpp is not responsible for:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                    <li>Non-payment or late payment</li>
                    <li>Pricing disputes</li>
                    <li>Cancellations or no-shows</li>
                    <li>Chargebacks or financial losses</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* No Guarantee */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. No Guarantee of Work or Platform Availability</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 font-semibold mb-3">Burpp does not guarantee:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Any minimum number of service requests</li>
                  <li>Any level of income or earnings</li>
                  <li>Continued visibility or access to Users</li>
                  <li>Uninterrupted or error-free access to the Platform</li>
                </ul>
                <p className="text-gray-600 mt-4 text-sm italic">
                  The Platform may be unavailable from time to time due to maintenance, updates, or technical issues.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Content */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileCheck className="h-8 w-8 text-primary" />
              8. Vendor Content and License
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600">
                  You retain ownership of the content you submit to Burpp, including listings, descriptions, and profile information.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium mb-2">By submitting content, you grant Burpp a non-exclusive, royalty-free, worldwide license to:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                    <li>Display, promote, distribute, and use such content for operating the Platform</li>
                    <li>Market or promote Burpp</li>
                    <li>Display Vendor services to Users</li>
                  </ul>
                </div>
                <p className="text-gray-600 text-sm italic">
                  Burpp may remove or modify content that violates these Vendor Terms or applicable law.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              9. Limitation of Liability
            </h2>
            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg space-y-4">
              <p className="text-gray-700 font-bold">
                To the fullest extent permitted by law, Burpp is not liable for any claims, damages, losses, injuries, or disputes arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Your services</li>
                <li>Interactions with Users</li>
                <li>Property damage or personal injury</li>
                <li>Theft, fraud, or misconduct</li>
                <li>Failure to receive payment</li>
                <li>Any agreements between you and a User</li>
              </ul>
              <p className="text-gray-900 font-bold mt-4">
                Burpp shall not be liable for direct, indirect, incidental, consequential, or punitive damages.
              </p>
            </div>
          </div>

          {/* Indemnification */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Indemnification</h2>
            <div className="bg-amber-50 border border-amber-300 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                You agree to indemnify, defend, and hold harmless Burpp, its owners, officers, employees, and affiliates from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Your services</li>
                <li>Your content</li>
                <li>Your interactions with Users</li>
                <li>Your violation of these Vendor Terms</li>
                <li>Your violation of any law or regulation</li>
              </ul>
            </div>
          </div>

          {/* Governing Law */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Gavel className="h-8 w-8 text-primary" />
              11. Governing Law and Dispute Resolution
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600">
                  These Vendor Terms are governed by the laws of the <span className="font-bold">State of New York</span>, without regard to conflict of law principles.
                </p>
                <p className="text-gray-600">
                  Any dispute arising out of or relating to these Vendor Terms or use of the Platform shall be resolved exclusively in the courts located in Kings County, New York, unless Burpp elects to require binding arbitration.
                </p>
                <p className="text-gray-600">
                  You waive any right to participate in class actions or representative proceedings against Burpp.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Account Suspension */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-primary" />
              12. Account Suspension or Termination
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Burpp may suspend or terminate your Vendor account at any time if you:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Violate these Vendor Terms</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Offer prohibited services</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Engage in unsafe, abusive, fraudulent, or unlawful behavior</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-gray-600">Harm Burpp's reputation or platform integrity</p>
              </div>
            </div>
            <p className="text-gray-600 mt-6 italic">
              Termination does not eliminate obligations incurred prior to termination.
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">13. Changes to Vendor Terms</h2>
            <p className="text-lg text-gray-600 mb-4">
              Burpp may update these Vendor Terms at any time.
            </p>
            <p className="text-lg text-gray-600 font-semibold">
              Continued use of the Platform after updates constitutes acceptance of the revised terms.
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
                      Questions about these Vendor Terms may be directed to:{' '}
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

