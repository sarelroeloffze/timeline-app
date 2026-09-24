import type { Person, Event, Relationship, DateValue } from '@/lib/types';
import { parseDate } from './date';
import { uid, stringToColor } from './helpers';

/**
 * Parse CSV text to 2D array
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim())) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Add last row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim())) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Build CSV text from 2D array
 */
export function buildCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          // Quote if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Convert CSV rows to Person array
 */
export function csvRowsToPeople(rows: string[][]): Person[] {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const people: Person[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const person: Partial<Person> = {
      id: uid(),
      visible: true,
      tags: [],
    };

    header.forEach((col, index) => {
      const value = row[index]?.trim();
      if (!value) return;

      if (col === 'name') person.name = value;
      else if (col === 'birth') person.birth = parseDate(value) || null;
      else if (col === 'death') person.death = parseDate(value) || null;
      else if (col === 'role' || col === 'description') person.role = value;
      else if (col === 'color' || col === 'colour') person.color = value;
      else if (col === 'photo' || col === 'photourl') person.photoUrl = value;
      else if (col === 'tags') person.tags = value.split(';').map((t) => t.trim());
    });

    // Set defaults
    if (!person.name) continue; // Skip if no name
    if (!person.color) person.color = stringToColor(person.name);
    if (!person.role) person.role = '';
    if (!person.photoUrl) person.photoUrl = '';

    people.push(person as Person);
  }

  return people;
}

/**
 * Convert CSV rows to Event array
 */
export function csvRowsToEvents(rows: string[][], existingPeople: Person[]): Event[] {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase().trim());
  const events: Event[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const event: Partial<Event> = {
      id: uid(),
      visible: true,
      peopleIds: [],
      tags: [],
      sources: [],
      customFields: [],
      images: [],
      progress: 0,
      status: 'planned',
      location: { name: '', lat: null, lon: null },
    };

    header.forEach((col, index) => {
      const value = row[index]?.trim();
      if (!value) return;

      if (col === 'title') event.title = value;
      else if (col === 'start' || col === 'date_start') event.date_start = parseDate(value)!;
      else if (col === 'end' || col === 'date_end') event.date_end = parseDate(value) || null;
      else if (col === 'description') event.description = value;
      else if (col === 'category') event.category = value;
      else if (col === 'people') {
        // Match people by name
        const names = value.split(';').map((n) => n.trim());
        event.peopleIds = existingPeople
          .filter((p) => names.includes(p.name))
          .map((p) => p.id);
      } else if (col === 'location') event.location!.name = value;
      else if (col === 'tags') event.tags = value.split(';').map((t) => t.trim());
    });

    // Set defaults
    if (!event.title) continue; // Skip if no title
    if (!event.date_start) continue; // Skip if no start date
    if (!event.description) event.description = '';
    if (!event.category) event.category = 'Uncategorised';

    events.push(event as Event);
  }

  return events;
}

/**
 * Parse GEDCOM file
 */
