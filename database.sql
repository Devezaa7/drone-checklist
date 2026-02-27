CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('piloto', 'cco')),
  base VARCHAR(20) CHECK (base IN ('IMUNANA', 'GUANDU')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piloto_id UUID REFERENCES usuarios(id) NOT NULL,
  piloto_nome VARCHAR(100) NOT NULL,
  base VARCHAR(20) NOT NULL,
  data_missao DATE NOT NULL,
  local_missao VARCHAR(200) NOT NULL,
  ponto_decolagem VARCHAR(200) NOT NULL,
  horario_decolagem TIME,
  horario_retorno TIME,
  bateria_drone_decolagem INTEGER CHECK (bateria_drone_decolagem BETWEEN 0 AND 100),
  bateria_drone_retorno INTEGER CHECK (bateria_drone_retorno BETWEEN 0 AND 100),
  bateria_drone_utilizada INTEGER,
  bateria_controle_decolagem INTEGER CHECK (bateria_controle_decolagem BETWEEN 0 AND 100),
  bateria_controle_retorno INTEGER CHECK (bateria_controle_retorno BETWEEN 0 AND 100),
  bateria_controle_utilizada INTEGER,
  voo_realizado BOOLEAN DEFAULT true,
  motivo_nao_realizacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checklists_piloto ON checklists(piloto_id);
CREATE INDEX idx_checklists_base ON checklists(base);
CREATE INDEX idx_checklists_data ON checklists(data_missao);