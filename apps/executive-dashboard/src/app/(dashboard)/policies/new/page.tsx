'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@aegisciso/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewPolicyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Security',
    frameworkSource: 'NCA_ECC',
    maturityLevel: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/policies');
        router.refresh();
      } else {
        alert('Failed to create policy. Please try again.');
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
      [name]: name === 'maturityLevel' ? parseInt(value) : value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/policies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Policy</h1>
          <p className="text-muted-foreground">Add a new cybersecurity policy</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
              <CardDescription>Basic information about the policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Policy Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter policy title"
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
                  placeholder="Describe the policy purpose and scope"
                  required
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
              <CardDescription>Policy categorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Security">Security</option>
                  <option value="Access Control">Access Control</option>
                  <option value="Incident Response">Incident Response</option>
                  <option value="Business Continuity">Business Continuity</option>
                  <option value="Data Protection">Data Protection</option>
                  <option value="Network Security">Network Security</option>
                  <option value="Third Party Risk">Third Party Risk</option>
                  <option value="Cloud Security">Cloud Security</option>
                  <option value="Awareness">Awareness</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frameworkSource">Framework Source</Label>
                <select
                  id="frameworkSource"
                  name="frameworkSource"
                  value={formData.frameworkSource}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="NCA_ECC">NCA ECC</option>
                  <option value="NIST_CSF">NIST CSF</option>
                  <option value="ISO_27001">ISO 27001</option>
                  <option value="SAMA_CSF">SAMA CSF</option>
                  <option value="Internal">Internal</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maturity Level</CardTitle>
              <CardDescription>Current implementation maturity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maturityLevel">Maturity Level (1-5)</Label>
                <select
                  id="maturityLevel"
                  name="maturityLevel"
                  value={formData.maturityLevel}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>1 - Initial</option>
                  <option value={2}>2 - Developing</option>
                  <option value={3}>3 - Defined</option>
                  <option value={4}>4 - Managed</option>
                  <option value={5}>5 - Optimizing</option>
                </select>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Maturity Description:</p>
                <p className="text-sm">
                  {formData.maturityLevel === 1 && 'Ad-hoc processes with minimal documentation'}
                  {formData.maturityLevel === 2 && 'Basic processes documented but not consistently followed'}
                  {formData.maturityLevel === 3 && 'Standardized processes with consistent implementation'}
                  {formData.maturityLevel === 4 && 'Measured and controlled processes with metrics'}
                  {formData.maturityLevel === 5 && 'Continuously improving with automated controls'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/policies">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </div>
  );
}
