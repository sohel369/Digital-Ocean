import React from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, TrendingUp, DollarSign, Activity, ShoppingCart, Percent } from 'lucide-react';

const MetricCard = ({ title, icon: Icon, children }) => (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon size={48} />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Icon size={20} className="text-primary" />
            {title}
        </h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const BenchmarkRow = ({ industry, value, change, isPositiveGood = true }) => {
    const isGood = isPositiveGood ? change > 0 : change < 0;
    const color = isGood ? 'text-blue-400' : 'text-red-400';
    const bg = isGood ? 'bg-blue-400/10' : 'bg-red-400/10';

    return (
        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-slate-400 font-medium">{industry}</span>
            <div className="flex items-center gap-3">
                {value && <span className="text-slate-200 font-bold">{value}</span>}
                <span className={`text-xs font-black px-1.5 py-0.5 rounded ${color} ${bg}`}>
                    {change > 0 ? '+' : ''}{change}%
                </span>
            </div>
        </div>
    );
};

const FAQ = () => {
    const { t } = useApp();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-7xl mx-auto pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                    Insights & <span className="text-primary">FAQ</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg max-w-2xl">
                    Market intelligence, performance benchmarks, and answers to common questions.
                </p>
            </div>

            {/* FAQ Q1 */}
            <div className="glass-panel rounded-3xl p-8 border-l-4 border-l-primary">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                        <HelpCircle size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white">
                            Why are major brands dedicating more of their budget to offline advertising,
                            given the statistics from triplewhale.com compared to CPM rates of $1.25 to $2.88 for outdoor advertising?
                        </h2>
                        <div className="prose prose-invert text-slate-300 leading-relaxed text-sm md:text-base space-y-4">
                            <p>
                                Recent benchmarks from <a href="https://triplewhale.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">triplewhale.com</a> highlight that the average cost per mille (CPM) for online platforms such as Google Ads has risen noticeably, with sector averages reported at <strong>$14.29</strong> and some verticals—like Electronics and Travel Accessories—seeing increases of over <strong>8% month-over-month</strong>.
                            </p>
                            <p>
                                These higher CPMs reflect growing competition and increased costs to reach audiences online, especially around peak shopping seasons. In contrast, outdoor advertising typically offers CPM rates in the range of <strong>$1.25 to $2.88</strong>, presenting a significantly more cost-effective way to achieve broad visibility.
                            </p>
                            <p>
                                Major brands are responding to these trends by allocating more of their budget towards offline channels, such as outdoor advertising, to maximise reach and manage costs. The lower CPMs associated with outdoor placements allow brands to connect with large audiences at a fraction of the cost of digital campaigns, while also providing premium, high-impact exposure in key locations. This strategic shift helps protect brands from online auction price inflation and ensures consistent audience engagement, especially as digital ad costs and competition continue to climb.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-8 border-l-4 border-l-blue-500">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                        <HelpCircle size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white">
                            What extra benefits do I get when booking B2B adverts?
                        </h2>
                        <div className="prose prose-invert text-slate-300 leading-relaxed text-sm md:text-base space-y-4">
                            <p>
                                When you book a B2B advert, your business is rewarded with complimentary placement on our associated B2C site, maximising your audience reach at no additional cost. Your B2C advert is supercharged for viral exposure thanks to our Luxury Sweepstake prize promotions, and the Gotta Scan them All™ Promotion, driving heightened engagement and expanding brand awareness among consumers. This dual-platform approach helps you connect with key decision-makers and everyday shoppers alike, giving your campaign greater value and visibility.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 9: Ad Delivery Guarantee Explanation */}
            <div className="glass-panel rounded-3xl p-8 border-l-4 border-l-indigo-500">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                        <HelpCircle size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white">
                            How do you guarantee Ad Delivery and Performance?
                        </h2>
                        <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
                            <p>
                                We utilize a multi-layered verification and delivery system to ensure your campaigns reach the right audience efficiently:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong className="text-white">Geo-Locked Serving:</strong> Our ad server strictly enforces geographic boundaries. Campaigns configured for a specific 30-mile radius or state are technically restricted to serve only to IP addresses and device locations within that zone.
                                </li>
                                <li>
                                    <strong className="text-white">Format Validation:</strong> All creatives undergo automated dimension and file-size checks before going live. This prevents layout breakage and ensures your brand looks professional across all devices (Desktop, Mobile, Tablet).
                                </li>
                                <li>
                                    <strong className="text-white">Smart CDN & Caching:</strong> We use a global Content Delivery Network (CDN) to serve ad assets from the server closest to the user, minimizing load times and maximizing viewability rates.
                                </li>
                                <li>
                                    <strong className="text-white">Campaign Approval Flow:</strong> Every campaign is reviewed for compliance and quality assurance before activation. This manual oversight acts as a final safeguard to protect your brand reputation.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benchmarks Section */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">
                        Monthly Benchmarks <span className="text-slate-500 text-lg not-italic normal-case font-medium ml-2">- October 2025 (Google Ads)</span>
                    </h2>
                    <p className="text-slate-400 text-sm max-w-3xl">
                        Analysis of over 10,000 brands showing vertical-specific trends. October 2025 data reveals a steady and balanced month for Google Ads performance.
                        The ecosystem continues to show signs of health and stability — advertisers are spending more, reaching more of the population, and maintaining efficiency despite slight shifts in conversion dynamics.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* MER */}
                    <MetricCard title="Marketing Efficiency Ratio (MER)" icon={Activity}>
                        <p className="text-xs text-slate-500 mb-2">Efficiency of ad spend revenue. Pets & Animals led with sharp gains.</p>
                        <BenchmarkRow industry="Pets & Animals" change={9.04} />
                        <BenchmarkRow industry="Lifestyle & Boutique" change={5.52} />
                        <BenchmarkRow industry="Travel Accessories" change={5.18} />
                        <BenchmarkRow industry="Media & Publishing" change={-6.67} isPositiveGood={true} />
                        <BenchmarkRow industry="Automotive" change={-4.01} isPositiveGood={true} />
                    </MetricCard>

                    {/* CPM */}
                    <MetricCard title="Cost Per Mille (CPM)" icon={DollarSign}>
                        <p className="text-xs text-slate-500 mb-2">Cost per 1,000 impressions. Rose modestly across most sectors.</p>
                        <BenchmarkRow industry="Electronics" change={8.17} isPositiveGood={false} />
                        <BenchmarkRow industry="Travel Accessories" change={7.47} isPositiveGood={false} />
                        <BenchmarkRow industry="Books & Music" change={5.97} isPositiveGood={false} />
                        <BenchmarkRow industry="Toys & Collectibles" change={4.50} isPositiveGood={false} />
                        <BenchmarkRow industry="Media & Publishing" change={-6.86} isPositiveGood={false} />
                    </MetricCard>

                    {/* CTR */}
                    <MetricCard title="Click-Through Rate (CTR)" icon={TrendingUp}>
                        <p className="text-xs text-slate-500 mb-2">Ad relevance. Electronics saw standout increases.</p>
                        <BenchmarkRow industry="Electronics" change={12.25} />
                        <BenchmarkRow industry="Travel Accessories" change={6.73} />
                        <BenchmarkRow industry="Sports" change={6.28} />
                        <BenchmarkRow industry="Pets" change={6.26} />
                        <BenchmarkRow industry="Books & Music" change={-1.16} />
                    </MetricCard>

                    {/* CVR */}
                    <MetricCard title="Conversion Rate (CVR)" icon={Percent}>
                        <p className="text-xs text-slate-500 mb-2">Percentage of clicks leading to purchase. Softened across verticals.</p>
                        <BenchmarkRow industry="Electronics" change={-12.29} />
                        <BenchmarkRow industry="Media & Publishing" change={-10.54} />
                        <BenchmarkRow industry="E-learning" change={-9.86} />
                    </MetricCard>

                    {/* CPA */}
                    <MetricCard title="Cost Per Acquisition (CPA)" icon={ShoppingCart}>
                        <p className="text-xs text-slate-500 mb-2">Cost to acquire a customer. Electronics jumped significantly.</p>
                        <BenchmarkRow industry="Electronics" change={14.66} isPositiveGood={false} />
                        <BenchmarkRow industry="E-learning" change={12.01} isPositiveGood={false} />
                        <BenchmarkRow industry="Books & Music" change={5.84} isPositiveGood={false} />
                    </MetricCard>

                    {/* ROAS */}
                    <MetricCard title="Return on Ad Spend (ROAS)" icon={TrendingUp}>
                        <p className="text-xs text-slate-500 mb-2">Revenue per dollar spent. Largely steady.</p>
                        <BenchmarkRow industry="Media & Publishing" change={7.27} />
                        <BenchmarkRow industry="Lifestyle" change={6.05} />
                        <BenchmarkRow industry="Baby" change={2.51} />
                        <BenchmarkRow industry="Travel Accessories" change={-6.32} />
                        <BenchmarkRow industry="Electronics" change={-5.49} />
                    </MetricCard>
                </div>

                <div className="glass-panel p-6 rounded-2xl bg-blue-900/10 border-blue-500/20 mt-8">
                    <h3 className="text-lg font-bold text-white mb-2">Conclusion</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Overall, October’s data indicates a stable but competitive environment. Advertisers spent more and gained broader reach, yet conversion efficiency softened slightly, keeping ROAS largely level. These Google benchmarks provide a crucial reference for brands to optimize their ad strategies.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
