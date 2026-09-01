# BARBERPRO - Sistema de Agendamento

## Instalação
1. Extraia o ZIP
2. Abra a pasta no VS Code
3. Abra o terminal
4. Execute: npm install
5. Execute: npm run dev

## Modo demonstração
Sem arquivo .env o sistema funciona em modo demonstração no navegador.

## Conectar ao Supabase
1. Crie um projeto no Supabase
2. Execute o conteúdo de supabase.sql no SQL Editor
3. Copie .env.example e renomeie para .env
4. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
5. Reinicie npm run dev

O banco possui uma restrição UNIQUE para impedir dois clientes de reservarem o mesmo horário do mesmo barbeiro no mesmo dia.
