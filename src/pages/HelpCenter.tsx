import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Mail, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'How does the AI Resume Scanner work?',
      answer: 'Our AI analyzes your resume against real job descriptions, giving you an ATS compatibility score, skill gap analysis, and personalized improvement suggestions. Upload PDF/DOCX or paste text directly.',
      tags: ['scanner', 'ai', 'resume']
    },
    {
      question: 'What file formats are supported for resume scanning?',
      answer: 'We support PDF, DOCX, and plain text. Maximum file size is 5MB. For best results, use recent versions of Word or clean PDF exports.',
      tags: ['scanner', 'format', 'upload']
    },
    {
      question: 'How accurate is the ATS score?',
      answer: 'Our model is trained on 500k+ real job postings and achieves 92% accuracy on matching skills/keywords to ATS systems like Workable, Greenhouse, and Lever.',
      tags: ['accuracy', 'ats', 'scanner']
    },
    {
      question: 'How do I access the Recruiter Dashboard?',
      answer: 'Enterprise plan users see Dashboard in navigation. Contact us to upgrade or use admin access if you have it. Features include candidate search, analytics, and bulk scanning.',
      tags: ['recruiter', 'dashboard', 'enterprise']
    },
    {
      question: 'What is your refund policy?',
      answer: 'Full refund within 7 days for first-time purchases. Monthly plans cancellable anytime. Enterprise custom - email billing@skilldex.com for details.',
      tags: ['billing', 'refund', 'subscription']
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes! Monthly plans cancel instantly. Annual plans prorated refund. Manage in /billing or email us.',
      tags: ['subscription', 'cancel', 'billing']
    },
    {
      question: 'How secure is my data?',
      answer: 'SOC2 compliant. Resumes deleted after 30 days. No training on user data. Enterprise customers get dedicated instances.',
      tags: ['security', 'privacy', 'data']
    },
    {
      question: 'Where can I find my scan results?',
      answer: 'Results appear immediately after scan. Save as PDF or share via link. History accessible from profile page.',
      tags: ['results', 'history', 'scanner']
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar activeSection="home" onNavigate={() => {}} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        {/* Hero Header */}
        <div className="text-center mb-20">
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="inline-flex bg-gradient-to-r from-primary/20 to-primary-foreground/20 rounded-full px-6 py-2 mb-6">
            <Badge variant="secondary" className="bg-primary/20 text-primary mr-2">Support</Badge>
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-6">
            Find answers fast
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search our knowledge base or contact support directly
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs, guides, or contact support..."
              className="pl-12 pr-4 py-6 text-lg border-2 border-border focus:border-primary rounded-2xl"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 text-center">
          <Card>
            <CardHeader className="pb-2">
              <Clock className="w-12 h-12 text-primary mx-auto mb-2" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold">24h</CardTitle>
              <p className="text-muted-foreground">Response time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-2" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold">98%</CardTitle>
              <p className="text-muted-foreground">Satisfaction</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Mail className="w-12 h-12 text-primary mx-auto mb-2" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold">100+</CardTitle>
              <p className="text-muted-foreground">FAQs answered</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <Accordion type="single" collapsible key={index} defaultValue={`item-${index}`}>
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start justify-between w-full">
                      <span className="font-medium text-lg">{faq.question}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {faq.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">Try different keywords or</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <a href="/contact">Contact Us</a>
                  </Button>
                  <Button variant="outline">Clear search</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-10">
              <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Our team responds within 24 hours
              </p>
              <Button asChild size="lg" className="w-full max-w-sm mx-auto">
                <a href="/contact">Contact Support</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <SiteFooter onNavigate={() => {}} />
    </div>
  );
};

export default HelpCenter;

