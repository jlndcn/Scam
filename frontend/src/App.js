import { useMemo, useState } from "react";
import "@/App.css";
import axios from "axios";
import { motion } from "framer-motion";
import {
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CircleCheck,
  ServerCog,
  MessageSquareWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Toaster, toast } from "@/components/ui/sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const packageOptions = [
  {
    id: "monthly",
    title: "Monatliches Paket",
    price: "149,99 €",
    period: "pro Monat",
    feature: "Bis zu 5 WhatsApp-Business-Rufnummern",
    cta: "Monatliches Paket anfordern",
    highlight: false,
  },
  {
    id: "lifetime",
    title: "Lifetime-Angebot",
    price: "699 €",
    period: "einmalig",
    feature: "Bis zu 3 WhatsApp-Business-Rufnummern",
    cta: "Lifetime-Angebot anfordern",
    highlight: true,
  },
];

const processSteps = [
  "QR-Code scannen oder Button klicken",
  "E-Mail-Adresse und betroffene Rufnummern eintragen",
  "Paket auswählen",
  "Zahlungsaufforderung per E-Mail erhalten",
  "Nach Zahlungseingang Anleitung per E-Mail bekommen",
];

const faqItems = [
  {
    question: "Funktioniert das mit normalem WhatsApp?",
    answer: "Nein, diese Lösung ist ausschließlich für WhatsApp Business gedacht.",
  },
  {
    question: "Warum muss ich die Rufnummer angeben?",
    answer:
      "Damit die technische Umsetzung exakt für die betroffene WhatsApp-Business-Rufnummer zugeordnet werden kann.",
  },
  {
    question: "Bis zu welchem Nachrichtenvolumen gilt die Garantie?",
    answer: "Die Garantie gilt fiktiv bis zu 10.000 ausgehenden Nachrichten pro Tag.",
  },
  {
    question: "Was genau wird garantiert?",
    answer:
      "Bei korrekter Anwendung wird garantiert, dass WhatsApp Business innerhalb des Limits nicht allein wegen hoher Versandmenge oder automatischer Spam-Einstufung gesperrt wird.",
  },
  {
    question: "Welche Pakete gibt es?",
    answer: "Monatlich für 149,99 € oder Lifetime für 699 € einmalig.",
  },
  {
    question: "Wie bekomme ich Zugang?",
    answer:
      "Formular absenden, Zahlungsaufforderung per E-Mail erhalten und nach Zahlung die Anleitung per E-Mail bekommen.",
  },
  {
    question: "Ist das offiziell von WhatsApp oder Meta?",
    answer: "Nein, es handelt sich um eine unabhängige technische Umsetzung.",
  },
];

const initialForm = {
  email: "",
  business_numbers_text: "",
  package_type: "",
  name_company: "",
  accept_guarantee_terms: false,
};

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55 },
};

