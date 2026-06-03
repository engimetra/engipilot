import { Suspense } from "react"
import { Building2 } from "lucide-react"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = {
  title: "Connexion — ENGIPILOT",
}

function LoginFallback() {
  return (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />
      ))}
      <div className="h-11 bg-primary/20 rounded-lg animate-pulse" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight">ENGIPILOT</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Se connecter à ENGIPILOT
          </h1>
          <p className="text-muted-fg text-sm mt-2">
            Accédez à votre espace de gestion de chantiers
          </p>
        </div>

        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  )
}
