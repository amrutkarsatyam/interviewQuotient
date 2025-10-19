// client/src/components/interview/FinishedStage.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Header from './Header';

const FinishedStage = ({ analysisResult, resetInterview }) => {
  if (!analysisResult) {
    return (
      <Card className="bg-white p-6 border-slate-200">
        <p className="text-lg text-slate-600">Analysis could not be generated. Please try again.</p>
        <Button onClick={resetInterview} className="mt-4 w-full text-lg font-bold bg-slate-600 text-white hover:bg-slate-700 py-3 h-auto">
          Start New Interview
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Header title="Analysis Complete" subtitle="Here is your detailed performance feedback." />
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-800">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h4 className="text-xl mb-2 text-indigo-700 font-bold">AI Summary</h4>
            <p className="text-base text-slate-600 whitespace-pre-wrap">{analysisResult.narrative}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xl mb-2 text-green-700 font-bold">Strengths</h4>
              <ul className="space-y-2 text-base text-slate-700 list-disc list-inside">
                {analysisResult.strengths?.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xl mb-2 text-amber-700 font-bold">Areas for Improvement</h4>
              <ul className="space-y-2 text-base text-slate-700 list-disc list-inside">
                {analysisResult.weaknesses?.map(w => <li key={w}>{w}</li>)}
              </ul>
            </div>
          </div>
          
          <Button onClick={resetInterview} className="w-full text-lg font-bold bg-slate-600 text-white hover:bg-slate-700 py-3 h-auto">
            Start New Interview
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default FinishedStage;