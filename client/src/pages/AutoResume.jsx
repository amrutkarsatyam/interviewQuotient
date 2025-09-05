// Paste the full content of 'AutoResume' from components.txt here.
// Full code is in the attached source file.
// ... (rest of the file content)
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

// AI-related imports (no changes here)
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Import UI components from shadcn/ui
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

// Import icons
import { LoaderCircle, FileWarning, Terminal } from "lucide-react";

const AutoResume = () => {
  // State management (no changes needed here)
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');

  const apiKey = import.meta.env.VITE_RESUME_TOKEN;

  /**
   * Main handler to generate the AI-powered resume PDF.
   * The core logic remains the same.
   */
  const handleGenerateResume = async () => {
    if (!username) {
      setError('Please enter a GitHub username.');
      return;
    }
    if (!apiKey) {
      setError('API key is not configured. Please set VITE_RESUME_TOKEN in your .env file.');
      return;
    }

    // Reset state
    setLoading(true);
    setError('');
    setPdfUrl(null);
    setProgress('Fetching repository list...');

    try {
      // 1. Fetch repositories and select the top 5 most recently updated
      const repoRes = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=100`);
      if (!repoRes.ok) throw new Error(`Failed to fetch repositories for user: ${username}`);
      let repos = await repoRes.json();
      repos = repos.filter(repo => !repo.fork).slice(0, 5);
      if (repos.length === 0) {
        throw new Error('This user has no public, non-forked repositories.');
      }

      // 2. Fetch README content
      const readmePromises = repos.map(repo => {
        setProgress(`Fetching README for: ${repo.name}`);
        const readmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/README.md`;
        return fetch(readmeUrl)
          .then(res => res.ok ? res.text() : Promise.resolve(null))
          .then(text => ({ repoName: repo.name, text }));
      });
      const readmeResults = await Promise.all(readmePromises);

      // 3. Prepare AI input
      const characterLimit = 2000;
      const aiInput = readmeResults
        .filter(r => r.text)
        .map(r => `Project: ${r.repoName}\nREADME:\n${r.text.substring(0, characterLimit)}...`)
        .join('\n\n---\n\n');
      if (!aiInput) {
        throw new Error("Could not find any README files in the user's top 5 repositories.");
      }

      // 4. Call the AI model
      setProgress('AI is generating the resume summary...');
      const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(apiKey));
      const systemPrompt = `You are an expert technical resume writer...`; // Your prompt here
      const response = await client.path("/chat/completions").post({
        body: {
          model: "xai/grok-3",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: aiInput },
          ],
          max_tokens: 1024,
        },
      });
      if (isUnexpected(response)) {
        throw new Error(response.body.error?.message || "An error occurred with the AI service.");
      }
      const aiContent = response.body.choices[0].message.content;

      // 5. Generate PDF (no changes to PDF generation logic)
      setProgress('Formatting PDF...');
      const doc = new jsPDF();
      // ... your jsPDF formatting logic remains exactly the same ...
      const margin = 15;
      const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
      let y = margin;
      const writeText = (text, options = {}) => {
        const { size = 10, style = 'normal', indent = 0, lineHeight = 5 } = options;
        doc.setFontSize(size).setFont('helvetica', style);
        const lines = doc.splitTextToSize(text, maxWidth - indent);
        for (const line of lines) {
          if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin + indent, y);
          y += lineHeight;
        }
      };
      writeText(username, { size: 24, style: 'bold', lineHeight: 10 });
      writeText("Project Showcase", { size: 16, style: 'normal', lineHeight: 8 });
      y += 4;
      aiContent.split('\n').forEach(line => {
        if (!line.trim()) return;
        if (line.startsWith('### ')) {
          y += 4;
          writeText(line.substring(4), { size: 14, style: 'bold', lineHeight: 7 });
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
          writeText(`• ${line.substring(2)}`, { indent: 5 });
        } else {
          writeText(line);
        }
      });
      
      setPdfUrl(doc.output('bloburl'));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">
        <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
              AI Resume Project Generator
            </CardTitle>
            <CardDescription className="text-slate-400 pt-2">
              Enter a GitHub username to generate a resume-ready project summary using AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GitHub username (e.g., 'torvalds')"
                className="bg-slate-900 border-slate-700 focus:ring-cyan-500"
                disabled={loading}
              />
              <Button onClick={handleGenerateResume} disabled={loading || !apiKey} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
                {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Generating...' : 'Generate PDF'}
              </Button>
            </div>

            {/* --- Status Messages --- */}
            {!apiKey && (
              <Alert variant="destructive" className="mt-4 bg-red-950/50 border-red-500/30">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>API Key Missing</AlertTitle>
                <AlertDescription>Please set VITE_RESUME_TOKEN in your .env file.</AlertDescription>
              </Alert>
            )}

            {loading && progress && (
               <Alert className="mt-4 bg-slate-900 border-slate-800">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <AlertTitle>In Progress...</AlertTitle>
                <AlertDescription>{progress}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>An Error Occurred</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* --- PDF Viewer and Download Section --- */}
        {pdfUrl && (
          <div className="mt-8">
            <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl text-slate-100">Your AI-Powered Resume</CardTitle>
                            <CardDescription className="text-slate-400">View your generated PDF below or download it.</CardDescription>
                        </div>
                        <a href={pdfUrl} download={`${username}-ai-resume.pdf`}>
                            <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                                Download PDF
                            </Button>
                        </a>
                    </div>
                </CardHeader>
                <CardContent>
                    <iframe
                        src={pdfUrl}
                        title="AI Generated Resume"
                        className="w-full rounded-md border border-slate-700"
                        style={{ height: '80vh' }} // Using vh for viewport height is great for this
                    />
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoResume;