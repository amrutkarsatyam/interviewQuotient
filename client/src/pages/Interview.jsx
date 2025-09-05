// Paste the full content of 'Interview.js' from components.txt here,
// with the modifications shown below.

// ADD THIS IMPORT at the top of the file
import { saveStats } from "../services/api";

// src/components/Interview.js
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import groq from "../services/groq"; // Groq client you already have
import AnalysisChart from "../components/AnalysisChart"; // Your chart component
import gsap from "gsap";

/* ===========================
   AI HELPERS (unchanged API)
   =========================== */
const fetchQuestionsFromAI = async (jobDescription) => {
  const prompt = `
    Based on the following job description, generate 4 interview questions.
    - 3 questions should be behavioral/verbal.
    - 1 question should be a simple coding challenge.
    - Return the response as a valid JSON object in the format: { "questions": [{ "type": "verbal", "text": "..." }, { "type": "coding", "text": "..." }] }

    Job Description: "${jobDescription}"
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const responseJson = JSON.parse(completion.choices[0].message.content);
  return responseJson.questions;
};

const getAnalysisFromAI = async (analysisData) => {
  const prompt = `
    Analyze the following interview data. The user was applying for a job with this description: "${analysisData.jobDescription}".
    Their focus level, measured by eye tracking, was ${analysisData.focusPercent.toFixed(
      1
    )}%.
    Here are the questions and their answers:
    ${JSON.stringify(analysisData.interviewData, null, 2)}
    Your task is to provide a comprehensive analysis. Return a response as a single, valid JSON object with two keys:
    1. "narrative": A string containing a 2-3 sentence constructive summary of the performance.
    2. "scores": An object with ratings out of 10 for: "Technical Accuracy", "Communication & Clarity", "Confidence Level", "Time Management", "Completeness of Answers".
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content);
};

/* ===========================
   SPEECH MANAGER (unchanged)
   =========================== */
class SpeechManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.isSpeaking = false;
    this.voicesReady = false;
    this._voicesPromise = null;
  }
  waitForVoices() {
    if (this.voicesReady) return Promise.resolve();
    if (this._voicesPromise) return this._voicesPromise;
    this._voicesPromise = new Promise((resolve) => {
      const check = () => {
        const v = this.synth.getVoices();
        if (v && v.length) {
          this.voicesReady = true;
          resolve();
        } else {
          this.synth.onvoiceschanged = () => {
            if (!this.voicesReady && this.synth.getVoices().length) {
              this.voicesReady = true;
              resolve();
            }
          };
          setTimeout(() => resolve(), 500);
        }
      };
      check();
    });
    return this._voicesPromise;
  }
  async speakAsync(text) {
    if (!text) return "skipped";
    await this.waitForVoices();
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
    return new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      this.utterance = u;
      this.isSpeaking = true;
      u.onend = () => {
        this.isSpeaking = false;
        resolve("ended");
      };
      u.onerror = (e) => {
        this.isSpeaking = false;
        if (
          e.error === "interrupted" ||
          e.error === "canceled" ||
          e.error === "aborted"
        ) {
          resolve(e.error);
        } else {
          reject(e);
        }
      };
      this.synth.speak(u);
    });
  }
  cancel() {
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

/* ===========================
   GSAP HELPERS (React-safe)
   =========================== */
const useGSAPAnimate = (key) => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // Kill any old tweens on children when state changes
      gsap.killTweensOf(containerRef.current.children);

      // Entrance animation for current state content
      gsap.from(containerRef.current.children, {
        opacity: 0,
        y: 40,
        scale: 0.98,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      });

      // Subtle, looping background pulse on the container itself
      gsap.to(containerRef.current, {
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(168,85,247,0.12), rgba(236,72,153,0.12))",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [key]);

  return containerRef;
};

const FocusBadge = ({ status, percent }) => {
  const color =
    status === "Focused"
      ? "text-emerald-400 border-emerald-500/40"
      : "text-amber-400 border-amber-500/40";
  return (
    <div
      className={`absolute bottom-2 left-2 text-sm px-3 py-1 rounded border backdrop-blur bg-black/40 ${color}`}
    >
      Focus: {status} · {Math.round(percent)}%
    </div>
  );
};

/* ===========================
   MAIN COMPONENT
   =========================== */
export default function Interview() {
  // Core state
  const [jobDescription, setJobDescription] = useState("");
  const [interviewState, setInterviewState] = useState("idle"); // idle | generating | inProgress | analyzing | finished
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewData, setInterviewData] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisScores, setAnalysisScores] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const nextQuestionTimeoutRef = useRef(null);
  const flowAbortRef = useRef({ aborted: false });

  const speechManagerRef = useRef(null);
  if (!speechManagerRef.current) speechManagerRef.current = new SpeechManager();

  const stateRef = useRef({});
  stateRef.current = {
    codeAnswer,
    currentTranscript,
    currentQuestionIndex,
    questions,
    interviewData,
  };

  // Focus tracking
  const [focusFrames, setFocusFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [focusPercent, setFocusPercent] = useState(0);
  const [focusStatus, setFocusStatus] = useState("initializing...");

  // GSAP-scoped container
  const contentRef = useGSAPAnimate(interviewState);

  /* ===========================
     MediaPipe FaceMesh → onResults
     =========================== */
  const onResults = useCallback((results) => {
    setTotalFrames((f) => f + 1);
    if (!results.multiFaceLandmarks?.length) {
      setFocusStatus("Distracted");
      return;
    }
    const lm = results.multiFaceLandmarks[0];
    const eyeDist = Math.hypot(lm[263].x - lm[33].x, lm[263].y - lm[33].y);
    const noseToCenter = lm[1].x - (lm[33].x + lm[263].x) / 2;
    const yaw = Math.atan2(noseToCenter, eyeDist) * (180 / Math.PI);
    if (Math.abs(yaw) < 15) {
      setFocusStatus("Focused");
      setFocusFrames((f) => f + 1);
    } else {
      setFocusStatus("Distracted");
    }
  }, []);

  // Mount mediapipe camera only during interview
  useEffect(() => {
    if (interviewState !== "inProgress" || !videoRef.current) return;
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) await faceMesh.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start().catch((err) => {
      console.error("Camera start failed:", err);
      setError("Camera failed to start. Check permissions and refresh.");
      setInterviewState("idle");
    });

    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, [interviewState, onResults]);

  /* ===========================
     Recording helpers
     =========================== */
  const clearNextTimer = () => {
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }
  };

  const stopAnswerRecording = useCallback(() => {
    try {
      speechRecognitionRef.current?.stop();
    } catch {}
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
        if (mediaRecorderRef.current.state === "recording")
          mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  const startAnswerRecording = useCallback(async () => {
    setCurrentTranscript("");
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaRecorderRef.current = new MediaRecorder(audioStream);
      mediaRecorderRef.current.start();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech recognition is not supported.");
        return;
      }
      const recognition = new SpeechRecognition();
      Object.assign(recognition, {
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
      speechRecognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let chunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i)
          chunk += event.results[i][0].transcript;
        setCurrentTranscript((prev) => prev + chunk);
      };
      recognition.onerror = (event) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setError(`Speech error: ${event.error}`);
        }
      };
      recognition.start();
    } catch (err) {
      console.error(err);
      setError("Mic permission denied or unavailable.");
      setInterviewState("idle");
    }
  }, []);

  /* ===========================
     Flow control
     =========================== */
  const beginQuestion = useCallback(
    async (index, qListOverride = null) => {
      clearNextTimer();
      flowAbortRef.current.aborted = false;

      // hard stop any previous audio
      speechManagerRef.current.cancel();
      stopAnswerRecording();

      const qList = qListOverride || stateRef.current.questions;
      const q = qList[index];
      if (!q) return;

      setCurrentQuestionIndex(index);

      try {
        await speechManagerRef.current.speakAsync(
          `Question ${index + 1}. ${q.text}`
        );
      } catch (e) {
        console.error("TTS error:", e);
      }
      if (flowAbortRef.current.aborted) return;

      await startAnswerRecording();

      // auto-advance after 20 seconds
      nextQuestionTimeoutRef.current = setTimeout(() => {
        moveToNextQuestion();
      }, 20000);
    },
    [startAnswerRecording, stopAnswerRecording]
  );

  const collectAndAdvance = useCallback(
    (targetIndexAfter) => {
      const {
        questions,
        currentQuestionIndex,
        codeAnswer,
        currentTranscript,
      } = stateRef.current;
      const curr = questions[currentQuestionIndex];
      if (curr) {
        const answerData = {
          question: curr.text,
          type: curr.type,
          answer: curr.type === "coding" ? codeAnswer : currentTranscript,
          ...(curr.type === "coding"
            ? { codingTranscript: currentTranscript }
            : null),
        };
        setInterviewData((prev) => [...prev, answerData]);
      }
      setCurrentTranscript("");
      setCodeAnswer("");

      if (targetIndexAfter < questions.length) {
        beginQuestion(targetIndexAfter);
      } else {
        stopAnswerRecording();
        setFocusPercent(
          totalFrames > 0 ? (focusFrames / totalFrames) * 100 : 0
        );
        setInterviewState("analyzing");
      }
    },
    [beginQuestion, stopAnswerRecording, focusFrames, totalFrames]
  );

  const moveToNextQuestion = useCallback(() => {
    clearNextTimer();
    flowAbortRef.current.aborted = true;
    speechManagerRef.current.cancel();
    stopAnswerRecording();
    const nextIdx = stateRef.current.currentQuestionIndex + 1;
    collectAndAdvance(nextIdx);
  }, [collectAndAdvance, stopAnswerRecording]);

  /* ===========================
     Actions
     =========================== */
  const handleStartInterview = async () => {
    if (!jobDescription.trim()) {
      setError("Provide a job description.");
      return;
    }
    setError(null);
    setAnalysisScores(null);
    setInterviewState("generating");
    try {
      const fetchedQuestions = await fetchQuestionsFromAI(jobDescription);
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error("AI did not return any questions.");
      }
      setQuestions(fetchedQuestions);
      setInterviewData([]);
      setFocusFrames(0);
      setTotalFrames(0);
      setInterviewState("inProgress");
      await beginQuestion(0, fetchedQuestions);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch questions from Groq. Check API key and console.");
      setInterviewState("idle");
    }
  };

