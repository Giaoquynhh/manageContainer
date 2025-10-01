/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: { unoptimized: true },
	onDemandEntries: {
		maxInactiveAge: 25 * 1000,
		pagesBufferLength: 2,
	},
	// Tắt error overlay trong development
	devIndicators: {
		position: 'bottom-right',
	},
	rewrites: async () => [
		{
			source: '/backend/:path*',
			destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/:path*` : 'http://localhost:1000/:path*'
		}
	]
};

module.exports = nextConfig;
