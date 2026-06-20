import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default async function NotFound() {
  const t = await getTranslations("errors").catch(() => null)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-6xl font-black text-slate-200 mb-2">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {t?.("notFound", { defaultValue: "Page introuvable" }) ?? "Page introuvable"}
        </h1>
        <p className="text-slate-500 mb-8 text-sm">
          {t?.("notFoundDesc", { defaultValue: "La page que vous recherchez n'existe pas ou a été déplacée." }) ??
            "La page que vous recherchez n'existe pas ou a été déplacée."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            {t?.("home", { defaultValue: "Dashboard" }) ?? "Dashboard"}
          </Link>
          <Link
            href="javascript:history.back()"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t?.("back", { defaultValue: "Retour" }) ?? "Retour"}
          </Link>
        </div>
      </div>
    </div>
  )
}
