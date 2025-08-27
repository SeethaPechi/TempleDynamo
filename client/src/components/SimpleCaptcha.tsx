import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onVerify: (isVerified: boolean) => void;
  isVerified: boolean;
}

export function SimpleCaptcha({ onVerify, isVerified }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');

  const generateNumbers = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setError('');
    onVerify(false);
  };

  useEffect(() => {
    generateNumbers();
  }, []);

  const handleVerify = () => {
    const correctAnswer = num1 + num2;
    const userAnswerNum = parseInt(userAnswer);
    
    if (userAnswerNum === correctAnswer) {
      onVerify(true);
      setError('');
    } else {
      onVerify(false);
      setError('Incorrect answer. Please try again.');
      generateNumbers();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-center space-x-3 mb-3">
        <div className="text-lg font-mono bg-white px-3 py-2 border rounded">
          {num1} + {num2} = ?
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateNumbers}
          className="p-2"
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          placeholder="Enter answer"
          value={userAnswer}
          onChange={handleInputChange}
          className="w-24"
          disabled={isVerified}
        />
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!userAnswer || isVerified}
          variant={isVerified ? "default" : "outline"}
          size="sm"
        >
          {isVerified ? "✓ Verified" : "Verify"}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {isVerified && <p className="text-green-600 text-sm mt-2">✓ Verification successful</p>}
    </div>
  );
}