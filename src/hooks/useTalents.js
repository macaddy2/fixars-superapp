import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

// Mock data for development when Supabase is not configured
const MOCK_TALENTS = [
    {
        id: 'talent-001',
        user_id: 'user-008',
        display_name: 'Jessica Lee',
        avatar_url: null,
        bio: 'Full-stack developer with 8 years of experience in React, Node, and cloud architecture.',
        skills: [
            { id: 's1', name: 'React', level: 'expert', verified: true },
            { id: 's2', name: 'Node.js', level: 'expert', verified: true },
            { id: 's3', name: 'AWS', level: 'advanced', verified: true },
            { id: 's4', name: 'TypeScript', level: 'advanced', verified: false }
        ],
        availability: 'part-time',
        hourly_rate: 95,
        rating: 4.9,
        review_count: 28,
        completed_projects: 34,
        portfolio: ['Full-stack SaaS platform', 'E-commerce rebuild', 'Real-time collaboration tool']
    },
    {
        id: 'talent-002',
        user_id: 'user-009',
        display_name: 'Michael Torres',
        avatar_url: null,
        bio: 'UI/UX designer passionate about creating intuitive and beautiful digital experiences.',
        skills: [
            { id: 's5', name: 'UI Design', level: 'expert', verified: true },
            { id: 's6', name: 'UX Research', level: 'advanced', verified: true },
            { id: 's7', name: 'Figma', level: 'expert', verified: true },
            { id: 's8', name: 'Prototyping', level: 'advanced', verified: false }
        ],
        availability: 'full-time',
        hourly_rate: 75,
        rating: 4.8,
        review_count: 19,
        completed_projects: 23,
        portfolio: ['FinTech app redesign', 'E-learning platform', 'Healthcare dashboard']
    },
    {
        id: 'talent-003',
        user_id: 'user-010',
        display_name: 'Anna Kowalski',
        avatar_url: null,
        bio: 'Marketing strategist specializing in growth hacking and community building for startups.',
        skills: [
            { id: 's9', name: 'Growth Marketing', level: 'expert', verified: true },
            { id: 's10', name: 'Community Building', level: 'expert', verified: true },
            { id: 's11', name: 'Content Strategy', level: 'advanced', verified: false },
            { id: 's12', name: 'Analytics', level: 'intermediate', verified: false }
        ],
        availability: 'part-time',
        hourly_rate: 85,
        rating: 4.7,
        review_count: 15,
        completed_projects: 18,
        portfolio: ['0 to 50K users campaign', 'Community launch strategy', 'Viral content series']
    }
]

export function useTalents(options = {}) {
    const { search = '', availability = 'all', skillFilter = '' } = options

    const [talents, setTalents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchTalents = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            if (!isSupabaseConfigured()) {
                // Use mock data
                let filtered = [...MOCK_TALENTS]

                if (search) {
                    const searchLower = search.toLowerCase()
                    filtered = filtered.filter(t =>
                        t.display_name.toLowerCase().includes(searchLower) ||
                        t.bio.toLowerCase().includes(searchLower) ||
                        t.skills.some(s => s.name.toLowerCase().includes(searchLower))
                    )
                }

                if (availability !== 'all') {
                    filtered = filtered.filter(t => t.availability === availability)
                }

                if (skillFilter) {
                    filtered = filtered.filter(t =>
                        t.skills.some(s => s.name.toLowerCase().includes(skillFilter.toLowerCase()))
                    )
                }

                setTalents(filtered)
                setLoading(false)
                return
            }

            // Fetch from Supabase
            let query = supabase
                .from(TABLES.TALENTS)
                .select(`
          *,
          profiles!inner (display_name, avatar_url, bio),
          skills (id, name, level, verified)
        `)
                .eq('is_active', true)

            if (availability !== 'all') {
                query = query.eq('availability', availability)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            // Transform data to match expected format
            let transformed = data.map(t => ({
                id: t.id,
                user_id: t.user_id,
                display_name: t.profiles.display_name,
                avatar_url: t.profiles.avatar_url,
                bio: t.profiles.bio,
                skills: t.skills || [],
                availability: t.availability,
                hourly_rate: parseFloat(t.hourly_rate),
                rating: parseFloat(t.rating),
                review_count: t.review_count,
                completed_projects: t.completed_projects,
                portfolio: t.portfolio || []
            }))

            // Apply client-side filters
            if (search) {
                const searchLower = search.toLowerCase()
                transformed = transformed.filter(t =>
                    t.display_name.toLowerCase().includes(searchLower) ||
                    t.bio?.toLowerCase().includes(searchLower) ||
                    t.skills.some(s => s.name.toLowerCase().includes(searchLower))
                )
            }

            if (skillFilter) {
                transformed = transformed.filter(t =>
                    t.skills.some(s => s.name.toLowerCase().includes(skillFilter.toLowerCase()))
                )
            }

            setTalents(transformed)
        } catch (err) {
            console.error('Error fetching talents:', err)
            setError(err.message)
            // Fallback to mock data on error
            setTalents(MOCK_TALENTS)
        } finally {
            setLoading(false)
        }
    }, [search, availability, skillFilter])

    useEffect(() => {
        fetchTalents()
    }, [fetchTalents])

    // Real-time subscription
    useEffect(() => {
        if (!isSupabaseConfigured()) return

        const subscription = supabase
            .channel('talents-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: TABLES.TALENTS },
                () => fetchTalents()
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchTalents])

    return { talents, loading, error, refetch: fetchTalents }
}

