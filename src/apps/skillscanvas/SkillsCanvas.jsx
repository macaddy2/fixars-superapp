import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTalents } from '@/hooks/useTalents'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, formatNumber } from '@/lib/utils'
import {
    Palette,
    Search,
    Star,
    CheckCircle,
    DollarSign,
    Briefcase,
    MessageSquare,
    Plus,
    Loader2,
    AlertCircle,
    RefreshCw
} from 'lucide-react'

const SKILL_LEVELS = {
    expert: { label: 'Expert', color: 'success' },
    advanced: { label: 'Advanced', color: 'warning' },
    intermediate: { label: 'Intermediate', color: 'default' },
    beginner: { label: 'Beginner', color: 'secondary' }
}

function TalentCard({ talent, onContact }) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="h-1.5 gradient-skillscanvas" />
            <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-14 h-14">
                        <AvatarFallback className="text-lg">{getInitials(talent.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{talent.display_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-warning">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-medium">{talent.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                            <span className="text-sm text-muted">({talent.review_count || 0} reviews)</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-muted mb-4 line-clamp-2">{talent.bio}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {talent.skills?.slice(0, 3).map(skill => (
                        <Badge
                            key={skill.id || skill.name}
                            variant={SKILL_LEVELS[skill.level]?.color || 'secondary'}
                            className="text-xs"
                        >
                            {skill.verified && <CheckCircle className="w-3 h-3 mr-1" />}
                            {skill.name}
                        </Badge>
                    ))}
                    {talent.skills?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                            +{talent.skills.length - 3} more
                        </Badge>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted mb-4">
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${talent.hourly_rate || 0}/hr
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {talent.completed_projects || 0} projects
                    </div>
                    <Badge
                        variant={
                            talent.availability === 'full-time' ? 'success' :
                                talent.availability === 'part-time' ? 'warning' : 'secondary'
                        }
                        className="text-xs ml-auto"
                    >
                        {talent.availability || 'unavailable'}
                    </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="skillscanvas"
                        className="flex-1"
                        onClick={() => onContact?.(talent)}
                    >
                        <MessageSquare className="w-4 h-4 mr-1" /> Contact
                    </Button>
                    <Button variant="outline">
                        View Profile
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function LoadingState() {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="h-1.5 bg-muted" />
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-muted" />
                            <div className="flex-1">
                                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                        <div className="h-10 bg-muted rounded mb-4" />
                        <div className="flex gap-2 mb-4">
                            <div className="h-6 w-16 bg-muted rounded-full" />
                            <div className="h-6 w-20 bg-muted rounded-full" />
                            <div className="h-6 w-14 bg-muted rounded-full" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 flex-1 bg-muted rounded" />
                            <div className="h-10 w-24 bg-muted rounded" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function ErrorState({ error, onRetry }) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Error loading talents</p>
                <p className="text-muted mb-4">{error}</p>
                <Button onClick={onRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
            </CardContent>
        </Card>
    )
}

export default function SkillsCanvas() {
    const { isAuthenticated } = useAuth()
    const [search, setSearch] = useState('')
    const [availability, setAvailability] = useState('all')

    const { talents, loading, error, refetch } = useTalents({
        search,
        availability
    })

    const handleContact = (talent) => {
        // In a real app, this would open a contact modal or navigate to messages
        console.log('Contact talent:', talent.display_name)
        alert(`Contact form for ${talent.display_name} - Coming soon!`)
    }

    // Calculate stats
    const totalTalents = talents.length
    const avgRate = talents.length > 0
        ? Math.round(talents.reduce((sum, t) => sum + (t.hourly_rate || 0), 0) / talents.length)
        : 0
    const verifiedSkills = talents.reduce((sum, t) =>
        sum + (t.skills?.filter(s => s.verified)?.length || 0), 0
    )
    const totalProjects = talents.reduce((sum, t) => sum + (t.completed_projects || 0), 0)

    return (
        <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl gradient-skillscanvas flex items-center justify-center">
                                <Palette className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">SkillsCanvas</h1>
                        </div>
                        <p className="text-muted">The ultimate skills and talent hub. Find or summon the right people.</p>
                    </div>

                    {isAuthenticated && (
                        <Button variant="skillscanvas" size="lg">
                            <Plus className="w-4 h-4 mr-2" /> List Your Skills
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid sm:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">{totalTalents}</p>
                            <p className="text-sm text-muted">Talents</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">${avgRate}</p>
                            <p className="text-sm text-muted">Avg Hourly Rate</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-success">{verifiedSkills}</p>
                            <p className="text-sm text-muted">Verified Skills</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">{formatNumber(totalProjects)}</p>
                            <p className="text-sm text-muted">Projects Done</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <Input
                            placeholder="Search talents or skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Tabs value={availability} onValueChange={setAvailability}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="full-time">Full-time</TabsTrigger>
                            <TabsTrigger value="part-time">Part-time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState error={error} onRetry={refetch} />
                ) : talents.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {talents.map((talent, i) => (
                            <div
                                key={talent.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <TalentCard talent={talent} onContact={handleContact} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Palette className="w-12 h-12 text-muted mx-auto mb-4" />
                            <p className="text-lg font-medium text-foreground mb-2">No talents found</p>
                            <p className="text-muted">Try adjusting your search or filters</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    )
}
