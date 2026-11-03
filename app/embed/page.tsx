/**
 * DCCI embeddable / frameworthy impact stats widget
 */
import { EnvVarWarning } from "@/components/env-var-warning";
import { ImpactStatistics } from "@/components/impact-statistics";
import { hasEnvVars } from "@/lib/utils";

export default function Embed() {
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
          <div className="flex-1 w-full flex flex-col gap-12 md:gap-20 items-center">
            <div className="flex-1 flex flex-col gap-12 md:gap-20 max-w-5xl p-4 md:p-5">

              <div className="flex-1 flex flex-col gap-6 px-2 md:px-4">
                <ImpactStatistics embedded="true" />

                {!hasEnvVars && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Impact Statistics failed to load. Please try again later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </main>
  );
}
