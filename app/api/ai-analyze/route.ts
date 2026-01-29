import { NextRequest, NextResponse } from 'next/server'

// Ensure this route runs in the Node.js runtime so process.env.GROQ_API_KEY is available
export const runtime = 'nodejs'

// Enhanced environment variable loading for Groq
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(k => k.includes('GROQ')));
}

// Try multiple possible environment variable names for better compatibility
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const PRIMARY_MODEL = 'llama-3.3-70b-versatile' // Primary production model
const FALLBACK_MODEL = 'llama-3.1-8b-instant' // Fallback model

// Enhanced environment variable debugging
console.log('=== Environment Variables Debug ===');
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('GROQ_API_KEY length:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);
console.log('All env vars starting with GROQ or NEXT:', 
  Object.keys(process.env).filter(k => 
    k.startsWith('GROQ') || 
    k.startsWith('NEXT') ||
    k === 'NODE_ENV'
  )
);

// Debug log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables check:')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY)
  console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('NODE_ENV')))
}

// Local, rule-based analysis used only when Groq is unavailable
function fallbackAnalysis(symptoms: string, lifestyle: string) {
  const s = (symptoms || '').toLowerCase()
  const l = (lifestyle || '').toLowerCase()

  const hasStress =
    s.includes('stress') || s.includes('anxiety') || s.includes('overwhelm') || l.includes('stress')
  const hasSleepIssues =
    s.includes('sleep') ||
    s.includes('insomnia') ||
    s.includes('waking') ||
    s.includes('tired') ||
    s.includes('fatigue')
  const hasMoodChanges =
    s.includes('mood') ||
    s.includes('irritable') ||
    s.includes('depressed') ||
    s.includes('emotional') ||
    s.includes('low motivation')
  const hasWeightOrAppetite =
    s.includes('weight') || s.includes('gain') || s.includes('loss') || s.includes('appetite')
  const hasCycleIssues =
    s.includes('period') ||
    s.includes('cycle') ||
    s.includes('pms') ||
    s.includes('menstrual') ||
    s.includes('cramps')
  const hasSkinOrHair =
    s.includes('acne') || s.includes('breakout') || s.includes('skin') || s.includes('hair')
  const hasEnergyIssues = s.includes('energy') || s.includes('exhausted') || s.includes('burnout')

  const highStressLifestyle = l.includes('long hours') || l.includes('high stress') || l.includes('deadline')
  const poorSleepLifestyle =
    l.includes('late night') || l.includes('screens') || l.includes('insomnia') || l.includes('shift work')
  const lowMovementLifestyle =
    l.includes('sedentary') || l.includes('no exercise') || l.includes('desk job')

  let analysis = ''
  let recommendations: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  let nextSteps: string[] = []

  if (hasStress && hasSleepIssues && hasEnergyIssues) {
    analysis =
      'Your symptoms point toward chronic stress and a disrupted daily rhythm, where cortisol and nervous system activation may be staying high at the wrong times. This can leave you feeling wired yet tired, with lighter, less restorative sleep and daytime energy crashes.'
    recommendations = [
      'Create a strict wind‑down routine 60–90 minutes before bed that removes screens and intense work.',
      'Anchor your first meal of the day with 20–30g of protein and some fiber to stabilize blood sugar and energy.',
      'Build in 1–2 short “stress release” breaks during the day, such as a 5‑minute walk or slow breathing.',
      'Aim for a consistent sleep and wake window, even on weekends, to help reset your circadian rhythm.',
    ]
    riskLevel = highStressLifestyle || poorSleepLifestyle ? 'medium' : 'low'
    nextSteps = [
      'Track your sleep timing, energy levels, and biggest stressors for 1–2 weeks.',
      'Discuss persistent fatigue or unrefreshing sleep with a healthcare provider and ask whether basic labs (thyroid, iron, B12, glucose) are appropriate.',
      'If early‑morning waking or frequent night waking continues, consider a sleep‑focused or stress‑focused clinician for deeper support.',
    ]
  } else if (hasCycleIssues || hasWeightOrAppetite) {
    analysis =
      'Your description suggests that reproductive hormones and blood sugar regulation may both be playing a role. Fluctuations in estrogen and progesterone across the cycle, combined with swings in insulin, can drive changes in mood, cramps, cravings, and weight shifts.'
    recommendations = [
      'Keep meals balanced with protein, fiber, and healthy fats to avoid large sugar spikes and crashes.',
      'Include gentle to moderate movement most days, adding strength training 2–3 times per week if possible.',
      'Increase intake of leafy greens, cruciferous vegetables, and omega‑3 fats to support hormone metabolism.',
      'Limit heavily processed foods and sugary drinks, especially on days with more cravings.',
    ]
    riskLevel = 'medium'
    nextSteps = [
      'Track your symptoms across at least 2–3 cycles, noting where in the cycle things worsen.',
      'Talk with a provider about whether a hormone panel and metabolic markers (such as fasting glucose and lipids) are appropriate.',
      'Consider a focused review of sleep, stress, and movement habits, as these strongly influence both cycle symptoms and weight trends.',
    ]
  } else if (hasSkinOrHair) {
    analysis =
      'Skin and hair changes often reflect a combination of androgen activity, insulin sensitivity, and inflammation. Your symptoms may indicate that hormones and blood sugar are interacting with your skin barrier and oil production.'
    recommendations = [
      'Favor whole, minimally processed foods with an emphasis on colorful vegetables and omega‑3 sources such as flax, chia, or fatty fish.',
      'Avoid frequent large sugar spikes by pairing carbs with protein and fiber.',
      'Use gentle, non‑stripping skincare and avoid harsh over‑cleansing that can irritate the skin.',
      'Incorporate regular movement to improve circulation and insulin sensitivity.',
    ]
    riskLevel = 'low'
    nextSteps = [
      'Track how your skin or hair changes across your menstrual cycle, stress levels, or major diet shifts.',
      'If breakouts or shedding are severe or rapidly changing, consult a dermatologist or hormone‑aware clinician.',
      'Ask a provider whether checking androgen levels, thyroid, or basic metabolic labs makes sense for your case.',
    ]
  } else {
    analysis =
      'Your symptoms suggest milder hormonal and lifestyle influences rather than a single, severe imbalance. Daily patterns in stress, sleep, movement, and blood sugar likely play a meaningful role in how you are feeling.'
    recommendations = [
      'Choose a regular sleep and wake schedule and protect a short, calming pre‑bed routine.',
      'Build meals around whole foods with a source of protein, fiber, and healthy fat at most sittings.',
      'Add light to moderate movement on most days, even in 10–15 minute chunks, to support hormones and energy.',
      'Schedule brief, intentional breaks away from screens to reduce all‑day low‑grade stress.',
    ]
    riskLevel = 'low'
    nextSteps = [
      'Keep a simple log of sleep, stress, movement, and key symptoms for 1–2 weeks to see patterns.',
      'Use that log to discuss concerns with a healthcare provider if symptoms persist or worsen.',
      'Reassess after 3–4 weeks of consistent small changes to see which habits make the biggest difference for you.',
    ]
  }

  return { analysis, recommendations, riskLevel, nextSteps }
}

