CREATE TABLE IF NOT EXISTS socios (
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

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12), 
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pago', 'Pendente')),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(socio_id, ano, mes) 
);

ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados leem socios" ON public.socios;
CREATE POLICY "Usuarios autenticados leem socios"
  ON public.socios FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados criam socios" ON public.socios;
CREATE POLICY "Usuarios autenticados criam socios"
  ON public.socios FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados atualizam socios" ON public.socios;
CREATE POLICY "Usuarios autenticados atualizam socios"
  ON public.socios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados excluem socios" ON public.socios;
CREATE POLICY "Usuarios autenticados excluem socios"
  ON public.socios FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados leem pagamentos" ON public.pagamentos;
CREATE POLICY "Usuarios autenticados leem pagamentos"
  ON public.pagamentos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados criam pagamentos" ON public.pagamentos;
CREATE POLICY "Usuarios autenticados criam pagamentos"
  ON public.pagamentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados atualizam pagamentos" ON public.pagamentos;
CREATE POLICY "Usuarios autenticados atualizam pagamentos"
  ON public.pagamentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados excluem pagamentos" ON public.pagamentos;
CREATE POLICY "Usuarios autenticados excluem pagamentos"
  ON public.pagamentos FOR DELETE
  TO authenticated
  USING (true);
