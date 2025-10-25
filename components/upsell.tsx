"use client"

import { useLang } from "./language-provider"
import { Button } from "@/components/ui/button"

export default function Upsell() {
  const { t } = useLang()
  return (
    <section id="pricing" aria-labelledby="upsell-title" className="py-10">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden shadow-sm">
        <div className="h-[2px] w-full bg-gradient-to-r from-[#2ECC71] to-transparent" aria-hidden="true" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-6 md:p-8">
            <h3 id="upsell-title" className="text-xl font-semibold font-[var(--font-poppins)] mb-2 text-foreground">
              {t("upsell.title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{t("upsell.benefits")}</p>
            <ul className="space-y-2 text-sm text-foreground">
              <li>• {t("upsell.b1")}</li>
              <li>• {t("upsell.b2")}</li>
              <li>• {t("upsell.b3")}</li>
            </ul>
          </div>
          <div className="p-6 md:p-8 border-t md:border-l md:border-t-0 border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
            <Button className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black">{t("upsell.cta")}</Button>
            <button className="text-sm text-[#007BFF] hover:underline">{t("upsell.pricing")}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
