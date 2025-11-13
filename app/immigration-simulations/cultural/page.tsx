'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SharedDataProvider, useSharedData } from '@/components/shared-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Globe,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  Info,
  Lightbulb,
  BookOpen,
  MapPin,
  Flag,
  Star,
  CheckCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
  Play,
  Bot,
  Send,
  X,
  Plane,
  UtensilsCrossed,
  Languages,
  Sparkles,
  FileText,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { SimulationHeader } from '@/components/SimulationHeader';

interface CulturalInfo {
  country: string;
  category: string;
  title: string;
  description: string;
  content: string;
  tips: string[];
  doAndDont: {
    do: string[];
    dont: string[];
  };
  culturalNorms: {
    greeting: string;
    personalSpace: string;
    communication: string;
    business: string;
    social: string;
  };
  immigrationProcedures?: {
    visaTypes: string[];
    requirements: string[];
    documents: string[];
    process: string[];
    timeline: string;
    costs: string;
    tips: string[];
  };
  importantDates: {
    name: string;
    date: string;
    description: string;
  }[];
  resources: {
    type: 'VIDEO' | 'ARTICLE' | 'BOOK' | 'WEBSITE';
    title: string;
    url: string;
    description: string;
  }[];
}

function CulturalPageContent() {
  const { userProfile } = useSharedData();
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState<string>('FRANCE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ETIQUETTE');
  const [culturalInfo, setCulturalInfo] = useState<CulturalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp?: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  const t_ = (fr: string, en: string) => lang === "fr" ? fr : en;

  const countries = [
    { 
      code: 'FRANCE', 
      name: 'France', 
      region: 'Europe',
      flagImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8GF9tZYvAH58amyyOszVh3WVftqJ_QJ5BBIFz__eCJJFIlyXbq6psODMSvmqBz77KO6416C8ezLvjZTEjgM7XNCR2R6rfXgmx453yz5jlYf9xa_BCtgojmfMUsWRG2yZ3A1WwQpEZhRJH0u3RjKmBFMrYU7anestxjURyAx9FGyHr3ksTho4iFjIXJXqJEts1dCutl7N7NoaZINBsQ9viLDGZkxj0cHc7H4JZ6lzjOJQ-c2Boch6hEdX74gs_A5kHyY5XxDsljrXy'
    },
    { 
      code: 'CANADA', 
      name: 'Canada', 
      region: 'North America',
      flagImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhfLiOIcaTgEYTMjI0_3o5D8dFNc-T55DRRDCmLIte-qb-06Ixf4GilUgL9KzNDH8n5tq0FH26Lxy4jFOtNRKoIqJPfRZKXOKjGLoo3V1RM2RvuOviujDboSTljZtnWdt1lr9DQllwbsotyt_NLp8JIBTtv0HE_M83e7RfStim7M1cflTrtlIYCE1FSCtq3Oz2arFx-hA2APBVjGiug0YQiV-IZPcwZmSPznNojhYMYDZ3yBZUE0KNZmsFbcrTmacY0fUlKF30Lx5x'
    },
    { 
      code: 'SENEGAL', 
      name: 'Senegal', 
      region: 'Africa',
      flagImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0JWiHbxomA-HFCpesYg5i7ioBnayyv5hv1BSxMWjbaPSdx1Q-bdhLhpciB52A-QAO1s8GiIq5iJDighRPIYZRdMfdHdCXJjxieIUJz1H_UH22wM3qvOwm0rcDR8eGDVVOJr8uKYrX-ykbLcPZRJl0cLkTkCUYRWJDD5MqPvJyQf_QwaV40wYXKAQLdhqYTA0MoY_IK0Gm5NOAdYVpP0ZoZYtUBUKIfBym6qGDFQ-2YqP-O6b4HpWhyIHNO1MArkhfNIGtqG3cZZi8'
    },
    { 
      code: 'BELGIUM', 
      name: 'Belgium', 
      region: 'Europe',
      flagImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8YG5V4_3fkMSB32tR9V2sOb2fRYq5kbLxCRuRa4HCl7NFcQArmPb-pwEBihg1F1LwvlDzzN8OiWLRHDnnxuLKyu1kjdd9NxgQr8GudnyZijGsivrEDyVysE1VXdumxWEFd5XaHkMSN-ZTJ30M_-VYu1Q0OeXd5vrU_c4gSSIWl7k5RBEtVhmEca9EM0YQcwI0sxe5-yeuFuR-vujhdVCn9w0cnCxli0W30bXadjI7n8PfF5QUK5CEekmFBu9IKJ1Pksg0msF3vUR9'
    },
    { 
      code: 'SWITZERLAND', 
      name: 'Switzerland', 
      region: 'Europe',
      flagImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu7f6O4ADF234moqluhJlbgH9tpNdBmRoKfCvLv8ZNP4TMlJbP6NZzFR6fYLjkPoAq9JfHfBIdDwBaQ8x2q0xNAo5vwzegx85_3Tgjn_hB6tXn1wed1pe7-WhQMgLEIpSKWRGapwsacVjZoag5oMmwyAPDXkpg84CQLZ-sYjko5yQMDgP7HLNiAgfRWMBpwvcH_OUKbdnqFoqlBOip9GJvuahN4goGuqakHZb91sBNLoYx3G0dJws1Po2PkgJMBlG0g3hNhN39ufrq'
    }
  ];

  const categories = [
    { code: 'TRADITIONS', name: t_('Traditions', 'Traditions'), icon: Sparkles, materialIcon: 'celebration' },
    { code: 'ETIQUETTE', name: t_('Étiquette', 'Etiquette'), icon: Users, materialIcon: 'groups' },
    { code: 'CUISINE', name: t_('Cuisine', 'Cuisine'), icon: UtensilsCrossed, materialIcon: 'restaurant' },
    { code: 'LANGUAGE', name: t_('Langue', 'Language'), icon: Languages, materialIcon: 'translate' }
  ];

  useEffect(() => {
    if (selectedCountry && selectedCategory) {
      fetchCulturalInfo();
    }
  }, [selectedCountry, selectedCategory]);

  // Real cultural data for each country and category
  const getCulturalData = (countryCode: string, categoryCode: string): CulturalInfo => {
    const country = countries.find(c => c.code === countryCode);
    const category = categories.find(c => c.code === categoryCode);
    const countryName = country?.name || '';
    
    // Base data structure
    const baseData: CulturalInfo = {
      country: countryCode,
      category: categoryCode,
      title: `${category?.name} en ${countryName}`,
      description: `Découvrez les nuances culturelles de ${countryName} dans le domaine ${category?.name.toLowerCase()}.`,
      content: '',
      tips: [],
      doAndDont: { do: [], dont: [] },
      culturalNorms: {
        greeting: '',
        personalSpace: '',
        communication: '',
        business: '',
        social: ''
      },
      importantDates: [],
      resources: []
    };

    // France - Etiquette
    if (countryCode === 'FRANCE' && categoryCode === 'ETIQUETTE') {
      return {
        ...baseData,
        content: t_(
          'L\'étiquette française est un pilier de sa culture, mettant l\'accent sur la politesse, la formalité et le respect. Les salutations sont particulièrement importantes ; une poignée de main légère et rapide est courante, mais les amis et la famille échangent souvent "la bise", un baiser sur chaque joue. Utilisez toujours "Bonjour" suivi de "Monsieur", "Madame" ou "Mademoiselle" lorsque vous entrez dans un magasin ou vous adressez à quelqu\'un que vous ne connaissez pas.',
          'French etiquette is a cornerstone of its culture, emphasizing politeness, formality, and respect. Greetings are particularly important; a light, quick handshake is common, but friends and family often exchange "la bise," a kiss on each cheek. Always use "Bonjour" followed by "Monsieur," "Madame," or "Mademoiselle" when entering a shop or addressing someone you don\'t know.'
        ),
        doAndDont: {
          do: [
            t_('Dire "Bonjour" et "Au revoir" en entrant et en sortant des établissements.', 'Say "Bonjour" and "Au revoir" when entering and leaving establishments.'),
            t_('Garder les mains sur la table (mais pas les coudes) pendant les repas.', 'Keep your hands on the table (but not elbows) during meals.'),
            t_('S\'habiller élégamment. Les Français apprécient une apparence soignée.', 'Dress smartly. The French appreciate a well-put-together appearance.'),
            t_('Utiliser "vous" avec les personnes que vous ne connaissez pas bien.', 'Use "vous" with people you don\'t know well.')
          ],
          dont: [
            t_('Ne pas être bruyant ou tapageur dans les espaces publics.', 'Don\'t be loud or boisterous in public spaces.'),
            t_('Éviter de discuter d\'argent ou de richesse personnelle en conversation.', 'Avoid discussing money or personal wealth in conversation.'),
            t_('Ne pas commencer à manger avant que votre hôte dise "Bon appétit".', 'Don\'t start eating before your host says "Bon appétit".'),
            t_('Ne pas arriver en retard aux rendez-vous professionnels.', 'Don\'t arrive late to professional appointments.')
          ]
        },
        culturalNorms: {
          greeting: t_('Les Français utilisent "Bonjour" le matin et l\'après-midi, "Bonsoir" le soir. La poignée de main est standard en contexte professionnel, "la bise" (2-4 baisers) entre amis et famille.', 'French use "Bonjour" in the morning and afternoon, "Bonsoir" in the evening. Handshake is standard in professional context, "la bise" (2-4 kisses) between friends and family.'),
          personalSpace: t_('Les Français maintiennent une distance personnelle modérée (environ 1 mètre). Le contact physique est réservé aux proches.', 'French maintain moderate personal space (about 1 meter). Physical contact is reserved for close ones.'),
          communication: t_('La communication française est directe mais polie. Les Français apprécient les débats intellectuels et les discussions approfondies.', 'French communication is direct but polite. French appreciate intellectual debates and in-depth discussions.'),
          business: t_('Les relations d\'affaires sont formelles. Les rendez-vous doivent être planifiés à l\'avance. La ponctualité est essentielle.', 'Business relationships are formal. Appointments must be scheduled in advance. Punctuality is essential.'),
          social: t_('Les interactions sociales sont structurées autour des repas. Le déjeuner dure généralement 1-2 heures. Les invitations à dîner sont importantes.', 'Social interactions are structured around meals. Lunch typically lasts 1-2 hours. Dinner invitations are important.')
        },
        immigrationProcedures: {
          visaTypes: [
            t_('Visa de court séjour (Schengen) - jusqu\'à 90 jours', 'Short-stay visa (Schengen) - up to 90 days'),
            t_('Visa de long séjour - plus de 90 jours', 'Long-stay visa - more than 90 days'),
            t_('Visa étudiant - pour études supérieures', 'Student visa - for higher education'),
            t_('Visa travailleur qualifié - passeport talent', 'Skilled worker visa - talent passport')
          ],
          requirements: [
            t_('Passeport valide au moins 3 mois après la date de retour', 'Valid passport at least 3 months after return date'),
            t_('Justificatif de ressources financières suffisantes', 'Proof of sufficient financial resources'),
            t_('Assurance maladie couvrant le séjour', 'Health insurance covering the stay'),
            t_('Lettre d\'invitation ou réservation d\'hébergement', 'Invitation letter or accommodation reservation')
          ],
          documents: [
            t_('Formulaire de demande de visa complété', 'Completed visa application form'),
            t_('Photos d\'identité récentes (format biométrique)', 'Recent ID photos (biometric format)'),
            t_('Extrait de casier judiciaire', 'Criminal record extract'),
            t_('Certificat médical si requis', 'Medical certificate if required'),
            t_('Contrat de travail ou lettre d\'acceptation d\'études', 'Employment contract or study acceptance letter')
          ],
          process: [
            t_('Remplir le formulaire en ligne sur France-Visas', 'Fill out the online form on France-Visas'),
            t_('Prendre rendez-vous au centre de visa', 'Book an appointment at the visa center'),
            t_('Présenter tous les documents requis', 'Present all required documents'),
            t_('Payer les frais de visa (varie selon le type)', 'Pay visa fees (varies by type)'),
            t_('Attendre le traitement (15-45 jours en moyenne)', 'Wait for processing (15-45 days on average)')
          ],
          timeline: t_('15 à 45 jours ouvrables pour un visa de court séjour, 2 à 3 mois pour un visa de long séjour', '15 to 45 working days for a short-stay visa, 2 to 3 months for a long-stay visa'),
          costs: t_('Visa court séjour: 80€, Visa long séjour: 99€, Visa étudiant: 50€ (gratuit pour certains pays)', 'Short-stay visa: €80, Long-stay visa: €99, Student visa: €50 (free for some countries)'),
        tips: [
            t_('Commencez le processus 3 mois avant votre voyage prévu', 'Start the process 3 months before your planned trip'),
            t_('Vérifiez les exigences spécifiques selon votre pays d\'origine', 'Check specific requirements based on your country of origin'),
            t_('Préparez tous les documents traduits en français si nécessaire', 'Prepare all documents translated into French if necessary'),
            t_('Soyez honnête et complet dans votre demande', 'Be honest and complete in your application')
          ]
        },
        importantDates: [
          { name: t_('Fête Nationale', 'National Day'), date: '14 juillet', description: t_('Bastille Day - célébration de la Révolution française', 'Bastille Day - celebration of the French Revolution') },
          { name: t_('Fête du Travail', 'Labor Day'), date: '1er mai', description: t_('Jour férié avec tradition du muguet', 'Public holiday with lily of the valley tradition') }
        ],
        resources: [
          { type: 'WEBSITE', title: t_('France-Visas', 'France-Visas'), url: 'https://france-visas.gouv.fr', description: t_('Site officiel pour les demandes de visa', 'Official website for visa applications') },
          { type: 'WEBSITE', title: t_('Service-Public.fr', 'Service-Public.fr'), url: 'https://www.service-public.fr', description: t_('Informations sur les démarches administratives', 'Information on administrative procedures') }
        ]
      };
    }

    // Canada - Etiquette
    if (countryCode === 'CANADA' && categoryCode === 'ETIQUETTE') {
      return {
        ...baseData,
        content: t_(
          'L\'étiquette canadienne reflète les valeurs de politesse, de respect et de multiculturalisme. Les Canadiens sont généralement très polis, utilisant fréquemment "s\'il vous plaît", "merci" et "excusez-moi". La communication est directe mais respectueuse, et la ponctualité est très importante. Le Canada étant un pays bilingue, le français et l\'anglais sont tous deux officiels, avec des variations régionales.',
          'Canadian etiquette reflects values of politeness, respect, and multiculturalism. Canadians are generally very polite, frequently using "please," "thank you," and "excuse me." Communication is direct but respectful, and punctuality is very important. As a bilingual country, both French and English are official, with regional variations.'
        ),
        doAndDont: {
          do: [
            t_('Être ponctuel pour tous les rendez-vous', 'Be punctual for all appointments'),
            t_('Utiliser "s\'il vous plaît" et "merci" fréquemment', 'Use "please" and "thank you" frequently'),
            t_('Respecter la diversité culturelle et les différences', 'Respect cultural diversity and differences'),
            t_('S\'habiller de manière professionnelle en contexte d\'affaires', 'Dress professionally in business context')
          ],
          dont: [
            t_('Ne pas faire de généralisations sur les cultures', 'Don\'t make generalizations about cultures'),
            t_('Éviter les discussions sur la politique ou la religion en première rencontre', 'Avoid discussions about politics or religion on first meeting'),
            t_('Ne pas arriver en retard sans prévenir', 'Don\'t arrive late without notice'),
            t_('Ne pas être trop direct ou agressif dans la communication', 'Don\'t be too direct or aggressive in communication')
          ]
        },
        culturalNorms: {
          greeting: t_('Les Canadiens utilisent généralement une poignée de main ferme. Dans le Québec francophone, "la bise" est commune entre amis. "Bonjour" ou "Hello" selon la région.', 'Canadians generally use a firm handshake. In French-speaking Quebec, "la bise" is common between friends. "Bonjour" or "Hello" depending on region.'),
          personalSpace: t_('Les Canadiens respectent un espace personnel d\'environ 1 mètre. Le contact physique est réservé aux proches.', 'Canadians respect personal space of about 1 meter. Physical contact is reserved for close ones.'),
          communication: t_('La communication est directe mais polie. Les Canadiens évitent les conflits et privilégient la diplomatie.', 'Communication is direct but polite. Canadians avoid conflicts and favor diplomacy.'),
          business: t_('Les relations d\'affaires sont professionnelles et égalitaires. La ponctualité est cruciale. Les réunions commencent à l\'heure.', 'Business relationships are professional and egalitarian. Punctuality is crucial. Meetings start on time.'),
          social: t_('Les Canadiens sont accueillants et ouverts. Les invitations sont souvent informelles. Le partage des coûts est commun.', 'Canadians are welcoming and open. Invitations are often informal. Cost sharing is common.')
        },
        immigrationProcedures: {
          visaTypes: [
            t_('Visa de visiteur temporaire (TRV)', 'Temporary Resident Visa (TRV)'),
            t_('Permis d\'études - pour étudiants', 'Study Permit - for students'),
            t_('Permis de travail - pour travailleurs qualifiés', 'Work Permit - for skilled workers'),
            t_('Résidence permanente - Express Entry', 'Permanent Residence - Express Entry')
          ],
          requirements: [
            t_('Passeport valide', 'Valid passport'),
            t_('Preuve de fonds suffisants', 'Proof of sufficient funds'),
            t_('Certificat médical si requis', 'Medical certificate if required'),
            t_('Certificat de police (casier judiciaire)', 'Police certificate (criminal record)'),
            t_('Preuve de liens avec le pays d\'origine', 'Proof of ties to home country')
          ],
          documents: [
            t_('Formulaire IMM 5257 (demande de visa)', 'IMM 5257 form (visa application)'),
            t_('Photos d\'identité conformes aux spécifications canadiennes', 'ID photos meeting Canadian specifications'),
            t_('Lettre d\'explication du voyage', 'Travel explanation letter'),
            t_('Relevés bancaires des 4 derniers mois', 'Bank statements for the last 4 months'),
            t_('Itinéraire de voyage et réservations', 'Travel itinerary and reservations')
          ],
          process: [
            t_('Créer un compte sur le portail IRCC', 'Create an account on the IRCC portal'),
            t_('Remplir la demande en ligne', 'Fill out the online application'),
            t_('Payer les frais (CAN$100 pour visa de visiteur)', 'Pay fees (CAD$100 for visitor visa)'),
            t_('Fournir les biométries (empreintes digitales, photo)', 'Provide biometrics (fingerprints, photo)'),
            t_('Attendre la décision (varie selon le type de demande)', 'Wait for decision (varies by application type)')
          ],
          timeline: t_('Visa de visiteur: 2-4 semaines, Permis d\'études: 4-6 semaines, Express Entry: 6 mois', 'Visitor visa: 2-4 weeks, Study permit: 4-6 weeks, Express Entry: 6 months'),
          costs: t_('Visa de visiteur: CAN$100, Permis d\'études: CAN$150, Permis de travail: CAN$155, Express Entry: CAN$1,325', 'Visitor visa: CAD$100, Study permit: CAD$150, Work permit: CAD$155, Express Entry: CAD$1,325'),
          tips: [
            t_('Utilisez le système Express Entry pour la résidence permanente', 'Use the Express Entry system for permanent residence'),
            t_('Préparez tous les documents traduits en anglais ou français', 'Prepare all documents translated into English or French'),
            t_('Vérifiez les exigences spécifiques selon votre pays d\'origine', 'Check specific requirements based on your country of origin'),
            t_('Soyez patient - les délais peuvent varier', 'Be patient - processing times can vary')
          ]
        },
        importantDates: [
          { name: t_('Fête du Canada', 'Canada Day'), date: '1er juillet', description: t_('Célébration de la confédération canadienne', 'Celebration of Canadian confederation') },
          { name: t_('Action de grâce', 'Thanksgiving'), date: t_('Deuxième lundi d\'octobre', 'Second Monday of October'), description: t_('Jour férié pour remercier', 'Holiday for giving thanks') }
        ],
        resources: [
          { type: 'WEBSITE', title: 'IRCC', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html', description: t_('Immigration, Réfugiés et Citoyenneté Canada', 'Immigration, Refugees and Citizenship Canada') },
          { type: 'WEBSITE', title: 'Express Entry', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html', description: t_('Système d\'immigration Express Entry', 'Express Entry immigration system') }
        ]
      };
    }

    // Add more countries and categories as needed...
    // For now, return a default structure
    return {
      ...baseData,
      content: t_(
        `La culture ${category?.name.toLowerCase()} en ${countryName} est riche et diversifiée. Elle reflète l'histoire, les traditions et les valeurs de cette société.`,
        `The ${category?.name.toLowerCase()} culture in ${countryName} is rich and diverse. It reflects the history, traditions, and values of this society.`
      ),
      tips: [
        t_('Respectez les coutumes locales', 'Respect local customs'),
        t_('Apprenez quelques phrases de base', 'Learn some basic phrases'),
        t_('Observez les comportements des locaux', 'Observe local behaviors'),
        t_('Soyez ouvert aux différences culturelles', 'Be open to cultural differences')
      ],
      doAndDont: {
        do: [
          t_('Saluer poliment selon les coutumes locales', 'Greet politely according to local customs'),
          t_('Respecter les horaires et les rendez-vous', 'Respect schedules and appointments'),
          t_('Être patient et compréhensif', 'Be patient and understanding'),
          t_('Apprendre la langue locale', 'Learn the local language')
        ],
        dont: [
          t_('Imposer ses propres valeurs', 'Impose your own values'),
          t_('Critiquer ouvertement les coutumes', 'Openly criticize customs'),
          t_('Être impatient avec les différences', 'Be impatient with differences'),
          t_('Ignorer les règles sociales', 'Ignore social rules')
        ]
      },
      culturalNorms: {
        greeting: t_('Les salutations varient selon le contexte et la relation', 'Greetings vary according to context and relationship'),
        personalSpace: t_('Respectez l\'espace personnel selon les normes locales', 'Respect personal space according to local norms'),
        communication: t_('La communication peut être directe ou indirecte selon la culture', 'Communication can be direct or indirect depending on culture'),
        business: t_('Les relations d\'affaires suivent des protocoles spécifiques', 'Business relationships follow specific protocols'),
        social: t_('Les interactions sociales ont leurs propres règles', 'Social interactions have their own rules')
      },
      importantDates: [
        { name: t_('Fête nationale', 'National Day'), date: '1er janvier', description: t_('Jour de célébration nationale', 'National celebration day') }
      ],
      resources: []
      };
  };

  const fetchCulturalInfo = async () => {
    setLoading(true);
    try {
      // Get real cultural data based on country and category
      const culturalData = getCulturalData(selectedCountry, selectedCategory);
      setCulturalInfo(culturalData);
    } catch (error) {
      console.error('Error fetching cultural info:', error);
      toast.error(t_('Erreur lors du chargement des informations culturelles', 'Error loading cultural information'));
    } finally {
      setLoading(false);
    }
  };

  const sendAIMessage = async () => {
    if (!currentMessage.trim() || !selectedCountry || !selectedCategory || isAILoading) return;

    const userMessage = { role: 'user' as const, content: currentMessage, timestamp: new Date() };
    setAiMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsAILoading(true);

    try {
      const country = countries.find(c => c.code === selectedCountry);
      const category = categories.find(c => c.code === selectedCategory);
      
      // Call Gemini API via backend
      const response = await apiClient.post('/ai/chat', {
        message: messageToSend,
        context: {
          country: country?.name,
          category: category?.name,
          language: lang,
          topic: `Cultural information about ${country?.name} - ${category?.name}`
        }
      });

      if (response.success && response.data) {
        const responseData = response.data as any;
      const aiResponse = { 
        role: 'assistant' as const, 
          content: responseData.message || responseData.response || t_('Réponse reçue', 'Response received'),
          timestamp: new Date()
      };
      setAiMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error((response as any).error?.message || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Error sending AI message:', error);
      const errorResponse = { 
        role: 'assistant' as const, 
        content: t_(
          'Désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?',
          'Sorry, I\'m experiencing a technical issue. Could you rephrase your question?'
        ),
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorResponse]);
      toast.error(t_('Erreur de connexion avec l\'IA', 'AI connection error'));
    } finally {
      setIsAILoading(false);
    }
  };


  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SimulationHeader currentPage="cultural" type="immigration" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
        <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden bg-white dark:bg-black pt-20 pb-16 mb-12">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAKKizqj5k5c8EqADiwCtCSMsDe9dDbZ3vySUDpYZInA0vv680kQGzK5N3rsO3x781YhGe909JYBnOhCy2R2l5JVPIJ6Z3p_owRrwcLSxCF3iHqCySK1x5eIjoePthxTSQsKfBfRb1xg5ujlSSi9v1xsk0VTMYV5SghKvZyz76G_cfx1LgtOrB_L3juLQqXO4oKtB24uVRVftvG8lMqtQRiLb4I7UXyeqRzJlr65rNseJRqkqrV0Mmlhr7LXy5cyji1ZyytxHWd8ZjH")`
            }}
          />
          <div className="relative z-10 text-center max-w-4xl px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight mb-6"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '-0.03em' }}
            >
              <span className="text-[#2ECC71]">
                {t_("Explorez le Contexte", "Explore")}
              </span>
              <br />
              <span className="text-white">
                {t_("Culturel", "Cultural")} {t_("", "Context")}
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 font-medium leading-relaxed mb-8"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.7' }}
            >
              {t_(
                "Plongez-vous dans les traditions, les coutumes et les normes sociales des pays francophones pour enrichir votre parcours linguistique.",
                "Immerse yourself in the traditions, customs, and social norms of francophone countries to enhance your language journey."
              )}
            </motion.p>
        </div>
        </section>

              {/* Country Selection */}
        <div className="mb-10">
          <h2 
            className="text-2xl md:text-3xl font-bold mb-2 px-4"
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            <span className="text-[#2ECC71]">{t_('Sélectionnez un', 'Select a')}</span>{' '}
            <span className="text-black dark:text-white">{t_('Pays', 'Country')}</span>
          </h2>
          <p className="text-muted-foreground px-4 mb-4">
            {t_('Choisissez le pays pour lequel vous souhaitez explorer la culture', 'Choose the country you want to explore culture for')}
          </p>
                  <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-stretch p-4 gap-4">
                  {countries.map((country) => (
                        <motion.div
                      key={country.code}
                          whileHover={{ scale: 1.02 }}
                          className={`flex h-full flex-1 cursor-pointer flex-col gap-3 rounded-xl min-w-60 border-2 p-4 shadow-lg backdrop-blur-lg transition-all duration-200 ${
                        selectedCountry === country.code 
                              ? 'border-[#2ECC71] bg-white/30 dark:bg-white/10 ring-2 ring-[#2ECC71]/50'
                              : 'border-transparent bg-white/30 dark:bg-white/10 hover:border-[#2ECC71]/50'
                      }`}
                      onClick={() => setSelectedCountry(country.code)}
                    >
                          <div 
                            className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
                            style={{ backgroundImage: `url("${country.flagImage}")` }}
                          />
                          <div>
                            <p className="text-gray-900 dark:text-white text-base font-bold">{country.name}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">{country.region}</p>
                          </div>
                        </motion.div>
                  ))}
                    </div>
                </div>
              </div>

              {/* Category Selection */}
        <div className="mb-12">
          <h2 
            className="text-2xl md:text-3xl font-bold mb-2 px-4"
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            <span className="text-[#2ECC71]">{t_('Sélectionnez une', 'Select a')}</span>{' '}
            <span className="text-black dark:text-white">{t_('Catégorie', 'Category')}</span>
          </h2>
          <p className="text-muted-foreground px-4 mb-4">
            {t_('Choisissez la catégorie culturelle qui vous intéresse', 'Choose the cultural category that interests you')}
          </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 p-4">
                  {categories.map((category) => (
                      <motion.div
                      key={category.code}
                        whileHover={{ scale: 1.02 }}
                        className={`flex flex-1 gap-3 cursor-pointer rounded-xl border-2 p-4 items-center shadow-lg backdrop-blur-lg transition-all duration-200 ${
                        selectedCategory === category.code 
                            ? 'border-[#2ECC71] bg-white/30 dark:bg-white/10 ring-2 ring-[#2ECC71]/50'
                            : 'border-transparent bg-white/30 dark:bg-white/10 hover:border-[#2ECC71]/50'
                      }`}
                      onClick={() => setSelectedCategory(category.code)}
                    >
                        <span className="material-symbols-outlined text-gray-900 dark:text-white text-2xl">
                          {category.materialIcon}
                        </span>
                        <h2 className="text-gray-900 dark:text-white text-base font-bold">{category.name}</h2>
                      </motion.div>
                  ))}
                </div>
              </div>

        {/* Tabbed Content Display */}
        {selectedCountry && selectedCategory && (
          <div className="rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-white/10 dark:border-white/10">
                    <div className="flex border-b border-gray-300 dark:border-gray-600 mb-6 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'overview'
                            ? 'border-[#2ECC71] text-gray-900 dark:text-white font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t_('Aperçu', 'Overview')}
                      </button>
                      <button
                        onClick={() => setActiveTab('norms')}
                        className={`px-4 py-2 text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'norms'
                            ? 'border-[#2ECC71] text-gray-900 dark:text-white font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t_('Normes', 'Norms')}
                      </button>
                      <button
                        onClick={() => setActiveTab('tips')}
                        className={`px-4 py-2 text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'tips'
                            ? 'border-[#2ECC71] text-gray-900 dark:text-white font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t_('Conseils', 'Tips')}
                      </button>
                      <button
                        onClick={() => setActiveTab('immigration')}
                        className={`px-4 py-2 text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'immigration'
                            ? 'border-[#2ECC71] text-gray-900 dark:text-white font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t_('Procédure d\'Immigration', 'Immigration Procedures')}
                      </button>
                      <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-4 py-2 text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'resources'
                            ? 'border-[#2ECC71] text-gray-900 dark:text-white font-bold'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {t_('Ressources', 'Resources')}
                      </button>
                    </div>

                    <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2ECC71]"></div>
              </div>
            ) : culturalInfo ? (
              <>
                          {activeTab === 'overview' && (
                            <>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t_('Étiquette Sociale en', 'Social Etiquette in')} {countries.find(c => c.code === selectedCountry)?.name}
                              </h3>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {culturalInfo.content || t_(
                                  'L\'étiquette française est un pilier de sa culture, mettant l\'accent sur la politesse, la formalité et le respect. Les salutations sont particulièrement importantes ; une poignée de main légère et rapide est courante, mais les amis et la famille échangent souvent \'la bise\', un baiser sur chaque joue. Utilisez toujours \'Bonjour\' suivi de \'Monsieur\', \'Madame\' ou \'Mademoiselle\' lorsque vous entrez dans un magasin ou vous adressez à quelqu\'un que vous ne connaissez pas.',
                                  'French etiquette is a cornerstone of its culture, emphasizing politeness, formality, and respect. Greetings are particularly important; a light, quick handshake is common, but friends and family often exchange \'la bise,\' a kiss on each cheek. Always use \'Bonjour\' followed by \'Monsieur,\' \'Madame,\' or \'Mademoiselle\' when entering a shop or addressing someone you don\'t know.'
                                )}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-6 space-y-3">
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t_('À faire', 'Do\'s')}</h4>
                                  <ul className="space-y-2">
                                    {culturalInfo.doAndDont.do.map((item, index) => (
                                      <li key={index} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[#2ECC71] mt-1">check_circle</span>
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                        </div>
                                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-6 space-y-3">
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t_('À éviter', 'Don\'ts')}</h4>
                                  <ul className="space-y-2">
                                    {culturalInfo.doAndDont.dont.map((item, index) => (
                                      <li key={index} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-gray-900 dark:text-gray-400 mt-1">cancel</span>
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                        </div>
                      </div>
                            </>
                          )}
                          {activeTab === 'norms' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t_('Normes culturelles', 'Cultural Norms')}</h4>
                            <div className="space-y-4">
                              <div>
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t_('Salutations', 'Greetings')}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.greeting}</p>
                              </div>
                              <div>
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t_('Espace personnel', 'Personal Space')}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.personalSpace}</p>
                              </div>
                              <div>
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t_('Communication', 'Communication')}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.communication}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t_('Contexte professionnel', 'Professional Context')}</h4>
                            <div className="space-y-4">
                              <div>
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t_('Monde du travail', 'Workplace')}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.business}</p>
                              </div>
                              <div>
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t_('Vie sociale', 'Social Life')}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{culturalInfo.culturalNorms.social}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                          )}
                          {activeTab === 'tips' && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t_('Conseils pratiques', 'Practical Tips')}</h4>
                            <ul className="space-y-2">
                                {culturalInfo.tips.map((tip, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <Lightbulb className="w-5 h-5 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          )}
                          {activeTab === 'immigration' && culturalInfo.immigrationProcedures && (
                            <div className="space-y-6">
                          <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                  {t_('Procédures d\'Immigration pour', 'Immigration Procedures for')} {countries.find(c => c.code === selectedCountry)?.name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                  {t_('Informations essentielles sur les visas, les documents requis et le processus d\'immigration.', 'Essential information about visas, required documents, and the immigration process.')}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-white/50 dark:bg-black/20">
                                  <CardHeader>
                                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-[#2ECC71]" />
                                      {t_('Types de Visa', 'Visa Types')}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                            <ul className="space-y-2">
                                      {culturalInfo.immigrationProcedures.visaTypes.map((type, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                                </li>
                              ))}
                            </ul>
                                  </CardContent>
                                </Card>

                                <Card className="bg-white/50 dark:bg-black/20">
                                  <CardHeader>
                                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                      <Info className="w-5 h-5 text-[#2ECC71]" />
                                      {t_('Exigences', 'Requirements')}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="space-y-2">
                                      {culturalInfo.immigrationProcedures.requirements.map((req, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">{req}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                          </div>

                              <Card className="bg-white/50 dark:bg-black/20">
                                <CardHeader>
                                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#2ECC71]" />
                                    {t_('Documents Requis', 'Required Documents')}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {culturalInfo.immigrationProcedures.documents.map((doc, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{doc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>

                              <Card className="bg-white/50 dark:bg-black/20">
                                <CardHeader>
                                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#2ECC71]" />
                                    {t_('Processus', 'Process')}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ol className="space-y-3">
                                    {culturalInfo.immigrationProcedures.process.map((step, index) => (
                                      <li key={index} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#2ECC71] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                          {index + 1}
                        </div>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </CardContent>
                              </Card>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-[#2ECC71]/10 dark:bg-[#2ECC71]/5 border border-[#2ECC71]/20">
                                  <CardContent className="p-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t_('Délai de Traitement', 'Processing Time')}</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{culturalInfo.immigrationProcedures.timeline}</p>
                                  </CardContent>
                                </Card>
                                <Card className="bg-[#2ECC71]/10 dark:bg-[#2ECC71]/5 border border-[#2ECC71]/20">
                                  <CardContent className="p-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t_('Coûts', 'Costs')}</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{culturalInfo.immigrationProcedures.costs}</p>
                                  </CardContent>
                                </Card>
                              </div>

                              <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <CardHeader>
                                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    {t_('Conseils Importants', 'Important Tips')}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="space-y-2">
                                    {culturalInfo.immigrationProcedures.tips.map((tip, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <Star className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                          {activeTab === 'immigration' && !culturalInfo?.immigrationProcedures && (
                            <div className="text-center py-12">
                              <Plane className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                {t_('Informations d\'immigration non disponibles', 'Immigration information not available')}
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400">
                                {t_('Les informations d\'immigration pour cette combinaison pays/catégorie seront bientôt disponibles.', 'Immigration information for this country/category combination will be available soon.')}
                              </p>
                            </div>
                          )}
                          {activeTab === 'resources' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {culturalInfo.resources.map((resource, index) => (
                            <Card key={index} className="dark:bg-gray-700 dark:border-gray-600">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                      <div className="w-8 h-8 bg-[#2ECC71]/20 rounded-lg flex items-center justify-center">
                                        {resource.type === 'VIDEO' && <Play className="w-4 h-4 text-[#2ECC71]" />}
                                        {resource.type === 'ARTICLE' && <BookOpen className="w-4 h-4 text-[#2ECC71]" />}
                                        {resource.type === 'BOOK' && <BookOpen className="w-4 h-4 text-[#2ECC71]" />}
                                        {resource.type === 'WEBSITE' && <Globe className="w-4 h-4 text-[#2ECC71]" />}
                                  </div>
                                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                                    {resource.type}
                                  </Badge>
                                </div>
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{resource.title}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{resource.description}</p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                  onClick={() => window.open(resource.url, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                      {t_('Consulter', 'View')}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                          )}
              </>
            ) : (
                        <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {t_('Aucun contenu culturel disponible', 'No cultural content available')}
                          </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t_('Aucun contenu culturel n\'est disponible pour cette combinaison pays/catégorie.', 'No cultural content is available for this country/category combination.')}
                          </p>
          </div>
        )}
                </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 flex items-center justify-center size-16 rounded-full bg-[#2ECC71] text-black shadow-xl shadow-[#2ECC71]/50 cursor-pointer z-50 transition-all duration-200 hover:shadow-2xl hover:shadow-[#2ECC71]/60"
            onClick={() => setShowAIAssistant(!showAIAssistant)}
          >
        <Bot className="w-7 h-7" />
      </motion.button>

      {/* Modern AI Assistant Dialog */}
      <AnimatePresence>
      {showAIAssistant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIAssistant(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2ECC71] to-[#27c066] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{t_('Assistant Culturel IA', 'Cultural AI Assistant')}</h3>
                    <p className="text-white/80 text-sm">
                      {countries.find(c => c.code === selectedCountry)?.name} - {categories.find(c => c.code === selectedCategory)?.name}
                    </p>
                  </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAIAssistant(false)}
                  className="text-white hover:bg-white/20 rounded-full"
              >
                  <X className="w-5 h-5" />
              </Button>
            </div>
            
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-950">
                {aiMessages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Bot className="w-16 h-16 mx-auto mb-4 text-[#2ECC71] opacity-50" />
                    </motion.div>
                    <p className="text-lg font-medium mb-2">{t_('Bonjour! Je suis votre assistant culturel.', 'Hello! I am your cultural assistant.')}</p>
                    <p className="text-sm">{t_('Posez-moi des questions sur la culture et l\'immigration...', 'Ask me questions about culture and immigration...')}</p>
                  </div>
                ) : (
                  aiMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user' 
                          ? 'bg-[#2ECC71] text-black rounded-br-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                  }`}>
                        <div className="flex items-start gap-3">
                          {message.role === 'assistant' && (
                            <Bot className="w-5 h-5 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            {message.timestamp && (
                              <p className="text-xs opacity-60 mt-2">
                                {new Date(message.timestamp).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                  </div>
                </div>
                      </div>
                    </motion.div>
                  ))
                )}
                {isAILoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-[#2ECC71]" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[#2ECC71] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-[#2ECC71] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-[#2ECC71] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder={t_('Posez votre question sur la culture...', 'Ask your question about culture...')}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent outline-none transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendAIMessage()}
                    disabled={isAILoading}
                />
                  <Button 
                    onClick={sendAIMessage} 
                    disabled={isAILoading || !currentMessage.trim()}
                    className="bg-[#2ECC71] hover:bg-[#27c066] text-black font-semibold px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAILoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                </Button>
              </div>
            </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export default function CulturalPage() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
      <style jsx global>{`
        :root {
          --primary: #13ec6d;
        }
        .text-primary {
          color: var(--primary) !important;
        }
        .bg-primary {
          background-color: var(--primary) !important;
        }
        .border-primary {
          border-color: var(--primary) !important;
        }
        .ring-primary {
          --tw-ring-color: var(--primary);
        }
        .bg-background-light {
          background-color: #f6f8f7;
        }
        .bg-background-dark {
          background-color: #102218;
        }
        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    <SharedDataProvider>
      <CulturalPageContent />
    </SharedDataProvider>
    </>
  );
}