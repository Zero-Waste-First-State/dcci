import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ImpactStatistics } from "@/components/impact-statistics";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center relative">
      {/* Background Photo - Subtle overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage: 'url("/242683079_4476094795747346_2699629260345437164_n.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-10 w-full">
      {/* Top Divider Bar */}
      <div className="w-full h-2 bg-gradient-to-r from-green-100 via-green-200 to-green-100"></div>
      
      
      <div className="flex-1 w-full flex flex-col gap-12 md:gap-20 items-center">
         <div className="flex-1 flex flex-col gap-12 md:gap-20 max-w-5xl p-4 md:p-5">
           {/* Hero Section with PFD Logo */}
           <div className="flex flex-col items-center gap-8">
             {/* DCCI Header Box */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 md:p-8 shadow-lg w-full max-w-4xl">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-center">
                <Image
                  src="/pfd-logo.jpg"
                  alt="DCCI Logo"
                  width={80}
                  height={80}
                  className="rounded-lg shadow-md"
                />
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-700 mb-2 leading-tight">
                    Delaware Community Composting Initiative
                  </h1>
                  <p className="text-base md:text-lg text-green-600 font-medium">
                    Data Collection Home Page
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <main className="flex-1 flex flex-col gap-6 px-2 md:px-4">
            {/* Impact Statistics Section */}
            <ImpactStatistics />
            
            {/* Get Started Section */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 shadow-lg w-full max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-3 leading-tight">Ready to Log Your Compost Data?</h2>
                <p className="text-base md:text-lg text-blue-600 mb-2">Help us track composting efforts and make a positive impact</p>
                <p className="text-sm text-gray-600">Click below to start recording your composting activities</p>
              </div>
              
              <div className="flex justify-center">
                <Link
                  href="/compost-form"
                  className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl shadow-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Start Compost Records Form</span>
                  <span className="sm:hidden">Start Form</span>
                </Link>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Quick & Easy
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Secure Data
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Environmental Impact
                </div>
              </div>
            </div>
            
            {!hasEnvVars && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Environment variables not configured. Please check your .env.local file.
                </p>
              </div>
            )}
          </main>
        </div>

        <footer className="w-full border-t mx-auto py-12 md:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Navigation Bar Moved to Footer */}
            <nav className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                <div className="flex gap-3 md:gap-5 items-center font-semibold">
                  <Link href={"/"} className="flex items-center gap-2 md:gap-3">
                    <Image
                      src="/watermelon.jpg"
                      alt="Don't Worry Be Scrappy"
                      width={32}
                      height={32}
                      className="rounded-full sm:w-10 sm:h-10"
                    />
                    <span className="text-base md:text-lg font-bold text-green-700">DCCI X Hack4Impact</span>
                  </Link>
                </div>
                <div className="flex gap-3 md:gap-4 items-center">
                  <Link
                    href="/dashboard"
                    className="bg-green-600 text-white px-3 md:px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors text-sm md:text-base"
                  >
                    Staff Login
                  </Link>
                  {!hasEnvVars && <EnvVarWarning />}
                </div>
              </div>
            </nav>
            
            {/* Original Footer Content */}
            <div className="flex items-center justify-center text-xs gap-8">
              <p>
                Powered by{" "}
                <a
                  href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                  target="_blank"
                  className="font-bold hover:underline"
                  rel="noreferrer noopener"
                >
                  Supabase
                </a>
              </p>
              <ThemeSwitcher />
            </div>
          </div>
        </footer>
      </div>
      </div>
    </main>
  );
}
