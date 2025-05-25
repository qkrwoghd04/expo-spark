import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[size]];

    if (variant === 'primary') {
      baseStyle.push({
        backgroundColor: disabled
          ? isDark
            ? '#333'
            : '#ccc'
          : isDark
            ? '#007AFF'
            : '#007AFF',
      });
    } else if (variant === 'secondary') {
      baseStyle.push({
        backgroundColor: disabled
          ? isDark
            ? '#222'
            : '#f0f0f0'
          : isDark
            ? '#333'
            : '#f0f0f0',
      });
    } else if (variant === 'outline') {
      baseStyle.push({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled
          ? isDark
            ? '#333'
            : '#ccc'
          : isDark
            ? '#007AFF'
            : '#007AFF',
      });
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [
      styles.text,
      styles[`${size}Text` as keyof typeof styles],
    ];

    if (variant === 'primary') {
      baseStyle.push({
        color: disabled ? (isDark ? '#666' : '#999') : '#fff',
      });
    } else if (variant === 'secondary') {
      baseStyle.push({
        color: disabled ? (isDark ? '#666' : '#999') : isDark ? '#fff' : '#000',
      });
    } else if (variant === 'outline') {
      baseStyle.push({
        color: disabled
          ? isDark
            ? '#666'
            : '#999'
          : isDark
            ? '#007AFF'
            : '#007AFF',
      });
    }

    return baseStyle;
  };

  return (
    <Pressable
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' ? '#fff' : isDark ? '#007AFF' : '#007AFF'
          }
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
