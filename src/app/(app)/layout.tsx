import { AuthProvider } from "@/components/providers/auth-provider";
import { BillingGuard } from "@/components/billing/billing-guard";
import { ProjectProvider } from "@/contexts/project-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BillingGuard>
        <ProjectProvider>{children}</ProjectProvider>
      </BillingGuard>
    </AuthProvider>
  );
}
