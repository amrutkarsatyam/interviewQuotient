// client/src/components/interview/CameraView.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const CameraView = ({ videoRef }) => {
    return (
        <Card className="bg-white border-slate-200 sticky top-8">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-2xl text-slate-800">Camera</CardTitle>
                <Button asChild variant="outline" className="font-bold border-slate-300 text-slate-700 hover:bg-slate-100">
                    <Link to="/profile">My Profile</Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover transform -scale-x-100" 
                />
            </div>
            <p className="text-sm text-slate-500 mt-2 text-center">Your camera is used for presence, not analysis.</p>
          </CardContent>
        </Card>
    );
};

export default CameraView;