import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Info, Building2, Globe } from 'lucide-react';

const GeoTargeting = () => {
    const { country, t, geoSettings, saveGeoSettings, pricingData } = useApp();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const circleInstance = useRef(null);
    const markerInstance = useRef(null);

    const [settings, setSettings] = useState(geoSettings);
    const [stats, setStats] = useState({ reach: 0, area: 0 });

    const milesToMeters = (miles) => miles * 1609.34;
    const filteredStates = pricingData.states.filter(s => s.countryCode === country) || [];

    const calculateStats = (radius) => {
        const area = Math.PI * radius * radius;
        const reach = Math.floor(area * 35);
        return { area: Math.floor(area), reach };
    };

    useEffect(() => {
        setSettings(geoSettings);
    }, [geoSettings]);

    useEffect(() => {
        const loadLeaflet = async () => {
            if (!window.L) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);

                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.onload = initMap;
                document.body.appendChild(script);
            } else {
                initMap();
            }
        };

        if (settings.coverageArea === 'radius') {
            loadLeaflet();
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [settings.coverageArea]);

    const initMap = () => {
        if (mapRef.current && !mapInstance.current && window.L && settings.coverageArea === 'radius') {
            mapInstance.current = window.L.map(mapRef.current).setView([settings.lat, settings.lng], 10);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            markerInstance.current = window.L.marker([settings.lat, settings.lng]).addTo(mapInstance.current)
                .bindPopup(t('geo.target_center'));

            circleInstance.current = window.L.circle([settings.lat, settings.lng], {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                radius: milesToMeters(settings.radius),
                weight: 2
            }).addTo(mapInstance.current);

            const popupContent = `${t('geo.radius')}: ${settings.radius} ${t('geo.miles')}`;
            circleInstance.current.bindPopup(popupContent);

            circleInstance.current.on('mouseover', function () {
                this.setStyle({ fillOpacity: 0.35, weight: 3 });
                this.openPopup();
            });
            circleInstance.current.on('mouseout', function () {
                this.setStyle({ fillOpacity: 0.15, weight: 2 });
            });

            setStats(calculateStats(settings.radius));
        }
    };

    useEffect(() => {
        if (mapInstance.current && window.L && circleInstance.current && settings.coverageArea === 'radius') {
            const radiusMeters = milesToMeters(settings.radius);
            circleInstance.current.setRadius(radiusMeters);
            circleInstance.current.setLatLng([settings.lat, settings.lng]);

            const popupContent = `${t('geo.radius')}: ${settings.radius} ${t('geo.miles')}`;
            circleInstance.current.setPopupContent(popupContent);

            if (markerInstance.current) {
                markerInstance.current.setLatLng([settings.lat, settings.lng]);
            }

            mapInstance.current.setView([settings.lat, settings.lng]);
            mapInstance.current.fitBounds(circleInstance.current.getBounds());
            setStats(calculateStats(settings.radius));
        }
    }, [settings.radius, settings.lat, settings.lng, settings.coverageArea, t]);

    const handlePostcodeSearch = () => {
        if (!settings.postcode) return;
        const isoCode = country?.toLowerCase() || 'us';
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(settings.postcode)}&countrycodes=${isoCode}&limit=1`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const match = data[0];
                    setSettings(prev => ({
                        ...prev,
                        lat: parseFloat(match.lat),
                        lng: parseFloat(match.lon),
                        addressLabel: match.display_name.split(',').slice(0, 2).join(',') // e.g. "Sydney, AU"
                    }));
                } else {
                    alert(t('geo.not_found'));
                }
            })
            .catch(err => {
                console.error(err);
                alert(t('geo.service_unavailable'));
            });
    };

    const coverageOptions = [
        { id: 'radius', label: 'Custom / Radius', icon: MapPin },
        { id: 'state', label: t('campaign.state_wide'), icon: Building2 },
        { id: 'national', label: t('campaign.national'), icon: Globe }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                    {t('geo.title')}
                </h1>
                <p className="text-slate-400 mt-1 text-sm sm:text-base font-medium">{t('geo.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-8 h-fit">

                    {/* 1. Coverage Area Selector */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">{t('campaign.geo_target')}</h2>
                        <div className="grid grid-cols-1 gap-2">
                            {coverageOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSettings(p => ({ ...p, coverageArea: opt.id }))}
                                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black transition-all border-2 ${settings.coverageArea === opt.id
                                        ? 'bg-primary/10 border-primary text-primary-light shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                                        }`}
                                >
                                    <opt.icon size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {settings.coverageArea === 'radius' && (
                        <>
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                    <MapPin size={16} className="text-primary" />
                                    {t('geo.location')}
                                </h2>
                                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500 transition-all"
                                        placeholder={t('geo.placeholder')}
                                        value={settings.postcode}
                                        onChange={(e) => setSettings(p => ({ ...p, postcode: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePostcodeSearch()}
                                    />
                                    <button
                                        onClick={handlePostcodeSearch}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 active:scale-95 group"
                                    >
                                        <Navigation size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-sm font-bold text-slate-100">{t('geo.radius')}</h2>
                                    <span className="text-primary-light font-black bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-sm shadow-sm">
                                        {settings.radius} {t('geo.miles')}
                                    </span>
                                </div>
                                <input
                                    type="range" min="5" max="100"
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    value={settings.radius}
                                    onChange={(e) => setSettings(p => ({ ...p, radius: parseInt(e.target.value) }))}
                                />
                                <div className="flex justify-between text-xs text-white font-black uppercase tracking-widest pt-1">
                                    <span className="bg-slate-900/50 px-2 py-0.5 rounded">5 {t('geo.mi')}</span>
                                    <span className="bg-slate-900/50 px-2 py-0.5 rounded">100 {t('geo.mi')}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {settings.coverageArea === 'state' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                <Building2 size={16} className="text-primary" />
                                {t('campaign.select_region')}
                            </h2>
                            <select
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-primary/50"
                                value={settings.targetState}
                                onChange={(e) => setSettings(p => ({ ...p, targetState: e.target.value }))}
                            >
                                <option value="">Select a State</option>
                                {filteredStates.map(s => <option key={s.name} value={s.name} className="bg-[#0f172a]">{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-white text-center space-y-6">
                        <div>
                            <p className="text-slate-300 text-[10px] uppercase tracking-widest font-black mb-1.5">{t('geo.est_reach')}</p>
                            <p className="text-4xl font-black text-primary-light drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                {settings.coverageArea === 'national' ? '1,250,000' : (settings.coverageArea === 'state' ? '450,000' : stats.reach.toLocaleString())}
                            </p>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">{t('geo.users')}</p>
                        </div>
                    </div>

                    <button className="w-full py-4 premium-btn rounded-2xl font-black shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] italic uppercase tracking-widest"
                        onClick={() => saveGeoSettings(settings)}>
                        {t('geo.apply')}
                    </button>
                </div>

                <div className="lg:col-span-2 h-[400px] md:h-[700px] bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800 shadow-sm relative">
                    {settings.coverageArea === 'radius' ? (
                        <div id="map" ref={mapRef} className="w-full h-full z-0" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    {settings.coverageArea === 'state' ? <Building2 size={40} className="text-primary" /> : <Globe size={40} className="text-primary" />}
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                                    {settings.coverageArea === 'state' ? `Targeting ${settings.targetState || 'Region'}` : 'Full National Targeting'}
                                </h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                    Map configuration is only required for custom local mapping. {settings.coverageArea === 'state' ? 'State-wide' : 'National'} targeting covers the entire area.
                                </p>
                            </div>
                        </div>
                    )}

                    {settings.coverageArea === 'radius' && (
                        <div className="absolute top-4 left-10 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg text-[10px] md:text-xs font-medium text-slate-300 shadow-sm border border-slate-700 flex items-center gap-2 z-[1000]">
                            <Info size={14} className="text-primary-light" />
                            <span>Drag the map or enter a postcode to move the target area.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeoTargeting;
