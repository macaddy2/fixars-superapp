import { AppList } from '@/components/AppCard'

export default function Apps() {
    return (
        <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">All Apps</h1>
                    <p className="text-muted">
                        Explore the interconnected Fixars ecosystem. Each app shares your profile, points, and data seamlessly.
                    </p>
                </div>

                <AppList showAll />
            </div>
        </main>
    )
}
