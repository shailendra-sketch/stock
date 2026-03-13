import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from "./AuthContext";

export function AuthCard({ title, subtitle, children }) {
    return (
        <div className="w-full max-w-[420px] p-8 sm:p-10 rounded-[16px] bg-[rgba(10,20,40,0.6)] border border-[rgba(0,200,255,0.25)] backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,200,255,0.15)] relative z-50">
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"></div>
            
            <h2 className="text-2xl font-bold mb-2 text-white text-center title-glow">
                {title}
            </h2>
            <p className="text-slate-400 text-sm mb-8 text-center font-light">
                {subtitle}
            </p>
            {children}
        </div>
    );
}

export function InputField({ icon: Icon, type = "text", placeholder, value, onChange }) {
    const [focused, setFocused] = useState(false);
    const isActive = focused || (value && value.length > 0);

    return (
        <div className="relative mb-4">
            <div className={`absolute left-0 top-0 h-[44px] w-[40px] flex items-center justify-center transition-colors z-10 pointer-events-none ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                {Icon && <Icon size={18} />}
            </div>
            
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="block w-full h-[44px] pl-[40px] pr-4 bg-[#071739] border border-slate-700/50 rounded-[10px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:shadow-[0_0_12px_rgba(34,211,238,0.2)] text-white text-[14px] placeholder:text-slate-500 transition-all font-medium"
            />
        </div>
    );
}

export function PasswordField({ placeholder, icon: Icon = null, value, onChange }) {
    const [show, setShow] = useState(false);
    const [focused, setFocused] = useState(false);
    const isActive = focused || (value && value.length > 0);

    return (
        <div className="relative mb-4">
            <div className={`absolute left-0 top-0 h-[44px] w-[40px] flex items-center justify-center transition-colors z-10 pointer-events-none ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                {Icon && <Icon size={18} />}
            </div>
            
            <input
                type={show ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="block w-full h-[44px] pl-[40px] pr-10 bg-[#071739] border border-slate-700/50 rounded-[10px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:shadow-[0_0_12px_rgba(34,211,238,0.2)] text-white text-[14px] placeholder:text-slate-500 transition-all font-medium"
            />
            
            <div
                className="absolute right-0 top-0 h-[44px] w-[40px] flex items-center justify-center cursor-pointer text-slate-500 hover:text-cyan-400 transition-colors z-10"
                onClick={() => setShow(!show)}
            >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
        </div>
    );
}

export function PrimaryButton({ text }) {
    return (
        <button className="relative w-full h-[46px] mt-2 mb-6 font-semibold text-[15px] rounded-[10px] bg-gradient-to-r from-[#2ED3FF] to-[#007BFF] text-white overflow-hidden group shadow-[0_4px_14px_rgba(46,211,255,0.4)] hover:shadow-[0_6px_20px_rgba(46,211,255,0.6)] transition-all duration-300 hover:-translate-y-0.5">
            {/* Glow overlay effect */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shine_1s_ease-in-out_forwards]" />
            <span className="relative z-10">{text}</span>
        </button>
    );
}

export function RoleSelector({ selectedRole, onChange }) {
    const roles = ["Viewer", "Analyst", "Administrator"];
    
    return (
        <div className="mb-4">
            <div className="flex bg-[#071739] p-1 rounded-[10px] border border-slate-700/50 relative isolate">
                {roles.map((role) => {
                    const isActive = selectedRole === role;
                    return (
                        <button
                            key={role}
                            type="button"
                            onClick={() => onChange(role)}
                            className={`flex-1 py-1.5 text-[13px] font-medium rounded-[6px] transition-all duration-300 relative z-10 ${
                                isActive 
                                ? 'text-white'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-cyan-500/20 border border-cyan-400/50 rounded-[6px] shadow-[0_0_10px_rgba(34,211,238,0.2)] -z-10 animate-[fadeIn_0.2s_ease-out]"></div>
                            )}
                            {role}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function GoogleAuthButton({ isSignup = false }) {
    const navigate = useNavigate();
    const { googleLogin } = useAuth();
    
    const login = useGoogleLogin({
        onSuccess: async tokenResponse => {
            console.log("Google Login Success", tokenResponse);
            await googleLogin(tokenResponse);
            try {
                navigate('/dashboard');
            } catch (e) {
                window.location.href = '/dashboard';
            }
        },
        onError: () => console.log("Login Failed"),
    });

    const buttonText = isSignup ? "Continue with Google" : "Sign in with Google";

    return (
        <button 
            type="button"
            onClick={() => login()}
            className="w-full h-[44px] mb-6 flex items-center justify-center gap-3 bg-white text-[#333] border border-[#ddd] rounded-[8px] font-medium text-[14px] transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {buttonText}
        </button>
    );
}

export function AuthDivider() {
    return (
        <div className="flex items-center w-full mb-6 relative">
            <div className="flex-grow border-t border-slate-700/50"></div>
            <span className="mx-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                OR
            </span>
            <div className="flex-grow border-t border-slate-700/50"></div>
            
            {/* Subtle glow effect underneath the divider text */}
            <div className="absolute left-1/2 -translate-x-1/2 w-12 h-6 bg-cyan-500/5 blur-xl rounded-full pointer-events-none -z-10"></div>
        </div>
    );

}
