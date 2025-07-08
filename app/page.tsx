"use client"

import { ArrowRight, Globe, Users, BookOpen, Mail, Instagram, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFFFF2]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#FFFFF2]/80 backdrop-blur-md border-b border-[#17cd1c]/10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center">
                <Image src="/images/logo.png" alt="The Plot Logo" width={100} height={100} />
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-700 hover:text-[#17cd1c] transition-colors font-medium">
                Features
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-[#17cd1c] transition-colors font-medium">
                About
              </Link>
              <Link href="#join" className="text-gray-700 hover:text-[#17cd1c] transition-colors font-medium">
                Join
              </Link>
              <Button
                className="bg-[#17cd1c] hover:bg-[#17cd1c]/90 text-white"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-[#17cd1c]/10 rounded-full text-[#17cd1c] text-sm font-medium">
                  <span className="w-2 h-2 bg-[#17cd1c] rounded-full mr-2"></span>
                  Now in Beta
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Join the new age of{" "}
                  <span className="text-[#17cd1c] relative">
                    travel
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#17cd1c]/20 rounded-full"></div>
                  </span>{" "}
                  documenting
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Find, plot, and remember your travels. Made by travellers for travellers for easy sharing of routes,
                  hostels, activities and more.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[#17cd1c] hover:bg-[#17cd1c]/90 text-white px-8 py-4 text-lg"
                  onClick={() => document.getElementById("join")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Join Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#17cd1c] text-[#17cd1c] hover:bg-[#17cd1c]/5 px-8 py-4 text-lg bg-transparent"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/images/app-interface.png"
                  alt="The Plot App Interface"
                  width={400}
                  height={800}
                  className="mx-auto drop-shadow-2xl rounded-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#17cd1c]/20 to-transparent rounded-full blur-3xl scale-150"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Find where your friends have been</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with fellow travelers, discover hidden gems, and document your journey with our comprehensive
              travel platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[#17cd1c]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Globe className="h-8 w-8 text-[#17cd1c]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Find Global Travellers</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with travelers from around the world and discover new perspectives on destinations you love.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[#17cd1c]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-[#17cd1c]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Connect with Friends</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share your adventures with friends and see where they've been. Build a community of travel memories.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[#17cd1c]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-[#17cd1c]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Document Your Journey</h3>
                <p className="text-gray-600 leading-relaxed">
                  Keep track of everywhere you've been with rich photos, notes, and memories that last forever.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-[#17cd1c]/5 rounded-2xl p-6">
              <div className="text-2xl">🔥</div>
              <div className="text-left">
                <p className="text-lg font-semibold text-gray-900">Need travel advice?</p>
                <p className="text-gray-600">Join our travel hotline on WhatsApp</p>
              </div>
              <Link href="https://chat.whatsapp.com/HlNbHx3Ugid7YWws1nSjzE" target="_blank">
                <Button className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Join Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section id="join" className="py-20 lg:py-32 bg-[#FFFFF2]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6 mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Ready to start plotting?</h2>
              <p className="text-xl text-gray-600">
                Join our waitlist and be among the first to experience the future of travel documentation.
              </p>
            </div>

            <Card className="border-0 shadow-2xl bg-white">
              <CardContent className="p-2">
                <iframe
                  src="https://docs.google.com/forms/d/e/1FAIpQLScqlTdQhY28krt3dDPKxDohpotf98V-YYqN0LHhD3IFIq_szg/viewform?embedded=true"
                  className="w-full h-[600px] rounded-lg"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                >
                  Loading…
                </iframe>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 lg:py-32 bg-[#14a518]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-white">Who are we?</h2>
              <p className="text-2xl text-white/90 leading-relaxed">
                22, just finished uni with a passion for authentic travel, learning how to build the most authentic
                travel recommendation app out there!
              </p>
            </div>

            <div className="relative">
              <Image
                src="/images/founders.jpg"
                alt="The Plot Founders"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl mx-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14a518]/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaborate Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Collaborate with us</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              We're open to collaborations of any kind to help get the app out there. Let's build the future of travel
              together.
            </p>
            <Link href="mailto:theplot.travel@gmail.com">
              <Button size="lg" className="bg-[#17cd1c] hover:bg-[#17cd1c]/90 text-white px-8 py-4 text-lg">
                <Mail className="mr-2 h-5 w-5" />
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="flex items-center">
              <div className="flex items-center">
                <Image src="/images/logo.png" alt="The Plot Logo" width={100} height={100} />
              </div>
            </div>

            <div className="text-center">
              <Link
                href="https://www.instagram.com/theplot.travel"
                target="_blank"
                className="inline-flex items-center gap-2 text-[#17cd1c] hover:text-[#17cd1c]/80 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                @theplot.travel
              </Link>
            </div>

            <div className="flex justify-end space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ThePlot LTD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
