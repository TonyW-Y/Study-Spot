import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/app-context";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useApp();
  const routerLocation = useLocation();
  const redirectTo = (routerLocation.state as { from?: string } | null)?.from ?? "/";
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const user = await login(formData.email, formData.password);
      toast({
        title: `Welcome back, ${user.name.split(" ")[0]}!`,
        description: "Grab a warm drink and let's find your spot.",
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-md space-y-6 animate-fade-up">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-primary text-4xl shadow-glow animate-float" aria-hidden>🧸</div>
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">
              Your cozy corner missed you. Sign in to pick up where you left off.
            </p>
          </div>

          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center font-display text-xl">Sign In</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() =>
                      toast({
                        title: "Accounts are stored on this device",
                        description: "This demo keeps accounts in your browser, so there's no email reset. Create a new account if you've forgotten your password.",
                      })
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6">
                <Separator className="my-4" />
                
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                  </span>
                  <Link to="/signup" className="text-sm text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Account */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-medium text-foreground">Demo Account</h3>
                <p className="text-xs text-muted-foreground">
                  Try the app with demo credentials:
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Email: demo@studyspot.com</div>
                  <div>Password: demo123</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ email: "demo@studyspot.com", password: "demo123" })}
                >
                  Use demo account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;