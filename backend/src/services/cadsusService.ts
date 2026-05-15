import fs from 'fs';
import https from 'https';
import axios from 'axios';
import path from 'path';

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface CidadaoDatasus {
  nome_completo: string | null;
  nome_mae: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  cartao_sus: string | null;
  sexo: string | null;
  raca: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
  fonte: 'datasus';
}

// Cache do token em memória
let tokenCache: TokenCache | null = null;

function getUrls() {
  const env = process.env.DATASUS_ENV || 'homologacao';
  if (env === 'producao') {
    return {
      token: 'https://ehr-auth.saude.gov.br/api/osb/token',
      consulta: 'https://servicos.saude.gov.br/cadsus/v2/PDQSupplierJWT',
    };
  }
  return {
    token: 'https://ehr-auth-hmg.saude.gov.br/api/osb/token',
    consulta: 'https://servicoshm.saude.gov.br/cadsus/v2/PDQSupplierJWT',
  };
}

// Cache do agente HTTPS para não recriar o buffer do pfx a cada request
let httpsAgentCache: https.Agent | null = null;

function getHttpsAgent(): https.Agent {
  if (httpsAgentCache) return httpsAgentCache;

  const pfxPath = path.resolve(process.env.DATASUS_PFX_PATH || './certs/certificado.pfx');
  const pfxPassword = process.env.DATASUS_PFX_PASSWORD || '';

  if (!fs.existsSync(pfxPath)) {
    throw new Error(`Certificado .pfx não encontrado em: ${pfxPath}. Configure DATASUS_PFX_PATH no .env`);
  }

  console.log(`🔐 Carregando certificado DATASUS de: ${pfxPath}`);
  const pfx = fs.readFileSync(pfxPath);

  httpsAgentCache = new https.Agent({
    pfx,
    passphrase: pfxPassword,
    rejectUnauthorized: true,
  });

  return httpsAgentCache;
}

async function getToken(): Promise<string> {
  // Verificar cache — token válido por 30 min, renovar com 2 min de antecedência
  if (tokenCache && Date.now() < tokenCache.expiresAt - 120000) {
    return tokenCache.token;
  }

  const urls = getUrls();
  const httpsAgent = getHttpsAgent();

  // DataSUS OIDC token endpoint exige form-urlencoded com grant_type
  console.log(`Solicitando token DataSUS em: ${urls.token} via GET`);
  let response;
  try {
    response = await axios.get(urls.token, {
      httpsAgent,
      timeout: 30000,
    });
  } catch (err: any) {
    console.error(`ERRO AO OBTER TOKEN DATASUS (${urls.token}):`, err.response?.status, err.response?.data || err.message);
    throw err;
  }

  const accessToken = response.data.access_token;
  // expires_in vem em segundos, converter para ms
  const expiresIn = (response.data.expires_in || 1800) * 1000;

  tokenCache = {
    token: accessToken,
    expiresAt: Date.now() + expiresIn,
  };

  return accessToken;
}

