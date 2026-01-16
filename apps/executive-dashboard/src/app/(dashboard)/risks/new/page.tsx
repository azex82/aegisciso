'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@aegisciso/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewRiskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technology',
    source: 'Internal Assessment',
    inherentLikelihood: 3,
    inherentImpact: 3,
    treatmentPlan: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/risks');
        router.refresh();
      } else {
        alert('Failed to create risk. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['inherentLikelihood', 'inherentImpact'].includes(name) ? parseInt(value) : value
    }));
  };

  const riskScore = formData.inherentLikelihood * formData.inherentImpact;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/risks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Risk</h1>
          <p className="text-muted-foreground">Add a new risk to the register</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Risk Details</CardTitle>
              <CardDescription>Basic information about the risk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Risk Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter risk title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the risk in detail"
                  required
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Technology">Technology</option>
                    <option value="People">People</option>
                    <option value="Process">Process</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Third Party">Third Party</option>
                    <option value="Cyber Threat">Cyber Threat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Internal Assessment">Internal Assessment</option>
                    <option value="External Audit">External Audit</option>
                    <option value="Vulnerability Scan">Vulnerability Scan</option>
                    <option value="Incident">Incident</option>
                    <option value="Compliance Review">Compliance Review</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Likelihood and impact scoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inherentLikelihood">Likelihood (1-5)</Label>
                <select
                  id="inherentLikelihood"
                  name="inherentLikelihood"
                  value={formData.inherentLikelihood}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Rare</option>
                  <option value={2}>2 - Unlikely</option>
                  <option value={3}>3 - Possible</option>
                  <option value={4}>4 - Likely</option>
                  <option value={5}>5 - Almost Certain</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inherentImpact">Impact (1-5)</Label>
                <select
                  id="inherentImpact"
                  name="inherentImpact"
                  value={formData.inherentImpact}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Insignificant</option>
                  <option value={2}>2 - Minor</option>
                  <option value={3}>3 - Moderate</option>
                  <option value={4}>4 - Major</option>
                  <option value={5}>5 - Catastrophic</option>
                </select>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`text-3xl font-bold ${
                  riskScore >= 20 ? 'text-red-600' :
                  riskScore >= 12 ? 'text-orange-600' :
                  riskScore >= 6 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {riskScore}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {riskScore >= 20 ? 'Critical' : riskScore >= 12 ? 'High' : riskScore >= 6 ? 'Medium' : 'Low'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan</CardTitle>
              <CardDescription>How will this risk be addressed?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                <textarea
                  id="treatmentPlan"
                  name="treatmentPlan"
                  value={formData.treatmentPlan}
                  onChange={handleChange}
                  placeholder="Describe the treatment approach"
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/risks">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Risk'}
          </Button>
        </div>
      </form>
    </div>
  );
}
