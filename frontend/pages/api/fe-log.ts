import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse){
	if (req.method !== 'POST') return res.status(405).end();
	try{
		const dir = path.join(process.cwd(), 'frontend', 'logs');
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		const file = path.join(dir, 'frontend.log');
		fs.appendFileSync(file, JSON.stringify(req.body) + "\n", 'utf8');
		return res.status(200).json({ ok: true });
	}catch(e:any){
		return res.status(500).json({ ok:false, message: e.message });
	}
}
