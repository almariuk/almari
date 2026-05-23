import { create } from 'zustand';

interface ListingDraftState {
  // Step 1
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
  motivationTypeId: number | null;

  // Populated at Review step after Supabase insert
  listingId: string | null;

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
  setMotivationTypeId: (id: number | null) => void;
  setListingId: (id: string) => void;
  reset: () => void;
}

const initial: Omit<
  ListingDraftState,
  | 'setPhotoUris'
  | 'setCategoryId'
  | 'setSubcategoryId'
  | 'setWorkTypeId'
  | 'setPatternId'
  | 'setFabricTypeId'
  | 'setOccasionBucketId'
  | 'setColourId'
  | 'setConditionId'
  | 'setCareStatusId'
  | 'setMotivationTypeId'
  | 'setListingId'
  | 'reset'
> = {
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
  motivationTypeId: null,
  listingId: null,
};

export const useListingDraftStore = create<ListingDraftState>((set) => ({
  ...initial,
  setPhotoUris: (uris) => set({ photoUris: uris }),
  // Clearing subcategory when category changes is an invariant, not optional logic
  setCategoryId: (id) => set({ categoryId: id, subcategoryId: null }),
  setSubcategoryId: (id) => set({ subcategoryId: id }),
  setWorkTypeId: (id) => set({ workTypeId: id }),
  setPatternId: (id) => set({ patternId: id }),
  setFabricTypeId: (id) => set({ fabricTypeId: id }),
  setOccasionBucketId: (id) => set({ occasionBucketId: id }),
  setColourId: (id) => set({ colourId: id }),
  setConditionId: (id) => set({ conditionId: id }),
  setCareStatusId: (id) => set({ careStatusId: id }),
  setMotivationTypeId: (id) => set({ motivationTypeId: id }),
  setListingId: (id) => set({ listingId: id }),
  reset: () => set(initial),
}));