export function useTalent(talentId) {
    const [talent, setTalent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!talentId) {
            setLoading(false)
            return
        }

        const fetchTalent = async () => {
            setLoading(true)
            setError(null)

            try {
                if (!isSupabaseConfigured()) {
                    const mockTalent = MOCK_TALENTS.find(t => t.id === talentId)
                    setTalent(mockTalent || null)
                    setLoading(false)
                    return
                }

                const { data, error: fetchError } = await supabase
                    .from(TABLES.TALENTS)
                    .select(`
            *,
            profiles!inner (display_name, avatar_url, bio, email),
            skills (id, name, level, verified, verified_at)
          `)
                    .eq('id', talentId)
                    .single()

                if (fetchError) throw fetchError

                setTalent({
                    id: data.id,
                    user_id: data.user_id,
                    display_name: data.profiles.display_name,
                    email: data.profiles.email,
                    avatar_url: data.profiles.avatar_url,
                    bio: data.profiles.bio,
                    skills: data.skills || [],
                    availability: data.availability,
                    hourly_rate: parseFloat(data.hourly_rate),
                    rating: parseFloat(data.rating),
                    review_count: data.review_count,
                    completed_projects: data.completed_projects,
                    portfolio: data.portfolio || []
                })
            } catch (err) {
                console.error('Error fetching talent:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchTalent()
    }, [talentId])

    return { talent, loading, error }
}

export function useMyTalentProfile() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchProfile = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setProfile(null)
                setLoading(false)
                return
            }

            const { data, error: fetchError } = await supabase
                .from(TABLES.TALENTS)
                .select(`
          *,
          skills (id, name, level, verified)
        `)
                .eq('user_id', user.id)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError
            }

            setProfile(data || null)
        } catch (err) {
            console.error('Error fetching my talent profile:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const createProfile = async (profileData) => {
        if (!isSupabaseConfigured()) return { error: 'Supabase not configured' }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const { data, error } = await supabase
            .from(TABLES.TALENTS)
            .insert({ user_id: user.id, ...profileData })
            .select()
            .single()

        if (!error) {
            setProfile(data)
        }

        return { data, error }
    }

    const updateProfile = async (updates) => {
        if (!isSupabaseConfigured() || !profile) return { error: 'Cannot update' }

        const { data, error } = await supabase
            .from(TABLES.TALENTS)
            .update(updates)
            .eq('id', profile.id)
            .select()
            .single()

        if (!error) {
            setProfile(data)
        }

        return { data, error }
    }

    return {
        profile,
        loading,
        error,
        createProfile,
        updateProfile,
        refetch: fetchProfile
    }
}
