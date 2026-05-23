import { create } from 'zustand';

interface ListingDraftState {
  // Step 1
  photoUris: string[];
  categoryId: number | null;
  subcategoryId: number | null;
  occasionBucketId: number | null;
  colourId: number | null;
  conditionId: number | null;
  motivationTypeId: number | null;

  // Populated at Review step after Supabase insert
  listingId: string | null;

  setPhotoUris: (uris: string[]) => void;
  setCategoryId: (id: number | null) => void;
  setSubcategoryId: (id: number | null) => void;
  setOccasionBucketId: (id: number | null) => void;
  setColourId: (id: number | null) => void;
  setConditionId: (id: number | null) => void;
  setMotivationTypeId: (id: number | null) => void;
  setListingId: (id: string) => void;
  reset: () => void;
}

const initial: Omit<
  ListingDraftState,
  | 'setPhotoUris'
  | 'setCategoryId'
  | 'setSubcategoryId'
  | 'setOccasionBucketId'
  | 'setColourId'
  | 'setConditionId'
  | 'setMotivationTypeId'
  | 'setListingId'
  | 'reset'
> = {
  photoUris: [],
  categoryId: null,
  subcategoryId: null,
  occasionBucketId: null,
  colourId: null,
  conditionId: null,
  motivationTypeId: null,
  listingId: null,
};

export const useListingDraftStore = create<ListingDraftState>((set) => ({
  ...initial,
  setPhotoUris: (uris) => set({ photoUris: uris }),
  // Clearing subcategory when category changes is an invariant, not optional logic
  setCategoryId: (id) => set({ categoryId: id, subcategoryId: null }),
  setSubcategoryId: (id) => set({ subcategoryId: id }),
  setOccasionBucketId: (id) => set({ occasionBucketId: id }),
  setColourId: (id) => set({ colourId: id }),
  setConditionId: (id) => set({ conditionId: id }),
  setMotivationTypeId: (id) => set({ motivationTypeId: id }),
  setListingId: (id) => set({ listingId: id }),
  reset: () => set(initial),
}));