// Call Groq's Chat Completions API and return raw text content
async function generateAnalysisWithGroq(prompt: string, model: string) {
  if (!GROQ_API_KEY) {
    throw new Error('Missing or invalid GROQ_API_KEY')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert in women's hormonal health and integrative medicine. Your role is to provide personalized, evidence-based analysis of symptoms in relation to hormonal health. 
          
          When analyzing symptoms:
          1. Identify and explicitly mention at least 2-3 specific symptoms from the user's input
          2. Explain potential connections between these symptoms and hormonal patterns
          3. Consider the interplay between different body systems (endocrine, nervous, immune)
          4. Provide specific, actionable recommendations
          5. Use a compassionate and supportive tone
          
          Your response must be valid JSON that follows the exact structure specified in the user's prompt.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error('Groq API error:', { status: response.status, errorText })
    throw new Error(`Groq API error (${response.status}): ${errorText}`)
  }

  const data: any = await response.json()
  const text =
    data?.choices?.[0]?.message?.content && typeof data.choices[0].message.content === 'string'
      ? data.choices[0].message.content.trim()
      : ''

  if (!text) {
    throw new Error('Groq API returned empty content')
  }

  return text
}

export async function POST(request: NextRequest) {
  try {
    const { symptoms, lifestyle, cycleData } = await request.json()

    let ai: any
    if (!GROQ_API_KEY) {
      // Fail loudly in all environments so missing configuration is obvious
      console.error(
        '[ai-analyze] GROQ_API_KEY is missing. Define it in .env.local (or deployment env) and restart the server.',
        { nodeEnv: process.env.NODE_ENV, cwd: process.cwd() },
      )
      throw new Error('GROQ_API_KEY is not configured for /api/ai-analyze')
    } else {
      try {
        console.log('Using Groq API for /api/ai-analyze with model:', PRIMARY_MODEL)

        const prompt = `As a hormone wellness expert, deeply analyze these symptoms and lifestyle factors and provide individualized, interconnected insights. You must refer to the user's specific symptoms by name (using their wording or a close paraphrase) and explain how they fit together: 

SYMPTOMS:
${symptoms}

LIFESTYLE FACTORS:
${lifestyle}

CYCLE DATA:
${cycleData ? JSON.stringify(cycleData, null, 2) : 'No cycle data provided'}

YOUR TASK:
1. Analyze the symptoms in relation to each other and potential hormonal patterns
2. Consider the person's lifestyle context and cycle data (if available)
3. Provide a personalized, evidence-based response

RESPONSE FORMAT (MUST BE VALID JSON):
{
  "analysis": "A detailed analysis that explicitly mentions at least 3 specific symptoms from the user's input. Explain how these symptoms might be connected to each other and to potential hormonal patterns (e.g., cortisol, thyroid, estrogen, progesterone, insulin). Reference specific lifestyle factors that could be influencing these symptoms.",
  "recommendations": [
    "Specific dietary suggestion related to symptoms",
    "Lifestyle adjustment targeting symptom relief",
    "Sleep hygiene or stress management strategy",
    "When to consider professional medical advice"
  ],
  "riskLevel": "low|medium|high",
  "nextSteps": [
    "Specific tracking to implement (e.g., symptom journaling, sleep tracking)",
    "Recommended lab tests to discuss with a healthcare provider",
    "Immediate self-care actions",
    "When to seek medical attention"
  ],
  "keyInsights": [
    "1-2 sentences summarizing the most important connection between symptoms",
    "1-2 sentences on the most impactful lifestyle factor to address"
  ]
}

IMPORTANT:
- Use the person's exact symptom descriptions where possible
- Be specific and avoid generic advice
- Consider both immediate relief and long-term management
- Include at least one concrete action the person can take today`

        let text: string

        // Try primary model first, fallback to secondary model if needed
        try {
          text = await generateAnalysisWithGroq(prompt, PRIMARY_MODEL)
        } catch (primaryError) {
          console.warn(`Primary model (${PRIMARY_MODEL}) error, trying fallback model:`, primaryError)
          try {
            text = await generateAnalysisWithGroq(prompt, FALLBACK_MODEL)
          } catch (fallbackError) {
            console.error('Both primary and fallback models failed:', { primaryError, fallbackError })
            throw new Error(`API request failed after fallback: ${fallbackError}`)
          }
        }

        let json = text.trim()
        if (json.startsWith('```json')) {
          json = json.replace(/```json\n?/, '').replace(/\n?```$/, '')
        }
        if (json.startsWith('```')) {
          json = json.replace(/```\n?/, '').replace(/\n?```$/, '')
        }

        try {
          ai = JSON.parse(json)
        } catch {
          ai = { analysis: text }
        }
      } catch (err) {
        console.warn('Groq error in /api/ai-analyze, using fallback analysis:', err)
        ai = fallbackAnalysis(symptoms, lifestyle)
      }
    }

    // Persist to backend (best-effort, non-blocking)
    try {
      const backend = process.env.BACKEND_URL || 'http://127.0.0.1:5000'
      await fetch(`${backend}/api/analyze/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          symptoms, 
          lifestyle, 
          cycleData, 
          aiInsights: ai,
          analyzedAt: new Date().toISOString(),
          modelUsed: PRIMARY_MODEL,
          apiVersion: '1.1' // Track API version for future compatibility
        }),
      })
    } catch (error) {
      console.error('Failed to save analysis:', error)
      // Continue even if save fails
    }

    return NextResponse.json(ai)
  } catch (error) {
    console.error('Error in /api/ai-analyze:', error)
    // Return fallback analysis with error context
    const fallback = fallbackAnalysis(
      'general',
      'general'
    )
    return NextResponse.json({
      ...fallback,
      _error: 'Analysis failed, showing fallback response',
      _errorDetails: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
