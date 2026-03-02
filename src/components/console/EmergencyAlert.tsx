import { useState, useEffect, useRef } from 'react';
import { Phone, MessageSquare, MapPin, X, Siren, Send, Navigation } from 'lucide-react';

interface Props {
    isVisible: boolean;
    riskScore: number;
    onDismiss: () => void;
}

/* =========================================================
   Emergency Alert — Triggered on CRITICAL state
   ========================================================= */
export default function EmergencyAlert({ isVisible, riskScore, onDismiss }: Props) {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const hasFetchedLocation = useRef(false);

    // Auto-fetch location when alert shows
    useEffect(() => {
        if (isVisible && !hasFetchedLocation.current && navigator.geolocation) {
            hasFetchedLocation.current = true;
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationLoading(false);
                },
                () => {
                    setLocationLoading(false);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
    }, [isVisible]);

    // Reset state when dismissed
    useEffect(() => {
        if (!isVisible) {
            hasFetchedLocation.current = false;
            setMessageSent(false);
            setShowContactForm(false);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const locationStr = location
        ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        : 'Detecting...';

    const mapsUrl = location
        ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
        : 'https://www.google.com/maps';

    const emergencyMessage = `EMERGENCY ALERT — CrocX Vehicle Safety System\n\nVehicle risk level: CRITICAL (${riskScore.toFixed(1)}%)\nImmediate assistance required.\n\nLocation: ${locationStr}\nMap: ${mapsUrl}\n\nContact: ${contactName || 'Vehicle Owner'}\nPhone: ${contactPhone || 'N/A'}\n\nThis is an automated alert from CrocX Predictive Vehicle Intelligence.`;

    const handleCallPolice = () => {
        window.open('tel:100', '_self'); // India police number
    };

    const handleCallAmbulance = () => {
        window.open('tel:108', '_self'); // India ambulance
    };

    const handleShareLocation = () => {
        if (location) {
            window.open(mapsUrl, '_blank');
        }
    };

    const handleSendSMS = () => {
        const encodedMsg = encodeURIComponent(emergencyMessage);
        const phone = contactPhone || '';
        window.open(`sms:${phone}?body=${encodedMsg}`, '_self');
        setMessageSent(true);
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(emergencyMessage).then(() => {
            setMessageSent(true);
            setTimeout(() => setMessageSent(false), 2000);
        });
    };

    return (
        <div className="emergency-overlay">
            <div className="emergency-modal">
                {/* Pulsing header */}
                <div className="emergency-header">
                    <div className="emergency-header__icon">
                        <Siren size={24} />
                    </div>
                    <div className="emergency-header__text">
                        <h2>Critical Vehicle Alert</h2>
                        <p>Risk level at <strong>{riskScore.toFixed(1)}%</strong> — Immediate action recommended</p>
                    </div>
                    <button className="emergency-dismiss" onClick={onDismiss}>
                        <X size={18} />
                    </button>
                </div>

                {/* Location info */}
                <div className="emergency-location">
                    <Navigation size={14} />
                    <span className="emergency-location__label">Your Location:</span>
                    <span className="emergency-location__coords">
                        {locationLoading ? 'Acquiring GPS...' : locationStr}
                    </span>
                    {location && (
                        <button className="emergency-location__map" onClick={handleShareLocation}>
                            View Map
                        </button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="emergency-actions">
                    <button className="emergency-btn emergency-btn--police" onClick={handleCallPolice}>
                        <Phone size={18} />
                        <div className="emergency-btn__text">
                            <span className="emergency-btn__title">Call Police</span>
                            <span className="emergency-btn__sub">Dial 100</span>
                        </div>
                    </button>

                    <button className="emergency-btn emergency-btn--ambulance" onClick={handleCallAmbulance}>
                        <Phone size={18} />
                        <div className="emergency-btn__text">
                            <span className="emergency-btn__title">Call Ambulance</span>
                            <span className="emergency-btn__sub">Dial 108</span>
                        </div>
                    </button>

                    <button className="emergency-btn emergency-btn--sms" onClick={() => setShowContactForm(!showContactForm)}>
                        <MessageSquare size={18} />
                        <div className="emergency-btn__text">
                            <span className="emergency-btn__title">Send Alert SMS</span>
                            <span className="emergency-btn__sub">With location & details</span>
                        </div>
                    </button>

                    <button className="emergency-btn emergency-btn--location" onClick={handleShareLocation}>
                        <MapPin size={18} />
                        <div className="emergency-btn__text">
                            <span className="emergency-btn__title">Share Location</span>
                            <span className="emergency-btn__sub">Open in Google Maps</span>
                        </div>
                    </button>
                </div>

                {/* Contact Form (shown when SMS selected) */}
                {showContactForm && (
                    <div className="emergency-contact-form">
                        <h3>Emergency Contact Details</h3>
                        <div className="emergency-form-row">
                            <label>Contact Name</label>
                            <input
                                type="text"
                                placeholder="e.g. John Doe"
                                value={contactName}
                                onChange={e => setContactName(e.target.value)}
                                className="emergency-input"
                            />
                        </div>
                        <div className="emergency-form-row">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                placeholder="e.g. +91 9876543210"
                                value={contactPhone}
                                onChange={e => setContactPhone(e.target.value)}
                                className="emergency-input"
                            />
                        </div>

                        {/* Message Preview */}
                        <div className="emergency-msg-preview">
                            <div className="emergency-msg-preview__label">Message Preview</div>
                            <pre className="emergency-msg-preview__text">{emergencyMessage}</pre>
                        </div>

                        <div className="emergency-form-actions">
                            <button className="emergency-send-btn" onClick={handleSendSMS}>
                                <Send size={14} />
                                <span>Send SMS</span>
                            </button>
                            <button className="emergency-copy-btn" onClick={handleCopyMessage}>
                                <span>{messageSent ? 'Copied!' : 'Copy Message'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="emergency-footer">
                    <p>CrocX automatically detects critical vehicle conditions and recommends immediate action.</p>
                </div>
            </div>
        </div>
    );
}
