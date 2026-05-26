import { create } from 'zustand';

// ── Data shape (all serialisable values) ─────────────────────
interface ListingDraftData {
  // Step 1 — Item details
  photoUris: string[];
  categoryId: number | null;
  subcategoryId: number | null;
  workTypeId: number | null;
  patternId: number | null;
  fabricTypeId: number | null;
  occasionBucketId: number | null;
  colourId: number | null;
  conditionId: number | null;
  careStatusId: number | null;
  whySellingCopyId: number | null;
  motivationTypeId: number | null;

  // Step 2 — Provenance
  isHeirloom: boolean;
  heirloomStory: string;
  provenanceCityId: number | null;
  provenanceCityOther: boolean;
  provenanceAreaId: number | null;
  sellerTypeId: number | null;
  purchaseYear: string;
  originalPriceInr: string;
  originalPriceCurrency: 'INR' | 'GBP';
  originalPriceApproximate: boolean;

  // Step 2 — Garment measurements
  listingBustCm: string;
  listingWaistCm: string;
  listingHipsCm: string;
  listingChestCm: string;
  listingHeightCm: string;
  listingUkShoeSize: string;
  listingLabelSize: string;

  // Step 2 — Set
  whatIsIncluded: string;
  isSetComplete: boolean | null;

  // Step 2 — Additional notes
  additionalNotes: string;

  // Step 2 — Postage
  packageBandId: number | null;
  postageServiceId: number | null;

  // Step 3 — Pricing
  askingPricePence: number | null;

  // Populated at Review step after Supabase insert
  listingId: string | null;
}

// ── Actions ──────────────────────────────────────────────────
interface ListingDraftActions {
  // Step 1
  setPhotoUris: (uris: string[]) => void;
  setCategoryId: (id: number | null) => void;
  setSubcategoryId: (id: number | null) => void;
  setWorkTypeId: (id: number | null) => void;
  setPatternId: (id: number | null) => void;
  setFabricTypeId: (id: number | null) => void;
  setOccasionBucketId: (id: number | null) => void;
  setColourId: (id: number | null) => void;
  setConditionId: (id: number | null) => void;
  setCareStatusId: (id: number | null) => void;
  setWhySellingCopyId: (id: number | null) => void;
  setMotivationTypeId: (id: number | null) => void;
  // Step 2 — Provenance
  setIsHeirloom: (v: boolean) => void;
  setHeirloomStory: (v: string) => void;
  setProvenanceCityId: (id: number | null) => void;
  setProvenanceCityOther: (v: boolean) => void;
  setProvenanceAreaId: (id: number | null) => void;
  setSellerTypeId: (id: number | null) => void;
  setPurchaseYear: (v: string) => void;
  setOriginalPriceInr: (v: string) => void;
  setOriginalPriceCurrency: (v: 'INR' | 'GBP') => void;
  setOriginalPriceApproximate: (v: boolean) => void;
  // Step 2 — Measurements
  setListingBustCm: (v: string) => void;
  setListingWaistCm: (v: string) => void;
  setListingHipsCm: (v: string) => void;
  setListingChestCm: (v: string) => void;
  setListingHeightCm: (v: string) => void;
  setListingUkShoeSize: (v: string) => void;
  setListingLabelSize: (v: string) => void;
  // Step 2 — Set
  setWhatIsIncluded: (v: string) => void;
  setIsSetComplete: (v: boolean | null) => void;
  // Step 2 — Additional notes
  setAdditionalNotes: (v: string) => void;
  // Step 2 — Postage
  setPackageBandId: (id: number | null) => void;
  setPostageServiceId: (id: number | null) => void;
  // Step 3 — Pricing
  setAskingPricePence: (pence: number | null) => void;
  // Review
  setListingId: (id: string) => void;
  reset: () => void;
}

export type ListingDraftState = ListingDraftData & ListingDraftActions;

