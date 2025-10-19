// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = { name, email, password };
      const { data } = isLogin ? await login({ email, password }) : await register(formData);
      localStorage.setItem('token', data.token);
      navigate('/interview');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-slate-800">{isLogin ? 'Welcome Back' : 'Create an Account'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg text-slate-600">Name</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="text-lg bg-slate-100 border-slate-300" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg text-slate-600">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="text-lg bg-slate-100 border-slate-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg text-slate-600">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="text-lg bg-slate-100 border-slate-300" />
            </div>
            {error && <p className="text-lg font-bold text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full text-lg font-bold bg-blue-600 text-white hover:bg-blue-700 py-3">
                {isLogin ? 'Login' : 'Create Account'}
            </Button>
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} type="button" className="text-lg text-blue-600">
              {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}