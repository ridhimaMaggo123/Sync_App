import { type NextRequest, NextResponse } from "next/server"

// Ensure this route runs in the Node.js runtime so process.env.GROQ_API_KEY is available
export const runtime = "nodejs"

// Enhanced environment variable loading for Groq
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(k => k.includes('GROQ')));
}

// Try multiple possible environment variable names for better compatibility
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

// Enhanced fallback responses based on symptom patterns
const generateDynamicFallback = (symptoms: string, lifestyle: string) => {
  const symptomsLower = symptoms.toLowerCase()
  const lifestyleLower = lifestyle.toLowerCase()
  
  // Analyze patterns in symptoms
  const hasStressSymptoms = symptomsLower.includes('stress') || symptomsLower.includes('anxiety') || symptomsLower.includes('overwhelm')
  const hasSleepIssues = symptomsLower.includes('sleep') || symptomsLower.includes('insomnia') || symptomsLower.includes('tired') || symptomsLower.includes('fatigue')
  const hasMoodChanges = symptomsLower.includes('mood') || symptomsLower.includes('irritable') || symptomsLower.includes('depression') || symptomsLower.includes('emotional')
  const hasWeightChanges = symptomsLower.includes('weight') || symptomsLower.includes('appetite') || symptomsLower.includes('eating')
  const hasPeriodIssues = symptomsLower.includes('period') || symptomsLower.includes('menstrual') || symptomsLower.includes('cycle') || symptomsLower.includes('pms')
  const hasSkinIssues = symptomsLower.includes('skin') || symptomsLower.includes('acne') || symptomsLower.includes('hair')
  const hasEnergyIssues = symptomsLower.includes('energy') || symptomsLower.includes('exhausted') || symptomsLower.includes('weak')
  
  // Analyze lifestyle factors
  const highStress = lifestyleLower.includes('high') && lifestyleLower.includes('stress')
  const poorSleep = lifestyleLower.includes('poor') && lifestyleLower.includes('sleep')
  const sedentary = lifestyleLower.includes('sedentary') || lifestyleLower.includes('no exercise')
  
  // Generate targeted response
  let analysis = ""
  let recommendations = []
  let riskLevel = "low"
  let nextSteps = []
  
  if (hasStressSymptoms && hasMoodChanges) {
    analysis = "Your symptoms indicate potential cortisol dysregulation, commonly associated with chronic stress. The combination of mood changes and stress-related symptoms suggests your adrenal system may be overworked, affecting your overall hormonal balance."
    recommendations = [
      "Implement daily stress-reduction techniques like deep breathing or meditation",
      "Consider adaptogenic herbs such as ashwagandha or rhodiola",
      "Prioritize protein-rich breakfasts to stabilize blood sugar",
      "Create boundaries around work and personal time",
      "Practice progressive muscle relaxation before bed"
    ]
    riskLevel = highStress ? "medium" : "low"
    nextSteps = [
      "Track stress levels and symptoms daily for 2 weeks",
      "Consider cortisol testing (saliva test preferred)",
      "Explore stress management counseling or therapy"
    ]
  } else if (hasSleepIssues && hasEnergyIssues) {
    analysis = "Your sleep and energy patterns suggest possible disruption in your circadian rhythm and potentially thyroid function. Poor sleep quality can significantly impact hormone production, particularly growth hormone and cortisol regulation."
    recommendations = [
      "Establish a consistent sleep schedule, even on weekends",
      "Create a technology-free bedroom environment",
      "Consider magnesium supplementation 1-2 hours before bed",
      "Expose yourself to natural sunlight within 30 minutes of waking",
      "Avoid caffeine after 2 PM"
    ]
    riskLevel = poorSleep ? "medium" : "low"
    nextSteps = [
      "Keep a sleep diary tracking quality and duration",
      "Request thyroid panel including TSH, T3, T4, and reverse T3",
      "Consider sleep study if symptoms persist"
    ]
  } else if (hasPeriodIssues || hasWeightChanges) {
    analysis = "Your symptoms suggest potential reproductive hormone imbalances, possibly involving estrogen, progesterone, or insulin resistance. These hormones work together to regulate menstrual cycles and metabolism."
    recommendations = [
      "Focus on anti-inflammatory foods like fatty fish and leafy greens",
      "Balance meals with protein, healthy fats, and complex carbs",
      "Consider seed cycling to support hormone production",
      "Reduce refined sugar and processed food intake",
      "Include regular strength training exercises"
    ]
    riskLevel = "medium"
    nextSteps = [
      "Track menstrual cycle and symptoms for 3 months",
      "Request comprehensive hormone panel including estrogen, progesterone, and insulin",
      "Consider consultation with reproductive endocrinologist"
    ]
  } else if (hasSkinIssues) {
    analysis = "Skin changes often reflect internal hormonal shifts, particularly involving androgens, insulin, or inflammatory responses. Your symptoms may indicate hormonal acne or other hormone-related skin conditions."
    recommendations = [
      "Adopt an anti-inflammatory diet rich in omega-3 fatty acids",
      "Consider zinc supplementation for skin health",
      "Use gentle, non-comedogenic skincare products",
      "Manage stress through regular exercise or mindfulness",
      "Ensure adequate hydration throughout the day"
    ]
    riskLevel = "low"
    nextSteps = [
      "Monitor skin changes in relation to menstrual cycle",
      "Consider androgen testing if symptoms are severe",
      "Consult with dermatologist familiar with hormonal causes"
    ]
  } else {
    // General hormonal imbalance response
    analysis = "Based on your symptoms, you may be experiencing mild hormonal fluctuations that could be influenced by various lifestyle factors. Hormones are interconnected, and small imbalances can create cascading effects throughout your system."
    recommendations = [
      "Maintain consistent meal timing to support hormone regulation",
      "Include hormone-supporting foods like cruciferous vegetables",
      "Practice stress management techniques daily",
      "Ensure adequate sleep quality and duration",
      "Consider gentle detox support through proper hydration"
    ]
    riskLevel = "low"
    nextSteps = [
      "Keep a comprehensive symptom and lifestyle diary",
      "Schedule wellness check-up with healthcare provider",
      "Consider basic hormone screening if symptoms persist"
    ]
  }
  
  return { analysis, recommendations, riskLevel, nextSteps }
}

