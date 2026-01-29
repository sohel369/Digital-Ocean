import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Info, Building2, Globe } from 'lucide-react';
import Dropdown from '../components/Dropdown';

const GeoTargeting = () => {
    const { country, t, geoSettings, saveGeoSettings, pricingData, loadRegionsForCountry } = useApp();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const circleInstance = useRef(null);
    const markerInstance = useRef(null);

    const [settings, setSettings] = useState(geoSettings);
    const [stats, setStats] = useState({ reach: 0, area: 0 });

    const milesToMeters = (miles) => miles * 1609.34;

    const calculateStats = (radius) => {
        const area = Math.PI * radius * radius;
        const reach = Math.floor(area * 35);
        return { area: Math.floor(area), reach };
    };
    useEffect(() => {
        setSettings(geoSettings);
    }, [geoSettings]);

    // Ensure regions are loaded for the current country if missing
    useEffect(() => {
        const hasRegions = pricingData.states.some(s => s.countryCode === country);
        if (!hasRegions && country) {
            console.log(`🔍 GeoTargeting: Missing regions for ${country}, loading...`);
            loadRegionsForCountry(country);
        }
    }, [country, pricingData.states.length]);

    const filteredStates = (pricingData.states || [])
        .filter(s => String(s.countryCode || '').toUpperCase() === String(country || '').toUpperCase())
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')) || [];

    // Detailed debug logs for Railway troubleshooting
    useEffect(() => {
        if (filteredStates.length > 0) {
            console.log(`🗺️ GeoTargeting: ${filteredStates.length} states found for ${country}. Displaying first 3:`,
                filteredStates.slice(0, 3).map(s => s.name));
        } else if (country) {
            console.warn(`⚠️ GeoTargeting: No states found for country ${country}. Active country code is: "${country}"`);
        }
    }, [filteredStates.length, country]);

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

            // Make marker draggable
            markerInstance.current = window.L.marker([settings.lat, settings.lng], { draggable: true }).addTo(mapInstance.current)
                .bindPopup(t('geo.target_center'));

            // Handle Drag End
            markerInstance.current.on('dragend', function (event) {
                const marker = event.target;
                const position = marker.getLatLng();
                setSettings(prev => ({
                    ...prev,
                    lat: position.lat,
                    lng: position.lng
                }));
                // Update circle and view
                circleInstance.current.setLatLng(position);
                mapInstance.current.panTo(position);
            });

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

            // Map Click to Move Marker
            mapInstance.current.on('click', function (e) {
                const { lat, lng } = e.latlng;
                setSettings(prev => ({
                    ...prev,
                    lat: lat,
                    lng: lng
                }));
            });
        }
    };

    // Reset settings when country changes
    useEffect(() => {
        if (country && settings.country !== country) {
            // Attempt to find a default state or capital for the country
            // For now, we rely on the user or a geocoding fetch. 
            // Trigerring a search for the country name to center map.
            const isoCode = country.toLowerCase();
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}&limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setSettings(prev => ({
                            ...prev,
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon),
                            addressLabel: data[0].display_name.split(',')[0],
                            country: country
                        }));
                    }
                })
                .catch(console.error);
        }
    }, [country]);

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                        {t('geo.title')}
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base font-medium">{t('geo.subtitle')}</p>
                </div>
                {geoSettings.lastUpdated ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Live & Real Data Synchronized
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.1)]" title="Activates on launch">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Geo Status: Pending Activation
                    </div>
                )}
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
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                                        }`}
                                >
                                    <opt.icon size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Radius & Location (Hidden if not 'radius') */}
                    <div className={`space-y-8 transition-all duration-300 ${settings.coverageArea !== 'radius' ? 'hidden' : 'animate-in fade-in slide-in-from-top-2'}`}>
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-500" />
                                {t('geo.location')}
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                                <input
                                    type="text"
                                    disabled={settings.coverageArea !== 'radius'}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-500 transition-all font-bold"
                                    placeholder={t('geo.placeholder')}
                                    value={settings.postcode}
                                    onChange={(e) => setSettings(p => ({ ...p, postcode: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostcodeSearch()}
                                />
                                <button
                                    onClick={handlePostcodeSearch}
                                    disabled={settings.coverageArea !== 'radius'}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/20 active:scale-95 group disabled:bg-slate-800 disabled:text-slate-600"
                                >
                                    <Navigation size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-bold text-slate-100">{t('geo.radius')}</h2>
                                <span className="text-emerald-400 font-black bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-sm shadow-sm font-mono">
                                    {settings.radius} {t('geo.miles')}
                                </span>
                            </div>
                            <input
                                type="range" min="5" max="100"
                                disabled={settings.coverageArea !== 'radius'}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                value={settings.radius}
                                onChange={(e) => setSettings(p => ({ ...p, radius: parseInt(e.target.value) }))}
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest pt-1">
                                <span>5 {t('geo.mi')}</span>
                                <span>100 {t('geo.mi')}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. State selector (Only if state mode) */}
                    <div className={`space-y-4 transition-all duration-300 ${settings.coverageArea !== 'state' ? 'hidden' : 'animate-in slide-in-from-top-2'}`}>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 italic uppercase tracking-tight">
                            <Building2 size={16} className="text-emerald-500" />
                            Select a State
                        </h2>

                        <Dropdown
                            label="Choose your region..."
                            options={filteredStates.map(s => ({
                                value: s.name,
                                label: s.name
                            }))}
                            value={settings.targetState}
                            onChange={(val) => setSettings(p => ({ ...p, targetState: val }))}
                            className="w-full relative z-[50]"
                            menuWidth="w-full"
                        />
                    </div>

                    {/* Stats Result (Reach/Population) */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-white text-center space-y-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div>
                            <p className="text-emerald-400 text-[10px] uppercase tracking-[0.2em] font-black mb-2 opacity-80">ESTIMATED POPULATION</p>
                            <p className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] italic tracking-tighter">
                                {(() => {
                                    if (settings.coverageArea === 'national') {
                                        const total = pricingData.states
                                            .filter(s => s.countryCode === country)
                                            .reduce((sum, s) => sum + (s.population || 0), 0);
                                        return total.toLocaleString();
                                    }
                                    if (settings.coverageArea === 'state') {
                                        const state = pricingData.states.find(s => s.name === settings.targetState);
                                        return (state?.population || 0).toLocaleString();
                                    }
                                    return (stats.reach || 0).toLocaleString();
                                })()}
                            </p>
                        </div>

                        {/* Attribution Note */}
                        <div className="pt-4 border-t border-white/5 opacity-40 group-hover:opacity-100 transition-all text-left">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.1em] leading-relaxed">
                                Authority Source: OpenStreetMap & Nominatim<br />
                                Calculated Density: Rule 7 Global Matrix
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full py-4 premium-btn-green rounded-2xl font-black shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] italic uppercase tracking-widest"
                            onClick={() => saveGeoSettings(settings)}>
                            {t('geo.apply')}
                        </button>
                        <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest opacity-60">
                            Confirm: These settings will sync with all campaigns immediately.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 h-[400px] md:h-[700px] bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800 shadow-sm relative">
                    {settings.coverageArea === 'radius' ? (
                        <div id="map" ref={mapRef} className="w-full h-full z-0" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                    {settings.coverageArea === 'state' ? <Building2 size={40} className="text-emerald-500" /> : <Globe size={40} className="text-emerald-500" />}
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                                    {settings.coverageArea === 'state' ? `Targeting ${settings.targetState || 'Region'}` : 'Full National Targeting'}
                                </h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">
                                    Dynamic mapping for {settings.coverageArea === 'state' ? 'State-wide' : 'National'} reach is pre-calculated. Local radius inputs are only for precision targeting.
                                </p>
                            </div>
                        </div>
                    )}

                    {settings.coverageArea === 'radius' && (
                        <div className="absolute top-4 left-10 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg text-[10px] md:text-xs font-black text-emerald-400 shadow-xl border border-emerald-500/20 flex items-center gap-2 z-[1000] uppercase tracking-widest italic">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span>Active Map Sequence</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeoTargeting;
