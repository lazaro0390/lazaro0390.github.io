import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'

interface CheckResult {
  id: string
  name: string
  category: string
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: check, error } = await supabase
      .from('compliance_checks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !check) {
      return Response.json({ error: 'Check not found' }, { status: 404 })
    }

    const results = check.check_results as CheckResults

    // Generate PDF
    const doc = new jsPDF()
    let yPos = 20

    // Header
    doc.setFontSize(24)
    doc.setTextColor(13, 148, 136) // Teal color
    doc.text('10DLC Compliance Report', 20, yPos)
    yPos += 15

    // Check details
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`, 20, yPos)
    yPos += 6

    if (check.check_name) {
      doc.text(`Check Name: ${check.check_name}`, 20, yPos)
      yPos += 6
    }
    if (check.website_url) {
      doc.text(`Website: ${check.website_url}`, 20, yPos)
      yPos += 6
    }
    yPos += 10

    // Score summary box
    doc.setFillColor(240, 253, 250) // Light teal background
    doc.rect(20, yPos, 170, 35, 'F')
    doc.setDrawColor(13, 148, 136)
    doc.rect(20, yPos, 170, 35, 'S')

    yPos += 10
    doc.setFontSize(14)
    doc.setTextColor(13, 148, 136)
    doc.text('Overall Compliance Score', 25, yPos)

    doc.setFontSize(32)
    const scoreColor = results.summary.overallScore >= 80 ? [13, 148, 136] : 
                       results.summary.overallScore >= 60 ? [234, 179, 8] : [220, 38, 38]
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.text(`${results.summary.overallScore}%`, 150, yPos + 5)

    yPos += 12
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`${results.summary.passedChecks} Passed | ${results.summary.failedChecks} Failed | ${results.summary.warningChecks} Warnings`, 25, yPos)
    yPos += 25

    // Critical Issues
    if (results.summary.criticalIssues.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(220, 38, 38)
      doc.text('Critical Issues', 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      for (const issue of results.summary.criticalIssues.slice(0, 5)) {
        const lines = doc.splitTextToSize(`• ${issue}`, 165)
        doc.text(lines, 25, yPos)
        yPos += lines.length * 5
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
      }
      yPos += 10
    }

    // Detailed Results
    doc.setFontSize(14)
    doc.setTextColor(13, 148, 136)
    doc.text('Detailed Compliance Checks', 20, yPos)
    yPos += 10

    // Group checks by category
    const categories = ['privacy', 'terms', 'consent', 'disclosure', 'contact']
    const categoryLabels: Record<string, string> = {
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      consent: 'Consent Requirements',
      disclosure: 'Disclosure Requirements',
      contact: 'Contact Information',
    }

    for (const category of categories) {
      const categoryChecks = results.checks.filter(c => c.category === category)
      if (categoryChecks.length === 0) continue

      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(categoryLabels[category] || category, 20, yPos)
      yPos += 8

      for (const check of categoryChecks) {
        if (yPos > 260) {
          doc.addPage()
          yPos = 20
        }

        // Status indicator
        const statusColors: Record<string, number[]> = {
          pass: [13, 148, 136],
          fail: [220, 38, 38],
          warning: [234, 179, 8],
        }
        const statusLabels: Record<string, string> = {
          pass: 'PASS',
          fail: 'FAIL',
          warning: 'WARN',
        }
        
        doc.setFontSize(9)
        doc.setTextColor(statusColors[check.status][0], statusColors[check.status][1], statusColors[check.status][2])
        doc.text(`[${statusLabels[check.status]}]`, 25, yPos)

        doc.setTextColor(40, 40, 40)
        doc.text(check.name, 45, yPos)
        yPos += 5

        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        const descLines = doc.splitTextToSize(check.description, 155)
        doc.text(descLines, 30, yPos)
        yPos += descLines.length * 4

        if (check.status !== 'pass' && check.recommendation) {
          doc.setTextColor(13, 148, 136)
          const recLines = doc.splitTextToSize(`Recommendation: ${check.recommendation}`, 155)
          doc.text(recLines, 30, yPos)
          yPos += recLines.length * 4
        }

        yPos += 4
      }
      yPos += 5
    }

    // Recommendations section
    if (results.summary.recommendations.length > 0) {
      if (yPos > 220) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(13, 148, 136)
      doc.text('Summary Recommendations', 20, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      for (let i = 0; i < Math.min(results.summary.recommendations.length, 10); i++) {
        const rec = results.summary.recommendations[i]
        const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 165)
        doc.text(lines, 25, yPos)
        yPos += lines.length * 5 + 2
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
      }
    }

    // Footer on last page
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Generated by 10DLC Compliance Checker', 20, 285)
    doc.text('This report is for informational purposes only and does not constitute legal advice.', 20, 290)

    // Get PDF as array buffer
    const pdfBuffer = doc.output('arraybuffer')

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${check.check_name || id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
