// Paste the full content of 'PracticeCodingAnimated' from components.txt here.
// Full code is in the attached source file.
// ... (rest of the file content)
// PracticeCodingAnimated.jsx
import React, { useState, useEffect, useRef, forwardRef } from "react";
import DOMPurify from "dompurify";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { cn } from "../lib/utils"; // keep your existing cn utility
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react"; // modern hook for context-safe animations

// Icons
import {
  ArrowLeft,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// -------------------- Small UI primitives (kept minimalist but stylized) --------------------
const Button = forwardRef(({ className, variant, size, children, ...props }, ref) => (
  <button
    ref={ref}
    {...props}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none",
      variant === "ghost" ? "bg-transparent hover:bg-white/6" :
      variant === "destructive" ? "bg-red-600 text-white hover:bg-red-700" :
      "bg-gradient-to-r from-cyan-400/70 via-indigo-500/60 to-purple-500/50 text-white hover:brightness-110",
      "px-3 py-2 shadow-md",
      className
    )}
  >
    {children}
  </button>
));

const Card = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      "rounded-xl border backdrop-blur-sm bg-gradient-to-br from-black/40 to-white/2 border-white/6 shadow-lg",
      className
    )}
  >
    {children}
  </div>
));

const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={cn(
      "w-full min-h-[140px] rounded-md px-3 py-2 font-mono text-sm resize-none placeholder:text-slate-400",
      "bg-[linear-gradient(180deg,#000000b3,#00000080)] border border-cyan-500/10 focus:ring-2 focus:ring-cyan-500/30",
      className
    )}
  />
));

const Badge = ({ className, children }) => (
  <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm", className)}>
    {children}
  </span>
);

// -------------------- Sample topics (keep your list) --------------------
const topics = [
  { name: "Array", slug: "array" }, { name: "Backtracking", slug: "backtracking" }, { name: "Binary Tree", slug: "binary-tree" },
  { name: "Bit Manipulation", slug: "bit-manipulation" }, { name: "Breadth-First Search", slug: "breadth-first-search" },
  { name: "Depth-First Search", slug: "depth-first-search" }, { name: "Dynamic Programming", slug: "dynamic-programming" },
  { name: "Hash Table", slug: "hash-table" }, { name: "Linked List", slug: "linked-list" }, { name: "Queue", slug: "queue" },
  { name: "Recursion", slug: "recursion" }, { name: "Sliding Window", slug: "sliding-window" }, { name: "Stack", slug: "stack" },
  { name: "Two Pointers", slug: "two-pointers" },
];

