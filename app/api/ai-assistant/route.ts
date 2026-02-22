import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages, context } = await req.json()

    // Build system prompt with audit context
    const systemPrompt = `You are ISO Shield AI, an expert ISO 27001 security audit assistant embedded in the ISO Shield platform.

Your role is to help security professionals with:
- Explaining ISO 27001 controls and requirements
- Analyzing vulnerabilities (OWASP Top 10) and their implications
- Suggesting remediation strategies and implementation guidance
- Interpreting risk scores and compliance gaps
- Recommending audit best practices
- Explaining security concepts in clear, actionable language

${context ? `Current audit context:
- Organization: ${context.orgName || 'Not set'}
- Sector: ${context.sector || 'Not set'}
- Total Assets: ${context.totalAssets || 0}
- Compliance Score: ${context.complianceScore || 0}%
- High/Critical Risks: ${context.highRisks || 0}
- Open Findings: ${context.openFindings || 0}
` : ''}

Guidelines:
- Be concise but thorough — use bullet points and structure where helpful
- Always provide actionable recommendations
- Reference specific ISO 27001 control numbers (e.g., A.9.2.3) when relevant
- For vulnerabilities, reference OWASP IDs when applicable
- Prioritize by risk severity when making recommendations
- Be direct — auditors need clear answers, not vague generalities`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,   // ← INI YANG KURANG
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || 'I could not generate a response. Please try again.'

    return NextResponse.json({ message: text })
  } catch (err: any) {
    console.error('AI API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
