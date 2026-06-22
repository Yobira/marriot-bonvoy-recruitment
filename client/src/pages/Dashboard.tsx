import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Home,
  LogOut,
  Mail,
  MessageCircle,
  User,
  XCircle,
  CalendarClock,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; step: number }> = {
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6", icon: FileText, step: 0 },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#dbeafe", icon: CheckCircle2, step: 1 },
  under_review: { label: "Under Review", color: "#d97706", bg: "#fef3c7", icon: Clock, step: 2 },
  interview_scheduled: { label: "Interview Scheduled", color: "#7c3aed", bg: "#ede9fe", icon: CalendarClock, step: 3 },
  accepted: { label: "Accepted", color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2, step: 4 },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2", icon: XCircle, step: 4 },
};

const STATUS_STEPS = ["submitted", "under_review", "interview_scheduled", "accepted"];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  const isRejected = status === "rejected";

  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = currentStep > i + 1 || (currentStep === i + 1 && !isRejected);
        const active = currentStep === i + 1 && !isRejected;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 transition-all",
              done || active ? "text-white" : "bg-gray-100 text-gray-400"
            )}
              style={done || active ? { background: "var(--brand-green)" } : {}}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 rounded", done ? "bg-green-600" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DashboardNav({ activeTab, setActiveTab, unreadMessages, unreadNotifications, onLogout }: any) {
  const navItems = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "applications", icon: Briefcase, label: "My Applications" },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
    { id: "notifications", icon: Bell, label: "Notifications", badge: unreadNotifications },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-100 min-h-screen">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--brand-green)" }}>
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand-gold)" }}>Marriot Bonvoy</div>
            <div className="text-xs text-gray-500">Applicant Portal</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
      <div className="p-4 border-t border-gray-100">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function OverviewTab({ applications, user }: any) {
  const submitted = applications?.filter((a: any) => a.applications.status !== "draft").length ?? 0;
  const accepted = applications?.filter((a: any) => a.applications.status === "accepted").length ?? 0;
  const underReview = applications?.filter((a: any) => a.applications.status === "under_review").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: "var(--brand-green)" }}>
          Welcome back, {user?.name?.split(" ")[0] ?? "Applicant"}
        </h1>
        <p className="text-gray-500 text-sm">Here's an overview of your recruitment journey.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Applications Submitted", value: submitted, color: "var(--brand-green)", bg: "rgba(26,74,58,0.08)" },
          { label: "Under Review", value: underReview, color: "#d97706", bg: "#fef3c7" },
          { label: "Accepted", value: accepted, color: "#16a34a", bg: "#dcfce7" },
        ].map(({ label, value, color, bg }) => (
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
          <div className="space-y-3">
            {applications.slice(0, 3).map((row: any) => (
              <ApplicationCard key={row.applications.id} row={row} />
            ))}
          </div>
        </div>
      )}

      {(!applications || applications.length === 0) && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-10 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-2">No Applications Yet</h3>
            <p className="text-sm text-gray-400 mb-4">Start your journey by applying for a position.</p>
            <Link href="/#positions">
              <Button className="btn-gold rounded-full">Browse Open Positions</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApplicationCard({ row }: { row: any }) {
  const app = row.applications;
  const job = row.job_positions;
  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;

  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{job?.title ?? "Position"}</div>
            <div className="text-xs text-gray-400 mt-0.5">{job?.category} · {job?.location}</div>
            <div className="mt-2">
              <StatusBadge status={app.status} />
            </div>
            {app.status !== "draft" && app.status !== "rejected" && (
              <StatusTimeline status={app.status} />
            )}
          </div>
          <Link href={`/application/${app.id}`}>
            <Button variant="ghost" size="sm" className="shrink-0">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="text-xs text-gray-400 mt-3">
          Applied {new Date(app.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationsTab({ applications }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>My Applications</h2>
        <Link href="/#positions">
          <Button size="sm" className="btn-gold rounded-full">New Application</Button>
        </Link>
      </div>

      {applications?.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-10 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No applications yet. Browse open positions to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {applications?.map((row: any) => <ApplicationCard key={row.applications.id} row={row} />)}
      </div>
    </div>
  );
}

function NotificationsTab({ notifications, markRead, markAllRead }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>Notifications</h2>
        {notifications?.some((n: any) => !n.isRead) && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
            Mark all read
          </Button>
        )}
      </div>

      {notifications?.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-10 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {notifications?.map((n: any) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer",
              n.isRead ? "bg-white border-gray-100" : "border-green-200 bg-green-50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", n.isRead ? "bg-gray-300" : "bg-green-500")} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{n.title}</div>
                {n.content && <div className="text-xs text-gray-500 mt-0.5">{n.content}</div>}
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ user }: any) {
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>My Profile</h2>
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: "var(--brand-green)" }}>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="font-semibold text-lg text-gray-900">{user?.name ?? "—"}</div>
              <div className="text-sm text-gray-500">{user?.email ?? "—"}</div>
              <Badge className="mt-1 text-xs" style={{ background: "rgba(201,168,76,0.15)", color: "var(--brand-gold-dark)" }}>
                Applicant
              </Badge>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Full Name", value: user?.name },
              { label: "Email Address", value: user?.email },
              { label: "Login Method", value: user?.loginMethod },
              { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-900">{value ?? "—"}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessagesTab({ applications }: any) {
  const submittedApps = applications?.filter((r: any) => r.applications.status !== "draft") ?? [];
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold" style={{ color: "var(--brand-green)" }}>Messages</h2>
      <p className="text-sm text-gray-500">Select an application to view and reply to messages from the recruitment team.</p>
      {submittedApps.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-10 text-center">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">Submit an application to start messaging.</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {submittedApps.map((row: any) => (
          <Link key={row.applications.id} href={`/application/${row.applications.id}?tab=messages`}>
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-gray-900">{row.job_positions?.title ?? "Position"}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <StatusBadge status={row.applications.status} />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [, navigate] = useLocation();

  const { data: applications } = trpc.applications.myApplications.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notifications } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unreadMessages } = trpc.messages.unreadCount.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unreadNotifications } = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated });

  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--brand-green)" }} />
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "var(--brand-green)" }}>Sign In Required</h2>
          <p className="text-gray-500 mb-6 text-sm">Please sign in to access your applicant dashboard.</p>
          <a href={getLoginUrl()}>
            <Button className="btn-gold rounded-full px-8">Sign In to Continue</Button>
          </a>
        </div>
      </div>
    );
  }

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab applications={applications} user={user} />,
    applications: <ApplicationsTab applications={applications} />,
    messages: <MessagesTab applications={applications} />,
    notifications: (
      <NotificationsTab
        notifications={notifications}
        markRead={(id: number) => markRead.mutate({ id })}
        markAllRead={() => markAllRead.mutate()}
      />
    ),
    profile: <ProfileTab user={user} />,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        onLogout={handleLogout}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--brand-green)" }}>
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--brand-green)" }}>My Portal</span>
        </Link>
        <div className="flex items-center gap-2">
          {(unreadMessages ?? 0) > 0 && (
            <button onClick={() => setActiveTab("messages")} className="relative">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white" style={{ background: "var(--brand-gold)" }}>{unreadMessages}</span>
            </button>
          )}
          <button onClick={() => setActiveTab("notifications")} className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {(unreadNotifications ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white" style={{ background: "var(--brand-gold)" }}>{unreadNotifications}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-2 py-1 flex justify-around">
        {[
          { id: "overview", icon: Home, label: "Home" },
          { id: "applications", icon: Briefcase, label: "Apps" },
          { id: "messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
          { id: "notifications", icon: Bell, label: "Alerts", badge: unreadNotifications },
          { id: "profile", icon: User, label: "Profile" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg relative", activeTab === item.id ? "text-green-800" : "text-gray-400")}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white" style={{ background: "var(--brand-gold)" }}>
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {tabContent[activeTab]}
        </div>
      </main>
    </div>
  );
}
