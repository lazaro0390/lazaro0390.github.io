import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  FileSearch, 
  FileText, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  Sparkles 
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-foreground">10DLC Check</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-sm text-accent-foreground">
            <Sparkles className="h-4 w-4" />
            AI-Powered Compliance Analysis
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            10DLC Compliance Made Simple
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground">
            Automatically check your website, Terms & Conditions, and Privacy Policy 
            for TCPA and CTIA compliance issues. Get detailed reports with actionable fixes.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2">
                Start Free Check <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Sign in to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Everything You Need for 10DLC Compliance
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<FileSearch className="h-6 w-6" />}
              title="URL Scanning"
              description="Enter your website URL and we&apos;ll automatically scan and extract relevant content for analysis."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Document Analysis"
              description="Paste your Terms & Conditions and Privacy Policy for comprehensive compliance checking."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="AI Analysis"
              description="Our AI engine checks 15+ TCPA/CTIA requirements and identifies specific compliance issues."
            />
            <FeatureCard
              icon={<Download className="h-6 w-6" />}
              title="PDF Reports"
              description="Download detailed compliance reports with pass/fail results and recommended fixes."
            />
          </div>
        </div>
      </section>

      {/* Compliance Checklist Preview */}
      <section className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                Comprehensive Compliance Checks
              </h2>
              <p className="mb-6 text-muted-foreground">
                We analyze your content against all major 10DLC requirements including:
              </p>
              <ul className="space-y-3">
                {[
                  'Privacy Policy presence and content',
                  'Terms & Conditions completeness',
                  'SMS consent language requirements',
                  'Opt-out instructions (STOP keyword)',
                  'Message frequency disclosure',
                  'Data usage and sharing policies',
                  'TCPA compliance markers',
                  'CTIA guideline adherence',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-background p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold text-foreground">Sample Check Results</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  85% Compliant
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Privacy Policy Found', status: 'pass' },
                  { label: 'Terms of Service Found', status: 'pass' },
                  { label: 'SMS Opt-in Language', status: 'pass' },
                  { label: 'STOP Keyword Mentioned', status: 'fail' },
                  { label: 'Message Frequency Disclosed', status: 'warning' },
                  { label: 'Data Sharing Policy', status: 'pass' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Ready to Check Your Compliance?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Join thousands of businesses ensuring their 10DLC campaigns meet all requirements.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">10DLC Check</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Helping businesses achieve SMS compliance since 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pass: 'bg-primary/10 text-primary',
    fail: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning text-warning-foreground',
  }
  const labels = {
    pass: 'Pass',
    fail: 'Fail',
    warning: 'Warning',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}
