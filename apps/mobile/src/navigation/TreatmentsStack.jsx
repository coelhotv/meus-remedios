// TreatmentsStack.jsx — stack aninhado dentro da tab Tratamentos
// Fase 1: inclui MedicinesList + MedicineDetail (CRUD Medicamentos — Sprint M1.1)

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ROUTES } from './routes'
import TreatmentsScreen from '../features/treatments/screens/TreatmentsScreen'
import MedicinesListScreen from '../features/medications/screens/MedicinesListScreen'
import MedicineDetailScreen from '../features/medications/screens/MedicineDetailScreen'

const Stack = createNativeStackNavigator()

export default function TreatmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.TREATMENTS_LIST} component={TreatmentsScreen} />
      <Stack.Screen name={ROUTES.MEDICINES_LIST} component={MedicinesListScreen} />
      <Stack.Screen name={ROUTES.MEDICINE_DETAIL} component={MedicineDetailScreen} />
    </Stack.Navigator>
  )
}
