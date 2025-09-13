"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthForm from "../components/AuthForm";
import { setAuthToken } from "@/lib/cookies";
import { Button } from "@/components/ui/button";

interface LoginCredentials {
  email: string;
  password: string;
}

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for verification success messages
    if (searchParams?.get('verified') === 'true') {
      setVerificationMessage('Email verified successfully! You can now log in to your account.');
    } else if (searchParams?.get('already-verified') === 'true') {
      setVerificationMessage('Email is already verified. You can log in to your account.');
    }
  }, [searchParams]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.data.token);
        router.push("/dashboard");
      } else {
        // Check if it's an email verification error
        if (data.requiresVerification) {
          setShowResendVerification(true);
          setResendEmail(credentials.email);
        }
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
      } else {
        alert(data.message || 'Failed to send verification email');
      }
    } catch {
      alert('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4'>
      <div className='max-w-md w-full'>
        {verificationMessage && (
          <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-md'>
            <p className='text-sm text-green-800'>
              {verificationMessage}
            </p>
          </div>
        )}
        
        <AuthForm type='login' onSubmit={handleLogin} isLoading={isLoading} />

        {showResendVerification && (
          <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
            <p className='text-sm text-yellow-800 mb-3'>
              Your email address is not verified. Please check your inbox for the verification email.
            </p>
            <Button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className='w-full'
              variant='outline'
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </div>
        )}

        <div className='text-center mt-6'>
          <p className='text-sm text-gray-600'>
            Don&apos;t have an account?{" "}
            <Link
              href='/register'
              className='text-blue-600 font-medium hover:text-blue-500'
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
