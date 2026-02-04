import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Server-side limit check: Free users only get 1 evaluation
    const { data: purchase } = await supabase
      .from("user_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", "ai_evaluation")
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    const hasPremium = !!purchase;

    if (!hasPremium) {
      const { count } = await supabase
        .from("ai_writing_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count && count >= 1) {
        return NextResponse.json({ 
          error: "Limit exceeded", 
          code: "LIMIT_EXCEEDED",
          message: "You have already used your 1 free evaluation. Please upgrade to premium for unlimited access." 
        }, { status: 403 });
      }
    }

    // Fetch AI Settings from database
    const { data: aiSettingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_settings")
      .maybeSingle();
    
    const aiSettings = aiSettingsData?.value || {
      provider: "groq",
      groq_model: "llama-3.3-70b-versatile",
      gemini_model: "gemini-2.5-flash-lite",
      enabled: true
    };

    // Sanitize groq model (handle decommissioned models)
    if (aiSettings.groq_model === "llama-3.1-70b-versatile") {
      aiSettings.groq_model = "llama-3.3-70b-versatile";
    }
    if (aiSettings.groq_model === "llama-3.1-8b-instant") {
      aiSettings.groq_model = "llama-3.3-7b-instant";
    }

    // Sanitize gemini model (handle decommissioned models)
    if (aiSettings.gemini_model === "gemini-1.5-flash" || aiSettings.gemini_model === "gemini-2.0-flash" || !aiSettings.gemini_model) {
      aiSettings.gemini_model = "gemini-2.5-flash-lite";
    }
    if (aiSettings.gemini_model === "gemini-1.5-pro") {
      aiSettings.gemini_model = "gemini-2.0-pro-exp-02-05"; // Or whatever is current
    }

    if (!aiSettings.enabled) {
      return NextResponse.json({ error: "AI Evaluation is currently disabled by administrator." }, { status: 403 });
    }

    const { questionId, questionText, taskType, userAnswer, imageUrl, customQuestionText } = await req.json();

    if (!userAnswer || userAnswer.length < 50) {
      return NextResponse.json({ error: "Answer too short" }, { status: 400 });
    }

    const effectiveQuestionText = customQuestionText || questionText;

    let imageInstruction = "";
    if (imageUrl) {
      imageInstruction = `
        CRITICAL: An image has been provided for this ${taskType === "task1" ? "Task 1" : "Task 2"}.
        Please analyze the image (graph, chart, diagram, or prompt image) carefully.
        In your evaluation, verify if the candidate has correctly interpreted the data/information shown in the image.
        Provide specific feedback on whether the data points mentioned in the answer match the image.
      `;
    }

    const prompt = `
      You are an expert IELTS Writing Trainer. Your role is to evaluate students' writing with the same rigor and professional tone as a senior IELTS examiner.
      
      DO NOT refer to yourself as an AI or a large language model. 
      Respond ONLY in English. Do not use any other language in the JSON values.
      
      Evaluate the following IELTS Writing ${taskType === "task1" ? "Task 1 (Report)" : "Task 2 (Essay)"} response.
      
      Question:
      ${effectiveQuestionText}
      ${imageInstruction}
      
      Student's Answer:
      ${userAnswer}
      
      EVALUATION CRITERIA (IELTS STANDARDS):
      1. Task Achievement (Task 1) / Task Response (Task 2): 
         - Check if all parts of the task are addressed.
         - For Task 2: clear position, well-supported ideas.
         - For Task 1: clear overview, key features highlighted with accurate data.
      
      2. Coherence and Cohesion (CC):
         - Logical organization and clear progression.
         - Effective use of cohesive devices and paragraphing.
      
      3. Lexical Resource (LR):
         - Range and flexibility of vocabulary.
         - Precision, collocations, and accuracy.
      
      4. Grammatical Range and Accuracy (GRA):
         - Mix of simple and complex structures.
         - Accuracy and control over grammar/punctuation.
      
      OUTPUT FORMAT (STRICT JSON):
      {
        "task_achievement": number (0-9, increments of 0.5),
        "coherence_cohesion": number (0-9, increments of 0.5),
        "lexical_resource": number (0-9, increments of 0.5),
        "grammatical_range": number (0-9, increments of 0.5),
        "overall_band": number (0-9, increments of 0.5),
        "detailed_feedback": {
          "tr_analysis": "Trainer's analysis of Task Achievement in English.",
          "cc_analysis": "Trainer's analysis of Coherence/Cohesion in English.",
          "lr_analysis": "Trainer's analysis of Lexical Resource in English.",
          "gra_analysis": "Trainer's analysis of Grammatical Range in English."
        },
        "feedback": {
          "strengths": ["at least 3 specific strengths in English"],
          "improvements": ["at least 3 specific areas to improve in English"],
          "suggestions": ["specific actionable trainer's tips in English"]
        },
        "corrections": [
          {
            "original": "sentence or phrase from text",
            "correction": "suggested improvement",
            "explanation": "trainer's explanation in English"
          }
        ]
      }
      
      Be rigorous, professional, and act exactly like a human IELTS Trainer. 
      Return ONLY the JSON object.
    `;

    let result: any = null;
    const provider = aiSettings.provider || "openai";

    if (provider === "openai") {
      const apiKey = aiSettings.openai_api_key || process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OpenAI API Key is missing");
      const openai = new OpenAI({ apiKey });
      
      const messages: any[] = [
        { role: "system", content: "You are an expert IELTS Writing examiner. You only respond with valid JSON." },
      ];

      if (imageUrl) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        });
      } else {
        messages.push({ role: "user", content: prompt });
      }

      const completion = await openai.chat.completions.create({
        model: aiSettings.openai_model || "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" }
      });
      result = JSON.parse(completion.choices[0].message.content || "{}");
    } 
    else if (provider === "gemini") {
      const apiKey = aiSettings.gemini_api_key || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is missing");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: aiSettings.gemini_model || "gemini-2.5-flash-lite" });
      
      let response;
      if (imageUrl) {
        // Fetch image and convert to base64
        const imageRes = await fetch(imageUrl);
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

        response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          }
        ]);
      } else {
        response = await model.generateContent(prompt);
      }
      
      const text = response.response.text();
      const cleanJson = text.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleanJson);
    } 
    else if (provider === "claude") {
      const apiKey = aiSettings.claude_api_key || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Anthropic API Key is missing");
      const anthropic = new Anthropic({ apiKey });
      
      let messages: any[];
      if (imageUrl) {
        const imageRes = await fetch(imageUrl);
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

        messages = [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as any,
                data: base64
              }
            }
          ]
        }];
      } else {
        messages = [{ role: "user", content: prompt }];
      }

      const msg = await anthropic.messages.create({
        model: aiSettings.claude_model || "claude-3-5-sonnet-20240620",
        max_tokens: 4096,
        messages,
        system: "You are an expert IELTS Writing examiner. You only respond with valid JSON."
      });
      const content = msg.content[0].type === 'text' ? msg.content[0].text : '';
      result = JSON.parse(content || "{}");
    }
    else if (provider === "groq") {
      const apiKey = aiSettings.groq_api_key || process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("Groq API Key is missing");
      const groq = new Groq({ apiKey });
      
      const messages: any[] = [
        { role: "system", content: "You are an expert IELTS Writing examiner. You only respond with valid JSON." },
      ];

      // Groq Vision models support
      if (imageUrl && (aiSettings.groq_model?.includes("vision") || aiSettings.groq_model?.includes("llama-3.2"))) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        });
      } else {
        messages.push({ role: "user", content: prompt });
      }

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: aiSettings.groq_model || "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });
      result = JSON.parse(chatCompletion.choices[0].message.content || "{}");
    }
    else if (provider === "poe") {
      const apiKey = aiSettings.poe_api_key || process.env.POE_API_KEY;
      if (!apiKey) throw new Error("Poe API Key is missing");
      const poe = new OpenAI({ 
        apiKey: apiKey,
        baseURL: "https://api.poe.com/v1"
      });
      const completion = await poe.chat.completions.create({
        model: aiSettings.poe_model || "Gemini-IELTS",
        messages: [
          { role: "system", content: "You are an expert IELTS Writing examiner. You only respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      result = JSON.parse(completion.choices[0].message.content || "{}");
    }

    if (!result || !result.overall_band) {
      throw new Error("Failed to generate evaluation");
    }

    // Save to database
    const { error: dbError } = await supabase.from("ai_writing_submissions").insert({
      user_id: user.id,
      question_id: questionId || null,
      question_text: effectiveQuestionText,
      answer_text: userAnswer,
      user_answer: userAnswer,
      task_type: taskType,
      evaluation_result: result,
      band_score: result.overall_band,
      overall_band: result.overall_band,
      task_achievement: result.task_achievement,
      coherence_cohesion: result.coherence_cohesion,
      lexical_resource: result.lexical_resource,
      grammatical_range: result.grammatical_range,
      feedback: result.feedback,
      custom_question_text: customQuestionText,
      custom_image_url: imageUrl
    });


    if (dbError) {
      console.error("Database error:", dbError);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Evaluation error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
