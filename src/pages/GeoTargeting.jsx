import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Info } from 'lucide-react';

const GeoTargeting = () => {
    const { country, t } = useApp();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const circleInstance = useRef(null);
    const markerInstance = useRef(null);

    const [settings, setSettings] = useState({
        radius: 30, // miles
        lat: 40.7128,
        lng: -74.0060,
        postcode: ''
    });

    const [stats, setStats] = useState({ reach: 0, area: 0 });

    const milesToMeters = (miles) => miles * 1609.34;

    const calculateStats = (radius) => {
        const area = Math.PI * radius * radius;
        // Reduced multiplier for more realistic reach figures (e.g., users per sq mile)
        const reach = Math.floor(area * 35);
        return { area: Math.floor(area), reach };
    };

    useEffect(() => {
        // Dynamically load Leaflet CSS and JS if not already loaded
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

        loadLeaflet();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    const initMap = () => {
        if (mapRef.current && !mapInstance.current && window.L) {
            // Create Map
            mapInstance.current = window.L.map(mapRef.current).setView([settings.lat, settings.lng], 10);

            // Add Tile Layer (OpenStreetMap)
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance.current);

            // Add Marker
            markerInstance.current = window.L.marker([settings.lat, settings.lng]).addTo(mapInstance.current)
                .bindPopup(t('geo.target_center'));

            // Add Circle
            circleInstance.current = window.L.circle([settings.lat, settings.lng], {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                radius: milesToMeters(settings.radius),
                weight: 2
            }).addTo(mapInstance.current);

            // Interactions
            circleInstance.current.on('mouseover', function () {
                this.setStyle({ fillOpacity: 0.35, weight: 3 });
                // Note: Popup content is now managed reactively in the useEffect
                this.openPopup();
            });
            circleInstance.current.on('mouseout', function () {
                this.setStyle({ fillOpacity: 0.15, weight: 2 });
            });

            // Update stats
            setStats(calculateStats(settings.radius));
        }
    };

    useEffect(() => {
        if (mapInstance.current && window.L && circleInstance.current) {
            const radiusMeters = milesToMeters(settings.radius);

            // Update Circle
            circleInstance.current.setRadius(radiusMeters);
            circleInstance.current.setLatLng([settings.lat, settings.lng]);

            // Update Popup capability (unbind old, verify logic)
            // Rebind so next open gets new text
            const popupContent = `${t('geo.radius')}: ${settings.radius} ${t('geo.miles')}`;
            circleInstance.current.unbindPopup();
            circleInstance.current.bindPopup(popupContent);

            // Fixed: Update popup immediately if it's already open (User Request: "display remains showing 30 mile radius")
            if (circleInstance.current.isPopupOpen()) {
                circleInstance.current.setPopupContent(popupContent);
            }

            // Update Marker
            if (markerInstance.current) {
                markerInstance.current.setLatLng([settings.lat, settings.lng]);
            }

            // Pan Map
            mapInstance.current.setView([settings.lat, settings.lng]);

            // Fit Bounds
            mapInstance.current.fitBounds(circleInstance.current.getBounds());

            setStats(calculateStats(settings.radius));
        }
    }, [settings.radius, settings.lat, settings.lng, t]);

    const handlePostcodeSearch = () => {
        if (!settings.postcode) return;

        // Strict Country Validation: Map only to the selected country
        // This ensures 90210 maps to US, and French postcodes map to France.
        const isoCode = country?.toLowerCase() || 'us';

        // Use Nominatim with 'countrycodes' parameter for strict filtering
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(settings.postcode)}&countrycodes=${isoCode}&limit=1`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const match = data[0];
                    setSettings(prev => ({
                        ...prev,
                        lat: parseFloat(match.lat),
                        lng: parseFloat(match.lon)
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                    {t('geo.title')}
                </h1>
                <p className="text-slate-400 mt-1 text-sm sm:text-base font-medium">{t('geo.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Panel */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-8 h-fit">

                    {/* Location Input */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <MapPin size={16} className="text-primary" />
                            {t('geo.location')}
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                            <div className="relative flex-1 group">
                                <input
                                    type="text"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500 transition-all group-hover:bg-slate-900/80"
                                    placeholder={t('geo.placeholder')}
                                    value={settings.postcode}
                                    onChange={(e) => setSettings(p => ({ ...p, postcode: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostcodeSearch()}
                                />
                            </div>
                            <button
                                onClick={handlePostcodeSearch}
                                className="bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 active:scale-95 group"
                            >
                                <span className="sm:hidden mr-2 font-bold text-xs uppercase tracking-wider">{t('geo.search')}</span>
                                <Navigation size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Radius Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-100">{t('geo.radius')}</h2>
                            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md text-xs">{settings.radius} {t('geo.miles')}</span>
                        </div>
                        <input
                            type="range" min="5" max="100"
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            value={settings.radius}
                            onChange={(e) => setSettings(p => ({ ...p, radius: parseInt(e.target.value) }))}
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium">
                            <span>5 {t('geo.mi')}</span>
                            <span>100 {t('geo.mi')}</span>
                        </div>
                    </div>

                    {/* Stats Display */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-white text-center space-y-6">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">{t('geo.est_reach')}</p>
                            <p className="text-3xl font-bold">{stats.reach.toLocaleString()}</p>
                            <p className="text-sm text-slate-400">{t('geo.users')}</p>
                        </div>
                        <div className="w-full h-px bg-slate-700"></div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">{t('geo.coverage_area')}</p>
                            <p className="text-2xl font-bold">{stats.area.toLocaleString()}</p>
                            <p className="text-sm text-slate-400">{t('geo.sq_miles')}</p>
                        </div>
                    </div>

                    <button className="w-full py-3 premium-btn rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] italic uppercase"
                        onClick={() => alert(t('geo.settings_saved'))}>
                        {t('geo.apply')}
                    </button>
                </div>

                {/* Map Container - Responsive Height */}
                <div className="lg:col-span-2 h-[400px] md:h-[600px] bg-slate-200 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
                    <div id="map" ref={mapRef} className="w-full h-full z-0" />

                    {/* Info Overlay */}
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg text-[10px] md:text-xs font-medium text-slate-300 shadow-sm border border-slate-700 flex items-center gap-2 z-[1000]">
                        <Info size={14} className="text-primary-light" />
                        <span className="hidden sm:inline">{t('geo.map_info')}</span>
                        <span className="sm:hidden">{t('geo.map_info_short')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeoTargeting;
