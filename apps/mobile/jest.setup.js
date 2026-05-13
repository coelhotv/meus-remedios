import { NativeModules } from 'react-native'

// Fix para window.dispatchEvent e global events em ambiente de teste
const mockDispatchEvent = jest.fn()
if (typeof window !== 'undefined') {
  window.dispatchEvent = window.dispatchEvent || mockDispatchEvent
}
global.window = global.window || {}
global.window.dispatchEvent = global.window.dispatchEvent || mockDispatchEvent
global.dispatchEvent = global.dispatchEvent || mockDispatchEvent

// Mock de módulos nativos do Firebase para evitar erros de "Native module not found"
// Precisamos definir no NativeModules ANTES de qualquer import do Firebase
NativeModules.RNFBAppModule = NativeModules.RNFBAppModule || {
  getAppConfig: jest.fn(() => ({})),
  initializeApp: jest.fn(() => Promise.resolve({})),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}
NativeModules.RNFBAnalyticsModule = NativeModules.RNFBAnalyticsModule || {
  logEvent: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
  setUserProperty: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}
NativeModules.RNFBNativeEventEmitter = NativeModules.RNFBNativeEventEmitter || {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}


jest.mock('expo-secure-store', () => ({

  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    }),
    NavigationContainer: ({ children }) => children,
  }
})

jest.mock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  currentState: 'active',
}))

jest.mock('@react-native-firebase/app', () => ({
  utils: jest.fn(),
}))

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperty: jest.fn(),
  logScreenView: jest.fn(),
}))




