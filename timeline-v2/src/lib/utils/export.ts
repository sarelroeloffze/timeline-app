import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';
import type { Timeline, Event, Person } from '@/lib/types';
import { fmtDate } from './date';

/**
 * Export element to PNG
 */
export async function exportToPNG(
  elementId: string,
  filename: string = 'timeline.png',
  scale: number = 2
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: null,
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

/**
 * Export element to PDF
 */
export async function exportToPDF(
  elementId: string,
  filename: string = 'timeline.pdf',
  orientation: 'landscape' | 'portrait' = 'landscape',
  paperSize: 'a4' | 'a3' | 'letter' | 'legal' | 'a2' = 'a4',
  scale: number = 2
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

  const width = imgWidth * ratio;
  const height = imgHeight * ratio;
  const x = (pdfWidth - width) / 2;
  const y = (pdfHeight - height) / 2;

  pdf.addImage(imgData, 'PNG', x, y, width, height);
  pdf.save(filename);
}

/**
 * Export timeline to PowerPoint
 */
export async function exportToPPTX(
  timeline: Timeline,
  mode: 'timeline-slide' | 'story-slides' = 'story-slides',
  options: {
    theme?: 'match' | 'dark' | 'light';
    includeImages?: boolean;
    includeSources?: boolean;
  } = {}
): Promise<void> {
  const {
    theme = 'match',
    includeImages = true,
    includeSources = true,
  } = options;

  const pptx = new pptxgen();

  if (mode === 'timeline-slide') {
    // Single slide with timeline image
    await exportTimelineSlide(pptx, timeline, theme);
  } else {
    // Story slides mode
    await exportStorySlides(pptx, timeline, {
      theme,
      includeImages,
      includeSources,
    });
  }

  await pptx.writeFile({ fileName: `${timeline.name}.pptx` });
}

async function exportTimelineSlide(
  pptx: pptxgen,
  timeline: Timeline,
  theme: string
): Promise<void> {
  const slide = pptx.addSlide();

  // Capture timeline as image
  const element = document.getElementById('tl-view-horizontal');
  if (element) {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/png');

    slide.addImage({
      data: imgData,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });
  }

  // Add title bar
  slide.addText(timeline.name, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.75,
    fontSize: 32,
    bold: true,
    color: '#ffffff',
    fill: { color: '#000000', transparency: 30 },
  });
}

async function exportStorySlides(
  pptx: pptxgen,
  timeline: Timeline,
  options: {
    theme: string;
    includeImages: boolean;
    includeSources: boolean;
  }
): Promise<void> {
  const { theme, includeImages, includeSources } = options;

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(timeline.name, {
    x: 1,
    y: 2,
    w: 8,
    h: 1.5,
    fontSize: 44,
    bold: true,
    align: 'center',
    color: theme === 'dark' ? '#ffffff' : '#000000',
  });

  const eventCount = timeline.events.length;
  const yearRange = getYearRange(timeline.events);

  titleSlide.addText(`${eventCount} events • ${yearRange}`, {
    x: 1,
    y: 3.5,
    w: 8,
    h: 0.5,
    fontSize: 18,
    align: 'center',
    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
  });

  // Event slides (chronological)
  const sortedEvents = [...timeline.events].sort((a, b) => {
    const aYear = typeof a.date_start === 'number' ? a.date_start : parseInt(String(a.date_start));
    const bYear = typeof b.date_start === 'number' ? b.date_start : parseInt(String(b.date_start));
    return aYear - bYear;
  });

  for (const event of sortedEvents) {
    const slide = pptx.addSlide();

    // Category color accent bar
    const category = timeline.categories.find((c) => c.name === event.category);
    if (category) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.2,
        h: '100%',
        fill: { color: category.color },
      });
    }

    // Date
    slide.addText(fmtDate(event.date_start, 'bcad', event.dateStartCertainty), {
      x: 0.5,
      y: 0.5,
      w: 4,
      h: 0.5,
      fontSize: 14,
      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
    });

    // Title
    slide.addText(event.title, {
      x: 0.5,
      y: 1,
      w: 4.5,
      h: 1,
      fontSize: 28,
      bold: true,
      color: theme === 'dark' ? '#ffffff' : '#000000',
    });

    // Description
    if (event.description) {
      slide.addText(event.description, {
        x: 0.5,
        y: 2.2,
        w: 4.5,
        h: 3,
        fontSize: 14,
        color: theme === 'dark' ? '#d1d5db' : '#374151',
        valign: 'top',
      });
    }

    // Image (if available and enabled)
    if (includeImages && event.images && event.images.length > 0) {
      slide.addImage({
        path: event.images[0],
        x: 5.5,
        y: 1,
        w: 4,
        h: 4.5,
      });
    }

    // Sources (if enabled)
    if (includeSources && event.sources && event.sources.length > 0) {
      const sourcesText = event.sources
        .slice(0, 3)
        .map((s, i) => `${i + 1}. ${s.title}${s.author ? ` (${s.author})` : ''}`)
        .join('\n');

      slide.addText(sourcesText, {
        x: 0.5,
        y: 6.5,
        w: 9,
        h: 1,
        fontSize: 10,
        color: theme === 'dark' ? '#6b7280' : '#9ca3af',
      });
    }
  }
}

function getYearRange(events: Event[]): string {
  if (events.length === 0) return '';

  const years = events.map((e) =>
    typeof e.date_start === 'number' ? e.date_start : parseInt(String(e.date_start))
  );

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  return `${fmtDate(minYear, 'bcad')} – ${fmtDate(maxYear, 'bcad')}`;
}

/**
 * Export to ICS calendar format
 */
export function exportToICS(events: Event[], timelineName: string): void {
  let ics = 'BEGIN:VCALENDAR\n';
  ics += 'VERSION:2.0\n';
  ics += 'PRODID:-//Timeline App//EN\n';
  ics += `X-WR-CALNAME:${timelineName}\n`;

  for (const event of events) {
    ics += 'BEGIN:VEVENT\n';
    ics += `UID:${event.id}@timeline-app\n`;
    ics += `SUMMARY:${escapeICS(event.title)}\n`;

    if (event.description) {
      ics += `DESCRIPTION:${escapeICS(event.description)}\n`;
    }

    // Add date
    const startDate = formatICSDate(event.date_start);
    ics += `DTSTART:${startDate}\n`;

    if (event.date_end) {
      const endDate = formatICSDate(event.date_end);
      ics += `DTEND:${endDate}\n`;
    }

    // Add recurrence rule if present
    if (event.recurrence) {
      ics += buildRRule(event.recurrence);
    }

    ics += 'END:VEVENT\n';
  }

  ics += 'END:VCALENDAR';

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${timelineName}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatICSDate(date: number | string): string {
  if (typeof date === 'number') {
    // Integer year - use Jan 1st
    const year = date < 0 ? Math.abs(date) : date;
    return `${String(year).padStart(4, '0')}0101`;
  }

  // ISO string
  return date.replace(/-/g, '');
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function buildRRule(recurrence: any): string {
  let rrule = 'RRULE:';
  rrule += `FREQ=${recurrence.frequency.toUpperCase()}`;
  rrule += `;INTERVAL=${recurrence.interval}`;

  if (recurrence.endCondition === 'count' && recurrence.endCount) {
    rrule += `;COUNT=${recurrence.endCount}`;
  } else if (recurrence.endCondition === 'date' && recurrence.endDate) {
    rrule += `;UNTIL=${formatICSDate(recurrence.endDate)}`;
  }

  return rrule + '\n';
}
