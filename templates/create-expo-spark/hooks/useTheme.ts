import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export function useTheme() {
  const colorScheme = useColorScheme();
  console.log(colorScheme);
  const isDark = colorScheme === 'dark';

  return {
    colorScheme,
    isDark,
    colors: Colors[colorScheme ?? 'light'],
  };
}
