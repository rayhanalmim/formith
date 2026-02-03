// CSV Export utility functions

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
) {
  if (!data || data.length === 0) {
    return;
  }

  // Determine columns to use
  const columnDefs = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    header: key.toString(),
  }));

  // Create CSV header
  const headers = columnDefs.map(col => `"${col.header}"`).join(',');

  // Create CSV rows
  const rows = data.map(row => {
    return columnDefs.map(col => {
      const value = row[col.key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '""';
      }
      
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  // Combine header and rows
  const csvContent = [headers, ...rows].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format date for CSV
export function formatDateForCSV(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
