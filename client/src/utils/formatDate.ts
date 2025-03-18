// Utility function to format date
export const formatDate = (dateString: string) => {
  if (!dateString || dateString.length < 10) return dateString;
  
  try {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
  } catch (error) {
    return dateString;
  }
}; 