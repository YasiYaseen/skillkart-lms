import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select } from '@components/common';

interface OnboardingData {
    phoneNumber: string;
    address: string;
    dob: string;
    gender: string;
    preferences: string;
    interests: string[];
}

const GENDER_OPTIONS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'n/a' },
];

const INTEREST_OPTIONS = [
    { label: 'Web Development', value: 'web_dev' },
    { label: 'Data Science', value: 'data_science' },
    { label: 'Design', value: 'design' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Business', value: 'business' },
];

function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingData>({
        phoneNumber: '',
        address: '',
        dob: '',
        gender: '',
        preferences: '',
        interests: [],
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleInterestToggle = (value: string) => {
        setFormData((prev) => {
            const interests = prev.interests.includes(value)
                ? prev.interests.filter((i) => i !== value)
                : [...prev.interests, value];
            return { ...prev, interests };
        });
    };

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
    };

    const handleSubmit = () => {
        console.log('Onboarding Data:', formData);
        // Mock API call
        setTimeout(() => {
            navigate('/');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Progress Bar */}
                <div className="bg-gray-100 h-2 w-full">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 2) * 100}%` }}
                    />
                </div>

                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {step === 1 ? 'Personal Details' : 'Your Interests'}
                        </h1>
                        <p className="text-gray-500">
                            {step === 1
                                ? 'Tell us a bit more about yourself to personalize your experience.'
                                : 'Select topics you are interested in learning about.'}
                        </p>
                    </div>

                    {/* Step 1: Personal Details */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Phone Number"
                                    name="phoneNumber"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                />
                                <Input
                                    label="Date of Birth"
                                    name="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <Input
                                label="Address"
                                name="address"
                                placeholder="123 Main St, City, Country"
                                value={formData.address}
                                onChange={handleInputChange}
                            />

                            <Select
                                label="Gender"
                                name="gender"
                                options={GENDER_OPTIONS}
                                placeholder="Select your gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}

                    {/* Step 2: Interests */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {INTEREST_OPTIONS.map((interest) => (
                                    <button
                                        key={interest.value}
                                        onClick={() => handleInterestToggle(interest.value)}
                                        className={`
                                            p-4 rounded-xl border-2 text-left transition-all
                                            ${formData.interests.includes(interest.value)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }
                                        `}
                                    >
                                        <div className="font-semibold">{interest.label}</div>
                                    </button>
                                ))}
                            </div>

                            <Input
                                label="Other Preferences"
                                name="preferences"
                                placeholder="Any specific learning goals or accessibility needs?"
                                value={formData.preferences}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-10 flex items-center justify-between">
                        {step > 1 ? (
                            <Button variant="ghost" onClick={handleBack}>
                                Back
                            </Button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        <Button
                            onClick={step === 2 ? handleSubmit : handleNext}
                            size="lg"
                        >
                            {step === 2 ? 'Complete Setup' : 'Continue'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;
