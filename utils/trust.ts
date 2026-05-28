import type { ConditionTierRow, ItemCareStatusRow } from '@/types/database';
import type { ListingDraftState } from '@/store/listing-draft';

export type TrustComponent = { label: string; earned: number; max: number };

export const PHOTO_PTS: Record<number, number> = { 4: 4, 5: 5, 6: 6 };

const STATE_LABELS = ['Just listed', 'Starting', 'Building', 'Strong', 'Brilliant'];

export function getStateLabel(score: number, maxScore: number): string {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct < 0.2) return STATE_LABELS[0];
  if (pct < 0.4) return STATE_LABELS[1];
  if (pct < 0.6) return STATE_LABELS[2];
  if (pct < 0.8) return STATE_LABELS[3];
  return STATE_LABELS[4];
}

export function computeTrust(
  draft: ListingDraftState,
  conditionRows: ConditionTierRow[],
  careRows: ItemCareStatusRow[],
): TrustComponent[] {
  const photoCount = Math.min(draft.photoUris.length, 6);
  const photoEarned = PHOTO_PTS[photoCount] ?? (photoCount >= 4 ? 10 : 0);

  const craftEarned =
    (draft.workTypeId !== null ? 2 : 0) +
    (draft.patternId !== null ? 2 : 0) +
    (draft.fabricTypeId !== null ? 1 : 0);

  const occasionEarned = draft.occasionBucketId !== null ? 2 : 0;
  const colourEarned = draft.colourId !== null ? 2 : 0;

  const conditionRow = conditionRows.find((r) => r.id === draft.conditionId);
  const conditionEarned = conditionRow?.listing_trust_contribution ?? 0;
  const conditionMax =
    conditionRows.length > 0
      ? Math.max(...conditionRows.map((r) => r.listing_trust_contribution))
      : 10;

  let provenanceEarned = 0;
  if (draft.isHeirloom) {
    provenanceEarned = draft.heirloomStory.trim().length > 0 ? 8 : 0;
  } else {
    if (draft.provenanceCityId !== null) provenanceEarned += 2;
    if (draft.provenanceAreaId !== null) provenanceEarned += 1;
    if (draft.sellerTypeId !== null) provenanceEarned += 1;
    if (draft.purchaseYear.trim().length > 0) provenanceEarned += 2;
    if (draft.originalPriceInr.trim().length > 0) provenanceEarned += 2;
  }

  const careRow = careRows.find((r) => r.id === draft.careStatusId);
  const careEarned = careRow?.listing_trust_contribution ?? 0;
  const careMax =
    careRows.length > 0 ? Math.max(...careRows.map((r) => r.listing_trust_contribution)) : 10;

  const measurements: [string, number][] = [
    [draft.listingBustCm, 1],
    [draft.listingWaistCm, 1],
    [draft.listingHipsCm, 1],
    [draft.listingChestCm, 1],
    [draft.listingHeightCm, 1],
    [draft.listingUkShoeSize, 1],
    [draft.listingLabelSize, 1],
  ];
  const measurementsEarned = measurements.reduce(
    (acc, [v, pts]) => acc + (v.trim().length > 0 ? pts : 0),
    0,
  );

  const setEarned =
    (draft.whatIsIncluded.trim().length > 0 ? 1 : 0) +
    (draft.isSetComplete !== null ? 2 : 0);

  const motivationEarned = draft.motivationTypeId !== null ? 2 : 0;
  const notesEarned = draft.additionalNotes.trim().length > 0 ? 2 : 0;

  return [
    { label: 'Photos', earned: photoEarned, max: 6 },
    { label: 'Craft detail', earned: craftEarned, max: 5 },
    { label: 'Occasion', earned: occasionEarned, max: 2 },
    { label: 'Colour', earned: colourEarned, max: 2 },
    { label: 'Condition', earned: conditionEarned, max: conditionMax },
    { label: 'Provenance', earned: provenanceEarned, max: 8 },
    { label: 'Care', earned: careEarned, max: careMax },
    { label: 'Measurements', earned: measurementsEarned, max: 7 },
    { label: 'Set info', earned: setEarned, max: 3 },
    { label: 'Why selling', earned: motivationEarned, max: 2 },
    { label: 'Additional notes', earned: notesEarned, max: 2 },
  ];
}
