import { Model, DataTypes, UUIDV4, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ConfiguracaoFilaAcaoAttributes {
    id: string;
    acao_id: string;
    usar_ficha_digital: boolean;
    permitir_impressao: boolean;
    usar_painel_tv: boolean;
    notif_email: boolean;
    notif_sms: boolean;
    notif_whatsapp: boolean;
    notif_ao_gerar_ficha: boolean;
    notif_chegando: boolean;
    notif_quantidade_aviso: number;
    notif_chamado: boolean;
    notif_retorno_estacao: boolean;
    sms_provider: string;
    whatsapp_provider: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ConfiguracaoFilaAcaoCreationAttributes extends Optional<
    ConfiguracaoFilaAcaoAttributes,
    'id' | 'usar_ficha_digital' | 'permitir_impressao' | 'usar_painel_tv' |
    'notif_email' | 'notif_sms' | 'notif_whatsapp' | 'notif_ao_gerar_ficha' |
    'notif_chegando' | 'notif_quantidade_aviso' | 'notif_chamado' |
    'notif_retorno_estacao' | 'sms_provider' | 'whatsapp_provider'
> {}

export class ConfiguracaoFilaAcao extends Model<ConfiguracaoFilaAcaoAttributes, ConfiguracaoFilaAcaoCreationAttributes>
    implements ConfiguracaoFilaAcaoAttributes {
    public id!: string;
    public acao_id!: string;
    public usar_ficha_digital!: boolean;
    public permitir_impressao!: boolean;
    public usar_painel_tv!: boolean;
    public notif_email!: boolean;
    public notif_sms!: boolean;
    public notif_whatsapp!: boolean;
    public notif_ao_gerar_ficha!: boolean;
    public notif_chegando!: boolean;
    public notif_quantidade_aviso!: number;
    public notif_chamado!: boolean;
    public notif_retorno_estacao!: boolean;
    public sms_provider!: string;
    public whatsapp_provider!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ConfiguracaoFilaAcao.init(
    {
        id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
        acao_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'acoes', key: 'id' } },
        usar_ficha_digital: { type: DataTypes.BOOLEAN, defaultValue: true },
        permitir_impressao: { type: DataTypes.BOOLEAN, defaultValue: true },
        usar_painel_tv: { type: DataTypes.BOOLEAN, defaultValue: true },
        notif_email: { type: DataTypes.BOOLEAN, defaultValue: true },
        notif_sms: { type: DataTypes.BOOLEAN, defaultValue: false },
        notif_whatsapp: { type: DataTypes.BOOLEAN, defaultValue: false },
        notif_ao_gerar_ficha: { type: DataTypes.BOOLEAN, defaultValue: true },
        notif_chegando: { type: DataTypes.BOOLEAN, defaultValue: true },
        notif_quantidade_aviso: { type: DataTypes.INTEGER, defaultValue: 5 },
        notif_chamado: { type: DataTypes.BOOLEAN, defaultValue: true },
        notif_retorno_estacao: { type: DataTypes.BOOLEAN, defaultValue: true },
        sms_provider: { type: DataTypes.STRING(20), defaultValue: 'brevo' },
        whatsapp_provider: { type: DataTypes.STRING(20), defaultValue: 'zapi' },
    },
    {
        sequelize,
        tableName: 'configuracoes_fila_acao',
        timestamps: true,
        underscored: true,
    }
);

export default ConfiguracaoFilaAcao;
