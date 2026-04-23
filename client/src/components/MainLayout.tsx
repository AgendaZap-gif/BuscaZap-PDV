import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Fixed on desktop, overlay on mobile */}
      <Sidebar />

      {/* Main Content - With margin on desktop to account for fixed sidebar */}
      <main className="flex-1 md:ml-64 w-full overflow-auto">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
