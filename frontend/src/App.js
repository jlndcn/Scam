import { useEffect, useMemo, useState } from "react";
import "@/App.css";
import axios from "axios";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Cable,
  CheckCircle2,
  Database,
  MessageSquareText,
  ServerCog,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Activity,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    title: "Monatszugang",
    price: "150 € / Monat",
    period: "pro Monat",
    description:
      "Für Unternehmen, die die WhatsApp-Business-Anbindung flexibel monatlich nutzen möchten.",
    featureList: [
      "Imaginärer API-Zugang",
      "PDF-Anleitung per E-Mail",
      "Einbindung bestehender Rufnummer",
      "24/7 E-Mail-Support",
      "Antwortzeit 1–2 Werktage",
      "30 Tage Geld-zurück-Garantie",
    ],
    cta: "Monatszugang anfragen",
    highlight: false,
  },
  {
    id: "lifetime",
    title: "Lifetime Zugang",
    price: "600 € einmalig",
    period: "einmalig",
    description:
      "Für Unternehmen, die langfristig mit einer vorbereiteten WhatsApp-Business-Anbindung arbeiten möchten.",
    featureList: [
      "Einmalige Zahlung",
      "Dauerhafter imaginärer API-Zugang",
      "PDF-Anleitung per E-Mail",
      "API-Schlüssel nach Zahlungsbearbeitung",
      "Einbindung bestehender Rufnummern",
      "24/7 E-Mail-Support",
      "Antwortzeit 1–2 Werktage",
      "30 Tage Geld-zurück-Garantie",
    ],
    cta: "Lifetime Zugang sichern",
    highlight: true,
  },
];

const processSteps = [
  { no: "01", text: "Formular ausfüllen" },
  { no: "02", text: "Angaben und Rufnummern prüfen" },
  { no: "03", text: "Zahlung bearbeiten" },
  { no: "04", text: "PDF-Anleitung und API-Schlüssel per E-Mail erhalten" },
  { no: "05", text: "API-Schlüssel gemäß Anleitung einpflegen" },
];

const faqItems = [
  {
    question: "Brauche ich bereits einen WhatsApp Business Account?",
    answer:
      "Ja. Für die Einrichtung muss bereits ein WhatsApp Business Account mit der jeweiligen Rufnummer bestehen.",
  },
  {
    question: "Welche Daten muss ich angeben?",
    answer:
      "Benötigt werden Name oder Firma, E-Mail-Adresse, WhatsApp Business Account Name, Rufnummer oder Rufnummern, gewünschtes Paket und das geplante Nachrichtenvolumen.",
  },
  {
    question: "Wann erhalte ich den API-Schlüssel?",
    answer:
      "Nach Bearbeitung der Zahlung erhalten Sie per E-Mail eine PDF-Anleitung, den API-Schlüssel und eine Beschreibung zur Einpflege.",
  },
  {
    question: "Darf ich nach der Einrichtung Einstellungen selbst ändern?",
    answer:
      "Es wird empfohlen, keine eigenständigen Änderungen an relevanten WhatsApp-Business-Einstellungen vorzunehmen, da dies zu Ausfällen, Störungen oder fehlerhafter Zustellung führen kann.",
  },
  {
    question: "Gibt es Support?",
    answer:
      "Ja. Es gibt 24/7 E-Mail-Support. Die reguläre Antwortzeit beträgt in der Regel 1–2 Werktage.",
  },
  {
    question: "Gibt es eine Garantie?",
    answer: "Ja. Es gilt eine 30 Tage Geld-zurück-Garantie.",
  },
];

