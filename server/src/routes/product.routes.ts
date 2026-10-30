import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
} from '../schemas/product.schema';

const router = Router();

// All product routes require tenant authentication
router.use(requireAuth);

router.get('/', getProducts);
router.post('/', validateBody(createProductSchema), createProduct);
router.get('/:id', getProductById);
router.put('/:id', validateBody(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', validateBody(adjustStockSchema), adjustStock);

export default router;
