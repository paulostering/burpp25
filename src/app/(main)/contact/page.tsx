"use client"

import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, Home, UserPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactUs() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success('Message sent successfully!', {
          description: 'We\'ll get back to you as soon as possible.',
          duration: 5000,
        })
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        toast.error('Failed to send message', {
          description: 'Please try again or contact us directly.',
          duration: 5000,
        })
      }
    } catch {
      toast.error('Failed to send message', {
        description: 'Please check your connection and try again.',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Let's Get You the Help You Need
          </h1>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="mx-auto max-w-6xl px-8 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Content */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Get in Touch
            </h2>
            <div className="space-y-6">
              <p className="text-xl text-gray-600 leading-relaxed">
                Got a question, concern, or just want to say hey?
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We're here to support you.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Whether you're a customer looking for guidance or a service pro needing help setting up your profile—we've got your back.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a 
                    href="mailto:support@burpp.com" 
                    className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors"
                  >
                    support@burpp.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="relative">
            <Card className="border-none shadow-none">
              <CardContent className="space-y-6 px-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <Mail className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Quick Actions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Looking for something specific? Here are some quick ways to get started.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Looking to join as a Pro?</h3>
                  <p className="text-gray-600">
                    Set up your professional profile and start connecting with customers in your area.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/burp-for-business')}
                  size="lg"
                  className="w-full"
                >
                  Join Burpp
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Looking to find a service?</h3>
                  <p className="text-gray-600">
                    Browse local professionals and find exactly what you need for your next project.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Browse Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
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
                Still Need Help?
              </h2>
              <p className="text-xl opacity-90">
                Don't hesitate to reach out. Our support team is here to help you get the most out of Burpp.
              </p>
              <Button 
                onClick={() => window.location.href = 'mailto:support@burpp.com'}
                variant="secondary"
                size="lg"
                className="text-lg px-8 py-3"
              >
                <Mail className="mr-2 h-5 w-5" />
                Email Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
