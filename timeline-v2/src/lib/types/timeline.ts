// Core Timeline Types

export type DateValue = number | string; // Integer year or ISO string
export type DateCertainty = 'exact' | 'circa' | 'estimated' | 'unknown';
export type DateFormat = 'bcad' | 'signed' | 'full';
export type EventStatus = 'planned' | 'active' | 'done' | 'cancelled' | 'at-risk';
export type RelationshipType = 'parent' | 'spouse' | 'influenced';
export type DependencyType = 'fs' | 'ss' | 'ff'; // Finish-Start, Start-Start, Finish-Finish
export type ShareRole = 'viewer' | 'commenter' | 'editor';

export interface Timeline {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface Person {
  id: string;
  name: string;
  birth: DateValue | null;
  birthCertainty: DateCertainty;
  death: DateValue | null;
  deathCertainty: DateCertainty;
  role: string;
  color: string;
  photoUrl: string;
  tags: string[];
  visible: boolean;
}

export interface Event {
  id: string;
  title: string;
  date_start: DateValue;
  dateStartCertainty: DateCertainty;
  date_end: DateValue | null;
  dateEndCertainty: DateCertainty;
  description: string;
  category: string;
  peopleIds: string[];
  location: Location;
  placeId: string | null;
  tags: string[];
  sources: Source[];
  customFields: CustomField[];
  parentEventId: string | null;
  recurrence: Recurrence | null;
  progress: number; // 0-100
  status: EventStatus;
  images: string[]; // Firebase Storage URLs
  visible: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  color: string;
}

export interface Arc {
  id: string;
  name: string;
  color: string;
  description: string;
  eventIds: string[];
}

export interface Marker {
  id: string;
  name: string;
  date: DateValue;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  labelPos: 'top' | 'bottom';
  visible: boolean;
  builtIn?: boolean; // true for "Today" marker
}

export interface Era {
  id: string;
  name: string;
  yearStart: number;
  yearEnd: number;
  background: BackgroundSettings;
  labelColor: string;
}

export interface Relationship {
  id: string;
  fromId: string; // Person ID
  toId: string; // Person ID
  type: RelationshipType;
}

export interface Dependency {
  id: string;
  fromEventId: string;
  toEventId: string;
  type: DependencyType;
}

export interface CustomFieldDef {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'url';
}

export interface CustomField {
  key: string;
  value: string | number | boolean;
}

export interface Location {
  name: string;
  lat: number | null;
  lon: number | null;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  author?: string;
  year?: string;
  type: 'Book' | 'Article' | 'Website' | 'Document' | 'Archive' | 'Interview' | 'Other';
  confidence: 'primary' | 'secondary' | 'unverified';
}

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0=Sunday, 6=Saturday (for weekly)
  endCondition: 'never' | 'count' | 'date';
  endCount?: number;
  endDate?: DateValue;
}

export interface BackgroundSettings {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: 'to-top' | 'to-bottom' | 'to-left' | 'to-right' | 'to-top-right' | 'to-top-left' | 'to-bottom-right' | 'to-bottom-left';
  imageUrl?: string;
}

// UI State Types
export type ViewMode =
  | 'horizontal'
  | 'vertical'
  | 'data'
  | 'canvas'
  | 'flow'
  | 'thread'
  | 'subway'
  | 'tree'
  | 'radial'
  | 'gantt'
  | 'slides'
  | 'map'
  | 'report';

export interface ViewState {
  mode: ViewMode;
  zoom: number;
  panX: number;
  panY: number;
}

export interface FilterState {
  hiddenPeople: Set<string>;
  hiddenCategories: Set<string>;
  hiddenTags: Set<string>;
  hiddenEvents: Set<string>;
  searchQuery: string;
}

// Firestore document structure
export interface TimelineDoc {
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  // Subcollections: people, events, relationships, dependencies, etc.
}
