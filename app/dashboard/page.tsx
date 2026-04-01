import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileCheck, History, ArrowRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch recent checks
  const { data: recentChecks } = await supabase
    .from('compliance_checks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate stats
  const { data: allChecks } = await supabase
    .from('compliance_checks')
    .select('overall_score, passed_checks, failed_checks, warning_checks')
  
  const totalChecks = allChecks?.length || 0
  const avgScore = totalChecks > 0 
    ? Math.round((allChecks?.reduce((acc, c) => acc + (c.overall_score || 0), 0) || 0) / totalChecks)
    : 0

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
          </h1>
          <p className="text-muted-foreground">
            Run compliance checks and manage your 10DLC campaign readiness.
          </p>
        </div>
        <Link href="/dashboard/check">
          <Button className="gap-2">
            <FileCheck className="h-4 w-4" />
            New Compliance Check
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Checks"
          value={totalChecks.toString()}
          description="All time compliance checks"
          icon={<FileCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="Average Score"
          value={`${avgScore}%`}
          description="Across all checks"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Issues Found"
          value={(allChecks?.reduce((acc, c) => acc + (c.failed_checks || 0), 0) || 0).toString()}
          description="Total failed requirements"
          icon={<XCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="Warnings"
          value={(allChecks?.reduce((acc, c) => acc + (c.warning_checks || 0), 0) || 0).toString()}
          description="Items needing attention"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Recent Checks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Checks</CardTitle>
            <CardDescription>Your latest compliance check results</CardDescription>
          </div>
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentChecks && recentChecks.length > 0 ? (
            <div className="space-y-3">
              {recentChecks.map((check) => (
                <Link key={check.id} href={`/dashboard/report/${check.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {check.check_name || check.website_url || 'Compliance Check'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(check.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <ScoreBadge score={check.overall_score} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">No compliance checks yet</p>
              <Link href="/dashboard/check">
                <Button>Run Your First Check</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Start New Check
            </CardTitle>
            <CardDescription>
              Analyze a website or paste your Terms & Conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/check">
              <Button className="w-full">Start Compliance Check</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              View History
            </CardTitle>
            <CardDescription>
              Access past checks and download reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/history">
              <Button variant="outline" className="w-full">View All Checks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  description, 
  icon 
}: { 
  title: string
  value: string
  description: string
  icon: React.ReactNode 
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-primary/10 text-primary'
    if (s >= 60) return 'bg-warning text-warning-foreground'
    return 'bg-destructive/10 text-destructive'
  }
  
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getColor(score)}`}>
      {score}%
    </span>
  )
}
