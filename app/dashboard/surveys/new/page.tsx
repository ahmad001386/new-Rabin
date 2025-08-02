'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const surveySchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['CSAT', 'Product', 'Employee'], {
        required_error: 'Please select a survey type',
    }),
    targetAudience: z.string().min(3, 'Please specify target audience'),
    duration: z.string().min(1, 'Please specify expected duration'),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

export default function NewSurveyPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SurveyFormValues>({
        resolver: zodResolver(surveySchema),
        defaultValues: {
            title: '',
            description: '',
            type: undefined,
            targetAudience: '',
            duration: '',
        },
    });

    async function onSubmit(data: SurveyFormValues) {
        setIsSubmitting(true);
        try {
            // Here you would typically send the data to your backend
            console.log(data);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            router.push('/dashboard/surveys');
        } catch (error) {
            console.error('Error creating survey:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Create New Survey</h1>
                <p className="text-gray-500">Design your survey by filling out the form below.</p>
            </div>

            <Card className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Survey Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter survey title" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Give your survey a clear and descriptive title
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter survey description"
                                            {...field}
                                            rows={4}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Provide a brief description of the survey's purpose
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Survey Type</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a survey type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CSAT">Customer Satisfaction (CSAT)</SelectItem>
                                                <SelectItem value="Product">Product Feedback</SelectItem>
                                                <SelectItem value="Employee">Employee Survey</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        Choose the type of survey you want to create
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="targetAudience"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Audience</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., All customers, Product users, Sales team" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Specify who should take this survey
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expected Duration</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 5-10 minutes" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        How long will it take to complete the survey
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-4 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/surveys')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Survey'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
