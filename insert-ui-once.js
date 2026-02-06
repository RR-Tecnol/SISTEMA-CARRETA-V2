const fs = require('fs');

// Read file
const content = fs.readFileSync('frontend/src/pages/admin/GerenciarAcao.tsx', 'utf8');

// UI code
const ui = `
                        {/* Seção de Funcionários */}
                        <Box sx={{ mt: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Funcionários Atribuídos</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => {
                                        loadFuncionariosDisponiveis();
                                        setOpenFuncionarioDialog(true);
                                    }}
                                >
                                    Adicionar Funcionário
                                </Button>
                            </Box>

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nome</TableCell>
                                            <TableCell>Cargo</TableCell>
                                            <TableCell>Especialidade</TableCell>
                                            <TableCell>Custo por Ação</TableCell>
                                            <TableCell align="center">Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {funcionariosAcao.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    Nenhum funcionário atribuído a esta ação
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            funcionariosAcao.map((af: any) => (
                                                <TableRow key={af.id}>
                                                    <TableCell>{af.funcionario?.nome || 'N/A'}</TableCell>
                                                    <TableCell>{af.funcionario?.cargo || 'N/A'}</TableCell>
                                                    <TableCell>{af.funcionario?.especialidade || '-'}</TableCell>
                                                    <TableCell>R$ {Number(af.funcionario?.custo_diario || 0).toFixed(2)}</TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleRemoveFuncionario(af.funcionario_id)}
                                                            title="Remover funcionário"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Dialog para Adicionar Funcionário */}
                        <Dialog 
                            open={openFuncionarioDialog} 
                            onClose={() => {
                                setOpenFuncionarioDialog(false);
                                setSelectedFuncionario('');
                            }}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle>Adicionar Funcionário à Ação</DialogTitle>
                            <DialogContent>
                                <TextField
                                    select
                                    fullWidth
                                    label="Selecione o Funcionário"
                                    margin="normal"
                                    value={selectedFuncionario}
                                    onChange={(e) => setSelectedFuncionario(e.target.value)}
                                >
                                    {funcionariosDisponiveis
                                        .filter((f: any) => !funcionariosAcao.some((af: any) => af.funcionario_id === f.id))
                                        .map((f: any) => (
                                            <MenuItem key={f.id} value={f.id}>
                                                {f.nome} - {f.cargo} (R$ {Number(f.custo_diario || 0).toFixed(2)})
                                            </MenuItem>
                                        ))
                                    }
                                </TextField>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => {
                                    setOpenFuncionarioDialog(false);
                                    setSelectedFuncionario('');
                                }}>
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleAddFuncionario} 
                                    variant="contained"
                                    disabled={!selectedFuncionario}
                                >
                                    Adicionar
                                </Button>
                            </DialogActions>
                        </Dialog>
`;

// Find FIRST </Container> and insert before it
const idx = content.indexOf('</Container>');
const newContent = content.slice(0, idx) + ui + '\n            ' + content.slice(idx);

// Write UTF-8 without BOM
fs.writeFileSync('frontend/src/pages/admin/GerenciarAcao.tsx', newContent, 'utf8');

console.log('✅ UI inserida UMA VEZ com UTF-8');
console.log('Linhas:', newContent.split('\n').length);
