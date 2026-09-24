import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
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
} from '@/lib/types';

/**
 * Save complete timeline to Firestore
 */
export async function saveTimeline(timeline: Timeline): Promise<void> {
  const timelineRef = doc(db, 'timelines', timeline.id);
  const batch = writeBatch(db);

  // Save timeline metadata
  batch.set(timelineRef, {
    userId: timeline.userId,
    name: timeline.name,
    createdAt: timeline.createdAt,
    updatedAt: new Date(),
    categories: timeline.categories,
    customFieldDefs: timeline.customFieldDefs,
    bgSettings: timeline.bgSettings,
  });

  // Save people subcollection
  const peopleRef = collection(timelineRef, 'people');
  for (const person of timeline.people) {
    batch.set(doc(peopleRef, person.id), person);
  }

  // Save events subcollection
  const eventsRef = collection(timelineRef, 'events');
  for (const event of timeline.events) {
    batch.set(doc(eventsRef, event.id), event);
  }

  // Save places subcollection
  const placesRef = collection(timelineRef, 'places');
  for (const place of timeline.places) {
    batch.set(doc(placesRef, place.id), place);
  }

  // Save arcs subcollection
  const arcsRef = collection(timelineRef, 'arcs');
  for (const arc of timeline.arcs) {
    batch.set(doc(arcsRef, arc.id), arc);
  }

  // Save markers subcollection
  const markersRef = collection(timelineRef, 'markers');
  for (const marker of timeline.markers) {
    batch.set(doc(markersRef, marker.id), marker);
  }

  // Save eras subcollection
  const erasRef = collection(timelineRef, 'eras');
  for (const era of timeline.eras) {
    batch.set(doc(erasRef, era.id), era);
  }

  // Save relationships subcollection
  const relationshipsRef = collection(timelineRef, 'relationships');
  for (const relationship of timeline.relationships) {
    batch.set(doc(relationshipsRef, relationship.id), relationship);
  }

  // Save dependencies subcollection
  const dependenciesRef = collection(timelineRef, 'dependencies');
  for (const dependency of timeline.dependencies) {
    batch.set(doc(dependenciesRef, dependency.id), dependency);
  }

  // Commit batch
  await batch.commit();
}

/**
 * Load complete timeline from Firestore
 */
export async function loadTimeline(id: string): Promise<Timeline> {
  const timelineRef = doc(db, 'timelines', id);
  const timelineSnap = await getDoc(timelineRef);

  if (!timelineSnap.exists()) {
    throw new Error('Timeline not found');
  }

  const data = timelineSnap.data();

  // Load all subcollections
  const [
    peopleSnap,
    eventsSnap,
    placesSnap,
    arcsSnap,
    markersSnap,
    erasSnap,
    relationshipsSnap,
    dependenciesSnap,
  ] = await Promise.all([
    getDocs(collection(timelineRef, 'people')),
    getDocs(collection(timelineRef, 'events')),
    getDocs(collection(timelineRef, 'places')),
    getDocs(collection(timelineRef, 'arcs')),
    getDocs(collection(timelineRef, 'markers')),
    getDocs(collection(timelineRef, 'eras')),
    getDocs(collection(timelineRef, 'relationships')),
    getDocs(collection(timelineRef, 'dependencies')),
  ]);

  return {
    id: timelineSnap.id,
    userId: data.userId,
    name: data.name,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    people: peopleSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Person)),
    events: eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)),
    places: placesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Place)),
    arcs: arcsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Arc)),
    markers: markersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Marker)),
    eras: erasSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Era)),
    relationships: relationshipsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Relationship)),
    dependencies: dependenciesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Dependency)),
    categories: data.categories || [],
    customFieldDefs: data.customFieldDefs || [],
    bgSettings: data.bgSettings || { type: 'solid', color: '#1a1a1a' },
  };
}

/**
 * Subscribe to timeline changes (real-time)
 */
export function subscribeToTimeline(
  id: string,
  callback: (timeline: Timeline) => void
): Unsubscribe {
  const timelineRef = doc(db, 'timelines', id);

  return onSnapshot(timelineRef, async (snap) => {
    if (!snap.exists()) {
      throw new Error('Timeline not found');
    }

    try {
      const timeline = await loadTimeline(id);
      callback(timeline);
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  });
}

/**
 * List all timelines for a user
 */
export async function listTimelines(userId: string): Promise<Array<{
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  eventCount: number;
  personCount: number;
  categoryColors: string[];
}>> {
  const q = query(
    collection(db, 'timelines'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const timelineRef = doc(db, 'timelines', docSnap.id);

      // Count people and events
      const [peopleSnap, eventsSnap] = await Promise.all([
        getDocs(collection(timelineRef, 'people')),
        getDocs(collection(timelineRef, 'events')),
      ]);

      // Extract category colors
      const categories = (data.categories || []) as Category[];
      const categoryColors = categories.map((cat) => cat.color);

      return {
        id: docSnap.id,
        name: data.name,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        eventCount: eventsSnap.size,
        personCount: peopleSnap.size,
        categoryColors,
      };
    })
  );
}

