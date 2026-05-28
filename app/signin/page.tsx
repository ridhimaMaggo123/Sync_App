"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      setIsSubmitting(false);
      return;
    }

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const body = isSignUp 
        ? JSON.stringify({ name, email, password })
        : JSON.stringify({ email, password });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
      
      const raw = await res.text();
      let data: { message?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      
      if (res.ok) {
        setMessage({ 
          type: "success", 
          text: isSignUp 
            ? "Registered successfully! You can now sign in." 
            : "Signed in successfully!" 
        });
        
        if (isSignUp) {
          // Switch to sign in mode after successful registration
          setTimeout(() => {
            setIsSignUp(false);
            setMessage(null);
            e.currentTarget.reset();
          }, 2000);
        } else {
          // Redirect to dashboard after successful sign in
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        }
      } else {
        const fallbackMessage = res.status === 503
          ? "Database is unavailable right now. Please try again shortly."
          : "Authentication failed.";
        setMessage({ type: "error", text: data.message || fallbackMessage });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Cannot reach login server. Make sure backend is running on port 5000.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-md px-4"
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-lg"
            >
              {isSignUp ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              {isSignUp ? "Join Sync Today!" : "Welcome Back!"}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {isSignUp 
                ? "Create your account to unlock personalized hormonal health insights."
                : "Sign in to continue your hormonal health journey."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <Input 
                  name="name" 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  className="mt-1" 
                />
              )}
              
              <Input 
                name="email" 
                type="email" 
                placeholder="Email" 
                required 
                className="mt-1" 
              />
              
              <div className="relative">
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  required 
                  className="mt-1 pr-10" 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isSignUp && (
                <div className="relative">
                  <Input 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm Password" 
                    required 
                    className="mt-1 pr-10" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 text-lg rounded-lg shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isSignUp ? "Registering..." : "Signing In..."}
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <UserPlus className="w-5 h-5 mr-2" />
                    ) : (
                      <LogIn className="w-5 h-5 mr-2" />
                    )}
                    {isSignUp ? "Register" : "Sign In"}
                  </>
                )}
              </Button>
            </form>
            
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 text-center text-sm ${
                  message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {message.text}
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-6 text-center"
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                {isSignUp 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Register"
                }
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
