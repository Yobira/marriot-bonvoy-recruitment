import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  LogOut,
  MessageCircle,
  Megaphone,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { STATUS_CONFIG } from "./Dashboard";

function SecureAdminDocumentRow({ doc }: { doc: { id: number; fileName: string; type: string } }) {
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
          <div className="text-xs text-gray-400 capitalize">{doc.type.replace("_", " ")}</div>
        </div>
      </div>
      <Button size="sm" className="btn-green rounded-full gap-1.5 text-xs" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {downloading ? "Downloading..." : "Download"}
      </Button>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function AdminNav({ activeTab, setActiveTab, unreadMessages, onLogout }: any) {
  const navItems = [
    { id: "overview", icon: Building2, label: "Overview" },
    { id: "applications", icon: Users, label: "Applications" },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
    { id: "jobs", icon: Briefcase, label: "Job Positions" },
    { id: "announcements", icon: Megaphone, label: "Announcements" },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-100 min-h-screen">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--brand-green)" }}>
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand-gold)" }}>Marriot Bonvoy</div>
            <div className="text-xs text-gray-500">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id ? "text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            style={activeTab === item.id ? { background: "var(--brand-green)" } : {}}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: "var(--brand-gold)", color: "var(--brand-green-dark)" }}>
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-1">
        <Link href="/">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-4 h-4" /> View Site
          </button>
        </Link>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: applications } = trpc.applications.listAll.useQuery({});
  const { data: jobs } = trpc.jobs.listAll.useQuery();

  const stats = {
    total: applications?.length ?? 0,
    submitted: applications?.filter((r: any) => r.applications.status === "submitted").length ?? 0,
    underReview: applications?.filter((r: any) => r.applications.status === "under_review").length ?? 0,
    accepted: applications?.filter((r: any) => r.applications.status === "accepted").length ?? 0,
    rejected: applications?.filter((r: any) => r.applications.status === "rejected").length ?? 0,
    activeJobs: jobs?.filter((j: any) => j.isActive).length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>Admin Overview</h1>
        <p className="text-gray-500 text-sm">Recruitment portal management dashboard.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Applications", value: stats.total, color: "var(--brand-green)" },
          { label: "Awaiting Review", value: stats.submitted, color: "#2563eb" },
          { label: "Under Review", value: stats.underReview, color: "#d97706" },
          { label: "Accepted", value: stats.accepted, color: "#16a34a" },
          { label: "Rejected", value: stats.rejected, color: "#dc2626" },
          { label: "Active Positions", value: stats.activeJobs, color: "var(--brand-gold-dark)" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="text-3xl font-bold font-serif mb-1" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {applications && applications.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Recent Applications</h2>
          <div className="space-y-2">
            {applications.slice(0, 5).map((row: any) => (
              <ApplicationRow key={row.applications.id} row={row} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Applications ─────────────────────────────────────────────────────────────
function ApplicationsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: applications, isLoading } = trpc.applications.listAll.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const exportCSV = () => {
    if (!applications) return;
    const headers = ["ID", "Name", "Email", "Nationality", "Position", "Status", "Applied"];
    const rows = applications.map((r: any) => [
      r.applications.id,
      r.applications.fullName,
      r.applications.email,
      r.applications.nationality,
      r.job_positions?.title ?? "",
      r.applications.status,
      new Date(r.applications.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applicants.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>All Applications</h2>
        <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-full gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by name, email, nationality..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : applications?.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-10 text-center text-gray-400">No applications found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {applications?.map((row: any) => <ApplicationRow key={row.applications.id} row={row} />)}
        </div>
      )}
    </div>
  );
}

function ApplicationRow({ row, compact = false }: { row: any; compact?: boolean }) {
  const app = row.applications;
  const job = row.job_positions;

  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <CardContent className={cn("flex items-center justify-between gap-3", compact ? "p-3" : "p-4")}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{app.fullName}</span>
            <StatusBadge status={app.status} />
          </div>
          {!compact && (
            <div className="text-xs text-gray-400 mt-0.5">{app.email} · {app.nationality}</div>
          )}
          <div className="text-xs text-gray-500 mt-0.5">{job?.title ?? "—"}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!compact && <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>}
          <Link href={`/admin/application/${app.id}`}>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Admin Application Detail ─────────────────────────────────────────────────
export function AdminApplicationDetail({ appId, onBack }: { appId: number; onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState("details");
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.applications.getWithDetails.useQuery({ id: appId }, { enabled: !!appId });
  const updateStatus = trpc.applications.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully.");
      utils.applications.getWithDetails.invalidate({ id: appId });
      utils.applications.listAll.invalidate();
    },
    onError: () => toast.error("Failed to update status."),
  });

  useEffect(() => {
    if (data?.application) {
      setNewStatus(data.application.status);
      setAdminNotes(data.application.adminNotes ?? "");
    }
  }, [data]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand-green)" }} /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><p>Not found.</p></div>;

  const { application, job, documents, applicant } = data;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--brand-cream)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {onBack ? (
            <Button onClick={onBack} variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-1" /> Admin Panel
              </Button>
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>{application.fullName}</h1>
                    <p className="text-sm text-gray-500">{application.email}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                <div className="flex gap-2 mb-4">
                  {[
                    { id: "details", label: "Details", icon: FileText },
                    { id: "messages", label: "Messages", icon: MessageCircle },
                    { id: "documents", label: "Documents", icon: Download },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        activeTab === tab.id ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                      style={activeTab === tab.id ? { background: "var(--brand-green)" } : {}}>
                      <tab.icon className="w-3.5 h-3.5" />{tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "details" && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { label: "Position", value: job?.title },
                        { label: "Category", value: job?.category },
                        { label: "Gender", value: application.gender },
                        { label: "Date of Birth", value: application.dateOfBirth },
                        { label: "Nationality", value: application.nationality },
                        { label: "Phone", value: application.phone },
                        { label: "Country", value: application.countryOfResidence },
                        { label: "Education", value: application.educationLevel },
                        { label: "Experience", value: application.yearsOfExperience },
                      ].filter((i) => i.value).map(({ label, value }) => (
                        <div key={label} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-400">{label}</div>
                          <div className="text-sm font-medium text-gray-900">{value}</div>
                        </div>
                      ))}
                    </div>
                    {application.coverLetter && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cover Letter</div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">{application.coverLetter}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "messages" && (
                  <AdminMessagingPanel applicationId={appId} />
                )}

                {activeTab === "documents" && (
                  <div className="space-y-3">
                    {documents?.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No documents uploaded.</p>}
                    {documents?.map((doc) => (
                      <SecureAdminDocumentRow key={doc.id} doc={doc} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Update Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Optional note to applicant..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                <Button
                  className="btn-green w-full rounded-full"
                  onClick={() => updateStatus.mutate({ id: appId, status: newStatus as any, adminNotes })}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                  Save Status
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Applicant Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Applied</span><span>{new Date(application.createdAt).toLocaleDateString()}</span></div>
                {application.submittedAt && <div className="flex justify-between"><span className="text-gray-400">Submitted</span><span>{new Date(application.submittedAt).toLocaleDateString()}</span></div>}
                <div className="flex justify-between"><span className="text-gray-400">Documents</span><span>{documents?.length ?? 0} files</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminMessagingPanel({ applicationId }: { applicationId: number }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages, isLoading } = trpc.messages.getByApplication.useQuery({ applicationId }, { refetchInterval: 5000 });
  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.messages.getByApplication.invalidate({ applicationId });
      utils.messages.adminUnreadCount.invalidate();
    },
    onError: () => toast.error("Failed to send message."),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-gray-100 py-4 px-6">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: "var(--brand-green)" }} />
          Messages with Applicant
        </CardTitle>
      </CardHeader>
      <div className="flex flex-col">
        <div className="overflow-y-auto space-y-3 min-h-[300px] max-h-[500px] p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          {!isLoading && messages?.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No messages yet. Start the conversation.</div>
          )}
        {messages?.map((msg) => {
          const isAdmin = msg.senderRole === "admin";
          return (
            <div key={msg.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", isAdmin ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm")}
                style={isAdmin ? { background: "var(--brand-green)" } : {}}>
                {!isAdmin && <div className="text-xs font-semibold mb-1 text-blue-600">Applicant</div>}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={cn("text-xs mt-1", isAdmin ? "text-white/60" : "text-gray-400")}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
                })}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reply to applicant..." className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (message.trim()) sendMessage.mutate({ applicationId, content: message.trim() }); } }} />
          <Button onClick={() => message.trim() && sendMessage.mutate({ applicationId, content: message.trim() })} disabled={!message.trim() || sendMessage.isPending} className="btn-green rounded-xl px-3 self-end">
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
    </Card>
  );
}

// ─── Messages Inbox ────────────────────────────────────────────────────────────
function MessagesTab() {
  const [, navigate] = useLocation();
  const { data: conversations } = trpc.messages.adminAllConversations.useQuery(undefined, { refetchInterval: 10000 });
  const { data: unreadCount } = trpc.messages.adminUnreadCount.useQuery(undefined, { refetchInterval: 10000 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>
          Messages Inbox
          {(unreadCount ?? 0) > 0 && (
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "var(--brand-gold-dark)" }}>
              {unreadCount} unread
            </span>
          )}
        </h2>
      </div>
      {conversations?.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-10 text-center text-gray-400">No conversations yet.</CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {conversations?.map((row: any) => {
          const handleClick = () => {
            console.log("[MessagesTab] Navigating to:", `/admin/application/${row.applications.id}`);
            navigate(`/admin/application/${row.applications.id}`);
          };
          return (
            <button
              key={row.applications.id}
              onClick={handleClick}
              className="w-full text-left"
            >
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{row.applications.fullName}</div>
                    <div className="text-xs text-gray-400">{row.job_positions?.title ?? "—"}</div>
                    <div className="mt-1"><StatusBadge status={row.applications.status} /></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Jobs Management ──────────────────────────────────────────────────────────
function JobsTab() {
  const [open, setOpen] = useState(false);
  const [editJob, setEditJob] = useState<any>(null);
  const [form, setForm] = useState({ title: "", category: "", description: "", requirements: "", employmentType: "full-time" as any });
  const utils = trpc.useUtils();

  const { data: jobs } = trpc.jobs.listAll.useQuery();
  const createJob = trpc.jobs.create.useMutation({ onSuccess: () => { utils.jobs.listAll.invalidate(); setOpen(false); toast.success("Position created."); } });
  const updateJob = trpc.jobs.update.useMutation({ onSuccess: () => { utils.jobs.listAll.invalidate(); setOpen(false); setEditJob(null); toast.success("Position updated."); } });
  const deactivateJob = trpc.jobs.deactivate.useMutation({ onSuccess: () => { utils.jobs.listAll.invalidate(); toast.success("Position deactivated."); } });

  const openCreate = () => { setEditJob(null); setForm({ title: "", category: "", description: "", requirements: "", employmentType: "full-time" }); setOpen(true); };
  const openEdit = (job: any) => { setEditJob(job); setForm({ title: job.title, category: job.category, description: job.description ?? "", requirements: job.requirements ?? "", employmentType: job.employmentType }); setOpen(true); };

  const handleSave = () => {
    if (!form.title || !form.category) { toast.error("Title and category are required."); return; }
    if (editJob) updateJob.mutate({ id: editJob.id, ...form });
    else createJob.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>Job Positions</h2>
        <Button onClick={openCreate} className="btn-gold rounded-full gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Add Position
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editJob ? "Edit Position" : "Add New Position"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Job Title <span className="text-red-400">*</span></Label>
                <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Head Chef" />
              </div>
              <div>
                <Label>Category <span className="text-red-400">*</span></Label>
                <Input className="mt-1" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Kitchen & Culinary" />
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={form.employmentType} onValueChange={(v) => setForm((f) => ({ ...f, employmentType: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["full-time", "part-time", "contract", "seasonal"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea className="mt-1 min-h-[80px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Requirements</Label>
                <Textarea className="mt-1 min-h-[80px]" value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="btn-green" onClick={handleSave} disabled={createJob.isPending || updateJob.isPending}>
                {(createJob.isPending || updateJob.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editJob ? "Save Changes" : "Create Position"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {jobs?.map((job: any) => (
          <Card key={job.id} className={cn("border shadow-sm", !job.isActive && "opacity-60")}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{job.title}</span>
                  {!job.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                </div>
                <div className="text-xs text-gray-400">{job.category} · {job.employmentType}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openEdit(job)} className="rounded-full">
                  <Edit className="w-4 h-4" />
                </Button>
                {job.isActive && (
                  <Button variant="ghost" size="sm" onClick={() => deactivateJob.mutate({ id: job.id })} className="rounded-full text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Announcements ─────────────────────────────────────────────────────────────
function AnnouncementsTab() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const utils = trpc.useUtils();

  const { data: announcements } = trpc.announcements.listAll.useQuery();
  const create = trpc.announcements.create.useMutation({ onSuccess: () => { utils.announcements.listAll.invalidate(); setOpen(false); setForm({ title: "", content: "" }); toast.success("Announcement published."); } });
  const update = trpc.announcements.update.useMutation({ onSuccess: () => { utils.announcements.listAll.invalidate(); toast.success("Updated."); } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>Announcements</h2>
        <Button onClick={() => setOpen(true)} className="btn-gold rounded-full gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea className="mt-1 min-h-[100px]" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="btn-green" onClick={() => create.mutate(form)} disabled={create.isPending || !form.title || !form.content}>
                {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {announcements?.map((a: any) => (
          <Card key={a.id} className={cn("border shadow-sm", !a.isActive && "opacity-60")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-gray-900">{a.title}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                  <div className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => update.mutate({ id: a.id, isActive: !a.isActive })} className="rounded-full shrink-0 text-xs">
                  {a.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function Admin() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // If URL contains an application ID, show that application's detail
  useEffect(() => {
    console.log("[Admin] location changed:", location);
    // Parse the URL to extract the application ID
    const match = location.match(/\/admin\/application\/(\d+)/);
    if (match && match[1]) {
      const appId = parseInt(match[1]);
      console.log("[Admin] Setting selectedAppId to:", appId);
      setSelectedAppId(appId);
    } else {
      console.log("[Admin] Clearing selectedAppId");
      setSelectedAppId(null);
    }
  }, [location]);

  const { data: unreadMessages } = trpc.messages.adminUnreadCount.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin", refetchInterval: 15000 });

  const handleLogout = async () => { await logout(); navigate("/"); };
  const handleNavigate = (path: string) => { navigate(path); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand-green)" }} /></div>;

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--brand-green)" }} />
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "var(--brand-green)" }}>Admin Access Required</h2>
          <p className="text-gray-500 mb-6 text-sm">This area is restricted to administrators only.</p>
          <Link href="/"><Button className="btn-gold rounded-full px-8">Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  // If an application is selected, show its detail view
  if (selectedAppId) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} unreadMessages={unreadMessages} onLogout={handleLogout} />
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <AdminApplicationDetail appId={selectedAppId} onBack={() => setSelectedAppId(null)} />
          </div>
        </main>
      </div>
    );
  }

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    applications: <ApplicationsTab />,
    messages: <MessagesTab />,
    jobs: <JobsTab />,
    announcements: <AnnouncementsTab />,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} unreadMessages={unreadMessages} onLogout={handleLogout} />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-sm" style={{ color: "var(--brand-green)" }}>Admin Panel</span>
        <div className="flex gap-2">
          {(unreadMessages ?? 0) > 0 && (
            <button onClick={() => setActiveTab("messages")} className="relative">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white" style={{ background: "var(--brand-gold)" }}>{unreadMessages}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-2 py-1 flex justify-around">
        {[
          { id: "overview", icon: Building2, label: "Overview" },
          { id: "applications", icon: Users, label: "Apps" },
          { id: "messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
          { id: "jobs", icon: Briefcase, label: "Jobs" },
          { id: "announcements", icon: Megaphone, label: "News" },
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={cn("flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg relative", activeTab === item.id ? "text-green-800" : "text-gray-400")}>
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white" style={{ background: "var(--brand-gold)" }}>{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {tabContent[activeTab]}
        </div>
      </main>
    </div>
  );
}
