import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Shield,
  FileText,
  Lock,
  MessageSquare,
  Info,
  Phone
} from 'lucide-react'

interface CheckResult {
  id: string
  name: string
  category: 'privacy' | 'terms' | 'consent' | 'disclosure' | 'contact'
  status: 'pass' | 'fail' | 'warning'
  description: string
  recommendation: string | null
  evidence: string | null
}

interface CheckResults {
  checks: CheckResult[]
  summary: {
    overallScore: number
    totalChecks: number
    passedChecks: number
    failedChecks: number
    warningChecks: number
    criticalIssues: string[]
    recommendations: string[]
  }
}

const categoryIcons = {
  privacy: Shield,
  terms: FileText,
  consent: Lock,
  disclosure: MessageSquare,
  contact: Phone,
}

const categoryLabels = {
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  consent: 'Consent Requirements',
  disclosure: 'Disclosure Requirements',
  contact: 'Contact Information',
}

export default async function ReportPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: check, error } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !check) {
    notFound()
  }

  const results = check.check_results as CheckResults

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {check.check_name || 'Compliance Report'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {check.website_url || 'Manual content check'} - {new Date(check.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <a href={`/api/compliance/pdf/${id}`} download>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
        </a>
      </div>

      {/* Score Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full lg:col-span-2">
          <CardContent className="flex items-center gap-6 pt-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <span className={`text-3xl font-bold ${
                results.summary.overallScore >= 80 ? 'text-primary' :
                results.summary.overallScore >= 60 ? 'text-warning-foreground' :
                'text-destructive'
              }`}>
                {results.summary.overallScore}%
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Overall Compliance Score</h2>
              <p className="text-sm text-muted-foreground">
                Based on {results.summary.totalChecks} compliance requirements
              </p>
              <div className="mt-2 flex gap-4">
                <span className="flex items-center gap-1 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" /> {results.summary.passedChecks} Passed
                </span>
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> {results.summary.failedChecks} Failed
                </span>
                <span className="flex items-center gap-1 text-sm text-warning-foreground">
                  <AlertTriangle className="h-4 w-4" /> {results.summary.warningChecks} Warnings
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <StatsCard
          title="Passed"
          value={results.summary.passedChecks}
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          variant="success"
        />
        <StatsCard
          title="Failed"
          value={results.summary.failedChecks}
          icon={<XCircle className="h-5 w-5 text-destructive" />}
          variant="danger"
        />
      </div>

      {/* Critical Issues */}
      {results.summary.criticalIssues.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Critical Issues
            </CardTitle>
            <CardDescription>
              These issues must be addressed for 10DLC compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.summary.criticalIssues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results by Category */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Detailed Results</h2>
        {(['privacy', 'terms', 'consent', 'disclosure', 'contact'] as const).map((category) => {
          const categoryChecks = results.checks.filter(c => c.category === category)
          if (categoryChecks.length === 0) return null

          const Icon = categoryIcons[category]
          const passCount = categoryChecks.filter(c => c.status === 'pass').length
          const totalCount = categoryChecks.length

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {categoryLabels[category]}
                  </CardTitle>
                  <Badge variant={passCount === totalCount ? 'default' : 'secondary'}>
                    {passCount}/{totalCount} Passed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryChecks.map((checkItem) => (
                  <div key={checkItem.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <StatusIcon status={checkItem.status} />
                        <div>
                          <h4 className="font-medium text-foreground">{checkItem.name}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{checkItem.description}</p>
                          {checkItem.evidence && (
                            <p className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
                              {checkItem.evidence}
                            </p>
                          )}
                          {checkItem.status !== 'pass' && checkItem.recommendation && (
                            <div className="mt-3 flex items-start gap-2 rounded-md bg-primary/5 p-3">
                              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <p className="text-sm text-foreground">{checkItem.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={checkItem.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recommendations */}
      {results.summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Actions to improve your compliance score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {results.summary.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{rec}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/dashboard/check">
          <Button variant="outline" className="w-full sm:w-auto">
            Run Another Check
          </Button>
        </Link>
        <a href={`/api/compliance/pdf/${id}`} download>
          <Button className="w-full gap-2 sm:w-auto">
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
        </a>
      </div>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  variant 
}: { 
  title: string
  value: number
  icon: React.ReactNode
  variant: 'success' | 'danger' 
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold ${variant === 'success' ? 'text-primary' : 'text-destructive'}`}>
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
          variant === 'success' ? 'bg-primary/10' : 'bg-destructive/10'
        }`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warning' }) {
  if (status === 'pass') return <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
  if (status === 'fail') return <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
  return <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-foreground" />
}

function StatusBadge({ status }: { status: 'pass' | 'fail' | 'warning' }) {
  const variants = {
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
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status]}`}>
      {labels[status]}
    </span>
  )
}
