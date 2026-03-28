import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-magenta flex items-center justify-center font-bold text-white">
              LX
            </div>
            <h1 className="text-2xl font-bold text-white">Logos RX</h1>
          </div>
          <p className="text-white/40 text-sm">Admin Portal</p>
        </div>
        <SignIn
          routing="path"
          path="/admin/sign-in"
          signUpUrl={undefined}
          forceRedirectUrl="/admin"
        />
      </div>
    </div>
  );
}
