// This file contains common dark theme class mappings for quick updates

export const darkThemeClasses = {
  // Containers
  card: 'bg-white dark:bg-gray-800',
  cardBorder: 'border-gray-200 dark:border-gray-700',
  container: 'bg-gray-50 dark:bg-gray-900',
  
  // Text
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-400',
  textMuted: 'text-gray-500 dark:text-gray-500',
  
  // Inputs
  input: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
  
  // Buttons
  btnPrimary: 'bg-primary-600 hover:bg-primary-700 text-white',
  btnSecondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
  
  // Hover states
  hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  activeBg: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
  
  // Borders
  border: 'border-gray-200 dark:border-gray-700',
  borderLight: 'border-gray-100 dark:border-gray-800',
  
  // Shadows
  shadow: 'shadow-sm dark:shadow-gray-900/50',
  shadowLg: 'shadow-lg dark:shadow-gray-900/50',
};

// Mobile responsive breakpoints
export const responsiveClasses = {
  container: 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  gridTwo: 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6',
  heading: 'text-2xl sm:text-3xl lg:text-4xl',
  subheading: 'text-xl sm:text-2xl',
  padding: 'p-4 sm:p-6',
};
