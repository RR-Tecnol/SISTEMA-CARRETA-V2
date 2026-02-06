import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../config/database';

export interface NoticiaAttributes {
    id: string;
    titulo: string;
    conteudo: string;
    imagem_url?: string;
    acao_id?: string;
    destaque: boolean;
    data_publicacao: Date;
    campos_customizados?: Record<string, any>;
    ativo: boolean;
}

export class Noticia extends Model<NoticiaAttributes> implements NoticiaAttributes {
    public id!: string;
    public titulo!: string;
    public conteudo!: string;
    public imagem_url?: string;
    public acao_id?: string;
    public destaque!: boolean;
    public data_publicacao!: Date;
    public campos_customizados?: Record<string, any>;
    public ativo!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Noticia.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true,
        },
        titulo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        conteudo: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imagem_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        acao_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'acoes',
                key: 'id',
            },
        },
        destaque: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        data_publicacao: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        campos_customizados: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'noticias',
        timestamps: true,
        underscored: true,
    }
);
