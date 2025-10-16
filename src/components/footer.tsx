'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-900">
      {/* Top Section */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Column 1: Logo */}
          <div className="space-y-4 flex justify-center md:justify-start">
            <Image
              src="/images/burpp_logo.webp"
              alt="Burpp Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </div>

          {/* Column 2: Burpp */}
          <div className="space-y-4">
            <h3 className="font-normal text-base">Company</h3>
            <div className="space-y-3">
              <Link href="/about" className="block text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link href="/how-to-use" className="block text-gray-600 hover:text-gray-900 transition-colors">
                How to use Burpp
              </Link>
            </div>
          </div>

          {/* Column 3: Pros */}
          <div className="space-y-4">
            <h3 className="font-normal text-base">Pros</h3>
            <div className="space-y-3">
              <Link href="/burp-for-business" className="block text-gray-600 hover:text-gray-900 transition-colors">
                Burpp For Pros
              </Link>
              <Link href="/signup" className="block text-gray-600 hover:text-gray-900 transition-colors">
                Join Burpp
              </Link>
            </div>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-4">
            <h3 className="font-normal text-base">Support</h3>
            <div className="space-y-3">
              <Link href="/contact" className="block text-gray-600 hover:text-gray-900 transition-colors">
                Contact Us
              </Link>
              <Link href="/privacy" className="block text-gray-600 hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Bottom Section */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-gray-600 text-sm">
            © 2025 Burpp. All Rights Reserved.
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
