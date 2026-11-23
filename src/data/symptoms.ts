/**
 * Undiagnosed route: pick body areas or symptoms. Each maps to a kind of panel to ask about
 * and to symptom tags used to match free sponsored programmes (src/data/programmes.ts).
 * Labels and panel names are English i18n keys.
 */
export interface Symptom {
  id: string;
  label: string;
  panel: string;
}

export const SYMPTOMS: Symptom[] = [
  { id: "development", label: "Late to sit, walk or talk, or learning difficulties", panel: "a developmental delay or intellectual disability panel, an exome, or a genome" },
  { id: "seizures", label: "Seizures (fits) or epilepsy", panel: "an epilepsy panel" },
  { id: "muscle", label: "Weak muscles, falls, or trouble climbing stairs", panel: "a neuromuscular panel (and a test for missing or extra exons)" },
  { id: "movement", label: "Problems with movement, balance or stiffness", panel: "a movement disorder or ataxia panel (repeats may need a separate test)" },
  { id: "heart", label: "Heart muscle or heart rhythm problems", panel: "a cardiomyopathy or heart rhythm panel" },
  { id: "eyes", label: "Sight loss, retina problems or early cataracts", panel: "an inherited eye disease panel" },
  { id: "hearing", label: "Hearing loss", panel: "a hearing loss panel" },
  { id: "liver", label: "Liver problems or yellow skin and eyes (jaundice)", panel: "a liver or cholestasis panel" },
  { id: "kidney", label: "Kidney problems", panel: "a kidney disease panel" },
  { id: "skin", label: "Skin, hair or nail differences", panel: "a skin condition panel" },
  { id: "growth", label: "Growth, weight or hormone problems", panel: "a growth or endocrine panel" },
  { id: "bones", label: "Bone, joint or skeleton differences", panel: "a skeletal dysplasia or connective tissue panel" },
  { id: "metabolic", label: "Feeding problems, low energy, or results that suggest a metabolic condition", panel: "a metabolic panel, often with blood and urine tests first" },
  { id: "birth", label: "Differences present at birth (for example heart, face or hands)", panel: "a chromosome microarray, an exome, or a genome" },
];
