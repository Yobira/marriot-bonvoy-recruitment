import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Job & Experience", icon: FileText },
  { id: 3, title: "Documents", icon: Upload },
  { id: 4, title: "Review & Submit", icon: CheckCircle2 },
];

const EDUCATION_LEVELS = [
  "No formal education",
  "Primary School",
  "Secondary School / High School",
  "Vocational / Technical Training",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctoral Degree",
  "Professional Certification",
  "N/A",
];

const EXPERIENCE_OPTIONS = [
  "No experience",
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "6–10 years",
  "More than 10 years",
  "N/A",
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say", "N/A"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
            currentStep === step.id
              ? "text-white shadow-md"
              : currentStep > step.id
                ? "text-green-700 bg-green-50"
                : "text-gray-400 bg-gray-100"
          )}
            style={currentStep === step.id ? { background: "var(--brand-green)" } : {}}>
            {currentStep > step.id ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <step.icon className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{step.title}</span>
            <span className="sm:hidden">{step.id}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("w-6 h-0.5 mx-1", currentStep > step.id ? "bg-green-400" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

function FileUploadField({ label, type, applicationId, onUploaded, required = false }: {
  label: string; type: string; applicationId: number; onUploaded: (url: string) => void; required?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.documents.upload.useMutation();

  const handleFile = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    setFile(f);
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          applicationId,
          type: type as any,
          fileName: f.name,
          fileData: base64,
          mimeType: f.type,
          fileSize: f.size,
        });
        setUploaded(true);
        onUploaded(result.url);
        toast.success(`${label} uploaded successfully.`);
      };
      reader.readAsDataURL(f);
    } catch {
      toast.error("Upload failed. Please try again.");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 mb-2 block">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <div
        onClick={() => !uploaded && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all",
          uploaded ? "border-green-300 bg-green-50 cursor-default" : "border-gray-200 hover:border-green-400 cursor-pointer hover:bg-gray-50"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand-green)" }} />
            <span className="text-sm text-gray-500">Uploading...</span>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <span className="text-sm font-medium text-green-700">{file?.name}</span>
            <span className="text-xs text-green-500">Uploaded successfully</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-300" />
            <span className="text-sm text-gray-500">Click to upload or drag & drop</span>
            <span className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG — max 10MB</span>
            {file && <span className="text-xs text-gray-600">{file.name}</span>}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}

