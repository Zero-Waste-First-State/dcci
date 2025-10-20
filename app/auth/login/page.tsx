import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
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
                <Link href={"/"} className="flex items-center gap-3">
                  <Image
                    src="/pfd-logo.jpg"
                    alt="DCCI Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <span className="text-lg font-bold text-green-700">DCCI X Hack4Impact</span>
                </Link>
              </div>
              <div className="flex gap-4 items-center">
                <Link
                  href="/"
                  className="text-green-600 px-4 py-2 rounded font-semibold hover:text-green-700 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Login Section */}
        <div className="flex-1 flex flex-col gap-8 max-w-2xl p-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg w-full">
            <div className="flex items-center gap-6 justify-center">
              <Image
                src="/watermelon.jpg"
                alt="Don't Worry Be Scrappy"
                width={60}
                height={60}
                className="rounded-full shadow-md"
              />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-green-700 mb-2">
                  Staff Login
                </h1>
                <p className="text-lg text-green-600 font-medium">
                  Access the DCCI Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg w-full">
            <LoginForm />
          </div>
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
