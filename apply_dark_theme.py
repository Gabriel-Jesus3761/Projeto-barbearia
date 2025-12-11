#!/usr/bin/env python3
"""
Script para aplicar o tema escuro nas páginas restantes do owner.
"""

import re

# Mapeamento de substituições
REPLACEMENTS = [
    # Container principal
    (r'className="min-h-screen bg-gray-50"', 'className="min-h-screen bg-black text-white"'),

    # Cards básicos
    (r'<Card className="hover:shadow-lg', '<Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:shadow-lg'),
    (r'<Card>', '<Card className="bg-white/5 backdrop-blur-sm border-white/10">'),
    (r'<Card className="', '<Card className="bg-white/5 backdrop-blur-sm border-white/10 '),

    # Bordas
    (r'border-gray-100', 'border-white/10'),
    (r'border-gray-200', 'border-white/10'),
    (r'divide-gray-100', 'divide-white/10'),
    (r'divide-gray-200', 'divide-white/10'),

    # Backgrounds
    (r'bg-gray-50', 'bg-white/5'),
    (r'bg-gray-100', 'bg-white/5'),
    (r'bg-white', 'bg-white/5'),
    (r'bg-gray-200', 'bg-white/10'),

    # Textos
    (r'text-gray-900', 'text-white'),
    (r'text-gray-700', 'text-gray-400'),
    (r'text-gray-600', 'text-gray-400'),

    # Hover states
    (r'hover:bg-gray-50', 'hover:bg-white/5 transition-colors'),
    (r'hover:bg-gray-100', 'hover:bg-white/10 transition-colors'),

    # Table headers
    (r'className="bg-gray-50"', 'className="bg-white/5"'),
    (r'text-gray-500 uppercase', 'text-gray-400 uppercase'),
]

def apply_dark_theme(filepath):
    """Aplica o tema escuro em um arquivo."""
    print(f"Processando {filepath}...")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Aplica todas as substituições
        for old, new in REPLACEMENTS:
            content = re.sub(old, new, content)

        # Se houve mudanças, salva o arquivo
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ {filepath} atualizado com sucesso!")
            return True
        else:
            print(f"  - {filepath} já está atualizado")
            return False

    except Exception as e:
        print(f"  ✗ Erro ao processar {filepath}: {e}")
        return False

if __name__ == '__main__':
    files_to_process = [
        r'c:\Projeto barbearia\src\pages\DashboardVendas.tsx',
        r'c:\Projeto barbearia\src\pages\DashboardProfissionais.tsx',
        r'c:\Projeto barbearia\src\pages\DashboardServicos.tsx',
        r'c:\Projeto barbearia\src\pages\DashboardClientes.tsx',
        r'c:\Projeto barbearia\src\pages\DashboardAgendamentos.tsx',
        r'c:\Projeto barbearia\src\pages\Agendamentos.tsx',
        r'c:\Projeto barbearia\src\pages\Servicos.tsx',
        r'c:\Projeto barbearia\src\pages\Profissionais.tsx',
    ]

    print("Aplicando tema escuro nas páginas...\n")

    updated = 0
    for filepath in files_to_process:
        if apply_dark_theme(filepath):
            updated += 1

    print(f"\n✓ Concluído! {updated} arquivo(s) atualizado(s).")
