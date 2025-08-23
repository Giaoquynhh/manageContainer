/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: { unoptimized: true },
	redirects: async () => ([
		{
			source: '/Dashboard',
			destination: '/',
			permanent: false
		}
	]),
	rewrites: async () => ([
		{
			source: '/backend/:path*',
			destination: 'http://localhost:1000/:path*'
		}
	])
};

module.exports = nextConfig;