// ── Initial data ─────────────────────────────────────────────
const initialData: ListingDraftData = {
  photoUris: [],
  categoryId: null,
  subcategoryId: null,
  workTypeId: null,
  patternId: null,
  fabricTypeId: null,
  occasionBucketId: null,
  colourId: null,
  conditionId: null,
  careStatusId: null,
  whySellingCopyId: null,
  motivationTypeId: null,
  isHeirloom: false,
  heirloomStory: '',
  provenanceCityId: null,
  provenanceCityOther: false,
  provenanceAreaId: null,
  sellerTypeId: null,
  purchaseYear: '',
  originalPriceInr: '',
  originalPriceCurrency: 'INR',
  originalPriceApproximate: false,
  listingBustCm: '',
  listingWaistCm: '',
  listingHipsCm: '',
  listingChestCm: '',
  listingHeightCm: '',
  listingUkShoeSize: '',
  listingLabelSize: '',
  whatIsIncluded: '',
  isSetComplete: null,
  additionalNotes: '',
  packageBandId: null,
  postageServiceId: null,
  askingPricePence: null,
  listingId: null,
};

export const useListingDraftStore = create<ListingDraftState>((set) => ({
  ...initialData,

  // Step 1
  setPhotoUris: (uris) => set({ photoUris: uris }),
  setCategoryId: (id) => set({ categoryId: id, subcategoryId: null }),
  setSubcategoryId: (id) => set({ subcategoryId: id }),
  setWorkTypeId: (id) => set({ workTypeId: id }),
  setPatternId: (id) => set({ patternId: id }),
  setFabricTypeId: (id) => set({ fabricTypeId: id }),
  setOccasionBucketId: (id) => set({ occasionBucketId: id }),
  setColourId: (id) => set({ colourId: id }),
  setConditionId: (id) => set({ conditionId: id }),
  setCareStatusId: (id) => set({ careStatusId: id }),
  setWhySellingCopyId: (id) => set({ whySellingCopyId: id }),
  setMotivationTypeId: (id) => set({ motivationTypeId: id }),

  // Step 2 — Provenance
  // Toggling heirloom clears the opposing set of fields — invariant, not UI logic
  setIsHeirloom: (v) =>
    set(
      v
        ? {
            isHeirloom: true,
            provenanceCityId: null,
            provenanceCityOther: false,
            provenanceAreaId: null,
            sellerTypeId: null,
            purchaseYear: '',
            originalPriceInr: '',
            originalPriceCurrency: 'INR',
            originalPriceApproximate: false,
          }
        : { isHeirloom: false, heirloomStory: '' }
    ),
  setHeirloomStory: (v) => set({ heirloomStory: v }),
  setProvenanceCityId: (id) => set({ provenanceCityId: id, provenanceCityOther: false, provenanceAreaId: null, originalPriceInr: '', originalPriceApproximate: false }),
  setProvenanceCityOther: (v) => set({ provenanceCityOther: v }),
  setProvenanceAreaId: (id) => set({ provenanceAreaId: id }),
  setSellerTypeId: (id) => set({ sellerTypeId: id }),
  setPurchaseYear: (v) => set({ purchaseYear: v }),
  setOriginalPriceInr: (v) => set({ originalPriceInr: v }),
  setOriginalPriceCurrency: (v) => set({ originalPriceCurrency: v }),
  setOriginalPriceApproximate: (v) => set({ originalPriceApproximate: v }),

  // Step 2 — Measurements
  setListingBustCm: (v) => set({ listingBustCm: v }),
  setListingWaistCm: (v) => set({ listingWaistCm: v }),
  setListingHipsCm: (v) => set({ listingHipsCm: v }),
  setListingChestCm: (v) => set({ listingChestCm: v }),
  setListingHeightCm: (v) => set({ listingHeightCm: v }),
  setListingUkShoeSize: (v) => set({ listingUkShoeSize: v }),
  setListingLabelSize: (v) => set({ listingLabelSize: v }),

  // Step 2 — Set
  setWhatIsIncluded: (v) => set({ whatIsIncluded: v }),
  setIsSetComplete: (v) => set({ isSetComplete: v }),

  // Step 2 — Additional notes
  setAdditionalNotes: (v) => set({ additionalNotes: v }),

  // Step 2 — Postage
  // Changing band invalidates any previously selected service
  setPackageBandId: (id) => set({ packageBandId: id, postageServiceId: null }),
  setPostageServiceId: (id) => set({ postageServiceId: id }),

  // Step 3 — Pricing
  setAskingPricePence: (pence) => set({ askingPricePence: pence }),

  // Review
  setListingId: (id) => set({ listingId: id }),
  reset: () => set(initialData),
}));
