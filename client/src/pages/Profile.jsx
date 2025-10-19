// client/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getProfile();
        setProfile(data);
      } catch (err) {
        setError('Failed to fetch profile data.');
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-background text-destructive">{error}</div>;
  }

  if (!profile) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl bg-white border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-foreground">Candidate Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-secondary rounded-lg border border-border">
            <p className="text-sm text-muted">Name</p>
            <p className="text-lg text-foreground">{profile.name}</p>
          </div>
          <div className="p-4 bg-secondary rounded-lg border border-border">
            <p className="text-sm text-muted">Email</p>
            <p className="text-lg text-foreground">{profile.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-accent">Strengths</h4>
              {profile.strengths?.length > 0 ? (
                <ul className="space-y-2">
                  {profile.strengths.map((strength, index) => <li key={index} className="p-3 bg-secondary rounded-lg border border-border text-muted">{strength}</li>)}
                </ul>
              ) : (
                <p className="text-muted italic">No strengths recorded yet.</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2 text-destructive">Weaknesses</h4>
              {profile.weaknesses?.length > 0 ? (
                <ul className="space-y-2">
                  {profile.weaknesses.map((weakness, index) => <li key={index} className="p-3 bg-secondary rounded-lg border border-border text-muted">{weakness}</li>)}
                </ul>
              ) : (
                <p className="text-muted italic">No weaknesses recorded yet.</p>
              )}
            </div>
          </div>

          <div className="text-center pt-4">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/interview">Back to Interview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}