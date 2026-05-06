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

describe('LandingScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation} />);
    
    expect(getByText('dosiq')).toBeTruthy();
    expect(getByText(/Tome seus remédios sob/)).toBeTruthy();
    expect(getByText('Criar Conta')).toBeTruthy();
    expect(getByText('Já tenho uma conta')).toBeTruthy();
  });

  it('navigates to Login when "Já tenho uma conta" is pressed', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Já tenho uma conta'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  it('shows Alert when "Criar Conta" is pressed', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('Criar Conta'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Funcionalidade em breve',
      'O fluxo de cadastro nativo será implementado na próxima Wave.'
    );
  });
});