function App() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const maxNumbers = useMemo(() => {
    if (formData.package_type === "lifetime") return 3;
    return 5;
  }, [formData.package_type]);

  const selectedPackageText = useMemo(() => {
    if (formData.package_type === "monthly") return "Monatliches Paket";
    if (formData.package_type === "lifetime") return "Lifetime-Angebot";
    return "Paket auswählen";
  }, [formData.package_type]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const parseBusinessNumbers = (rawValue) =>
    rawValue
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const jumpToForm = (pkgId) => {
    if (pkgId) {
      updateField("package_type", pkgId);
    }
    document.getElementById("anfrageformular")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateForm = () => {
    const nextErrors = {};
    const numbers = parseBusinessNumbers(formData.business_numbers_text);

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }
    if (!formData.package_type) {
      nextErrors.package_type = "Bitte wählen Sie ein Paket aus.";
    }
    if (numbers.length === 0) {
      nextErrors.business_numbers_text = "Bitte mindestens eine betroffene Rufnummer eingeben.";
    } else {
      if (numbers.length > maxNumbers) {
        nextErrors.business_numbers_text = `Für dieses Paket sind maximal ${maxNumbers} Rufnummern erlaubt.`;
      }
      const invalidNumber = numbers.find((number) => number.length < 6 || number.length > 30);
      if (invalidNumber) {
        nextErrors.business_numbers_text = "Jede Rufnummer muss zwischen 6 und 30 Zeichen lang sein.";
      }
    }
    if (!formData.accept_guarantee_terms) {
      nextErrors.accept_guarantee_terms = "Bitte bestätigen Sie die Garantiebedingungen.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Bitte prüfen Sie Ihre Angaben im Formular.");
      return;
    }

    const businessNumbers = parseBusinessNumbers(formData.business_numbers_text);
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/inquiries`, {
        email: formData.email,
        business_numbers: businessNumbers,
        package_type: formData.package_type,
        name_company: formData.name_company,
        accept_guarantee_terms: formData.accept_guarantee_terms,
      });
      setSubmittedCount(businessNumbers.length);
      setIsSubmitted(true);
      toast.success("Anfrage für API-Einstellung und Anleitung erfolgreich gesendet.");
    } catch (error) {
      const message = error?.response?.data?.detail || "Fehler beim Senden. Bitte erneut versuchen.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-page" data-testid="landing-page-root">
      <Toaster />
      <header className="sticky-header" data-testid="sticky-header">
        <div className="container-main nav-wrap">
          <div className="brand-pill" data-testid="brand-pill">
            WhatsApp Business Stabilitätslösung
          </div>
          <Button
            data-testid="nav-cta-button"
            className="cta-dark"
            onClick={() => jumpToForm()}
          >
            Lösung anfordern
          </Button>
        </div>
      </header>

      <main>
        <motion.section className="section hero-section" {...sectionMotion}>
          <div className="container-main hero-grid">
            <div>
              <p className="overline" data-testid="hero-overline">Technische Umsetzung für Unternehmen</p>
              <h1 className="hero-title" data-testid="hero-title">
                WhatsApp Business stabil nutzen – auch bei hohem Nachrichtenvolumen
              </h1>
              <p className="hero-subtitle" data-testid="hero-subtitle">
                Eine neue technische Umsetzung für Unternehmen, Dienstleister und Teams, die WhatsApp Business intensiv nutzen.
              </p>
              <div className="hero-actions">
                <Button
                  data-testid="hero-main-cta-button"
                  className="cta-dark"
                  onClick={() => jumpToForm()}
                >
                  Lösung anfordern
                </Button>
                <Button
                  data-testid="hero-secondary-cta-button"
                  variant="outline"
                  className="cta-light"
                  onClick={() => jumpToForm()}
                >
                  QR-Code Bereich öffnen
                </Button>
              </div>
            </div>

            <div className="hero-visuals">
              <div className="tech-card" data-testid="hero-tech-card">
                <ServerCog size={34} />
                <h3 data-testid="hero-tech-card-title">API-Stabilitäts-Setup</h3>
                <p data-testid="hero-tech-card-text">
                  Für Teams mit hohem Nachrichtenvolumen und klaren Versandprozessen.
                </p>
              </div>
              <div className="qr-card" data-testid="qr-placeholder-card">
                <QrCode size={72} />
                <p data-testid="qr-placeholder-text">QR-Code Platzhalter</p>
                <span data-testid="qr-placeholder-subtext">Scan öffnet direkt das Anfrageformular</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion}>
          <div className="container-main">
            <div className="notice-banner" data-testid="whatsapp-business-only-notice">
              <AlertTriangle size={18} />
              <span>Diese Lösung ist ausschließlich für WhatsApp Business gedacht.</span>
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion}>
          <div className="container-main split-grid">
            <article className="info-card" data-testid="problem-section">
              <div className="icon-title-row"><MessageSquareWarning size={20} /><span>Problem</span></div>
              <h2 className="section-heading">Das Risiko bei hohem Nachrichtenaufkommen</h2>
              <p className="body-text">
                Unternehmen riskieren bei hohen Versandmengen Einschränkungen, automatische Spam-Einstufungen oder Sperrungen — selbst wenn die Nutzung geschäftlich legitim ist.
              </p>
            </article>
            <article className="info-card" data-testid="solution-section">
              <div className="icon-title-row"><ServerCog size={20} /><span>Lösung</span></div>
              <h2 className="section-heading">Die technische Umsetzung</h2>
              <p className="body-text">
                Die Lösung arbeitet mit strukturierter Nachrichtenlogik, kontrollierten Abläufen und einem definierten Versandrahmen, um Stabilität im Business-Einsatz zu sichern.
              </p>
            </article>
          </div>
        </motion.section>

        <motion.section className="section guarantee-wrap" {...sectionMotion}>
          <div className="container-main" data-testid="guarantee-section">
            <div className="guarantee-card">
              <div className="badge-row" data-testid="guarantee-badge">
                <ShieldCheck size={16} /> Stabilitäts-Garantie
              </div>
              <h2 className="section-heading">Bis zu 10.000 Nachrichten pro Tag</h2>
              <p className="body-text" data-testid="guarantee-main-text">
                Die Stabilitäts-Garantie gilt fiktiv bis zu 10.000 ausgehenden Nachrichten pro Tag.
              </p>
              <p className="body-text" data-testid="guarantee-detail-text">
                Bei korrekter Anwendung schützt die technische Umsetzung innerhalb dieses Limits davor, dass WhatsApp Business allein wegen hoher Nachrichtenmenge oder automatischer Spam-Einstufung gesperrt wird.
              </p>
              <ul className="guarantee-conditions" data-testid="guarantee-conditions-list">
                <li>ausschließlich WhatsApp Business</li>
                <li>korrekte Anwendung der Anleitung</li>
                <li>maximal 10.000 ausgehende Nachrichten pro Tag</li>
                <li>Nutzung auf Dienstleistungs- oder Business-Ebene</li>
                <li>keine strafrechtliche Meldung gegen die Nutzung</li>
                <li>kein aktiver und regelmäßiger Verstoß gegen WhatsApp-AGB</li>
                <li>korrekte Angabe der betroffenen Rufnummer</li>
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion}>
          <div className="container-main">
            <h2 className="section-heading centered">Pakete</h2>
            <div className="pricing-grid" data-testid="pricing-section">
              {packageOptions.map((pkg) => (
                <article
                  key={pkg.id}
                  data-testid={`pricing-card-${pkg.id}`}
                  className={`pricing-card ${pkg.highlight ? "pricing-card-highlight" : ""}`}
                >
                  {pkg.highlight && <span className="tag" data-testid="recommended-tag">Beliebt</span>}
                  <h3 className="pricing-title">{pkg.title}</h3>
                  <p className="pricing-price" data-testid={`price-${pkg.id}`}>{pkg.price}</p>
                  <p className="pricing-period">{pkg.period}</p>
                  <p className="body-text">{pkg.feature}</p>
                  <Button
                    data-testid={`package-cta-${pkg.id}`}
                    className="cta-dark w-full"
                    onClick={() => jumpToForm(pkg.id)}
                  >
                    {pkg.cta}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="section" id="anfrageformular" {...sectionMotion}>
          <div className="container-main form-wrap" data-testid="inquiry-form-section">
            <h2 className="section-heading">API-Einstellung und Anleitung anfordern</h2>
            {!isSubmitted ? (
              <form className="form-grid" onSubmit={submitForm} data-testid="inquiry-form">
                <div>
                  <label className="label" htmlFor="email">E-Mail-Adresse</label>
                  <Input
                    id="email"
                    data-testid="inquiry-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="name@firma.de"
                    className="input-soft"
                  />
                  {errors.email && <p className="error-text" data-testid="error-email">{errors.email}</p>}
                </div>

                <div>
                  <label className="label" htmlFor="businessNumbers">Betroffene WhatsApp-Business-Rufnummern</label>
                  <Textarea
                    id="businessNumbers"
                    data-testid="inquiry-business-numbers-input"
                    value={formData.business_numbers_text}
                    onChange={(e) => updateField("business_numbers_text", e.target.value)}
                    placeholder="Eine Nummer pro Zeile oder kommagetrennt, z. B. +49..., +49..."
                    className="input-soft textarea-soft"
                  />
                  <p className="helper-text" data-testid="business-numbers-helper-text">
                    Aktuelles Limit: maximal {maxNumbers} Rufnummern für das gewählte Paket.
                  </p>
                  {errors.business_numbers_text && (
                    <p className="error-text" data-testid="error-business-numbers">{errors.business_numbers_text}</p>
                  )}
                </div>

                <div>
                  <label className="label">Paket auswählen</label>
                  <Select
                    value={formData.package_type}
                    onValueChange={(value) => updateField("package_type", value)}
                  >
                    <SelectTrigger data-testid="inquiry-package-select-trigger" className="input-soft">
                      <SelectValue placeholder={selectedPackageText} />
                    </SelectTrigger>
                    <SelectContent data-testid="inquiry-package-select-content">
                      <SelectItem data-testid="inquiry-package-monthly-option" value="monthly">
                        Monatliches Paket – 149,99 € / Monat
                      </SelectItem>
                      <SelectItem data-testid="inquiry-package-lifetime-option" value="lifetime">
                        Lifetime-Angebot – 699 € einmalig
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.package_type && (
                    <p className="error-text" data-testid="error-package-type">{errors.package_type}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="companyName">Optional Name / Firma</label>
                  <Input
                    id="companyName"
                    data-testid="inquiry-name-company-input"
                    type="text"
                    value={formData.name_company}
                    onChange={(e) => updateField("name_company", e.target.value)}
                    placeholder="z. B. Muster GmbH"
                    className="input-soft"
                  />
                </div>

                <div className="terms-row" data-testid="inquiry-terms-row">
                  <Checkbox
                    id="terms"
                    data-testid="inquiry-terms-checkbox"
                    checked={formData.accept_guarantee_terms}
                    onCheckedChange={(checked) =>
                      updateField("accept_guarantee_terms", Boolean(checked))
                    }
                  />
                  <label htmlFor="terms" className="terms-label">
                    Ich akzeptiere die Garantiebedingungen.
                  </label>
                </div>
                {errors.accept_guarantee_terms && (
                  <p className="error-text" data-testid="error-terms">{errors.accept_guarantee_terms}</p>
                )}

                <Button
                  data-testid="inquiry-submit-button"
                  disabled={isSubmitting}
                  className="cta-dark submit-btn"
                  type="submit"
                >
                  {isSubmitting ? "Wird gesendet ..." : "API-Einstellung und Anleitung anfordern"}
                </Button>
              </form>
            ) : (
              <div className="success-card" data-testid="inquiry-success-message">
                <CircleCheck size={30} />
                <h3>Vielen Dank! Ihre Anfrage ist eingegangen.</h3>
                <p>
                  Ihre Anfrage wurde mit {submittedCount} betroffenen Rufnummern gespeichert. Sie erhalten die Zahlungsaufforderung in Kürze per E-Mail. Nach Zahlungseingang folgt die Anleitung per E-Mail.
                </p>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion}>
          <div className="container-main" data-testid="process-section">
            <h2 className="section-heading">So läuft es ab</h2>
            <div className="steps-grid">
              {processSteps.map((step, idx) => (
                <article className="step-card" key={step} data-testid={`process-step-${idx + 1}`}>
                  <div className="step-index">{idx + 1}</div>
                  <p>{step}</p>
                </article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion}>
          <div className="container-main faq-wrap" data-testid="faq-section">
            <h2 className="section-heading">FAQ</h2>
            <Accordion type="single" collapsible className="faq-accordion" data-testid="faq-accordion">
              {faqItems.map((item, idx) => (
                <AccordionItem key={item.question} value={`item-${idx}`}>
                  <AccordionTrigger data-testid={`faq-question-${idx + 1}`} className="faq-trigger">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent data-testid={`faq-answer-${idx + 1}`} className="faq-answer">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.section>
      </main>

      <footer className="footer" data-testid="legal-footer">
        <div className="container-main footer-wrap">
          <p data-testid="footer-copy">© {new Date().getFullYear()} WhatsApp Business Stabilitätslösung</p>
          <nav className="footer-links" data-testid="footer-links">
            {["Impressum", "Datenschutz", "AGB", "Garantiebedingungen", "Kontakt"].map((link) => (
              <button
                type="button"
                className="footer-link"
                data-testid={`footer-link-${link.toLowerCase().replace(/\s+/g, "-")}`}
                key={link}
                aria-disabled="true"
              >
                {link}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default App;
