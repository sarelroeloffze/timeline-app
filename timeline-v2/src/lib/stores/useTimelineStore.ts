import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Timeline,
  Person,
  Event,
  Category,
  Place,
  Arc,
  Marker,
  Era,
  Relationship,
  Dependency,
  CustomFieldDef,
  BackgroundSettings,
  ViewMode,
} from '@/lib/types';

interface TimelineState {
  // Current Timeline
  currentTimeline: Timeline | null;

  // Timeline Data
  people: Person[];
  events: Event[];
  categories: Category[];
  places: Place[];
  arcs: Arc[];
  markers: Marker[];
  eras: Era[];
  relationships: Relationship[];
  dependencies: Dependency[];
  customFieldDefs: CustomFieldDef[];
  bgSettings: BackgroundSettings;

  // UI State
  viewMode: ViewMode;
  selectedEventIds: Set<string>;

  // Actions - Timeline
  setTimeline: (timeline: Timeline) => void;
  clearTimeline: () => void;

  // Actions - People
  setPeople: (people: Person[]) => void;
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;

  // Actions - Events
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;

  // Actions - Categories
  setCategories: (categories: Category[]) => void;

  // Actions - Places
  addPlace: (place: Place) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;

  // Actions - Arcs
  addArc: (arc: Arc) => void;
  updateArc: (id: string, updates: Partial<Arc>) => void;
  deleteArc: (id: string) => void;

  // Actions - Markers
  addMarker: (marker: Marker) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  deleteMarker: (id: string) => void;

  // Actions - Eras
  setEras: (eras: Era[]) => void;

  // Actions - Relationships
  addRelationship: (relationship: Relationship) => void;
  deleteRelationship: (id: string) => void;

  // Actions - Dependencies
  addDependency: (dependency: Dependency) => void;
  deleteDependency: (id: string) => void;

  // Actions - Background
  setBgSettings: (settings: BackgroundSettings) => void;

  // Actions - UI
  setViewMode: (mode: ViewMode) => void;
  setSelectedEventIds: (ids: Set<string>) => void;

  // Computed/Helpers
  getPersonById: (id: string) => Person | undefined;
  getEventById: (id: string) => Event | undefined;
}

const DEFAULT_BG_SETTINGS: BackgroundSettings = {
  type: 'solid',
  color: '#1a1a1a',
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentTimeline: null,
      people: [],
      events: [],
      categories: [],
      places: [],
      arcs: [],
      markers: [],
      eras: [],
      relationships: [],
      dependencies: [],
      customFieldDefs: [],
      bgSettings: DEFAULT_BG_SETTINGS,
      viewMode: 'horizontal',
      selectedEventIds: new Set(),

      // Timeline Actions
      setTimeline: (timeline) => set({
        currentTimeline: timeline,
        people: timeline.people,
        events: timeline.events,
        categories: timeline.categories,
        places: timeline.places,
        arcs: timeline.arcs,
        markers: timeline.markers,
        eras: timeline.eras,
        relationships: timeline.relationships,
        dependencies: timeline.dependencies,
        customFieldDefs: timeline.customFieldDefs,
        bgSettings: timeline.bgSettings,
      }),

      clearTimeline: () => set({
        currentTimeline: null,
        people: [],
        events: [],
        categories: [],
        places: [],
        arcs: [],
        markers: [],
        eras: [],
        relationships: [],
        dependencies: [],
        customFieldDefs: [],
        bgSettings: DEFAULT_BG_SETTINGS,
        selectedEventIds: new Set(),
      }),

      // People Actions
      setPeople: (people) => set({ people }),

      addPerson: (person) => set((state) => ({
        people: [...state.people, person],
      })),

      updatePerson: (id, updates) => set((state) => ({
        people: state.people.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

      deletePerson: (id) => set((state) => ({
        people: state.people.filter((p) => p.id !== id),
        // Also remove from events
        events: state.events.map((e) => ({
          ...e,
          peopleIds: e.peopleIds.filter((pid) => pid !== id),
        })),
        // Remove relationships
        relationships: state.relationships.filter(
          (r) => r.fromId !== id && r.toId !== id
        ),
      })),

      // Event Actions
      setEvents: (events) => set({ events }),

      addEvent: (event) => set((state) => ({
        events: [...state.events, event],
      })),

      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        // Remove from arcs
        arcs: state.arcs.map((a) => ({
          ...a,
          eventIds: a.eventIds.filter((eid) => eid !== id),
        })),
        // Remove dependencies
        dependencies: state.dependencies.filter(
          (d) => d.fromEventId !== id && d.toEventId !== id
        ),
        // Clear selection if deleted
        selectedEventIds: new Set(
          Array.from(state.selectedEventIds).filter((eid) => eid !== id)
        ),
      })),

      // Category Actions
      setCategories: (categories) => set({ categories }),

      // Place Actions
      addPlace: (place) => set((state) => ({
        places: [...state.places, place],
      })),

      updatePlace: (id, updates) => set((state) => ({
        places: state.places.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),

      deletePlace: (id) => set((state) => ({
        places: state.places.filter((p) => p.id !== id),
        // Clear placeId from events
        events: state.events.map((e) =>
          e.placeId === id ? { ...e, placeId: null } : e
        ),
      })),

      // Arc Actions
      addArc: (arc) => set((state) => ({
        arcs: [...state.arcs, arc],
      })),

      updateArc: (id, updates) => set((state) => ({
        arcs: state.arcs.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),

      deleteArc: (id) => set((state) => ({
        arcs: state.arcs.filter((a) => a.id !== id),
      })),

      // Marker Actions
      addMarker: (marker) => set((state) => ({
        markers: [...state.markers, marker],
      })),

      updateMarker: (id, updates) => set((state) => ({
        markers: state.markers.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),

      deleteMarker: (id) => set((state) => ({
        markers: state.markers.filter((m) => m.id !== id),
      })),

      // Era Actions
      setEras: (eras) => set({ eras }),

      // Relationship Actions
      addRelationship: (relationship) => set((state) => ({
        relationships: [...state.relationships, relationship],
      })),

      deleteRelationship: (id) => set((state) => ({
        relationships: state.relationships.filter((r) => r.id !== id),
      })),

      // Dependency Actions
      addDependency: (dependency) => set((state) => ({
        dependencies: [...state.dependencies, dependency],
      })),

      deleteDependency: (id) => set((state) => ({
        dependencies: state.dependencies.filter((d) => d.id !== id),
      })),

      // Background Actions
      setBgSettings: (settings) => set({ bgSettings: settings }),

      // UI Actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setSelectedEventIds: (ids) => set({ selectedEventIds: ids }),

      // Computed
      getPersonById: (id) => get().people.find((p) => p.id === id),
      getEventById: (id) => get().events.find((e) => e.id === id),
    }),
    {
      name: 'timeline-storage',
      partialize: (state) => ({
        // Only persist certain fields
        viewMode: state.viewMode,
      }),
    }
  )
);
