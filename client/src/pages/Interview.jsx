// client/src/pages/Interview.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { getProfile, saveStats } from "../services/api";
import { fetchQuestionsFromAI, getAnalysisFromAI } from "../services/ai"; // Modularized
import { SpeechManager } from "../utils/speech"; // Modularized

// Import stage components
import IdleStage from "../components/interview/IdleStage";
import InProgressStage from "../components/interview/InProgressStage";
import AnalyzingStage from "../components/interview/AnalyzingStage";
import FinishedStage from "../components/interview/FinishedStage";
import CameraView from "../components/interview/CameraView";

export default function Interview() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [interviewState, setInterviewState] = useState("idle"); // idle, generating, inProgress, analyzing, finished
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewData, setInterviewData] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({ weaknesses: [] });
  const [answerStartTime, setAnswerStartTime] = useState(null);

  const videoRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechManagerRef = useRef(new SpeechManager());

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await getProfile();
        setUserProfile(data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Could not load your profile data.");
      }
    };
    fetchUserProfile();
  }, []);

  // Start camera when interview is in progress
  useEffect(() => {
    if (interviewState === "inProgress" && videoRef.current) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream;
            })
            .catch(err => {
                console.error("Camera error:", err);
                setError("Camera access was denied. Please enable camera permissions and refresh.");
                setInterviewState("idle");
            });

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }
  }, [interviewState]);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    setCurrentTranscript("");
    setAnswerStartTime(Date.now());
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    Object.assign(recognition, { lang: "en-US", interimResults: true, continuous: true });
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0]).map(r => r.transcript).join('');
      setCurrentTranscript(transcript);
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Speech error: ${e.error}`);
      }
    };
    recognition.start();
    speechRecognitionRef.current = recognition;
  }, []);

  const beginQuestion = useCallback(async (index, questionsList) => {
    speechManagerRef.current.cancel();
    stopRecording();
    const q = questionsList[index];
    if (!q) return;
    setCurrentQuestionIndex(index);
    try {
      await speechManagerRef.current.speakAsync(`Question ${index + 1}. ${q.text}`);
      if (q.type !== "coding") {
        startRecording();
      }
    } catch (e) {
      console.error("TTS error:", e);
      setError("Could not play the question audio.");
    }
  }, [startRecording, stopRecording]);

  const moveToNextQuestion = useCallback(() => {
    stopRecording();
    const currentQ = questions[currentQuestionIndex];
    if (currentQ) {
      const durationInSeconds = answerStartTime ? Math.round((Date.now() - answerStartTime) / 1000) : 0;
      const answerData = {
        question: currentQ.text,
        type: currentQ.type,
        answer: currentQ.type === "coding" ? codeAnswer : currentTranscript,
        durationInSeconds,
      };
      setInterviewData((prev) => [...prev, answerData]);
    }
    setCodeAnswer("");
    setCurrentTranscript("");
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      beginQuestion(nextIndex, questions);
    } else {
      setInterviewState("analyzing");
    }
  }, [questions, currentQuestionIndex, codeAnswer, currentTranscript, beginQuestion, stopRecording, answerStartTime]);

  const handleStartInterview = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError("Please provide both a job description and your resume.");
      return;
    }
    setError(null);
    setInterviewState("generating");
    try {
      const fetchedQuestions = await fetchQuestionsFromAI(jobDescription, "technical");
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error("AI returned no questions.");
      }
      setQuestions(fetchedQuestions);
      setInterviewData([]);
      setInterviewState("inProgress");
      await beginQuestion(0, fetchedQuestions);
    } catch (err) {
      setError(err.message || "Failed to start interview. Please try again.");
      setInterviewState("idle");
    }
  };

  const handleGetAnalysis = useCallback(async () => {
    try {
      const result = await getAnalysisFromAI({
        jobDescription,
        resumeText,
        interviewData,
        weaknesses: userProfile?.weaknesses || [],
      });
      if (result && result.scores) {
        await saveStats({
          jobDescription,
          narrative: result.narrative,
          scores: result.scores,
          interviewData,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
        });
      }
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || "Failed to get analysis.");
    } finally {
      setInterviewState("finished");
    }
  }, [interviewData, jobDescription, resumeText, userProfile]);

  useEffect(() => {
    if (interviewState === "analyzing") {
      handleGetAnalysis();
    }
  }, [interviewState, handleGetAnalysis]);

  const resetInterview = () => {
    speechManagerRef.current.cancel();
    stopRecording();
    setInterviewState("idle");
    setJobDescription("");
    setResumeText("");
    setQuestions([]);
    setInterviewData([]);
    setAnalysisResult(null);
    setError(null);
  };
  
  const renderContent = () => {
    switch (interviewState) {
      case "inProgress":
        return <InProgressStage 
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            currentTranscript={currentTranscript}
            codeAnswer={codeAnswer}
            setCodeAnswer={setCodeAnswer}
            moveToNextQuestion={moveToNextQuestion}
        />;
      case "generating":
      case "analyzing":
        return <AnalyzingStage stage={interviewState} />;
      case "finished":
        return <FinishedStage 
            analysisResult={analysisResult}
            resetInterview={resetInterview}
        />;
      case "idle":
      default:
        return <IdleStage 
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            resumeText={resumeText}
            setResumeText={setResumeText}
            handleStartInterview={handleStartInterview}
        />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8 min-h-screen bg-slate-50 text-slate-800">
      <div className="flex-1 space-y-6">
        {renderContent()}
        {error && (
            <div className="mt-4 p-4 text-base font-semibold bg-red-100 text-red-700 border border-red-300 rounded-lg">
                <strong>Error:</strong> {error}
            </div>
        )}
      </div>

      <div className="lg:max-w-md w-full">
         <CameraView videoRef={videoRef} />
      </div>
    </div>
  );
}