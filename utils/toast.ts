import Toast from 'react-native-toast-message';

export const toast = {
  success: (message: string) =>
    Toast.show({
      type: 'success',
      text1: message,
      position: 'top',
      visibilityTime: 2500,
    }),
  error: (message: string) =>
    Toast.show({
      type: 'error',
      text1: message,
      position: 'top',
      visibilityTime: 3500,
    }),
};
