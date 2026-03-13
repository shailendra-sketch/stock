import { Mail } from "lucide-react";
import { AuthCard, InputField, PasswordField, PrimaryButton, GoogleAuthButton, AuthDivider } from "../components/AuthComponents";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                 try {
                     navigate('/dashboard');
                 } catch (e) {
                     window.location.href = '/dashboard';
                 }
            } else {
                 setError(result.error || "Failed to log in");
            }
        } catch (err) {
            setError("Network or server error.");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#020B1F] text-white overflow-x-hidden lg:overflow-hidden selection:bg-cyan-500/30">
            {/* LEFT PANEL - Brand Section */}
            <div className="flex w-full lg:w-[55%] min-h-[40vh] lg:min-h-screen relative flex-col justify-center px-8 lg:px-16 xl:px-24 bg-gradient-to-br from-[#0A1332] to-[#020B1F] lg:border-r border-b lg:border-b-0 border-slate-800/50 py-12 lg:py-0">
                {/* Background Grid & Particles Effect */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTM5IDM5VjFoLTM4djM4aDM4eiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAxNSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay pointer-events-none"></div>
                
                {/* Glowing Trend Line Mock */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <svg className="absolute w-full h-[60%] top-[20%] opacity-20" viewBox="0 0 1000 400" preserveAspectRatio="none">
                        <path d="M0,300 C150,300 150,100 300,100 C450,100 450,350 600,350 C750,350 750,150 1000,150" fill="none" stroke="url(#gradient)" strokeWidth="3" filter="url(#glow)" />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                    </svg>
                    {/* Animated Particle Light */}
                    <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float top-1/4 left-1/4"></div>
                    <div className="absolute w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-float delay-500 bottom-1/4 right-1/4"></div>
                </div>

                <div className="relative z-10 max-w-xl animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6 lg:mb-8">
                        {/* Fake Logo Icon */}
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                            <span className="font-bold text-sm lg:text-lg tracking-tighter text-white">MM</span>
                        </div>
                        <h1 className="text-xl lg:text-2xl font-bold tracking-wide">MARKET MATRIX</h1>
                    </div>
                    
                    <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        Institutional Grade Market Intelligence, Democratized.
                    </h2>
                    
                    <p className="text-base lg:text-lg text-slate-400 leading-relaxed border-l-2 border-cyan-500/50 pl-4">
                        AI-Powered Market Intelligence for NIFTY50.<br className="hidden lg:block"/>
                        Get pattern detection, sentiment forecasting,<br className="hidden lg:block"/>
                        and dynamic alerts within a premium trading terminal.
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL - Auth Form */}
            <div className="flex w-full lg:w-[45%] items-center justify-center p-6 lg:p-12 relative z-10 py-12 lg:py-6">
                {/* Mobile Background Grid */}
                <div className="absolute inset-0 block lg:hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTM5IDM5VjFoLTM4djM4aDM4eiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAxNSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay pointer-events-none"></div>

                <div className="w-full max-w-[420px] animate-fade-in-up delay-100">
                    <AuthCard 
                        title="Welcome back" 
                        subtitle="Sign in to continue."
                    >
                        <form onSubmit={handleLogin}>
                            <GoogleAuthButton />
                            
                            <AuthDivider />

                            {error && (
                                <div className="mb-4 text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3 text-center">
                                    {error}
                                </div>
                            )}

                            <InputField
                                icon={Mail}
                                type="email"
                                placeholder="Corporate Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <PasswordField
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <div className="flex justify-end mb-6 -mt-2">
                                <a href="#" className="text-[13px] text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Forgot Password?
                                </a>
                            </div>

                            <PrimaryButton text={isLoading ? "Logging in..." : "Login"} />
                        </form>

                        <p className="text-center text-slate-400 mt-6 text-[14px]">
                            Don't have an account? 
                            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors ml-1.5">
                                Sign up
                            </Link>
                        </p>
                    </AuthCard>
                </div>
            </div>
        </div>
    );
}