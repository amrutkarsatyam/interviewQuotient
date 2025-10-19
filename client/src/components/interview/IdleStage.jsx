// client/src/components/interview/IdleStage.jsx
import React from 'react';
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import Header from './Header';

const IdleStage = ({ jobDescription, setJobDescription, resumeText, setResumeText, handleStartInterview }) => {
  return (
    <>
      <Header title="AI Interview Prep" subtitle="Paste a job description and your resume to start." />
      <Card className="bg-white border-slate-200">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-lg text-slate-700 font-semibold">Job Description</Label>
            <Textarea 
              rows={6} 
              value={jobDescription} 
              onChange={(e) => setJobDescription(e.target.value)} 
              placeholder="e.g., Seeking a React developer with 3+ years of experience..." 
              className="text-base bg-slate-100 border-slate-300 focus:ring-indigo-500" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg text-slate-700 font-semibold">Your Resume Text</Label>
            <Textarea 
              rows={6} 
              value={resumeText} 
              onChange={(e) => setResumeText(e.target.value)} 
              placeholder="Paste your full resume text here..." 
              className="text-base bg-slate-100 border-slate-300 focus:ring-indigo-500" 
            />
          </div>
          <Button 
            onClick={handleStartInterview} 
            disabled={!jobDescription.trim() || !resumeText.trim()} 
            className="w-full text-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 py-3 h-auto disabled:bg-slate-300"
          >
            Start Interview
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default IdleStage;