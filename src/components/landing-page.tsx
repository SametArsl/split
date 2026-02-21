"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/context/language-context'
import { WalletCards, Zap, Globe, Smartphone, ArrowRight, Users, ShieldCheck, Languages } from 'lucide-react'

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col min-h-[calc(100-64px)] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Abstract Background Orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
        
        <div className="container px-4 mx-auto max-w-6xl text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {t('landing.hero_title')}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {t('landing.hero_subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-blue-500/20 gap-2">
                {t('landing.get_started')}
                <ArrowRight size={20} />
              </Button>
            </Link>
            <Link href="/groups">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-2">
                {t('landing.continue_guest')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-500">
        <div className="container px-4 mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-foreground tracking-tight">
            {t('landing.features_title')}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-orange-500" />}
              title={t('landing.feat_1_title')}
              description={t('landing.feat_1_desc')}
            />
            <FeatureCard 
              icon={<Globe className="text-blue-500" />}
              title={t('landing.feat_2_title')}
              description={t('landing.feat_2_desc')}
            />
            <FeatureCard 
              icon={<Users className="text-emerald-500" />}
              title={t('landing.feat_3_title')}
              description={t('landing.feat_3_desc')}
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-indigo-500" />}
              title={t('landing.feat_4_title')}
              description={t('landing.feat_4_desc')}
            />
            <FeatureCard 
              icon={<Languages className="text-red-500" />}
              title={t('landing.feat_5_title')}
              description={t('landing.feat_5_desc')}
            />
            <FeatureCard 
              icon={<Smartphone className="text-purple-500" />}
              title={t('landing.feat_6_title')}
              description={t('landing.feat_6_desc')}
            />
          </div>
        </div>
      </section>

      {/* Footer-ish preview */}
      <section className="py-20">
        <div className="container px-4 mx-auto max-w-4xl text-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                <h3 className="text-3xl font-bold mb-4 relative z-10">Ready to split?</h3>
                <p className="opacity-90 mb-8 max-w-md mx-auto relative z-10">Start managing your group expenses like a pro today. It's free and always will be.</p>
                <Link href="/register">
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-slate-100 h-14 px-10 rounded-xl font-bold text-lg relative z-10 group-hover:scale-105 transition-transform">
                        Join SplitApp Now
                    </Button>
                </Link>
            </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-background border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
