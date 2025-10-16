"use client"

import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Shield, Eye, Lock, Users, Globe } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicy() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm font-bold uppercase tracking-wide mb-6">
              Privacy Policy
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Privacy Matters
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              We're committed to protecting your personal information and being transparent about how we collect, use, and share your data.
            </p>
            <p className="text-sm text-primary-foreground/70">
              Last Updated: January 1, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Introduction</h2>
            <p className="text-lg text-gray-600 mb-4">
              This Privacy Policy describes our policies on the collection, use, and disclosure of information about you in connection with your use of Burpp's services, including our website, mobile applications, and communications (collectively, the "Service").
            </p>
            <p className="text-lg text-gray-600 mb-4">
              The terms "we", "us", and "Burpp" refer to Burpp Inc., a company dedicated to connecting you with local service professionals. When you use the Service, you consent to our collection, use, and disclosure of information about you as described in this Privacy Policy.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Table of Contents</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Link href="#information-we-collect" className="block text-primary hover:underline">1. Information We Collect and How We Use It</Link>
                <Link href="#cookies" className="block text-primary hover:underline">2. Cookies and Tracking</Link>
                <Link href="#third-parties" className="block text-primary hover:underline">3. Third Parties</Link>
                <Link href="#controlling-data" className="block text-primary hover:underline">4. Controlling Your Personal Data</Link>
              </div>
              <div className="space-y-2">
                <Link href="#data-retention" className="block text-primary hover:underline">5. Data Retention and Account Termination</Link>
                <Link href="#children" className="block text-primary hover:underline">6. Children's Privacy</Link>
                <Link href="#security" className="block text-primary hover:underline">7. Security</Link>
                <Link href="#contact" className="block text-primary hover:underline">8. Contact Information</Link>
              </div>
            </div>
          </div>

          {/* Information We Collect */}
          <div id="information-we-collect" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Information We Collect and How We Use It</h2>
            <p className="text-lg text-gray-600 mb-6">
              We may collect, transmit, and store information about you in connection with your use of the Service. We use that information to provide the Service's functionality, fulfill your requests, improve the Service's quality, engage in research and analysis, personalize your experience, and provide customer support.
            </p>

            <div className="space-y-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Account Information
                  </h3>
                  <p className="text-gray-600 mb-4">
                    When you create a Burpp account, we store and use the information you provide during registration, such as your name, email address, phone number, and location. We may publicly display your first name and profile photo as part of your account profile.
                  </p>
                  <p className="text-gray-600">
                    You can modify your account information through your account settings at any time.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Public Content
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your contributions to the Service, including reviews, ratings, photos, and business listings, are intended for public consumption and are viewable by other users. Your account profile information may also be publicly visible.
                  </p>
                  <p className="text-gray-600">
                    You can control the visibility of some of your activities through your account settings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Communications
                  </h3>
                  <p className="text-gray-600 mb-4">
                    When you use certain features, you may receive messages from other users, service professionals, and Burpp. You can manage your messaging preferences through your account settings.
                  </p>
                  <p className="text-gray-600">
                    We may track your actions in response to messages to improve our service and help facilitate communication between users and service professionals.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Location and Activity
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We store information about your use of the Service, including your search activity, pages viewed, and location data to provide relevant local services and improve your experience.
                  </p>
                  <p className="text-gray-600">
                    You can limit our collection of location data through your device settings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Cookies */}
          <div id="cookies" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Cookies and Tracking</h2>
            <p className="text-lg text-gray-600 mb-6">
              We use cookies, web beacons, and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content and advertising.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Essential Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Required for the Service to function properly, including authentication and security features.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Analytics Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Help us understand how visitors use the Service to improve functionality and user experience.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Preference Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Remember your settings and preferences to personalize your experience.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Advertising Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Used to deliver relevant advertisements and measure their effectiveness.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Third Parties */}
          <div id="third-parties" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Third Parties</h2>
            <p className="text-lg text-gray-600 mb-6">
              We may share information with third parties in the following circumstances:
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">Service Providers</h3>
                <p className="text-gray-600">
                  We share information with third-party service providers who help us operate the Service, including hosting, analytics, payment processing, and customer support.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">Business Partners</h3>
                <p className="text-gray-600">
                  We may share aggregated or anonymized information with business partners for analytics and service improvement purposes.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">Legal Requirements</h3>
                <p className="text-gray-600">
                  We may disclose information when required by law, to protect our rights, or to prevent fraud and abuse.
                </p>
              </div>
            </div>
          </div>

          {/* Controlling Your Data */}
          <div id="controlling-data" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Controlling Your Personal Data</h2>
            <p className="text-lg text-gray-600 mb-6">
              You have several options for controlling your personal information:
            </p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Account Settings</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Update your profile information, privacy settings, and communication preferences.
                  </p>
                  <Button variant="outline" size="sm">
                    Manage Account
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Data Export</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Request a copy of your personal data in a portable format.
                  </p>
                  <Button variant="outline" size="sm">
                    Request Data
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Data Deletion</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Request deletion of your personal data, subject to legal requirements.
                  </p>
                  <Button variant="outline" size="sm">
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Marketing Opt-out</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Unsubscribe from marketing communications while keeping essential service messages.
                  </p>
                  <Button variant="outline" size="sm">
                    Unsubscribe
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Data Retention */}
          <div id="data-retention" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Retention and Account Termination</h2>
            <p className="text-lg text-gray-600 mb-4">
              We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
            </p>
            <p className="text-lg text-gray-600 mb-4">
              When you close your account, we will remove certain public posts from view and dissociate them from your account profile. However, we may retain some information to prevent fraud, comply with legal obligations, or maintain the integrity of our Service.
            </p>
          </div>

          {/* Children's Privacy */}
          <div id="children" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Children's Privacy</h2>
            <p className="text-lg text-gray-600 mb-4">
              The Service is intended for general audiences and is not directed to children under 13. We do not knowingly collect personal information from children under 13.
            </p>
            <p className="text-lg text-gray-600">
              If you become aware that a child has provided us with personal information without parental consent, please contact us immediately.
            </p>
          </div>

          {/* Security */}
          <div id="security" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Security
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              We use various safeguards to protect the personal information submitted to us, both during transmission and after we receive it. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
            <p className="text-lg text-gray-600">
              While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </div>

          {/* Contact Information */}
          <div id="contact" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-lg text-gray-600 mb-6">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-600">privacy@burpp.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Data Protection Officer</p>
                      <p className="text-gray-600">dpo@burpp.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Updates */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Updates to This Policy</h2>
            <p className="text-lg text-gray-600 mb-4">
              We may modify this Privacy Policy from time to time. The most current version will be posted on this page with an updated "Last Updated" date.
            </p>
            <p className="text-lg text-gray-600">
              If we make material changes, we will notify you by email and/or by posting a notice on the Service prior to the changes taking effect.
            </p>
          </div>

        </div>
      </section>


      <Footer />
    </div>
  )
}
