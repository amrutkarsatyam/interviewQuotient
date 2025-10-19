// client/src/components/interview/InProgressStage.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import Header from './Header';

const InProgressStage = ({ questions, currentQuestionIndex, currentTranscript, codeAnswer, setCodeAnswer, moveToNextQuestion }) => {
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Header title="Interview In Progress" subtitle="Answer verbally or type your code below." />
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-indigo-600 font-bold">
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl font-semibold text-slate-800 min-h-[6rem]">{currentQuestion?.text}</p>
          
          {currentQuestion?.type === "coding" ? (
            <Textarea 
              value={codeAnswer} 
              onChange={(e) => setCodeAnswer(e.target.value)} 
              rows={8} 
              className="text-base font-mono bg-slate-900 text-slate-50 border-slate-600 focus:ring-indigo-500" 
              placeholder="Type your code solution here..." 
            />
          ) : (
            <div>
              <h4 className="text-lg text-slate-700 font-semibold">Live Transcript:</h4>
              <p className="text-md italic text-slate-500 min-h-[40px] pt-2">
                {currentTranscript || "Listening..."}
              </p>
            </div>
          )}

          <Button 
            onClick={moveToNextQuestion} 
            className="w-full text-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 py-3 h-auto"
          >
            {currentQuestionIndex === questions.length - 1 ? "Finish & Get Analysis" : "Next Question"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default InProgressStage;