/**
 * Delete timeline
 */
export async function deleteTimeline(id: string): Promise<void> {
  const timelineRef = doc(db, 'timelines', id);
  const batch = writeBatch(db);

  // Delete all subcollections
  const subcollections = [
    'people',
    'events',
    'places',
    'arcs',
    'markers',
    'eras',
    'relationships',
    'dependencies',
  ];

  for (const subcol of subcollections) {
    const snapshot = await getDocs(collection(timelineRef, subcol));
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
  }

  // Delete timeline document
  batch.delete(timelineRef);

  await batch.commit();
}

/**
 * Create new timeline
 */
export async function createTimeline(
  userId: string,
  name: string,
  initialData?: Partial<Timeline>
): Promise<string> {
  const timelineRef = doc(collection(db, 'timelines'));

  const timeline: Timeline = {
    id: timelineRef.id,
    userId,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    people: initialData?.people || [],
    events: initialData?.events || [],
    categories: initialData?.categories || [],
    places: initialData?.places || [],
    arcs: initialData?.arcs || [],
    markers: initialData?.markers || [],
    eras: initialData?.eras || [],
    relationships: initialData?.relationships || [],
    dependencies: initialData?.dependencies || [],
    customFieldDefs: initialData?.customFieldDefs || [],
    bgSettings: initialData?.bgSettings || { type: 'solid', color: '#1a1a1a' },
  };

  await saveTimeline(timeline);
  return timelineRef.id;
}

/**
 * Update timeline metadata only
 */
export async function updateTimelineMetadata(
  id: string,
  updates: {
    name?: string;
    categories?: Category[];
    customFieldDefs?: any[];
    bgSettings?: any;
  }
): Promise<void> {
  const timelineRef = doc(db, 'timelines', id);
  await updateDoc(timelineRef, {
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Add person to timeline
 */
export async function addPerson(timelineId: string, person: Person): Promise<void> {
  const personRef = doc(db, 'timelines', timelineId, 'people', person.id);
  await setDoc(personRef, person);

  // Update timeline updatedAt
  await updateDoc(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });
}

/**
 * Update person
 */
export async function updatePerson(
  timelineId: string,
  personId: string,
  updates: Partial<Person>
): Promise<void> {
  const personRef = doc(db, 'timelines', timelineId, 'people', personId);
  await updateDoc(personRef, updates);

  // Update timeline updatedAt
  await updateDoc(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });
}

/**
 * Delete person
 */
export async function deletePerson(timelineId: string, personId: string): Promise<void> {
  const personRef = doc(db, 'timelines', timelineId, 'people', personId);
  await deleteDoc(personRef);

  // Update timeline updatedAt
  await updateDoc(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });
}

/**
 * Add event to timeline
 */
export async function addEvent(timelineId: string, event: Event): Promise<void> {
  const eventRef = doc(db, 'timelines', timelineId, 'events', event.id);
  await setDoc(eventRef, event);

  // Update timeline updatedAt
  await updateDoc(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });
}

/**
 * Update event
 */
export async function updateEvent(
  timelineId: string,
  eventId: string,
  updates: Partial<Event>
): Promise<void> {
  const eventRef = doc(db, 'timelines', timelineId, 'events', eventId);
  await updateDoc(eventRef, updates);

  // Update timeline updatedAt
  await updateDoc(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });
}

/**
 * Delete event
 */
export async function deleteEvent(timelineId: string, eventId: string): Promise<void> {
  const eventRef = doc(db, 'timelines', timelineId, 'events', eventId);
  await deleteDoc(eventRef);

  // Update timeline updatedAt
  await updateDoc(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });
}

/**
 * Batch update multiple events
 */
export async function batchUpdateEvents(
  timelineId: string,
  updates: Array<{ id: string; data: Partial<Event> }>
): Promise<void> {
  const batch = writeBatch(db);

  for (const update of updates) {
    const eventRef = doc(db, 'timelines', timelineId, 'events', update.id);
    batch.update(eventRef, update.data);
  }

  // Update timeline updatedAt
  batch.update(doc(db, 'timelines', timelineId), {
    updatedAt: new Date(),
  });

  await batch.commit();
}
