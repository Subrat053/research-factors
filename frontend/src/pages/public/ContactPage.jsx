import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { contactApi } from '../../services/contact.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  FileCheck,
  HelpCircle,
  Briefcase,
  Loader2,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  MapPin
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  const contactMutation = useMutation({
    mutationFn: (payload) => contactApi.submitContactMessage(payload),
    onSuccess: () => {
      setIsSuccess(true);
      setApiError(null);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormErrors({});
    },
    onError: (err) => {
      setApiError(
        err?.message || 'Unable to transmit your message. Please check your connection and try again.'
      );
    }
  });

  const validate = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!formData.subject || formData.subject.trim().length < 3) {
      errors.subject = 'Subject line must be at least 3 characters.';
    }
    if (!formData.message || formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    contactMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Research Factors',
    description:
      'Get in touch with Research Factors editorial staff, submit corrections, or inquire about research partnerships.',
    url: 'https://researchfactors.com/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'Research Factors Inc.',
      url: 'https://researchfactors.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bhubaneswar',
        addressRegion: 'Odisha',
        addressCountry: 'IN'
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'Editorial Inquiries',
          email: 'editorial@researchfactors.com'
        },
        {
          '@type': 'ContactPoint',
          contactType: 'Reader Support',
          email: 'support@researchfactors.com'
        }
      ]
    }
  };

  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'contact'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'contact' }),
    staleTime: 1000 * 60 * 10
  });
  const pageSeo = seoResponse?.data || null;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rfblue-100 selection:text-rfblue-900">
      <SeoHead
        seo={pageSeo}
        title="Contact Us — Editorial Desk & Inquiries | Research Factors"
        description="Contact the Research Factors editorial team. Submit corrections, research feedback, or reader inquiries directly to our desk."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/contact` : 'https://researchfactors.com/contact'}
        jsonLd={pageSeo?.schema?.jsonLd || jsonLd}
      />

      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="relative py-8 sm:py-16 border-b border-paper-border bg-paper-warm overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rfblue-50 text-rfblue border border-rfblue-100 mb-4 shadow-2xs">
              <Mail className="w-3.5 h-3.5" />
              <span>Direct Communication</span>
            </div>

            <h1 className="text-ink-darkest">
              Contact Our Editorial Desk
            </h1>

            <p className="mt-4 text-lead text-ink-muted max-w-2xl mx-auto">
              Have questions about our research methodologies, spotted an empirical correction, or seeking collaboration? We are here to help.
            </p>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="py-8 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Column: Direct Communication Channels & Editorial Guidelines */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:space-y-0 h-full">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white border border-paper-border shadow-2xs flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 mt-0.5">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[16px] font-bold text-ink-darkest">Editorial & Corrections</h4>
                      <p className="text-sm  text-ink-light mt-0.5">
                        Factual updates, methodological inquiries, or research feedback.
                      </p>
                      <a
                        href="mailto:editorial@researchfactors.com"
                        className="mt-1.5 inline-block text-sm font-semibold text-rfblue hover:underline break-all"
                      >
                        editorial@researchfactors.com
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-paper-border shadow-2xs flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[16px] font-bold text-ink-darkest">Brand Collaborations</h4>
                      <p className="text-sm text-ink-light mt-0.5">
                        Sponsored benchmarks and custom research inquiries.
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <a
                          href="mailto:sponsorship@researchfactors.com"
                          className="text-sm font-semibold text-rfblue hover:underline break-all"
                        >
                          sponsorship@researchfactors.com
                        </a>
                        <span className="text-xs text-paper-border hidden sm:inline">•</span>
                        <Link
                          to="/sponsorship"
                          className="text-sm font-semibold text-ink-muted hover:text-rfblue hover:underline whitespace-nowrap"
                        >
                          View Packages →
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-paper-border shadow-2xs flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[16px] font-bold text-ink-darkest">Reader Support & Community</h4>
                      <p className="text-sm text-ink-light mt-0.5">
                        User accounts, platform assistance.
                      </p>
                      <a
                        href="mailto:support@researchfactors.com"
                        className="mt-1.5 inline-block text-sm font-semibold text-rfblue hover:underline break-all"
                      >
                        support@researchfactors.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Editorial Response SLA Callout */}
                <div className="p-5 rounded-2xl bg-paper-warm border border-paper-border space-y-2.5 mt-6 lg:mt-0">
                  <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider text-ink-darkest">
                    <Clock className="w-4 h-4 text-rfblue" />
                    <span>Response Commitment</span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    Our team reviews every submitted inquiry. During normal business hours, we endeavor to respond within <strong>24 to 48 hours</strong>.
                  </p>
                </div>
              </div>

              {/* Right Column: Interactive Contact Form */}
              <div className="lg:col-span-7 h-full">
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-paper-border shadow-sm h-full flex flex-col justify-between">
                  {isSuccess ? (
                    <div className="text-center py-8 space-y-4 my-auto">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-ink-darkest">
                        Message Transmitted Successfully
                      </h3>
                      <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                        Thank you for contacting Research Factors. Your inquiry has been securely routed to our editorial desk, and an editor will follow up via your email shortly.
                      </p>
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => setIsSuccess(false)}
                          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-rfblue bg-rfblue-50 hover:bg-rfblue-100 transition-colors"
                        >
                          Send Another Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between" noValidate>
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-xl font-bold text-ink-darkest">
                            Send a Message to the Desk
                          </h3>
                          <p className="text-xs sm:text-sm text-ink-light mt-1">
                            All fields marked with an asterisk (<span className="text-rose-500">*</span>) are required.
                          </p>
                        </div>

                        {apiError && (
                          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-3 text-xs sm:text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                            <div>
                              <span className="font-semibold block">Submission Error</span>
                              <span>{apiError}</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Name Field */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-1.5">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              placeholder="Dr. Eleanor Vance"
                              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-paper/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue/20 transition-all ${
                                formErrors.name ? 'border-rose-400' : 'border-paper-border'
                              }`}
                              disabled={contactMutation.isPending}
                            />
                            {formErrors.name && (
                              <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p>
                            )}
                          </div>

                          {/* Email Field */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-1.5">
                              Email Address <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              placeholder="eleanor@institution.org"
                              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-paper/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue/20 transition-all ${
                                formErrors.email ? 'border-rose-400' : 'border-paper-border'
                              }`}
                              disabled={contactMutation.isPending}
                            />
                            {formErrors.email && (
                              <p className="mt-1 text-xs text-rose-500">{formErrors.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Subject Line Field */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-1.5">
                            Subject Line <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            placeholder="Regarding: Empirical Benchmarks on Semiconductor Cooling"
                            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-paper/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue/20 transition-all ${
                              formErrors.subject ? 'border-rose-400' : 'border-paper-border'
                            }`}
                            disabled={contactMutation.isPending}
                          />
                          {formErrors.subject && (
                            <p className="mt-1 text-xs text-rose-500">{formErrors.subject}</p>
                          )}
                        </div>

                        {/* Message Body Field */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink-darkest mb-1.5">
                            Detailed Message <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={6}
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder="Please elaborate on your inquiry, citation request, or feedback in detail..."
                            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-paper/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue/20 transition-all resize-y ${
                              formErrors.message ? 'border-rose-400' : 'border-paper-border'
                            }`}
                            disabled={contactMutation.isPending}
                          />
                          {formErrors.message && (
                            <p className="mt-1 text-xs text-rose-500">{formErrors.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={contactMutation.isPending}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-rfblue hover:bg-rfblue-700 shadow-xs hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {contactMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Transmitting to Desk...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Message</span>
                              <Send className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Bureau Location Map Section */}
        <section className="py-10 sm:py-16 border-t border-paper-border bg-paper-warm/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-row md:items-end justify-between mb-8 gap-4">
              
                
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-ink-darkest">
                  <span className='inline-flex d-none mr-1 md:mr-2'><MapPin className='w-5 h-5 md:w-6 md:h-6 md:mt-0.5'/></span>
                  Find us
                </h2>
                
              

              <div className="shrink-0 flex items-center space-x-3">
                <a
                  href="https://maps.google.com/?q=Bhubaneswar,+Odisha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rfblue bg-white border border-paper-border hover:bg-rfblue-50 hover:border-rfblue-200 transition-all shadow-2xs"
                >
                  <MapPin className="w-4 h-4 text-rfblue" />
                  <span>Open in Google Maps</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 text-ink-light" />
                </a>
              </div>
            </div>

            {/* Map Container - Full Max Width with Responsive Height */}
            <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden border border-paper-border shadow-sm bg-paper-warm">
              <iframe
                title="Research Factors Bureau Location - Bhubaneswar, Odisha"
                src="https://maps.google.com/maps?q=Bhubaneswar%2C%20Odisha&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
