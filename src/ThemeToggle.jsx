import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

/**
 * Botão para alternar entre modo claro e escuro
 * @param {Object} props
 * @param {string} props.theme - Tema atual ('light' ou 'dark')
 * @param {Function} props.toggleTheme - Função para alternar o tema
 * @param {string} props.className - Classes CSS adicionais
 */
export default function ThemeToggle({ theme, toggleTheme, className = '' }) {
    return (
        <button
            onClick={toggleTheme}
            className={`
                relative p-2 rounded-full
                transition-all duration-300 ease-out
                border border-input hover:bg-accent hover:text-accent-foreground
                focus:outline-none focus:ring-1 focus:ring-ring
                ${className}
            `}
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                <FaSun
                    className={`absolute transition-all duration-300 transform ${theme === 'light' ? 'opacity-100 rotate-0 scale-100 text-yellow-500' : 'opacity-0 -rotate-90 scale-0'
                        }`}
                    size={18}
                />
                <FaMoon
                    className={`absolute transition-all duration-300 transform ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100 text-blue-400' : 'opacity-0 rotate-90 scale-0'
                        }`}
                    size={18}
                />
            </div>
        </button>
    );
}
