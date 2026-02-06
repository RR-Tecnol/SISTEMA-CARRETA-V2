import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider, closeSnackbar } from 'notistack';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import App from './App';
import { store } from './store';
import theme from './theme';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <Provider store={store}>
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <SnackbarProvider
                    maxSnack={3}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    action={(snackbarKey) => (
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={() => closeSnackbar(snackbarKey)}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    )}
                >
                    <App />
                </SnackbarProvider>
            </ThemeProvider>
        </BrowserRouter>
    </Provider>
);
