/**
 * Interview Kit Routes
 * Endpoints for generating, viewing, editing, regenerating sections, and deleting kits.
 * Author: Aakarsh Sharma
 */

import { Router } from 'express';
import {
  createKit,
  listKits,
  getKitById,
  updateKit,
  regenerateSection,
  deleteKit,
  batchUploadKits,
} from '../controllers/kitController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// All kit operations are protected and require valid authentication session
router.use(requireAuth);

// ── Kit CRUD & Generation Routes ───────────────────────────────────────────
// Generate and create a new preparation kit
router.post('/generate', createKit);

// Upload and generate multiple roles from file
router.post('/batch-upload', batchUploadKits);

// List all preparation kits for authenticated user
router.get('/', listKits);

// Fetch specific preparation kit by ID
router.get('/:id', getKitById);

// Update kit questions, outline, brief, or schedule
router.put('/:id', updateKit);

// Regenerate single section preserving user edits
router.post('/:id/regenerate-section', regenerateSection);

// Delete preparation kit
router.delete('/:id', deleteKit);

export default router;
