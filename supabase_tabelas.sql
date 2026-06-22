CREATE TABLE administradores (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  nome_usuario VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE socios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  filiacao_mae VARCHAR(255) NOT NULL,
  filiacao_pai VARCHAR(255) NOT NULL,
  naturalidade VARCHAR(150) NOT NULL,
  rg VARCHAR(50) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  profissao VARCHAR(150) NOT NULL,
  endereco TEXT NOT NULL,
  telefone VARCHAR(20), 
  data_filiacao DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12), 
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pago', 'Pendente')),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(socio_id, ano, mes) 
);