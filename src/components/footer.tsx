'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-purple-900 text-gray-300">
      {/* Top Section */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo */}
          <div className="space-y-4">
            <div className="text-gray-300 text-lg font-semibold">
              White LOGO
            </div>
          </div>

          {/* Column 2: Burpp */}
          <div className="space-y-4">
            <h3 className="text-gray-300 font-semibold text-lg">Burpp</h3>
            <div className="space-y-3">
              <Link href="/about" className="block text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/how-to-use" className="block text-gray-300 hover:text-white transition-colors">
                How to use Burpp
              </Link>
            </div>
          </div>

          {/* Column 3: Pros */}
          <div className="space-y-4">
            <h3 className="text-gray-300 font-semibold text-lg">Pros</h3>
            <div className="space-y-3">
              <Link href="/for-pros" className="block text-gray-300 hover:text-white transition-colors">
                Burpp For Pros
              </Link>
              <Link href="/join" className="block text-gray-300 hover:text-white transition-colors">
                Join Burpp
              </Link>
            </div>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-4">
            <h3 className="text-gray-300 font-semibold text-lg">Support</h3>
            <div className="space-y-3">
              <Link href="/contact" className="block text-gray-300 hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/privacy" className="block text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-600"></div>

      {/* Bottom Section */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-gray-300 text-sm">
            © 2025 Burpp. All Rights Reserved.
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <Link href="#" className="text-white hover:text-gray-300 transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-white hover:text-gray-300 transition-colors">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-white hover:text-gray-300 transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
