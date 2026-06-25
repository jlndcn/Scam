import { useMemo, useState } from "react";
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
  { no: "09", text: "Formular ausfüllen" },
  { no: "10", text: "Angaben und Rufnummern prüfen" },
  { no: "11", text: "Zahlung bearbeiten" },
  { no: "12", text: "PDF-Anleitung und API-Schlüssel per E-Mail erhalten" },
  { no: "13", text: "API-Schlüssel gemäß Anleitung einpflegen" },
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
  name_company: "",
  email: "",
  business_account_name: "",
  phone_numbers_text: "",
  package_type: "",
  estimated_volume: "",
  project_message: "",
  confirm_business_account_exists: false,
  confirm_privacy_visibility_settings: false,
  confirm_payment_delivery_process_understood: false,
  confirm_no_independent_changes: false,
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
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.35], [0, shouldReduceMotion ? 0 : -25]);

  const maxNumbers = useMemo(() => {
    if (formData.package_type === "lifetime") return 3;
    return 5;
  }, [formData.package_type]);

  const selectedPackageText = useMemo(() => {
    if (formData.package_type === "monthly") return "Monatszugang";
    if (formData.package_type === "lifetime") return "Lifetime Zugang";
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

    if (!formData.name_company.trim()) {
      nextErrors.name_company = "Bitte Name oder Firma eingeben.";
    }
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
    if (!formData.estimated_volume.trim()) {
      nextErrors.estimated_volume = "Bitte das geschätzte Nachrichtenvolumen angeben.";
    }
    if (!formData.project_message.trim()) {
      nextErrors.project_message = "Bitte eine kurze Nachricht oder Projektbeschreibung eingeben.";
    }

    const requiredCheckboxes = [
      "confirm_business_account_exists",
      "confirm_privacy_visibility_settings",
      "confirm_payment_delivery_process_understood",
      "confirm_no_independent_changes",
    ];

    requiredCheckboxes.forEach((key) => {
      if (!formData[key]) {
        nextErrors[key] = "Bitte diese Bestätigung aktivieren.";
      }
    });

    if (
      !formData.confirm_business_account_exists ||
      !formData.confirm_privacy_visibility_settings ||
      !formData.confirm_payment_delivery_process_understood ||
      !formData.confirm_no_independent_changes
    ) {
      nextErrors.confirmations = "Bitte alle Pflichtbestätigungen aktivieren.";
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
        name_company: formData.name_company,
        email: formData.email,
        business_account_name: formData.business_account_name,
        phone_numbers: businessNumbers,
        package_type: formData.package_type,
        estimated_volume: formData.estimated_volume,
        project_message: formData.project_message,
        confirm_business_account_exists: formData.confirm_business_account_exists,
        confirm_privacy_visibility_settings: formData.confirm_privacy_visibility_settings,
        confirm_payment_delivery_process_understood:
          formData.confirm_payment_delivery_process_understood,
        confirm_no_independent_changes: formData.confirm_no_independent_changes,
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
              <p className="overline" data-testid="hero-overline">Technische Umsetzung für Unternehmen</p>
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
          <div className="container-main form-wrap" data-testid="inquiry-form-section">
            <h2 className="section-heading">API-Zugang anfragen</h2>
            {!isSubmitted ? (
              <form className="form-grid" onSubmit={submitForm} data-testid="inquiry-form">
                <div>
                  <label className="label" htmlFor="nameCompany">Name / Firma</label>
                  <Input
                    id="nameCompany"
                    data-testid="inquiry-name-company-input"
                    type="text"
                    value={formData.name_company}
                    onChange={(e) => updateField("name_company", e.target.value)}
                    placeholder="z. B. Muster GmbH"
                    className="input-soft"
                  />
                  {errors.name_company && <p className="error-text" data-testid="error-name-company">{errors.name_company}</p>}
                </div>

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

                <div>
                  <label className="label" htmlFor="estimatedVolume">Geschätztes Nachrichtenvolumen</label>
                  <Input
                    id="estimatedVolume"
                    data-testid="inquiry-estimated-volume-input"
                    type="text"
                    value={formData.estimated_volume}
                    onChange={(e) => updateField("estimated_volume", e.target.value)}
                    placeholder="z. B. 5.000 Nachrichten / Tag"
                    className="input-soft"
                  />
                  {errors.estimated_volume && (
                    <p className="error-text" data-testid="error-estimated-volume">{errors.estimated_volume}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="projectMessage">Nachricht / Projektbeschreibung</label>
                  <Textarea
                    id="projectMessage"
                    data-testid="inquiry-project-message-input"
                    value={formData.project_message}
                    onChange={(e) => updateField("project_message", e.target.value)}
                    placeholder="Kurz beschreiben, was eingebunden werden soll"
                    className="input-soft textarea-soft"
                  />
                  {errors.project_message && (
                    <p className="error-text" data-testid="error-project-message">{errors.project_message}</p>
                  )}
                </div>

                <div className="terms-row" data-testid="inquiry-terms-row">
                  <Checkbox
                    id="confirmBusinessAccount"
                    data-testid="confirm-business-account-checkbox"
                    checked={formData.confirm_business_account_exists}
                    onCheckedChange={(checked) =>
                      updateField("confirm_business_account_exists", Boolean(checked))
                    }
                  />
                  <label htmlFor="confirmBusinessAccount" className="terms-label">
                    Ich bestätige, dass bereits ein WhatsApp Business Account mit der angegebenen Rufnummer besteht.
                  </label>
                </div>

                <div className="terms-row" data-testid="privacy-settings-row">
                  <Checkbox
                    id="confirmPrivacySettings"
                    data-testid="confirm-privacy-settings-checkbox"
                    checked={formData.confirm_privacy_visibility_settings}
                    onCheckedChange={(checked) =>
                      updateField("confirm_privacy_visibility_settings", Boolean(checked))
                    }
                  />
                  <label htmlFor="confirmPrivacySettings" className="terms-label">
                    Ich bestätige, dass die relevanten Datenschutz- und Sichtbarkeitseinstellungen des WhatsApp Business Accounts für die Einrichtung auf sichtbar gestellt werden.
                  </label>
                </div>

                <div className="terms-row" data-testid="payment-process-row">
                  <Checkbox
                    id="confirmPaymentProcess"
                    data-testid="confirm-payment-process-checkbox"
                    checked={formData.confirm_payment_delivery_process_understood}
                    onCheckedChange={(checked) =>
                      updateField("confirm_payment_delivery_process_understood", Boolean(checked))
                    }
                  />
                  <label htmlFor="confirmPaymentProcess" className="terms-label">
                    Ich habe verstanden, dass ich nach Bearbeitung der Zahlung per E-Mail eine PDF-Anleitung, einen API-Schlüssel und eine Beschreibung zur Einpflege erhalte.
                  </label>
                </div>

                <div className="terms-row" data-testid="no-changes-row">
                  <Checkbox
                    id="confirmNoChanges"
                    data-testid="confirm-no-changes-checkbox"
                    checked={formData.confirm_no_independent_changes}
                    onCheckedChange={(checked) =>
                      updateField("confirm_no_independent_changes", Boolean(checked))
                    }
                  />
                  <label htmlFor="confirmNoChanges" className="terms-label">
                    Ich nehme zur Kenntnis, dass eigenständige Änderungen an den Einstellungen nach der Einrichtung zu Ausfällen oder Störungen führen können.
                  </label>
                </div>

                {errors.confirmations && (
                  <p className="error-text" data-testid="error-confirmations">{errors.confirmations}</p>
                )}

                <Button
                  data-testid="inquiry-submit-button"
                  disabled={isSubmitting}
                  className="cta-dark submit-btn"
                  type="submit"
                >
                  {isSubmitting ? "Wird gesendet ..." : "Anfrage absenden"}
                </Button>

                <p className="form-hint" data-testid="form-submission-hint">
                  Nach Absenden des Formulars werden die Angaben geprüft. Nach erfolgreicher Zahlungsbearbeitung erhalten Sie per E-Mail die PDF-Anleitung, den API-Schlüssel und die Beschreibung zur Einrichtung. Bitte nehmen Sie während der Einrichtung keine eigenständigen Änderungen an den WhatsApp-Business-Einstellungen vor.
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
