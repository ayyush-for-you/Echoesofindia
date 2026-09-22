import { Manuscript } from "@/types/manuscript";

export interface GameArtifactData {
  artifactId: string; // "manuscript_1", "manuscript_2", "manuscript_3", "seal"
  manuscript: Omit<Manuscript, "id" | "uploadedAt" | "originalImageUrl">;
  svgImage: string; // base64 SVG data URL
}

function createPalmLeafSvg(label: string, verseSnippet: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="260" viewBox="0 0 700 260">
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#C29B38"/>
        <stop offset="50%" stop-color="#8F6B20"/>
        <stop offset="100%" stop-color="#5C4212"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.8"/>
      </filter>
    </defs>
    <rect width="700" height="260" fill="#0D0905"/>
    <g filter="url(#shadow)">
      <rect x="30" y="45" width="640" height="170" rx="22" fill="url(#leafGrad)" stroke="#E0C068" stroke-width="2"/>
      <circle cx="110" cy="130" r="9" fill="#1C1408" stroke="#E0C068" stroke-width="1.5"/>
      <circle cx="590" cy="130" r="9" fill="#1C1408" stroke="#E0C068" stroke-width="1.5"/>
      <line x1="140" y1="85" x2="560" y2="85" stroke="#3A280B" stroke-width="2" stroke-dasharray="4 2"/>
      <line x1="140" y1="175" x2="560" y2="175" stroke="#3A280B" stroke-width="2" stroke-dasharray="4 2"/>
    </g>
    <text x="350" y="115" font-family="serif" font-size="16" font-weight="bold" fill="#FDF5E6" text-anchor="middle" letter-spacing="2">॥ ${label.toUpperCase()} ॥</text>
    <text x="350" y="145" font-family="serif" font-size="12" font-style="italic" fill="#F3E5AB" text-anchor="middle">"${verseSnippet}"</text>
    <text x="350" y="195" font-family="monospace" font-size="10" fill="#E0C068" text-anchor="middle" letter-spacing="3">NALANDA MAHAVIHARA • CHAPTER 1 RECOVERY</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createTerracottaSealSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <radialGradient id="terracottaGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#C85A17"/>
        <stop offset="60%" stop-color="#80330C"/>
        <stop offset="100%" stop-color="#4A1C04"/>
      </radialGradient>
      <filter id="sealShadow">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.9"/>
      </filter>
    </defs>
    <rect width="500" height="500" fill="#0A0704"/>
    <g filter="url(#sealShadow)">
      <circle cx="250" cy="250" r="200" fill="url(#terracottaGrad)" stroke="#E07830" stroke-width="4"/>
      <circle cx="250" cy="250" r="185" fill="none" stroke="#FFA366" stroke-width="1.5" stroke-dasharray="6 3"/>
      <!-- Dharmachakra motif in upper register -->
      <circle cx="250" cy="180" r="42" fill="none" stroke="#FDE8D0" stroke-width="4"/>
      <circle cx="250" cy="180" r="14" fill="#5A2006" stroke="#FDE8D0" stroke-width="3"/>
      <!-- Deer motifs -->
      <path d="M 170 195 Q 160 170 180 160 Q 195 175 185 200 Z" fill="#FDE8D0" opacity="0.8"/>
      <path d="M 330 195 Q 340 170 320 160 Q 305 175 315 200 Z" fill="#FDE8D0" opacity="0.8"/>
      <!-- Inscription banner -->
      <rect x="90" y="270" width="320" height="70" rx="8" fill="#3D1402" stroke="#E07830" stroke-width="1.5"/>
      <text x="250" y="302" font-family="serif" font-size="14" font-weight="bold" fill="#FDF5E6" text-anchor="middle" letter-spacing="1">Śrī-Nālandā-Mahāvihārasya</text>
      <text x="250" y="325" font-family="serif" font-size="11" fill="#FFA366" text-anchor="middle" letter-spacing="2">ĀRYA-BHIKṢU-SAṄGHASYA</text>
      <text x="250" y="390" font-family="monospace" font-size="10" fill="#FDE8D0" text-anchor="middle" letter-spacing="3">OFFICIAL MONASTIC SEAL • 7TH-9TH C. CE</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const GAME_ARTIFACTS_MAP: Record<string, GameArtifactData> = {
  manuscript_1: {
    artifactId: "manuscript_1",
    svgImage: createPalmLeafSvg(
      "Verse on Impermanence",
      "Aniccā vata saṅkhārā uppādavayadhammino..."
    ),
    manuscript: {
      title: "Palm-Leaf Fragment I — Prajñāpāramitā Verse on Impermanence",
      originalLanguage: "Sanskrit",
      period: "11th Century CE",
      region: "Nalanda, Bihar",
      classification: "MANUSCRIPT",
      archiveId: "GAME-CH1-MANUSCRIPT-01",
      description:
        "Discovered amid the burning corridors of the Nalanda library ruins during Chapter 1. This charred palm-leaf fragment preserves verses from the Prajñāpāramitā Sūtra expounding the foundational Buddhist doctrine of anicca (impermanence). It details how all composite phenomena arise, decay, and cease, urging the bodhisattva to abide in transcendent awareness without clinging to transient forms.",
      translatedText:
        "Thus spoke the Lord: All conditioned dharmas are like a dream, a phantom, a bubble, a shadow, like dew or a lightning flash — thus should they be contemplated. Whosoever perceives all formations as impermanent, without enduring essence, and subject to ceaseless dissolution, abandons despair even when great halls collapse into cinder. The wise bodhisattva, standing upon the shore of transcendent wisdom, observes the burning of worlds with unwavering compassion, knowing that truth itself can never be consumed by flame.",
      translationSummary:
        "A profound philosophical folio from Nalanda examining the doctrine of impermanence, urging monks to understand all physical creations as evanescent like dreams or morning dew.",
      tags: [
        "prajnaparamita",
        "nalanda",
        "palm-leaf",
        "sanskrit",
        "impermanence",
        "buddhism",
        "chapter-1",
      ],
      sourceInstitution: "Discovered in-game — Chapter 1: The Lost Manuscript",
      sourceUrl: "https://gyanbharatam.com",
      fileType: "image/svg+xml",
      fileName: "game-ch1-manuscript-01.svg",
    },
  },

  manuscript_2: {
    artifactId: "manuscript_2",
    svgImage: createPalmLeafSvg(
      "Verse on Emptiness",
      "Rūpaṃ śūnyatā śūnyataiva rūpam..."
    ),
    manuscript: {
      title: "Palm-Leaf Fragment II — Prajñāpāramitā Verse on Emptiness",
      originalLanguage: "Sanskrit",
      period: "11th Century CE",
      region: "Nalanda, Bihar",
      classification: "MANUSCRIPT",
      archiveId: "GAME-CH1-MANUSCRIPT-02",
      description:
        "Recovered from the upper shelves of the Dharma Gunj library repository. This illuminated fragment contains the seminal teaching on śūnyatā (emptiness of inherent nature), explaining that form is emptiness and emptiness is form. The Sanskrit calligraphy in Eastern Indian proto-Bengali script demonstrates the peak of Pala-period monastic scholarship.",
      translatedText:
        "Form is emptiness, emptiness is form; emptiness does not differ from form, nor form from emptiness; whatever is form, that is emptiness; whatever is emptiness, that is form. In the same way, feelings, perceptions, mental formations, and consciousness are empty. Therefore, Śāriputra, in emptiness there is no form, no feeling, no perception, no volition, no consciousness; no eye, ear, nose, tongue, body, or mind; no decay and death, nor cessation of decay and death. Because there is no attainment, the bodhisattva relies on the perfection of wisdom.",
      translationSummary:
        "The core metaphysical verse of the Prajñāpāramitā tradition declaring the identity of form and emptiness, found intact within the Nalanda library.",
      tags: [
        "prajnaparamita",
        "nalanda",
        "palm-leaf",
        "sanskrit",
        "emptiness",
        "sunyata",
        "buddhism",
        "chapter-1",
      ],
      sourceInstitution: "Discovered in-game — Chapter 1: The Lost Manuscript",
      sourceUrl: "https://gyanbharatam.com",
      fileType: "image/svg+xml",
      fileName: "game-ch1-manuscript-02.svg",
    },
  },

  manuscript_3: {
    artifactId: "manuscript_3",
    svgImage: createPalmLeafSvg(
      "Verse on Compassion",
      "Karuṇā-hṛdayaṃ sarvasattva-trāṇāya..."
    ),
    manuscript: {
      title: "Palm-Leaf Fragment III — Prajñāpāramitā Verse on Compassion",
      originalLanguage: "Sanskrit",
      period: "11th Century CE",
      region: "Nalanda, Bihar",
      classification: "MANUSCRIPT",
      archiveId: "GAME-CH1-MANUSCRIPT-03",
      description:
        "Retrieved from the hidden alcove beneath the main stupa. This fragment emphasizes the inseparable union of wisdom (prajñā) and boundless compassion (karuṇā). It describes the vow of the bodhisattva to preserve knowledge for the liberation of all sentient beings, even in times of catastrophic crisis.",
      translatedText:
        "Just as the great ocean receives all rivers without overflowing or drying up, so does the heart of the bodhisattva embrace all living beings with boundless compassion. Wisdom without compassion is sterile; compassion without wisdom is blind. When darkness descends upon the sacred monasteries and the torch of learning flickers, the scholar who guards even a single syllable with loving kindness preserves the seed of liberation for unborn generations across ten thousand worlds.",
      translationSummary:
        "A stirring poetic meditation on Mahāyāna compassion, commanding the scholar to preserve knowledge through times of peril for the benefit of all humanity.",
      tags: [
        "prajnaparamita",
        "nalanda",
        "palm-leaf",
        "sanskrit",
        "compassion",
        "karuna",
        "mahayana",
        "chapter-1",
      ],
      sourceInstitution: "Discovered in-game — Chapter 1: The Lost Manuscript",
      sourceUrl: "https://gyanbharatam.com",
      fileType: "image/svg+xml",
      fileName: "game-ch1-manuscript-03.svg",
    },
  },

  seal: {
    artifactId: "seal",
    svgImage: createTerracottaSealSvg(),
    manuscript: {
      title: "Terracotta Monastic Seal of Nalanda",
      originalLanguage: "Sanskrit (inscription)",
      period: "7th–9th Century CE",
      region: "Nalanda, Bihar",
      classification: "3D ARTIFACT",
      archiveId: "GAME-CH1-SEAL-01",
      description:
        "The official institutional stamp of the Nalanda Mahavihara discovered in Chapter 1. Made of fired terracotta, this seal features the sacred Wheel of Law (dharmachakra) flanked by two kneeling deer, symbolizing the First Turning of the Wheel of Dharma. Below is the official two-line Sanskrit inscription in Gupta script: 'Śrī-Nālandā-Mahāvihārasya Ārya-Bhikṣu-Saṅghasya' (Of the Venerable Assembly of Monks of the Great Monastery of Nalanda).",
      translatedText:
        "Official Sanskrit Inscription: 'Śrī-Nālandā-Mahāvihārasya Ārya-Bhikṣu-Saṅghasya' [Belonging to the Noble Community of Monks of the Great Monastery of Nalanda].\n\nCurator Analysis: Terracotta seals of this exact configuration were the definitive bureaucratic instrument of Nalanda University. Affixed with wet clay onto rolled birch-bark dispatches, palm-leaf bundles, and academic diplomas, this seal verified the scholarly authority and diplomatic credentials of Nalanda's international emissaries across Tibet, China, Korea, Java, and Sri Lanka.",
      translationSummary:
        "The official terracotta seal of Nalanda Mahavihara featuring the dharmachakra motif and the seal inscription of the governing monastic assembly.",
      tags: [
        "nalanda",
        "seal",
        "terracotta",
        "dharmachakra",
        "archaeological",
        "chapter-1",
      ],
      sourceInstitution: "Discovered in-game — Chapter 1: The Lost Manuscript",
      sourceUrl: "https://asi.nic.in",
      fileType: "image/svg+xml",
      fileName: "game-ch1-seal-01.svg",
    },
  },
};
