/**
 * API Services Barrel Export
 * 
 * This file re-exports all services from their individual modules.
 * This allows existing imports to work without changes:
 * 
 * Before: import { medicineService, protocolService } from '../services/api'
 * After:  import { medicineService, protocolService } from '../services/api' (unchanged)
 */

export { medicineService } from './medicineService'
export { protocolService } from './protocolService'
export { treatmentPlanService } from './treatmentPlanService'
export { stockService } from './stockService'
export { logService } from './logService'
export { migrationService } from './migrationService'
