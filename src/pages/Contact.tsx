import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import logo from '@/assets/skilldex-logo.png';

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Sending...');
    
    // Simulate API call (replace with Supabase/emailjs)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Contact form submitted:', formData);
    setStatus('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar activeSection="home" onNavigate={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        {/* Hero Header */}
        <div className="text-center mb-20">
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about our AI resume scanner, job board, or pricing? 
            We're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Mail className="w-8 h-8 text-primary" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Reach out to our team directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                <Mail className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Email Us</p>
                  <a href="mailto:skilldex07@gmail.com" className="text-primary hover:underline">
                    skilldex07@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                <Phone className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl">
                <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">Remote - Global Team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form and we'll respond within 24 hours
              </CardDescription>
              {status && (
                <div className={`p-4 rounded-lg mt-4 ${
                  status.includes('successfully') 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                    : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                }`}>
                  {status}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Full Name</label>
                    <Input 
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      required 
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input 
                      name="email" 
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required 
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({...formData, subject: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="billing">Billing Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required 
                    placeholder="Tell us more about your question or issue..."
                    rows={6}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Send className="w-4 h-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <SiteFooter onNavigate={() => {}} />
    </div>
  );
};

export default Contact;

