"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FaCheck } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
export const dynamic = 'force-dynamic';
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();

  const handleStartNewSubmission = () => {
    router.push("/compost-form");
  };

  return (
    <main className="min-h-screen flex flex-col items-center">
      {/* Top Divider Bar */}
      <div className="w-full h-2 bg-gradient-to-r from-green-100 via-green-200 to-green-100"></div>
      
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Navigation Container */}
        <div className="w-full max-w-6xl mx-auto p-4">
          <nav className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex gap-5 items-center font-semibold">
                <div className="flex items-center gap-3">
                  <Image
                    src="/pfd-logo.jpg"
                    alt="DCCI Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <span className="text-lg font-bold text-green-700">DCCI X Hack4Impact</span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {/* Success Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            {/* Success Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-12 shadow-lg w-full max-w-2xl text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                  <FaCheck className="w-16 h-16 text-green-600" />
                </div>
              </div>
              
              {/* Success Message */}
              <h1 className="text-4xl font-bold text-green-700 mb-4">
                Submission Successful!
              </h1>
              <p className="text-xl text-green-600 mb-8">
                Your compost data has been recorded and sent successfully.
              </p>
              <p className="text-lg text-green-500">
                Thank you for contributing to our composting initiative!
              </p>
            </div>

            {/* Action Button */}
            <motion.button
              onClick={handleStartNewSubmission}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start New Compost Log
              <FaArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Branding Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col items-center gap-8"
          >
            {/* DCCI Header Box */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg w-full max-w-4xl">
              <div className="flex items-center gap-6 justify-center">
                <Image
                  src="/watermelon.jpg"
                  alt="Don't Worry Be Scrappy"
                  width={80}
                  height={80}
                  className="rounded-full shadow-md"
                />
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-green-700 mb-2">
                    Delaware Community Composting Initiative
                  </h2>
                  <p className="text-lg text-green-600 font-medium">
                    Don't Worry, Be Scrappy!
                  </p>
                </div>
              </div>
            </div>

            {/* PFD Logo */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 justify-center">
                <Image
                  src="/pfd-logo.jpg"
                  alt="Plastic Free Delaware"
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-700">
                    Plastic Free Delaware
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
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
        </footer>
      </div>
    </main>
  );
}
