import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
	return {
		redirect: {
			destination: '/Login',
			permanent: false
		}
	};
};

export default function RootRedirect(){
	return null;
}
