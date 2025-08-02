'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface SurveyResponse {
    question: string;
    responses: {
        answer: string;
        count: number;
    }[];
}

const mockSurveyData = {
    id: '1',
    title: 'Customer Satisfaction Q2 2024',
    type: 'CSAT',
    status: 'active',
    responses: 245,
    created: '2024-01-15',
    description: 'Quarterly customer satisfaction survey to measure overall satisfaction and identify areas for improvement.',
    targetAudience: 'All active customers',
    duration: '5-10 minutes',
    questionResponses: [
        {
            question: 'How satisfied are you with our product?',
            responses: [
                { answer: 'Very Satisfied', count: 120 },
                { answer: 'Satisfied', count: 80 },
                { answer: 'Neutral', count: 25 },
                { answer: 'Dissatisfied', count: 15 },
                { answer: 'Very Dissatisfied', count: 5 },
            ],
        },
        {
            question: 'How likely are you to recommend our product?',
            responses: [
                { answer: 'Very Likely', count: 130 },
                { answer: 'Likely', count: 70 },
                { answer: 'Neutral', count: 30 },
                { answer: 'Unlikely', count: 10 },
                { answer: 'Very Unlikely', count: 5 },
            ],
        },
    ],
};

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    function generateChartData(responses: SurveyResponse) {
        return {
            labels: responses.responses.map(r => r.answer),
            datasets: [
                {
                    label: 'Number of Responses',
                    data: responses.responses.map(r => r.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold mb-2">{mockSurveyData.title}</h1>
                    <div className="flex gap-2 mb-4">
                        <Badge variant="secondary">{mockSurveyData.type}</Badge>
                        <Badge
                            variant={
                                mockSurveyData.status === 'active'
                                    ? 'default'
                                    : mockSurveyData.status === 'draft'
                                        ? 'secondary'
                                        : 'outline'
                            }
                        >
                            {mockSurveyData.status}
                        </Badge>
                    </div>
                </div>
                <Button variant="outline">Export Results</Button>
            </div>

            <Card className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 className="font-semibold mb-1">Description</h3>
                        <p className="text-gray-600">{mockSurveyData.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-1">Target Audience</h3>
                            <p className="text-gray-600">{mockSurveyData.targetAudience}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Duration</h3>
                            <p className="text-gray-600">{mockSurveyData.duration}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Total Responses</h3>
                            <p className="text-gray-600">{mockSurveyData.responses}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Created</h3>
                            <p className="text-gray-600">{mockSurveyData.created}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid gap-6">
                {mockSurveyData.questionResponses.map((questionData, index) => (
                    <Card key={index} className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{questionData.question}</h2>
                        <div className="h-[300px]">
                            <Bar data={generateChartData(questionData)} options={chartOptions} />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}