const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function downloadIcs(event) {
  const end = event.end_date || new Date(new Date(event.start_date).getTime() + 2 * 3600000).toISOString();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nexora//Campus Events//EN', 'BEGIN:VEVENT',
    `UID:${event.id}@nexora`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start_date)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${(event.title || '').replace(/[,;\n]/g, ' ')}`,
    `LOCATION:${(event.venue || '').replace(/[,;\n]/g, ' ')}`,
    `DESCRIPTION:${(event.short_description || '').replace(/[,;\n]/g, ' ')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(event.title || 'event').replace(/\W+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}