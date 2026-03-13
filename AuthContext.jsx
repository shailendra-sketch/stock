import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persistent session
        const storedUser = localStorage.getItem('market_matrix_user') || localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }
        setLoading(false);

        // Clear session on page refresh as requested
        const handleBeforeUnload = () => {
            localStorage.removeItem('market_matrix_user');
            localStorage.removeItem('market_matrix_token');
            localStorage.removeItem('user');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:7860/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            setUser(data.user);
            localStorage.setItem('market_matrix_user', JSON.stringify(data.user));
            if (data.token) localStorage.setItem('market_matrix_token', data.token);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (name, email, password, role) => {
        try {
            const response = await fetch('http://localhost:7860/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Signup failed');

            setUser(data.user);
            localStorage.setItem('market_matrix_user', JSON.stringify(data.user));
            if (data.token) localStorage.setItem('market_matrix_token', data.token);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const googleLogin = async (tokenResponse) => {
        // In a real implementation this would verify the token with the backend
        // For now, we simulate a successful login by storing the response
        const userPayload = {
            id: tokenResponse.credential ? 'google-user' : 'mock-user',
            email: "user@example.com", // Mock data
            name: "Google User",
            role: "Viewer",
            auth_provider: "google",
            tokenData: tokenResponse
        };
        
        setUser(userPayload);
        localStorage.setItem('market_matrix_user', JSON.stringify(userPayload));
        if (tokenResponse.access_token) localStorage.setItem('market_matrix_token', tokenResponse.access_token);
        
        // Wait a tick for React context to flush updates down to ProtectedRoute
        await new Promise(resolve => setTimeout(resolve, 0));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('market_matrix_user');
        localStorage.removeItem('market_matrix_token');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
