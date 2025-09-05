// src/components/CareerPathfinder.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Button,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Link,
} from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import pdfToText from 'react-pdftotext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { FaFileUpload, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { SiGooglegemini } from 'react-icons/si';


// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// Enhanced gradient palette for cards
const gradients = [
  'from-purple-500 to-indigo-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-lime-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

// Custom component for a more engaging loading state
const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex flex-col items-center gap-4"
  >
    <div className="relative">
      <SiGooglegemini className="text-6xl text-cyan-400 animate-[spin_4s_linear_infinite]" />
      <div className="absolute inset-0 rounded-full border-4 border-purple-500/50 animate-[spin_3s_linear_infinite_reverse]"></div>
    </div>
    <p className="text-lg font-semibold tracking-wider text-white/80">Analyzing your future...</p>
  </motion.div>
);

export default function CareerPathfinder() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [learningPath, setLearningPath] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 1. GSAP REFACTOR: Refs for animation targets ---
  const main = useRef(null);
  const timelineRef = useRef(null);
  // We use a single ref to hold an array of all the dot elements
  const timelineDotsRef = useRef([]);

  const client = useMemo(() => {
    const apiKey = import.meta.env.VITE_RESUME_TOKEN;
    if (!apiKey) {
      console.error('VITE_RESUME_TOKEN is not set.');
      setError('AI API Key is missing. Please check your configuration.');
      return null;
    }
    // Note: This endpoint is specific to a GitHub-hosted model service.
    // For production, you'd typically use your own deployed model endpoint from Azure, OpenAI, etc.
    return ModelClient('https://models.github.ai/inference', new AzureKeyCredential(apiKey));
  }, []);

  // --- 2. GSAP REFACTOR: useGSAP with refs instead of string selectors ---
  useGSAP(
    () => {
      if (learningPath.length > 0) {
        // Target the timeline container directly via its ref
        const timeline = timelineRef.current;

        // Animate the connecting line
        // We find the line within the scoped timeline container
        gsap.to(timeline.querySelector('.timeline-line'), {
          scaleY: 1,
          scrollTrigger: {
            trigger: timeline,
            start: 'top 60%',
            end: 'bottom 80%',
            scrub: 1,
          },
          ease: 'none',
        });

        // Animate the step dots using the array of refs
        gsap.fromTo(
          timelineDotsRef.current,
          { scale: 0 },
          {
            scale: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: timeline,
              start: 'top 50%',
              end: 'bottom 90%',
              scrub: 1,
            },
            ease: 'back.out(1.7)',
          }
        );
      }
    },
    { scope: main, dependencies: [learningPath] } // Re-run animation when learningPath changes
  );

  // --- 3. UX ENHANCEMENT: Auto-scroll to results ---
  useEffect(() => {
    if (learningPath.length > 0 && timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [learningPath]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setResumeText('');
    setLearningPath([]);
    setResumeFile(file);

    try {
      const text = await pdfToText(file);
      setResumeText(text);
    } catch (err) {
      console.error('PDF Parsing Error:', err);
      setError('Could not extract text from the PDF. Try another file.');
      setResumeFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResume = () => {
    setResumeFile(null);
    setResumeText('');
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) fileInput.value = '';
  }

  const generateLearningPath = async () => {
    if (!client || !resumeText || !jobDescription) {
      setError('Please upload a resume and provide a job description.');
      return;
    }

    setIsLoading(true);
    setError('');
    setLearningPath([]);

    const systemPrompt = `You are an expert career coach AI. Your task is to analyze a user's resume against a job description and identify the top 3-5 most critical skill gaps. For each skill gap, create a concise, actionable learning step.

Respond ONLY with a valid JSON array of objects. Each object must have the following structure:
{
  "skill": "The specific skill name (e.g., 'State Management with Redux Toolkit')",
  "reason": "A brief, compelling reason why this skill is crucial for the target job, formatted as a single string with bullet points prefixed by '- '. Use '\\n' for new lines. Example: '- Manages complex application state effectively.\\n- A common requirement in modern React development.'",
  "time": "A realistic time estimate to gain foundational knowledge (e.g., '1-2 Weeks', '10-15 Hours')",
  "resource": "A single, high-quality, publicly accessible URL to a tutorial, documentation, or course to learn this skill."
}

Do not include any introductory text, backticks, explanations, or markdown formatting outside of the JSON array. The entire response must be the JSON data itself.`;

    const userInput = `Resume:\n---\n${resumeText}\n---\n\nJob Description:\n---\n${jobDescription}\n---`;

    try {
      const response = await client.path('/chat/completions').post({
        body: {
          model: 'xai/grok-3', // Can be swapped with other models like 'gpt-4o', etc.
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput },
          ],
          max_tokens: 2048,
          temperature: 0.5,
          response_format: { type: 'json_object' }, // Enforce JSON output
        },
      });

      if (isUnexpected(response)) {
        throw new Error(response.body.error?.message || 'Unexpected AI service error.');
      }

      const aiContent = response.body.choices[0].message.content;

      try {
        const parsedPath = JSON.parse(aiContent);
        // Handle cases where the model might wrap the array in a root object
        const pathArray = Array.isArray(parsedPath) ? parsedPath : parsedPath.learningPath || parsedPath.skills || [];

        // Before setting the state, clear out the refs array for the new elements
        timelineDotsRef.current = [];
        setLearningPath(pathArray);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, aiContent);
        setError('AI response was not formatted correctly. Please try again.');
      }
    } catch (err) {
      console.error('AI API Error:', err);
      setError(err.message || 'AI service communication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={main} className="relative min-h-screen bg-[#0D1117] text-white overflow-x-hidden font-sans">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute bottom-0 left-[-20%] right-[-20%] top-[-20%] bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
        <div className="absolute bottom-0 right-[-20%] top-[-10%] bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl p-4 sm:p-8">
        <header className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg"
          >
            AI Career Path Generator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg mt-4 text-slate-400 max-w-2xl mx-auto"
          >
            Bridge the gap between your resume and your dream job. Get a personalized, step-by-step learning plan in seconds.
          </motion.p>
        </header>

        {/* --- Inputs Section --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2"><Chip color="primary" variant="shadow" size="lg" className="px-4 py-2 font-semibold text-lg rounded-xl"
            >1</Chip> Upload Your Resume</h2>
            <div className="relative">
              <Button
                as="label"
                htmlFor="resume-upload"
                fullWidth
                size="lg"
                startContent={!resumeFile && <FaFileUpload />}
                className="bg-slate-800/60 border-2 border-dashed border-slate-600 text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-all duration-300 cursor-pointer h-20 text-lg rounded-full"
              >
                {resumeFile ? `Selected: ${resumeFile.name}` : 'Click to Upload PDF'}
              </Button>
              <input id="resume-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              {resumeFile && (
                <Button isIconOnly onPress={clearResume} size="sm" className="absolute top-2 right-2 bg-red-500/20 text-red-400 z-20" aria-label="Remove resume">
                  <FaTimes />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2"><Chip color="primary" variant="shadow" size="lg" className="px-4 py-2 font-semibold text-lg rounded-xl"
            >2</Chip> Paste Job Description</h2>
            <Textarea
              labelPlacement="outside"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onValueChange={setJobDescription}
              minRows={6}
              classNames={{
                inputWrapper: "bg-slate-800/60 border border-slate-700 hover:border-purple-500 focus-within:border-purple-500 transition-colors rounded-full pl-5",
                input: "text-slate-200",
              }}
            />
          </div>
        </motion.div>

        {/* --- Action Button & Status --- */}
        <div className="text-center mb-16">
          <AnimatePresence mode="wait">
            {!isLoading ? (
              <motion.div
                key="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  size="lg"
                  onPress={generateLearningPath}
                  isDisabled={!resumeText || !jobDescription}
                  endContent={<FaPaperPlane />}
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold px-10 py-7 text-lg shadow-lg shadow-sky-500/20 rounded-full transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:scale-100"
                >
                  Generate My Learning Path
                </Button>
              </motion.div>
            ) : (
              <motion.div key="loader">
                <LoadingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 mt-4 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* --- Learning Path Display --- */}
        <AnimatePresence>
          {learningPath.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-black text-center mb-12 bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                Your Personalized Roadmap
              </h2>
              {/* GSAP-Powered Timeline */}
              <div ref={timelineRef} className="relative max-w-2xl mx-auto pl-8">
                {/* The vertical line */}
                <div className="timeline-line absolute left-[1px] top-0 h-full w-1 origin-top bg-gradient-to-b from-transparent via-sky-500 to-purple-500 scale-y-0" />

                <div className="space-y-16">
                  {learningPath.map((step, index) => (
                    <motion.div
                      key={step.skill}
                      className="relative"
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
                    >
                      {/* --- 4. GSAP REFACTOR: Assign ref to each dot element --- */}
                      <div
                        // This function adds the DOM node to our array of refs
                        ref={(el) => (timelineDotsRef.current[index] = el)}
                        className="absolute -left-9 top-1 flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-500"
                      >
                        <div className="w-3 h-3 rounded-full bg-sky-400"></div>
                      </div>

                      <Card
                        className="bg-slate-800/50 backdrop-blur-md border border-slate-700 shadow-2xl shadow-black/30 overflow-hidden group"
                      >
                        <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${gradients[index % gradients.length]} transition-all duration-500 group-hover:shadow-[0_0_15px] group-hover:shadow-cyan-400/50`} />
                        <CardHeader className="flex-col items-start px-6 pt-6">
                          <Chip className="mb-3 bg-black/40 border border-white/20 text-white font-semibold">{`Step ${index + 1}`}</Chip>
                          <h3 className="text-2xl font-bold text-slate-100">{step.skill}</h3>
                        </CardHeader>
                        <CardBody className="px-6 space-y-4 text-slate-300">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-300 mb-1">📌 Why It's Important</h4>
                            {/* Using whitespace-pre-line to respect newlines from the AI response */}
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                              {step.reason.split('\n').map((point, i) => (
                                point.trim() && <li key={i}>{point.trim().replace(/^- /, '')}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-300 mb-1">⏱️ Estimated Time</h4>
                            <p>{step.time}</p>
                          </div>
                        </CardBody>
                        <CardFooter className="px-6 pb-6 pt-2">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-slate-300 mb-1">📚 Recommended Resource</h4>
                            <Link
                              href={step.resource}
                              isExternal
                              showAnchorIcon
                              className="text-cyan-400 underline-offset-4 hover:underline"
                            >
                              <span className="truncate block max-w-[200px] sm:max-w-xs md:max-w-md">{step.resource}</span>
                            </Link>
                          </div>
                          <Button
                            as={Link}
                            href={step.resource}
                            isExternal
                            className={`bg-gradient-to-r ${gradients[index % gradients.length]} text-white font-bold shadow-lg transform hover:scale-105 transition-transform`}
                          >
                            Learn Now
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}