const initialForm = {
  email: "",
  business_account_name: "",
  phone_numbers_text: "",
  package_type: "",
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
  const [submitFeedback, setSubmitFeedback] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);
  const [showMobileCta, setShowMobileCta] = useState(true);
  const [stickyCtaVariant, setStickyCtaVariant] = useState("A");
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.35], [0, shouldReduceMotion ? 0 : -25]);

  useEffect(() => {
    const savedVariant = localStorage.getItem("sticky_cta_variant");
    if (savedVariant === "A" || savedVariant === "B") {
      setStickyCtaVariant(savedVariant);
      return;
    }

    const randomVariant = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem("sticky_cta_variant", randomVariant);
    setStickyCtaVariant(randomVariant);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleMobileCtaVisibility = () => {
      const currentY = window.scrollY;
      const isMobile = window.innerWidth <= 768;

      if (!isMobile) {
        setShowMobileCta(false);
        return;
      }

      if (currentY < 120) {
        setShowMobileCta(true);
        lastY = currentY;
        return;
      }

      if (currentY > lastY + 6) {
        setShowMobileCta(false);
      } else if (currentY < lastY - 6) {
        setShowMobileCta(true);
      }

      lastY = currentY;
    };

    handleMobileCtaVisibility();
    window.addEventListener("scroll", handleMobileCtaVisibility, { passive: true });
    window.addEventListener("resize", handleMobileCtaVisibility);

    return () => {
      window.removeEventListener("scroll", handleMobileCtaVisibility);
      window.removeEventListener("resize", handleMobileCtaVisibility);
    };
  }, []);

  const maxNumbers = useMemo(() => {
    if (formData.package_type === "lifetime") return 3;
    return 5;
  }, [formData.package_type]);

  const selectedPackageText = useMemo(() => {
    if (formData.package_type === "monthly") return "Monatszugang";
    if (formData.package_type === "lifetime") return "Lifetime Zugang";
    return "Paket auswählen";
  }, [formData.package_type]);

  const stickyCtaText = useMemo(() => {
    if (stickyCtaVariant === "B") {
      return {
        primary: "Kostenlose Erstprüfung starten",
        secondary: "Passendes Paket finden",
      };
    }
    return {
      primary: "API-Zugang anfragen",
      secondary: "Pakete ansehen",
    };
  }, [stickyCtaVariant]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const parseBusinessNumbers = (rawValue) =>
    rawValue
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToForm = (pkgId) => {
    if (pkgId) {
      updateField("package_type", pkgId);
    }
    document.getElementById("anfrageformular")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateForm = () => {
    const nextErrors = {};
    const numbers = parseBusinessNumbers(formData.phone_numbers_text);

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }
    if (!formData.business_account_name.trim()) {
      nextErrors.business_account_name = "Bitte den WhatsApp Business Account Name angeben.";
    }
    if (!formData.package_type) {
      nextErrors.package_type = "Bitte wählen Sie ein Paket aus.";
    }
    if (numbers.length === 0) {
      nextErrors.phone_numbers_text = "Bitte mindestens eine betroffene Rufnummer eingeben.";
    } else {
      if (numbers.length > maxNumbers) {
        nextErrors.phone_numbers_text = `Für dieses Paket sind maximal ${maxNumbers} Rufnummern erlaubt.`;
      }
      const invalidNumber = numbers.find((number) => number.length < 6 || number.length > 30);
      if (invalidNumber) {
        nextErrors.phone_numbers_text = "Jede Rufnummer muss zwischen 6 und 30 Zeichen lang sein.";
      }
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

    const businessNumbers = parseBusinessNumbers(formData.phone_numbers_text);
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/inquiries`, {
        email: formData.email,
        business_account_name: formData.business_account_name,
        phone_numbers: businessNumbers,
        package_type: formData.package_type,
      });

      const emailDeliveryStatus = response?.data?.email_delivery_status;
      setSubmittedCount(businessNumbers.length);

      if (emailDeliveryStatus === "sent") {
        setSubmitFeedback(
          "Vielen Dank. Ihre Anfrage wurde übermittelt. Wir prüfen Ihre Angaben und senden Ihnen anschließend per E-Mail die weiteren Informationen sowie die Zahlungsaufforderung."
        );
        toast.success("Anfrage übermittelt.");
      } else {
        setSubmitFeedback(
          "Ihre Anfrage wurde gespeichert. Sollte es Rückfragen geben, melden wir uns per E-Mail bei Ihnen."
        );
        toast.success("Anfrage gespeichert.");
      }

      setIsSubmitted(true);
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

          <nav className="top-nav-links" data-testid="top-navigation-links">
            {[
              { label: "Vorteile", id: "vorteile" },
              { label: "Pakete", id: "pakete" },
              { label: "Ablauf", id: "ablauf" },
              { label: "FAQ", id: "faq" },
              { label: "Kontakt", id: "kontakt" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className="nav-link-button"
                data-testid={`nav-link-${item.id}`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <Button data-testid="nav-cta-button" className="cta-dark" onClick={() => jumpToForm()}>
            API-Zugang anfragen
          </Button>
        </div>
      </header>

      <main>
        <motion.section className="section hero-section" {...sectionMotion}>
          <div className="container-main hero-grid">
            <div>
              <p className="hero-kicker" data-testid="hero-overline">Sperr-Risiken reduzieren – WhatsApp Business stabil und professionell nutzen.</p>
              <h1 className="hero-title" data-testid="hero-title">
                WhatsApp Business stabil nutzen – auch bei hohem Nachrichtenvolumen
              </h1>
              <p className="hero-subtitle" data-testid="hero-subtitle">
                Professionelle Einbindung in ein Unternehmensnetzwerk mit strukturiertem WhatsApp-Datenfluss, verifizierten Business-Daten und einer imaginären API-Anbindung für skalierbare Kundenkommunikation.
              </p>
              <div className="hero-actions">
                <Button
                  data-testid="hero-main-cta-button"
                  className="cta-dark"
                  onClick={() => jumpToForm()}
                >
                  API-Zugang anfragen
                </Button>
                <Button
                  data-testid="hero-secondary-cta-button"
                  variant="outline"
                  className="cta-light"
                  onClick={() => scrollToSection("pakete")}
                >
                  Pakete ansehen
                </Button>
              </div>
            </div>

            <motion.div className="hero-visuals" style={{ y: heroParallax }} data-testid="hero-dashboard-mockup">
              <div className="mockup-header-row">
                <div className="mockup-pill" data-testid="mockup-business-connected-status">
                  <CheckCircle2 size={14} /> Business Account verbunden
                </div>
                <div className="mockup-pill muted" data-testid="mockup-delivery-status">
                  Zustellstatus: Stabil
                </div>
              </div>

              <div className="tech-card" data-testid="hero-chat-simulation-card">
                <div className="chat-row incoming">
                  <MessageSquareText size={16} /> Kunde: Gibt es ein Update?
                </div>
                <div className="chat-row outgoing">
                  Support: Anfrage verarbeitet, Status in Prüfung.
                </div>

                <div className="kpi-grid" data-testid="hero-kpi-cards">
                  <div className="kpi-card"><span>KPI</span><strong>98.6%</strong><p>Zustellung</p></div>
                  <div className="kpi-card"><span>API</span><strong>Live</strong><p>Business Flow</p></div>
                </div>

                <div className="api-key-preview" data-testid="mockup-api-key-preview">
                  <KeyRound size={14} /> API Key: waba_live_x7f2•••••••
                </div>

                <div className="dataflow-row" data-testid="mockup-dataflow-visual">
                  <Database size={16} />
                  <ArrowRight size={14} />
                  <Cable size={16} />
                  <ArrowRight size={14} />
                  <Activity size={16} />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion} id="vorteile">
          <div className="container-main">
            <div className="notice-banner" data-testid="whatsapp-business-only-notice">
              <AlertTriangle size={18} />
              <span>
                Wichtig: Für die Einrichtung muss bereits ein WhatsApp Business Account mit der jeweiligen Rufnummer bestehen.
              </span>
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion}>
          <div className="container-main split-grid three-col-grid">
            <article className="info-card" data-testid="problem-section">
              <div className="icon-title-row"><Database size={20} /><span>Core</span></div>
              <h2 className="section-heading">Strukturierter Datenfluss</h2>
              <p className="body-text">
                Die Anbindung wird so vorbereitet, dass Nachrichten über eine saubere, nachvollziehbare Struktur verarbeitet werden. Dadurch wird die Zustellung professioneller organisiert und typische Probleme durch fehlerhafte Einstellungen oder unklare Absenderdaten werden reduziert.
              </p>
            </article>
            <article className="info-card" data-testid="solution-section">
              <div className="icon-title-row"><ServerCog size={20} /><span>Lösung</span></div>
              <h2 className="section-heading">Verifizierte Business-Daten</h2>
              <p className="body-text">
                Für eine stabile Nutzung werden die vorhandenen WhatsApp-Business-Daten, Rufnummern und sichtbaren Profileinstellungen berücksichtigt. Ziel ist eine seriöse und konsistente Unternehmenskommunikation.
              </p>
            </article>
            <article className="info-card" data-testid="api-integration-section">
              <div className="icon-title-row"><Cable size={20} /><span>Output</span></div>
              <h2 className="section-heading">Imaginäre API-Anbindung</h2>
              <p className="body-text">
                Nach erfolgreicher Bearbeitung erhalten Kunden einen individuellen API-Schlüssel, eine PDF-Anleitung und eine Beschreibung zur Einpflege der Daten in das vorgesehene System.
              </p>
            </article>
          </div>
        </motion.section>

        <motion.section className="section guarantee-wrap" {...sectionMotion}>
          <div className="container-main" data-testid="guarantee-section">
            <div className="guarantee-card">
              <div className="badge-row" data-testid="guarantee-badge">
                <ShieldCheck size={16} /> Leistungsbeschreibung
              </div>
              <h2 className="section-heading">Professionelle WhatsApp-Business-Anbindung für Unternehmen</h2>
              <p className="body-text" data-testid="guarantee-main-text">
                Die Leistung umfasst die Einbindung eines bestehenden WhatsApp Business Accounts in ein vorbereitetes Unternehmensnetzwerk mit strukturiertem, verifiziertem Datenfluss. Die Einrichtung ist darauf ausgelegt, die Kommunikation sauberer, stabiler und nachvollziehbarer zu machen. Dabei werden Rufnummern, Account-Name, Sichtbarkeitseinstellungen und Kontaktdaten geprüft, damit die spätere Nutzung technisch sauber vorbereitet ist.
              </p>
              <ul className="guarantee-conditions" data-testid="guarantee-conditions-list">
                <li>Einbindung eines bestehenden WhatsApp Business Accounts</li>
                <li>Nutzung eines individuellen API-Schlüssels</li>
                <li>PDF-Anleitung nach Zahlungseingang</li>
                <li>Beschreibung zur Einpflege des API-Schlüssels</li>
                <li>Strukturierter WhatsApp-Datenfluss</li>
                <li>Vorbereitung für hohe Nachrichtenvolumen</li>
                <li>24/7 E-Mail-Support</li>
                <li>Antwortzeit im Support in der Regel 1–2 Werktage</li>
                <li>30 Tage Geld-zurück-Garantie</li>
              </ul>
              <p className="warning-note" data-testid="post-setup-warning">
                Es wird empfohlen, nach der Einrichtung keine eigenständigen Änderungen an den relevanten WhatsApp-Business-Einstellungen vorzunehmen, um Störungen, Ausfälle oder fehlerhafte Zustellungen zu vermeiden.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion} id="pakete">
          <div className="container-main" data-testid="pricing-section">
            <h2 className="section-heading centered">Pakete</h2>
            <div className="pricing-grid">
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
                  <p className="body-text">{pkg.description}</p>
                  <ul className="package-list" data-testid={`package-list-${pkg.id}`}>
                    {pkg.featureList.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
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
          <div className="container-main form-wrap compact-form" data-testid="inquiry-form-section">
            <h2 className="section-heading">API-Zugang anfragen</h2>
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
                  <label className="label" htmlFor="businessAccountName">WhatsApp Business Account Name</label>
                  <Input
                    id="businessAccountName"
                    data-testid="inquiry-business-account-name-input"
                    type="text"
                    value={formData.business_account_name}
                    onChange={(e) => updateField("business_account_name", e.target.value)}
                    placeholder="z. B. Firma Support"
                    className="input-soft"
                  />
                  {errors.business_account_name && (
                    <p className="error-text" data-testid="error-business-account-name">{errors.business_account_name}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="businessNumbers">Rufnummer oder Rufnummern</label>
                  <Textarea
                    id="businessNumbers"
                    data-testid="inquiry-phone-numbers-input"
                    value={formData.phone_numbers_text}
                    onChange={(e) => updateField("phone_numbers_text", e.target.value)}
                    placeholder="Eine Nummer pro Zeile oder kommagetrennt, z. B. +49..., +49..."
                    className="input-soft textarea-soft"
                  />
                  <p className="helper-text" data-testid="business-numbers-helper-text">
                    Aktuelles Limit: maximal {maxNumbers} Rufnummern für das gewählte Paket.
                  </p>
                  {errors.phone_numbers_text && (
                    <p className="error-text" data-testid="error-phone-numbers">{errors.phone_numbers_text}</p>
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
                        Monatszugang – 150 € / Monat
                      </SelectItem>
                      <SelectItem data-testid="inquiry-package-lifetime-option" value="lifetime">
                        Lifetime Zugang – 600 € einmalig
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.package_type && (
                    <p className="error-text" data-testid="error-package-type">{errors.package_type}</p>
                  )}
                </div>

                <Button
                  data-testid="inquiry-submit-button"
                  disabled={isSubmitting}
                  className="cta-dark submit-btn"
                  type="submit"
                >
                  {isSubmitting ? "Wird gesendet ..." : "Anfrage absenden"}
                </Button>

                <p className="form-hint" data-testid="form-submission-hint">
                  Nach dem Absenden prüfen wir Ihre Angaben und senden Ihnen anschließend die weiteren Informationen sowie die Zahlungsaufforderung per E-Mail.
                </p>
              </form>
            ) : (
              <div className="success-card" data-testid="inquiry-success-message">
                <CheckCircle2 size={30} />
                <h3>Vielen Dank! Ihre Anfrage ist eingegangen.</h3>
                <p>{submitFeedback}</p>
                <p className="success-count" data-testid="saved-phone-count">Gespeicherte Rufnummern: {submittedCount}</p>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion} id="ablauf">
          <div className="container-main" data-testid="process-section">
            <h2 className="section-heading">So läuft es ab</h2>
            <div className="steps-grid">
              {processSteps.map((step, idx) => (
                <article className="step-card" key={step.no} data-testid={`process-step-${idx + 1}`}>
                  <div className="step-index">{step.no}</div>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion} id="kontakt">
          <div className="container-main support-card" data-testid="support-security-section">
            <div className="badge-row"><Mail size={15} /> Support und Sicherheit</div>
            <h2 className="section-heading">Support und Sicherheit</h2>
            <p className="body-text">
              Kunden erhalten 24/7 E-Mail-Support. Die reguläre Antwortzeit beträgt in der Regel 1–2 Werktage. Zusätzlich gilt eine 30 Tage Geld-zurück-Garantie.
            </p>
          </div>
        </motion.section>

        <motion.section className="section" {...sectionMotion} id="faq">
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

      <div
        className={`mobile-sticky-cta ${showMobileCta ? "visible" : "hidden"}`}
        data-testid="mobile-sticky-cta-bar"
        data-variant={stickyCtaVariant}
      >
        <button
          type="button"
          className="mobile-sticky-cta-btn primary"
          data-testid="mobile-sticky-primary-cta"
          onClick={() => jumpToForm()}
        >
          {stickyCtaText.primary}
        </button>
        <button
          type="button"
          className="mobile-sticky-cta-btn secondary"
          data-testid="mobile-sticky-secondary-cta"
          onClick={() => scrollToSection("pakete")}
        >
          {stickyCtaText.secondary}
        </button>
      </div>

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
          <p className="footer-note" data-testid="footer-note">
            Professionelle WhatsApp-Business-Anbindung für Unternehmen mit hohem Nachrichtenvolumen.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