function buildSoapEnvelope(tipoBusca: 'cpf' | 'cns', valor: string): string {
  // Root OID para CPF: 2.16.840.1.113883.13.237
  // Root OID para CNS: 2.16.840.1.113883.13.236
  const root = tipoBusca === 'cpf'
    ? '2.16.840.1.113883.13.237'
    : '2.16.840.1.113883.13.236';

  const valorLimpo = valor.replace(/\D/g, '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:urn="urn:hl7-org:v3">
  <soap:Header>
    <wsa:WorkContext xmlns:wsa="http://oracle.com/weblogic/soap/workarea"/>
  </soap:Header>
  <soap:Body>
    <PRPA_IN201305UV02 xmlns="urn:hl7-org:v3" ITSVersion="XML_1.0">
      <id root="2.16.840.1.113883.3.72.6.2" extension="${Date.now()}"/>
      <creationTime value="${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}"/>
      <interactionId root="2.16.840.1.113883.1.6" extension="PRPA_IN201305UV02"/>
      <processingCode code="T"/>
      <processingModeCode code="T"/>
      <acceptAckCode code="AL"/>
      <receiver typeCode="RCV">
        <device classCode="DEV" determinerCode="INSTANCE">
          <id root="2.16.840.1.113883.3.72.6.2"/>
          <name>CADSUS</name>
        </device>
      </receiver>
      <sender typeCode="SND">
        <device classCode="DEV" determinerCode="INSTANCE">
          <id root="2.16.840.1.113883.3.72.6.5.100.85"/>
        </device>
      </sender>
      <controlActProcess classCode="CACT" moodCode="EVN">
        <code code="PRPA_TE201305UV02" codeSystem="2.16.840.1.113883.1.6"/>
        <queryByParameter>
          <queryId root="1.2.840.10006.1000.18.1.999" extension="1840997084"/>
          <statusCode code="new"/>
          <responseModalityCode code="R"/>
          <responsePriorityCode code="I"/>
          <parameterList>
            <livingSubjectId>
              <value root="${root}" extension="${valorLimpo}"/>
              <semanticsText>LivingSubject.id</semanticsText>
            </livingSubjectId>
          </parameterList>
        </queryByParameter>
      </controlActProcess>
    </PRPA_IN201305UV02>
  </soap:Body>
</soap:Envelope>`;
}

function parseSoapResponse(xmlResponse: string): CidadaoDatasus | null {
  console.log("=== XML RAW ===");
  console.log(xmlResponse);
  console.log("===============");

  // Verificar se tem erro explícito no retorno (AE = Application Error, AR = Application Reject)
  if (xmlResponse.includes('<typeCode code="AE"/>') || xmlResponse.includes('<typeCode code="AR"/>')) {
    const errorMatch = xmlResponse.match(/<text>([^<]*)<\/text>/);
    if (errorMatch) {
      console.warn('DATASUS Error:', errorMatch[1]);
    }
    return null;
  }

  // Se não encontrar dados do paciente (patientPerson), falhou.
  if (!xmlResponse.includes('patientPerson')) {
    return null;
  }

  // Parser manual com regex para não precisar de dependências XML pesadas
  const extract = (tag: string): string | null => {
    // Tentar com namespace e sem
    const patterns = [
      new RegExp(`<[^>]*:?${tag}[^>]*>([^<]*)<`, 'i'),
      new RegExp(`<${tag}[^>]*>([^<]*)<`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = xmlResponse.match(pattern);
      if (match && match[1].trim()) return match[1].trim();
    }
    return null;
  };

  const extractAttr = (tag: string, attr: string): string | null => {
    const pattern = new RegExp(`<[^>]*${tag}[^>]*${attr}="([^"]*)"`, 'i');
    const match = xmlResponse.match(pattern);
    return match ? match[1].trim() : null;
  };

  // Extrair nome completo
  // Prioriza o nome dentro de patientPerson/name
  const patientPersonMatch = xmlResponse.match(/<[^:]*:?patientPerson[^>]*>([\s\S]*?)<\/[^:]*:?patientPerson>/i);
  const patientPersonXml = patientPersonMatch ? patientPersonMatch[1] : xmlResponse;

  const extractFromPatient = (tag: string): string | null => {
    const patterns = [
      new RegExp(`<[^>]*:?${tag}[^>]*>([^<]*)<`, 'i'),
      new RegExp(`<${tag}[^>]*>([^<]*)<`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = patientPersonXml.match(pattern);
      if (match && match[1].trim()) return match[1].trim();
    }
    return null;
  };

  const nomeCompleto = extractFromPatient('given')
    ? `${extractFromPatient('given')} ${extractFromPatient('family') || ''}`.trim()
    : extractFromPatient('name') || null;

  // Extrair data nascimento (formato YYYYMMDD → YYYY-MM-DD)
  const dtNasc = extractFromPatient('birthTime') || extractAttr('birthTime', 'value');
  const dataNascimento = dtNasc && dtNasc.length >= 8
    ? `${dtNasc.slice(0, 4)}-${dtNasc.slice(4, 6)}-${dtNasc.slice(6, 8)}`
    : null;

  // Extrair sexo
  const sexoCode = extractAttr('administrativeGenderCode', 'code');
  const sexo = sexoCode === 'M' ? 'M' : sexoCode === 'F' ? 'F' : null;

  // Extrair raça (IBGE codes: 01=Branca, 02=Preta, 03=Amarela, 04=Parda, 05=Indígena)
  const racaCode = extractAttr('raceCode', 'code') || extract('raceCode');
  const racaMap: Record<string, string> = {
    '01': 'branca', '1': 'branca',
    '02': 'preta', '2': 'preta',
    '03': 'amarela', '3': 'amarela',
    '04': 'parda', '4': 'parda',
    '05': 'indigena', '5': 'indigena',
  };
  const raca = racaCode ? (racaMap[racaCode] || null) : null;

  // Extrair telecom (telefone e email)
  const extractTelecoms = (): { telefone: string | null; email: string | null } => {
    let tel: string | null = null;
    let mail: string | null = null;
    // Tentar pegar todas as tags telecom no patientPerson
    const telecomRegex = /<[^:]*:?telecom[^>]*value="([^"]+)"/ig;
    let match;
    while ((match = telecomRegex.exec(patientPersonXml)) !== null) {
      const val = match[1];
      if (val.toLowerCase().startsWith('mailto:')) {
        mail = val.substring(7);
      } else if (val.toLowerCase().startsWith('tel:')) {
        tel = val.substring(4);
      } else if (val.includes('@')) {
        mail = val;
      } else if (/^[+\d\-\s()]+$/.test(val)) {
        let cleanTel = val.replace(/\D/g, '');
        // Remove o código do país (+55) se estiver presente para não confundir o DDD no frontend
        if (cleanTel.startsWith('55') && cleanTel.length >= 12) {
          cleanTel = cleanTel.substring(2);
        }
        tel = cleanTel;
      }
    }
    return { telefone: tel, email: mail };
  };

  const { telefone, email } = extractTelecoms();

  // Extrair nome da mãe (personalRelationship com code PRN)
  // PRN = Parent (neste contexto, mãe/pai, geralmente mãe vem primeiro ou é o principal no SUS)
  const maeMatch = patientPersonXml.match(/<[^>]*:?code[^>]*code="PRN"[^>]*>[\s\S]*?<[^>]*:?given[^>]*>([^<]+)<\//i);
  const nomeMae = maeMatch ? maeMatch[1].trim() : null;

    const rawBairro = extract('city');
    const rawMunicipio = extract('county') || extract('city');
    let rawComplemento = extract('additionalLocator');

    // Função para limpar strings (remover acentos, lowercase, e pontuações) para comparação agressiva
    const normalizeStr = (str: string | null) => 
        str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() : '';

    const bairroLimpo = rawBairro && !/^\d+$/.test(rawBairro.trim()) ? rawBairro : null;
    const municipioLimpo = rawMunicipio && !/^\d+$/.test(rawMunicipio.trim()) ? rawMunicipio : null;

    // Se o complemento contiver o nome do bairro ou do município (ou vice-versa), anula para evitar sujeira
    if (rawComplemento) {
        const compNorm = normalizeStr(rawComplemento);
        const bairroNorm = normalizeStr(bairroLimpo);
        const munNorm = normalizeStr(municipioLimpo);
        
        if (
            (bairroNorm && (compNorm.includes(bairroNorm) || bairroNorm.includes(compNorm))) ||
            (munNorm && (compNorm.includes(munNorm) || munNorm.includes(compNorm)))
        ) {
            rawComplemento = null;
        }
    }

    return {
    nome_completo: nomeCompleto,
    nome_mae: nomeMae,
    data_nascimento: dataNascimento,
    cpf: null,
    cartao_sus: null,
    sexo,
    raca,
    cep: extract('postalCode'),
    logradouro: extract('streetAddressLine') || extract('streetName'),
    numero: extract('houseNumber'),
    complemento: rawComplemento,
    bairro: bairroLimpo,
    municipio: municipioLimpo,
    estado: extract('state'),
    telefone,
    email,
    fonte: 'datasus',
  };
}

export async function consultarCidadaoNoCadsus(
  tipoBusca: 'cpf' | 'cns',
  valor: string
): Promise<CidadaoDatasus | null> {
  const httpsAgent = getHttpsAgent();
  const token = await getToken();
  const urls = getUrls();
  const soapBody = buildSoapEnvelope(tipoBusca, valor);

  console.log(`🔍 CADSUS: consultando ${tipoBusca} no ambiente ${process.env.DATASUS_ENV || 'homologacao'} (${urls.consulta})`);

  let response;
  try {
    response = await axios.post(urls.consulta, soapBody, {
      httpsAgent,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'Authorization': `Bearer ${token}`,
      },
      timeout: 30000,
    });
  } catch (err: any) {
    console.error(`ERRO NA CONSULTA SOAP DATASUS (${urls.consulta}):`, err.response?.status, err.response?.data || err.message);
    throw err;
  }

  return parseSoapResponse(response.data);
}