export function parseGEDCOM(text: string): {
  people: Person[];
  events: Event[];
  relationships: Relationship[];
} {
  const lines = text.split('\n').map((line) => line.trim());
  const people: Person[] = [];
  const relationships: Relationship[] = [];
  const events: Event[] = [];
  const famRecords: any[] = [];

  let currentRecord: any = null;
  let currentType: 'INDI' | 'FAM' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+)\s+(@\w+@)?\s*(\w+)\s*(.*)$/);
    if (!match) continue;

    const [, level, id, tag, value] = match;
    const lvl = parseInt(level);

    if (lvl === 0) {
      // Save previous record
      if (currentRecord && currentType === 'INDI') {
        people.push(gedcomToPerson(currentRecord));
      } else if (currentRecord && currentType === 'FAM') {
        famRecords.push(currentRecord);
      }

      // Start new record
      if (tag === 'INDI') {
        currentRecord = { id: id, type: 'INDI', data: {} };
        currentType = 'INDI';
      } else if (tag === 'FAM') {
        currentRecord = { id: id, type: 'FAM', data: {} };
        currentType = 'FAM';
      } else {
        currentRecord = null;
        currentType = null;
      }
    } else if (currentRecord && lvl === 1) {
      // Add data to current record
      if (tag === 'NAME') {
        currentRecord.data.name = value;
      } else if (tag === 'BIRT' || tag === 'DEAT' || tag === 'MARR') {
        currentRecord.data[tag.toLowerCase()] = {};
        // Read next line for DATE
        if (i + 1 < lines.length && lines[i + 1].startsWith('2 DATE')) {
          currentRecord.data[tag.toLowerCase()].date = lines[i + 1].substring(7).trim();
          i++;
        }
      } else if (tag === 'OCCU') {
        currentRecord.data.occupation = value;
      } else if (tag === 'NOTE') {
        currentRecord.data.note = value;
      } else if (tag === 'HUSB' || tag === 'WIFE' || tag === 'CHIL') {
        if (!currentRecord.data[tag.toLowerCase()]) {
          currentRecord.data[tag.toLowerCase()] = [];
        }
        currentRecord.data[tag.toLowerCase()].push(value);
      }
    }
  }

  // Save last record
  if (currentRecord && currentType === 'INDI') {
    people.push(gedcomToPerson(currentRecord));
  } else if (currentRecord && currentType === 'FAM') {
    famRecords.push(currentRecord);
  }

  // Process family records
  for (const fam of famRecords) {
    const husb = fam.data.husb?.[0];
    const wife = fam.data.wife?.[0];
    const children = fam.data.chil || [];

    // Spouse relationship
    if (husb && wife) {
      const husbPerson = people.find((p) => p.id === husb);
      const wifePerson = people.find((p) => p.id === wife);
      if (husbPerson && wifePerson) {
        relationships.push({
          id: uid(),
          fromId: husbPerson.id,
          toId: wifePerson.id,
          type: 'spouse',
        });
      }

      // Marriage event
      if (fam.data.marr?.date) {
        const marriageDate = parseGEDCOMDate(fam.data.marr.date);
        if (marriageDate && husbPerson && wifePerson) {
          events.push({
            id: uid(),
            title: `Marriage: ${husbPerson.name} & ${wifePerson.name}`,
            date_start: marriageDate,
            dateStartCertainty: 'exact',
            date_end: null,
            dateEndCertainty: 'exact',
            description: '',
            category: 'Personal',
            peopleIds: [husbPerson.id, wifePerson.id],
            location: { name: '', lat: null, lon: null },
            placeId: null,
            tags: ['Marriage'],
            sources: [],
            customFields: [],
            parentEventId: null,
            recurrence: null,
            progress: 100,
            status: 'done',
            images: [],
            visible: true,
          });
        }
      }
    }

    // Parent-child relationships
    for (const childId of children) {
      if (husb) {
        const parent = people.find((p) => p.id === husb);
        const child = people.find((p) => p.id === childId);
        if (parent && child) {
          relationships.push({
            id: uid(),
            fromId: parent.id,
            toId: child.id,
            type: 'parent',
          });
        }
      }
      if (wife) {
        const parent = people.find((p) => p.id === wife);
        const child = people.find((p) => p.id === childId);
        if (parent && child) {
          relationships.push({
            id: uid(),
            fromId: parent.id,
            toId: child.id,
            type: 'parent',
          });
        }
      }
    }
  }

  return { people, events, relationships };
}

function gedcomToPerson(record: any): Person {
  const name = record.data.name || 'Unknown';
  const birth = record.data.birt?.date ? parseGEDCOMDate(record.data.birt.date) : null;
  const death = record.data.deat?.date ? parseGEDCOMDate(record.data.deat.date) : null;

  return {
    id: record.id,
    name: name.replace(/\//g, ''), // Remove GEDCOM name slashes
    birth,
    birthCertainty: birth ? 'exact' : 'unknown',
    death,
    deathCertainty: death ? 'exact' : 'unknown',
    role: record.data.occupation || '',
    color: stringToColor(name),
    photoUrl: '',
    tags: [],
    visible: true,
  };
}

function parseGEDCOMDate(dateStr: string): DateValue | null {
  // GEDCOM dates: "12 JUN 1842", "ABT 1800", "BEF 1900", etc.
  const match = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const monthNum = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(month) + 1;
    if (monthNum > 0) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Just a year
  const yearMatch = dateStr.match(/(\d{4})/);
  if (yearMatch) {
    return parseInt(yearMatch[1]);
  }

  return null;
}
