import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InterviewQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  tags: string[];
  role_hints: string[];
}

interface AnswerEvaluation {
  question: string;
  answer: string;
  feedback: string;
  score: number;
  technical_depth: number;
  relevance: number;
  clarity: number;
  communication: number;
}

interface FinalEvaluation {
  technical_depth: number;
  relevance: number;
  clarity: number;
  communication: number;
  overall: number;
  answers: AnswerEvaluation[];
}

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

function selectQuestions(
  allQuestions: InterviewQuestion[],
  category: string,
  targetRole: string,
  skillGaps: string[],
  count: number
): InterviewQuestion[] {
  let pool = allQuestions.filter((q) => q.category === category);
  if (pool.length === 0) return [];

  const scored = pool.map((q) => {
    let score = 0;
    if (q.role_hints && q.role_hints.includes(targetRole)) score += 10;
    if (q.tags) {
      for (const gap of skillGaps) {
        const gapLower = gap.toLowerCase();
        if (q.tags.some((t) => t.toLowerCase().includes(gapLower) || gapLower.includes(t.toLowerCase()))) {
          score += 8;
        }
      }
    }
    score += Math.random() * 3;
    return { q, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, count).map((s) => s.q);
  return selected;
}

function evaluateAnswer(
  question: string,
  answer: string,
  tags: string[]
): AnswerEvaluation {
  const answerLower = answer.toLowerCase();
  const words = answer.trim().split(/\s+/);
  const wordCount = words.length;

  let technicalDepth = 0;
  let relevance = 0;
  let clarity = 0;
  let communication = 0;
  const feedbackParts: string[] = [];

  if (wordCount < 10) {
    technicalDepth = 20;
    relevance = 30;
    clarity = 40;
    communication = 30;
    feedbackParts.push("Your answer is very short. Interviewers expect at least 3-4 sentences with examples.");
  } else if (wordCount < 30) {
    technicalDepth = 40;
    relevance = 50;
    clarity = 55;
    communication = 50;
    feedbackParts.push("Your answer is brief. Try to elaborate with more detail and examples.");
  } else if (wordCount < 80) {
    technicalDepth = 60;
    relevance = 65;
    clarity = 70;
    communication = 65;
  } else {
    technicalDepth = 70;
    relevance = 70;
    clarity = 75;
    communication = 70;
  }

  let tagMatches = 0;
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    const tagWords = tagLower.split(/[-_\s]+/);
    for (const tw of tagWords) {
      if (tw.length > 2 && answerLower.includes(tw)) {
        tagMatches++;
        break;
      }
    }
  }
  const tagRatio = tags.length > 0 ? tagMatches / tags.length : 0;
  technicalDepth = Math.round(technicalDepth + tagRatio * 25);
  relevance = Math.round(relevance + tagRatio * 20);

  if (tagMatches === 0 && tags.length > 0) {
    feedbackParts.push(`Your answer does not mention key concepts: ${tags.slice(0, 4).join(", ")}. Try to use the relevant terminology.`);
  } else if (tagMatches > 0) {
    feedbackParts.push(`Good use of relevant concepts (${tagMatches}/${tags.length} key terms mentioned).`);
  }

  const exampleMarkers = ["for example", "for instance", "e.g.", "such as", "in my project", "in my experience", "when i", "i worked on"];
  const hasExample = exampleMarkers.some((m) => answerLower.includes(m));
  if (hasExample) {
    technicalDepth = Math.min(100, technicalDepth + 10);
    communication = Math.min(100, communication + 10);
    feedbackParts.push("Great use of concrete examples — this strengthens your answer.");
  } else if (wordCount >= 30) {
    feedbackParts.push("Consider adding a concrete example to illustrate your point.");
  }

  const fillerWords = ["um", "uh", "like", "you know", "sort of", "kind of", "i guess", "maybe"];
  let fillerCount = 0;
  for (const filler of fillerWords) {
    const matches = answerLower.match(new RegExp(`\\b${filler}\\b`, "g"));
    if (matches) fillerCount += matches.length;
  }
  if (fillerCount > 3) {
    communication = Math.max(0, communication - 15);
    feedbackParts.push("Try to reduce filler words like 'um', 'uh', 'like' — they reduce clarity.");
  }

  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgSentenceLength = wordCount / sentences.length;
    if (avgSentenceLength > 40) {
      clarity = Math.max(0, clarity - 10);
      feedbackParts.push("Your sentences are quite long. Break them into shorter, clearer statements.");
    } else if (avgSentenceLength > 10 && avgSentenceLength < 25) {
      clarity = Math.min(100, clarity + 5);
    }
  }

  const structureMarkers = ["first", "second", "third", "finally", "in conclusion", "to summarize", "additionally", "moreover", "however"];
  const hasStructure = structureMarkers.some((m) => answerLower.includes(m));
  if (hasStructure) {
    communication = Math.min(100, communication + 8);
    clarity = Math.min(100, clarity + 5);
  }

  technicalDepth = Math.min(100, Math.max(0, technicalDepth));
  relevance = Math.min(100, Math.max(0, relevance));
  clarity = Math.min(100, Math.max(0, clarity));
  communication = Math.min(100, Math.max(0, communication));

  const score = Math.round((technicalDepth + relevance + clarity + communication) / 4);

  if (feedbackParts.length === 0) {
    if (score >= 75) feedbackParts.push("Strong answer — well-structured and technically sound.");
    else if (score >= 50) feedbackParts.push("Decent answer but could be improved with more depth and examples.");
    else feedbackParts.push("This answer needs significant improvement. Study the topic and practice articulating concepts clearly.");
  }

  return {
    question,
    answer,
    feedback: feedbackParts.join(" "),
    score,
    technical_depth: technicalDepth,
    relevance,
    clarity,
    communication,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "start") {
      const { category, target_role, skill_gaps, user_id } = body as {
        category: string;
        target_role: string;
        skill_gaps: string[];
        user_id: string;
      };

      if (!category || !user_id) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: category, user_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: questions, error: qError } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("category", category);

      if (qError || !questions) {
        return new Response(
          JSON.stringify({ error: "Failed to load questions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const selected = selectQuestions(
        questions as InterviewQuestion[],
        category,
        target_role || "",
        skill_gaps || [],
        5
      );

      if (selected.length === 0) {
        return new Response(
          JSON.stringify({ error: "No questions found for this category" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          questions: selected.map((q) => ({
            id: q.id,
            category: q.category,
            difficulty: q.difficulty,
            question: q.question,
            tags: q.tags,
          })),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "evaluate") {
      const {
        user_id,
        category,
        target_role,
        questions,
        answers,
        duration_minutes,
      } = body as {
        user_id: string;
        category: string;
        target_role: string;
        questions: { id: string; question: string; tags: string[]; difficulty: string }[];
        answers: { question_id: string; answer: string }[];
        duration_minutes: number;
      };

      if (!user_id || !questions || !answers) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for evaluation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const evaluations: AnswerEvaluation[] = [];
      const transcript: TranscriptEntry[] = [];
      const now = new Date().toISOString();

      for (const q of questions) {
        const ans = answers.find((a) => a.question_id === q.id);
        const answerText = ans?.answer ?? "";

        transcript.push({ role: "interviewer", content: q.question, timestamp: now });
        transcript.push({ role: "candidate", content: answerText, timestamp: now });

        const evalResult = evaluateAnswer(q.question, answerText, q.tags || []);
        evaluations.push(evalResult);
      }

      const technicalDepth = Math.round(
        evaluations.reduce((acc, e) => acc + e.technical_depth, 0) / Math.max(evaluations.length, 1)
      );
      const relevance = Math.round(
        evaluations.reduce((acc, e) => acc + e.relevance, 0) / Math.max(evaluations.length, 1)
      );
      const clarity = Math.round(
        evaluations.reduce((acc, e) => acc + e.clarity, 0) / Math.max(evaluations.length, 1)
      );
      const communication = Math.round(
        evaluations.reduce((acc, e) => acc + e.communication, 0) / Math.max(evaluations.length, 1)
      );
      const overall = Math.round((technicalDepth + relevance + clarity + communication) / 4);

      const finalEval: FinalEvaluation = {
        technical_depth: technicalDepth,
        relevance,
        clarity,
        communication,
        overall,
        answers: evaluations,
      };

      let xpEarned = 100;
      if (overall >= 80) xpEarned += 150;
      else if (overall >= 65) xpEarned += 75;

      const { data: interviewRow } = await supabase
        .from("interviews")
        .insert({
          user_id,
          type: category,
          topic: target_role || category,
          category,
          score: overall,
          duration_minutes: duration_minutes || 0,
          xp_earned: xpEarned,
          evaluation: finalEval as unknown as Record<string, unknown>,
          transcript: transcript as unknown as Record<string, unknown>[],
        })
        .select("id")
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level, streak, last_activity_date")
        .eq("id", user_id)
        .maybeSingle();

      if (profile) {
        const newTotalXp = profile.xp + xpEarned;
        await supabase
          .from("profiles")
          .update({ xp: newTotalXp })
          .eq("id", user_id);

        await supabase.from("user_activity").insert({
          user_id,
          activity_type: "interview",
          title: `Mock Interview: ${category}`,
          description: `Scored ${overall}/100 in ${category} interview`,
          xp: xpEarned,
        });
      }

      return new Response(
        JSON.stringify({
          interview_id: interviewRow?.id,
          evaluation: finalEval,
          xp_earned: xpEarned,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'start' or 'evaluate'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
