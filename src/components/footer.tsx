'use client'

import Link from 'next/link'
import { Instagram, Youtube } from 'lucide-react'

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

export function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-900">
      {/* Top Section */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Column 1: Company */}
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
              <Link href="/vendor-registration" className="block text-gray-600 hover:text-gray-900 transition-colors">
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
            © {new Date().getFullYear()} Burpp Ventures LLC. All Rights Reserved.
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <Link 
              href="https://www.tiktok.com/@helloburpp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="TikTok"
            >
              <TikTokIcon className="h-5 w-5" />
            </Link>
            <Link 
              href="https://www.instagram.com/helloburpp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link 
              href="https://www.youtube.com/@helloburpp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
