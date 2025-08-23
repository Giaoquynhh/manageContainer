import React, { ReactNode } from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="auth-layout">
            <header className="auth-navbar" role="banner">
                <div className="auth-navbar-inner">
                    <div className="auth-brand" aria-label="Smartlog Container Manager">
                        <Image
                            src="/sml_logo.png"
                            alt=""
                            width={32}
                            height={32}
                            aria-hidden="true"
                        />
                        <span className="auth-brand-name">Smartlog Container Manager</span>
                    </div>
                </div>
            </header>
            <main id="main" className="auth-main" role="main">
                {children}
            </main>
        </div>
    );
}
