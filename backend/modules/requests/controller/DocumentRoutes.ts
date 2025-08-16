import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve uploaded files (public access)
router.get('/:filename', (req, res) => {
	const filename = req.params.filename;
	const filePath = path.join(process.cwd(), 'uploads', filename);
	
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({ message: 'File không tồn tại' });
	}
	
	res.sendFile(filePath);
});

export default router;