// Helper to call Groq's Chat Completions API
async function generateAnalysisWithGroq(prompt: string, model: string) {
  if (!GROQ_API_KEY) {
    throw new Error("Missing or invalid GROQ_API_KEY")
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert hormone wellness and integrative health analyst. Carefully read the user’s exact symptom and lifestyle text, think through how those specific symptoms interact with each other and with stress, sleep, hormones, nutrition, and lifestyle. Do all of your reasoning internally. Then respond ONLY with valid JSON that matches the requested schema. The JSON must explicitly mention multiple symptoms using the user’s own words or close paraphrases, and connect those symptoms together. Do not include explanations or markdown, only the final JSON object.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.65,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Groq API error (${response.status}): ${errorText}`)
  }

  const data: any = await response.json()
  const text =
    data?.choices?.[0]?.message?.content && typeof data.choices[0].message.content === "string"
      ? data.choices[0].message.content.trim()
      : ""

  if (!text) {
    throw new Error("Groq API returned empty content")
  }

  return text
}

export async function POST(request: NextRequest) {
  try {
    const { symptoms, lifestyle } = await request.json()

    // Enforce key presence: in dev, fail loudly so misconfiguration is obvious
    if (!GROQ_API_KEY) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "[analyze] GROQ_API_KEY is missing. Define it in .env.local (or deployment env) and restart the server.",
          { nodeEnv: process.env.NODE_ENV, cwd: process.cwd() }
        )
        throw new Error("GROQ_API_KEY is not configured for /api/analyze")
      }
    }

    // Try Groq API if key is available, otherwise use dynamic fallback response
    if (GROQ_API_KEY) {
      try {
        console.log("Using Groq API for dynamic analysis")

        const prompt = `As a hormone wellness expert, deeply analyze these symptoms and lifestyle factors and provide individualized, interconnected insights. You must refer to the user’s specific symptoms by name (using their wording or a close paraphrase) and explain how they fit together:
        
Symptoms: ${symptoms}
Lifestyle: ${lifestyle}

Please provide a JSON response with the following exact structure (no additional text or formatting):
{
  "analysis": "A clear, personalized explanation that explicitly mentions at least 2–3 of the user’s symptoms and describes how they may be connected to each other and to potential hormonal patterns (for example cortisol, thyroid, sex hormones, insulin), including how stress, sleep, nutrition, and lifestyle may be interacting in this particular case.",
  "recommendations": ["4-5 specific, tailored, and practical recommendations that directly address this person’s unique symptom pattern and lifestyle context, clearly tied back to the symptoms mentioned in the analysis. Avoid generic advice that could apply to anyone."],
  "riskLevel": "low|medium|high",
  "nextSteps": ["3-4 concrete next steps for this user based on their described situation, such as what to track, what to discuss with a provider, and what focused changes to try first. These next steps should clearly relate to the specific symptoms and patterns you identified."]
}

Make the analysis explicitly connect the symptoms to each other and to possible hormone patterns. Explicitly quote or closely paraphrase several of the user’s symptoms in the analysis. Highlight how stress, sleep, blood sugar, and lifestyle habits may be interacting in this specific case. Avoid generic wellness advice and avoid repeating the same phrasing across users. Focus on practical, evidence-informed insights that feel tailored to this person’s input. Reject and internally rewrite any reasoning that leads to vague or generic statements that could apply to almost anyone.`
        let text: string

        console.log(`Using Groq API with model: ${PRIMARY_MODEL}`)
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
        
        console.log("Groq raw response:", text)
        
        // Clean the response to extract JSON
        let cleanedText = text.trim()
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '')
        }
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '')
        }
        
        // Try to parse JSON response from Groq
        try {
          const geminiAnalysis = JSON.parse(cleanedText)
          console.log("Successfully parsed Groq response")
          return NextResponse.json(geminiAnalysis)
        } catch (parseError) {
          console.warn("Failed to parse Groq response:", parseError)
          console.warn("Raw response was:", text)
          return NextResponse.json(generateDynamicFallback(symptoms, lifestyle))
        }
      } catch (geminiError) {
        console.warn("Groq API error:", geminiError)
        return NextResponse.json(generateDynamicFallback(symptoms, lifestyle))
      }
    } else {
      console.log("No valid Groq API key found, using dynamic fallback analysis")
      // Simulate AI delay for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return NextResponse.json(generateDynamicFallback(symptoms, lifestyle))
    }
  } catch (error) {
    console.error("Analysis error:", error)
    // Return dynamic fallback instead of error to prevent frontend failures
    return NextResponse.json(generateDynamicFallback("general symptoms", "general lifestyle"))
  }
}
