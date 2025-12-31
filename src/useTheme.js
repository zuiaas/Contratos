import { useState, useEffect } from 'react';

/**
 * Hook customizado para gerenciar o tema claro/escuro
 * @returns {[string, () => void]} - [theme, toggleTheme]
 */
export function useTheme() {
    // Pega o tema salvo ou usa o preferido do sistema
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }

        // Detecta preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove as classes anteriores
        root.classList.remove('light', 'dark');

        // Adiciona a classe do tema atual
        root.classList.add(theme);

        // Salva no localStorage
        localStorage.setItem('theme', theme);

        // Atualiza meta theme-color para combinar com o tema
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                theme === 'dark' ? '#0f172a' : '#f5f8fc'
            );
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return [theme, toggleTheme];
}
