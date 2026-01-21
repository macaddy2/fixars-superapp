import { useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

export function useSkills(talentId) {
    const [skills, setSkills] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchSkills = useCallback(async () => {
        if (!talentId || !isSupabaseConfigured()) return

        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from(TABLES.SKILLS)
                .select('*')
                .eq('talent_id', talentId)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setSkills(data || [])
        } catch (err) {
            console.error('Error fetching skills:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [talentId])

    const addSkill = async (skillData) => {
        if (!isSupabaseConfigured()) {
            // Mock add for development
            const newSkill = {
                id: 'skill-' + Date.now(),
                talent_id: talentId,
                ...skillData,
                verified: false,
                created_at: new Date().toISOString()
            }
            setSkills(prev => [newSkill, ...prev])
            return { data: newSkill, error: null }
        }

        const { data, error } = await supabase
            .from(TABLES.SKILLS)
            .insert({ talent_id: talentId, ...skillData })
            .select()
            .single()

        if (!error) {
            setSkills(prev => [data, ...prev])
        }

        return { data, error }
    }

    const updateSkill = async (skillId, updates) => {
        if (!isSupabaseConfigured()) {
            setSkills(prev => prev.map(s =>
                s.id === skillId ? { ...s, ...updates } : s
            ))
            return { data: { id: skillId, ...updates }, error: null }
        }

        const { data, error } = await supabase
            .from(TABLES.SKILLS)
            .update(updates)
            .eq('id', skillId)
            .select()
            .single()

        if (!error) {
            setSkills(prev => prev.map(s => s.id === skillId ? data : s))
        }

        return { data, error }
    }

    const removeSkill = async (skillId) => {
        if (!isSupabaseConfigured()) {
            setSkills(prev => prev.filter(s => s.id !== skillId))
            return { error: null }
        }

        const { error } = await supabase
            .from(TABLES.SKILLS)
            .delete()
            .eq('id', skillId)

        if (!error) {
            setSkills(prev => prev.filter(s => s.id !== skillId))
        }

        return { error }
    }

    const requestVerification = async (skillId) => {
        // In a real implementation, this would create a verification request
        // For now, we'll just mark it as pending
        console.log('Verification requested for skill:', skillId)
        return { success: true }
    }

    return {
        skills,
        loading,
        error,
        fetchSkills,
        addSkill,
        updateSkill,
        removeSkill,
        requestVerification
    }
}

// Predefined skills for autocomplete
export const SKILL_SUGGESTIONS = [
    // Development
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
    'Python', 'Django', 'Flask', 'Ruby', 'Rails', 'PHP', 'Laravel',
    'Java', 'Spring', 'Go', 'Rust', 'C++', 'C#', '.NET',
    'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',

    // Design
    'UI Design', 'UX Design', 'UX Research', 'Figma', 'Sketch', 'Adobe XD',
    'Photoshop', 'Illustrator', 'After Effects', 'Motion Graphics',
    'Brand Design', 'Logo Design', 'Typography', 'Color Theory',
    'Wireframing', 'Prototyping', 'Design Systems',

    // Marketing
    'Digital Marketing', 'SEO', 'SEM', 'Content Marketing', 'Social Media',
    'Email Marketing', 'Growth Hacking', 'Analytics', 'Google Analytics',
    'Copywriting', 'Content Strategy', 'Brand Strategy',
    'Community Building', 'Influencer Marketing', 'PR',

    // Business
    'Product Management', 'Project Management', 'Agile', 'Scrum',
    'Business Development', 'Sales', 'Customer Success',
    'Strategy', 'Consulting', 'Market Research',
    'Financial Modeling', 'Fundraising', 'Investor Relations',

    // Other
    'Data Science', 'Machine Learning', 'AI', 'Data Analysis',
    'Technical Writing', 'Documentation', 'Translation',
    'Video Production', 'Photography', 'Audio Engineering'
]

export const SKILL_LEVELS = [
    { value: 'beginner', label: 'Beginner', description: 'Learning the basics' },
    { value: 'intermediate', label: 'Intermediate', description: '1-2 years experience' },
    { value: 'advanced', label: 'Advanced', description: '3-5 years experience' },
    { value: 'expert', label: 'Expert', description: '5+ years, industry recognized' }
]
