'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Package } from 'lucide-react';
import Link from 'next/link';

export default function AddProductPage() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [version, setVersion] = useState('');
    const [company, setCompany] = useState('شرکت هوشمند افزار');

    return (
        <div className="max-w-xl mx-auto mt-10 animate-fade-in-up">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-vazir text-xl flex items-center">
                        <Package className="h-5 w-5 ml-2" /> افزودن محصول جدید
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6">
                        <div>
                            <Label htmlFor="name" className="font-vazir">نام محصول</Label>
                            <Input id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="desc" className="font-vazir">توضیحات</Label>
                            <Input id="desc" value={desc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="version" className="font-vazir">نسخه</Label>
                            <Input id="version" value={version} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVersion(e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="company" className="font-vazir">شرکت</Label>
                            <Input id="company" value={company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)} className="mt-2" />
                        </div>
                        <div className="flex justify-between mt-8">
                            <Link href="/dashboard/projects">
                                <Button variant="outline" className="font-vazir">بازگشت</Button>
                            </Link>
                            <Button type="submit" className="font-vazir">ثبت محصول</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
