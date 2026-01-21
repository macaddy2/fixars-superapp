import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Mock user data
const MOCK_USER = {
    id: 'user-001',
    name: 'Alex Morgan',
    email: 'alex@fixars.io',
    avatar: null,
    points: 1250,
    level: 'Pioneer',
    joinedAt: '2025-06-15',
    bio: 'Building the future, one idea at a time.',
    skills: ['Product Strategy', 'UX Design', 'React'],
    connections: 47,
    projects: 12
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for existing session
        const savedUser = localStorage.getItem('fixars_user')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (email, password) => {
        // Mock login - in production, this would call an API
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 800))

        const loggedInUser = { ...MOCK_USER, email }
        setUser(loggedInUser)
        localStorage.setItem('fixars_user', JSON.stringify(loggedInUser))
        setIsLoading(false)
        return loggedInUser
    }

    const signup = async (name, email, password) => {
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 800))

        const newUser = {
            ...MOCK_USER,
            id: 'user-' + Date.now(),
            name,
            email,
            points: 50, // Welcome bonus
            joinedAt: new Date().toISOString()
        }
        setUser(newUser)
        localStorage.setItem('fixars_user', JSON.stringify(newUser))
        setIsLoading(false)
        return newUser
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('fixars_user')
    }

    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates }
        setUser(updatedUser)
        localStorage.setItem('fixars_user', JSON.stringify(updatedUser))
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            signup,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