const handleGetAnalysis = async () => {
    try {
      const result = await getAnalysisFromAI({
        jobDescription,
        focusPercent,
        interviewData,
      });

      // --- MODIFICATION START ---
      // After getting the analysis, save it to our backend
      if (result && result.scores) {
        try {
          await saveStats({
            jobDescription,
            focusPercent,
            narrative: result.narrative,
            scores: result.scores,
            interviewData,
          });
          console.log("Interview stats saved successfully!");
        } catch (saveError) {
          console.error("Failed to save interview stats:", saveError);
          // Don't block the user, just log the error
        }
      }
      // --- MODIFICATION END ---

      setAnalysisResult(result.narrative);
      setAnalysisScores(result.scores);
      setInterviewState("finished");
    } catch (err) {
      console.error(err);
      setError("Failed to get analysis from Groq.");
      setInterviewState("finished");
    }
  };


  useEffect(() => {
    if (interviewState === "analyzing") {
      handleGetAnalysis();
    }
  }, [interviewState]);

  const playAnalysis = () =>
    speechManagerRef.current.speakAsync(analysisResult);

  const resetInterview = () => {
    clearNextTimer();
    flowAbortRef.current.aborted = true;
    speechManagerRef.current.cancel();
    stopAnswerRecording();
    setInterviewState("idle");
    setJobDescription("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setInterviewData([]);
    setCurrentTranscript("");
    setCodeAnswer("");
    setAnalysisResult("");
    setError(null);
    setAnalysisScores(null);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearNextTimer();
      flowAbortRef.current.aborted = true;
      speechManagerRef.current.cancel();
      stopAnswerRecording();
    };
  }, [stopAnswerRecording]);

  /* ===========================
     Render helpers
     =========================== */
  const StageHeader = ({ title, subtitle }) => (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(14,165,233,0.15)] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_10%_-10%,rgba(56,189,248,0.15),transparent),radial-gradient(600px_300px_at_90%_0%,rgba(192,38,211,0.12),transparent)]" />
      <div className="relative">
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && (
          <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const renderQuestionUI = () => {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <Card className="relative bg-neutral-900/80 backdrop-blur-xl border border-sky-500/25 shadow-xl rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-purple-500/10 to-pink-500/10" />
        <CardHeader className="relative z-10">
          <CardTitle>
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <p className="text-lg font-semibold">{currentQuestion?.text}</p>
          <p className="italic text-sm text-neutral-400">
            Auto-advances in 20s or click Next
          </p>

          {currentQuestion?.type === "coding" && (
            <div className="space-y-2">
              <h4 className="font-semibold">Your Code:</h4>
              <Textarea
                value={codeAnswer}
                onChange={(e) => setCodeAnswer(e.target.value)}
                rows={10}
                className="font-mono bg-neutral-800 border-neutral-700 text-neutral-100"
                placeholder="Type your code solution here."
              />
            </div>
          )}

          <div>
            <h4 className="font-semibold">Live Transcript:</h4>
            <p className="italic text-neutral-400">
              {currentTranscript || "..."}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={moveToNextQuestion} className="w-full">
              {currentQuestionIndex === questions.length - 1
                ? "Finish Interview"
                : "Next Question"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    switch (interviewState) {
      case "inProgress":
        return (
          <>
            <StageHeader
              title="Interview In Progress"
              subtitle="Answer verbally. Coding answers can be typed."
            />
            {renderQuestionUI()}
          </>
        );

      case "analyzing":
        return (
          <>
            <StageHeader
              title="Interview Complete"
              subtitle="AI is analyzing your responses"
            />
            <Card className="bg-neutral-900/80 backdrop-blur-xl border border-sky-500/20 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center space-y-4">
                <p>Your focus score: {Math.round(focusPercent)}%</p>
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-500 mx-auto" />
              </CardContent>
            </Card>
          </>
        );

      case "finished":
        return (
          <>
            <StageHeader
              title="Analysis Ready"
              subtitle="Review your performance and next steps"
            />
            <Card className="bg-neutral-900/80 backdrop-blur-xl border border-sky-500/20 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {analysisScores && <AnalysisChart scores={analysisScores} />}
                <div>
                  <h4 className="font-semibold text-lg mb-2">AI Summary</h4>
                  <div className="p-4 border border-neutral-700 rounded bg-neutral-800 whitespace-pre-wrap">
                    {analysisResult || "Analysis could not be generated."}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={playAnalysis} disabled={!analysisResult}>
                    Play Summary
                  </Button>
                  <Button variant="secondary" onClick={resetInterview}>
                    Start New Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case "generating":
        return (
          <>
            <StageHeader
              title="Generating Questions"
              subtitle="Reading the job description and preparing prompts"
            />
            <Card className="bg-neutral-900/80 backdrop-blur-xl border border-sky-500/20 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-full h-2 bg-neutral-800 rounded">
                  <div className="h-2 w-2/3 rounded bg-gradient-to-r from-sky-500 via-fuchsia-500 to-rose-500 animate-pulse" />
                </div>
                <p className="text-neutral-300">Please wait…</p>
              </CardContent>
            </Card>
          </>
        );

      case "idle":
      default:
        return (
          <>
            <StageHeader
              title="Prepare for Your AI Interview"
              subtitle="Paste the job description to begin"
            />
            <Card className="bg-neutral-900/80 backdrop-blur-xl border border-sky-500/25 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="space-y-4 p-6">
                <Textarea
                  rows={10}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="e.g., Seeking a React developer with 5 years of experience..."
                  className="bg-neutral-800 border-neutral-700 text-neutral-100"
                />
                <Button
                  onClick={handleStartInterview}
                  disabled={!jobDescription.trim()}
                  className="w-full"
                >
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </>
        );
    }
  };

  /* ===========================
     JSX
     =========================== */
  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans p-6 bg-neutral-950 min-h-screen text-neutral-100">
      {/* Left column: dynamic content */}
      <div className="flex-1 space-y-4" ref={contentRef}>
        {renderContent()}
        {error && (
          <p className="text-red-500 mt-2">
            <strong>Error:</strong> {error}
          </p>
        )}
      </div>

      {/* Right column: camera + focus */}
      <div className="flex-1 space-y-4">
        <Card className="bg-neutral-900/80 backdrop-blur-xl border border-sky-500/20 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Camera Feed & Focus Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video bg-black overflow-hidden rounded-xl border border-neutral-700">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {interviewState === "inProgress" && (
                <FocusBadge status={focusStatus} percent={focusPercent} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
