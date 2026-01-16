import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@aegisciso/ui';
import { BookOpen, MessageCircle, Mail, Phone, FileText, Video, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const resources = [
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Comprehensive guides and API documentation',
      href: '#',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for common tasks',
      href: '#',
    },
    {
      icon: FileText,
      title: 'FAQs',
      description: 'Frequently asked questions and answers',
      href: '#',
    },
  ];

  const faqs = [
    {
      question: 'How do I create a new risk assessment?',
      answer: 'Navigate to the Risks page and click the "New Risk" button. Fill in the required fields including risk title, category, likelihood, and impact scores.',
    },
    {
      question: 'How are compliance scores calculated?',
      answer: 'Compliance scores are calculated based on the percentage of implemented controls mapped to each framework. The overall score is a weighted average across all active frameworks.',
    },
    {
      question: 'How do I export reports?',
      answer: 'On any page with exportable data, click the "Export" button in the top right corner. You can choose between PDF and CSV formats.',
    },
    {
      question: 'What do the risk severity levels mean?',
      answer: 'Risk severity is calculated as Likelihood × Impact. Critical (20-25), High (15-19), Medium (8-14), Low (1-7).',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">Get help with using the SHARP platform</p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <resource.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{resource.title}</CardTitle>
                  <CardDescription className="text-xs">{resource.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>Need more help? Reach out to our support team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@sharp.sa</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-muted-foreground">+966 11 XXX XXXX</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-muted-foreground">Available 24/7</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            AI Cybersecurity Assistant
          </CardTitle>
          <CardDescription>Get instant answers from our AI-powered assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Our AI assistant can help you with questions about NCA compliance, risk management,
            policy guidance, and more. Access it from the AI Director tab in the main navigation.
          </p>
          <Link
            href="/ai-director"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Go to AI Director
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
