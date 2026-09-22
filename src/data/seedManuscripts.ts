export interface SeedArtifact {
  id: string;
  title: string;
  archiveId: string; // institutional identifier
  classification: "CHARTER" | "MANUSCRIPT" | "AUDIO" | "3D ARTIFACT" | string;
  originalLanguage: string;
  period: string;
  region: string;
  description: string; // rich curator's notes with historical context
  tags: string[];
  sourceInstitution: string; // which govt archive/portal it comes from
  sourceUrl: string; // public URL to the source portal/page
  referenceImageUrl: string; // publicly accessible image URL for the artifact
  historicalContext: string; // 3-4 sentence scholarly description for AI translation context
}

export const SEED_MANUSCRIPTS: SeedArtifact[] = [
  {
    id: "seed-const-art32",
    title: "Constitution of India, Article 32 Original Master Folio",
    archiveId: "ARC-NAI-1949-CONST-32",
    classification: "CHARTER",
    originalLanguage: "English",
    period: "1949 CE",
    region: "New Delhi, India",
    sourceInstitution: "National Archives of India",
    sourceUrl: "https://www.nationalarchives.nic.in",
    referenceImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Constitution_of_India.jpg/800px-Constitution_of_India.jpg",
    description: "Original master folio of Article 32 of the Indian Constitution — the 'Right to Constitutional Remedies' — handwritten by calligrapher Prem Behari Narain Raizada. This article, championed by Dr. B.R. Ambedkar, is often called the 'heart and soul' of the Indian Constitution, granting citizens the right to directly approach the Supreme Court for enforcement of fundamental rights.",
    tags: ["constitution", "article-32", "fundamental-rights", "ambedkar", "1949", "law", "national-archives"],
    historicalContext: "Adopted on 26 November 1949 and entering into force on 26 January 1950, Article 32 established the bedrock of Indian constitutional jurisprudence by guaranteeing the right to move the Supreme Court by appropriate proceedings for the enforcement of fundamental rights. Dr. B.R. Ambedkar declared that without Article 32, the Constitution would be a nullity. The master folio features borders hand-illustrated by Nandalal Bose and artists from Santiniketan."
  },
  {
    id: "seed-ambedkar-baws-v3",
    title: "Revolution and Counter-Revolution in Ancient India (Chapter VII)",
    archiveId: "ARC-BAWS-VOL03-CH07",
    classification: "MANUSCRIPT",
    originalLanguage: "English",
    period: "1936 CE (written), covers ancient period",
    region: "India",
    sourceInstitution: "Dr. Babasaheb Ambedkar Writings and Speeches (BAWS), Government of Maharashtra",
    sourceUrl: "https://www.mea.gov.in",
    referenceImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Dr._Bhimrao_Ambedkar.jpg/800px-Dr._Bhimrao_Ambedkar.jpg",
    description: "Chapter VII from Volume 3 of 'Dr. Babasaheb Ambedkar: Writings and Speeches' published by the Government of Maharashtra. This chapter analyzes the decline of Buddhism in India and the destruction of the great Buddhist centres of learning including Nalanda. Ambedkar examines the historical forces — Brahmanical counter-revolution, Hun invasions, and the eventual Turkic raids — that led to the fall of Buddhist institutions.",
    tags: ["ambedkar", "buddhism", "counter-revolution", "nalanda", "ancient-india", "BAWS", "history"],
    historicalContext: "In Chapter VII, Dr. Ambedkar provides a rigorous historiographical inquiry into the decline of Buddhism in India, arguing that its fall was not due to internal decay but prolonged ideological and political conflict. He specifically details the burning and desecration of the monastic libraries of Nalanda and Odantapuri, where thousands of monks were martyred and irreplaceable manuscripts incinerated. His thesis reshaped modern scholarship on ancient Indian religious and social conflict."
  },
  {
    id: "seed-prajnaparamita-nalanda",
    title: "Aṣṭasāhasrikā Prajñāpāramitā Sūtra (Nalanda Palm-Leaf Folio 14)",
    archiveId: "ARC-NMM-1035-PRAJNAPARAMITA",
    classification: "MANUSCRIPT",
    originalLanguage: "Sanskrit",
    period: "11th–12th Century CE (Pala dynasty)",
    region: "Nalanda, Bihar, India",
    sourceInstitution: "National Mission for Manuscripts (NMM) / Gyan Bharatam",
    sourceUrl: "https://gyanbharatam.com",
    referenceImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Ashtasahasrika_Prajnaparamita_Sutra_manuscript_folio.jpg/800px-Ashtasahasrika_Prajnaparamita_Sutra_manuscript_folio.jpg",
    description: "Folio 14 of the Aṣṭasāhasrikā Prajñāpāramitā Sūtra ('Perfection of Wisdom in 8,000 Verses') — one of the most important surviving palm-leaf manuscripts from the Nalanda Mahavihara. Created during the Pala dynasty, this illuminated manuscript features exquisite miniature paintings of Buddhist deities alongside the Sanskrit text in Siddham script. It is one of the earliest illustrated manuscripts from the Indian subcontinent and a direct witness to the scholarly tradition that flourished at Nalanda before its destruction.",
    tags: ["prajnaparamita", "nalanda", "palm-leaf", "sanskrit", "buddhism", "pala-dynasty", "sutra", "illuminated-manuscript"],
    historicalContext: "The Aṣṭasāhasrikā Prajñāpāramitā is the foundational scripture of Mahāyāna philosophy, expounding the doctrine of prajñā (transcendent wisdom) and śūnyatā (emptiness of inherent existence). Copied by scholar-monks at the monastic university of Nalanda during the reign of King Ramapala, this folio demonstrates the sophisticated synthesis of calligraphy, illumination, and philosophical treatise. The ink was made from lampblack, iron gall, and gum arabic applied onto processed Borassus flabellifer palm leaves."
  },
  {
    id: "seed-ambedkar-air-1949",
    title: "Dr. B.R. Ambedkar Constituent Assembly Final Address (25 Nov 1949)",
    archiveId: "ARC-AIR-1949-SPEECH",
    classification: "AUDIO",
    originalLanguage: "English",
    period: "25 November 1949",
    region: "New Delhi, India",
    sourceInstitution: "All India Radio (AIR) Archives / Prasar Bharati",
    sourceUrl: "https://prasarbharati.gov.in",
    referenceImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Babasaheb_Ambedkar_delivering_a_speech_to_the_Constituent_Assembly.jpg/800px-Babasaheb_Ambedkar_delivering_a_speech_to_the_Constituent_Assembly.jpg",
    description: "The historic final address by Dr. B.R. Ambedkar to the Constituent Assembly on 25 November 1949, the day before the Constitution was adopted. In this landmark speech, Ambedkar warned about the dangers to Indian democracy — hero worship (bhakti), the grammar of anarchy, and social inequality — drawing from lessons of ancient Indian history including how internal divisions led to the fall of great institutions like Nalanda.",
    tags: ["ambedkar", "constituent-assembly", "speech", "1949", "democracy", "constitution", "AIR", "audio"],
    historicalContext: "Delivered on the eve of the Constitution's completion, this prophetic address warned that political democracy without social democracy cannot last. Dr. Ambedkar invoked the historic parliamentary procedures of ancient Buddhist sanghas to show that democratic deliberation was not foreign to India, while cautioning against blind devotion in politics. Preserved in the sound archives of All India Radio, it remains one of the most consequential orations in modern parliamentary history."
  },
  {
    id: "seed-congress-radio-1942",
    title: "Congress Radio 42.34m Underground Broadcast (August 1942)",
    archiveId: "ARC-CR-1942-RADIO",
    classification: "AUDIO",
    originalLanguage: "Hindi / English",
    period: "August 1942",
    region: "Bombay (Mumbai), India",
    sourceInstitution: "National Archives of India / Prasar Bharati Archives",
    sourceUrl: "https://www.nationalarchives.nic.in",
    referenceImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Usha_Mehta.jpg/800px-Usha_Mehta.jpg",
    description: "Recordings from the clandestine 'Congress Radio' that operated on 42.34 metres wavelength during the Quit India Movement of 1942. Run by Usha Mehta and freedom fighters from a secret location in Bombay, this underground radio station broadcast news of the independence movement when all legal press was censored by the British colonial government. It represents one of India's earliest acts of media resistance.",
    tags: ["quit-india", "1942", "congress-radio", "usha-mehta", "freedom-movement", "underground", "radio", "bombay"],
    historicalContext: "Following the arrest of Mahatma Gandhi and the entire Congress leadership in August 1942, 22-year-old student Usha Mehta and associates set up a mobile, clandestine transmitter. Announcing 'This is Congress Radio calling on 42.34 meters from somewhere in India,' the station broadcast uncensored reports of police atrocities, national strikes, and Gandhi's message of 'Do or Die.' The station evaded British detection for three months before being raided in November 1942."
  },
  {
    id: "seed-nalanda-terracotta-seal",
    title: "Official Terracotta Monastic Seal of Nalanda Mahavihara",
    archiveId: "ARC-ASI-1921-NALANDA-SEAL",
    classification: "3D ARTIFACT",
    originalLanguage: "Sanskrit (inscription)",
    period: "7th–9th Century CE",
    region: "Nalanda, Bihar, India",
    sourceInstitution: "Archaeological Survey of India (ASI) / Nalanda Museum",
    sourceUrl: "https://asi.nic.in",
    referenceImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Nalanda_seal_replica.jpg/800px-Nalanda_seal_replica.jpg",
    description: "Official terracotta monastic seal excavated from the Nalanda Mahavihara ruins during the ASI excavations beginning in 1915-1921. The seal bears a Sanskrit inscription reading 'Śrī-Nālandā-Mahāvihārasya' (Of the Great Monastery of Nalanda) along with a dharmachakra (wheel of dharma) motif flanked by two gazelles. This seal served as the official institutional stamp of Nalanda University, used to authenticate documents and correspondence — direct physical proof of Nalanda's administrative organization as a formal institution of higher learning.",
    tags: ["nalanda", "seal", "terracotta", "ASI", "excavation", "sanskrit", "dharmachakra", "archaeological"],
    historicalContext: "Discovered in Site No. 1 at Nalanda, hundreds of these terracotta and bronze seals were recovered by archaeological teams led by D.B. Spooner and H. Hargreaves. The upper register portrays the Wheel of Law flanked by two deer, representing the Buddha's First Sermon at Deer Park in Sarnath. Below is the two-line inscription in post-Gupta Brahmi script identifying the Mahavihara's governing monastic council, certifying the academic diplomas and royal dispatches issued across Asia."
  }
];
