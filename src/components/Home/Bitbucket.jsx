import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabse';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  WorkspacesOutlined,
  FolderOutlined,
  ErrorOutline,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0052CC', // Bitbucket blue
    },
    secondary: {
      main: '#172B4D', // Bitbucket navy
    },
  },
});

const Bitbucket = ({ username, accessToken, provider }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggledRepos, setToggledRepos] = useState({});
  const token = JSON.parse(localStorage.getItem('sb-xeenlebcqjfumsblubuy-auth-token'));

  useEffect(() => {
    console.log(accessToken);
    
    const fetchWorkspaces = async () => {
      if (token) {
        try {
          const response = await fetch('https://api.bitbucket.org/2.0/workspaces', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.provider_token}`,
            },
          });
          const data = await response.json();
          setWorkspaces(data.values);
        } catch (err) {
          setError('Error fetching workspaces');
        } finally {
          setLoading(false);
        }
      } else {
        setError('Access token is missing');
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [accessToken]);

  useEffect(() => {
    const fetchRepositories = async () => {
      if (selectedWorkspace) {
        setLoading(true);
        try {
          const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${selectedWorkspace}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.provider_token}`,
            },
          });
          const data = await response.json();
          setRepositories(data.values);
          
          // Check which repositories are already toggled on by fetching from Supabase
          const toggledState = {};
          for (let repo of data.values) {
            const isReviewed = await checkRepoInReviews(repo.slug);
            toggledState[repo.slug] = isReviewed;
          }
          setToggledRepos(toggledState);

        } catch (err) {
          setError('Error fetching repositories');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRepositories();
  }, [selectedWorkspace, accessToken]);

  const checkRepoInReviews = async (repoId) => {
    try {
      const { data, error } = await supabase
        .from('Review')
        .select('*')
        .eq('repo_id', repoId)
        .eq('user_id', token.user.id);

      if (error) {
        console.error('Error fetching reviews:', error);
        return false;
      } else {
        return data.length > 0;
      }
    } catch (error) {
      console.error('Error checking repo in Reviews:', error);
      return false;
    }
  };

  const handleToggle = async (repoId) => {
    const isRepoReviewed = await checkRepoInReviews(repoId);

    if (!isRepoReviewed) {
      // Add to Supabase if not present
      const { error } = await supabase
        .from('Review')
        .insert([{ user_id: token.user.id, repo_id: repoId }]);

      if (error) {
        console.error('Error inserting review:', error);
      } else {
        setToggledRepos((prevState) => ({
          ...prevState,
          [repoId]: true,
        }));
      }
    } else {
      // Remove from Supabase if already present
      const { error } = await supabase
        .from('Review')
        .delete()
        .eq('repo_id', repoId)
        .eq('user_id', token.user.id);

      if (error) {
        console.error('Error deleting review:', error);
      } else {
        setToggledRepos((prevState) => ({
          ...prevState,
          [repoId]: false,
        }));
      }
    }
  };

  const handleWorkspaceSelect = (workspaceSlug) => {
    setSelectedWorkspace(workspaceSlug);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error" icon={<ErrorOutline />}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box m={2}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              <WorkspacesOutlined /> Bitbucket Workspaces
            </Typography>
            <List>
              {workspaces.map((workspace) => (
                <ListItem
                  key={workspace.slug}
                  button
                  onClick={() => handleWorkspaceSelect(workspace.slug)}
                  selected={selectedWorkspace === workspace.slug}
                >
                  <ListItemIcon>
                    <FolderOutlined />
                  </ListItemIcon>
                  <ListItemText primary={workspace.name} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {selectedWorkspace && (
          <Card style={{ marginTop: '20px' }}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                <FolderOutlined /> Repositories in {selectedWorkspace}
              </Typography>
              <List>
                {repositories.length > 0 ? (
                  repositories.map((repo) => (
                    <React.Fragment key={repo.slug}>
                      <ListItem>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={toggledRepos[repo.slug] || false}
                            onChange={() => handleToggle(repo.slug)}
                          />
                        </ListItemIcon>
                        <ListItemText primary={repo.name} />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No repositories found in this workspace." />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Bitbucket;
