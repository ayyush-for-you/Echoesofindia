export interface Manuscript {
  id: string; // UUID
  title: string;
  originalLanguage: string; // e.g. "Sanskrit", "Pali", "Prakrit", "Tamil", "Unknown"
  period: string; // e.g. "6th Century CE"
  region: string; // e.g. "Nalanda, Bihar"
  description: string; // curator's notes
  tags: string[]; // e.g. ["buddhism", "philosophy", "sutra"]
  originalImageUrl: string; // data URL or blob URL of the uploaded manuscript image
  translatedText: string; // the AI-generated plain English translation
  translationSummary: string; // a 2-3 sentence concise summary
  uploadedAt: string; // ISO date string
  fileType: string; // e.g. "image/png", "application/pdf"
  fileName: string; // original file name
  archiveId?: string; // institutional archive identifier (e.g. "ARC-NAI-1949-CONST-32")
  classification?: string; // artifact type: "CHARTER" | "MANUSCRIPT" | "AUDIO" | "3D ARTIFACT"
  sourceInstitution?: string; // originating government archive name
  sourceUrl?: string; // link to the source portal
}