export default function Apply() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    phone: "",
    email: user?.email ?? "",
    countryOfResidence: "",
    educationLevel: "",
    yearsOfExperience: "",
    coverLetter: "",
  });

  const [docs, setDocs] = useState({ cv: "", photo: "", id_passport: "" });

  const { data: job } = trpc.jobs.getById.useQuery({ id: parseInt(jobId ?? "0") }, { enabled: !!jobId });
  const createApp = trpc.applications.create.useMutation();
  const updateApp = trpc.applications.update.useMutation();
  const submitApp = trpc.applications.submit.useMutation();

  const setField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleNext = async () => {
    if (step === 1) {
      if (!form.fullName.trim()) { toast.error("Full name is required."); return; }
      // Create draft application
      if (!applicationId) {
        try {
          const result = await createApp.mutateAsync({
            jobPositionId: parseInt(jobId ?? "0"),
            ...form,
          });
          setApplicationId(result.id);
        } catch {
          toast.error("Failed to create application. Please try again.");
          return;
        }
      } else {
        await updateApp.mutateAsync({ id: applicationId, ...form });
      }
    }
    if (step === 2 && applicationId) {
      await updateApp.mutateAsync({ id: applicationId, ...form });
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!applicationId) return;
    setSubmitting(true);
    try {
      await updateApp.mutateAsync({ id: applicationId, ...form });
      await submitApp.mutateAsync({ id: applicationId });
      setSubmitted(true);
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand-green)" }} /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--brand-green)" }} />
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "var(--brand-green)" }}>Sign In to Apply</h2>
          <p className="text-gray-500 mb-6 text-sm">You need to sign in before submitting an application.</p>
          <a href={getLoginUrl()}><Button className="btn-gold rounded-full px-8">Sign In</Button></a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--brand-cream)" }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(26,74,58,0.1)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "var(--brand-green)" }} />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-3" style={{ color: "var(--brand-green)" }}>Application Submitted!</h2>
          <p className="text-gray-500 mb-2">Your application for <strong>{job?.title}</strong> has been successfully submitted.</p>
          <p className="text-gray-400 text-sm mb-8">You will receive notifications as your application progresses. Track your status in your dashboard.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard"><Button className="btn-green rounded-full px-6">Go to Dashboard</Button></Link>
            <Link href="/application-fee"><Button variant="outline" className="rounded-full px-6">View Application Fee</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--brand-cream)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Applying for</div>
            <h1 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>
              {job?.title ?? "Position"}
            </h1>
          </div>
        </div>

        {/* Application Fee Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl mb-6 border" style={{ background: "rgba(201,168,76,0.08)", borderColor: "rgba(201,168,76,0.3)" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--brand-gold)" }} />
          <p className="text-xs text-gray-600">
            <strong>Application Fee: 252 DKK.</strong> Payment details will be communicated securely inside the applicant portal after successful account registration.
            <Link href="/application-fee" className="ml-1 underline" style={{ color: "var(--brand-gold-dark)" }}>Learn more</Link>
          </p>
        </div>

        <StepIndicator currentStep={step} />

        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-serif text-xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>Personal Details</h2>
                <p className="text-xs text-gray-400 mb-4">Enter "N/A" for any field that does not apply to you.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Full Name <span className="text-red-400">*</span></Label>
                    <Input className="mt-1" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Your full legal name" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setField("gender", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input className="mt-1" type="date" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
                  </div>
                  <div>
                    <Label>Nationality</Label>
                    <Input className="mt-1" value={form.nationality} onChange={(e) => setField("nationality", e.target.value)} placeholder="e.g. Danish, Nigerian, N/A" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input className="mt-1" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+45 12 34 56 78 or N/A" />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input className="mt-1" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div>
                    <Label>Country of Residence</Label>
                    <Input className="mt-1" value={form.countryOfResidence} onChange={(e) => setField("countryOfResidence", e.target.value)} placeholder="e.g. Denmark, N/A" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Job & Experience */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-serif text-xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>Job & Experience</h2>
                <p className="text-xs text-gray-400 mb-4">Tell us about your background and motivation.</p>

                <div className="p-4 rounded-xl border" style={{ background: "rgba(26,74,58,0.04)", borderColor: "rgba(26,74,58,0.1)" }}>
                  <div className="text-xs text-gray-500 mb-1">Applying for</div>
                  <div className="font-semibold text-gray-900">{job?.title}</div>
                  <div className="text-xs text-gray-400">{job?.category} · {job?.location}</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Highest Education Level</Label>
                    <Select value={form.educationLevel} onValueChange={(v) => setField("educationLevel", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>{EDUCATION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Years of Experience</Label>
                    <Select value={form.yearsOfExperience} onValueChange={(v) => setField("yearsOfExperience", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select experience" /></SelectTrigger>
                      <SelectContent>{EXPERIENCE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Cover Letter / Motivation</Label>
                  <Textarea
                    className="mt-1 min-h-[140px]"
                    value={form.coverLetter}
                    onChange={(e) => setField("coverLetter", e.target.value)}
                    placeholder="Tell us why you want to work at Marriot Bonvoy Copenhagen and what makes you a great candidate. Enter N/A if not applicable."
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.coverLetter.length}/2000 characters</p>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && applicationId && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-serif text-xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>Document Upload</h2>
                <p className="text-xs text-gray-400 mb-4">Upload your documents below. If you don't have a document, enter "N/A" in the filename or skip — no application should be abandoned.</p>

                <FileUploadField label="CV / Resume" type="cv" applicationId={applicationId} onUploaded={(url) => setDocs((d) => ({ ...d, cv: url }))} required />
                <FileUploadField label="Passport-size Photo" type="photo" applicationId={applicationId} onUploaded={(url) => setDocs((d) => ({ ...d, photo: url }))} />
                <FileUploadField label="National ID or Passport" type="id_passport" applicationId={applicationId} onUploaded={(url) => setDocs((d) => ({ ...d, id_passport: url }))} />
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-serif text-xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>Review & Submit</h2>
                <p className="text-xs text-gray-400 mb-4">Please review your application before submitting. Once submitted, it cannot be edited.</p>

                <div className="space-y-4">
                  <ReviewSection title="Position" items={[{ label: "Applying for", value: job?.title ?? "—" }]} />
                  <ReviewSection title="Personal Details" items={[
                    { label: "Full Name", value: form.fullName },
                    { label: "Gender", value: form.gender },
                    { label: "Date of Birth", value: form.dateOfBirth },
                    { label: "Nationality", value: form.nationality },
                    { label: "Phone", value: form.phone },
                    { label: "Email", value: form.email },
                    { label: "Country of Residence", value: form.countryOfResidence },
                  ]} />
                  <ReviewSection title="Experience" items={[
                    { label: "Education Level", value: form.educationLevel },
                    { label: "Years of Experience", value: form.yearsOfExperience },
                  ]} />
                  {form.coverLetter && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cover Letter</div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.coverLetter}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-gray-50">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documents</div>
                    {[
                      { label: "CV / Resume", uploaded: !!docs.cv },
                      { label: "Photo", uploaded: !!docs.photo },
                      { label: "ID / Passport", uploaded: !!docs.id_passport },
                    ].map(({ label, uploaded }) => (
                      <div key={label} className="flex items-center gap-2 text-sm py-1">
                        {uploaded ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-300" />}
                        <span className={uploaded ? "text-gray-700" : "text-gray-400"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep((s) => s - 1) : navigate("/")}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {step === 1 ? "Cancel" : "Back"}
              </Button>

              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={createApp.isPending || updateApp.isPending}
                  className="btn-gold rounded-full px-6"
                >
                  {(createApp.isPending || updateApp.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-green rounded-full px-6"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewSection({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</div>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.filter((i) => i.value).map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
