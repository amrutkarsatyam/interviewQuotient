// client/src/components/interview/AnalyzingStage.jsx
import React from 'react';
import { Card, CardContent } from "../../components/ui/card";
import Header from './Header';

const AnalyzingStage = ({ stage }) => {
  const title = stage === 'generating' ? 'Generating Questions' : 'Analyzing Performance';
  const subtitle = stage === 'generating' ? 'The AI is creating questions for you...' : 'The AI is reviewing your answers...';

  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <Card className="bg-white border-slate-200">
        <CardContent className="p-8 text-center">
            <p className="text-lg text-slate-600">Please wait, this may take a moment.</p>
        </CardContent>
      </Card>
    </>
  );
};

export default AnalyzingStage;