/**
 * Date utility functions for EST timezone
 * All display dates should use these functions to ensure consistent EST formatting
 */

/**
 * Format a date string or Date object to EST date string (MM/DD/YYYY)
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Formatted date string in EST timezone
 */
export const formatDateEST = (dateInput) => {
  if (!dateInput) return "-";
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "-";
    
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "-";
  }
};

/**
 * Format a date string or Date object to EST date and time string
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Formatted date and time string in EST timezone
 */
export const formatDateTimeEST = (dateInput) => {
  if (!dateInput) return "-";
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "-";
    
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn("Error formatting datetime:", error);
    return "-";
  }
};

/**
 * Get current date parts in EST timezone
 * @returns {{year: number, month: number, day: number}} Current date parts in EST
 */
export const getESTDateParts = () => {
  const estFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = estFormatter.formatToParts(new Date());
  return {
    year: parseInt(parts.find(p => p.type === 'year').value, 10),
    month: parseInt(parts.find(p => p.type === 'month').value, 10),
    day: parseInt(parts.find(p => p.type === 'day').value, 10),
  };
};

/**
 * Get current year in EST timezone
 * @returns {number} Current year in EST
 */
export const getESTYear = () => {
  return getESTDateParts().year;
};
