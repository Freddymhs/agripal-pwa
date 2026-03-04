import { AuthProvider } from "@/components/providers/auth-provider";
import { ProjectProvider } from "@/contexts/project-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProjectProvider>{children}</ProjectProvider>
    </AuthProvider>
  );
}
