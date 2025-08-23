import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/app.css';
import '../styles/chat-mini.css';
import '../styles/appointment-mini.css';
import '../styles/supplement-mini.css';
import '../styles/gate.css';
import '../styles/auth.css';


export default function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<title>Smartlog Container Manager</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
			</Head>
			<Component {...pageProps} />
		</>
	);
}
