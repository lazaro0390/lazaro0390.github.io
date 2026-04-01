'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { 
  Globe, 
  FileText, 
  AlertCircle,
  Shield,
  CheckCircle2 
} from 'lucide-react'

export default function ComplianceCheckPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('url')
  
  // URL scanning form
  const [checkName, setCheckName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  
  // Text paste form
  const [termsContent, setTermsContent] = useState('')
  const [privacyContent, setPrivacyContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        checkName: checkName || (websiteUrl ? new URL(websiteUrl).hostname : 'Manual Check'),
        websiteUrl: activeTab === 'url' ? websiteUrl : undefined,
        termsContent: activeTab === 'text' ? termsContent : undefined,
        privacyContent: activeTab === 'text' ? privacyContent : undefined,
      }

      // Validate
      if (activeTab === 'url' && !websiteUrl) {
        throw new Error('Please enter a website URL')
      }
      if (activeTab === 'text' && !termsContent && !privacyContent) {
        throw new Error('Please enter at least Terms & Conditions or Privacy Policy content')
      }

      const response = await fetch('/api/compliance/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze compliance')
      }

      // Redirect to results page
      router.push(`/dashboard/report/${data.checkId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Compliance Check</h1>
        <p className="text-muted-foreground">
          Scan a website URL or paste your Terms & Conditions for 10DLC compliance analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance Analysis
            </CardTitle>
            <CardDescription>
              Choose how you want to provide content for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Check Name */}
            <div className="space-y-2">
              <Label htmlFor="checkName">Check Name (optional)</Label>
              <Input
                id="checkName"
                placeholder="e.g., My Company Website Check"
                value={checkName}
                onChange={(e) => setCheckName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give this check a name to easily identify it later
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="gap-2">
                  <Globe className="h-4 w-4" />
                  URL Scanning
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll scan your website and automatically find Privacy Policy and Terms pages
                  </p>
                </div>
                
                <div className="rounded-lg border border-border bg-accent/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    What we analyze:
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>- Homepage content and messaging</li>
                    <li>- Privacy Policy page (auto-detected)</li>
                    <li>- Terms & Conditions page (auto-detected)</li>
                    <li>- Contact forms and opt-in mechanisms</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="termsContent">Terms & Conditions</Label>
                  <Textarea
                    id="termsContent"
                    placeholder="Paste your Terms & Conditions here..."
                    rows={8}
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="privacyContent">Privacy Policy</Label>
                  <Textarea
                    id="privacyContent"
                    placeholder="Paste your Privacy Policy here..."
                    rows={8}
                    value={privacyContent}
                    onChange={(e) => setPrivacyContent(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Analyzing Compliance...
                </>
              ) : (
                'Run Compliance Check'
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Compliance Requirements Preview */}
      <Card>
        <CardHeader>
          <CardTitle>10DLC Requirements Checked</CardTitle>
          <CardDescription>
            Our AI analyzes your content against these TCPA/CTIA requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Privacy Policy presence',
              'Terms of Service presence', 
              'SMS consent language',
              'Opt-out instructions (STOP)',
              'Message frequency disclosure',
              'Message & data rates notice',
              'Business identification',
              'Data sharing policies',
              'User consent mechanisms',
              'Contact information',
              'HELP keyword support',
              'Carrier messaging disclaimer',
            ].map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground">{req}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
