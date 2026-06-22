import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, Info, Lock, Shield } from "lucide-react";
import { Link } from "wouter";

export default function ApplicationFee() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "var(--brand-cream)" }}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(26,74,58,0.1)" }}>
            <Building2 className="w-8 h-8" style={{ color: "var(--brand-green)" }} />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: "var(--brand-green)" }}>Application Fee</h1>
          <p className="text-gray-500 text-sm">Marriot Bonvoy Copenhagen Recruitment Portal</p>
        </div>

        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-8 text-center">
            <div className="text-5xl font-bold font-serif mb-2" style={{ color: "var(--brand-green)" }}>252 DKK</div>
            <div className="text-gray-500 text-sm mb-6">One-time application processing fee</div>

            <div className="p-4 rounded-xl border mb-6 text-left" style={{ background: "rgba(201,168,76,0.08)", borderColor: "rgba(201,168,76,0.3)" }}>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--brand-gold)" }} />
                <div>
                  <div className="font-semibold text-sm text-gray-800 mb-1">Secure Payment Process</div>
                  <p className="text-sm text-gray-600">
                    Payment details will be communicated securely inside the applicant portal after successful account registration.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left mb-8">
              {[
                "Application review and processing",
                "Access to your personal applicant dashboard",
                "Real-time application status tracking",
                "Direct messaging with the recruitment team",
                "Document storage and management",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--brand-green)" }} />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
              <Shield className="w-4 h-4" />
              GDPR Compliant · Secure Processing
            </div>
          </CardContent>
        </Card>

        <div className="p-4 rounded-xl border bg-white mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <p className="text-xs text-gray-500">
              The application fee is non-refundable once your application has been reviewed. For questions about the fee, please contact us at{" "}
              <a href="mailto:marriotbonvoyhotel77@outlook.com" className="underline" style={{ color: "var(--brand-green)" }}>
                marriotbonvoyhotel77@outlook.com
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="rounded-full px-6 w-full sm:w-auto">Back to Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="btn-green rounded-full px-6 w-full sm:w-auto">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
