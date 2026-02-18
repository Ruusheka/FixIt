import React, { useState } from 'react';
import { Camera, Upload, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

export const ReportIssue: React.FC = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!image) return;

            // Get location
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;

                // Send to backend
                const formData = new FormData();
                formData.append('image', image);
                formData.append('title', 'Citizen Report'); // In real app, ask user or AI
                formData.append('description', 'Reported via FixIt App');
                formData.append('latitude', latitude.toString());
                formData.append('longitude', longitude.toString());
                formData.append('category', 'unknown'); // AI will fix this

                // Using fetch to talk to our Node server which talks to Supabase & AI
                const response = await fetch('http://localhost:3000/api/issues', {
                    method: 'POST',
                    // headers: { 'Authorization': ... } // TODO: Add auth
                    body: formData
                });

                if (!response.ok) throw new Error('Failed to submit');

                setSubmitted(true);
                setLoading(false);
            }, (error) => {
                console.error(error);
                alert("Location required");
                setLoading(false);
            });

        } catch (error) {
            console.error(error);
            setLoading(false);
            alert("Error submitting report");
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] bg-green-50 p-6">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-800">Report Submitted!</h2>
                <p className="text-green-700 mt-2 text-center">
                    Our AI is analyzing your report. You will be notified once verified.
                </p>
                <button
                    onClick={() => { setSubmitted(false); setImage(null); setPreview(null); }}
                    className="mt-8 px-6 py-2 bg-green-600 text-white rounded-full font-medium"
                >
                    Report Another
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Report an Issue</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 min-h-[200px] relative overflow-hidden">
                    {preview ? (
                        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Tap to take photo</p>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                    />
                </div>

                {image && (
                    <div className="text-center text-sm text-gray-600">
                        {image.name}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!image || loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? 'Analyzing...' : 'Submit Report'}
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                    AI will automatically categorize and categorize urgency.
                </p>
            </form>
        </div>
    );
};
