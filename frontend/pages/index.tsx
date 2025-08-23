import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@services/api';
import { homeFor } from '@utils/rbac';

export default function RootRedirect(){
    const router = useRouter();
    useEffect(()=>{
        if (typeof window === 'undefined') return;
        const token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null)
            || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
        if (!token) { router.replace('/Login'); return; }
        (async ()=>{
            try{
                const { data } = await api.get('/auth/me');
                const role = data?.role || data?.roles?.[0];
                router.replace(homeFor(role as any));
            }catch{
                router.replace('/Login');
            }
        })();
    },[]);
    return null;
}
