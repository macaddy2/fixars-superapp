import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

// Mock reviews for development
const MOCK_REVIEWS = {
    'talent-001': [
        {
            id: 'rev-001',
            talent_id: 'talent-001',
            reviewer_name: 'Alex Morgan',
            rating: 5,
            content: 'Jessica delivered an exceptional full-stack solution. Her React expertise is top-notch!',
            project_title: 'E-commerce Platform',
            created_at: '2026-01-15T10:00:00Z'
        },
        {
            id: 'rev-002',
            talent_id: 'talent-001',
            reviewer_name: 'Sarah Chen',
            rating: 5,
            content: 'Great communication and delivered ahead of schedule. Highly recommend!',
            project_title: 'SaaS Dashboard',
            created_at: '2026-01-10T14:30:00Z'
        }
    ],
    'talent-002': [
        {
            id: 'rev-003',
            talent_id: 'talent-002',
            reviewer_name: 'Marcus Williams',
            rating: 5,
            content: 'Michael transformed our app UX completely. Users love the new design!',
            project_title: 'Mobile App Redesign',
            created_at: '2026-01-12T09:00:00Z'
        }
    ],
    'talent-003': [
        {
            id: 'rev-004',
            talent_id: 'talent-003',
            reviewer_name: 'Emily Rodriguez',
            rating: 4,
            content: 'Anna helped us grow from 0 to 10K users in 3 months. Amazing growth strategies!',
            project_title: 'Product Launch Campaign',
            created_at: '2026-01-08T16:00:00Z'
        }
    ]
}

export function useReviews(talentId) {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })

    const fetchReviews = useCallback(async () => {
        if (!talentId) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            if (!isSupabaseConfigured()) {
                const mockData = MOCK_REVIEWS[talentId] || []
                setReviews(mockData)
                calculateStats(mockData)
                setLoading(false)
                return
            }

            const { data, error: fetchError } = await supabase
                .from(TABLES.REVIEWS)
                .select(`
          *,
          reviewer:profiles!reviewer_id (display_name, avatar_url)
        `)
                .eq('talent_id', talentId)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            const transformed = data.map(r => ({
                id: r.id,
                talent_id: r.talent_id,
                reviewer_name: r.reviewer?.display_name || 'Anonymous',
                reviewer_avatar: r.reviewer?.avatar_url,
                rating: r.rating,
                content: r.content,
                project_title: r.project_title,
                created_at: r.created_at
            }))

            setReviews(transformed)
            calculateStats(transformed)
        } catch (err) {
            console.error('Error fetching reviews:', err)
            setError(err.message)
            // Fallback to mock data
            const mockData = MOCK_REVIEWS[talentId] || []
            setReviews(mockData)
            calculateStats(mockData)
        } finally {
            setLoading(false)
        }
    }, [talentId])

    const calculateStats = (reviewList) => {
        if (reviewList.length === 0) {
            setStats({ average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
            return
        }

        const total = reviewList.length
        const sum = reviewList.reduce((acc, r) => acc + r.rating, 0)
        const average = (sum / total).toFixed(1)

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        reviewList.forEach(r => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1
        })

        setStats({ average: parseFloat(average), total, distribution })
    }

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews])

    const submitReview = async (reviewData) => {
        if (!isSupabaseConfigured()) {
            const newReview = {
                id: 'rev-' + Date.now(),
                talent_id: talentId,
                reviewer_name: 'You',
                ...reviewData,
                created_at: new Date().toISOString()
            }
            setReviews(prev => [newReview, ...prev])
            calculateStats([newReview, ...reviews])
            return { data: newReview, error: null }
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const { data, error } = await supabase
            .from(TABLES.REVIEWS)
            .insert({
                talent_id: talentId,
                reviewer_id: user.id,
                ...reviewData
            })
            .select(`
        *,
        reviewer:profiles!reviewer_id (display_name, avatar_url)
      `)
            .single()

        if (!error) {
            const transformed = {
                id: data.id,
                talent_id: data.talent_id,
                reviewer_name: data.reviewer?.display_name || 'Anonymous',
                reviewer_avatar: data.reviewer?.avatar_url,
                rating: data.rating,
                content: data.content,
                project_title: data.project_title,
                created_at: data.created_at
            }
            setReviews(prev => [transformed, ...prev])
            calculateStats([transformed, ...reviews])
        }

        return { data, error }
    }

    return {
        reviews,
        stats,
        loading,
        error,
        submitReview,
        refetch: fetchReviews
    }
}
