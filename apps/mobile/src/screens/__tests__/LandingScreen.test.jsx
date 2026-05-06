import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LandingScreen from '../LandingScreen';
import { ROUTES } from '../../navigation/routes';
import { Alert } from 'react-native';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, edges }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const Svg = ({ children }) => <React.Fragment>{children}</React.Fragment>;
  const Circle = () => <React.Fragment />;
  return {
    __esModule: true,
    default: Svg,
    Circle: Circle,
    Svg: Svg
  };
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: () => <React.Fragment />,
  };
});

describe('LandingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation} />);
    
    expect(getByText('dosiq')).toBeTruthy();
    expect(getByText(/Sua saúde sob/)).toBeTruthy();
    expect(getByText('Criar Conta')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
  });

  it('navigates to Login when "Entrar" is pressed', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Entrar'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  it('shows Alert when "Criar Conta" is pressed', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Criar Conta'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Em breve',
      'Cadastro pelo app ainda não está disponível.'
    );
  });
});
