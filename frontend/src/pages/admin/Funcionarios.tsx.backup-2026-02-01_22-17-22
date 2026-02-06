import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import api from '../../services/api';

const Funcionarios: React.FC = () => {
    const [funcionarios, setFuncionarios] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        nome: '', cargo: '', especialidade: '', custo_diario: 0, status: 'ativo'
    });

    const fetchFuncionarios = async () => {
        const response = await api.get('/funcionarios');
        setFuncionarios(response.data);
    };

    useEffect(() => { fetchFuncionarios(); }, []);

    const handleSubmit = async () => {
        await api.post('/funcionarios', formData);
        setOpen(false);
        fetchFuncionarios();
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Gerenciar Funcionários</Typography>
            <Button variant="contained" color="primary" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
                Novo Funcionário
            </Button>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Cargo</TableCell>
                            <TableCell>Especialidade</TableCell>
                            <TableCell>Custo por Ação</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {funcionarios.map((f: any) => (
                            <TableRow key={f.id}>
                                <TableCell>{f.nome}</TableCell>
                                <TableCell>{f.cargo}</TableCell>
                                <TableCell>{f.especialidade}</TableCell>
                                <TableCell>R$ {f.custo_diario}</TableCell>
                                <TableCell>{f.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Novo Funcionário</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Nome" margin="normal" onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                    <TextField fullWidth label="Cargo" margin="normal" onChange={e => setFormData({ ...formData, cargo: e.target.value })} />
                    <TextField fullWidth label="Especialidade" margin="normal" onChange={e => setFormData({ ...formData, especialidade: e.target.value })} />
                    <TextField fullWidth label="Custo por Ação" type="number" margin="normal" onChange={e => setFormData({ ...formData, custo_diario: parseFloat(e.target.value) })} />
                    <TextField fullWidth select label="Status" margin="normal" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <MenuItem value="ativo">Ativo</MenuItem>
                        <MenuItem value="inativo">Inativo</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} color="primary">Salvar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Funcionarios;
