import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { toast } from "sonner";
import { STATUS_CONFIG } from "./Dashboard";

function SecureDocumentRow({ doc }: { doc: { id: number; fileName: string; type: string; fileSize?: number | null } }) {
  const [downloading, setDownloading] = useState(false);
  const getUrl = trpc.documents.getDownloadUrl.useQuery(
    { documentId: doc.id },
    { enabled: false, retry: false }
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await getUrl.refetch();
      if (result.data?.url) {
        const a = document.createElement("a");
        a.href = result.data.url;
        a.download = result.data.fileName ?? doc.fileName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      toast.error("Failed to download document.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-gray-400" />
        <div>
          <div className="text-sm font-medium text-gray-900">{doc.fileName}</div>
          <div className="text-xs text-gray-400 capitalize">
            {doc.type.replace("_", " ")} · {doc.fileSize ? `${Math.round(doc.fileSize / 1024)}KB` : ""}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="rounded-full" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}>
      <cfg.icon className="w-4 h-4" />
      {cfg.label}
    </span>
  );
}

function MessagingPanel({ applicationId, userRole }: { applicationId: number; userRole: "user" | "admin" }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages, isLoading } = trpc.messages.getByApplication.useQuery(
    { applicationId },
    { refetchInterval: 5000 }
  );

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.messages.getByApplication.invalidate({ applicationId });
      utils.messages.unreadCount.invalidate();
    },
    onError: () => toast.error("Failed to send message."),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ applicationId, content: message.trim() });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        {!isLoading && messages?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        )}
        {messages?.map((msg) => {
          const isOwn = msg.senderRole === userRole;
          return (
            <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", isOwn ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm")}
                style={isOwn ? { background: "var(--brand-green)" } : {}}>
                {!isOwn && (
                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--brand-gold-dark)" }}>
                    Recruitment Team
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={cn("text-xs mt-1", isOwn ? "text-white/60" : "text-gray-400")}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {new Date(msg.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="btn-green rounded-xl px-4 self-end"
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const defaultTab = new URLSearchParams(search).get("tab") === "messages" ? "messages" : "details";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { user } = useAuth();

  const appId = parseInt(id ?? "0");
  const { data: application, isLoading } = trpc.applications.getById.useQuery({ id: appId }, { enabled: !!appId });
  const { data: job } = trpc.jobs.getById.useQuery({ id: application?.jobPositionId ?? 0 }, { enabled: !!application?.jobPositionId });
  const { data: documents } = trpc.documents.listByApplication.useQuery({ applicationId: appId }, { enabled: !!appId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand-green)" }} />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="font-serif text-xl font-bold mb-2">Application Not Found</h2>
          <Link href="/dashboard"><Button className="btn-green rounded-full">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--brand-cream)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold" style={{ color: "var(--brand-green)" }}>
                  {job?.title ?? "Position"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">{job?.category} · {job?.location}</p>
                <div className="mt-3">
                  <StatusBadge status={application.status} />
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>Applied {new Date(application.createdAt).toLocaleDateString()}</div>
                {application.submittedAt && (
                  <div>Submitted {new Date(application.submittedAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "details", label: "Application Details", icon: FileText },
            { id: "messages", label: "Messages", icon: MessageCircle },
            { id: "documents", label: "Documents", icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === tab.id ? "text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50"
              )}
              style={activeTab === tab.id ? { background: "var(--brand-green)" } : {}}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <Section title="Personal Details" items={[
                { label: "Full Name", value: application.fullName },
                { label: "Gender", value: application.gender },
                { label: "Date of Birth", value: application.dateOfBirth },
                { label: "Nationality", value: application.nationality },
                { label: "Phone", value: application.phone },
                { label: "Email", value: application.email },
                { label: "Country of Residence", value: application.countryOfResidence },
              ]} />
              <Section title="Experience" items={[
                { label: "Education Level", value: application.educationLevel },
                { label: "Years of Experience", value: application.yearsOfExperience },
              ]} />
              {application.coverLetter && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cover Letter</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{application.coverLetter}</p>
                </div>
              )}
              {application.adminNotes && (
                <div className="p-4 rounded-xl border" style={{ background: "rgba(201,168,76,0.08)", borderColor: "rgba(201,168,76,0.3)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--brand-gold-dark)" }}>Note from Recruitment Team</div>
                  <p className="text-sm text-gray-700">{application.adminNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "messages" && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4" style={{ color: "var(--brand-green)" }} />
                Conversation with Recruitment Team
              </CardTitle>
            </CardHeader>
            <MessagingPanel applicationId={appId} userRole="user" />
          </Card>
        )}

        {activeTab === "documents" && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
              {documents?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No documents uploaded.</p>
                </div>
              )}
              <div className="space-y-3">
                {documents?.map((doc) => (
                  <SecureDocumentRow key={doc.id} doc={doc} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: { label: string; value?: string | null }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.filter((i) => i.value).map(({ label, value }) => (
          <div key={label} className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-400 mb-0.5">{label}</div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
