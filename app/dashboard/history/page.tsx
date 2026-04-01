import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileCheck, 
  ArrowRight, 
  Download, 
  Calendar,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { DeleteCheckButton } from '@/components/delete-check-button'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check History</h1>
          <p className="text-muted-foreground">
            View and manage all your compliance checks
          </p>
        </div>
        <Link href="/dashboard/check">
          <Button className="gap-2">
            <FileCheck className="h-4 w-4" />
            New Check
          </Button>
        </Link>
      </div>

      {checks && checks.length > 0 ? (
        <div className="space-y-4">
          {checks.map((check) => (
            <Card key={check.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
                    {/* Score */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className={`text-xl font-bold ${
                        check.overall_score >= 80 ? 'text-primary' :
                        check.overall_score >= 60 ? 'text-warning-foreground' :
                        'text-destructive'
                      }`}>
                        {check.overall_score}%
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {check.check_name || 'Compliance Check'}
                      </h3>
                      {check.website_url && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {check.website_url}
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(check.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        {check.passed_checks}
                      </span>
                      <span className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" />
                        {check.failed_checks}
                      </span>
                      <span className="flex items-center gap-1 text-warning-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        {check.warning_checks}
                      </span>
                    </div>

                    <Badge variant={
                      check.overall_score >= 80 ? 'default' :
                      check.overall_score >= 60 ? 'secondary' :
                      'destructive'
                    }>
                      {check.overall_score >= 80 ? 'Compliant' :
                       check.overall_score >= 60 ? 'Needs Work' :
                       'Non-Compliant'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <a href={`/api/compliance/pdf/${check.id}`} download>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </a>
                    <Link href={`/dashboard/report/${check.id}`}>
                      <Button size="sm" className="gap-1">
                        View <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteCheckButton checkId={check.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No checks yet</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Run your first compliance check to see results here
            </p>
            <Link href="/dashboard/check">
              <Button>Run Your First Check</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
