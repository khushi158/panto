import React from 'react';
import { supabase } from '../../supabase/supabse';
import { Button, Typography, Box, Container } from '@mui/material';
import { GitHub, Code } from '@mui/icons-material';

const Login = () => {
  const handleLogin = async (provider) => {
    try {
      let options = {
        redirectTo: `${window.location.origin}/auth-callback`
      };

      // Add specific scopes based on provider
      if (provider === 'github') {
        options.scopes = 'repo user';
      } else if (provider === 'gitlab') {
        options.scopes = 'read_user api read_repository';
      } else if (provider === 'bitbucket') {
        options.scopes = 'repository account team pullrequest';
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options
      });

      if (error) {
        console.error(`${provider} login error:`, error.message);
        alert('Login failed. Please try again.');
      } else {
        console.log(`Redirecting to ${provider}:`, data.url);
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Login
        </Typography>
        <Typography variant="body1" gutterBottom>
          Select a provider to log in:
        </Typography>
        <Box sx={{ mt: 2, width: '100%' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<GitHub />}
            onClick={() => handleLogin('github')}
            sx={{ mb: 2, bgcolor: '#24292e', '&:hover': { bgcolor: '#1c2024' } }}
          >
            Login with GitHub
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Code />}
            onClick={() => handleLogin('gitlab')}
            sx={{ mb: 2, bgcolor: '#FC6D26', '&:hover': { bgcolor: '#e0591f' } }}
          >
            Login with GitLab
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Code />}
            onClick={() => handleLogin('bitbucket')}
            sx={{ mb: 2, bgcolor: '#0052CC', '&:hover': { bgcolor: '#0043a4' } }}
          >
            Login with Bitbucket
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