// -------------------- LeftPanel component (toggleable sidebar) --------------------
function LeftPanel({
  selectedTopic,
  onSelectTopic,
  problems,
  onSelectProblem,
  selectedProblemSlug,
  onBackToTopics,
  isLoadingProblems,
  collapsed,
  setCollapsed,
}) {
  const panelRef = useRef();
  const listRef = useRef();
  const q = gsap.utils.selector(listRef);

  // Animate list items when topic opens or when problems load
  useGSAP(
    (ctx) => {
      // if (!panelRef.current) return;
      // const tl = gsap.timeline({ defaults: { duration: 0.55, ease: "power3.out" } });
      // tl.fromTo(
      //   panelRef.current,
      //   { x: -30, autoAlpha: 0 },
      //   { x: 0, autoAlpha: 1, duration: 0.5 }
      // );
      // // stagger problem items
      // tl.from(q(".topic-item"), { y: 8, autoAlpha: 0, stagger: 0.05 }, "<");
      // return () => ctx.revert();
    },
    [selectedTopic, problems]
  );

  return (
    <aside
      ref={panelRef}
      className={cn(
        "h-full flex flex-col p-3 border-r border-cyan-500/10",
        "transition-all duration-700 ease-in-out",
        collapsed ? "w-14" : "w-[340px]"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 p-0 flex items-center justify-center"
          variant="ghost"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        {!collapsed && (
          <h3 className="text-lg font-bold text-cyan-200 tracking-tight ml-1">Topics</h3>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-auto custom-scrollbar">
        {!selectedTopic ? (
          topics.map((topic) => (
            <button
              key={topic.slug}
              onClick={() => onSelectTopic(topic)}
              className="topic-item w-full text-left my-2 py-2 px-3 rounded-md hover:bg-white/4 transition-colors flex items-center gap-3"
              title={topic.name}
            >
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
              {!collapsed && <span className="text-sm text-cyan-100">{topic.name}</span>}
            </button>
          ))
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button onClick={onBackToTopics} variant="ghost" className="w-9 h-9 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {!collapsed && <h4 className="text-cyan-100 font-semibold">{selectedTopic.name}</h4>}
              </div>
            </div>

            {isLoadingProblems ? (
              <div className="flex items-center justify-center py-8 text-cyan-300">
                <Loader2 className="animate-spin mr-2" /> Loading...
              </div>
            ) : (
              problems.map((p) => (
                <button
                  key={p.titleSlug}
                  onClick={() => onSelectProblem(p.titleSlug)}
                  className={cn(
                    "topic-item w-full text-left my-2 py-2 px-3 rounded-md transition-all flex items-start gap-3",
                    p.titleSlug === selectedProblemSlug ? "bg-cyan-500/20 border border-cyan-400/30 shadow-[0_0_12px_rgba(0,255,255,0.06)]" : "hover:bg-white/4"
                  )}
                  title={p.title}
                >
                  <div className="w-2 h-8 rounded-full bg-gradient-to-b from-pink-400 to-yellow-400" />
                  {!collapsed && (
                    <div className="flex-1">
                      <div className="text-sm font-medium text-cyan-100 truncate">{p.title}</div>
                      <div className="text-xs text-slate-400 truncate">{p.difficulty || ""}</div>
                    </div>
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>
      <div className="mt-3">
        {!collapsed && <div className="text-xs text-slate-400">Animated UI powered by GSAP · Dark theme</div>}
      </div>
    </aside>
  );
}

// -------------------- ProblemView with animations and overflow fix --------------------
function ProblemView({
  problem,
  isLoadingProblem,
  problemError,
  userCode,
  setUserCode,
  aiResponse,
  isSubmitting,
  submitError,
  handleSubmit,
}) {
  const containerRef = useRef();
  const headerRef = useRef();
  const questionRef = useRef();
  const codeRef = useRef();
  const outputRef = useRef();

  // GSAP context for this view
  useGSAP(
    (ctx) => {
      if (!containerRef.current) return;
      const sel = gsap.utils.selector(containerRef);
      const tl = gsap.timeline({ defaults: { duration: 0.7, ease: "power3.out" } });

      // entrance animations
      tl.from(headerRef.current, { y: -18, autoAlpha: 0 });
      tl.from(questionRef.current, { y: 18, autoAlpha: 0 });
      tl.from(codeRef.current, { y: 18, autoAlpha: 0 }, "<0.1");
      tl.from(outputRef.current, { y: 10, autoAlpha: 0 }, "<0.05");

      // subtle infinite accent pulse for badge if correct/wrong
      if (aiResponse) {
        if (aiResponse.status === "Correct Answer") {
          gsap.fromTo(
            ".ai-badge-correct",
            { scale: 1 },
            { scale: 1.06, repeat: -1, yoyo: true, duration: 1.6, ease: "sine.inOut" }
          );
        } else {
          gsap.fromTo(
            ".ai-badge-wrong",
            { x: -2 },
            { x: 2, repeat: -1, yoyo: true, duration: 0.6, ease: "sine.inOut" }
          );
        }
      }

      // Scroll-triggered parallax for large question content
      ScrollTrigger.create({
        trigger: questionRef.current,
        start: "top center",
        end: "bottom top",
        onEnter: () => gsap.to(questionRef.current, { y: -6, duration: 0.6, ease: "power1.out" }),
        onLeaveBack: () => gsap.to(questionRef.current, { y: 0, duration: 0.6, ease: "power1.out" }),
      });

      return () => ctx.revert();
    },
    [problem, aiResponse]
  );

  if (!problem && !isLoadingProblem && !problemError) {
    return <div className="h-full flex items-center justify-center text-slate-400">Select a problem to begin</div>;
  }
  if (isLoadingProblem) {
    return <div className="h-full flex items-center justify-center text-cyan-300"><Loader2 className="animate-spin mr-2" /> Loading problem...</div>;
  }
  if (problemError) {
    return <div className="h-full flex items-center justify-center text-red-400"><AlertTriangle className="mr-2" /> {problemError}</div>;
  }

  const cleanHtml = problem ? DOMPurify.sanitize(problem.question) : "";
  // Prevent overflowing content: ensure wrapping and a controlled scrollable area
  const questionStyle = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    maxHeight: "36vh",
    overflowY: "auto",
    paddingRight: "8px",
  };

  const isCorrect = aiResponse?.status === "Correct Answer";

  return (
    <div ref={containerRef} className="w-full h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[#020617] via-[#04060a] to-[#030219]">
      <div ref={headerRef} className="p-5 border-b border-cyan-500/6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-200 tracking-tight">{problem?.title}</h2>
          <div className="text-sm text-slate-400">Interactive judge · Animated live feedback</div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-emerald-500/80 to-green-600 text-black px-3 py-1">
            Live
          </Badge>
          <div className="text-xs text-slate-400">Model: gpt-4.1-mini</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-6 custom-scrollbar">
        {/* Left: Problem Description */}
        <div className="col-span-1">
          <Card className="h-full p-4 bg-gradient-to-br from-black/50 to-white/2 border-cyan-500/6">
            <div ref={questionRef} style={questionStyle} className="prose prose-invert max-w-none text-slate-200 pr-2">
              <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="text-xs text-slate-400">Problem ID:</div>
              <div className="text-sm text-cyan-200 font-medium">{problem?.titleSlug || "—"}</div>
            </div>
            <div className="mt-6 flex gap-3 items-center">
              <Button onClick={() => { navigator.clipboard?.writeText(problem?.title || ""); }} className="px-3 py-1 text-sm">
                Copy Title
              </Button>
              <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} variant="ghost" className="px-3 py-1 text-sm">
                Scroll to Top
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Editor + Output */}
        <div className="col-span-1 flex flex-col gap-4">
          <Card ref={codeRef} className="p-4 bg-gradient-to-br from-black/50 to-white/2 border-cyan-500/6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-cyan-200 font-semibold">Code Editor</h3>
              <div className="text-xs text-slate-400">Java</div>
            </div>
            <Textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder={"Enter your Java code here..."}
              className="flex-1 bg-black/30 border border-cyan-600/10 text-cyan-100"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-400">Runtime checks</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Judging</> : <><Play className="mr-2 h-4 w-4" /> Submit</>}
                </Button>
              </div>
            </div>
          </Card>

          <Card ref={outputRef} className="p-4 bg-gradient-to-br from-black/40 to-white/2 border-cyan-500/6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base text-cyan-200 font-semibold">Output</h4>
                <div className="text-xs text-slate-400">AI judgement & hints</div>
              </div>
              <div>
                {aiResponse ? (
                  <div>
                    <Badge className={cn("text-white text-sm font-semibold px-3 py-1 shadow-md",
                      isCorrect ? "bg-green-600 ai-badge-correct" : "bg-red-600 ai-badge-wrong")}>
                      {isCorrect ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                      {aiResponse.status}
                    </Badge>
                  </div>
                ) : (
                  <Badge className="bg-slate-700 text-slate-200">No result yet</Badge>
                )}
              </div>
            </div>

            <div className="mt-4">
              {isSubmitting && <div className="text-sm text-slate-300 flex items-center"><Loader2 className="animate-spin mr-2" /> Judging your solution...</div>}
              {submitError && (
                <div className="mt-2 p-3 rounded-md bg-red-900/30 border border-red-500/40 text-red-300">
                  <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4" /> <div className="text-sm">{submitError}</div></div>
                </div>
              )}
              {aiResponse?.hint && (
                <div className="mt-3 p-3 rounded-md border-l-4 border-amber-400/50 bg-black/30 text-amber-300">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <div className="text-sm">{aiResponse.hint}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-400">
              <div>Analysis: {aiResponse?.analysis || "—"}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// -------------------- Main App (PracticeCodingAnimated) --------------------
export default function PracticeCodingAnimated() {
  // left panel state
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [problemsForTopic, setProblemsForTopic] = useState([]);
  const [isTopicListLoading, setIsTopicListLoading] = useState(false);
  const [topicListError, setTopicListError] = useState(null);

  // right panel state
  const [selectedProblemSlug, setSelectedProblemSlug] = useState(null);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [problemError, setProblemError] = useState(null);

  // editor + submission
  const [userCode, setUserCode] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // UI/UX controls
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // left panel handlers (kept as you had)
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setSelectedProblemSlug(null);
    setCurrentProblem(null);
    setProblemsForTopic([]);
    setIsTopicListLoading(true);
    setTopicListError(null);

    fetch(`http://localhost:3000/problems?tags=${topic.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch problems for ${topic.name}`);
        return res.json();
      })
      .then((data) => setProblemsForTopic(data.problemsetQuestionList || []))
      .catch((err) => {
        console.error(err);
        setTopicListError(err.message);
      })
      .finally(() => setIsTopicListLoading(false));
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setProblemsForTopic([]);
    setSelectedProblemSlug(null);
    setCurrentProblem(null);
    setTopicListError(null);
  };

  // fetch problem when slug changes (kept your logic but improved robustness)
  useEffect(() => {
    if (!selectedProblemSlug) {
      setCurrentProblem(null);
      return;
    }
    setIsLoadingProblem(true);
    setProblemError(null);
    setAiResponse(null);
    setSubmitError(null);

    fetch(`http://localhost:3000/select?titleSlug=${selectedProblemSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch problem details");
        return res.json();
      })
      .then((data) => {
        setCurrentProblem(data);
        try {
          const meta = JSON.parse(data.metaData || "{}");
          const javaTemplate = Array.isArray(meta.templateCode) ? meta.templateCode.find((t) => t.value === "java") : null;
          setUserCode(javaTemplate?.defaultCode || `class Solution {\n\t// Code your solution here\n}`);
        } catch {
          setUserCode(`class Solution {\n\t// Code your solution here\n}`);
        }
      })
      .catch((err) => {
        console.error(err);
        setProblemError("Failed to load problem details.");
      })
      .finally(() => setIsLoadingProblem(false));
  }, [selectedProblemSlug]);

  // submit handler (kept same flow but minor UX tweaks)
  const handleSubmit = async () => {
    if (!currentProblem) return;
    setIsSubmitting(true);
    setAiResponse(null);
    setSubmitError(null);

    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) {
      setSubmitError("GitHub Token not found. Please configure VITE_GITHUB_TOKEN in your .env file.");
      setIsSubmitting(false);
      return;
    }

    const systemPrompt = `You are an expert programming judge. Your task is to analyze a user's code for a given problem and determine its correctness. You MUST respond ONLY with a single JSON object. Do not include any other text, explanation, or markdown formatting. The JSON object must have a "status" field: 'Correct Answer', 'Wrong Answer', 'Time Limit Exceeded', or 'Runtime Error'. If the status is NOT 'Correct Answer', include a "hint" field. Also include "analysis" and "time_complexity".`;
    const problemDescription = new DOMParser().parseFromString(currentProblem.question, "text/html").documentElement.textContent;
    const userPrompt = `Problem Title: ${currentProblem.title}\n\nProblem Description:\n${problemDescription}\n\nUser's Code:\n\`\`\`java\n${userCode}\n\`\`\`\nPlease respond with the required JSON object.`;

    const endpoint = "https://models.github.ai/inference";
    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    try {
      const response = await client.path("/chat/completions").post({
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "openai/gpt-4.1-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
        },
      });

      if (isUnexpected(response)) throw new Error(response.body.error?.message || "API error");

      const content = response.body.choices?.[0]?.message?.content;
      if (!content) throw new Error("The AI returned an empty response.");

      try {
        const parsedResponse = JSON.parse(content);
        setAiResponse(parsedResponse);
      } catch {
        // If not valid JSON, try to extract JSON substring
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            setAiResponse(JSON.parse(jsonMatch[0]));
          } catch {
            throw new Error("The AI returned a response in an invalid JSON format.");
          }
        } else {
          throw new Error("The AI returned a response in an invalid JSON format.");
        }
      }
    } catch (err) {
      console.error("Submission Error:", err);
      setSubmitError(err.message || "Unknown error during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Top-level layout container ref for entrance animation
  const appRef = useRef();
  useGSAP((ctx) => {
    // if (!appRef.current) return;
    // const nodes = appRef.current.querySelectorAll("[data-anim='stagger']");
    // gsap.from(nodes, { y: 8, autoAlpha: 0, stagger: 0.03, duration: 0.6, ease: "power3.out" });
    // return () => ctx.revert();
  }, []);

  if (topicListError) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#08030a] to-[#050412] text-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300">
            <div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5" /><div>{topicListError}</div></div>
          </div>
          <div className="mt-4 text-right">
            <Button onClick={handleBackToTopics}>Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(0,255,255,0.12), rgba(255,0,255,0.12)); border-radius: 999px; border: 3px solid transparent; background-clip: content-box; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,255,255,0.12) transparent; }
      `}</style>

      <main ref={appRef} className="h-screen w-full flex bg-gradient-to-br from-[#00040a] to-[#020018] text-slate-100">
        <div data-anim="stagger" className="flex-shrink-0">
          <LeftPanel
            selectedTopic={selectedTopic}
            onSelectTopic={handleSelectTopic}
            problems={problemsForTopic}
            onSelectProblem={setSelectedProblemSlug}
            selectedProblemSlug={selectedProblemSlug}
            onBackToTopics={handleBackToTopics}
            isLoadingProblems={isTopicListLoading}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <ProblemView
            problem={currentProblem}
            isLoadingProblem={isLoadingProblem}
            problemError={problemError}
            userCode={userCode}
            setUserCode={setUserCode}
            aiResponse={aiResponse}
            isSubmitting={isSubmitting}
            submitError={submitError}
            handleSubmit={handleSubmit}
          />
        </div>
      </main>
    </>
  );
}
