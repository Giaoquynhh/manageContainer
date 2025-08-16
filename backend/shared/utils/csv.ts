import { stringify } from 'csv-stringify/sync';

export const toCsv = (rows: any[], columns?: string[]) => {
	return stringify(rows, { header: true, columns });
};
