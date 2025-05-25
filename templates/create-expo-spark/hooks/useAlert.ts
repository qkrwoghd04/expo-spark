import { Alert } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: (() => void) | undefined;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

export function useAlert() {
  const showAlert = (options: AlertOptions) => {
    const { title, message, buttons } = options;
    Alert.alert(title, message, buttons);
  };

  const showSuccessAlert = (message: string, onPress?: () => void) => {
    showAlert({
      title: '성공',
      message,
      buttons: [{ text: '확인', onPress }],
    });
  };

  const showErrorAlert = (message: string, onPress?: () => void) => {
    showAlert({
      title: '오류',
      message,
      buttons: [{ text: '확인', onPress }],
    });
  };

  return {
    showSuccessAlert,
    showErrorAlert,
  };
} 