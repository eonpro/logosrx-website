import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminSignInPage() {
  return (
    <div className="relative flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-navy-deep p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-magenta flex items-center justify-center font-bold text-sm tracking-wide">
            LX
          </div>
          <span className="text-lg font-bold tracking-tight">Logos RX</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            Admin Portal
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Manage provider applications, clinic sign-ups, and email
            subscriptions from one centralized dashboard.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.3 5.3L6.7 11.3 3 7.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Applications
            </div>
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.3 5.3L6.7 11.3 3 7.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clinic Sign-ups
            </div>
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.3 5.3L6.7 11.3 3 7.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Email Sign-ups
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs">
          &copy; {new Date().getFullYear()} Logos RX. Authorized personnel only.
        </p>
      </div>

      {/* Right panel — sign-in form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo (hidden on lg+) */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-magenta flex items-center justify-center font-bold text-white text-lg">
              LX
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-navy-deep">Logos RX</h1>
              <p className="text-navy-deep/40 text-sm">Admin Portal</p>
            </div>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-navy-deep">Welcome back</h2>
            <p className="mt-1 text-sm text-navy-deep/50">
              Sign in to access the admin dashboard
            </p>
          </div>

          <SignIn
            routing="path"
            path="/admin/sign-in"
            signUpUrl={undefined}
            forceRedirectUrl="/admin"
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none w-full border-0 bg-transparent",
                card: "shadow-none w-full p-0 bg-transparent border-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-beige-dark bg-white hover:bg-beige/50 transition-colors text-navy-deep font-medium",
                socialButtonsBlockButtonText: "text-navy-deep font-medium",
                dividerLine: "bg-beige-dark",
                dividerText: "text-navy-deep/30 text-xs",
                formFieldLabel: "text-navy-deep/70 font-medium text-sm",
                formFieldInput:
                  "border-beige-dark bg-white focus:border-magenta focus:ring-magenta/20 rounded-lg text-navy-deep",
                formButtonPrimary:
                  "bg-navy-deep hover:bg-navy text-white font-semibold rounded-lg shadow-none transition-colors",
                footerAction: "hidden",
                footer: "hidden",
              },
            }}
          />

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-navy-deep/40 hover:text-magenta transition-colors"
            >
              &larr; Back to logosrx.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
